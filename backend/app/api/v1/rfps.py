from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func, extract

from app.database.session import get_db
from app.models.rfp import RFP
from app.models.analysis import Analysis
from app.models.requirement import Requirement
from app.models.organization import Organization
from app.repositories.rfp_repository import RFPRepository
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.requirement_repository import RequirementRepository
from app.services.rfp.upload_service import upload_service
from app.services.document.document_processing_service import document_processing_service
from app.services.ai.qa_service import qa_service
from app.services.ai.simulation_service import SimulationRequest, simulation_service

router = APIRouter(prefix="/rfps", tags=["RFPs"])


class StatusUpdatePayload(BaseModel):
    status: str


class ChatRequest(BaseModel):
    question: str


@router.get("")
def list_rfps(
    organization_id: int = 1,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List all RFP documents stored in database."""
    rfp_repo = RFPRepository(db)
    analysis_repo = AnalysisRepository(db)
    req_repo = RequirementRepository(db)

    rfps = rfp_repo.get_by_organization(organization_id)
    results = []
    for r in rfps:
        analysis = analysis_repo.get_by_rfp_id(r.id)
        reqs = req_repo.get_by_analysis_id(analysis.id) if analysis else []
        
        # Calculate completion metrics
        filled_count = 0
        if r.customer_name and r.customer_name != "Enterprise Customer":
            filled_count += 1
        if analysis and analysis.budget and analysis.budget != "TBD":
            filled_count += 1
        if analysis and analysis.submission_deadline and analysis.submission_deadline != "TBD":
            filled_count += 1
        if analysis and analysis.executive_summary:
            filled_count += 1
        if analysis and analysis.overall_risk_score:
            filled_count += 1
            
        completion_pct = int((filled_count / 5) * 100) if filled_count > 0 else 40

        results.append({
            "id": r.id,
            "title": r.title,
            "customer_name": r.customer_name or "Enterprise Customer",
            "file_name": r.file_name,
            "file_type": "PDF" if r.file_name.lower().endswith(".pdf") else "DOCX",
            "status": r.status or "under_review",
            "completion_pct": completion_pct,
            "risk_level": analysis.overall_risk_score if analysis else "Medium",
            "created_at": r.created_at.strftime("%Y-%m-%d") if r.created_at else None,
            "budget": analysis.budget if analysis else "TBD",
            "deadline": analysis.submission_deadline if analysis else "TBD",
            "requirements_count": len(reqs),
            "summary": analysis.executive_summary[:160] + "..." if (analysis and analysis.executive_summary) else "Executive summary under extraction...",
            "analysis": {
                "overall_risk_score": analysis.overall_risk_score if analysis else "Medium",
                "submission_deadline": analysis.submission_deadline if analysis else "TBD",
                "budget": analysis.budget if analysis else "TBD",
                "executive_summary": analysis.executive_summary if analysis else "",
            } if analysis else None,
        })
    return results


@router.patch("/{rfp_id}/status")
def update_rfp_status(
    rfp_id: int,
    payload: StatusUpdatePayload,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Update pipeline lifecycle status of an RFP (e.g. under_review, submitted, won, lost)."""
    rfp_repo = RFPRepository(db)
    rfp = rfp_repo.get(rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    rfp.status = payload.status
    db.commit()
    db.refresh(rfp)
    return {"message": "Status updated successfully", "id": rfp.id, "status": rfp.status}


@router.get("/stats")
def get_rfp_stats(
    organization_id: int = 1,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve summary counts for RFP overview cards."""
    rfp_repo = RFPRepository(db)
    rfps = rfp_repo.get_by_organization(organization_id)
    reqs = db.query(Requirement).all()
    analyses = db.query(Analysis).all()

    total_rfps = len(rfps)
    active_rfps = len([r for r in rfps if r.status in ["under_review", "Processing", "draft"]])
    processing_rfps = len([r for r in rfps if r.status == "Processing"])
    completed_rfps = len([r for r in rfps if r.status == "Completed"])
    failed_rfps = len([r for r in rfps if r.status == "Failed"])

    high_risk_rfps = 0
    for a in analyses:
        if a.overall_risk_score and "high" in a.overall_risk_score.lower():
            high_risk_rfps += 1

    mandatory_cnt = len([req for req in reqs if (req.category or "").lower() in ["mandatory", "legal"]])
    technical_cnt = len([req for req in reqs if (req.category or "").lower() in ["technical", "security"]])
    commercial_cnt = len([req for req in reqs if (req.category or "").lower() in ["commercial", "financial"]])

    return {
        "total_rfps": total_rfps,
        "active_rfps": active_rfps,
        "processing_rfps": processing_rfps,
        "completed_rfps": completed_rfps,
        "failed_rfps": failed_rfps,
        "high_risk_rfps": high_risk_rfps,
        "total_requirements": len(reqs),
        "categories": {
            "mandatory": mandatory_cnt,
            "technical": technical_cnt,
            "commercial": commercial_cnt,
        }
    }


@router.get("/metrics/time-series")
def get_rfp_time_series(
    organization_id: int = 1,
    period: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
    weeks: int = Query(12, ge=1, le=52),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve time-series data for RFP metrics charts."""
    rfp_repo = RFPRepository(db)
    rfps = rfp_repo.get_by_organization(organization_id)
    analyses = db.query(Analysis).all()
    requirements = db.query(Requirement).all()
    
    # Map requirements to their analysis created_at for time-series
    req_by_analysis = {}
    for req in requirements:
        if req.analysis_id not in req_by_analysis:
            req_by_analysis[req.analysis_id] = []
        req_by_analysis[req.analysis_id].append(req)
    
    # Calculate date threshold
    now = datetime.now()
    if period == "daily":
        start_date = now - timedelta(days=weeks * 7)
    elif period == "weekly":
        start_date = now - timedelta(weeks=weeks)
    else:  # monthly
        start_date = now - timedelta(weeks=weeks * 4)
    
    # Filter RFPs within date range
    filtered_rfps = [r for r in rfps if r.created_at and r.created_at >= start_date]
    
    # Generate time buckets
    data_points = []
    if period == "daily":
        days = (now - start_date).days
        for i in range(days + 1):
            day = start_date + timedelta(days=i)
            day_rfps = [r for r in filtered_rfps if r.created_at and r.created_at.date() == day.date()]
            day_analyses = [a for a in analyses if a.created_at and a.created_at.date() == day.date()]
            
            # Count requirements from analyses created on this day
            day_reqs_count = sum(len(req_by_analysis.get(a.id, [])) for a in day_analyses)
            
            high_risk = sum(1 for a in day_analyses if a.overall_risk_score and "high" in a.overall_risk_score.lower())
            data_points.append({
                "date": day.strftime("%Y-%m-%d"),
                "label": day.strftime("%m/%d"),
                "total_rfps": len(day_rfps),
                "active_rfps": len([r for r in day_rfps if r.status in ["under_review", "Processing", "draft"]]),
                "high_risk": high_risk,
                "requirements_extracted": day_reqs_count,
            })
    elif period == "weekly":
        week_start = start_date - timedelta(days=start_date.weekday())
        for i in range(weeks):
            week_end = week_start + timedelta(days=6)
            week_rfps = [r for r in filtered_rfps if r.created_at and week_start <= r.created_at <= week_end]
            week_analyses = [a for a in analyses if a.created_at and week_start <= a.created_at <= week_end]
            
            # Count requirements from analyses created this week
            week_reqs_count = sum(len(req_by_analysis.get(a.id, [])) for a in week_analyses)
            
            high_risk = sum(1 for a in week_analyses if a.overall_risk_score and "high" in a.overall_risk_score.lower())
            data_points.append({
                "date": week_start.strftime("%Y-%m-%d"),
                "label": f"Week {week_start.isocalendar()[1]}",
                "total_rfps": len(week_rfps),
                "active_rfps": len([r for r in week_rfps if r.status in ["under_review", "Processing", "draft"]]),
                "high_risk": high_risk,
                "requirements_extracted": week_reqs_count,
            })
            week_start = week_end + timedelta(days=1)
    else:  # monthly
        month_start = start_date.replace(day=1)
        for i in range(weeks * 4 // 4 + 1):  # approximate months
            if month_start > now:
                break
            next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
            month_rfps = [r for r in filtered_rfps if r.created_at and month_start <= r.created_at < next_month]
            month_analyses = [a for a in analyses if a.created_at and month_start <= a.created_at < next_month]
            
            # Count requirements from analyses created this month
            month_reqs_count = sum(len(req_by_analysis.get(a.id, [])) for a in month_analyses)
            
            high_risk = sum(1 for a in month_analyses if a.overall_risk_score and "high" in a.overall_risk_score.lower())
            data_points.append({
                "date": month_start.strftime("%Y-%m-%d"),
                "label": month_start.strftime("%b %Y"),
                "total_rfps": len(month_rfps),
                "active_rfps": len([r for r in month_rfps if r.status in ["under_review", "Processing", "draft"]]),
                "high_risk": high_risk,
                "requirements_extracted": month_reqs_count,
            })
            month_start = next_month
    
    return {
        "period": period,
        "data_points": data_points
    }


@router.get("/dashboard")
@router.get("/dashboard/overview")
def get_dashboard_overview(
    organization_id: int = 1,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Retrieve combined executive metrics, revenue trends, and compliance sessions for dashboard."""
    rfp_repo = RFPRepository(db)
    analysis_repo = AnalysisRepository(db)
    req_repo = RequirementRepository(db)

    rfps = rfp_repo.get_by_organization(organization_id)
    analyses = db.query(Analysis).all()
    requirements = db.query(Requirement).all()

    # 1. Recent Extractions List
    recent_extractions = []
    for r in rfps[:5]:
        analysis = analysis_repo.get_by_rfp_id(r.id)
        recent_extractions.append({
            "id": r.id,
            "title": r.title,
            "customer_name": r.customer_name or "Enterprise Customer",
            "status": r.status or "under_review",
            "uploaded_at": r.created_at.strftime("%d/%m/%Y") if r.created_at else "Recently",
            "risk_score": analysis.overall_risk_score if analysis else "Medium",
            "budget": analysis.budget if analysis else "TBD",
            "deadline": analysis.submission_deadline if analysis else "TBD",
            "char_count": len(r.extracted_text) if r.extracted_text else 0,
        })

    # Helper to parse budget strings like "$250K" or "$1.2M"
    def parse_budget_val(b_str: str | None) -> float:
        if not b_str:
            return 0.0
        b_lower = b_str.lower().strip()
        if b_lower in ("not specified", "tbd", "tba", "n/a", "na"):
            return 0.0
        cleaned = "".join(c for c in b_str if c.isdigit() or c in ".kmKM")
        if not cleaned:
            return 0.0
        try:
            val = cleaned.lower()
            if "k" in val:
                return float(val.replace("k", "")) * 1000
            if "m" in val:
                return float(val.replace("m", "")) * 1000000
            return float(val)
        except Exception:
            return 0.0

    # 2. Pipeline Revenue Trends (Monthly)
    monthly_data = {
        "Jan": 0.0, "Feb": 0.0, "Mar": 0.0, "Apr": 0.0, "May": 0.0, "Jun": 0.0,
        "Jul": 0.0, "Aug": 0.0, "Sep": 0.0, "Oct": 0.0, "Nov": 0.0, "Dec": 0.0
    }
    total_pipeline = 0.0
    for a in analyses:
        val = parse_budget_val(a.budget)
        total_pipeline += val
        if a.created_at:
            m_str = a.created_at.strftime("%b")
            if m_str in monthly_data:
                monthly_data[m_str] += val

    revenue_chart_data = []
    for month, val in monthly_data.items():
        revenue_chart_data.append({
            "month": month,
            "pipeline": round(val / 1000, 1),
            "target": round((val * 1.2) / 1000, 1)
        })

    # 3. Incomplete Profiles / Missing details list
    incomplete_profiles = []
    for r in rfps:
        analysis = next((a for a in analyses if a.rfp_id == r.id), None)
        filled_fields = 0
        total_fields = 5
        if r.customer_name and r.customer_name != "Enterprise Customer":
            filled_fields += 1
        if analysis:
            if analysis.budget and analysis.budget != "TBD":
                filled_fields += 1
            if analysis.submission_deadline and analysis.submission_deadline != "TBD":
                filled_fields += 1
            if analysis.executive_summary:
                filled_fields += 1
            if analysis.confidence_score and analysis.confidence_score > 0.8:
                filled_fields += 1
        pct = int((filled_fields / total_fields) * 100)
        if pct < 100:
            incomplete_profiles.append({
                "id": r.id,
                "name": r.title,
                "customer": r.customer_name or "Enterprise Customer",
                "progress": pct
            })

    # 4. Compliance Rates - Calculate from actual requirement statuses
    compliant_count = 0
    review_count = 0
    failed_count = 0
    
    for req in requirements:
        status = (req.status or "").lower()
        if "verified" in status or "compliant" in status:
            compliant_count += 1
        elif "review" in status:
            review_count += 1
        elif "non" in status or "failed" in status:
            failed_count += 1
        else:
            # Default classification based on priority
            if (req.priority or "").lower() == "high":
                review_count += 1
            else:
                compliant_count += 1
    
    total_reqs = len(requirements)
    compliance_rate = round((compliant_count / total_reqs * 100), 1) if total_reqs > 0 else 100.0

    return {
        "recent_extractions": recent_extractions,
        "revenue_chart_data": revenue_chart_data,
        "total_pipeline": f"${total_pipeline:,.0f}" if total_pipeline > 0 else "$0",
        "incomplete_profiles": incomplete_profiles[:5] if incomplete_profiles else [],
        "compliance": {
            "rate": compliance_rate,
            "compliant": compliant_count,
            "pending": review_count,
            "non_compliant": failed_count
        }
    }


@router.get("/{rfp_id}")
def get_rfp_detail(rfp_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get full detailed RFP breakdown including requirements & raw analysis."""
    rfp_repo = RFPRepository(db)
    analysis_repo = AnalysisRepository(db)
    req_repo = RequirementRepository(db)

    rfp = rfp_repo.get(rfp_id)
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    analysis = analysis_repo.get_by_rfp_id(rfp.id)
    reqs = req_repo.get_by_analysis_id(analysis.id) if analysis else []

    return {
        "id": rfp.id,
        "title": rfp.title,
        "customer_name": rfp.customer_name,
        "file_name": rfp.file_name,
        "status": rfp.status,
        "created_at": rfp.created_at.strftime("%d/%m/%Y") if rfp.created_at else None,
        "analysis": {
            "id": analysis.id if analysis else None,
            "executive_summary": analysis.executive_summary if analysis else "",
            "opportunity_summary": analysis.opportunity_summary if analysis else "",
            "submission_deadline": analysis.submission_deadline if analysis else None,
            "budget": analysis.budget if analysis else None,
            "overall_risk_score": analysis.overall_risk_score if analysis else "Medium",
            "confidence_score": analysis.confidence_score if analysis else 0.95,
            "bid_recommendation": (analysis.raw_response or {}).get("analysis", {}).get("bid_recommendation", "Go") if analysis else "Go",
            "recommendation_rationale": (analysis.raw_response or {}).get("analysis", {}).get("recommendation_rationale", "Opportunity aligns with core technical capabilities and timeline.") if analysis else "Opportunity aligns with core technical capabilities and timeline.",
            "raw_response": analysis.raw_response if analysis else {},
        } if analysis else None,
        "requirements": [
            {
                "id": req.id,
                "category": req.category,
                "priority": req.priority,
                "requirement_text": req.requirement_text,
                "status": req.status or ("Verified Compliant" if (req.priority or "").lower() != "high" else "Review Required"),
            }
            for req in reqs
        ]
    }


@router.get("/{rfp_id}/progress")
def get_rfp_progress(rfp_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Retrieve detailed real-time processing stage and agent telemetry for an RFP."""
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    analysis = db.query(Analysis).filter(Analysis.rfp_id == rfp_id).first()
    raw = analysis.raw_response if analysis and isinstance(analysis.raw_response, dict) else {}
    telemetry = raw.get("telemetry", {})

    status = (rfp.status or "Processing").lower()
    is_completed = status == "completed"
    is_failed = status == "failed"

    stages = [
        {"stage": "Document Ingestion & Table Extraction", "status": "completed" if rfp.extracted_text or is_completed else ("failed" if is_failed else "in_progress")},
        {"stage": "Qdrant Vector Embedding (BGE-Large GPU)", "status": "completed" if is_completed or telemetry else ("failed" if is_failed else "pending")},
        {"stage": "Multi-Agent Parallel Execution (Qwen 72B, DeepSeek, Gemini)", "status": "completed" if is_completed else ("failed" if is_failed else "pending")},
        {"stage": "Executive Go/No-Go Decision Synthesis", "status": "completed" if is_completed else ("failed" if is_failed else "pending")},
    ]

    return {
        "rfp_id": rfp.id,
        "title": rfp.title,
        "status": rfp.status,
        "is_completed": is_completed,
        "stages": stages,
        "execution_time_ms": telemetry.get("execution_time_ms") or (analysis.processing_time_ms if analysis else None),
        "agents": {
            "doc_parsing": telemetry.get("doc_parsing", {"status": "completed" if is_completed else "pending"}),
            "requirement_analysis": telemetry.get("requirement_analysis", {"status": "completed" if is_completed else "pending"}),
            "risk_compliance": telemetry.get("risk_compliance", {"status": "completed" if is_completed else "pending"}),
            "profit_analysis": telemetry.get("profit_analysis", {"status": "completed" if is_completed else "pending"}),
            "gap_analysis": telemetry.get("gap_analysis", {"status": "completed" if is_completed else "pending"}),
            "bid_recommendation": telemetry.get("bid_recommendation", {"status": "completed" if is_completed else "pending"}),
        },
        "scores": {
            "readiness_score": telemetry.get("readiness_score") or (int((analysis.confidence_score or 0.85) * 100) if analysis else None),
            "win_probability_percent": telemetry.get("win_probability_percent", 70) if is_completed else None,
            "overall_risk": analysis.overall_risk_score if analysis else None,
        }
    }


@router.post("/{rfp_id}/chat")
def chat_with_rfp(
    rfp_id: int,
    payload: ChatRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    RAG-powered Q&A endpoint for querying a specific RFP document.
    Retrieves vector chunks from Qdrant and generates AI answer.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    return qa_service.answer_question(db=db, rfp_id=rfp_id, question=payload.question.strip())


@router.post("/{rfp_id}/simulate")
def simulate_rfp_scenario(
    rfp_id: int,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Execute real-time What-If bidding simulation with partner teaming and price adjustments."""
    rfp = db.query(RFP).filter(RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found.")

    analysis = db.query(Analysis).filter(Analysis.rfp_id == rfp_id).first()
    if not analysis:
        raise HTTPException(status_code=400, detail="Cannot run simulation: RFP has not completed baseline analysis.")

    org = db.query(Organization).first()
    org_info = org.get_profile_dict() if org else None

    return simulation_service.run_simulation(
        rfp=rfp,
        analysis=analysis,
        simulation=payload,
        org_info=org_info,
    )


@router.post("/upload")
async def upload_rfp(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    organization_id: int = Form(1),
    uploaded_by: int = Form(1),
    customer_name: str | None = Form(None),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Upload RFP document and save to database.
    Background worker extracts text, runs Gemini AI analysis, and saves requirements.
    """
    actual_title = title or file.filename or "Uploaded RFP Document"

    rfp = await upload_service.upload_rfp(
        db=db,
        file=file,
        organization_id=organization_id,
        uploaded_by=uploaded_by,
        title=actual_title,
        customer_name=customer_name or "Enterprise Customer",
    )

    background_tasks.add_task(
        document_processing_service.process,
        db=None,
        rfp_id=rfp.id
    )

    return {
        "message": "RFP uploaded successfully",
        "rfp_id": rfp.id,
        "file_name": rfp.file_name,
        "title": rfp.title,
        "status": rfp.status,
    }