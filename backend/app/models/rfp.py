from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class RFP(Base):
    __tablename__ = "rfps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id"),
        nullable=False,
    )

    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("user_profiles.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    customer_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="RFP",
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Uploaded",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    organization = relationship("Organization", back_populates="rfps")

    uploader = relationship(
        "UserProfile",
        back_populates="uploaded_rfps",
    )

    analysis = relationship(
        "Analysis",
        back_populates="rfp",
        uselist=False,
        cascade="all, delete-orphan",
    )

    # Extracted document text
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Error message if processing fails
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)