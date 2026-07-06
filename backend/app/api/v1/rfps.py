# Placeholder for RFPs router
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from fastapi import BackgroundTasks
from app.database.session import get_db
from app.services.rfp.upload_service import upload_service
from app.services.document.document_processing_service import (
    document_processing_service,
)

router = APIRouter(prefix="/rfps", tags=["RFPs"])


@router.post("/upload")
async def upload_rfp(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    organization_id: int = Form(...),
    uploaded_by: int = Form(...),
    customer_name: str | None = Form(None),
    db: Session = Depends(get_db),
):
    rfp = await upload_service.upload_rfp(
        db=db,
        file=file,
        organization_id=organization_id,
        uploaded_by=uploaded_by,
        title=title,
        customer_name=customer_name,
    )

    background_tasks.add_task(
        document_processing_service.process,
        db,
        rfp.id
    )

    return {
        "message": "RFP uploaded successfully",
        "rfp_id": rfp.id,
        "file_name": rfp.file_name,
        "status": rfp.status,
    }