from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.session import get_db

router = APIRouter()

@router.get("/health")
<<<<<<< HEAD
def health() -> dict:
    """Simple API health check endpoint."""
    return {"status": "ok", "service": "bidwise-analysis"}

@router.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "database": "connected"
=======
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
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
    }