import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models.analysis import Analysis
from app.models.requirement import Requirement
from app.repositories.rfp_repository import RFPRepository
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.requirement_repository import RequirementRepository
from app.services.document.extractor import extract_text
from app.services.ai.analysis_service import ai_analysis_service

logger = get_logger("services.document_processing")


class DocumentProcessingService:
    """
    Handles background processing of uploaded RFPs.
    Extracts text, triggers AI analysis, saves findings (summary and requirements),
    and tracks execution states.
    """

    def process(self, db: Session, rfp_id: int) -> None:
        rfp_repo = RFPRepository(db)
        analysis_repo = AnalysisRepository(db)
        requirement_repo = RequirementRepository(db)

        rfp = rfp_repo.get(rfp_id)
        if not rfp:
            logger.error("RFP with ID %s not found in database.", rfp_id)
            return

        try:
            # 1. Update status to Processing
            logger.info("Starting processing for RFP ID %s: %s", rfp.id, rfp.title)
            rfp.status = "Processing"
            rfp.error_message = None
            rfp_repo.update()

            # 2. Extract text from saved file
            file_path = Path(rfp.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found on disk at: {file_path}")

            with open(file_path, "rb") as f:
                file_bytes = f.read()

            extraction = extract_text(
                file_bytes=file_bytes,
                filename=rfp.file_name,
            )

            rfp.extracted_text = extraction.full_text
            rfp_repo.update()
            logger.info("Text extraction successful for RFP ID %s.", rfp.id)

            # 3. Call AI Analysis Service
            logger.info("Initiating Gemini AI analysis for RFP ID %s...", rfp.id)
            ai_data = ai_analysis_service.analyze(rfp.extracted_text)

            # 4. Save AI Analysis
            analysis = Analysis(
                rfp_id=rfp.id,
                executive_summary=ai_data.executive_summary,
                opportunity_summary=ai_data.opportunity_summary,
                submission_deadline=ai_data.submission_deadline,
                budget=ai_data.budget,
                overall_risk_score=ai_data.overall_risk,
                raw_response=ai_data.model_dump(),
                ai_model=getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash"),
                analysis_status="Completed",
            )
            analysis_repo.create(analysis)
            logger.info("Saved AI Analysis record for RFP ID %s.", rfp.id)

            # 5. Extract and save requirements list
            logger.info("Extracting %d requirements for RFP ID %s...", len(ai_data.requirements), rfp.id)
            for req_schema in ai_data.requirements:
                req = Requirement(
                    analysis_id=analysis.id,
                    category=req_schema.category,
                    priority=req_schema.priority,
                    requirement_text=req_schema.requirement,
                )
                requirement_repo.create(req)

            # 6. Complete status tracking
            rfp.status = "Completed"
            rfp_repo.update()
            logger.info("RFP ID %s successfully completed processing.", rfp.id)

        except Exception as e:
            logger.exception("Error processing RFP ID %s:", rfp.id)
            rfp.status = "Failed"
            rfp.error_message = str(e)
            rfp_repo.update()
            # Do not block background queue, log the exception and fail gracefully


document_processing_service = DocumentProcessingService()