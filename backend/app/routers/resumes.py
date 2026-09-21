import uuid
import os
from pathlib import Path
from uuid import UUID
from sqlalchemy import func

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.resume import Resume
from app.models.resume_match import ResumeMatch
from app.models.user import User
from app.schemas import ResumeResponse
from fastapi.responses import FileResponse


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are currently supported.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    resume_id = uuid.uuid4()

    filename = file.filename or "resume.pdf"

    safe_filename = (
        f"{resume_id}_{filename}"
        .replace("/", "_")
        .replace("\\", "_")
    )

    file_path = UPLOAD_DIR / safe_filename

    file_path.write_bytes(contents)

    try:
        reader = PdfReader(str(file_path))

        extracted_text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        ).strip()

    except Exception:
        file_path.unlink(missing_ok=True)

        raise HTTPException(
            status_code=400,
            detail="Unable to read the PDF.",
        )

    resume = Resume(
        id=resume_id,
        user_id=current_user.id,
        filename=filename,
        file_path=str(file_path),
        extracted_text=extracted_text,
    )

    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get(
    "",
)
def get_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resumes = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
        .all()
    )

    results = []

    for resume in resumes:
        match_count = (
            db.query(ResumeMatch)
            .filter(
                ResumeMatch.resume_id == resume.id
            )
            .count()
        )

        results.append(
            {
                "id": resume.id,
                "file_path": resume.file_path,
                "extracted_text": resume.extracted_text,
                "uploaded_at": resume.uploaded_at,
                "filename": resume.filename,
                "user_id": resume.user_id,
                "created_at": resume.created_at,
                "is_default": resume.is_default,
                "file_size": resume.file_size,
                "match_count": match_count,
            }
        )

    return results

@router.get("/{resume_id}/file")
def get_resume_file(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    file_path = Path(resume.file_path)

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Resume file not found.",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=resume.filename,
    )

@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
)
def get_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    return resume


@router.delete(
    "/{resume_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resume(
    resume_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    file_path = Path(resume.file_path)

    if file_path.exists():
        file_path.unlink()

    db.delete(resume)
    db.commit()

    return None


@router.patch("/{resume_id}/default")
def set_default_resume(
    resume_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = (
        db.query(Resume)
        .filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id,
        )
        .first()
    )

    if resume is None:
        raise HTTPException(
            status_code=404,
            detail="Resume not found.",
        )

    if resume.is_default:
        return resume

    db.query(Resume).filter(
        Resume.user_id == current_user.id,
        Resume.id != resume_id,
    ).update(
        {Resume.is_default: False},
        synchronize_session=False,
    )

    resume.is_default = True

    db.commit()
    db.refresh(resume)

    return resume