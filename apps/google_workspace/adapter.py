class GoogleWorkspaceAPIError(RuntimeError):
    def __init__(self, message, *, category="remote_error", status_code=None):
        super().__init__(message)
        self.category = category
        self.status_code = status_code


def categorize_google_error(exc):
    status = getattr(getattr(exc, "resp", None), "status", None)
    content = getattr(exc, "content", b"")
    if isinstance(content, bytes):
        content = content.decode(errors="replace")
    lowered = str(content or exc).lower()
    if status == 401 or "invalid_grant" in lowered:
        return "authorization_invalid"
    if "accessnotconfigured" in lowered or "api has not been used" in lowered:
        return "api_disabled"
    if status == 403 and ("insufficient" in lowered or "scope" in lowered):
        return "insufficient_scope"
    if status in {429, 503}:
        return "quota_or_transient"
    if status == 409:
        return "remote_conflict"
    return "remote_error"
