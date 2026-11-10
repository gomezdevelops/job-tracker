import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client";

/* =========================================================
   Constants
   ========================================================= */

const initialForm = {
  company: "",
  role: "",
  jd_text: "",
  jd_url: "",
  status: "saved",
  priority: "medium",
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

const STATUS_TONE = {
  saved: "slate",
  applied: "blue",
  screening: "amber",
  interview: "violet",
  offer: "green",
  rejected: "red",
};

const PRIORITY_TONE = { low: "green", medium: "amber", high: "red" };

const ACTIVITY_TYPES = [
  ["note", "Note"],
  ["email", "Email"],
  ["call", "Phone Call"],
  ["interview", "Interview"],
  ["follow_up", "Follow-up"],
  ["other", "Other"],
];

const EDITABLE_EVENT_TYPES = ACTIVITY_TYPES.map(([value]) => value);

const SECTIONS = [
  { id: "sec-progress", label: "Progress" },
  { id: "sec-details", label: "Details" },
  { id: "sec-jd", label: "Job Analysis" },
  { id: "sec-tailor", label: "Tailor Resume" },
  { id: "sec-cover", label: "Cover Letter" },
  { id: "sec-prep", label: "Interview Prep" },
  { id: "sec-match", label: "Resume Match" },
  { id: "sec-activity", label: "Add Activity" },
  { id: "sec-followups", label: "Follow-ups" },
  { id: "sec-intel", label: "Job Intelligence" },
  { id: "sec-timeline", label: "Timeline" },
];

const SECTION_IDS = SECTIONS.map((section) => section.id);

const INPUT =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20";

const TONES = {
  slate: "bg-white/5 text-slate-300 ring-white/10",
  indigo: "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20",
  blue: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
  violet: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-400/20",
  cyan: "bg-cyan-500/10 text-cyan-300 ring-cyan-400/20",
  green: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  orange: "bg-orange-500/10 text-orange-300 ring-orange-400/20",
  red: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
};

const TILE_TONES = {
  indigo: "bg-indigo-500/15 text-indigo-300",
  violet: "bg-violet-500/15 text-violet-300",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300",
  cyan: "bg-cyan-500/15 text-cyan-300",
  green: "bg-emerald-500/15 text-emerald-300",
  amber: "bg-amber-500/15 text-amber-300",
  blue: "bg-sky-500/15 text-sky-300",
};

const GLOW_TONES = {
  indigo: "bg-indigo-500/15",
  violet: "bg-violet-500/15",
  fuchsia: "bg-fuchsia-500/15",
  cyan: "bg-cyan-500/15",
  green: "bg-emerald-500/15",
  amber: "bg-amber-500/15",
  blue: "bg-sky-500/15",
};

const animationStyles = `
@keyframes ad-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ad-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes ad-shimmer {
  100% { transform: translateX(100%); }
}
@keyframes ad-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ad-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes ad-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.55); }
  50%      { box-shadow: 0 0 0 9px rgba(129, 140, 248, 0); }
}
@keyframes ad-sparkle {
  0%, 100% { opacity: 0.6; transform: scale(0.92) rotate(0deg); }
  50%      { opacity: 1; transform: scale(1.08) rotate(14deg); }
}
@keyframes ad-spin {
  to { transform: rotate(360deg); }
}

.ad-fade-up { animation: ad-fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.ad-float { animation: ad-float 16s ease-in-out infinite; }
.ad-pop { animation: ad-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
.ad-glow { animation: ad-glow 2.2s ease-in-out infinite; }
.ad-sparkle { animation: ad-sparkle 3s ease-in-out infinite; }
.ad-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ad-gradient 8s linear infinite;
}
.ad-ai-edge {
  background-image: linear-gradient(90deg, transparent, #a78bfa, #22d3ee, #e879f9, transparent);
  background-size: 200% auto;
  animation: ad-gradient 6s linear infinite;
}
.ad-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: ad-shimmer 1.5s infinite;
}
.ad-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.ad-reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .ad-fade-up, .ad-float, .ad-pop, .ad-glow, .ad-sparkle, .ad-gradient-text, .ad-ai-edge, .ad-shimmer::after {
    animation: none !important;
  }
  .ad-reveal { opacity: 1; transform: none; transition: none; }
}
`;

/* =========================================================
   Page
   ========================================================= */

function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
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
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [jobAnalysisLoading, setJobAnalysisLoading] = useState(false);
  const [jobAnalysisError, setJobAnalysisError] = useState("");
  const [tailoringResult, setTailoringResult] = useState(null);
  const [tailoringLoading, setTailoringLoading] = useState(false);
  const [tailoringError, setTailoringError] = useState("");
  const [coverLetter, setCoverLetter] = useState(null);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState("");
  const [copied, setCopied] = useState(false);
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [interviewPrepLoading, setInterviewPrepLoading] = useState(false);
  const [interviewPrepError, setInterviewPrepError] = useState("");
  const [loadingSavedMatch, setLoadingSavedMatch] = useState(false);
  const [viewingMatchId, setViewingMatchId] = useState(null);
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
  const [followUps, setFollowUps] = useState([]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const [defaultMatch, setDefaultMatch] = useState(null);
  const [defaultMatchLoading, setDefaultMatchLoading] = useState(false);
  const [defaultMatchError, setDefaultMatchError] = useState("");
  const [jobIntelligence, setJobIntelligence] = useState(null);
  const [jobIntelligenceLoading, setJobIntelligenceLoading] = useState(false);
  const [jobIntelligenceError, setJobIntelligenceError] = useState("");
  const [jobIntelligenceRefreshing, setJobIntelligenceRefreshing] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const activeSection = useScrollSpy(SECTION_IDS, !loading);

  /* ---------- Toast + confirm helpers ---------- */

  function showToast(message, tone = "success") {
    setToast({ message, tone, key: Date.now() });

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  async function runConfirm() {
    if (!confirmDialog) {
      return;
    }

    setConfirmBusy(true);

    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  }

  // Success messages fade away on their own.
  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeout = setTimeout(() => setSuccess(""), 5000);

    return () => clearTimeout(timeout);
  }, [success]);

  /* ---------- Data loading ---------- */

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
        const response = await api.get(`/applications/${id}`);

        const application = response.data;

        const loaded = {
          company: application.company ?? "",
          role: application.role ?? "",
          jd_text: application.jd_text ?? "",
          jd_url: application.jd_url ?? "",
          status: application.status ?? "saved",
          priority: application.priority ?? "medium",
          date_applied: application.date_applied ?? "",
          deadline: application.deadline ?? "",
          notes: application.notes ?? "",
        };

        setForm(loaded);
        setSavedForm(loaded);
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
        const response = await api.get(`/applications/${id}/timeline`);

        setTimeline(response.data);
      } catch (error) {
        console.error("Unable to load application timeline:", error);
      } finally {
        setTimelineLoading(false);
      }
    }

    loadTimeline();
  }, [id]);

  useEffect(() => {
    if (id) {
      loadFollowUps();
    }
  }, [id]);

  // Job intelligence follows the job description, but waits for typing to
  // pause so it isn't re-requested on every keystroke.
  useEffect(() => {
    if (!form.jd_text?.trim()) {
      setJobIntelligence(null);
      return undefined;
    }

    const timeout = setTimeout(() => {
      loadJobIntelligence();
    }, 700);

    return () => clearTimeout(timeout);
  }, [id, form.jd_text]);

  async function loadMatchHistory() {
    setLoadingMatchHistory(true);

    try {
      const response = await api.get(`/applications/${id}/matches`);

      setMatchHistory(response.data);
    } catch (error) {
      console.error("Unable to load match history:", error);
    } finally {
      setLoadingMatchHistory(false);
    }
  }

  async function loadFollowUps() {
    if (!id) return;

    try {
      const response = await api.get(`/applications/${id}/follow-ups`);

      setFollowUps(response.data);
      setFollowUpError("");
    } catch (error) {
      console.error("Failed to load follow-ups:", error);

      setFollowUpError(
        error.response?.data?.detail ||
          error.message ||
          "Failed to load follow-ups."
      );
    }
  }

  async function loadJobIntelligence(refresh = false) {
    if (refresh) {
      setJobIntelligenceRefreshing(true);
    } else {
      setJobIntelligenceLoading(true);
    }

    setJobIntelligenceError("");

    try {
      const response = await api.get(
        `/applications/${id}/job-intelligence`,
        {
          params: { refresh },
        }
      );

      setJobIntelligence(response.data);
    } catch (error) {
      setJobIntelligenceError(
        error.response?.data?.detail ||
          "Unable to load job intelligence."
      );
    } finally {
      setJobIntelligenceLoading(false);
      setJobIntelligenceRefreshing(false);
    }
  }

  /* ---------- Comparison helper ---------- */

  function getMatchChanges(current, previous) {
    if (!current || !previous) {
      return null;
    }

    const currentData = current.match_data || {};
    const previousData = previous.match_data || {};

    const currentMatched = new Set(current.matched_skills || []);
    const previousMatched = new Set(previous.matched_skills || []);
    const currentMissing = new Set(current.missing_skills || []);
    const previousMissing = new Set(previous.missing_skills || []);

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

    const scoreChange = (current.score || 0) - (previous.score || 0);

    return {
      scoreChange,
      newlyMatched,
      noLongerMatched,
      newlyMissing,
      resolvedMissing,
      technicalSkillChange:
        (currentData.skill_score || 0) - (previousData.skill_score || 0),
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

  /* ---------- Form ---------- */

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
        updated.date_applied = new Date().toISOString().split("T")[0];
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
        priority: form.priority,
        date_applied: form.date_applied || null,
        deadline: form.deadline || null,
        notes: form.notes.trim() || null,
      };

      await api.patch(`/applications/${id}`, payload);

      setSavedForm(form);
      setSuccess("Application updated successfully.");
    } catch (error) {
      console.error(error);

      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Unable to update application.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setForm(savedForm);
    setError("");
    setSuccess("");
  }

  function handleDelete() {
    setConfirmDialog({
      title: "Delete this application?",
      message:
        "Are you sure you want to permanently delete this application? This can't be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
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
      },
    });
  }

  /* ---------- Job analysis + AI ---------- */

  async function handleAnalyzeJob() {
    if (!form.jd_text.trim()) {
      setJobAnalysisError("Add a job description before analyzing it.");
      return;
    }

    setJobAnalysisLoading(true);
    setJobAnalysisError("");

    try {
      const response = await api.get(`/applications/${id}/analyze-jd`);

      setJobAnalysis(response.data);
    } catch (error) {
      console.error(error);

      setJobAnalysisError(
        error.response?.data?.detail ||
          "Unable to analyze job description."
      );
    } finally {
      setJobAnalysisLoading(false);
    }
  }

  async function handleTailorResume() {
    setTailoringLoading(true);
    setTailoringError("");
    setTailoringResult(null);

    try {
      const response = await api.post(
        `/applications/${id}/tailor-default-resume`
      );

      setTailoringResult(response.data.result);
    } catch (error) {
      console.error("Resume tailoring error:", error);

      setTailoringError(
        error.response?.data?.detail || "Failed to tailor the resume."
      );
    } finally {
      setTailoringLoading(false);
    }
  }

  async function handleGenerateCoverLetter() {
    setCoverLetterLoading(true);
    setCoverLetterError("");
    setCoverLetter(null);

    try {
      const response = await api.post(
        `/applications/${id}/cover-letter-default-resume`
      );

      setCoverLetter(response.data.result);
    } catch (error) {
      console.error(error);

      setCoverLetterError(
        error.response?.data?.detail ||
          "Failed to generate cover letter."
      );
    } finally {
      setCoverLetterLoading(false);
    }
  }

  async function handleCopyCoverLetter() {
    try {
      await navigator.clipboard.writeText(coverLetter?.cover_letter || "");

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);

      showToast("Unable to copy to the clipboard.", "error");
    }
  }

  async function handleGenerateInterviewPrep() {
    if (!selectedResume) {
      setInterviewPrepError("Please select a resume first.");
      return;
    }

    if (!form.jd_text?.trim()) {
      setInterviewPrepError("This application does not have a job description.");
      return;
    }

    setInterviewPrepLoading(true);
    setInterviewPrepError("");

    try {
      const response = await api.post(
        `/applications/${id}/interview-prep/${selectedResume}`
      );

      setInterviewPrep(response.data);
    } catch (error) {
      setInterviewPrepError(
        error.response?.data?.detail ||
          "Failed to generate interview preparation."
      );
    } finally {
      setInterviewPrepLoading(false);
    }
  }

  /* ---------- Resume matching ---------- */

  async function handleMatchDefaultResume() {
    try {
      setDefaultMatchLoading(true);
      setDefaultMatchError("");

      const response = await api.get(
        `/applications/${id}/match-default-resume`
      );

      setDefaultMatch(response.data);
    } catch (error) {
      console.error("Failed to match default resume:", error);

      setDefaultMatchError(
        error.response?.data?.detail ||
          "Unable to match the default resume."
      );
    } finally {
      setDefaultMatchLoading(false);
    }
  }

  async function handleMatch() {
    if (!selectedResume) {
      setMatchError("Please select a resume first.");
      return;
    }

    if (!form.jd_text.trim()) {
      setMatchError("Add a job description before analyzing the match.");
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

      // No matching cached analysis exists. Run a new analysis.
      const response = await api.get(
        `/applications/${id}/match/${selectedResume}`
      );

      setMatchResult(response.data);

      // Refresh history.
      await loadMatchHistory();
    } catch (error) {
      console.error(error);

      setMatchError(
        error.response?.data?.detail || "Unable to analyze resume match."
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
      setMatchError("Add a job description before analyzing the match.");
      return;
    }

    setMatching(true);
    setMatchError("");
    setMatchResult(null);

    try {
      // Always run a fresh analysis. The cache is intentionally skipped.
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
    setViewingMatchId(matchId);

    try {
      const response = await api.get(
        `/applications/${id}/matches/${matchId}`
      );

      setSelectedMatch(response.data);
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.detail || "Unable to load saved analysis.",
        "error"
      );
    } finally {
      setLoadingSavedMatch(false);
      setViewingMatchId(null);
    }
  }

  /* ---------- Follow-ups ---------- */

  async function handleCreateFollowUp() {
    if (!followUpDate) {
      setFollowUpError("Please select a follow-up date and time.");
      return;
    }

    setFollowUpLoading(true);
    setFollowUpError("");

    try {
      await api.post(`/applications/${id}/follow-ups`, {
        scheduled_at: followUpDate,
        note: followUpNote.trim() || null,
      });

      setFollowUpDate("");
      setFollowUpNote("");

      await loadFollowUps();
    } catch (error) {
      setFollowUpError(
        error.response?.data?.detail || "Failed to schedule follow-up."
      );
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleCompleteFollowUp(followUpId) {
    try {
      await api.patch(`/applications/${id}/follow-ups/${followUpId}`, {
        status: "completed",
      });

      await loadFollowUps();
    } catch (error) {
      setFollowUpError(
        error.response?.data?.detail || "Failed to complete follow-up."
      );
    }
  }

  async function handleDeleteFollowUp(followUpId) {
    try {
      await api.delete(`/applications/${id}/follow-ups/${followUpId}`);

      await loadFollowUps();
    } catch (error) {
      setFollowUpError(
        error.response?.data?.detail || "Failed to delete follow-up."
      );
    }
  }

  /* ---------- Activity timeline ---------- */

  async function handleAddActivity(event) {
    event.preventDefault();

    const note = activityNote.trim();

    if (!note) {
      return;
    }

    setAddingActivity(true);
    setActivityError("");

    try {
      const response = await api.post(`/applications/${id}/timeline`, {
        event_type: activityType,
        note,
      });

      setTimeline((current) => [response.data, ...current]);

      setActivityNote("");
      setActivityType("note");
    } catch (error) {
      console.error(error);

      setActivityError(
        error.response?.data?.detail || "Unable to add activity."
      );
    } finally {
      setAddingActivity(false);
    }
  }

  function handleDeleteActivity(eventId) {
    setConfirmDialog({
      title: "Delete this activity?",
      message: "This activity will be removed from the timeline.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await api.delete(`/applications/${id}/timeline/${eventId}`);

          setTimeline((current) =>
            current.filter((event) => event.id !== eventId)
          );
        } catch (error) {
          console.error(error);

          showToast(
            error.response?.data?.detail || "Unable to delete activity.",
            "error"
          );
        }
      },
    });
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
        current.map((event) => (event.id === eventId ? response.data : event))
      );

      setEditingEventId(null);
      setEditingNote("");
      setEditingType("note");
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.detail || "Unable to update activity.",
        "error"
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

  /* ---------- Derived ---------- */

  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);
  const deadlineInfo = getDeadlineInfo(form.deadline);
  const hasJobDescription = Boolean(form.jd_text?.trim());

  /* ---------- Loading / error ---------- */

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (error && !form.company) {
    return (
      <div className="relative z-0 min-h-screen bg-[#070910] text-white">
        <style>{animationStyles}</style>

        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="ad-fade-up max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
              <Icon name="alert" className="h-6 w-6" />
            </div>

            <p className="mt-4 text-lg font-semibold text-red-200">{error}</p>

            <Link
              to="/applications"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
            >
              <Icon name="arrowLeft" className="h-4 w-4" />
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="relative z-0 min-h-screen bg-[#070910] text-white">
      <style>{animationStyles}</style>

      {/* Ambient background: pinned to the viewport but confined to this page's content area */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 -mb-[100vh] h-screen overflow-hidden"
      >
        <div className="ad-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="ad-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="ad-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <header className="ad-fade-up">
          <Link
            to="/applications"
            className="group mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <Icon
              name="arrowLeft"
              className="h-4 w-4 transition group-hover:-translate-x-1"
            />
            Applications
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-5">
              <CompanyAvatar name={form.company} large />

              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-300">
                  {statusLabels[form.status]}
                </p>

                <h1 className="ad-gradient-text mt-1 break-words text-3xl font-bold tracking-tight sm:text-5xl">
                  {form.role || "Application"}
                </h1>

                <p className="mt-2 text-lg text-slate-400">{form.company}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Chip tone={STATUS_TONE[form.status] || "slate"}>
                    {statusLabels[form.status]}
                  </Chip>

                  <Chip tone={PRIORITY_TONE[form.priority] || "slate"}>
                    {form.priority
                      ? `${form.priority.charAt(0).toUpperCase()}${form.priority.slice(1)} priority`
                      : "Priority"}
                  </Chip>

                  {deadlineInfo && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${deadlineInfo.badgeClassName}`}
                    >
                      <Icon name="clock" className="h-3 w-3" />
                      {deadlineInfo.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {form.jd_url && (
              <a
                href={form.jd_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-200 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 lg:self-auto"
              >
                Open job posting
                <Icon
                  name="external"
                  className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            )}
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <SectionRail sections={SECTIONS} active={activeSection} dirty={dirty} />

          <div className="min-w-0 space-y-8">
            <ApplicationProgress status={form.status} />

            {/* Details form */}
            <Panel
              id="sec-details"
              icon="edit"
              tone="indigo"
              title="Application Details"
              subtitle="Keep the core details of this application up to date."
            >
              <form
                id="application-form"
                onSubmit={handleSubmit}
                className="mt-6"
              >
                {error && (
                  <div className="mb-6">
                    <AlertBox tone="red" onClose={() => setError("")}>
                      {error}
                    </AlertBox>
                  </div>
                )}

                {success && (
                  <div className="mb-6">
                    <AlertBox tone="green" onClose={() => setSuccess("")}>
                      {success}
                    </AlertBox>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Company *" htmlFor="company">
                    <input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleChange}
                      required
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Role *" htmlFor="role">
                    <input
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      required
                      className={INPUT}
                    />
                  </Field>

                  <Field label="Status" htmlFor="status">
                    <SelectWrap>
                      <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className={`${INPUT} appearance-none pr-10`}
                      >
                        <option value="saved" className="bg-slate-900">Saved</option>
                        <option value="applied" className="bg-slate-900">Applied</option>
                        <option value="screening" className="bg-slate-900">Screening</option>
                        <option value="interview" className="bg-slate-900">Interview</option>
                        <option value="offer" className="bg-slate-900">Offer</option>
                        <option value="rejected" className="bg-slate-900">Rejected</option>
                      </select>
                    </SelectWrap>
                  </Field>

                  <Field label="Priority" htmlFor="priority">
                    <SelectWrap>
                      <select
                        id="priority"
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                        className={`${INPUT} appearance-none pr-10`}
                      >
                        <option value="low" className="bg-slate-900">Low</option>
                        <option value="medium" className="bg-slate-900">Medium</option>
                        <option value="high" className="bg-slate-900">High</option>
                      </select>
                    </SelectWrap>
                  </Field>

                  <Field label="Date Applied" htmlFor="date_applied">
                    <input
                      id="date_applied"
                      type="date"
                      name="date_applied"
                      value={form.date_applied}
                      onChange={handleChange}
                      className={`${INPUT} [color-scheme:dark]`}
                    />
                  </Field>

                  <Field label="Deadline" htmlFor="deadline">
                    <input
                      id="deadline"
                      type="date"
                      name="deadline"
                      value={form.deadline}
                      onChange={handleChange}
                      className={`${INPUT} [color-scheme:dark]`}
                    />

                    {deadlineInfo && (
                      <div className="mt-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${deadlineInfo.badgeClassName}`}
                        >
                          {deadlineInfo.label}
                        </span>
                      </div>
                    )}
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Job URL" htmlFor="jd_url">
                      <input
                        id="jd_url"
                        type="url"
                        name="jd_url"
                        value={form.jd_url}
                        onChange={handleChange}
                        placeholder="https://..."
                        className={INPUT}
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-6">
                  <Field label="Job Description" htmlFor="jd_text">
                    <textarea
                      id="jd_text"
                      name="jd_text"
                      value={form.jd_text}
                      onChange={handleChange}
                      rows={8}
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                </div>

                <div className="mt-6">
                  <Field label="Notes" htmlFor="notes">
                    <textarea
                      id="notes"
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Add notes..."
                      className={`${INPUT} resize-y`}
                    />
                  </Field>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 active:scale-95 disabled:opacity-50"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                    {deleting ? "Deleting..." : "Delete Application"}
                  </button>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/applications"
                      className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/10"
                    >
                      Cancel
                    </Link>

                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95 disabled:opacity-50"
                    >
                      {saving && <Spinner />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </Panel>

            {/* Job Description Analysis */}
            <Panel
              id="sec-jd"
              icon="search"
              tone="violet"
              title="Job Description Analysis"
              subtitle="Analyze the requirements and key details of this job."
              action={
                <ActionButton
                  onClick={handleAnalyzeJob}
                  disabled={jobAnalysisLoading || !form.jd_text.trim()}
                  loading={jobAnalysisLoading}
                  loadingLabel="Analyzing..."
                  variant="ai"
                >
                  Analyze Job
                </ActionButton>
              }
            >
              {!form.jd_text.trim() && (
                <Hint>Add a job description before analyzing it.</Hint>
              )}

              {jobAnalysisError && (
                <div className="mt-5">
                  <AlertBox tone="red">{jobAnalysisError}</AlertBox>
                </div>
              )}

              {jobAnalysis && (
                <div className="ad-fade-up mt-8 space-y-6">
                  {/* Overview */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                      label="Experience"
                      value={
                        jobAnalysis.required_experience_years != null
                          ? `${jobAnalysis.required_experience_years}+ years`
                          : "Not specified"
                      }
                    />

                    <StatTile
                      label="Seniority"
                      value={jobAnalysis.seniority || "Not detected"}
                      capitalize
                    />

                    <StatTile
                      label="Education"
                      value={jobAnalysis.education || "Not specified"}
                      capitalize
                    />

                    <StatTile
                      label="Work Mode"
                      value={jobAnalysis.work_mode || "Not specified"}
                      capitalize
                    />
                  </div>

                  {/* Required Skills */}
                  <ResultBlock title="Required Skills">
                    <Chips
                      items={jobAnalysis.required_skills}
                      tone="blue"
                      empty="No required skills detected."
                    />
                  </ResultBlock>

                  {/* Preferred Skills */}
                  <ResultBlock title="Preferred Skills">
                    <Chips
                      items={jobAnalysis.preferred_skills}
                      tone="violet"
                      empty="No preferred skills detected."
                    />
                  </ResultBlock>

                  {/* AI Analysis */}
                  {jobAnalysis.ai_analysis ? (
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-300">
                        <Icon name="sparkle" className="ad-sparkle h-4 w-4" />
                        AI Analysis
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {jobAnalysis.ai_analysis.summary}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-sm font-semibold text-slate-300">
                        AI Analysis
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        AI analysis is not configured yet. The structured job
                        analysis above is available without an AI provider.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Panel>

            <div className="flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/5 p-4 backdrop-blur-xl">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <Icon name="star" className="h-4 w-4" />
              </span>

              <div>
                <p className="text-sm font-medium text-sky-300">
                  Using your default resume
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  AI tailoring and cover letter generation will automatically
                  use the resume you marked as default.
                </p>
              </div>
            </div>

            {/* AI Resume Tailoring */}
            <Panel
              id="sec-tailor"
              icon="tag"
              tone="fuchsia"
              ai
              title="AI Resume Tailoring"
              subtitle="Generate targeted suggestions to tailor your resume for this job."
              action={
                <ActionButton
                  onClick={handleTailorResume}
                  disabled={
                    tailoringLoading ||
                    !selectedResume ||
                    !form.jd_text.trim()
                  }
                  loading={tailoringLoading}
                  loadingLabel="Tailoring..."
                  variant="ai"
                >
                  Tailor Resume
                </ActionButton>
              }
            >
              {!selectedResume && (
                <Hint>Select a resume in the Resume Match section first.</Hint>
              )}

              {!form.jd_text.trim() && (
                <Hint>Add a job description before tailoring your resume.</Hint>
              )}

              {tailoringError && (
                <div className="mt-5">
                  <AlertBox tone="red">{tailoringError}</AlertBox>
                </div>
              )}

              {tailoringResult && (
                <div className="ad-fade-up mt-8 space-y-6">
                  <ResultBlock title="Suggested Professional Summary">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <p className="text-sm leading-6 text-slate-300">
                        {tailoringResult.professional_summary}
                      </p>
                    </div>
                  </ResultBlock>

                  <ResultBlock title="Skills to Emphasize">
                    <Chips items={tailoringResult.skills_to_emphasize} tone="blue" />
                  </ResultBlock>

                  <ResultBlock title="ATS Keywords">
                    <Chips items={tailoringResult.ats_keywords} tone="violet" />
                  </ResultBlock>

                  <ResultBlock title="Missing Keywords">
                    <Chips
                      items={tailoringResult.missing_keywords}
                      tone="amber"
                      empty="No significant missing keywords identified."
                    />
                  </ResultBlock>

                  <ResultBlock title="Experience Improvements">
                    <BulletCards items={tailoringResult.experience_improvements} />
                  </ResultBlock>

                  <ResultBlock title="Suggested Changes">
                    <BulletCards items={tailoringResult.suggested_changes} />
                  </ResultBlock>
                </div>
              )}
            </Panel>

            {/* AI Cover Letter */}
            <Panel
              id="sec-cover"
              icon="mail"
              tone="violet"
              ai
              title="AI Cover Letter"
              subtitle="Generate a tailored cover letter using the selected resume and job description."
              action={
                <ActionButton
                  onClick={handleGenerateCoverLetter}
                  disabled={coverLetterLoading || !selectedResume}
                  loading={coverLetterLoading}
                  loadingLabel="Generating..."
                  variant="ai"
                >
                  Generate Cover Letter
                </ActionButton>
              }
            >
              {coverLetterError && (
                <div className="mt-4">
                  <AlertBox tone="red">{coverLetterError}</AlertBox>
                </div>
              )}

              {coverLetter && (
                <div className="ad-fade-up mt-6 space-y-5">
                  <Field label="Subject" htmlFor="cover-subject">
                    <input
                      id="cover-subject"
                      type="text"
                      value={coverLetter.subject || ""}
                      onChange={(e) =>
                        setCoverLetter({
                          ...coverLetter,
                          subject: e.target.value,
                        })
                      }
                      className={INPUT}
                    />
                  </Field>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="cover-body"
                        className="block text-sm font-medium text-slate-300"
                      >
                        Cover Letter
                      </label>

                      <button
                        type="button"
                        onClick={handleCopyCoverLetter}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition active:scale-95 ${
                          copied
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                            : "border-white/10 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <textarea
                      id="cover-body"
                      value={coverLetter.cover_letter || ""}
                      onChange={(e) =>
                        setCoverLetter({
                          ...coverLetter,
                          cover_letter: e.target.value,
                        })
                      }
                      rows={18}
                      className={`${INPUT} resize-y leading-6`}
                    />
                  </div>

                  {coverLetter.key_points?.length > 0 && (
                    <ResultBlock title="Key Points">
                      <Chips items={coverLetter.key_points} tone="violet" />
                    </ResultBlock>
                  )}
                </div>
              )}
            </Panel>

            {/* AI Interview Preparation */}
            <Panel
              id="sec-prep"
              icon="chat"
              tone="cyan"
              ai
              title="AI Interview Preparation"
              subtitle="Generate interview questions tailored to this job and your selected resume."
              action={
                <ActionButton
                  onClick={handleGenerateInterviewPrep}
                  disabled={interviewPrepLoading || !selectedResume}
                  loading={interviewPrepLoading}
                  loadingLabel="Preparing..."
                  variant="ai"
                >
                  Prepare for Interview
                </ActionButton>
              }
            >
              {interviewPrepError && (
                <div className="mt-4">
                  <AlertBox tone="red">{interviewPrepError}</AlertBox>
                </div>
              )}

              {interviewPrep && (
                <div className="ad-fade-up mt-6 space-y-8">
                  {/* Overview */}
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5">
                    <h3 className="font-semibold">Interview Overview</h3>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {interviewPrep.overview}
                    </p>
                  </div>

                  {/* Technical Questions */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      Technical Questions
                    </h3>

                    <div className="space-y-4">
                      {interviewPrep.technical_questions?.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:border-white/20"
                        >
                          <div className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-semibold text-purple-300 ring-1 ring-inset ring-purple-400/20">
                              {index + 1}
                            </span>

                            <div>
                              <p className="font-medium text-slate-200">
                                {item.question}
                              </p>

                              <p className="mt-3 text-sm text-slate-400">
                                <span className="font-medium text-slate-300">
                                  Why it matters:
                                </span>{" "}
                                {item.why_it_matters}
                              </p>

                              <p className="mt-2 text-sm text-slate-400">
                                <span className="font-medium text-slate-300">
                                  Preparation:
                                </span>{" "}
                                {item.preparation_tip}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Behavioral Questions */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      Behavioral Questions
                    </h3>

                    <div className="space-y-4">
                      {interviewPrep.behavioral_questions?.map((item, index) => (
                        <QuestionCard key={index} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Role Specific */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      Role-Specific Questions
                    </h3>

                    <div className="space-y-4">
                      {interviewPrep.role_specific_questions?.map((item, index) => (
                        <QuestionCard key={index} item={item} />
                      ))}
                    </div>
                  </div>

                  {/* Skill Gaps */}
                  {interviewPrep.skill_gap_topics?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">
                        Skill Gap Topics
                      </h3>

                      <Chips items={interviewPrep.skill_gap_topics} tone="orange" />
                    </div>
                  )}
                </div>
              )}
            </Panel>

            {/* Resume Match */}
            <Panel
              id="sec-match"
              icon="target"
              tone="indigo"
              title="Resume Match"
              subtitle="Compare a resume against this job description."
              action={
                <ActionButton
                  onClick={handleMatchDefaultResume}
                  disabled={defaultMatchLoading}
                  loading={defaultMatchLoading}
                  loadingLabel="Matching..."
                  variant="primary"
                >
                  Match Default Resume
                </ActionButton>
              }
            >
              {defaultMatchError && (
                <div className="mt-4">
                  <AlertBox tone="red">{defaultMatchError}</AlertBox>
                </div>
              )}

              {defaultMatch && (
                <div className="ad-fade-up mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {defaultMatch.resume_filename}
                      </p>

                      <p className="text-sm text-slate-400">
                        Default resume match
                      </p>
                    </div>

                    <div className="text-3xl font-bold text-green-400">
                      <AnimatedNumber value={defaultMatch.match.score} suffix="%" />
                    </div>
                  </div>

                  {defaultMatch.match.matched_skills?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-white">
                        Matched Skills
                      </p>

                      <div className="mt-2">
                        <Chips items={defaultMatch.match.matched_skills} tone="green" />
                      </div>
                    </div>
                  )}

                  {defaultMatch.match.missing_skills?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-white">
                        Missing Skills
                      </p>

                      <div className="mt-2">
                        <Chips items={defaultMatch.match.missing_skills} tone="red" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <SelectWrap className="flex-1">
                  <select
                    value={selectedResume}
                    onChange={(event) => {
                      setSelectedResume(event.target.value);
                      setMatchResult(null);
                      setMatchError("");
                    }}
                    aria-label="Select a resume"
                    className={`${INPUT} appearance-none pr-10`}
                  >
                    <option value="" className="bg-slate-900">
                      Select a resume
                    </option>

                    {resumes.map((resume) => (
                      <option
                        key={resume.id}
                        value={resume.id}
                        className="bg-slate-900"
                      >
                        {resume.filename}
                      </option>
                    ))}
                  </select>
                </SelectWrap>

                <ActionButton
                  onClick={handleMatch}
                  disabled={matching || !selectedResume || !form.jd_text}
                  loading={matching}
                  loadingLabel="Analyzing..."
                  variant="primary"
                >
                  Analyze Match
                </ActionButton>

                <ActionButton
                  onClick={handleReanalyze}
                  disabled={matching || !selectedResume}
                  loading={matching}
                  loadingLabel="Analyzing..."
                  variant="ghost"
                >
                  Re-analyze
                </ActionButton>
              </div>

              {!form.jd_text && (
                <Hint>Add a job description before analyzing the match.</Hint>
              )}

              {matchError && (
                <div className="mt-5">
                  <AlertBox tone="red">{matchError}</AlertBox>
                </div>
              )}

              {matchResult && (
                <div className="ad-fade-up mt-8 space-y-6">
                  {/* Match Score */}
                  {(() => {
                    const score = matchResult.score ?? 0;
                    const tier = getScoreTier(score);

                    return (
                      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-black/20 p-6 sm:flex-row sm:items-center">
                        <ScoreRing score={score} color={tier.hex} size={136} />

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold">
                              Resume Compatibility
                            </h3>

                            <Chip tone={tier.tone}>{tier.label}</Chip>
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
                            <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-400">
                              Matched:{" "}
                              <span className="font-medium text-green-400">
                                {matchResult.matched_skills?.length ?? 0}
                              </span>
                            </span>

                            <span className="rounded-xl bg-white/5 px-3 py-2 text-slate-400">
                              Missing:{" "}
                              <span className="font-medium text-red-400">
                                {matchResult.missing_skills?.length ?? 0}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Skills */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                      <h3 className="font-semibold text-green-400">
                        Matched Skills
                      </h3>

                      <div className="mt-4">
                        <Chips
                          items={matchResult.matched_skills}
                          tone="green"
                          prefix="✓ "
                          empty="No matching skills detected."
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                      <h3 className="font-semibold text-red-400">
                        Missing Skills
                      </h3>

                      <div className="mt-4">
                        <Chips
                          items={matchResult.missing_skills}
                          tone="red"
                          prefix="! "
                          empty="No missing skills detected."
                          emptyClassName="text-green-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="text-lg font-semibold">Required Skills</h3>

                    <div className="mt-4">
                      <SkillStatusChips
                        skills={matchResult.required_skills}
                        matchedList={matchResult.matched_required_skills}
                        missedTone="red"
                        missedPrefix="! "
                        empty="No required skills detected."
                      />
                    </div>
                  </div>

                  {/* Preferred Skills */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="text-lg font-semibold">Preferred Skills</h3>

                    <div className="mt-4">
                      <SkillStatusChips
                        skills={matchResult.preferred_skills}
                        matchedList={matchResult.matched_preferred_skills}
                        missedTone="amber"
                        missedPrefix="○ "
                        empty="No preferred skills detected."
                      />
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="text-lg font-semibold">Match Breakdown</h3>

                    <div className="mt-6 space-y-5">
                      <Meter label="Technical Skills" value={matchResult.skill_score} />
                      <Meter label="Experience" value={matchResult.experience_score} delay={90} />
                      <Meter label="Education" value={matchResult.education_score} delay={180} />
                      <Meter label="Keywords" value={matchResult.keyword_score} delay={270} />
                    </div>
                  </div>

                  {/* Job Requirements */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="text-lg font-semibold">Job Requirements</h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <StatTile
                        label="Seniority"
                        value={matchResult.seniority || "Not specified"}
                        capitalize
                      />

                      <StatTile
                        label="Education"
                        value={matchResult.required_education || "Not specified"}
                        capitalize
                      />

                      <StatTile
                        label="Work Mode"
                        value={matchResult.work_mode || "Not specified"}
                        capitalize
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="font-semibold">Experience Analysis</h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <StatTile
                        label="Resume Experience"
                        value={
                          matchResult.resume_experience_years != null
                            ? `${matchResult.resume_experience_years} years`
                            : "Not detected"
                        }
                        large
                      />

                      <StatTile
                        label="Required Experience"
                        value={
                          matchResult.required_experience_years != null
                            ? `${matchResult.required_experience_years}+ years`
                            : "Not specified"
                        }
                        large
                      />
                    </div>

                    {matchResult.experience_match != null && (
                      <Verdict
                        ok={matchResult.experience_match}
                        okText="✓ Your detected experience meets the job requirement."
                        failText="✕ Your detected experience does not meet the job requirement."
                      />
                    )}
                  </div>

                  {/* Experience Comparison */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="text-lg font-semibold">
                      Experience Comparison
                    </h3>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <StatTile
                        label="Your Resume"
                        value={
                          matchResult.resume_experience_years != null
                            ? `${matchResult.resume_experience_years} years`
                            : "Not detected"
                        }
                        large
                      />

                      <StatTile
                        label="Job Requirement"
                        value={
                          matchResult.required_experience_years != null
                            ? `${matchResult.required_experience_years}+ years`
                            : "Not specified"
                        }
                        large
                      />
                    </div>

                    {matchResult.experience_match != null && (
                      <Verdict
                        ok={matchResult.experience_match}
                        okText="✓ Experience requirement met"
                        failText="✕ Experience requirement not met"
                      />
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <h3 className="font-semibold">Recommendations</h3>

                    <div className="mt-4 space-y-3">
                      {matchResult.recommendations?.map((recommendation, index) => (
                        <div
                          key={index}
                          className="flex gap-3 rounded-2xl bg-white/[0.04] p-4 text-sm text-slate-300"
                        >
                          <span className="text-indigo-300">→</span>

                          <span>{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Match History */}
              <div className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6">
                <div>
                  <h3 className="text-lg font-semibold">Resume Match History</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Previous resume analyses for this application.
                  </p>
                </div>

                {loadingMatchHistory ? (
                  <div className="mt-6 space-y-3">
                    <Shimmer className="h-24" />
                    <Shimmer className="h-24" />
                  </div>
                ) : matchHistory.length === 0 ? (
                  <div className="mt-6 rounded-2xl bg-white/[0.03] p-6 text-center">
                    <p className="text-slate-400">No previous analyses.</p>

                    <p className="mt-1 text-sm text-slate-600">
                      Analyze a resume to create your first match record.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {matchHistory.map((match, index) => (
                      <div
                        key={match.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-300">
                              Analysis #{matchHistory.length - index}
                            </span>

                            {index === 0 && <Chip tone="blue">Latest</Chip>}
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {formatDateTime(match.created_at)}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Chip tone="green">
                              {match.matched_skills?.length || 0} matched
                            </Chip>

                            <Chip tone="red">
                              {match.missing_skills?.length || 0} missing
                            </Chip>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-left sm:text-right">
                          <div>
                            <p className="text-3xl font-bold">{match.score}%</p>

                            <p className="text-xs text-slate-500">Match Score</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewMatch(match.id)}
                              disabled={loadingSavedMatch}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
                            >
                              {viewingMatchId === match.id ? (
                                <Spinner className="h-3 w-3" />
                              ) : (
                                <Icon name="eye" className="h-3.5 w-3.5" />
                              )}
                              View
                            </button>

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
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
                              >
                                Compare
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>

            {/* Saved analysis modal */}
            {selectedMatch && (
              <Modal
                title="Match Analysis"
                subtitle={`Saved analysis from ${formatDateTime(selectedMatch.created_at)}`}
                onClose={() => setSelectedMatch(null)}
              >
                {loadingSavedMatch ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Loading analysis...
                  </div>
                ) : (
                  <div className="space-y-6 p-6">
                    {/* Score Summary */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <StatTile
                        label="Match Score"
                        value={`${selectedMatch.score}%`}
                        large
                        xl
                      />

                      <StatTile
                        label="Matched Skills"
                        value={selectedMatch.matched_skills?.length || 0}
                        large
                        xl
                        valueClassName="text-green-400"
                      />

                      <StatTile
                        label="Missing Skills"
                        value={selectedMatch.missing_skills?.length || 0}
                        large
                        xl
                        valueClassName="text-red-400"
                      />
                    </div>

                    {/* Match Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold">Match Breakdown</h3>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatTile
                          label="Technical Skills"
                          value={`${selectedMatch.match_data?.skill_score ?? 0}%`}
                          large
                        />

                        <StatTile
                          label="Experience"
                          value={`${selectedMatch.match_data?.experience_score ?? 0}%`}
                          large
                        />

                        <StatTile
                          label="Education"
                          value={`${selectedMatch.match_data?.education_score ?? 0}%`}
                          large
                        />

                        <StatTile
                          label="Keywords"
                          value={`${selectedMatch.match_data?.keyword_score ?? 0}%`}
                          large
                        />
                      </div>
                    </div>

                    {/* Experience Analysis */}
                    <div>
                      <h3 className="text-lg font-semibold">Experience Analysis</h3>

                      <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <StatTile
                          label="Resume Experience"
                          value={
                            selectedMatch.match_data?.resume_experience_years != null
                              ? `${selectedMatch.match_data.resume_experience_years} years`
                              : "Not detected"
                          }
                        />

                        <StatTile
                          label="Required Experience"
                          value={
                            selectedMatch.match_data?.required_experience_years != null
                              ? `${selectedMatch.match_data.required_experience_years}+ years`
                              : "Not specified"
                          }
                        />

                        <StatTile
                          label="Experience Match"
                          value={
                            selectedMatch.match_data?.experience_match === true
                              ? "Requirement met"
                              : selectedMatch.match_data?.experience_match === false
                                ? "Requirement not met"
                                : "Not evaluated"
                          }
                        />
                      </div>
                    </div>

                    {/* Recommendations */}
                    {selectedMatch.match_data?.recommendations?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold">Recommendations</h3>

                        <div className="mt-4 space-y-2">
                          {selectedMatch.match_data.recommendations.map(
                            (recommendation, index) => (
                              <div
                                key={index}
                                className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300"
                              >
                                <span className="mr-2 text-indigo-300">→</span>

                                {recommendation}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Matched & Missing Skills */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                        <h3 className="font-semibold text-green-400">
                          Matched Skills
                        </h3>

                        <div className="mt-4">
                          <Chips
                            items={selectedMatch.matched_skills}
                            tone="green"
                            prefix="✓ "
                            empty="No matching skills detected."
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                        <h3 className="font-semibold text-red-400">
                          Missing Skills
                        </h3>

                        <div className="mt-4">
                          <Chips
                            items={selectedMatch.missing_skills}
                            tone="red"
                            prefix="! "
                            empty="No missing skills detected."
                            emptyClassName="text-green-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-lg font-semibold">Required Skills</h3>

                      <div className="mt-4">
                        <SkillStatusChips
                          skills={selectedMatch.match_data?.required_skills}
                          matchedList={selectedMatch.match_data?.matched_required_skills}
                          missedTone="red"
                          missedPrefix="! "
                          empty="No required skills detected."
                        />
                      </div>
                    </div>

                    {/* Preferred Skills */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-lg font-semibold">Preferred Skills</h3>

                      <div className="mt-4">
                        <SkillStatusChips
                          skills={selectedMatch.match_data?.preferred_skills}
                          matchedList={selectedMatch.match_data?.matched_preferred_skills}
                          missedTone="amber"
                          missedPrefix="○ "
                          empty="No preferred skills detected."
                        />
                      </div>
                    </div>

                    {/* Job Requirements */}
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h3 className="text-lg font-semibold">Job Requirements</h3>

                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <StatTile
                          label="Seniority"
                          value={selectedMatch.match_data?.seniority || "Not specified"}
                          capitalize
                        />

                        <StatTile
                          label="Education"
                          value={
                            selectedMatch.match_data?.required_education ||
                            "Not specified"
                          }
                          capitalize
                        />

                        <StatTile
                          label="Work Mode"
                          value={selectedMatch.match_data?.work_mode || "Not specified"}
                          capitalize
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end border-t border-white/10 pt-6">
                      <button
                        type="button"
                        onClick={() => setSelectedMatch(null)}
                        className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-95"
                      >
                        Close Analysis
                      </button>
                    </div>
                  </div>
                )}
              </Modal>
            )}

            {/* Comparison modal */}
            {comparisonMatch &&
              (() => {
                const changes = getMatchChanges(
                  comparisonMatch.current,
                  comparisonMatch.previous
                );

                return (
                  <Modal
                    title="Match Comparison"
                    subtitle="Comparing two consecutive resume analyses."
                    onClose={() => setComparisonMatch(null)}
                    layer="z-[110]"
                  >
                    <div className="space-y-6 p-6">
                      {/* Score */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        <StatTile
                          label="Previous Score"
                          value={`${comparisonMatch.previous.score}%`}
                          large
                          xl
                        />

                        <StatTile
                          label="Current Score"
                          value={`${comparisonMatch.current.score}%`}
                          large
                          xl
                        />

                        <StatTile
                          label="Score Change"
                          value={`${changes.scoreChange > 0 ? "+" : ""}${changes.scoreChange}%`}
                          large
                          xl
                          valueClassName={deltaClass(changes.scoreChange)}
                        />
                      </div>

                      {/* Analysis dates */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <StatTile
                          label="Previous Analysis"
                          value={formatDateTime(comparisonMatch.previous.created_at)}
                        />

                        <StatTile
                          label="Current Analysis"
                          value={formatDateTime(comparisonMatch.current.created_at)}
                        />
                      </div>

                      {/* Skill changes */}
                      <div>
                        <h3 className="text-lg font-semibold">Skill Changes</h3>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <ChangeCard
                            title="Newly Matched"
                            tone="green"
                            items={changes.newlyMatched}
                            prefix="+ "
                            empty="No newly matched skills."
                          />

                          <ChangeCard
                            title="Resolved Missing Skills"
                            tone="blue"
                            items={changes.resolvedMissing}
                            prefix="✓ "
                            empty="No missing skills were resolved."
                          />

                          <ChangeCard
                            title="Newly Missing"
                            tone="red"
                            items={changes.newlyMissing}
                            prefix="! "
                            empty="No new missing skills."
                          />

                          <ChangeCard
                            title="No Longer Matched"
                            tone="amber"
                            items={changes.noLongerMatched}
                            prefix="− "
                            empty="No previously matched skills were lost."
                          />
                        </div>
                      </div>

                      {/* Score breakdown changes */}
                      <div>
                        <h3 className="text-lg font-semibold">
                          Score Breakdown Changes
                        </h3>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            ["Technical Skills", changes.technicalSkillChange],
                            ["Experience", changes.experienceChange],
                            ["Education", changes.educationChange],
                            ["Keywords", changes.keywordChange],
                          ].map(([label, change]) => (
                            <StatTile
                              key={label}
                              label={label}
                              value={`${change > 0 ? "+" : ""}${change}%`}
                              large
                              valueClassName={deltaClass(change)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* No changes */}
                      {changes.scoreChange === 0 &&
                        changes.newlyMatched.length === 0 &&
                        changes.noLongerMatched.length === 0 &&
                        changes.newlyMissing.length === 0 &&
                        changes.resolvedMissing.length === 0 && (
                          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
                            <p className="font-medium text-slate-300">
                              No changes detected
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Both analyses produced the same match result.
                            </p>
                          </div>
                        )}

                      <div className="flex justify-end border-t border-white/10 pt-6">
                        <button
                          type="button"
                          onClick={() => setComparisonMatch(null)}
                          className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-95"
                        >
                          Close Comparison
                        </button>
                      </div>
                    </div>
                  </Modal>
                );
              })()}

            {/* Add Activity */}
            <Panel
              id="sec-activity"
              icon="pen"
              tone="cyan"
              title="Add Activity"
              subtitle="Add a note about something that happened with this application."
            >
              <form onSubmit={handleAddActivity} className="mt-5">
                <SelectWrap className="mb-3">
                  <select
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value)}
                    aria-label="Activity type"
                    className={`${INPUT} appearance-none pr-10`}
                  >
                    {ACTIVITY_TYPES.map(([value, label]) => (
                      <option key={value} value={value} className="bg-slate-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </SelectWrap>

                <textarea
                  value={activityNote}
                  onChange={(event) => setActivityNote(event.target.value)}
                  placeholder="e.g. Technical interview scheduled for August 20."
                  rows={3}
                  aria-label="Activity note"
                  className={INPUT}
                />

                {activityError && (
                  <p className="mt-2 text-sm text-red-400">{activityError}</p>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={addingActivity || !activityNote.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingActivity && <Spinner />}
                    {addingActivity ? "Adding..." : "Add Activity"}
                  </button>
                </div>
              </form>
            </Panel>

            {/* Follow-ups */}
            <Panel
              id="sec-followups"
              icon="bell"
              tone="amber"
              title="Follow-ups"
              subtitle="Schedule reminders to follow up on this application."
            >
              {followUpError && (
                <div className="mt-4">
                  <AlertBox tone="red">{followUpError}</AlertBox>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  aria-label="Follow-up date and time"
                  className={`${INPUT} [color-scheme:dark]`}
                />

                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Follow-up note..."
                  aria-label="Follow-up note"
                  className={INPUT}
                />

                <button
                  type="button"
                  onClick={handleCreateFollowUp}
                  disabled={followUpLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {followUpLoading && <Spinner />}
                  {followUpLoading ? "Scheduling..." : "Schedule"}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {followUps.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      No follow-ups scheduled.
                    </p>
                  </div>
                ) : (
                  followUps.map((followUp) => {
                    const completed = followUp.status === "completed";

                    return (
                      <div
                        key={followUp.id}
                        className={`rounded-2xl border p-4 transition duration-300 hover:-translate-y-0.5 ${
                          completed
                            ? "border-white/10 bg-black/10 opacity-70"
                            : "border-amber-400/20 bg-amber-500/5"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                                <Icon name="calendar" className="h-4 w-4 text-slate-500" />
                                {new Date(followUp.scheduled_at).toLocaleString()}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-xs capitalize ring-1 ring-inset ${
                                  completed ? TONES.green : TONES.amber
                                }`}
                              >
                                {followUp.status}
                              </span>
                            </div>

                            {followUp.note && (
                              <p className="mt-2 text-sm text-slate-400">
                                {followUp.note}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!completed && (
                              <button
                                type="button"
                                onClick={() => handleCompleteFollowUp(followUp.id)}
                                className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400 transition hover:bg-green-500/20 active:scale-95"
                              >
                                Mark Done
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteFollowUp(followUp.id)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/20 active:scale-95"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>

            {/* Job Intelligence */}
            <Panel
              id="sec-intel"
              icon="layers"
              tone="blue"
              title="Job Intelligence"
              subtitle="Understand the requirements and important keywords in this job description."
              action={
                <ActionButton
                  onClick={() => loadJobIntelligence(true)}
                  disabled={
                    jobIntelligenceLoading ||
                    jobIntelligenceRefreshing ||
                    !hasJobDescription
                  }
                  loading={jobIntelligenceRefreshing}
                  loadingLabel="Refreshing..."
                  variant="ghost"
                >
                  Refresh analysis
                </ActionButton>
              }
            >
              {jobIntelligenceLoading && (
                <div className="mt-6 space-y-3" aria-busy="true">
                  <p className="text-sm text-slate-400">
                    Analyzing job description...
                  </p>

                  <Shimmer className="h-20" />
                </div>
              )}

              {jobIntelligenceError && (
                <div className="mt-6">
                  <AlertBox tone="red">{jobIntelligenceError}</AlertBox>
                </div>
              )}

              {!hasJobDescription && (
                <p className="mt-6 text-sm text-slate-400">
                  Add a job description to unlock Job Intelligence.
                </p>
              )}

              {!jobIntelligenceLoading && jobIntelligence && (
                <div className="ad-fade-up mt-6 space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-100">
                          Resume Skill Gap Analysis
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          Compare your selected resume against this job's
                          requirements.
                        </p>
                      </div>

                      <ActionButton
                        onClick={handleMatch}
                        disabled={matching || !selectedResume || !hasJobDescription}
                        loading={matching}
                        loadingLabel="Analyzing..."
                        variant="primary"
                      >
                        Analyze Resume
                      </ActionButton>
                    </div>

                    {!selectedResume && (
                      <Hint>
                        Upload or select a resume in the Resume Match section
                        first.
                      </Hint>
                    )}

                    {matchError && (
                      <p className="mt-4 text-sm text-red-400">{matchError}</p>
                    )}

                    {matchResult && (
                      <div className="mt-5 space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <StatTile
                            label="Overall match"
                            value={`${matchResult.score ?? 0}%`}
                            large
                            valueClassName="text-indigo-300"
                          />

                          <StatTile
                            label="Matched skills"
                            value={matchResult.matched_skills?.length ?? 0}
                            large
                            valueClassName="text-green-400"
                          />

                          <StatTile
                            label="Missing skills"
                            value={matchResult.missing_skills?.length ?? 0}
                            large
                            valueClassName="text-red-400"
                          />
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-medium text-slate-200">
                            Skills to highlight
                          </h4>

                          <Chips
                            items={matchResult.matched_skills}
                            tone="green"
                            empty="No matching skills detected yet."
                          />
                        </div>

                        <div>
                          <h4 className="mb-2 text-sm font-medium text-slate-200">
                            Skills to develop or demonstrate
                          </h4>

                          <Chips
                            items={matchResult.missing_skills}
                            tone="red"
                            empty="No missing skills detected by the current matcher."
                            emptyClassName="text-green-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      [
                        "Experience",
                        jobIntelligence.required_experience_years != null
                          ? `${jobIntelligence.required_experience_years}+ years`
                          : "Not detected",
                      ],
                      ["Seniority", jobIntelligence.seniority || "Not detected"],
                      ["Education", jobIntelligence.education || "Not detected"],
                      ["Work mode", jobIntelligence.work_mode || "Not detected"],
                    ].map(([label, value]) => (
                      <StatTile key={label} label={label} value={value} capitalize />
                    ))}
                  </div>

                  {[
                    ["Required skills", jobIntelligence.required_skills],
                    ["Preferred skills", jobIntelligence.preferred_skills],
                    ["Technologies", jobIntelligence.technologies],
                    ["Keywords", jobIntelligence.keywords],
                  ].map(([title, items]) => (
                    <ResultBlock key={title} title={title}>
                      <Chips
                        items={items}
                        tone="slate"
                        empty="No items detected."
                      />
                    </ResultBlock>
                  ))}

                  <ResultBlock title="Responsibilities">
                    {jobIntelligence.responsibilities?.length ? (
                      <ul className="space-y-2 text-sm text-slate-300">
                        {jobIntelligence.responsibilities.map((item, index) => (
                          <li
                            key={`${index}-${item}`}
                            className="flex gap-3 rounded-2xl bg-white/[0.04] p-3"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />

                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No responsibility bullets detected. Try refreshing after
                        checking the job description.
                      </p>
                    )}
                  </ResultBlock>

                  <p className="text-xs text-slate-500">
                    Analysis is rule-based unless an AI provider is configured.
                    Last analyzed:{" "}
                    {jobIntelligence.created_at
                      ? new Date(jobIntelligence.created_at).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
              )}
            </Panel>

            {/* Application Timeline */}
            <Panel
              id="sec-timeline"
              icon="activity"
              tone="violet"
              title="Application Timeline"
              subtitle="Track the history of this application."
            >
              {timelineLoading ? (
                <div className="mt-6 space-y-3" aria-busy="true">
                  <Shimmer className="h-20" />
                  <Shimmer className="h-20" />
                </div>
              ) : timeline.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-black/20 p-5 text-sm text-slate-500">
                  No timeline events yet.
                </div>
              ) : (
                <div className="relative mt-8">
                  <div className="absolute bottom-2 left-[9px] top-2 w-px bg-gradient-to-b from-indigo-400/60 via-white/10 to-transparent" />

                  <div className="space-y-7">
                    {timeline.map((event) => {
                      const eventStyle = getTimelineEventStyle(event.event_type);
                      const isEditable = EDITABLE_EVENT_TYPES.includes(
                        event.event_type
                      );

                      return (
                        <div key={event.id} className="relative flex gap-4">
                          <div
                            className={`relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-4 border-[#0b0d14] ${eventStyle.dot}`}
                          />

                          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/20">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                {editingEventId === event.id ? (
                                  <div className="space-y-3">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                      Edit Activity
                                    </p>

                                    <SelectWrap>
                                      <select
                                        value={editingType}
                                        onChange={(e) => setEditingType(e.target.value)}
                                        aria-label="Activity type"
                                        className={`${INPUT} appearance-none pr-10`}
                                      >
                                        {ACTIVITY_TYPES.map(([value, label]) => (
                                          <option
                                            key={value}
                                            value={value}
                                            className="bg-slate-900"
                                          >
                                            {label}
                                          </option>
                                        ))}
                                      </select>
                                    </SelectWrap>

                                    <textarea
                                      value={editingNote}
                                      onChange={(e) => setEditingNote(e.target.value)}
                                      rows={3}
                                      aria-label="Activity note"
                                      className={INPUT}
                                    />

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        disabled={savingEdit || !editingNote.trim()}
                                        onClick={() => handleEditActivity(event.id)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {savingEdit && <Spinner />}
                                        {savingEdit ? "Saving..." : "Save"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingEventId(null);
                                          setEditingNote("");
                                          setEditingType("note");
                                        }}
                                        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                                      {eventStyle.label}
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
                                          <span className="mt-3 inline-flex rounded-full bg-purple-500/10 px-3 py-1 text-sm font-semibold text-purple-300 ring-1 ring-inset ring-purple-400/20">
                                            {event.note.match(/Match score: (\d+)%/)[1]}% Match
                                          </span>
                                        )}
                                      </div>
                                    ) : isEditable ? (
                                      <p className="font-medium text-white">
                                        {event.note}
                                      </p>
                                    ) : (
                                      <p className="font-medium text-white">
                                        {formatTimelineEvent(event)}
                                      </p>
                                    )}

                                    {event.note &&
                                      !isEditable &&
                                      event.event_type !== "resume_match" && (
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

                                {isEditable && (
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => startEditingActivity(event)}
                                      className="text-xs text-indigo-300 transition hover:text-indigo-200"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteActivity(event.id)}
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
                      );
                    })}
                  </div>
                </div>
              )}
            </Panel>

            {/* Unsaved changes bar */}
            {dirty && (
              <div className="ad-pop sticky bottom-4 z-20">
                <div className="flex flex-col gap-3 rounded-2xl border border-indigo-400/30 bg-[#0d1020]/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="ad-glow h-2 w-2 rounded-full bg-indigo-400" />
                    You have unsaved changes
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/10 active:scale-95"
                    >
                      Discard
                    </button>

                    <button
                      type="submit"
                      form="application-form"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                    >
                      {saving && <Spinner />}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        dialog={confirmDialog}
        busy={confirmBusy}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={runConfirm}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

/* =========================================================
   Layout components
   ========================================================= */

function useScrollSpy(ids, ready) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    if (!ready) {
      return undefined;
    }

    let frame = 0;

    function update() {
      let current = ids[0];

      for (const sectionId of ids) {
        const element = document.getElementById(sectionId);

        if (element && element.getBoundingClientRect().top <= 150) {
          current = sectionId;
        }
      }

      setActive(current);
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    update();

    // Capture phase so it also works if the app scrolls an inner container.
    window.addEventListener("scroll", onScroll, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [ready, ids.join("|")]);

  return active;
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.04 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`ad-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function Panel({
  id,
  icon,
  tone = "indigo",
  title,
  subtitle,
  action,
  ai = false,
  children,
}) {
  return (
    <Reveal>
      <section
        id={id}
        className="relative scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8"
      >
        {ai && (
          <span className="ad-ai-edge pointer-events-none absolute inset-x-0 top-0 h-px" />
        )}

        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${GLOW_TONES[tone]}`}
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TILE_TONES[tone]}`}
            >
              <Icon name={icon} className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-xl font-semibold">{title}</h2>

              {subtitle && (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>

          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        <div className="relative">{children}</div>
      </section>
    </Reveal>
  );
}

function SectionRail({ sections, active, dirty }) {
  function go(sectionId) {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <aside className="hidden lg:block">
      <nav aria-label="Page sections" className="sticky top-28">
        <p className="mb-3 px-1 text-xs font-medium uppercase tracking-widest text-slate-500">
          On this page
        </p>

        <ul className="border-l border-white/10">
          {sections.map((section) => {
            const isActive = active === section.id;

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => go(section.id)}
                  aria-current={isActive ? "location" : undefined}
                  className={`-ml-px block w-full border-l-2 py-1.5 pl-4 pr-2 text-left text-sm transition duration-300 ${
                    isActive
                      ? "border-indigo-400 font-medium text-white"
                      : "border-transparent text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>

        {dirty && (
          <div className="ad-pop mt-6 flex items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
            <span className="ad-glow h-2 w-2 rounded-full bg-indigo-400" />
            Unsaved changes
          </div>
        )}
      </nav>
    </aside>
  );
}

function ApplicationProgress({ status }) {
  const stages = [
    { key: "saved", label: "Saved" },
    { key: "applied", label: "Applied" },
    { key: "screening", label: "Screening" },
    { key: "interview", label: "Interview" },
    { key: "offer", label: "Offer" },
  ];

  const isRejected = status === "rejected";
  const currentIndex = stages.findIndex((stage) => stage.key === status);

  return (
    <Panel
      id="sec-progress"
      icon="activity"
      tone="indigo"
      title="Application Progress"
      subtitle="Track the current stage of this application."
    >
      {isRejected ? (
        <div className="mt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/10 text-red-400">
              <Icon name="x" className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold text-red-300">Application Rejected</p>

              <p className="mt-1 text-sm text-slate-500">
                This application is no longer active.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-[650px] items-start">
            {stages.map((stage, index) => {
              const completed = currentIndex >= index;
              const current = status === stage.key;
              const isLast = index === stages.length - 1;

              return (
                <div
                  key={stage.key}
                  className={`flex items-start ${isLast ? "" : "flex-1"}`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold transition duration-500 ${
                        completed
                          ? "border-indigo-300/60 bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                          : "border-white/10 bg-black/30 text-slate-500"
                      } ${current ? "ad-glow" : ""}`}
                    >
                      {completed ? (
                        <Icon name="check" className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <p
                      className={`mt-3 text-xs font-medium ${
                        completed ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>

                  {!isLast && (
                    <Connector
                      filled={currentIndex > index}
                      delay={index * 160}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Connector({ filled, delay }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(
      () => setWidth(filled ? 100 : 0),
      250 + delay
    );

    return () => clearTimeout(timeout);
  }, [filled, delay]);

  return (
    <div className="mx-2 mt-5 h-0.5 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 transition-[width] duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* =========================================================
   Form + feedback components
   ========================================================= */

function Field({ label, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-slate-300"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function SelectWrap({ children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {children}

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
        <Icon name="chevronDown" className="h-4 w-4" />
      </span>
    </div>
  );
}

function Spinner({ className = "h-4 w-4" }) {
  return (
    <span
      className={`${className} animate-spin rounded-full border-2 border-white/30 border-t-white`}
    />
  );
}

function AlertBox({ tone = "red", children, onClose }) {
  const isError = tone === "red";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`ad-pop flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-green-500/30 bg-green-500/10 text-green-200"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          isError ? "bg-red-500/30" : "bg-green-500/30"
        }`}
      >
        <Icon name={isError ? "alert" : "check"} className="h-3 w-3" />
      </span>

      <div className="flex-1">{children}</div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss message"
          className="opacity-60 transition hover:opacity-100"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Hint({ children }) {
  return (
    <p className="mt-4 flex items-center gap-2 text-sm text-yellow-400">
      <Icon name="alert" className="h-4 w-4 shrink-0" />
      {children}
    </p>
  );
}

function ActionButton({
  onClick,
  disabled,
  loading = false,
  loadingLabel,
  variant = "primary",
  children,
}) {
  const variants = {
    ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 hover:shadow-violet-500/40",
    primary:
      "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 hover:shadow-indigo-500/40",
    ghost:
      "border border-white/10 text-slate-200 hover:bg-white/10 hover:text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variants[variant]}`}
    >
      {loading ? (
        <Spinner />
      ) : variant === "ai" ? (
        <Icon name="sparkle" className="h-4 w-4" />
      ) : null}

      {loading ? loadingLabel : children}
    </button>
  );
}

/* =========================================================
   Content components
   ========================================================= */

function Chip({ tone = "slate", children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

function Chips({ items, tone = "slate", prefix = "", empty, emptyClassName }) {
  if (!items?.length) {
    return empty ? (
      <p className={`text-sm ${emptyClassName || "text-slate-500"}`}>{empty}</p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition duration-200 hover:-translate-y-0.5 ${TONES[tone]}`}
        >
          {prefix}
          {item}
        </span>
      ))}
    </div>
  );
}

function SkillStatusChips({
  skills,
  matchedList,
  missedTone,
  missedPrefix,
  empty,
}) {
  if (!skills?.length) {
    return <p className="text-sm text-slate-500">{empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const matched = matchedList?.includes(skill);

        return (
          <span
            key={skill}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm ring-1 ring-inset ${
              matched ? TONES.green : TONES[missedTone]
            }`}
          >
            {matched ? "✓ " : missedPrefix}
            {skill}
          </span>
        );
      })}
    </div>
  );
}

function ResultBlock({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>

      {children}
    </div>
  );
}

function BulletCards({ items }) {
  return (
    <ul className="space-y-2">
      {items?.map((item, index) => (
        <li
          key={index}
          className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300 transition duration-300 hover:border-white/20"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function QuestionCard({ item }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:border-white/20">
      <p className="font-medium text-slate-200">{item.question}</p>

      <p className="mt-3 text-sm text-slate-400">
        <span className="font-medium text-slate-300">Preparation:</span>{" "}
        {item.preparation_tip}
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  large = false,
  xl = false,
  capitalize = false,
  valueClassName = "",
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/20">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 font-semibold ${
          xl ? "text-3xl font-bold" : large ? "text-xl" : "text-sm"
        } ${capitalize ? "capitalize" : ""} ${valueClassName || "text-slate-200"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Meter({ label, value = 0, delay = 0 }) {
  const safeValue = value ?? 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>

        <span className="font-medium">{safeValue}%</span>
      </div>

      <AnimatedBar
        percent={safeValue}
        className="bg-gradient-to-r from-indigo-500 to-cyan-400"
        delay={delay}
      />
    </div>
  );
}

function Verdict({ ok, okText, failText }) {
  return (
    <div
      className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
        ok
          ? "border-green-500/30 bg-green-500/10 text-green-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {ok ? okText : failText}
    </div>
  );
}

function ChangeCard({ title, tone, items, prefix, empty }) {
  const boxes = {
    green: "border-green-500/20 bg-green-500/5 text-green-400",
    blue: "border-sky-500/20 bg-sky-500/5 text-sky-400",
    red: "border-red-500/20 bg-red-500/5 text-red-400",
    amber: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  };

  return (
    <div className={`rounded-2xl border p-5 ${boxes[tone]}`}>
      <h4 className="font-semibold">{title}</h4>

      <div className="mt-4">
        {items.length > 0 ? (
          <Chips items={items} tone={tone} prefix={prefix} />
        ) : (
          <p className="text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}

function CompanyAvatar({ name, large = false }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();

  const palette = [
    "from-indigo-500 to-violet-500",
    "from-cyan-500 to-sky-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-fuchsia-500 to-pink-500",
    "from-rose-500 to-red-500",
  ];

  const index =
    (name || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white shadow-lg shadow-black/30 ${
        palette[index]
      } ${large ? "h-16 w-16 rounded-3xl text-2xl" : "h-10 w-10 rounded-2xl text-base"}`}
    >
      {letter}
    </div>
  );
}

/* =========================================================
   Animation primitives
   ========================================================= */

function AnimatedNumber({ value, suffix = "", duration = 900 }) {
  const target = Number(value) || 0;
  const decimals = Number.isInteger(target) ? 0 : 1;

  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(target);
      return undefined;
    }

    let frame;
    const start = performance.now();

    function tick(time) {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(target * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return (
    <>
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}

function AnimatedBar({
  percent,
  className = "bg-blue-500",
  height = "h-2",
  delay = 0,
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setWidth(Math.max(0, Math.min(Number(percent) || 0, 100)));
    }, 120 + delay);

    return () => clearTimeout(timeout);
  }, [percent, delay]);

  return (
    <div className={`overflow-hidden rounded-full bg-white/5 ${height}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-1000 ease-out ${className}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ScoreRing({ score = 0, color = "#818cf8", size = 128 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(Number(score) || 0, 100));

    const timeout = setTimeout(() => {
      setOffset(circumference * (1 - clamped / 100));
    }, 200);

    return () => clearTimeout(timeout);
  }, [score, circumference]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.7, 0.2, 1)",
            filter: `drop-shadow(0 0 8px ${color}66)`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-bold" style={{ color }}>
          <AnimatedNumber value={score} suffix="%" />
        </p>

        <p className="text-xs text-slate-500">Match Score</p>
      </div>
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`ad-shimmer relative overflow-hidden rounded-3xl bg-white/5 ${className}`}
    />
  );
}

function DetailsSkeleton() {
  return (
    <div className="relative z-0 min-h-screen bg-[#070910] text-white">
      <style>{animationStyles}</style>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
        <Shimmer className="h-4 w-28 !rounded-lg" />

        <div className="mt-6 flex items-start gap-5">
          <Shimmer className="h-16 w-16 shrink-0" />

          <div className="flex-1 space-y-3">
            <Shimmer className="h-4 w-24 !rounded-lg" />
            <Shimmer className="h-12 w-3/4 max-w-lg !rounded-xl" />
            <Shimmer className="h-4 w-40 !rounded-lg" />
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <Shimmer className="h-48" />
          <Shimmer className="h-96" />
          <Shimmer className="h-56" />
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   Overlays
   ========================================================= */

function Modal({ title, subtitle, onClose, children, layer = "z-[100]" }) {
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        closeRef.current();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return createPortal(
    <div
      className={`fixed inset-0 ${layer} flex items-center justify-center p-4`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="ad-pop relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0d16] text-white shadow-2xl shadow-black/60">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0b0d16]/95 p-6 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>

            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}

function ConfirmDialog({ dialog, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!dialog) {
      return undefined;
    }

    function handleKey(event) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [dialog, busy, onCancel]);

  if (!dialog) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="ad-pop relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1020] p-6 shadow-2xl shadow-black/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <Icon name="trash" className="h-6 w-6" />
        </div>

        <h3 id="confirm-title" className="mt-4 text-lg font-semibold text-white">
          {dialog.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">{dialog.message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400 active:scale-95 disabled:opacity-60"
          >
            {busy && <Spinner />}
            {dialog.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  const isError = toast.tone === "error";

  return createPortal(
    <div
      key={toast.key}
      role="status"
      aria-live="polite"
      className="ad-pop fixed bottom-6 right-6 z-[130] max-w-sm"
    >
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl ${
          isError
            ? "border-red-500/30 bg-red-950/80 text-red-100"
            : "border-emerald-500/30 bg-emerald-950/80 text-emerald-100"
        }`}
      >
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
            isError ? "bg-red-500/30" : "bg-emerald-500/30"
          }`}
        >
          <Icon name={isError ? "alert" : "check"} className="h-3 w-3" />
        </span>

        <p className="text-sm">{toast.message}</p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="ml-2 opacity-60 transition hover:opacity-100"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrowLeft: "M19 12H5M11 6l-6 6 6 6",
    alert:
      "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
    edit: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
    trash:
      "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
    tag: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
    mail: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l9 6 9-6",
    copy: "M9 9h10v10H9zM5 15V5h10",
    check: "M5 13l4 4L19 7",
    chat: "M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z",
    target:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    calendar:
      "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    activity: "M3 12h4l3-9 4 18 3-9h4",
    x: "M6 6l12 12M18 6L6 18",
    chevronDown: "M6 9l6 6 6-6",
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

/* =========================================================
   Helpers
   ========================================================= */

function getScoreTier(score) {
  if (score >= 80) {
    return { label: "Excellent Match", hex: "#4ade80", tone: "green" };
  }

  if (score >= 60) {
    return { label: "Good Match", hex: "#facc15", tone: "amber" };
  }

  if (score >= 40) {
    return { label: "Needs Improvement", hex: "#fb923c", tone: "orange" };
  }

  return { label: "Low Match", hex: "#f87171", tone: "red" };
}

function deltaClass(change) {
  if (change > 0) {
    return "text-green-400";
  }

  if (change < 0) {
    return "text-red-400";
  }

  return "text-slate-300";
}

function getTimelineEventStyle(eventType) {
  switch (eventType) {
    case "status_changed":
      return { dot: "bg-blue-500", label: "Status Update" };

    case "deadline_changed":
      return { dot: "bg-yellow-500", label: "Deadline Update" };

    case "resume_match":
      return { dot: "bg-purple-500", label: "Resume Match" };

    case "created":
      return { dot: "bg-green-500", label: "Application Created" };

    case "note":
      return { dot: "bg-cyan-500", label: "Activity" };

    case "email":
      return { dot: "bg-blue-500", label: "Email" };

    case "call":
      return { dot: "bg-green-500", label: "Phone Call" };

    case "interview":
      return { dot: "bg-purple-500", label: "Interview" };

    case "follow_up":
      return { dot: "bg-yellow-500", label: "Follow-up" };

    case "other":
      return { dot: "bg-slate-500", label: "Activity" };

    default:
      return { dot: "bg-slate-500", label: "Application Update" };
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

  return (
    event.event_type
      ?.replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    "Application updated"
  );
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

  const difference = Math.ceil(
    (deadlineDate - today) / (1000 * 60 * 60 * 24)
  );

  if (difference < 0) {
    return {
      label: `${Math.abs(difference)} day${
        Math.abs(difference) === 1 ? "" : "s"
      } overdue`,
      className: "text-red-400",
      badgeClassName: "bg-red-500/10 text-red-300 ring-red-400/20",
    };
  }

  if (difference === 0) {
    return {
      label: "Due today",
      className: "text-orange-400",
      badgeClassName: "bg-orange-500/10 text-orange-300 ring-orange-400/20",
    };
  }

  if (difference <= 3) {
    return {
      label: `${difference} day${difference === 1 ? "" : "s"} left`,
      className: "text-yellow-400",
      badgeClassName: "bg-yellow-500/10 text-yellow-300 ring-yellow-400/20",
    };
  }

  return {
    label: `${difference} days left`,
    className: "text-slate-400",
    badgeClassName: "bg-white/5 text-slate-300 ring-white/10",
  };
}

export default ApplicationDetails;