from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base

class LocalCredential(Base):
    __tablename__ = "local_credentials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    user_profile_id: Mapped[int | None] = mapped_column(ForeignKey("user_profiles.id"), nullable=True)
