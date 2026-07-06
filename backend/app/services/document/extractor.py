from __future__ import annotations

import io
import re
from dataclasses import dataclass, field

import fitz  # PyMuPDF
from docx import Document

from app.core.exceptions import EmptyDocumentError, UnsupportedFileTypeError


@dataclass
class ExtractionResult:
    filename: str
    file_type: str  # "pdf" | "docx"
    page_count: int
    full_text: str
    char_count: int = field(init=False)

    def __post_init__(self) -> None:
        self.char_count = len(self.full_text)


def _clean_text(text: str) -> str:
    """Normalize whitespace without destroying paragraph structure."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse 3+ blank lines into 2 (preserve paragraph breaks)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse runs of spaces/tabs
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def extract_pdf(file_bytes: bytes, filename: str) -> ExtractionResult:
    """Extract text from a PDF using PyMuPDF, with page markers."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise EmptyDocumentError(f"Could not open PDF '{filename}': {e}") from e

    pages_text = []
    for page_num, page in enumerate(doc, start=1):
        page_text = page.get_text("text")
        page_text = _clean_text(page_text)
        if page_text:
            pages_text.append(f"\n--- Page {page_num} ---\n{page_text}")

    page_count = doc.page_count
    doc.close()

    full_text = "\n".join(pages_text).strip()

    if not full_text:
        raise EmptyDocumentError(
            f"'{filename}' produced no extractable text. "
            "It may be a scanned/image-only PDF — OCR is not in Sprint 1 scope."
        )

    return ExtractionResult(
        filename=filename,
        file_type="pdf",
        page_count=page_count,
        full_text=full_text,
    )


def extract_docx(file_bytes: bytes, filename: str) -> ExtractionResult:
    """Extract text from a DOCX using python-docx, including tables."""
    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception as e:
        raise EmptyDocumentError(f"Could not open DOCX '{filename}': {e}") from e

    blocks: list[str] = []

    for para in doc.paragraphs:
        if para.text.strip():
            blocks.append(para.text.strip())

    # Tables often hold requirements/eligibility criteria in RFPs — don't skip them
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                blocks.append(" | ".join(cells))

    full_text = _clean_text("\n".join(blocks))

    if not full_text:
        raise EmptyDocumentError(f"'{filename}' produced no extractable text.")

    return ExtractionResult(
        filename=filename,
        file_type="docx",
        page_count=0,  # DOCX has no fixed page count without rendering
        full_text=full_text,
    )


def extract_text(file_bytes: bytes, filename: str) -> ExtractionResult:
    """Dispatch to the right extractor based on file extension."""
    lower_name = filename.lower()

    if lower_name.endswith(".pdf"):
        return extract_pdf(file_bytes, filename)
    elif lower_name.endswith(".docx"):
        return extract_docx(file_bytes, filename)
    else:
        raise UnsupportedFileTypeError(
            f"'{filename}' is not supported. Sprint 1 supports .pdf and .docx only."
        )
