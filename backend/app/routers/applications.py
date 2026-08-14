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
    JobMatchResponse,
    ApplicationEventCreate,
    ApplicationEventResponse,
    ApplicationEventUpdate,
    ResumeMatchResponse,
)
from app.models.resume import Resume
from app.services.job_matcher import calculate_match
from app.schemas import JobMatchResponse

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

