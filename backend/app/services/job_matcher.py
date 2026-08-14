import re


SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "c",
    "c++",
    "c#",
    "react",
    "react.js",
    "next.js",
    "vue",
    "angular",
    "html",
    "css",
    "tailwind css",
    "node.js",
    "node",
    "express.js",
    "express",
    "fastapi",
    "flask",
    "django",
    "rest api",
    "rest apis",
    "graphql",
    "sql",
    "mysql",
    "postgresql",
    "postgres",
    "mongodb",
    "supabase",
    "prisma",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "linux",
    "unity",
    "lua",
    "figma",
}


# Skills that usually represent core technical requirements.
CORE_SKILLS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "c",
    "c++",
    "c#",
    "react",
    "next.js",
    "vue",
    "angular",
    "node.js",
    "express.js",
    "fastapi",
    "flask",
    "django",
}
SKILL_ALIASES = {
    "react": "react",
    "react.js": "react",

    "node": "node.js",
    "node.js": "node.js",

    "express": "express.js",
    "express.js": "express.js",

    "postgres": "postgresql",
    "postgresql": "postgresql",

    "rest api": "rest_api",
    "rest apis": "rest_api",

    "next.js": "next.js",
    "typescript": "typescript",
    "javascript": "javascript",

    "python": "python",
    "java": "java",

    "docker": "docker",
    "kubernetes": "kubernetes",

    "aws": "aws",
    "azure": "azure",
    "gcp": "gcp",

    "mongodb": "mongodb",
    "mysql": "mysql",
    "sql": "sql",

    "postgres": "postgresql",
    "supabase": "supabase",
    "prisma": "prisma",

    "tailwind css": "tailwind_css",

    "github": "github",
    "git": "git",

    "unity": "unity",
    "lua": "lua",
}


def normalize_text(text: str) -> str:
    text = text.lower()

    text = re.sub(
        r"[^a-z0-9+#.\s]",
        " ",
        text,
    )

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def skill_pattern(skill: str) -> str:
    return rf"(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])"


def extract_skills(text: str) -> set[str]:
    normalized = normalize_text(text)

    found = set()

    for skill in SKILLS:
        if re.search(skill_pattern(skill), normalized):
            canonical_skill = SKILL_ALIASES.get(
                skill,
                skill,
            )

            found.add(canonical_skill)

    return found

def extract_experience_years(text: str) -> float | None:
    normalized = normalize_text(text)

    patterns = [
        # "2+ years of experience"
        r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience",

        # "2+ years of hands-on experience"
        r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+of\s+[\w\s-]{0,40}experience",

        # "2+ years hands-on experience"
        r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+[\w\s-]{0,40}experience",

        # "experience: 2+ years"
        r"experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)",

        # "2 years experience"
        r"(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s+experience",
    ]

    matches = []

    for pattern in patterns:
        for match in re.finditer(pattern, normalized):
            matches.append(float(match.group(1)))

    if not matches:
        return None

    return max(matches)

def analyze_job_description(text: str) -> dict:
    normalized = normalize_text(text)

    required_skills, preferred_skills = extract_skill_sections(text)

    skills = required_skills | preferred_skills

    required_experience = extract_experience_years(text)

    seniority = None

    seniority_levels = [
        ("intern", ["intern", "internship"]),
        ("junior", ["junior", "entry level", "entry-level"]),
        ("mid", ["mid level", "mid-level", "midlevel"]),
        ("senior", ["senior", "sr."]),
        ("lead", ["lead", "team lead"]),
        ("principal", ["principal"]),
        ("staff", ["staff engineer", "staff developer"]),
    ]

    for level, keywords in seniority_levels:
        if any(keyword in normalized for keyword in keywords):
            seniority = level
            break

    education = None

    education_patterns = [
        r"\b(bachelor(?:'s)?|b\.?s\.?|b\.?e\.?|bca|btech)\b",
        r"\b(master(?:'s)?|m\.?s\.?|m\.?e\.?|mca|mtech)\b",
        r"\b(phd|doctorate)\b",
    ]

    for pattern in education_patterns:
        match = re.search(pattern, normalized)

        if match:
            education = match.group(1)
            break

    work_mode = None

    if re.search(r"\bremote\b", normalized):
        work_mode = "remote"
    elif re.search(r"\bhybrid\b", normalized):
        work_mode = "hybrid"
    elif re.search(
        r"\bon[- ]site\b|\bonsite\b",
        normalized,
    ):
        work_mode = "onsite"

    return {
        "skills": sorted(skills),
        "required_skills": sorted(required_skills),
        "preferred_skills": sorted(preferred_skills),
        "required_experience_years": required_experience,
        "seniority": seniority,
        "education": education,
        "work_mode": work_mode,
    }

def extract_skill_sections(text: str) -> tuple[set[str], set[str]]:
    """
    Detect skills mentioned in required and preferred sections
    of a job description.
    """

    normalized = normalize_text(text)

    required_skills = set()
    preferred_skills = set()

    # Look for required/must-have sections.
    required_patterns = [
        r"(?:requirements|required qualifications|required skills|must have|must-have)"
        r"(.*?)(?=(?:preferred qualifications|preferred skills|preferred|nice to have|nice-to-have|bonus|good to have|$))",
    ]

    # Look for preferred/nice-to-have sections.
    preferred_patterns = [
        r"(?:preferred qualifications|preferred skills|preferred|nice to have|nice-to-have|bonus|good to have)"
        r"(.*)$",
    ]

    for pattern in required_patterns:
        match = re.search(
            pattern,
            normalized,
            re.IGNORECASE | re.DOTALL,
        )

        if match:
            required_skills.update(
                extract_skills(match.group(1))
            )
            break

    for pattern in preferred_patterns:
        match = re.search(
            pattern,
            normalized,
            re.IGNORECASE | re.DOTALL,
        )

        if match:
            preferred_skills.update(
                extract_skills(match.group(1))
            )
            break

    # If no explicit sections were detected, treat all skills
    # as required so existing behavior remains safe.
    if not required_skills and not preferred_skills:
        required_skills = extract_skills(text)

    # A skill shouldn't appear in both categories.
    preferred_skills -= required_skills

    return required_skills, preferred_skills

def detect_resume_education(text: str) -> str | None:
    normalized = normalize_text(text)

    education_levels = [
        ("phd", [
            "phd",
            "doctorate",
            "doctoral",
        ]),
        ("master", [
            "master",
            "master's",
            "mca",
            "mtech",
            "m.s.",
            "m.e.",
        ]),
        ("bachelor", [
            "bachelor",
            "bachelor's",
            "bca",
            "btech",
            "b.s.",
            "b.e.",
        ]),
    ]

    for level, keywords in education_levels:
        for keyword in keywords:
            if keyword in normalized:
                return level

    return None

def calculate_skill_score(
    resume_skills: set[str],
    job_skills: set[str],
) -> tuple[float, set[str], set[str]]:
    if not job_skills:
        return 0, set(), set()

    matched = resume_skills.intersection(job_skills)
    missing = job_skills - resume_skills

    total_weight = 0
    matched_weight = 0

    for skill in job_skills:
        weight = 2 if skill in CORE_SKILLS else 1

        total_weight += weight

        if skill in matched:
            matched_weight += weight

    score = (
        matched_weight / total_weight * 100
        if total_weight
        else 0
    )

    return score, matched, missing


def calculate_match(
    resume_text: str,
    jd_text: str,
) -> dict:
    resume_normalized = normalize_text(resume_text)
    jd_normalized = normalize_text(jd_text)

    resume_skills = extract_skills(resume_text)
    job_analysis = analyze_job_description(jd_text)

    job_skills = set(job_analysis["skills"])
    required_skills = set(
        job_analysis["required_skills"]
    )

    preferred_skills = set(
        job_analysis["preferred_skills"]
    )
    
    matched_required_skills = (
        resume_skills & required_skills
    )

    missing_required_skills = (
        required_skills - resume_skills
    )

    matched_preferred_skills = (
        resume_skills & preferred_skills
    )

    missing_preferred_skills = (
        preferred_skills - resume_skills
    )

    required_skill_score = (
        round(
            len(matched_required_skills)
            / len(required_skills)
            * 100
        )
        if required_skills
        else 100
    )

    preferred_skill_score = (
        round(
            len(matched_preferred_skills)
            / len(preferred_skills)
            * 100
        )
        if preferred_skills
        else 100
    )

    skill_score = round(
        required_skill_score * 0.70
        + preferred_skill_score * 0.30
    )

    matched = matched_required_skills | matched_preferred_skills
    missing = missing_required_skills | missing_preferred_skills

    resume_experience = extract_experience_years(
        resume_text
    )

    required_experience = extract_experience_years(
        jd_text
    )
    resume_education = detect_resume_education(
        resume_text
    )

    required_education = job_analysis["education"]

    education_match = None

    if required_education is not None:
        if resume_education is None:
            education_match = False
        elif required_education == "bachelor":
            education_match = resume_education in {
                "bachelor",
                "master",
                "phd",
            }
        elif required_education == "master":
            education_match = resume_education in {
                "master",
                "phd",
            }
        elif required_education == "phd":
            education_match = resume_education == "phd"

    experience_match = None

    if required_experience is not None:
        if resume_experience is not None:
            experience_match = (
                resume_experience >= required_experience
            )
        else:
            experience_match = False

    # Basic keyword coverage.
    jd_words = {
        word
        for word in re.findall(
            r"\b[a-z]{4,}\b",
            jd_normalized,
        )
        if word not in {
            "with",
            "that",
            "this",
            "from",
            "have",
            "will",
            "your",
            "looking",
            "experience",
            "required",
            "years",
            "developer",
            "engineer",
        }
    }

    resume_words = set(
        re.findall(
            r"\b[a-z]{4,}\b",
            resume_normalized,
        )
    )

    keyword_matches = jd_words.intersection(
        resume_words
    )

    keyword_score = (
        len(keyword_matches) / len(jd_words) * 100
        if jd_words
        else 0
    )

    skill_component = round(skill_score)

    experience_component = 100

    if required_experience is not None:
        if experience_match:
            experience_component = 100
        else:
            experience_component = 0

    education_component = 100

    if required_education is not None:
        if education_match:
            education_component = 100
        else:
            education_component = 0

    # Final score:
    # 80% technical skills
    # 20% keyword coverage
    final_score = (
        skill_component * 0.50
        + experience_component * 0.20
        + education_component * 0.10
        + keyword_score * 0.20
    )

    final_score = max(
        0,
        min(
            100,
            round(final_score),
        ),
    )

    recommendations = []

    if missing_required_skills:
        for skill in sorted(missing_required_skills):
            recommendations.append(
                f"Required skill gap: {skill} is required for this position."
            )

    if missing_preferred_skills:
        for skill in sorted(missing_preferred_skills):
            recommendations.append(
                f"Nice-to-have: {skill} is listed as a preferred skill."
            )

    if experience_match is False:
        if required_experience is not None:
            recommendations.append(
                f"The job asks for approximately "
                f"{required_experience:g}+ years of experience."
            )

    if not recommendations:
        recommendations.append(
            "Your resume covers the main detected requirements."
        )

    return {
        "score": final_score,
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "resume_skills": sorted(resume_skills),
        "job_skills": sorted(job_skills),
        "resume_experience_years": resume_experience,
        "required_experience_years": required_experience,
        "experience_match": experience_match,
        "skill_score": skill_component,
        "required_skill_score": required_skill_score,
        "preferred_skill_score": preferred_skill_score,
        "experience_score": experience_component,
        "education_score": education_component,
        "keyword_score": round(keyword_score),
        "recommendations": recommendations,
        "seniority": job_analysis["seniority"],
        "required_education": job_analysis["education"],
        "work_mode": job_analysis["work_mode"],
        "resume_education": resume_education,
        "education_match": education_match,
        "required_skills": sorted(required_skills),
        "preferred_skills": sorted(preferred_skills),
        "matched_required_skills": sorted(
            matched_required_skills
        ),
        "missing_required_skills": sorted(
            missing_required_skills
        ),
        "matched_preferred_skills": sorted(
            matched_preferred_skills
        ),
        "missing_preferred_skills": sorted(
            missing_preferred_skills
        ),
    }