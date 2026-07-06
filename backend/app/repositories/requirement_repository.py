from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.repositories.base_repository import BaseRepository


class RequirementRepository(BaseRepository[Requirement]):
    """Repository class managing database operations for Requirement objects."""

    def __init__(self, db: Session):
        super().__init__(Requirement, db)

    def get_by_analysis_id(self, analysis_id: int) -> list[Requirement]:
        """Find all requirements extracted for a specific Analysis ID."""
        return (
            self.db.query(Requirement)
            .filter(Requirement.analysis_id == analysis_id)
            .all()
        )
