from sqlalchemy.orm import Session

from app.models.rfp import RFP
from app.repositories.base_repository import BaseRepository


class RFPRepository(BaseRepository[RFP]):

    def __init__(self, db: Session):
        super().__init__(RFP, db)

    def get_by_status(self, status: str):
        return (
            self.db.query(RFP)
            .filter(RFP.status == status)
            .all()
        )

    def get_by_organization(self, organization_id: int):
        return (
            self.db.query(RFP)
            .filter(RFP.organization_id == organization_id)
            .all()
        )