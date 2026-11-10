
import uuid
import logging
from io import BytesIO
from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import Response
from pypdf import PdfReader
from sqlalchemy.orm import Session
from vercel import blob

from app.auth import get_current_user
from app.database import get_db
from app.models.resume import Resume
from app.models.resume_match import ResumeMatch
from app.models.user import User
from app.schemas import ResumeResponse

router = APIRouter(prefix="/resumes", tags=["Resumes"])

logger = logging.getLogger(__name__)

MAX_RESUME_SIZE = 4 * 1024 * 1024  # 4 MB


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

    contents = await file.read(MAX_RESUME_SIZE + 1)

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Resume file must be smaller than 4 MB.",
        )

    filename = Path(file.filename or "resume.pdf").name

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are supported.",
        )

    resume_id = uuid.uuid4()
    pathname = f"resumes/{current_user.id}/{resume_id}.pdf"

    try:
        reader = PdfReader(BytesIO(contents))

        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="Password-protected PDFs are not supported.",
            )

        extracted_text = "\n".join(
            page.extract_text() or ""
            for page in reader.pages
        ).strip()

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the PDF.",
        )

    try:
        upload_result = await blob.put_blob(
            pathname,
            contents,
            access="private",
            content_type="application/pdf",
            add_random_suffix=False,
            allow_overwrite=False,
        )

        resume = Resume(
            id=resume_id,
            user_id=current_user.id,
            filename=filename,
            file_path=upload_result.url,
            extracted_text=extracted_text,
            file_size=len(contents),
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        return resume

    except HTTPException:
        raise
    except Exception:
        db.rollback()

        try:
            if "upload_result" in locals():
                await blob.delete_blob(
                    upload_result.url,
                )
        except Exception:
            logger.exception("Failed to clean up uploaded resume blob")

        logger.exception("Resume upload failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to upload resume.",
        )


@router.get("")
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
            .filter(ResumeMatch.resume_id == resume.id)
            .count()
        )

        results.append({
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
        })

    return results


@router.get("/{resume_id}/file")
async def get_resume_file(
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

    try:
        result = await blob.get_blob(
            resume.file_path,
            access="private",
        )

        return Response(
            content=result.body,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'inline; filename="{resume.filename}"'
                ),
                "Content-Length": str(len(result.body)),
                "Cache-Control": "private, no-store",
            },
        )

    except Exception:
        logger.exception("Resume download failed")

        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve resume from storage.",
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
async def delete_resume(
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

    try:
        await blob.delete_blob(
            resume.file_path,
        )
    except Exception:
        logger.exception("Resume Blob deletion failed")

        raise HTTPException(
            status_code=502,
            detail="Unable to delete resume file from storage.",
        )

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
