import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JobIntelligence(Base):
    __tablename__ = "job_intelligence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    jd_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    required_skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    preferred_skills: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    technologies: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    responsibilities: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    keywords: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    required_experience_years: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    seniority: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    education: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    work_mode: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    ai_analysis: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    application = relationship("Application")