from sqlalchemy.orm import Session

from app.models.user_profile import UserProfile
from app.repositories.base_repository import BaseRepository


class UserProfileRepository(BaseRepository[UserProfile]):

    def __init__(self, db: Session):
        super().__init__(UserProfile, db)

    def get_by_auth_user_id(self, auth_user_id: str):
        return (
            self.db.query(UserProfile)
            .filter(UserProfile.auth_user_id == auth_user_id)
            .first()
        )
