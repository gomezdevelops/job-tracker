from app.services.job_matcher import analyze_job_description
from app.services.llm_client import (
    analyze_job_description_with_ai,
    is_ai_configured,
)


def analyze_job_description_with_rules(
    job_description: str,
) -> dict:
    analysis = analyze_job_description(job_description)

    return {
        "skills": analysis["skills"],
        "required_skills": analysis["required_skills"],
        "preferred_skills": analysis["preferred_skills"],
        "required_experience_years": analysis[
            "required_experience_years"
        ],
        "seniority": analysis["seniority"],
        "education": analysis["education"],
        "work_mode": analysis["work_mode"],
    }


def analyze_job_description_full(
    job_description: str,
) -> dict:
    rule_analysis = analyze_job_description_with_rules(
        job_description
    )

    ai_analysis = None

    if is_ai_configured():
        try:
            ai_analysis = analyze_job_description_with_ai(
                job_description
            )
        except Exception:
            ai_analysis = None

    return {
        **rule_analysis,
        "ai_analysis": ai_analysis,
    }