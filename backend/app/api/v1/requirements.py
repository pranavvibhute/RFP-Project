from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.requirement import Requirement
from app.models.analysis import Analysis
from app.models.rfp import RFP

router = APIRouter(prefix="/requirements", tags=["Requirements"])


class UpdateComplianceRequest(BaseModel):
    status: str


@router.get("")
def list_requirements(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """List all extracted requirements across all RFPs stored in database."""
    records = (
        db.query(Requirement, Analysis, RFP)
        .join(Analysis, Requirement.analysis_id == Analysis.id)
        .join(RFP, Analysis.rfp_id == RFP.id)
        .all()
    )

    results = []
    for req, analysis, rfp in records:
        results.append({
            "id": req.id,
            "category": req.category or "General",
            "priority": req.priority or "Medium",
            "requirement": req.requirement_text,
            "rfp_id": rfp.id,
            "rfp_title": rfp.title,
            "customer_name": rfp.customer_name or "Enterprise Customer",
            "status": req.status or ("Verified Compliant" if (req.priority or "").lower() != "high" else "Review Required"),
        })

    return results


@router.patch("/{requirement_id}/compliance")
def update_requirement_compliance(
    requirement_id: int,
    payload: UpdateComplianceRequest,
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    """Update compliance status of a specific requirement."""
    req = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found.")

    valid_statuses = ["Verified Compliant", "Review Required", "Non-Compliant"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )

    req.status = payload.status
    db.commit()
    return {"message": "Compliance status updated successfully", "status": req.status}
