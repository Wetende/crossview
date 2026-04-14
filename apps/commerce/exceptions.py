class CommerceError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str = "commerce_error",
        status_code: int = 400,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

