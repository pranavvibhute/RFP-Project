from datetime import datetime

from sqlalchemy import DateTime, Integer, String, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    industry: Mapped[str | None] = mapped_column(String(255), nullable=True)

    website: Mapped[str | None] = mapped_column(String(255), nullable=True)

    profile_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def get_profile_dict(self) -> dict:
        if self.profile_data and isinstance(self.profile_data, dict):
            return self.profile_data
        return {
            "name": self.name or "Apex Enterprise Solutions Inc.",
            "industry": self.industry or "Cloud & Defense Systems Modernization",
            "website": self.website or "https://apexsolutions.ai",
            "annual_revenue": "$45,000,000",
            "employee_count": 280,
            "certifications": [
                "ISO 27001",
                "SOC 2 Type II",
                "ISO 9001",
                "CMMI Level 3"
            ],
            "clearances": [
                "DoD Active Secret Facility Clearance (FCL)",
                "40 Cleared Engineers (Top Secret Eligible)"
            ],
            "core_skills": [
                "AWS GovCloud & Azure Government Architecture",
                "Kubernetes & Zero-Trust Cloud Infrastructure",
                "FedRAMP Security Hardening",
                "Legacy ERP & Database Modernization",
                "24/7/365 Tier-3 Incident Response & SLA Guarantees"
            ],
            "past_performance": [
                "US Department of Transportation Cloud Migration (35 workloads, on-time delivery)",
                "Riverdale Municipal Smart City IoT & Analytics Deployment",
                "State Health Authority HIPAA Compliant Data Lakehouse"
            ]
        }

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