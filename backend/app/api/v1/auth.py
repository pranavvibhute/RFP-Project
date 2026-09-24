import uuid
import hashlib
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.organization import Organization
from app.models.user_profile import UserProfile
from app.models.local_credential import LocalCredential

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterPayload(BaseModel):
    full_name: str
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

def _get_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

@router.post("/register")
def register_user(payload: RegisterPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Register a new user, automatically linking them to a default Organization."""
    # Check if credentials exist
    existing = db.query(LocalCredential).filter(LocalCredential.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    # Get or create default Organization
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Default Organization", industry="Software & Tech")
        db.add(org)
        db.commit()
        db.refresh(org)

    # Create user profile
    auth_id = str(uuid.uuid4())
    profile = UserProfile(
        auth_user_id=auth_id,
        organization_id=org.id,
        full_name=payload.full_name,
        role="member"
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Create credentials
    cred = LocalCredential(
        email=payload.email,
        password_hash=_get_hash(payload.password),
        user_profile_id=profile.id
    )
    db.add(cred)
    db.commit()

    return {
        "message": "User registered successfully",
        "user": {
            "id": profile.id,
            "full_name": profile.full_name,
            "email": cred.email,
            "organization_id": org.id
        }
    }

@router.post("/login")
def login_user(payload: LoginPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Authenticate credentials and return user profile details."""
    cred = db.query(LocalCredential).filter(LocalCredential.email == payload.email).first()
    if not cred:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    if cred.password_hash != _get_hash(payload.password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")

    profile = db.query(UserProfile).filter(UserProfile.id == cred.user_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile associated with credentials not found.")

    return {
        "message": "Login successful",
        "user": {
            "id": profile.id,
            "full_name": profile.full_name,
            "email": cred.email,
            "role": profile.role
        }
    }
