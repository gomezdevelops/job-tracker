import re


STOPWORDS = {
    "about", "after", "also", "been", "being", "both", "could",
    "each", "from", "have", "into", "more", "most", "must",
    "only", "other", "over", "such", "than", "that", "their",
    "them", "then", "there", "these", "they", "this", "those",
    "through", "under", "very", "what", "when", "where", "which",
    "while", "with", "will", "your", "you", "able", "across",
    "within", "including", "using", "role", "responsibilities",
    "requirements", "required", "preferred", "qualification",
    "qualifications", "experience", "candidate", "candidates",
    "team", "teams", "company", "position", "and", "are", "for",
    "the", "is", "in", "of", "to", "as", "an", "on", "by",
    "at", "or", "be", "it", "its", "not", "we", "our", "you'll",
    "has", "had", "was", "were", "year", "years",
    "applications", "build", "develop", "looking", "modern",
}

RESPONSIBILITY_HEADINGS = re.compile(
    r"(?im)^\s*(?:key\s+)?"
    r"(?:responsibilities|what you(?:'ll| will) do|"
    r"what you will be doing|duties|role overview|"
    r"job responsibilities)\s*:?\s*$"
)

SECTION_HEADINGS = re.compile(
    r"(?im)^\s*(?:requirements|required qualifications|"
    r"preferred qualifications|qualifications|skills|"
    r"what we're looking for|what we are looking for|"
    r"about us|about the company|benefits|nice to have|"
    r"what you'll bring|what you will bring)\s*:?\s*$"
)


def extract_responsibilities(text: str) -> list[str]:
    """Extract bullet points under recognizable responsibility headings."""
    lines = text.splitlines()
    responsibilities = []
    in_section = False

    for line in lines:
        stripped = line.strip()

        if not stripped:
            continue

        if RESPONSIBILITY_HEADINGS.match(stripped):
            in_section = True
            continue

        if in_section and SECTION_HEADINGS.match(stripped):
            break

        if in_section:
            cleaned = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s*", "", stripped)

            if cleaned and len(cleaned) >= 12:
                responsibilities.append(cleaned)

    # Remove duplicates while preserving order.
    return list(dict.fromkeys(responsibilities))[:15]



def extract_keywords(
    text: str,
    limit: int = 20,
) -> list[str]:
    """Extract meaningful terms and technical phrases from a job description."""
    normalized = text.lower()

    phrases = [
        "rest api",
        "rest apis",
        "continuous integration",
        "continuous deployment",
        "machine learning",
        "problem solving",
        "version control",
        "unit testing",
        "automated testing",
        "api development",
        "database design",
        "cloud computing",
        "software development",
        "agile development",
        "ci/cd",
    ]

    found_phrases = [
        phrase
        for phrase in phrases
        if re.search(
            rf"(?<!\w){re.escape(phrase)}(?!\w)",
            normalized,
        )
    ]

    # Avoid showing individual words already represented by a phrase.
    phrase_words = {
        word
        for phrase in found_phrases
        for word in phrase.split()
    }

    words = re.findall(r"\b[a-z][a-z0-9+#.-]{2,}\b", normalized)

    counts = {}

    for word in words:
        if word in STOPWORDS or word in phrase_words:
            continue

        counts[word] = counts.get(word, 0) + 1

    ranked_words = sorted(
        counts,
        key=lambda word: (-counts[word], word),
    )

    return (found_phrases + ranked_words)[:limit]
