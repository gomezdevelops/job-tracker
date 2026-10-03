from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.follow_up import FollowUp
from app.models.notification import Notification
from app.models.user import User


def create_notification_if_missing(
    db: Session,
    *,
    user_id,
    notification_type: str,
    title: str,
    message: str,
    dedupe_key: str,
    application_id=None,
):
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.dedupe_key == dedupe_key,
        )
        .first()
    )

    if existing:
        return existing

    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        application_id=application_id,
        dedupe_key=dedupe_key,
    )

    db.add(notification)
    return notification


def generate_notifications(
    db: Session,
    current_user: User,
):
    now = datetime.utcnow()

    start_of_today = datetime(
        now.year,
        now.month,
        now.day,
    )

    end_of_today = start_of_today + timedelta(days=1)

    today = now.date()
    deadline_window = today + timedelta(days=4)
    # ---------------------------------------------------------
    # Follow-up notifications
    # ---------------------------------------------------------

    follow_ups = (
        db.query(FollowUp, Application)
        .join(
            Application,
            FollowUp.application_id == Application.id,
        )
        .filter(
            Application.user_id == current_user.id,
            FollowUp.status == "pending",
            FollowUp.scheduled_at < end_of_today,
        )
        .all()
    )

    for follow_up, application in follow_ups:

        if follow_up.scheduled_at < start_of_today:
            create_notification_if_missing(
                db,
                user_id=current_user.id,
                notification_type="follow_up_overdue",
                title="Overdue follow-up",
                message=(
                    f"Your follow-up for {application.company} "
                    f"({application.role}) is overdue."
                ),
                dedupe_key=f"follow-up-overdue:{follow_up.id}",
                application_id=application.id,
            )

        else:
            create_notification_if_missing(
                db,
                user_id=current_user.id,
                notification_type="follow_up_today",
                title="Follow-up due today",
                message=(
                    f"You have a follow-up scheduled today for "
                    f"{application.company} ({application.role})."
                ),
                dedupe_key=f"follow-up-today:{follow_up.id}:{start_of_today.date()}",
                application_id=application.id,
            )

    # ---------------------------------------------------------
    # Application deadline notifications
    # ---------------------------------------------------------

    applications = (
        db.query(Application)
        .filter(
            Application.user_id == current_user.id,
            Application.deadline.isnot(None),
            Application.deadline < deadline_window,
        )
        .all()
    )

    for application in applications:
        deadline = application.deadline

        if deadline < today:
            create_notification_if_missing(
                db,
                user_id=current_user.id,
                notification_type="deadline_overdue",
                title="Application deadline passed",
                message=(
                    f"The deadline for {application.company} "
                    f"({application.role}) has passed."
                ),
                dedupe_key=f"deadline-overdue:{application.id}:{deadline}",
                application_id=application.id,
            )

        elif deadline < today + timedelta(days=1):
            create_notification_if_missing(
                db,
                user_id=current_user.id,
                notification_type="deadline_today",
                title="Application deadline today",
                message=(
                    f"The deadline for {application.company} "
                    f"({application.role}) is today."
                ),
                dedupe_key=f"deadline-today:{application.id}:{deadline}",
                application_id=application.id,
            )

        else:
            create_notification_if_missing(
                db,
                user_id=current_user.id,
                notification_type="deadline_approaching",
                title="Application deadline approaching",
                message=(
                    f"The deadline for {application.company} "
                    f"({application.role}) is approaching."
                ),
                dedupe_key=f"deadline-approaching:{application.id}:{deadline}",
                application_id=application.id,
            )

    db.commit()