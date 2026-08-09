import os
import json
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/settings", tags=["Settings"])

SETTINGS_FILE = "settings.json"

class SettingsPayload(BaseModel):
    primary_model: str
    fallback_model: str
    collection_name: str

def load_settings() -> dict[str, str]:
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "primary_model": "gemini-2.5-flash",
        "fallback_model": "openrouter/free (Qwen)",
        "collection_name": "bidwise_rfp_chunks"
    }

def save_settings(data: dict[str, str]):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("")
def get_settings() -> dict[str, Any]:
    """Retrieve system settings from persistent config store."""
    return load_settings()

@router.post("")
def update_settings(payload: SettingsPayload) -> dict[str, Any]:
    """Update system settings persistently."""
    data = {
        "primary_model": payload.primary_model,
        "fallback_model": payload.fallback_model,
        "collection_name": payload.collection_name
    }
    save_settings(data)
    
    # Dynamically inject into runtime settings if possible
    from app.core.config import settings
    settings.GEMINI_MODEL = payload.primary_model
    settings.QDRANT_COLLECTION = payload.collection_name
    
    return {"message": "Settings saved successfully", "settings": data}
