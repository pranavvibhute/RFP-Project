from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)

    website: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    users = relationship(
        "UserProfile",
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    rfps = relationship(
        "RFP",
        back_populates="organization",
        cascade="all, delete-orphan",
    )