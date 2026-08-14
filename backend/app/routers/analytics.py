from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Application, ResumeMatch, User

def get_priority_suggestion(score: int | None) -> str | None:
    if score is None:
        return None

    if score >= 90:
        return "high"

    if score >= 75:
        return "medium"

    return "low"

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    status_counts = db.execute(
        select(
            Application.status,
            func.count(Application.id),
        )
        .where(Application.user_id == current_user.id)
        .group_by(Application.status)
    ).all()

    counts = {
        status: count
        for status, count in status_counts
    }

    total_applications = sum(counts.values())

    upcoming_deadlines = db.scalar(
        select(func.count(Application.id))
        .where(
            Application.user_id == current_user.id,
            Application.deadline.is_not(None),
            Application.deadline >= date.today(),
        )
    )

    return {
        "total_applications": total_applications,
        "saved": counts.get("saved", 0),
        "applied": counts.get("applied", 0),
        "screening": counts.get("screening", 0),
        "interview": counts.get("interview", 0),
        "offer": counts.get("offer", 0),
        "rejected": counts.get("rejected", 0),
        "upcoming_deadlines": upcoming_deadlines or 0,
    }

@router.get("/matches")
def get_match_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    applications = db.scalars(
        select(Application)
        .where(
            Application.user_id == current_user.id
        )
    ).all()

    application_ids = [
        application.id
        for application in applications
    ]

    if not application_ids:
        return {
            "top_matches": [],
            "skill_gaps": [],
            "average_score": 0,
            "analyzed_applications": 0,
        }

    # Get all saved match analyses for this user's applications.
    matches = db.scalars(
        select(ResumeMatch)
        .where(
            ResumeMatch.application_id.in_(
                application_ids
            )
        )
        .order_by(
            ResumeMatch.created_at.desc()
        )
    ).all()

    # Keep only the latest analysis for each
    # application + resume combination.
    latest_matches = {}

    for match in matches:
        key = (
            match.application_id,
            match.resume_id,
        )

        if key not in latest_matches:
            latest_matches[key] = match

    application_map = {
        application.id: application
        for application in applications
    }

    top_matches = []

    for match in latest_matches.values():
        application = application_map.get(
            match.application_id
        )

        if not application:
            continue

        top_matches.append(
            {
                "application_id": str(
                    application.id
                ),
                "company": application.company,
                "role": application.role,
                "score": match.score,
                "suggested_priority": get_priority_suggestion(
                    match.score
                ),
                "current_priority": application.priority,
                "matched_skills": (
                    match.matched_skills or []
                ),
                "missing_skills": (
                    match.missing_skills or []
                ),
            }
        )

    # Highest scores first.
    top_matches.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    top_matches = top_matches[:10]

    # Count recurring missing skills.

    required_skill_counts = {}
    preferred_skill_counts = {}

    for match in latest_matches.values():
        match_data = match.match_data or {}

        for skill in match_data.get(
            "missing_required_skills",
            [],
        ):
            normalized_skill = skill.lower().strip()

            if not normalized_skill:
                continue

            required_skill_counts[normalized_skill] = (
                required_skill_counts.get(
                    normalized_skill,
                    0,
                )
                + 1
            )

        for skill in match_data.get(
            "missing_preferred_skills",
            [],
        ):
            normalized_skill = skill.lower().strip()

            if not normalized_skill:
                continue

            preferred_skill_counts[normalized_skill] = (
                preferred_skill_counts.get(
                    normalized_skill,
                    0,
                )
                + 1
            )

    required_skill_gaps = [
        {
            "skill": skill,
            "count": count,
            "type": "required",
        }
        for skill, count in required_skill_counts.items()
    ]

    preferred_skill_gaps = [
        {
            "skill": skill,
            "count": count,
            "type": "preferred",
        }
        for skill, count in preferred_skill_counts.items()
    ]

    required_skill_gaps.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    preferred_skill_gaps.sort(
        key=lambda item: item["count"],
        reverse=True,
    )

    required_skill_gaps = required_skill_gaps[:10]
    preferred_skill_gaps = preferred_skill_gaps[:10]

    scores = [
        match.score
        for match in latest_matches.values()
    ]

    average_score = (
        round(sum(scores) / len(scores))
        if scores
        else 0
    )

    score_distribution = {
        "90_100": 0,
        "75_89": 0,
        "60_74": 0,
        "below_60": 0,
    }

    for match in latest_matches.values():
        score = match.score

        if score >= 90:
            score_distribution["90_100"] += 1
        elif score >= 75:
            score_distribution["75_89"] += 1
        elif score >= 60:
            score_distribution["60_74"] += 1
        else:
            score_distribution["below_60"] += 1

    

    return {
        "top_matches": top_matches,
        "skill_gaps": {
            "required": required_skill_gaps,
            "preferred": preferred_skill_gaps,
        },
        "average_score": average_score,
        "analyzed_applications": len(
            latest_matches
        ),
        "score_distribution": score_distribution,
    }