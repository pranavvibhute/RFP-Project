from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    rfp_id: Mapped[int] = mapped_column(
        ForeignKey("rfps.id"),
        nullable=False,
        unique=True,
    )

    executive_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    opportunity_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    submission_deadline: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    budget: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    overall_risk_score: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    analysis_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Completed",
    )

    ai_model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    processing_time_ms: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    confidence_score: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    raw_response: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    rfp = relationship(
        "RFP",
        back_populates="analysis",
    )

    requirements = relationship(
        "Requirement",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )