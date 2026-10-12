import hashlib

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.job_intelligence import JobIntelligence
from app.services.job_analyzer import analyze_job_description_full
from app.services.job_text_extractor import (
    extract_keywords,
    extract_responsibilities,
)


def calculate_jd_hash(job_description: str) -> str:
    normalized = " ".join(job_description.split()).casefold()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()



def build_job_intelligence(job_description: str) -> dict:
    analysis = analyze_job_description_full(job_description)
    ai_analysis = analysis.get("ai_analysis") or {}

    return {
        "required_skills": analysis.get("required_skills", []),
        "preferred_skills": analysis.get("preferred_skills", []),
        "technologies": (
            ai_analysis.get("technologies")
            or analysis.get("skills", [])
        ),
        "responsibilities": (
            ai_analysis.get("responsibilities")
            or extract_responsibilities(job_description)
        ),
        "keywords": (
            ai_analysis.get("keywords")
            or extract_keywords(job_description)
        ),
        "required_experience_years": analysis.get(
            "required_experience_years"
        ),
        "seniority": analysis.get("seniority"),
        "education": analysis.get("education"),
        "work_mode": analysis.get("work_mode"),
        "ai_analysis": ai_analysis or None,
    }


def get_or_create_job_intelligence(
    db: Session,
    application: Application,
    force_refresh: bool = False,
) -> tuple[JobIntelligence, bool]:
    job_description = (application.jd_text or "").strip()

    if not job_description:
        raise ValueError("This application has no job description.")

    jd_hash = calculate_jd_hash(job_description)

    if not force_refresh:
        existing = (
            db.query(JobIntelligence)
            .filter(
                JobIntelligence.application_id == application.id,
                JobIntelligence.jd_hash == jd_hash,
            )
            .order_by(JobIntelligence.created_at.desc())
            .first()
        )

        if existing:
            return existing, True

    analysis = build_job_intelligence(job_description)

    record = JobIntelligence(
        application_id=application.id,
        jd_hash=jd_hash,
        **analysis,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record, False