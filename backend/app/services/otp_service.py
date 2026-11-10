import hashlib
import hmac
import secrets
import uuid

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import EmailOTP


OTP_EXPIRY_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    return hmac.new(
        settings.jwt_secret.encode("utf-8"),
        f"email-otp:{otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_otp(otp: str, stored_hash: str) -> bool:
    return hmac.compare_digest(
        hash_otp(otp),
        stored_hash,
    )


def get_otp_expiry() -> datetime:
    return utc_now() + timedelta(minutes=OTP_EXPIRY_MINUTES)


def create_otp_challenge(
    db: Session,
    user_id: uuid.UUID,
) -> tuple[uuid.UUID, str]:
    """Invalidate previous challenges and create a new OTP."""

    existing_otps = db.scalars(
        select(EmailOTP)
        .where(
            EmailOTP.user_id == user_id,
            EmailOTP.is_used.is_(False),
        )
        .with_for_update()
    ).all()

    for existing in existing_otps:
        existing.is_used = True

    otp = generate_otp()

    challenge = EmailOTP(
        user_id=user_id,
        otp_hash=hash_otp(otp),
        expires_at=get_otp_expiry(),
        attempts=0,
        is_used=False,
    )

    db.add(challenge)
    db.flush()

    return challenge.id, otp


def can_resend_otp(
    db: Session,
    user_id: uuid.UUID,
) -> bool:
    latest = db.scalar(
        select(EmailOTP)
        .where(EmailOTP.user_id == user_id)
        .order_by(EmailOTP.created_at.desc())
        .limit(1)
    )

    if not latest:
        return True

    return utc_now() >= (
        latest.created_at
        + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
    )



def consume_otp(
    db: Session,
    challenge_id: uuid.UUID,
    user_id: uuid.UUID,
    submitted_otp: str,
) -> bool:
    """Verify and atomically consume one specific OTP challenge."""

    challenge = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.id == challenge_id,
            EmailOTP.user_id == user_id,
            EmailOTP.is_used.is_(False),
        )
        .with_for_update()
    )

    if not challenge:
        return False

    if challenge.expires_at <= utc_now():
        challenge.is_used = True
        db.flush()
        return False

    if challenge.attempts >= OTP_MAX_ATTEMPTS:
        challenge.is_used = True
        db.flush()
        return False

    challenge.attempts += 1

    if not verify_otp(submitted_otp, challenge.otp_hash):
        if challenge.attempts >= OTP_MAX_ATTEMPTS:
            challenge.is_used = True

        db.flush()
        return False

    challenge.is_used = True
    db.flush()

    return True
