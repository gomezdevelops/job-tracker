import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.access_token_expire_minutes
        ),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def create_pre_auth_token(
    user_id: str,
    challenge_id: str,
) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "challenge_id": challenge_id,
        "type": "otp_verification",
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.pre_auth_token_expire_minutes
        ),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_pre_auth_token(token: str) -> tuple[uuid.UUID, uuid.UUID]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        if payload.get("type") != "otp_verification":
            raise ValueError("Invalid token type")

        user_id = uuid.UUID(payload["sub"])
        challenge_id = uuid.UUID(payload["challenge_id"])

        return user_id, challenge_id

    except (JWTError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification session.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        if payload.get("type") != "access":
            raise credentials_exception

        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

        user_uuid = uuid.UUID(user_id)

    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = db.scalar(
        select(User).where(User.id == user_uuid)
    )

    if not user:
        raise credentials_exception

    return user