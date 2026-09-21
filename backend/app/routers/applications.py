import hashlib
import uuid
from typing import Literal
from uuid import UUID


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, select
from sqlalchemy.orm import Session



from app.auth import get_current_user
from app.database import get_db
from app.models import (
    Application,
    User,
    ApplicationEvent,
    ResumeMatch,
)
from app.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatus,
    ApplicationUpdate,
    DashboardFollowUpResponse,
    JobMatchResponse,
    ApplicationEventCreate,
    ApplicationEventResponse,
    ApplicationEventUpdate,
    ResumeMatchResponse,
)
from app.models.resume import Resume
from app.services.job_matcher import calculate_match
from app.services.llm_client import (
    analyze_with_ai,
    generate_application_insights_with_ai,
    generate_cover_letter_with_ai,
    generate_interview_prep_with_ai,
    is_ai_configured,
    recommend_application_priority_with_ai,
    tailor_resume_with_ai,
)
from app.schemas import JobMatchResponse
from app.services.job_analyzer import analyze_job_description_full
from app.services.application_insights import build_application_insights
from datetime import datetime, timedelta
from app.models.follow_up import FollowUp
from app.schemas import FollowUpCreate, FollowUpUpdate, FollowUpResponse

def get_priority_suggestion(score: int | None) -> str | None:
    if score is None:
        return None

    if score >= 90:
        return "high"

    if score >= 75:
        return "medium"

    return "low"
def calculate_jd_hash(jd_text: str) -> str:
    normalized = jd_text.strip()

    return hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()

router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)

@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = Application(
        user_id=current_user.id,
        company=application_data.company,
        role=application_data.role,
        jd_text=application_data.jd_text,
        jd_url=application_data.jd_url,
        status=application_data.status.value,
        priority=application_data.priority,
        date_applied=application_data.date_applied,
        deadline=application_data.deadline,
        notes=application_data.notes,
    )

    db.add(application)
    db.flush()

    event = ApplicationEvent(
        application_id=application.id,
        event_type="created",
        old_status=None,
        new_status=application.status,
        note="Application created.",
    )

    db.add(event)
    db.commit()
    db.refresh(application)

    return application

@router.get(
    "",
    response_model=list[ApplicationResponse],
)
def get_applications(
    status_filter: ApplicationStatus | None = Query(
        default=None,
        alias="status",
    ),
    priority: Literal["high", "medium", "low"] | None = None,
    sort_by: Literal[
        "created_at",
        "updated_at",
        "deadline",
        "date_applied",
        "company",
        "role",
        "priority",
    ] = "created_at",
    order: Literal["asc", "desc"] = "desc",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Application).where(
        Application.user_id == current_user.id
    )

    # Filter by status
    if status_filter is not None:
        query = query.where(
            Application.status == status_filter.value
        )
    # Filter by priority
    if priority is not None:
        query = query.where(
            Application.priority == priority
        )

    # Select the column to sort by
    sort_column = getattr(
        Application,
        sort_by,
    )

    # Apply sort direction
    # Select the sort order
    if sort_by == "priority":
        priority_order = {
            "high": 1,
            "medium": 2,
            "low": 3,
        }

        if order == "asc":
            query = query.order_by(
                case(
                    priority_order,
                    value=Application.priority,
                ).asc()
            )
        else:
            query = query.order_by(
                case(
                    priority_order,
                    value=Application.priority,
                ).desc()
            )
    else:
        sort_column = getattr(
            Application,
            sort_by,
        )

        if order == "asc":
            query = query.order_by(
                sort_column.asc()
            )
        else:
            query = query.order_by(
                sort_column.desc()
            )

    applications = db.scalars(query).all()

    return applications

@router.get(
    "/{application_id}/analyze-jd",
)
def analyze_application_jd(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    if not application.jd_text:
        raise HTTPException(
            status_code=400,
            detail="This application has no job description.",
        )

    return analyze_job_description_full(
        application.jd_text
    )

@router.post(
    "/{application_id}/tailor-resume/{resume_id}",
)
def tailor_application_resume(
    application_id: uuid.UUID,
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if not application.jd_text:
        raise HTTPException(
            status_code=400,
            detail="This application has no job description.",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="This resume has no extracted text.",
        )

    if not is_ai_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "AI resume tailoring is not configured. "
                "Please configure an AI provider first."
            ),
        )

    try:
        result = tailor_resume_with_ai(
            resume.extracted_text,
            application.jd_text,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI resume tailoring failed: {str(exc)}",
        )

    return result

@router.post("/{application_id}/cover-letter/{resume_id}")
def generate_cover_letter(
    application_id: UUID,
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not application.jd_text or not application.jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required",
        )

    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is not available",
        )

    if not is_ai_configured():
        raise HTTPException(
            status_code=503,
            detail="AI cover letter generation is not configured.",
        )

    try:
        result = generate_cover_letter_with_ai(
            resume_text=resume.extracted_text,
            job_description=application.jd_text,
            company=application.company,
            role=application.role,
        )

        return result

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate cover letter.",
        )

@router.post(
    "/{application_id}/follow-ups",
    response_model=FollowUpResponse,
)
def create_follow_up(
    application_id: UUID,
    follow_up: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    new_follow_up = FollowUp(
        application_id=application.id,
        scheduled_at=follow_up.scheduled_at,
        note=follow_up.note,
        status="pending",
    )

    db.add(new_follow_up)
    db.commit()
    db.refresh(new_follow_up)

    return new_follow_up

@router.get(
    "/{application_id}/follow-ups",
    response_model=list[FollowUpResponse],
)
def get_follow_ups(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    return (
        db.query(FollowUp)
        .filter(FollowUp.application_id == application.id)
        .order_by(FollowUp.scheduled_at.asc())
        .all()
    )

@router.patch(
    "/{application_id}/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse,
)
def update_follow_up(
    application_id: UUID,
    follow_up_id: UUID,
    follow_up_data: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    follow_up = (
        db.query(FollowUp)
        .filter(
            FollowUp.id == follow_up_id,
            FollowUp.application_id == application.id,
        )
        .first()
    )

    if not follow_up:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    if follow_up_data.scheduled_at is not None:
        follow_up.scheduled_at = follow_up_data.scheduled_at

    if follow_up_data.note is not None:
        follow_up.note = follow_up_data.note

    if follow_up_data.status is not None:
        if follow_up_data.status not in {"pending", "completed"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid follow-up status",
            )

        follow_up.status = follow_up_data.status

        if follow_up_data.status == "completed":
            follow_up.completed_at = datetime.utcnow()
        else:
            follow_up.completed_at = None

    db.commit()
    db.refresh(follow_up)

    return follow_up

@router.delete("/{application_id}/follow-ups/{follow_up_id}")
def delete_follow_up(
    application_id: UUID,
    follow_up_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    follow_up = (
        db.query(FollowUp)
        .filter(
            FollowUp.id == follow_up_id,
            FollowUp.application_id == application.id,
        )
        .first()
    )

    if not follow_up:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    db.delete(follow_up)
    db.commit()

    return {"message": "Follow-up deleted successfully"}


@router.get(
    "/follow-ups",
    response_model=list[DashboardFollowUpResponse],
)
def get_all_follow_ups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow_ups = (
        db.query(FollowUp, Application)
        .join(
            Application,
            FollowUp.application_id == Application.id,
        )
        .filter(
            Application.user_id == current_user.id,
        )
        .order_by(FollowUp.scheduled_at.asc())
        .all()
    )

    return [
        {
            "id": follow_up.id,
            "application_id": application.id,
            "company": application.company,
            "role": application.role,
            "scheduled_at": follow_up.scheduled_at,
            "note": follow_up.note,
            "status": follow_up.status,
            "completed_at": follow_up.completed_at,
        }
        for follow_up, application in follow_ups
    ]

@router.get("/follow-ups/reminders")
def get_follow_up_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    start_of_today = datetime(
        now.year,
        now.month,
        now.day,
    )
    end_of_today = start_of_today + timedelta(days=1)

    follow_ups = (
        db.query(FollowUp, Application)
        .join(Application, FollowUp.application_id == Application.id)
        .filter(
            Application.user_id == current_user.id,
            FollowUp.status == "pending",
            FollowUp.scheduled_at < end_of_today,
        )
        .order_by(FollowUp.scheduled_at.asc())
        .all()
    )

    reminders = []

    for follow_up, application in follow_ups:
        reminders.append(
            {
                "id": follow_up.id,
                "application_id": application.id,
                "company": application.company,
                "role": application.role,
                "scheduled_at": follow_up.scheduled_at,
                "note": follow_up.note,
                "overdue": follow_up.scheduled_at < start_of_today,
            }
        )

    return reminders


@router.post("/{application_id}/priority-recommendation")
def recommend_application_priority(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    if not is_ai_configured():
        raise HTTPException(
            status_code=503,
            detail="AI priority recommendation is not configured.",
        )

    match = (
        db.query(ResumeMatch)
        .filter(
            ResumeMatch.application_id == application.id,
        )
        .order_by(ResumeMatch.created_at.desc())
        .first()
    )

    match_data = match.match_data if match else {}

    application_data = {
        "company": application.company,
        "role": application.role,
        "status": (
            application.status.value
            if hasattr(application.status, "value")
            else application.status
        ),
        "current_priority": (
            application.priority.value
            if hasattr(application.priority, "value")
            else application.priority
        ),
        "date_applied": (
            application.date_applied.isoformat()
            if application.date_applied
            else None
        ),
        "deadline": (
            application.deadline.isoformat()
            if application.deadline
            else None
        ),
        "match_score": match_data.get("score"),
        "missing_skills": match_data.get("missing_skills", []),
        "missing_required_skills": match_data.get(
            "missing_required_skills",
            [],
        ),
        "matched_skills": match_data.get("matched_skills", []),
    }

    try:
        result = recommend_application_priority_with_ai(
            application_data
        )

        return result

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate priority recommendation.",
        )

    
    
@router.get(
    "/{application_id}/match/{resume_id}",
    response_model=JobMatchResponse,
)
def match_application(
    application_id: uuid.UUID,
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if not application.jd_text:
        raise HTTPException(
            status_code=400,
            detail="This application has no job description.",
        )

    if not resume.extracted_text:
        raise HTTPException(
            status_code=400,
            detail="This resume has no extracted text.",
        )

    match_result = calculate_match(
        resume.extracted_text,
        application.jd_text,
    )
        # Optional AI analysis
    match_result["ai_analysis"] = None

    if is_ai_configured():
        try:
            match_result["ai_analysis"] = analyze_with_ai(
                resume.extracted_text,
                application.jd_text,
            )
        except Exception:
            # AI failure should never break the core matching feature.
            match_result["ai_analysis"] = None

    matched_skills = match_result.get(
        "matched_skills",
        []
    )

    missing_skills = match_result.get(
        "missing_skills",
        []
    )

    score = match_result.get("score", 0)

    # Save complete match result
    resume_match = ResumeMatch(
        application_id=application.id,
        resume_id=resume.id,
        jd_hash=calculate_jd_hash(application.jd_text),
        score=score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        match_data=match_result,
    )

    db.add(resume_match)

    # Add timeline event
    matched_text = (
        ", ".join(matched_skills)
        if matched_skills
        else "None"
    )

    missing_text = (
        ", ".join(missing_skills)
        if missing_skills
        else "None"
    )

    event = ApplicationEvent(
        application_id=application.id,
        event_type="resume_match",
        old_status=None,
        new_status=None,
        note=(
            f"Resume analyzed: {resume.filename}. "
            f"Match score: {score}%. "
            f"Matched skills: {matched_text}. "
            f"Missing skills: {missing_text}."
        ),
    )

    db.add(event)

    db.commit()

    return match_result

@router.get("/{application_id}/match-default-resume")
def match_default_resume(
    application_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.user_id == current_user.id,
            Resume.is_default == True,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="No default resume selected.",
        )

    result = calculate_match(
        resume.extracted_text or "",
        application.jd_text or "",
    )

    return {
        "resume_id": resume.id,
        "resume_filename": resume.filename,
        "match": result,
    }

@router.get(
    "/{application_id}/matches/{match_id}",
    response_model=ResumeMatchResponse,
)
def get_resume_match(
    application_id: UUID,
    match_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    resume_match = db.scalar(
        select(ResumeMatch).where(
            ResumeMatch.id == match_id,
            ResumeMatch.application_id == application_id,
        )
    )

    if not resume_match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume match not found.",
        )

    return resume_match

@router.get(
    "/{application_id}/matches",
    response_model=list[ResumeMatchResponse],
)
def get_resume_matches(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    matches = db.scalars(
        select(ResumeMatch)
        .where(
            ResumeMatch.application_id == application_id
        )
        .order_by(ResumeMatch.created_at.desc())
    ).all()

    return matches

@router.post("/{application_id}/interview-prep/{resume_id}")
def generate_interview_prep(
    application_id: UUID,
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found",
        )

    if not application.jd_text or not application.jd_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description is required",
        )

    if not resume.extracted_text or not resume.extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text is not available",
        )

    if not is_ai_configured():
        raise HTTPException(
            status_code=503,
            detail="AI interview preparation is not configured.",
        )

    try:
        result = generate_interview_prep_with_ai(
            resume_text=resume.extracted_text,
            job_description=application.jd_text,
            company=application.company,
            role=application.role,
        )

        return result

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Failed to generate interview preparation.",
        )
    
@router.get(
    "/{application_id}/matches/check/{resume_id}",
)
def check_resume_match(
    application_id: UUID,
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    resume = db.scalar(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
    )

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    current_jd_hash = calculate_jd_hash(
        application.jd_text or ""
    )

    existing_match = db.scalar(
        select(ResumeMatch)
        .where(
            ResumeMatch.application_id == application_id,
            ResumeMatch.resume_id == resume_id,
            ResumeMatch.jd_hash == current_jd_hash,
        )
        .order_by(ResumeMatch.created_at.desc())
    )

    return {
        "exists": existing_match is not None,
        "match_id": (
            str(existing_match.id)
            if existing_match
            else None
        ),
    }
    
@router.get(
    "/{application_id}/matches",
)
def get_match_history(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    matches = (
        db.query(ResumeMatch)
        .filter(
            ResumeMatch.application_id == application_id
        )
        .order_by(ResumeMatch.created_at.desc())
        .all()
    )

    return matches

@router.get("/analytics/insights")
def get_application_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    applications = (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .all()
    )

    application_ids = [application.id for application in applications]

    matches = []

    if application_ids:
        matches = (
            db.query(ResumeMatch)
            .join(
                Application,
                ResumeMatch.application_id == Application.id,
            )
            .filter(
                Application.user_id == current_user.id,
                ResumeMatch.application_id.in_(application_ids),
            )
            .all()
        )

    insights = build_application_insights(
        applications=applications,
        matches=matches,
    )

    ai_insights = None

    if is_ai_configured():
        try:
            ai_insights = generate_application_insights_with_ai(
                insights
            )
        except Exception:
            ai_insights = None

    return {
        **insights,
        "ai_insights": ai_insights,
    }

@router.get("/{application_id}/timeline")
def get_application_timeline(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    events = db.scalars(
        select(ApplicationEvent)
        .where(
            ApplicationEvent.application_id
            == application_id
        )
        .order_by(
            ApplicationEvent.created_at.desc()
        )
    ).all()

    return events

@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    return application

@router.post(
    "/{application_id}/timeline",
    response_model=ApplicationEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_timeline_event(
    application_id: UUID,
    event_data: ApplicationEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    event = ApplicationEvent(
        application_id=application.id,
        event_type=event_data.event_type.value,
        old_status=None,
        new_status=None,
        note=event_data.note,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event
@router.delete(
    "/{application_id}/timeline/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_timeline_event(
    application_id: UUID,
    event_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    event = db.scalar(
        select(ApplicationEvent).where(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id,
        )
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timeline event not found.",
        )

    editable_types = {
        "note",
        "email",
        "call",
        "interview",
        "follow_up",
        "other",
    }

    if event.event_type not in editable_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This timeline event cannot be deleted.",
        )

    db.delete(event)
    db.commit()

@router.patch(
    "/{application_id}/timeline/{event_id}",
    response_model=ApplicationEventResponse,
)
def update_timeline_event(
    application_id: UUID,
    event_id: UUID,
    event_data: ApplicationEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    event = db.scalar(
        select(ApplicationEvent).where(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id,
        )
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Timeline event not found.",
        )

    editable_types = {
        "note",
        "email",
        "call",
        "interview",
        "follow_up",
        "other",
    }

    if event.event_type not in editable_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This timeline event cannot be edited.",
        )

    update_data = event_data.model_dump(
        exclude_unset=True
    )

    if "event_type" in update_data:
        update_data["event_type"] = (
            update_data["event_type"].value
        )

    for field, value in update_data.items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)

    return event

@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def update_application(
    application_id: UUID,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    update_data = application_data.model_dump(
        exclude_unset=True
    )

    old_status = application.status
    old_deadline = application.deadline

    status_changed = "status" in update_data
    deadline_changed = "deadline" in update_data

    if status_changed:
        update_data["status"] = update_data["status"].value

    for field, value in update_data.items():
        setattr(application, field, value)

    # Record status change
    if status_changed and old_status != application.status:
        db.add(
            ApplicationEvent(
                application_id=application.id,
                event_type="status_changed",
                old_status=old_status,
                new_status=application.status,
                note=(
                    f"Status changed from "
                    f"{old_status} to {application.status}."
                ),
            )
        )

    # Record deadline change
    if deadline_changed and old_deadline != application.deadline:
        db.add(
            ApplicationEvent(
                application_id=application.id,
                event_type="deadline_changed",
                old_status=None,
                new_status=None,
                note=(
                    f"Deadline changed from "
                    f"{old_deadline or 'none'} to "
                    f"{application.deadline or 'none'}."
                ),
            )
        )

    db.commit()
    db.refresh(application)

    return application
@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = db.scalar(
        select(Application).where(
            Application.id == application_id,
            Application.user_id == current_user.id,
        )
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found.",
        )

    db.delete(application)
    db.commit()

