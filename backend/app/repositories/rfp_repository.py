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