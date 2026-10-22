import os
import json
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.organization import Organization

router = APIRouter(prefix="/settings", tags=["Settings"])

SETTINGS_FILE = "settings.json"

class SettingsPayload(BaseModel):
    primary_model: str = "gemini-2.5-flash"
    fallback_model: str = "openrouter/free (Qwen)"
    temperature: float = 0.2
    max_output_tokens: int = 8192
    collection_name: str = "bidwise_rfp_chunks"
    similarity_top_k: int = 10
    min_similarity_score: float = 0.70
    enable_multimodal_vision_ocr: bool = True
    min_readiness_score_for_go: int = 75
    min_win_probability_for_go: int = 65
    auto_flag_uncapped_liability: bool = True
    default_cure_period_days: int = 30
    default_export_format: str = "docx"

def load_settings() -> dict[str, Any]:
    defaults = {
        "primary_model": "gemini-2.5-flash",
        "fallback_model": "openrouter/free (Qwen)",
        "temperature": 0.2,
        "max_output_tokens": 8192,
        "collection_name": "bidwise_rfp_chunks",
        "similarity_top_k": 10,
        "min_similarity_score": 0.70,
        "enable_multimodal_vision_ocr": True,
        "min_readiness_score_for_go": 75,
        "min_win_probability_for_go": 65,
        "auto_flag_uncapped_liability": True,
        "default_cure_period_days": 30,
        "default_export_format": "docx"
    }
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                saved = json.load(f)
                defaults.update(saved)
                return defaults
        except Exception:
            pass
    return defaults

def save_settings(data: dict[str, Any]):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("")
def get_settings() -> dict[str, Any]:
    """Retrieve system settings from persistent config store."""
    return load_settings()

@router.post("")
def update_settings(payload: SettingsPayload) -> dict[str, Any]:
    """Update system settings persistently."""
    data = payload.model_dump()
    save_settings(data)
    
    # Dynamically inject into runtime settings if possible
    from app.core.config import settings
    settings.GEMINI_MODEL = payload.primary_model
    settings.QDRANT_COLLECTION = payload.collection_name
    
    return {"message": "System settings updated successfully", "settings": data}


class OrganizationProfilePayload(BaseModel):
    name: str
    industry: str | None = None
    website: str | None = None
    annual_revenue: str | None = None
    employee_count: int | None = None
    certifications: list[str] = []
    clearances: list[str] = []
    core_skills: list[str] = []
    past_performance: list[str] = []


@router.get("/organization")
def get_organization_profile(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve active Bidding Enterprise Profile."""
    org = db.query(Organization).first()
    if not org:
        org = Organization(
            name="Apex Enterprise Solutions Inc.",
            industry="Cloud & Defense Systems Modernization",
            website="https://apexsolutions.ai"
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    return org.get_profile_dict()


@router.put("/organization")
@router.post("/organization")
def update_organization_profile(payload: OrganizationProfilePayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Update active Bidding Enterprise Profile and credentials vault."""
    org = db.query(Organization).first()
    if not org:
        org = Organization(name=payload.name, industry=payload.industry, website=payload.website)
        db.add(org)
    
    org.name = payload.name
    org.industry = payload.industry
    org.website = payload.website
    
    profile_dict = payload.model_dump()
    org.profile_data = profile_dict
    db.commit()
    db.refresh(org)

    return {"message": "Organization Profile updated successfully", "profile": profile_dict, **profile_dict}
