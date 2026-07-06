from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database.session import get_db

router = APIRouter()

@router.get("/health")
def health() -> dict:
    """Simple API health check endpoint."""
    return {"status": "ok", "service": "bidwise-analysis"}

@router.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))

    return {
        "database": "connected"
    }