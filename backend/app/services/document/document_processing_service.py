import logging
import time
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
from app.services.ai.intelligence import document_intelligence_service

logger = get_logger("services.document_processing")


class DocumentProcessingService:
    """
    Handles background processing of uploaded RFPs.
    Extracts text, triggers AI analysis, saves findings (summary and requirements),
    and tracks execution states.
    """

    def process(self, db: Session | None = None, rfp_id: int | None = None) -> None:
        start = time.monotonic()
        
        # If no DB session is provided (as in a background task), open and clean up a fresh one
        own_session = False
        if db is None:
            from app.database.session import SessionLocal
            db = SessionLocal()
            own_session = True

        try:
            rfp_repo = RFPRepository(db)
            analysis_repo = AnalysisRepository(db)
            requirement_repo = RequirementRepository(db)

            rfp = rfp_repo.get(rfp_id)
            if not rfp:
                logger.error("RFP with ID %s not found in database.", rfp_id)
                return

            # 1. Update status to Processing
            logger.info("Starting processing for RFP ID %s: %s", rfp.id, rfp.title)
            rfp.status = "Processing"
            rfp.error_message = None
            rfp_repo.update()

            # 2. Extract text from saved file
            file_path = Path(rfp.file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found on disk at {file_path}")

            with open(file_path, "rb") as f:
                file_bytes = f.read()

            extraction = extract_text(file_bytes, rfp.file_name)
            rfp.extracted_text = extraction.full_text
            rfp_repo.update()
            logger.info("Text extraction successful for RFP ID %s.", rfp.id)

            # 3. Trigger analysis (True RAG)
            logger.info("Initiating retrieval-assisted AI analysis for RFP ID %s...", rfp.id)
            analysis_result = document_intelligence_service.analyze(
                extraction.full_text,
                filename=rfp.file_name,
            )
            ai_data = analysis_result.analysis

            # 4. Save AI Analysis
            analysis = Analysis(
                rfp_id=rfp.id,
                executive_summary=ai_data.executive_summary,
                opportunity_summary=ai_data.opportunity_summary,
                submission_deadline=ai_data.submission_deadline,
                budget=ai_data.budget,
                overall_risk_score=ai_data.overall_risk,
                processing_time_ms=int((time.monotonic() - start) * 1000),
                confidence_score=analysis_result.confidence_score,
                raw_response={
                    "analysis": ai_data.model_dump(),
                    "metadata": {
                        "provider": analysis_result.provider,
                        "model": analysis_result.model,
                        "used_fallback": analysis_result.used_fallback,
                        "confidence_score": analysis_result.confidence_score,
                    },
                },
                ai_model=f"{analysis_result.provider}:{analysis_result.model}",
                analysis_status="Completed",
            )
            analysis_repo.create(analysis)
            logger.info("Saved AI Analysis record for RFP ID %s.", rfp.id)

            # 5. Extract and save requirements list
            logger.info("Extracting %d requirements for RFP ID %s...", len(ai_data.requirements), rfp.id)
            for req_schema in ai_data.requirements:
                init_status = "Review Required" if req_schema.priority.lower() == "high" else "Verified Compliant"
                req = Requirement(
                    analysis_id=analysis.id,
                    category=req_schema.category,
                    priority=req_schema.priority,
                    requirement_text=req_schema.requirement,
                    status=init_status
                )
                requirement_repo.create(req)

            # 6. Complete status tracking
            rfp.status = "Completed"
            rfp_repo.update()
            logger.info("RFP ID %s successfully completed processing.", rfp.id)

        except Exception as e:
            logger.exception("Error processing RFP ID %s:", rfp_id)
            try:
                rfp_repo = RFPRepository(db)
                rfp = rfp_repo.get(rfp_id)
                if rfp:
                    rfp.status = "Failed"
                    rfp.error_message = str(e)
                    rfp_repo.update()
            except Exception as db_err:
                logger.error("Failed to save error state to database: %s", db_err)

        finally:
            if own_session:
                db.close()


document_processing_service = DocumentProcessingService()