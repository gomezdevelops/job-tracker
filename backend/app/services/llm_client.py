import json
import os

from openai import OpenAI


AI_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string"
        },
        "strengths": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "weaknesses": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "missing_skills": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "resume_suggestions": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "interview_focus": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "recommendation": {
            "type": "string",
            "enum": [
                "strong_match",
                "good_match",
                "partial_match",
                "weak_match"
            ]
        }
    },
    "required": [
        "summary",
        "strengths",
        "weaknesses",
        "missing_skills",
        "resume_suggestions",
        "interview_focus",
        "recommendation"
    ],
    "additionalProperties": False
}


def is_ai_configured() -> bool:
    return bool(os.getenv("OPENAI_API_KEY"))


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")

    return OpenAI(api_key=api_key)


def analyze_with_ai(
    resume_text: str,
    job_description: str,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert technical recruiter and resume analyst. "
                    "Compare the candidate resume with the job description. "
                    "Only make claims supported by the provided text. "
                    "Identify genuine strengths, weaknesses, missing skills, "
                    "resume improvements, and likely interview focus areas."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Analyze this candidate for the job.\n\n"
                    "RESUME:\n"
                    f"{resume_text}\n\n"
                    "JOB DESCRIPTION:\n"
                    f"{job_description}"
                ),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "resume_job_analysis",
                "strict": True,
                "schema": AI_ANALYSIS_SCHEMA,
            }
        },
    )

    return json.loads(response.output_text)

def analyze_job_description_with_ai(
    job_description: str,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert technical recruiter and job description "
                    "analyst. Analyze the provided job description and extract "
                    "useful, factual information. Do not invent requirements "
                    "that are not supported by the job description."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Analyze this job description:\n\n"
                    f"{job_description}"
                ),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "job_description_analysis",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "summary": {
                            "type": "string"
                        },
                        "key_responsibilities": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "required_skills": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "preferred_skills": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "experience_requirement": {
                            "type": "string"
                        },
                        "seniority": {
                            "type": "string"
                        },
                        "education_requirement": {
                            "type": "string"
                        },
                        "work_mode": {
                            "type": "string"
                        },
                        "important_keywords": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },
                    "required": [
                        "summary",
                        "key_responsibilities",
                        "required_skills",
                        "preferred_skills",
                        "experience_requirement",
                        "seniority",
                        "education_requirement",
                        "work_mode",
                        "important_keywords"
                    ],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.output_text)

def tailor_resume_with_ai(
    resume_text: str,
    job_description: str,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert resume writer and ATS optimization specialist. "
                    "Tailor a candidate's resume toward a specific job description "
                    "without inventing experience, skills, education, employers, "
                    "achievements, or technologies. Only recommend changes supported "
                    "by the candidate's existing resume."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Tailor this resume for the job description.\n\n"
                    "RESUME:\n"
                    f"{resume_text}\n\n"
                    "JOB DESCRIPTION:\n"
                    f"{job_description}"
                ),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "resume_tailoring",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "professional_summary": {
                            "type": "string"
                        },
                        "skills_to_emphasize": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "ats_keywords": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "missing_keywords": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "experience_improvements": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "suggested_changes": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },
                    "required": [
                        "professional_summary",
                        "skills_to_emphasize",
                        "ats_keywords",
                        "missing_keywords",
                        "experience_improvements",
                        "suggested_changes"
                    ],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.output_text)

def generate_cover_letter_with_ai(
    resume_text: str,
    job_description: str,
    company: str,
    role: str,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an expert professional cover letter writer. "
                    "Write a concise, personalized cover letter based only "
                    "on the candidate's resume and the provided job description. "
                    "Never invent qualifications, experience, employers, "
                    "achievements, or technologies. Avoid generic filler."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Company: {company}\n"
                    f"Role: {role}\n\n"
                    "RESUME:\n"
                    f"{resume_text}\n\n"
                    "JOB DESCRIPTION:\n"
                    f"{job_description}"
                ),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "cover_letter",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "subject": {
                            "type": "string"
                        },
                        "cover_letter": {
                            "type": "string"
                        },
                        "key_points": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },
                    "required": [
                        "subject",
                        "cover_letter",
                        "key_points"
                    ],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.output_text)

def generate_application_insights_with_ai(
    applications_summary: dict,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an AI career application assistant. "
                    "Analyze job application tracking data and provide "
                    "practical, evidence-based recommendations. "
                    "Do not invent information that is not present in the data. "
                    "Do not make predictions about whether the user will get a job."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(applications_summary),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "application_insights",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "summary": {
                            "type": "string"
                        },
                        "recommendations": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "positive_patterns": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "areas_to_improve": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                        "next_actions": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        },
                    },
                    "required": [
                        "summary",
                        "recommendations",
                        "positive_patterns",
                        "areas_to_improve",
                        "next_actions",
                    ],
                    "additionalProperties": False,
                },
            }
        },
    )

    return json.loads(response.output_text)
def generate_interview_prep_with_ai(
    resume_text: str,
    job_description: str,
    company: str,
    role: str,
    skill_gaps: list[str] | None = None,
) -> dict:
    client = get_openai_client()

    prompt = {
        "company": company,
        "role": role,
        "resume": resume_text,
        "job_description": job_description,
        "skill_gaps": skill_gaps or [],
    }

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an AI interview preparation assistant. "
                    "Generate practical interview preparation based only on "
                    "the supplied resume and job description. "
                    "Do not invent experience or qualifications. "
                    "Include technical, behavioral, and role-specific questions. "
                    "Provide concise guidance for preparing each question."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(prompt),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "interview_prep",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "overview": {
                            "type": "string"
                        },
                        "technical_questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string"
                                    },
                                    "why_it_matters": {
                                        "type": "string"
                                    },
                                    "preparation_tip": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "question",
                                    "why_it_matters",
                                    "preparation_tip"
                                ],
                                "additionalProperties": False
                            }
                        },
                        "behavioral_questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string"
                                    },
                                    "preparation_tip": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "question",
                                    "preparation_tip"
                                ],
                                "additionalProperties": False
                            }
                        },
                        "role_specific_questions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "question": {
                                        "type": "string"
                                    },
                                    "preparation_tip": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "question",
                                    "preparation_tip"
                                ],
                                "additionalProperties": False
                            }
                        },
                        "skill_gap_topics": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            }
                        }
                    },
                    "required": [
                        "overview",
                        "technical_questions",
                        "behavioral_questions",
                        "role_specific_questions",
                        "skill_gap_topics"
                    ],
                    "additionalProperties": False
                }
            }
        }
    )

    return json.loads(response.output_text)

def recommend_application_priority_with_ai(
    application_data: dict,
) -> dict:
    client = get_openai_client()

    response = client.responses.create(
        model=os.getenv("OPENAI_MODEL", "gpt-5.6-luna"),
        input=[
            {
                "role": "system",
                "content": (
                    "You are an AI job application organization assistant. "
                    "Analyze the supplied application information and recommend "
                    "a practical priority level. "
                    "Base the recommendation only on the supplied information. "
                    "Do not predict whether the candidate will receive an offer. "
                    "Do not invent deadlines, qualifications, or company information."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(application_data),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "application_priority",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "recommended_priority": {
                            "type": "string",
                            "enum": [
                                "low",
                                "medium",
                                "high",
                            ],
                        },
                        "reason": {
                            "type": "string",
                        },
                        "urgency": {
                            "type": "string",
                            "enum": [
                                "low",
                                "medium",
                                "high",
                            ],
                        },
                        "actions": {
                            "type": "array",
                            "items": {
                                "type": "string",
                            },
                        },
                    },
                    "required": [
                        "recommended_priority",
                        "reason",
                        "urgency",
                        "actions",
                    ],
                    "additionalProperties": False,
                },
            },
        },
    )

    return json.loads(response.output_text)