from sqlalchemy.orm import Session
from fastapi import UploadFile

from app.models.rfp import RFP
from app.repositories.rfp_repository import RFPRepository
from app.services.storage.storage_service import storage_service
from app.services.document.document_processing_service import (
    document_processing_service,
)


class UploadService:

    async def upload_rfp(
        self,
        db: Session,
        file: UploadFile,
        organization_id: int,
        uploaded_by: int,
        title: str,
        customer_name: str | None = None,
    ) -> RFP:

        # Save file locally
        filename, filepath = await storage_service.save_file(file)

        # Create database object
        rfp = RFP(
            organization_id=organization_id,
            uploaded_by=uploaded_by,
            title=title,
            customer_name=customer_name,
            file_name=filename,
            file_path=filepath,
            document_type="RFP",
            status="Uploaded",
        )

        repo = RFPRepository(db)

        rfp = repo.create(rfp)

        return rfp


upload_service = UploadService()