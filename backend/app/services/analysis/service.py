import time

from app.core.logging import get_logger
from app.schemas.analysis import AnalyzeResponse, ExecutiveSummary, Deadline
from app.services.ai.intelligence import document_intelligence_service
from app.services.document.extractor import extract_text

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

# Step 2: Retrieval-assisted AI analysis with Qwen primary and Gemini fallback
        result = document_intelligence_service.analyze(extraction.full_text, filename=extraction.filename)

        summary = ExecutiveSummary(
            project_overview=result.analysis.executive_summary or result.analysis.opportunity_summary,
            key_requirements=[item.requirement for item in result.analysis.requirements],
            deadlines=[
                Deadline(label="Submission Deadline", date_or_detail=result.analysis.submission_deadline)
            ]
            if result.analysis.submission_deadline
            else [],
            evaluation_criteria=result.analysis.evaluation_criteria,
            important_risks=result.analysis.important_risks
            or [risk.description for risk in result.analysis.risks],
            issuing_organization=result.analysis.issuing_organization,
        )

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
