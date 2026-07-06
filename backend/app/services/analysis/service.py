import time

from app.services.document.extractor import extract_text
from app.services.ai.gemini import generate_executive_summary
from app.schemas.analysis import AnalyzeResponse
from app.core.logging import get_logger

logger = get_logger("services.analysis")


class AnalysisService:
    """Orchestrates document extraction and AI analysis to deliver the RFP summary."""

    def analyze_rfp(self, file_bytes: bytes, filename: str) -> AnalyzeResponse:
        start = time.monotonic()

        # Step 1: Extraction
        extraction = extract_text(file_bytes, filename)

        logger.info(
            "Extracted %d chars from %s (%s, %d pages)",
            extraction.char_count,
            extraction.filename,
            extraction.file_type,
            extraction.page_count,
        )

        # Step 2: Summarization via Gemini AI
        summary = generate_executive_summary(extraction.full_text, filename=extraction.filename)

        elapsed = time.monotonic() - start
        logger.info("Completed analysis of %s in %.2fs", extraction.filename, elapsed)

        return AnalyzeResponse(
            filename=extraction.filename,
            file_type=extraction.file_type,
            page_count=extraction.page_count,
            char_count=extraction.char_count,
            processing_time_seconds=round(elapsed, 2),
            executive_summary=summary,
        )


analysis_service = AnalysisService()
