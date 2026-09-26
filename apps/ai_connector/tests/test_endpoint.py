"""End-to-end tests of OAuth discovery, registration, consent, tokens and the MCP endpoint."""

import base64
import hashlib
import json
import secrets
from urllib.parse import parse_qs, urlencode, urlparse

from django.contrib.auth.models import Group
from django.core.cache import cache
from django.test import TestCase, override_settings
from oauth2_provider.models import get_access_token_model

from ..models import CourseChange
from .helpers import make_course, make_oauth_token, make_user

MCP_HEADERS = {"HTTP_ACCEPT": "application/json, text/event-stream"}
# Rate limits are cached; keep them per test process instead of the shared file cache.
connector_on = override_settings(
    AI_CONNECTOR_ENABLED=True,
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache", "LOCATION": "ai-connector-tests"}},
)


def rpc_payload(method, params=None, request_id=1):
    return json.dumps({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params or {}})


class MCPClientMixin:
    def mcp(self, token, method, params=None):
        headers = dict(MCP_HEADERS)
        if token:
            headers["HTTP_AUTHORIZATION"] = f"Bearer {token}"
        return self.client.post("/mcp", data=rpc_payload(method, params), content_type="application/json", **headers)

    def call_tool(self, token, name, arguments=None):
        response = self.mcp(token, "tools/call", {"name": name, "arguments": arguments or {}})
        self.assertEqual(response.status_code, 200, response.content)
        return response.json()["result"]


class FeatureFlagTests(TestCase):
    @override_settings(AI_CONNECTOR_ENABLED=False)
    def test_everything_is_hidden_when_disabled(self):
        for method, url in [
            ("post", "/mcp"),
            ("get", "/.well-known/oauth-authorization-server"),
            ("get", "/.well-known/oauth-protected-resource/mcp"),
            ("post", "/o/register/"),
            ("get", "/o/authorize/"),
            ("post", "/o/token/"),
            ("get", "/account/connected-apps/"),
        ]:
            with self.subTest(url=url):
                self.assertEqual(getattr(self.client, method)(url).status_code, 404)


@connector_on
class DiscoveryAndRegistrationTests(TestCase):
    def setUp(self):
        cache.clear()

    def register(self, **metadata):
        body = {"client_name": "Claude", "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"],
                "token_endpoint_auth_method": "none", **metadata}
        return self.client.post("/o/register/", data=json.dumps(body), content_type="application/json")

    def test_unauthenticated_mcp_request_points_to_resource_metadata(self):
        response = self.client.post("/mcp", data=rpc_payload("tools/list"), content_type="application/json", **MCP_HEADERS)
        self.assertEqual(response.status_code, 401)
        self.assertIn(
            'resource_metadata="http://testserver/.well-known/oauth-protected-resource/mcp"',
            response["WWW-Authenticate"],
        )

    def test_metadata_documents_describe_resource_and_server(self):
        resource = self.client.get("/.well-known/oauth-protected-resource/mcp").json()
        self.assertEqual(resource["resource"], "http://testserver/mcp")
        self.assertEqual(resource["authorization_servers"], ["http://testserver"])
        self.assertEqual(resource["scopes_supported"], ["courses:read", "courses:write"])

        server = self.client.get("/.well-known/oauth-authorization-server").json()
        self.assertEqual(server["issuer"], "http://testserver")
        self.assertEqual(server["authorization_endpoint"], "http://testserver/o/authorize/")
        self.assertEqual(server["registration_endpoint"], "http://testserver/o/register/")
        self.assertEqual(server["code_challenge_methods_supported"], ["S256"])
        self.assertEqual(server["response_types_supported"], ["code"])
        self.assertNotIn("introspection_endpoint", server)

    def test_registration_accepts_approved_clients_and_loopback(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(
            self.register(redirect_uris=["http://127.0.0.1:33418/callback"]).status_code, 201
        )
        self.assertEqual(self.register(redirect_uris=["https://chatgpt.com/connector_platform_oauth_redirect"]).status_code, 201)

    def test_registration_rejects_unsafe_clients(self):
        for metadata, error in [
            ({"redirect_uris": ["https://evil.example/callback"]}, "invalid_redirect_uri"),
            ({"redirect_uris": ["http://claude.ai/callback"]}, "invalid_redirect_uri"),
            ({"redirect_uris": ["https://claude.ai.evil.example/cb"]}, "invalid_redirect_uri"),
            ({"redirect_uris": []}, "invalid_redirect_uri"),
            ({"grant_types": ["implicit"]}, "invalid_client_metadata"),
            ({"grant_types": ["client_credentials"]}, "invalid_client_metadata"),
        ]:
            with self.subTest(metadata=metadata):
                response = self.register(**metadata)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["error"], error)

    def test_registered_clients_cannot_change_their_redirects(self):
        created = self.register().json()
        response = self.client.put(
            f"/o/register/{created['client_id']}/",
            data=json.dumps({"redirect_uris": ["https://evil.example/cb"]}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {created['registration_access_token']}",
        )
        self.assertEqual(response.status_code, 405)

    @override_settings(AI_CONNECTOR_REGISTRATION_RATE="2/hour")
    def test_registration_is_rate_limited(self):
        statuses = [self.register().status_code for _ in range(3)]
        self.assertEqual(statuses, [201, 201, 429])


def pkce_pair():
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    return verifier, challenge


@connector_on
class AuthorizationFlowTests(MCPClientMixin, TestCase):
    redirect_uri = "http://127.0.0.1:33418/callback"

    def setUp(self):
        cache.clear()
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)
        registration = self.client.post(
            "/o/register/",
            data=json.dumps({"client_name": "Codex", "redirect_uris": [self.redirect_uri], "token_endpoint_auth_method": "none"}),
            content_type="application/json",
        ).json()
        self.client_id = registration["client_id"]

    def authorize_url(self, challenge, method="S256"):
        return "/o/authorize/?" + urlencode(
            {
                "response_type": "code",
                "client_id": self.client_id,
                "redirect_uri": self.redirect_uri,
                "code_challenge": challenge,
                "code_challenge_method": method,
                "state": "state-123",
                "scope": "courses:read courses:write",
                "resource": "http://testserver/mcp",
            }
        )

    def connect(self, allow_write=True):
        verifier, challenge = pkce_pair()
        self.client.force_login(self.instructor)
        consent = self.client.get(self.authorize_url(challenge))
        self.assertEqual(consent.status_code, 200)
        self.assertContains(consent, "Connect Codex to your courses?")
        self.assertContains(consent, "127.0.0.1")
        form = consent.context["form"]
        data = {name: value for name, value in form.initial.items() if value is not None}
        data["allow"] = "true"
        if allow_write:
            data["allow_write"] = "1"
        redirect = self.client.post("/o/authorize/", data)
        self.assertEqual(redirect.status_code, 302)
        query = parse_qs(urlparse(redirect["Location"]).query)
        self.assertEqual(query["state"], ["state-123"])
        self.client.logout()
        token_response = self.client.post(
            "/o/token/",
            {
                "grant_type": "authorization_code",
                "code": query["code"][0],
                "redirect_uri": self.redirect_uri,
                "client_id": self.client_id,
                "code_verifier": verifier,
                "resource": "http://testserver/mcp",
            },
        )
        self.assertEqual(token_response.status_code, 200, token_response.content)
        return token_response.json()

    def test_full_connection_lists_tools_and_reads_a_course(self):
        tokens = self.connect()
        self.assertEqual(set(tokens["scope"].split()), {"courses:read", "courses:write"})

        listed = self.mcp(tokens["access_token"], "tools/list")
        self.assertEqual(listed.status_code, 200)
        tools = {tool["name"]: tool for tool in listed.json()["result"]["tools"]}
        self.assertEqual(len(tools), 8)
        self.assertTrue(tools["get_course"]["annotations"]["readOnlyHint"])
        self.assertFalse(tools["apply_course_change"]["annotations"]["readOnlyHint"])

        result = self.call_tool(tokens["access_token"], "get_course", {"course_id": self.course["program"].id})
        self.assertFalse(result["isError"])
        self.assertEqual(result["structuredContent"]["code"], "AI101")

    def test_read_only_consent_issues_a_read_only_token(self):
        tokens = self.connect(allow_write=False)
        self.assertEqual(tokens["scope"], "courses:read")
        result = self.call_tool(
            tokens["access_token"],
            "prepare_course_change",
            {"course_id": self.course["program"].id, "operations": [{"op": "update_module", "module_id": self.course["module1"].id, "title": "New"}]},
        )
        self.assertTrue(result["isError"])
        self.assertIn("not authorized to save", result["content"][0]["text"])

    def test_refresh_rotates_tokens(self):
        tokens = self.connect()
        refreshed = self.client.post(
            "/o/token/",
            {"grant_type": "refresh_token", "refresh_token": tokens["refresh_token"], "client_id": self.client_id},
        )
        self.assertEqual(refreshed.status_code, 200, refreshed.content)
        new_tokens = refreshed.json()
        self.assertNotEqual(new_tokens["refresh_token"], tokens["refresh_token"])
        self.assertEqual(self.mcp(new_tokens["access_token"], "tools/list").status_code, 200)

        replay = self.client.post(
            "/o/token/",
            {"grant_type": "refresh_token", "refresh_token": tokens["refresh_token"], "client_id": self.client_id},
        )
        self.assertEqual(replay.status_code, 400)
        # Replaying a rotated credential revokes its entire refresh-token family.
        family = self.client.post(
            "/o/token/",
            {"grant_type": "refresh_token", "refresh_token": new_tokens["refresh_token"], "client_id": self.client_id},
        )
        self.assertEqual(family.status_code, 400)

    def test_plain_pkce_is_refused(self):
        self.client.force_login(self.instructor)
        response = self.client.get(self.authorize_url("plain-challenge-value-" * 3, method="plain"))
        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "S256", status_code=400)

    def test_clients_that_omit_the_resource_still_get_bound_tokens(self):
        verifier, challenge = pkce_pair()
        self.client.force_login(self.instructor)
        url = self.authorize_url(challenge).replace("&resource=http%3A%2F%2Ftestserver%2Fmcp", "")
        redirect = self.client.get(url)
        self.assertEqual(redirect.status_code, 302)
        self.assertIn("resource=http%3A%2F%2Ftestserver%2Fmcp", redirect["Location"])
        consent = self.client.get(redirect["Location"])
        data = {k: v for k, v in consent.context["form"].initial.items() if v is not None}
        data.update(allow="true", allow_write="1", resource="")  # a tampered hidden field
        approved = self.client.post("/o/authorize/", data)
        code = parse_qs(urlparse(approved["Location"]).query)["code"][0]
        self.client.logout()
        tokens = self.client.post(
            "/o/token/",
            {"grant_type": "authorization_code", "code": code, "redirect_uri": self.redirect_uri,
             "client_id": self.client_id, "code_verifier": verifier},
        ).json()
        token = get_access_token_model().objects.get(user=self.instructor)
        self.assertEqual(token.resource, ["http://testserver/mcp"])
        self.assertEqual(self.mcp(tokens["access_token"], "tools/list").status_code, 200)

    def test_authorization_for_another_resource_is_refused(self):
        _, challenge = pkce_pair()
        self.client.force_login(self.instructor)
        url = self.authorize_url(challenge).replace(
            "resource=http%3A%2F%2Ftestserver%2Fmcp", "resource=https%3A%2F%2Fother.example%2Fmcp"
        )
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "only issues access for http://testserver/mcp", status_code=400)

    def test_tokens_for_another_resource_are_rejected(self):
        tokens = self.connect()
        AccessToken = get_access_token_model()
        token = AccessToken.objects.get(user=self.instructor)
        token.resource = ["https://other.example/mcp"]
        token.save(update_fields=["resource"])
        self.assertEqual(self.mcp(tokens["access_token"], "tools/list").status_code, 401)

    def test_learners_cannot_connect(self):
        student = make_user("learner")
        self.client.force_login(student)
        _, challenge = pkce_pair()
        response = self.client.get(self.authorize_url(challenge))
        self.assertEqual(response.status_code, 403)
        self.assertContains(response, "instructors only", status_code=403)


@connector_on
class TokenStateTests(MCPClientMixin, TestCase):
    def setUp(self):
        self.instructor = make_user("teacher", instructor=True)
        self.course = make_course("AI101", instructor=self.instructor)
        self.other = make_course("BIO201")

    def test_expired_unknown_and_unbound_tokens_are_refused(self):
        expired, _ = make_oauth_token(self.instructor, expired=True)
        self.assertEqual(self.mcp(expired, "tools/list").status_code, 401)
        self.assertEqual(self.mcp("not-a-token", "tools/list").status_code, 401)
        unbound, _ = make_oauth_token(self.instructor, resource=())
        response = self.mcp(unbound, "tools/list")
        self.assertEqual(response.status_code, 401)
        self.assertIn("not bound to this server", response.json()["detail"])

    def test_disabled_accounts_and_removed_instructors_are_refused(self):
        token, _ = make_oauth_token(self.instructor)
        self.assertEqual(self.mcp(token, "tools/list").status_code, 200)
        self.instructor.groups.remove(Group.objects.get(name="Instructors"))
        self.assertEqual(self.mcp(token, "tools/list").status_code, 403)
        self.instructor.groups.add(Group.objects.get(name="Instructors"))
        self.instructor.is_active = False
        self.instructor.save(update_fields=["is_active"])
        self.assertEqual(self.mcp(token, "tools/list").status_code, 401)

    def test_tool_errors_are_actionable(self):
        token, _ = make_oauth_token(self.instructor)
        result = self.call_tool(token, "get_course", {"course_id": self.other["program"].id})
        self.assertTrue(result["isError"])
        self.assertIn("not found among the courses you can manage", result["content"][0]["text"])

    def test_prepare_and_apply_over_mcp_records_the_client(self):
        token, application = make_oauth_token(self.instructor, name="Claude")
        prepared = self.call_tool(
            token,
            "prepare_course_change",
            {
                "course_id": self.course["program"].id,
                "summary": "Rename module 1",
                "operations": [{"op": "update_module", "module_id": self.course["module1"].id, "title": "Module 1: Basics"}],
            },
        )["structuredContent"]
        applied = self.call_tool(token, "apply_course_change", {"change_id": prepared["change_id"]})
        self.assertFalse(applied["isError"])
        self.assertEqual(applied["structuredContent"]["status"], "applied")
        change = CourseChange.objects.get(pk=prepared["change_id"])
        self.assertEqual(change.application, application)
        self.assertEqual(change.applied_by_application, application)
        self.assertEqual(change.client_name, "Claude")
        status = self.call_tool(token, "get_change_status", {"change_id": prepared["change_id"]})
        self.assertEqual(status["structuredContent"]["status"], "applied")


@connector_on
class ConnectedAppsPageTests(MCPClientMixin, TestCase):
    def test_page_lists_connections_and_disconnect_revokes_access(self):
        instructor = make_user("teacher", instructor=True)
        make_course("AI101", instructor=instructor)
        token, application = make_oauth_token(instructor, name="ChatGPT")
        self.client.force_login(instructor)

        page = self.client.get("/account/connected-apps/", HTTP_X_INERTIA=True)
        self.assertEqual(page.status_code, 200)
        props = page.json()["props"]
        self.assertEqual(props["connectorUrl"], "http://testserver/mcp")
        self.assertEqual([c["name"] for c in props["connections"]], ["ChatGPT"])
        self.assertTrue(props["connections"][0]["canWrite"])

        response = self.client.post(f"/account/connected-apps/{application.id}/disconnect/")
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.mcp(token, "tools/list").status_code, 401)
        self.assertEqual(self.client.get("/account/connected-apps/", HTTP_X_INERTIA=True).json()["props"]["connections"], [])

    def test_disconnecting_only_affects_the_current_user(self):
        teacher = make_user("teacher", instructor=True)
        colleague = make_user("colleague", instructor=True)
        colleague_token, application = make_oauth_token(colleague)
        self.client.force_login(teacher)
        self.client.post(f"/account/connected-apps/{application.id}/disconnect/")
        self.assertEqual(self.mcp(colleague_token, "tools/list").status_code, 200)
