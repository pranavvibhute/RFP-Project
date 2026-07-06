from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.repositories.base_repository import BaseRepository


class AnalysisRepository(BaseRepository[Analysis]):
    """Repository class managing database operations for Analysis objects."""

    def __init__(self, db: Session):
        super().__init__(Analysis, db)

    def get_by_rfp_id(self, rfp_id: int) -> Analysis | None:
        """Find an analysis record by its associated RFP ID."""
        return (
            self.db.query(Analysis)
            .filter(Analysis.rfp_id == rfp_id)
            .first()
        )
