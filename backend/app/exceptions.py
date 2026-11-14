class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class PermanentIngestionError(AppError):
    def __init__(self, message: str, code: str = "DOCUMENT_PROCESSING_FAILED"):
        super().__init__(code, message, status_code=422)
