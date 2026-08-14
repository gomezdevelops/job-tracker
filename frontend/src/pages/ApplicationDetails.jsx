import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

const initialForm = {
  company: "",
  role: "",
  jd_text: "",
  jd_url: "",
  status: "saved",
  date_applied: "",
  deadline: "",
  notes: "",
};

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [matchResult, setMatchResult] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [loadingSavedMatch, setLoadingSavedMatch] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loadingMatchHistory, setLoadingMatchHistory] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [comparisonMatch, setComparisonMatch] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [activityNote, setActivityNote] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingType, setEditingType] = useState("note");
  const [editingNote, setEditingNote] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    async function loadResumes() {
        try {
        const response = await api.get("/resumes");
        setResumes(response.data);

        if (response.data.length > 0) {
            setSelectedResume(response.data[0].id);
        }
        } catch (error) {
        console.error("Unable to load resumes:", error);
        }
    }

    loadResumes();
    }, []);
  useEffect(() => {
    async function loadApplication() {
      try {
        const response = await api.get(
          `/applications/${id}`
        );

        const application = response.data;

        setForm({
          company: application.company ?? "",
          role: application.role ?? "",
          jd_text: application.jd_text ?? "",
          jd_url: application.jd_url ?? "",
          status: application.status ?? "saved",
          date_applied: application.date_applied ?? "",
          deadline: application.deadline ?? "",
          notes: application.notes ?? "",
        });
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.detail ||
            "Unable to load application."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [id]);

  useEffect(() => {
    loadMatchHistory();
  }, [id]);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const response = await api.get(
          `/applications/${id}/timeline`
        );

        setTimeline(response.data);
      } catch (error) {
        console.error(
          "Unable to load application timeline:",
          error
        );
      } finally {
        setTimelineLoading(false);
      }
    }

    loadTimeline();
  }, [id]);

  useEffect(() => {
    async function loadMatchHistory() {
      try {
        const response = await api.get(
          `/applications/${id}/matches`
        );

        setMatchHistory(response.data);
      } catch (error) {
        console.error(
          "Unable to load match history:",
          error
        );
      } finally {
        setLoadingMatchHistory(false);
      }
    }

    loadMatchHistory();
  }, [id]);

  function getMatchChanges(current, previous) {
    if (!current || !previous) {
      return null;
    }

    const currentData = current.match_data || {};
    const previousData = previous.match_data || {};

    const currentMatched = new Set(
      current.matched_skills || []
    );

    const previousMatched = new Set(
      previous.matched_skills || []
    );

    const currentMissing = new Set(
      current.missing_skills || []
    );

    const previousMissing = new Set(
      previous.missing_skills || []
    );

    const newlyMatched = [...currentMatched].filter(
      (skill) => !previousMatched.has(skill)
    );

    const noLongerMatched = [...previousMatched].filter(
      (skill) => !currentMatched.has(skill)
    );

    const newlyMissing = [...currentMissing].filter(
      (skill) => !previousMissing.has(skill)
    );

    const resolvedMissing = [...previousMissing].filter(
      (skill) => !currentMissing.has(skill)
    );

    const scoreChange =
      (current.score || 0) - (previous.score || 0);

    return {
      scoreChange,
      newlyMatched,
      noLongerMatched,
      newlyMissing,
      resolvedMissing,
      technicalSkillChange:
        (currentData.skill_score || 0) -
        (previousData.skill_score || 0),
      experienceChange:
        (currentData.experience_score || 0) -
        (previousData.experience_score || 0),
      educationChange:
        (currentData.education_score || 0) -
        (previousData.education_score || 0),
      keywordChange:
        (currentData.keyword_score || 0) -
        (previousData.keyword_score || 0),
    };
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const updated = {
        ...current,
        [name]: value,
      };

      if (
        name === "status" &&
        value === "applied" &&
        !current.date_applied
      ) {
        updated.date_applied = new Date()
          .toISOString()
          .split("T")[0];
      }

      return updated;
    });

    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        company: form.company.trim(),
        role: form.role.trim(),
        jd_text: form.jd_text.trim() || null,
        jd_url: form.jd_url.trim() || null,
        status: form.status,
        date_applied: form.date_applied || null,
        deadline: form.deadline || null,
        notes: form.notes.trim() || null,
      };

      await api.patch(
        `/applications/${id}`,
        payload
      );

      setSuccess("Application updated successfully.");
    } catch (error) {
      console.error(error);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setError(
          detail || "Unable to update application."
        );
      }
    } finally {
      setSaving(false);
    }
  }
  async function loadMatchHistory() {
    setLoadingMatchHistory(true);

    try {
      const response = await api.get(
        `/applications/${id}/matches`
      );

      setMatchHistory(response.data);
    } catch (error) {
      console.error("Unable to load match history:", error);
    } finally {
      setLoadingMatchHistory(false);
    }
  }

  async function handleMatch() {
    if (!selectedResume) {
      setMatchError("Please select a resume first.");
      return;
    }

    if (!form.jd_text.trim()) {
      setMatchError(
        "Add a job description before analyzing the match."
      );
      return;
    }

    setMatching(true);
    setMatchError("");
    setMatchResult(null);

    try {
      // Check whether this exact resume + job description
      // already has a saved analysis.
      const checkResponse = await api.get(
        `/applications/${id}/matches/check/${selectedResume}`
      );

      if (checkResponse.data.exists) {
        const savedResponse = await api.get(
          `/applications/${id}/matches/${checkResponse.data.match_id}`
        );

        setMatchResult(savedResponse.data.match_data);

        return;
      }

      // No matching cached analysis exists.
      // Run a new analysis.
      const response = await api.get(
        `/applications/${id}/match/${selectedResume}`
      );

      setMatchResult(response.data);

      // Refresh history.
      await loadMatchHistory();
    } catch (error) {
      console.error(error);

      setMatchError(
        error.response?.data?.detail ||
          "Unable to analyze resume match."
      );
    } finally {
      setMatching(false);
    }
  }
  async function handleReanalyze() {
    if (!selectedResume) {
      setMatchError("Please select a resume first.");
      return;
    }

    if (!form.jd_text.trim()) {
      setMatchError(
        "Add a job description before analyzing the match."
      );
      return;
    }

    setMatching(true);
    setMatchError("");
    setMatchResult(null);

    try {
      // Always run a fresh analysis.
      // We intentionally do NOT check the cache here.
      const response = await api.get(
        `/applications/${id}/match/${selectedResume}`
      );

      setMatchResult(response.data);

      // Refresh saved match history.
      await loadMatchHistory();
    } catch (error) {
      console.error(error);

      setMatchError(
        error.response?.data?.detail ||
          "Unable to re-analyze resume match."
      );
    } finally {
      setMatching(false);
    }
  }
  async function handleViewMatch(matchId) {
    setLoadingSavedMatch(true);

    try {
      const response = await api.get(
        `/applications/${id}/matches/${matchId}`
      );

      setSelectedMatch(response.data);
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to load saved analysis."
      );
    } finally {
      setLoadingSavedMatch(false);
    }
  }
  async function handleAddActivity(event) {
    event.preventDefault();

    const note = activityNote.trim();

    if (!note) {
      return;
    }

    setAddingActivity(true);
    setActivityError("");

    try {
      const response = await api.post(
        `/applications/${id}/timeline`,
        {
          event_type: activityType,
          note,
        }
      );

      setTimeline((current) => [
        response.data,
        ...current,
      ]);

      setActivityNote("");
      setActivityType("note");
    } catch (error) {
      console.error(error);

      setActivityError(
        error.response?.data?.detail ||
          "Unable to add activity."
      );
    } finally {
      setAddingActivity(false);
    }
  }

  async function handleDeleteActivity(eventId) {
    const confirmed = window.confirm(
      "Delete this activity?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/applications/${id}/timeline/${eventId}`
      );

      setTimeline((current) =>
        current.filter(
          (event) => event.id !== eventId
        )
      );
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to delete activity."
      );
    }
  }

  async function handleEditActivity(eventId) {
    const note = editingNote.trim();

    if (!note) {
      return;
    }

    setSavingEdit(true);

    try {
      const response = await api.patch(
        `/applications/${id}/timeline/${eventId}`,
        {
          event_type: editingType,
          note,
        }
      );

      setTimeline((current) =>
        current.map((event) =>
          event.id === eventId
            ? response.data
            : event
        )
      );

      setEditingEventId(null);
      setEditingNote("");
      setEditingType("note");
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Unable to update activity."
      );
    } finally {
      setSavingEdit(false);
    }
  }
  function startEditingActivity(event) {
    setEditingEventId(event.id);
    setEditingType(event.event_type);
    setEditingNote(event.note || "");
  }
    

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this application?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/applications/${id}`);
      navigate("/applications");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to delete application."
      );

      setDeleting(false);
    }
  }


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading application...
        </p>
      </div>
    );
  }

  if (error && !form.company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-red-400">{error}</p>

          <Link
            to="/applications"
            className="mt-6 inline-block rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            ← Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            to="/applications"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Applications
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div>
          <p className="text-sm text-blue-400">
            {statusLabels[form.status]}
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            {form.role || "Application"}
          </h1>

          <p className="mt-2 text-slate-400">
            {form.company}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-900 bg-green-950/40 px-4 py-3 text-sm text-green-300">
              {success}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Company *
              </label>

              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role *
              </label>

              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Date Applied
              </label>

              <input
                type="date"
                name="date_applied"
                value={form.date_applied}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Deadline
              </label>

              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
              {form.deadline &&
                (() => {
                  const deadlineInfo =
                    getDeadlineInfo(form.deadline);

                  return deadlineInfo ? (
                    <div className="mt-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${deadlineInfo.badgeClassName}`}
                      >
                        {deadlineInfo.label}
                      </span>
                    </div>
                  ) : null;
                })()}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Job URL
              </label>

              <input
                type="url"
                name="jd_url"
                value={form.jd_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Job Description
            </label>

            <textarea
              name="jd_text"
              value={form.jd_text}
              onChange={handleChange}
              rows={8}
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              placeholder="Add notes..."
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-900 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:opacity-50"
            >
              {deleting
                ? "Deleting..."
                : "Delete Application"}
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/applications"
                className="rounded-lg border border-slate-700 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div>
            <h2 className="text-xl font-semibold">
            Resume Match
            </h2>

            <p className="mt-1 text-sm text-slate-500">
            Compare a resume against this job description.
            </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <select
            value={selectedResume}
            onChange={(event) => {
                setSelectedResume(event.target.value);
                setMatchResult(null);
                setMatchError("");
            }}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
            <option value="">
                Select a resume
            </option>

            {resumes.map((resume) => (
                <option
                key={resume.id}
                value={resume.id}
                >
                {resume.filename}
                </option>
            ))}
            </select>

            <button
            type="button"
            onClick={handleMatch}
            disabled={
                matching ||
                !selectedResume ||
                !form.jd_text
            }
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
            {matching
                ? "Analyzing..."
                : "Analyze Match"}
            </button>
            <button
              type="button"
              onClick={handleReanalyze}
              disabled={matching || !selectedResume}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {matching ? "Analyzing..." : "Re-analyze"}
            </button>
        </div>

        {!form.jd_text && (
            <p className="mt-3 text-sm text-yellow-400">
            Add a job description before analyzing the match.
            </p>
        )}

        {matchError && (
            <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {matchError}
            </div>
        )}

        {matchResult && (
          <div className="mt-8 space-y-6">

            {/* Match Score */}
            <div className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:flex-row sm:items-center">
              {(() => {
                const score = matchResult.score ?? 0;

                const scoreInfo =
                  score >= 80
                    ? {
                        label: "Excellent Match",
                        color: "text-green-400",
                        border: "border-green-500",
                        bg: "bg-green-950/20",
                      }
                    : score >= 60
                    ? {
                        label: "Good Match",
                        color: "text-yellow-400",
                        border: "border-yellow-500",
                        bg: "bg-yellow-950/20",
                      }
                    : score >= 40
                    ? {
                        label: "Needs Improvement",
                        color: "text-orange-400",
                        border: "border-orange-500",
                        bg: "bg-orange-950/20",
                      }
                    : {
                        label: "Low Match",
                        color: "text-red-400",
                        border: "border-red-500",
                        bg: "bg-red-950/20",
                      };

                return (
                  <>
                    {/* Score Circle */}
                    <div
                      className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-8 ${scoreInfo.border} ${scoreInfo.bg}`}
                    >
                      <div className="text-center">
                        <p
                          className={`text-3xl font-bold ${scoreInfo.color}`}
                        >
                          {score}%
                        </p>

                        <p className="text-xs text-slate-500">
                          Match Score
                        </p>
                      </div>
                    </div>

                    {/* Score Information */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold">
                          Resume Compatibility
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${scoreInfo.bg} ${scoreInfo.color}`}
                        >
                          {scoreInfo.label}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-400">
                        Your resume matches{" "}
                        <span className="font-semibold text-white">
                          {score}%
                        </span>{" "}
                        of the detected requirements for this job.
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Keyword coverage:{" "}
                        <span className="text-slate-300">
                          {matchResult.keyword_score ?? 0}%
                        </span>
                      </p>

                      {/* Quick Summary */}
                      <div className="mt-4 flex flex-wrap gap-3 text-sm">
                        <span className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                          Matched:{" "}
                          <span className="font-medium text-green-400">
                            {matchResult.matched_skills?.length ?? 0}
                          </span>
                        </span>

                        <span className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                          Missing:{" "}
                          <span className="font-medium text-red-400">
                            {matchResult.missing_skills?.length ?? 0}
                          </span>
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <h2 className="text-lg font-semibold">
                  Resume Match History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Previous resume analyses for this application.
                </p>
              </div>

              {loadingMatchHistory ? (
                <p className="mt-6 text-sm text-slate-500">
                  Loading match history...
                </p>
              ) : matchHistory.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-950 p-6 text-center">
                  <p className="text-slate-400">
                    No previous analyses.
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Analyze a resume to create your first match record.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {matchHistory.map((match, index) => (
                    <button
                      type="button"
                      key={match.id}
                      onClick={() => handleViewMatch(match.id)}
                      className="w-full text-left flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-600 hover:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-300">
                            Analysis #{matchHistory.length - index}
                          </span>

                          {index === 0 && (
                            <span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs text-blue-300">
                              Latest
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {formatDateTime(match.created_at)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-950 px-3 py-1 text-xs text-green-300">
                            {match.matched_skills?.length || 0} matched
                          </span>

                          <span className="rounded-full bg-red-950 px-3 py-1 text-xs text-red-300">
                            {match.missing_skills?.length || 0} missing
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-left sm:text-right">
                        <div>
                          <p className="text-3xl font-bold">
                            {match.score}%
                          </p>

                          <p className="text-xs text-slate-500">
                            Match Score
                          </p>
                        </div>

                        {index < matchHistory.length - 1 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setComparisonMatch({
                                current: match,
                                previous: matchHistory[index + 1],
                              });
                            }}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 hover:text-white"
                          >
                            Compare
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            
            

            {/* Skills */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Matched */}
              <div className="rounded-2xl border border-green-900/50 bg-green-950/20 p-6">
                <h3 className="font-semibold text-green-400">
                  Matched Skills
                </h3>

                {matchResult.matched_skills.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No matching skills detected.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {matchResult.matched_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-green-800 bg-green-950/40 px-3 py-1.5 text-sm text-green-300"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing */}
              <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6">
                <h3 className="font-semibold text-red-400">
                  Missing Skills
                </h3>

                {matchResult.missing_skills.length === 0 ? (
                  <p className="mt-4 text-sm text-green-400">
                    No missing skills detected.
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {matchResult.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-red-800 bg-red-950/40 px-3 py-1.5 text-sm text-red-300"
                      >
                        ! {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
            {/* Required Skills */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold">
                Required Skills
              </h3>

              {matchResult.required_skills.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No required skills detected.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {matchResult.required_skills.map((skill) => {
                    const matched =
                      matchResult.matched_required_skills.includes(skill);

                    return (
                      <span
                        key={skill}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          matched
                            ? "border-green-800 bg-green-950/40 text-green-300"
                            : "border-red-800 bg-red-950/40 text-red-300"
                        }`}
                      >
                        {matched ? "✓" : "!"} {skill}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Preferred Skills */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold">
                Preferred Skills
              </h3>

              {matchResult.preferred_skills.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No preferred skills detected.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {matchResult.preferred_skills.map((skill) => {
                    const matched =
                      matchResult.matched_preferred_skills.includes(skill);

                    return (
                      <span
                        key={skill}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          matched
                            ? "border-green-800 bg-green-950/40 text-green-300"
                            : "border-yellow-800 bg-yellow-950/40 text-yellow-300"
                        }`}
                      >
                        {matched ? "✓" : "○"} {skill}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold">
                Match Breakdown
              </h3>

              <div className="mt-6 space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">
                      Technical Skills
                    </span>

                    <span className="font-medium">
                      {matchResult.skill_score}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${matchResult.skill_score}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">
                      Experience
                    </span>

                    <span className="font-medium">
                      {matchResult.experience_score}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${matchResult.experience_score}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">
                      Education
                    </span>

                    <span className="font-medium">
                      {matchResult.education_score}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${matchResult.education_score}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">
                      Keywords
                    </span>

                    <span className="font-medium">
                      {matchResult.keyword_score}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${matchResult.keyword_score}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Requirements */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold">
                Job Requirements
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Seniority
                  </p>

                  <p className="mt-1 font-medium capitalize">
                    {matchResult.seniority || "Not specified"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Education
                  </p>

                  <p className="mt-1 font-medium capitalize">
                    {matchResult.required_education || "Not specified"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Work Mode
                  </p>

                  <p className="mt-1 font-medium capitalize">
                    {matchResult.work_mode || "Not specified"}
                  </p>
                </div>

              </div>
            </div>

            {/* Experience */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="font-semibold">
                Experience Analysis
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Resume Experience
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {matchResult.resume_experience_years !== null
                      ? `${matchResult.resume_experience_years} years`
                      : "Not detected"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Required Experience
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {matchResult.required_experience_years !== null
                      ? `${matchResult.required_experience_years}+ years`
                      : "Not specified"}
                  </p>
                </div>

              </div>

              {matchResult.experience_match !== null && (
                <div
                  className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                    matchResult.experience_match
                      ? "border border-green-900 bg-green-950/30 text-green-300"
                      : "border border-red-900 bg-red-950/30 text-red-300"
                  }`}
                >
                  {matchResult.experience_match
                    ? "✓ Your detected experience meets the job requirement."
                    : "✕ Your detected experience does not meet the job requirement."}
                </div>
              )}
            </div>
            {/* Experience Comparison */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="text-lg font-semibold">
                Experience Comparison
              </h3>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Your Resume
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {matchResult.resume_experience_years !== null
                      ? `${matchResult.resume_experience_years} years`
                      : "Not detected"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-500">
                    Job Requirement
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {matchResult.required_experience_years !== null
                      ? `${matchResult.required_experience_years}+ years`
                      : "Not specified"}
                  </p>
                </div>

              </div>

              {matchResult.experience_match !== null && (
                <div
                  className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                    matchResult.experience_match
                      ? "border border-green-900 bg-green-950/30 text-green-300"
                      : "border border-red-900 bg-red-950/30 text-red-300"
                  }`}
                >
                  {matchResult.experience_match
                    ? "✓ Experience requirement met"
                    : "✕ Experience requirement not met"}
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <h3 className="font-semibold">
                Recommendations
              </h3>

              <div className="mt-4 space-y-3">
                {matchResult.recommendations.map(
                  (recommendation, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl bg-slate-900 p-4 text-sm text-slate-300"
                    >
                      <span className="text-blue-400">
                        →
                      </span>

                      <span>{recommendation}</span>
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        )}
        </section>

        {selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900 p-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Match Analysis
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Saved analysis from{" "}
                    {formatDateTime(selectedMatch.created_at)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Close
                </button>
              </div>

              {/* Loading */}
              {loadingSavedMatch ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading analysis...
                </div>
              ) : (
                <div className="space-y-6 p-6">

                  {/* Score Summary */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-950 p-5">
                      <p className="text-sm text-slate-500">
                        Match Score
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {selectedMatch.score}%
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-5">
                      <p className="text-sm text-slate-500">
                        Matched Skills
                      </p>

                      <p className="mt-2 text-3xl font-bold text-green-400">
                        {selectedMatch.matched_skills?.length || 0}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 p-5">
                      <p className="text-sm text-slate-500">
                        Missing Skills
                      </p>

                      <p className="mt-2 text-3xl font-bold text-red-400">
                        {selectedMatch.missing_skills?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Match Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold">
                      Match Breakdown
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      
                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Technical Skills
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {selectedMatch.match_data?.skill_score ?? 0}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Experience
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {selectedMatch.match_data?.experience_score ?? 0}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Education
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {selectedMatch.match_data?.education_score ?? 0}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Keywords
                        </p>

                        <p className="mt-2 text-2xl font-bold">
                          {selectedMatch.match_data?.keyword_score ?? 0}%
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Experience Analysis */}
                  <div>
                    <h3 className="text-lg font-semibold">
                      Experience Analysis
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Resume Experience
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {selectedMatch.match_data?.resume_experience_years != null
                            ? `${selectedMatch.match_data.resume_experience_years} years`
                            : "Not detected"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Required Experience
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {selectedMatch.match_data?.required_experience_years != null
                            ? `${selectedMatch.match_data.required_experience_years}+ years`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Experience Match
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {selectedMatch.match_data?.experience_match === true
                            ? "Requirement met"
                            : selectedMatch.match_data?.experience_match === false
                            ? "Requirement not met"
                            : "Not evaluated"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Recommendations */}
                  {selectedMatch.match_data?.recommendations?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold">
                        Recommendations
                      </h3>

                      <div className="mt-4 space-y-2">
                        {selectedMatch.match_data.recommendations.map(
                          (recommendation, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"
                            >
                              <span className="mr-2 text-blue-400">
                                →
                              </span>

                              {recommendation}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Matched & Missing Skills */}
                  <div className="grid gap-6 md:grid-cols-2">

                    {/* Matched */}
                    <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-5">
                      <h3 className="font-semibold text-green-400">
                        Matched Skills
                      </h3>

                      {selectedMatch.matched_skills?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedMatch.matched_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-green-800 bg-green-950/40 px-3 py-1.5 text-sm text-green-300"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          No matching skills detected.
                        </p>
                      )}
                    </div>

                    {/* Missing */}
                    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
                      <h3 className="font-semibold text-red-400">
                        Missing Skills
                      </h3>

                      {selectedMatch.missing_skills?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedMatch.missing_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-red-800 bg-red-950/40 px-3 py-1.5 text-sm text-red-300"
                            >
                              ! {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-green-400">
                          No missing skills detected.
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Required Skills */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="text-lg font-semibold">
                      Required Skills
                    </h3>

                    {selectedMatch.match_data?.required_skills?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedMatch.match_data.required_skills.map((skill) => {
                          const matched =
                            selectedMatch.match_data.matched_required_skills?.includes(
                              skill
                            );

                          return (
                            <span
                              key={skill}
                              className={`rounded-full border px-3 py-1.5 text-sm ${
                                matched
                                  ? "border-green-800 bg-green-950/40 text-green-300"
                                  : "border-red-800 bg-red-950/40 text-red-300"
                              }`}
                            >
                              {matched ? "✓" : "!"} {skill}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No required skills detected.
                      </p>
                    )}
                  </div>

                  {/* Preferred Skills */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="text-lg font-semibold">
                      Preferred Skills
                    </h3>

                    {selectedMatch.match_data?.preferred_skills?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedMatch.match_data.preferred_skills.map((skill) => {
                          const matched =
                            selectedMatch.match_data.matched_preferred_skills?.includes(
                              skill
                            );

                          return (
                            <span
                              key={skill}
                              className={`rounded-full border px-3 py-1.5 text-sm ${
                                matched
                                  ? "border-green-800 bg-green-950/40 text-green-300"
                                  : "border-yellow-800 bg-yellow-950/40 text-yellow-300"
                              }`}
                            >
                              {matched ? "✓" : "○"} {skill}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">
                        No preferred skills detected.
                      </p>
                    )}
                  </div>

                  {/* Job Requirements */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="text-lg font-semibold">
                      Job Requirements
                    </h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">

                      <div className="rounded-xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-500">
                          Seniority
                        </p>

                        <p className="mt-1 font-medium capitalize">
                          {selectedMatch.match_data?.seniority ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-500">
                          Education
                        </p>

                        <p className="mt-1 font-medium capitalize">
                          {selectedMatch.match_data?.required_education ||
                            "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900 p-4">
                        <p className="text-sm text-slate-500">
                          Work Mode
                        </p>

                        <p className="mt-1 font-medium capitalize">
                          {selectedMatch.match_data?.work_mode ||
                            "Not specified"}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end border-t border-slate-800 pt-6">
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(null)}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                      Close Analysis
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
        {comparisonMatch && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900 p-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    Match Comparison
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Comparing two consecutive resume analyses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setComparisonMatch(null)}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  Close
                </button>
              </div>

              {(() => {
                const changes = getMatchChanges(
                  comparisonMatch.current,
                  comparisonMatch.previous
                );

                return (
                  <div className="space-y-6 p-6">

                    {/* Score */}
                    <div className="grid gap-4 sm:grid-cols-3">

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Previous Score
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                          {comparisonMatch.previous.score}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Current Score
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                          {comparisonMatch.current.score}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Score Change
                        </p>

                        <p
                          className={`mt-2 text-3xl font-bold ${
                            changes.scoreChange > 0
                              ? "text-green-400"
                              : changes.scoreChange < 0
                              ? "text-red-400"
                              : "text-slate-300"
                          }`}
                        >
                          {changes.scoreChange > 0 ? "+" : ""}
                          {changes.scoreChange}%
                        </p>
                      </div>

                    </div>

                    {/* Analysis dates */}
                    <div className="grid gap-4 sm:grid-cols-2">

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Previous Analysis
                        </p>

                        <p className="mt-2 font-medium">
                          {formatDateTime(
                            comparisonMatch.previous.created_at
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-950 p-5">
                        <p className="text-sm text-slate-500">
                          Current Analysis
                        </p>

                        <p className="mt-2 font-medium">
                          {formatDateTime(
                            comparisonMatch.current.created_at
                          )}
                        </p>
                      </div>

                    </div>

                    {/* Skill changes */}
                    <div>
                      <h3 className="text-lg font-semibold">
                        Skill Changes
                      </h3>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">

                        {/* Newly matched */}
                        <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-5">
                          <h4 className="font-semibold text-green-400">
                            Newly Matched
                          </h4>

                          {changes.newlyMatched.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {changes.newlyMatched.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-green-950 px-3 py-1.5 text-sm text-green-300"
                                >
                                  + {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No newly matched skills.
                            </p>
                          )}
                        </div>

                        {/* Resolved missing */}
                        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-5">
                          <h4 className="font-semibold text-blue-400">
                            Resolved Missing Skills
                          </h4>

                          {changes.resolvedMissing.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {changes.resolvedMissing.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-blue-950 px-3 py-1.5 text-sm text-blue-300"
                                >
                                  ✓ {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No missing skills were resolved.
                            </p>
                          )}
                        </div>

                        {/* Newly missing */}
                        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
                          <h4 className="font-semibold text-red-400">
                            Newly Missing
                          </h4>

                          {changes.newlyMissing.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {changes.newlyMissing.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-red-950 px-3 py-1.5 text-sm text-red-300"
                                >
                                  ! {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No new missing skills.
                            </p>
                          )}
                        </div>

                        {/* No longer matched */}
                        <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-5">
                          <h4 className="font-semibold text-yellow-400">
                            No Longer Matched
                          </h4>

                          {changes.noLongerMatched.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {changes.noLongerMatched.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded-full bg-yellow-950 px-3 py-1.5 text-sm text-yellow-300"
                                >
                                  − {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">
                              No previously matched skills were lost.
                            </p>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Score breakdown changes */}
                    <div>
                      <h3 className="text-lg font-semibold">
                        Score Breakdown Changes
                      </h3>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                        {[
                          [
                            "Technical Skills",
                            changes.technicalSkillChange,
                          ],
                          [
                            "Experience",
                            changes.experienceChange,
                          ],
                          [
                            "Education",
                            changes.educationChange,
                          ],
                          [
                            "Keywords",
                            changes.keywordChange,
                          ],
                        ].map(([label, change]) => (
                          <div
                            key={label}
                            className="rounded-xl bg-slate-950 p-5"
                          >
                            <p className="text-sm text-slate-500">
                              {label}
                            </p>

                            <p
                              className={`mt-2 text-2xl font-bold ${
                                change > 0
                                  ? "text-green-400"
                                  : change < 0
                                  ? "text-red-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {change > 0 ? "+" : ""}
                              {change}%
                            </p>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* No changes */}
                    {changes.scoreChange === 0 &&
                      changes.newlyMatched.length === 0 &&
                      changes.noLongerMatched.length === 0 &&
                      changes.newlyMissing.length === 0 &&
                      changes.resolvedMissing.length === 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
                          <p className="font-medium text-slate-300">
                            No changes detected
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Both analyses produced the same match result.
                          </p>
                        </div>
                      )}

                    <div className="flex justify-end border-t border-slate-800 pt-6">
                      <button
                        type="button"
                        onClick={() => setComparisonMatch(null)}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
                      >
                        Close Comparison
                      </button>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Add Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add a note about something that happened with this application.
            </p>
          </div>

          <form
            onSubmit={handleAddActivity}
            className="mt-5"
          >
            <select
              value={activityType}
              onChange={(event) =>
                setActivityType(event.target.value)
              }
              className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="note">Note</option>
              <option value="email">Email</option>
              <option value="call">Phone Call</option>
              <option value="interview">Interview</option>
              <option value="follow_up">Follow-up</option>
              <option value="other">Other</option>
            </select>
            <textarea
              value={activityNote}
              onChange={(event) =>
                setActivityNote(event.target.value)
              }
              placeholder="e.g. Technical interview scheduled for August 20."
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />

            {activityError && (
              <p className="mt-2 text-sm text-red-400">
                {activityError}
              </p>
            )}

            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={
                  addingActivity ||
                  !activityNote.trim()
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingActivity
                  ? "Adding..."
                  : "Add Activity"}
              </button>
            </div>
          </form>
        </section>

        {/* Application Timeline */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">
              Application Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track the history of this application.
            </p>
          </div>

          {timelineLoading ? (
            <div className="mt-6 text-sm text-slate-500">
              Loading timeline...
            </div>
          ) : timeline.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-950 p-5 text-sm text-slate-500">
              No timeline events yet.
            </div>
          ) : (
            <div className="relative mt-8">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-slate-700" />

              <div className="space-y-7">
                {timeline.map((event) => (
                  <div
                    key={event.id}
                    className="relative flex gap-4"
                  >
                    <div
                      className={`relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-4 border-slate-900 ${
                        getTimelineEventStyle(event.event_type).dot
                      }`}
                    />

                    <div className="min-w-0 flex-1 rounded-xl bg-slate-950 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          {editingEventId === event.id ? (
                            <div className="space-y-3">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Edit Activity
                              </p>

                              <select
                                value={editingType}
                                onChange={(event) =>
                                  setEditingType(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                              >
                                <option value="note">Note</option>
                                <option value="email">Email</option>
                                <option value="call">Phone Call</option>
                                <option value="interview">Interview</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="other">Other</option>
                              </select>

                              <textarea
                                value={editingNote}
                                onChange={(event) =>
                                  setEditingNote(event.target.value)
                                }
                                rows={3}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    savingEdit ||
                                    !editingNote.trim()
                                  }
                                  onClick={() =>
                                    handleEditActivity(event.id)
                                  }
                                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEventId(null);
                                    setEditingNote("");
                                    setEditingType("note");
                                  }}
                                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                {getTimelineEventStyle(event.event_type).label}
                              </p>

                              {event.event_type === "resume_match" ? (
                                <div>
                                  <p className="font-medium text-white">
                                    Resume Match Analysis
                                  </p>

                                  <p className="mt-1 text-sm text-slate-400">
                                    {event.note}
                                  </p>

                                  {event.note?.match(/Match score: (\d+)%/) && (
                                    <span className="mt-3 inline-flex rounded-full bg-purple-950 px-3 py-1 text-sm font-semibold text-purple-300">
                                      {event.note.match(/Match score: (\d+)%/)[1]}% Match
                                    </span>
                                  )}
                                </div>
                              ) : [
                                  "note",
                                  "email",
                                  "call",
                                  "interview",
                                  "follow_up",
                                  "other",
                                ].includes(event.event_type) ? (
                                <p className="font-medium text-white">
                                  {event.note}
                                </p>
                              ) : (
                                <p className="font-medium text-white">
                                  {formatTimelineEvent(event)}
                                </p>
                              )}

                              {event.note &&
                                ![
                                  "note",
                                  "email",
                                  "call",
                                  "interview",
                                  "follow_up",
                                  "other",
                                  "resume_match",
                                ].includes(event.event_type) && (
                                  <p className="mt-1 text-sm text-slate-400">
                                    {event.note}
                                  </p>
                                )}
                            </>
                          )}
                        </div>

                        <div className="flex shrink-0 items-start gap-3">
                          <p className="text-xs text-slate-500">
                            {formatTimelineDate(event.created_at)}
                          </p>

                          {[
                            "note",
                            "email",
                            "call",
                            "interview",
                            "follow_up",
                            "other",
                          ].includes(event.event_type) && (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  startEditingActivity(event)
                                }
                                className="text-xs text-blue-400 transition hover:text-blue-300"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteActivity(event.id)
                                }
                                className="text-xs text-red-400 transition hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
function getTimelineEventStyle(eventType) {
  switch (eventType) {
    case "status_changed":
      return {
        dot: "bg-blue-500",
        label: "Status Update",
      };

    case "deadline_changed":
      return {
        dot: "bg-yellow-500",
        label: "Deadline Update",
      };

    case "resume_match":
      return {
        dot: "bg-purple-500",
        label: "Resume Match",
      };

    case "created":
      return {
        dot: "bg-green-500",
        label: "Application Created",
      };

    case "note":
      return {
        dot: "bg-cyan-500",
        label: "Activity",
      };
    case "email":
      return {
        dot: "bg-blue-500",
        label: "Email",
      };

    case "call":
      return {
        dot: "bg-green-500",
        label: "Phone Call",
      };

    case "interview":
      return {
        dot: "bg-purple-500",
        label: "Interview",
      };

    case "follow_up":
      return {
        dot: "bg-yellow-500",
        label: "Follow-up",
      };

    case "other":
      return {
        dot: "bg-slate-500",
        label: "Activity",
      };

    default:
      return {
        dot: "bg-slate-500",
        label: "Application Update",
      };
  }
}

function formatTimelineEvent(event) {
  if (event.event_type === "status_changed") {
    const oldStatus = event.old_status
      ? statusLabels[event.old_status] || event.old_status
      : "Unknown";

    const newStatus = event.new_status
      ? statusLabels[event.new_status] || event.new_status
      : "Unknown";

    return `Status changed from ${oldStatus} to ${newStatus}`;
  }

  return event.event_type
    ?.replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    "Application updated";
}
function formatDateTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimelineDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}


function getDeadlineInfo(deadline) {
  if (!deadline) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(`${deadline}T00:00:00`);
  deadlineDate.setHours(0, 0, 0, 0);

  const difference =
    Math.ceil(
      (deadlineDate - today) /
        (1000 * 60 * 60 * 24)
    );

  if (difference < 0) {
    return {
      label: `${Math.abs(difference)} day${
        Math.abs(difference) === 1 ? "" : "s"
      } overdue`,
      className: "text-red-400",
      badgeClassName:
        "bg-red-950 text-red-300",
    };
  }

  if (difference === 0) {
    return {
      label: "Due today",
      className: "text-orange-400",
      badgeClassName:
        "bg-orange-950 text-orange-300",
    };
  }

  if (difference <= 3) {
    return {
      label: `${difference} day${
        difference === 1 ? "" : "s"
      } left`,
      className: "text-yellow-400",
      badgeClassName:
        "bg-yellow-950 text-yellow-300",
    };
  }

  return {
    label: `${difference} days left`,
    className: "text-slate-400",
    badgeClassName:
      "bg-slate-800 text-slate-300",
  };
}

export default ApplicationDetails;