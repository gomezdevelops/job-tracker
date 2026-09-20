from app.services.llm_client import is_ai_configured


def build_application_insights(
    applications,
    matches,
):
    total = len(applications)

    status_counts = {}
    priority_counts = {}

    for application in applications:
        status = application.status.value if hasattr(application.status, "value") else application.status
        priority = application.priority.value if hasattr(application.priority, "value") else application.priority

        status_counts[status] = status_counts.get(status, 0) + 1
        priority_counts[priority] = priority_counts.get(priority, 0) + 1

    scores = [
        match.match_data.get("score")
        for match in matches
        if match.match_data and match.match_data.get("score") is not None
    ]

    average_match_score = (
        round(sum(scores) / len(scores), 1)
        if scores
        else None
    )

    return {
        "total_applications": total,
        "status_counts": status_counts,
        "priority_counts": priority_counts,
        "average_match_score": average_match_score,
        "analyzed_applications": len(scores),
        "ai_configured": is_ai_configured(),
    }