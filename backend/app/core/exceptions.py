class BidWiseException(Exception):
    """Base exception for all BidWise application errors."""
    pass


class UnsupportedFileTypeError(BidWiseException):
    """Raised when the uploaded file format is not supported."""
    pass


class EmptyDocumentError(BidWiseException):
    """Raised when document extraction yields no usable text (e.g. scanned image PDF without OCR)."""
    pass


class SummarizationError(BidWiseException):
    """Raised when the AI agent/Gemini service fails to generate a summary."""
    pass
