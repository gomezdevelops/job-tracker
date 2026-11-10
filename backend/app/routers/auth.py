
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_pre_auth_token,
    decode_pre_auth_token,
    get_current_user,
    hash_password,
    oauth2_scheme,
    verify_password,
)
from app.database import get_db
from app.limiter import limiter
from app.models import EmailOTP, User
from app.schemas import (
    OTPChallengeResponse,
    OTPResendRequest,
    OTPVerifyRequest,
    Token,
    UserCreate,
    UserResponse,
)
from app.services.email_service import send_otp_email
from app.services.otp_service import (
    OTP_EXPIRY_MINUTES,
    OTP_RESEND_COOLDOWN_SECONDS,
    can_resend_otp,
    consume_otp,
    create_otp_challenge,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def deliver_otp_email(
    db: Session,
    challenge_id,
    recipient: str,
    otp: str,
) -> None:
    """Send an OTP after its database transaction has committed."""

    try:
        send_otp_email(recipient, otp)

    except Exception:
        db.rollback()

        challenge = db.get(EmailOTP, challenge_id)

        if challenge and not challenge.is_used:
            challenge.is_used = True
            db.commit()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send verification email. Please try again.",
        )


def build_challenge_response(
    user_id,
    challenge_id,
    message: str,
) -> OTPChallengeResponse:
    return OTPChallengeResponse(
        message=message,
        challenge_id=challenge_id,
        pre_auth_token=create_pre_auth_token(
            str(user_id),
            str(challenge_id),
        ),
        expires_in=OTP_EXPIRY_MINUTES * 60,
        resend_after=OTP_RESEND_COOLDOWN_SECONDS,
    )


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    existing_user = db.scalar(
        select(User).where(User.email == user_data.email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=OTPChallengeResponse,
)
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.scalar(
        select(User)
        .where(User.email == form_data.username)
        .with_for_update()
    )

    if not user or not verify_password(
        form_data.password,
        user.password_hash,
    ):
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    try:
        challenge_id, otp = create_otp_challenge(
            db,
            user.id,
        )

        user_id = user.id
        recipient = user.email

        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create verification challenge.",
        )

    deliver_otp_email(
        db,
        challenge_id,
        recipient,
        otp,
    )

    return build_challenge_response(
        user_id,
        challenge_id,
        "Verification code sent to your email.",
    )


@router.post(
    "/verify-otp",
    response_model=Token,
)
@limiter.limit("5/minute")
def verify_email_otp(
    request: Request,
    otp_data: OTPVerifyRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user_id, token_challenge_id = decode_pre_auth_token(token)

    if token_challenge_id != otp_data.challenge_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification session.",
        )

    try:
        is_valid = consume_otp(
            db=db,
            challenge_id=otp_data.challenge_id,
            user_id=user_id,
            submitted_otp=otp_data.otp,
        )

        # Commit even when verification fails, so attempts persist.
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to verify code.",
        )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    access_token = create_access_token(str(user_id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post(
    "/resend-otp",
    response_model=OTPChallengeResponse,
)
@limiter.limit("3/minute")
def resend_email_otp(
    request: Request,
    resend_data: OTPResendRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    user_id, token_challenge_id = decode_pre_auth_token(token)

    if token_challenge_id != resend_data.challenge_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification session.",
        )

    # Lock the user first to serialize concurrent login/resend requests.
    user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .with_for_update()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification session.",
        )

    existing_challenge = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.id == resend_data.challenge_id,
            EmailOTP.user_id == user_id,
            EmailOTP.is_used.is_(False),
        )
        .with_for_update()
    )

    if not existing_challenge:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification challenge.",
        )

    if not can_resend_otp(db, user_id):
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another code.",
        )

    try:
        challenge_id, otp = create_otp_challenge(
            db,
            user_id,
        )

        recipient = user.email

        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create a new verification challenge.",
        )

    deliver_otp_email(
        db,
        challenge_id,
        recipient,
        otp,
    )

    return build_challenge_response(
        user_id,
        challenge_id,
        "A new verification code has been sent.",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user
