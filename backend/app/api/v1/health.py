from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.session import get_db

router = APIRouter()

@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    """Live API and infrastructure health check endpoint."""
    # Check DB
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    # Check Gemini key configuration
    from app.core.config import settings
    gemini_status = "active" if settings.GEMINI_API_KEY else "not configured"

    # Check Qdrant location configuration
    qdrant_status = "active" if settings.QDRANT_LOCATION else "not configured"

    overall_status = "ok" if (db_status == "connected" and gemini_status == "active") else "degraded"

    return {
        "status": overall_status,
        "service": "bidwise-analysis",
        "infrastructure": {
            "database": db_status,
            "gemini_api": gemini_status,
            "qdrant_store": qdrant_status,
            "version": getattr(settings, "APP_VERSION", "0.2.0")
        }
    }