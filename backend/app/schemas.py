import uuid
from datetime import datetime
from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str

class ApplicationStatus(str, Enum):
    SAVED = "saved"
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"


class ApplicationCreate(BaseModel):
    company: str
    role: str
    jd_text: str | None = None
    jd_url: str | None = None
    status: ApplicationStatus = ApplicationStatus.SAVED
    date_applied: date | None = None
    deadline: date | None = None
    notes: str | None = None
    priority: str = "medium"


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    jd_text: str | None = None
    jd_url: str | None = None
    status: ApplicationStatus | None = None
    date_applied: date | None = None
    deadline: date | None = None
    notes: str | None = None
    priority: str | None = None


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    company: str
    role: str
    jd_text: str | None
    jd_url: str | None
    priority: str
    status: ApplicationStatus
    date_applied: date | None
    deadline: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeResponse(BaseModel):
    id: uuid.UUID
    filename: str
    extracted_text: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobMatchResponse(BaseModel):
    score: int
    ai_analysis: dict | None = None
    matched_skills: list[str]
    missing_skills: list[str]
    resume_skills: list[str]
    job_skills: list[str]
    resume_experience_years: float | None
    required_experience_years: float | None
    experience_match: bool | None
    skill_score: int
    experience_score: int
    education_score: int
    keyword_score: int
    recommendations: list[str]
    seniority: str | None
    required_education: str | None
    work_mode: str | None
    resume_education: str | None
    education_match: bool | None
    required_skills: list[str]
    preferred_skills: list[str]
    matched_required_skills: list[str]
    missing_required_skills: list[str]
    matched_preferred_skills: list[str]
    missing_preferred_skills: list[str]
    required_skill_score: int
    preferred_skill_score: int

class ResumeMatchResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    resume_id: uuid.UUID
    score: int
    matched_skills: list[str]
    missing_skills: list[str]
    match_data: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ApplicationEventType(str, Enum):
    NOTE = "note"
    EMAIL = "email"
    CALL = "call"
    INTERVIEW = "interview"
    FOLLOW_UP = "follow_up"
    OTHER = "other"


class ApplicationEventCreate(BaseModel):
    event_type: ApplicationEventType = ApplicationEventType.NOTE
    note: str = Field(min_length=1, max_length=2000)
    
class ApplicationEventUpdate(BaseModel):
    event_type: ApplicationEventType | None = None
    note: str | None = Field(
        default=None,
        min_length=1,
        max_length=2000,
    )
class ApplicationEventResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    event_type: str
    old_status: str | None
    new_status: str | None
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)