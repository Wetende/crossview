from django.apps import AppConfig


class AiConnectorConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ai_connector"
    verbose_name = "AI course-authoring connector"

    def ready(self):
        # mcp_server autodiscovers apps.ai_connector.mcp and registers its tools
        # before this runs; add titles and behaviour hints for AI clients.
        from .mcp import annotate_registered_tools

        annotate_registered_tools()
