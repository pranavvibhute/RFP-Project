from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.core.exceptions import EmptyDocumentError, SummarizationError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.schemas.analysis import AnalyzeResponse
from app.services.analysis.service import analysis_service

logger = get_logger("api.v1.analysis")
router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_rfp(file: UploadFile = File(...)) -> AnalyzeResponse:
    """
    RFP analysis pipeline endpoint.
    1. Read uploaded file.
    2. Dispatch to AnalysisService for text extraction and AI summarization.
    3. Return structured analysis.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no filename.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    max_upload_bytes = getattr(settings, "MAX_UPLOAD_BYTES", 25 * 1024 * 1024)
    if len(file_bytes) > max_upload_bytes:
        max_mb = max_upload_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {max_mb}MB limit.",
        )

    try:
        response = analysis_service.analyze_rfp(file_bytes, file.filename)
        return response
    except UnsupportedFileTypeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except EmptyDocumentError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except SummarizationError as e:
        logger.error("Analysis execution failed for %s: %s", file.filename, e)
        raise HTTPException(status_code=502, detail=f"AI summarization failed: {e}") from e

