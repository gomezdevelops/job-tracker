import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Link } from "react-router-dom";

/* =========================================================
   Constants
   ========================================================= */

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offers",
  rejected: "Rejected",
};

const statusStyles = {
  saved: { dot: "bg-slate-400", bar: "bg-slate-400" },
  applied: { dot: "bg-sky-400", bar: "bg-sky-400" },
  screening: { dot: "bg-violet-400", bar: "bg-violet-400" },
  interview: { dot: "bg-amber-400", bar: "bg-amber-400" },
  offer: { dot: "bg-emerald-400", bar: "bg-emerald-400" },
  rejected: { dot: "bg-rose-400", bar: "bg-rose-400" },
};

const animationStyles = `
@keyframes fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes float-slow {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(40px, -30px, 0) scale(1.08); }
}
@keyframes shimmer-sweep {
  100% { transform: translateX(100%); }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
  70%  { box-shadow: 0 0 0 9px rgba(248, 113, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
@keyframes gradient-pan {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.dash-fade-up { animation: fade-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.dash-float { animation: float-slow 16s ease-in-out infinite; }
.dash-pulse { animation: pulse-ring 2s ease-out infinite; }
.dash-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-pan 8s linear infinite;
}
.dash-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: shimmer-sweep 1.5s infinite;
}
.dash-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.dash-reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .dash-fade-up, .dash-float, .dash-pulse, .dash-gradient-text, .dash-shimmer::after {
    animation: none !important;
  }
  .dash-reveal { opacity: 1; transform: none; transition: none; }
}
`;

/* =========================================================
   Page
   ========================================================= */

function Dashboard() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [matchAnalytics, setMatchAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [followUps, setFollowUps] = useState([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpReminders, setFollowUpReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          summaryResponse,
          applicationsResponse,
          matchAnalyticsResponse,
        ] = await Promise.all([
          api.get("/analytics/summary"),

          api.get("/applications", {
            params: {
              sort_by: "deadline",
              order: "asc",
            },
          }),

          api.get("/analytics/matches"),
        ]);

        setSummary(summaryResponse.data);
        setApplications(applicationsResponse.data);
        setMatchAnalytics(matchAnalyticsResponse.data);
      } catch (error) {
        console.error(error);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function loadFollowUps() {
    setFollowUpsLoading(true);

    try {
      const response = await api.get("/applications/follow-ups");
      setFollowUps(response.data);
    } catch (error) {
      console.error("Failed to load dashboard follow-ups:", error);
    } finally {
      setFollowUpsLoading(false);
    }
  }

  useEffect(() => {
    loadFollowUps();
  }, []);

  async function loadFollowUpReminders() {
    try {
      setRemindersLoading(true);

      const response = await api.get(
        "/applications/follow-ups/reminders"
      );

      setFollowUpReminders(response.data);
    } catch (error) {
      console.error(
        "Failed to load follow-up reminders:",
        error
      );
    } finally {
      setRemindersLoading(false);
    }
  }

  useEffect(() => {
    loadFollowUpReminders();
  }, []);

  async function loadInsights() {
    setInsightsLoading(true);
    setInsightsError("");

    try {
      const response = await api.get("/analytics/insights");
      setInsights(response.data);
    } catch (error) {
      setInsightsError(
        error.response?.data?.detail ||
          "Failed to load application insights."
      );
    } finally {
      setInsightsLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, []);

  async function handleCompleteFollowUp(followUp) {
    try {
      await api.patch(
        `/applications/${followUp.application_id}/follow-ups/${followUp.id}`,
        {
          status: "completed",
        }
      );

      await loadFollowUps();
      await loadFollowUpReminders();
    } catch (error) {
      console.error("Failed to complete follow-up:", error);
    }
  }

  async function handleDeleteFollowUp(followUp) {
    try {
      await api.delete(
        `/applications/${followUp.application_id}/follow-ups/${followUp.id}`
      );

      await loadFollowUps();
      await loadFollowUpReminders();
    } catch (error) {
      console.error("Failed to delete follow-up:", error);
    }
  }

  async function handleStatusChange(applicationId, newStatus) {
    try {
      const response = await api.patch(
        `/applications/${applicationId}`,
        {
          status: newStatus,
        }
      );

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                ...response.data,
              }
            : application
        )
      );

      loadInsights();

      // Refresh summary counts
      const summaryResponse = await api.get(
        "/analytics/summary"
      );

      setSummary(summaryResponse.data);
    } catch (error) {
      console.error(error);
      alert("Unable to update application status.");
    }
  }

  /* ---------- Derived data ---------- */

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const pendingFollowUps = followUps.filter(
    (followUp) => followUp.status === "pending"
  );

  const todayFollowUps = pendingFollowUps.filter((followUp) => {
    const date = new Date(followUp.scheduled_at);
    return date >= startOfToday && date <= endOfToday;
  });

  const upcomingFollowUps = pendingFollowUps.filter((followUp) => {
    const date = new Date(followUp.scheduled_at);
    return date > endOfToday;
  });

  const overdueFollowUps = pendingFollowUps.filter((followUp) => {
    const date = new Date(followUp.scheduled_at);
    return date < startOfToday;
  });

  const requiredSkillGaps =
    matchAnalytics?.skill_gaps?.required || [];

  const preferredSkillGaps =
    matchAnalytics?.skill_gaps?.preferred || [];

  const priorityCounts = {
    high: applications.filter(
      (application) => application.priority === "high"
    ).length,
    medium: applications.filter(
      (application) => application.priority === "medium"
    ).length,
    low: applications.filter(
      (application) => application.priority === "low"
    ).length,
  };

  const upcomingDeadlines = applications
    .filter((application) => application.deadline)
    .sort(
      (a, b) =>
        new Date(`${a.deadline}T00:00:00`) -
        new Date(`${b.deadline}T00:00:00`)
    )
    .slice(0, 5);

  const urgentApplications = applications
    .filter(isUrgentApplication)
    .sort(
      (a, b) =>
        new Date(`${a.deadline}T00:00:00`) -
        new Date(`${b.deadline}T00:00:00`)
    )
    .slice(0, 5);

  const pipelineTotal = Object.keys(statusLabels).reduce(
    (total, status) => total + (summary?.[status] || 0),
    0
  );

  const priorityTotal =
    priorityCounts.high +
    priorityCounts.medium +
    priorityCounts.low;

  const maxRequiredGap = Math.max(
    1,
    ...requiredSkillGaps.map((gap) => gap.count)
  );

  const maxPreferredGap = Math.max(
    1,
    ...preferredSkillGaps.map((gap) => gap.count)
  );

  function findMatch(applicationId) {
    return matchAnalytics?.top_matches?.find(
      (match) => match.application_id === applicationId
    );
  }

  /* ---------- Loading / error ---------- */

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070910] px-6 text-white">
        <style>{animationStyles}</style>

        <div className="dash-fade-up max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
            <Icon name="alert" className="h-6 w-6" />
          </div>

          <p className="mt-4 text-lg font-semibold text-red-200">
            {error}
          </p>

          <p className="mt-1 text-sm text-red-200/60">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 ring-1 ring-red-400/30 transition hover:bg-red-500/20"
          >
            Reload dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="relative z-0 min-h-screen bg-[#070910] text-white">
      <style>{animationStyles}</style>

      {/* Ambient background: pinned to the viewport but confined to this page's content area, so it never covers the app sidebar or top bar */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 -mb-[100vh] h-screen overflow-hidden"
      >
        <div className="dash-float absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="dash-float absolute -right-24 top-1/3 h-[24rem] w-[24rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="dash-float absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Welcome */}
        <section className="dash-fade-up flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-indigo-300">
              {getGreeting()}
            </p>

            <h2 className="dash-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Welcome back
            </h2>

            <p className="mt-3 truncate text-slate-400">
              {user?.email}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <HeroPill
                label="Interviews"
                value={summary.interview}
                dot="bg-amber-400"
              />

              <HeroPill
                label="Offers"
                value={summary.offer}
                dot="bg-emerald-400"
              />

              <HeroPill
                label="Reminders today"
                value={followUpReminders.length}
                dot="bg-rose-400"
                pulse={followUpReminders.length > 0}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <ProgressRing
              value={matchAnalytics?.average_score || 0}
              size={112}
              stroke={9}
            />

            <div>
              <p className="text-sm text-slate-400">
                Average resume match
              </p>

              <p className="mt-1 text-3xl font-bold">
                {matchAnalytics ? (
                  <AnimatedNumber
                    value={matchAnalytics.average_score}
                    suffix="%"
                  />
                ) : (
                  "—"
                )}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Across{" "}
                {matchAnalytics?.analyzed_applications || 0}{" "}
                analyzed jobs
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal delay={0}>
              <QuickAction
                to="/applications/new"
                icon="plus"
                title="Add Application"
                description="Track a new job opportunity."
                gradient="from-indigo-500/20 to-indigo-500/0"
                iconClassName="bg-indigo-500/15 text-indigo-300"
              />
            </Reveal>

            <Reveal delay={80}>
              <QuickAction
                to="/applications"
                icon="list"
                title="View Applications"
                description="Manage your complete application pipeline."
                gradient="from-cyan-500/20 to-cyan-500/0"
                iconClassName="bg-cyan-500/15 text-cyan-300"
              />
            </Reveal>

            <Reveal delay={160}>
              <QuickAction
                to="/resumes"
                icon="file"
                title="Manage Resumes"
                description="Upload and manage your resumes."
                gradient="from-fuchsia-500/20 to-fuchsia-500/0"
                iconClassName="bg-fuchsia-500/15 text-fuchsia-300"
              />
            </Reveal>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal delay={0}>
            <StatCard
              label="Total Applications"
              value={summary.total_applications}
              to="/applications"
              accent="from-indigo-400 to-indigo-600"
            />
          </Reveal>

          <Reveal delay={60}>
            <StatCard
              label="Applied"
              value={summary.applied}
              to="/applications?status=applied"
              accent="from-sky-400 to-sky-600"
            />
          </Reveal>

          <Reveal delay={120}>
            <StatCard
              label="Interviews"
              value={summary.interview}
              to="/applications?status=interview"
              accent="from-amber-400 to-orange-500"
            />
          </Reveal>

          <Reveal delay={180}>
            <StatCard
              label="Offers"
              value={summary.offer}
              to="/applications?status=offer"
              accent="from-emerald-400 to-emerald-600"
            />
          </Reveal>

          <Reveal delay={240}>
            <StatCard
              label="Average Match"
              value={
                matchAnalytics
                  ? matchAnalytics.average_score
                  : null
              }
              suffix="%"
              accent="from-violet-400 to-fuchsia-500"
            />
          </Reveal>

          <Reveal delay={300}>
            <StatCard
              label="Analyzed Jobs"
              value={
                matchAnalytics
                  ? matchAnalytics.analyzed_applications
                  : 0
              }
              accent="from-cyan-400 to-teal-500"
            />
          </Reveal>
        </section>

        {/* Follow-up Reminders */}
        <Reveal className="mt-12">
          <SectionHeader
            title="Follow-up Reminders"
            subtitle="Follow-ups that need your attention today."
            action={
              followUpReminders.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300 ring-1 ring-red-400/20">
                  <span className="dash-pulse h-2 w-2 rounded-full bg-red-400" />
                  {followUpReminders.length}{" "}
                  {followUpReminders.length === 1
                    ? "reminder"
                    : "reminders"}
                </span>
              )
            }
          />

          <GlassCard>
            {remindersLoading ? (
              <div className="space-y-3">
                <Shimmer className="h-24" />
                <Shimmer className="h-24" />
              </div>
            ) : followUpReminders.length === 0 ? (
              <EmptyState
                icon="bell"
                title="No follow-up reminders right now."
                description="You're clear for today."
              />
            ) : (
              <div className="space-y-3">
                {followUpReminders.map((reminder, index) => (
                  <FollowUpItem
                    key={reminder.id}
                    followUp={reminder}
                    index={index}
                    badge={
                      reminder.overdue ? (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-400/20">
                          Overdue
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400 ring-1 ring-yellow-400/20">
                          Today
                        </span>
                      )
                    }
                    onComplete={handleCompleteFollowUp}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </Reveal>

        {/* Follow-ups */}
        <Reveal className="mt-12">
          <SectionHeader
            title="Follow-ups"
            subtitle="Stay on top of your application follow-ups."
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="group relative overflow-hidden rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-400/10 blur-2xl transition group-hover:bg-yellow-400/20" />
              <p className="text-sm text-gray-400">Today</p>
              <p className="mt-2 text-4xl font-bold text-yellow-400">
                <AnimatedNumber value={todayFollowUps.length} />
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-purple-400/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-400/10 blur-2xl transition group-hover:bg-purple-400/20" />
              <p className="text-sm text-gray-400">Upcoming</p>
              <p className="mt-2 text-4xl font-bold text-purple-400">
                <AnimatedNumber value={upcomingFollowUps.length} />
              </p>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-red-500/20 bg-red-500/5 p-5 transition duration-300 hover:-translate-y-1 hover:border-red-400/40">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-red-400/10 blur-2xl transition group-hover:bg-red-400/20" />
              <p className="text-sm text-gray-400">Overdue</p>
              <p className="mt-2 text-4xl font-bold text-red-400">
                <AnimatedNumber value={overdueFollowUps.length} />
              </p>
            </div>
          </div>

          <GlassCard className="mt-6">
            {followUpsLoading ? (
              <div className="space-y-3">
                <Shimmer className="h-24" />
                <Shimmer className="h-24" />
              </div>
            ) : pendingFollowUps.length === 0 ? (
              <EmptyState
                icon="clock"
                title="No pending follow-ups."
                description="Schedule one from any application."
              />
            ) : (
              <div className="space-y-3">
                {pendingFollowUps.slice(0, 5).map((followUp, index) => (
                  <FollowUpItem
                    key={followUp.id}
                    followUp={followUp}
                    index={index}
                    onComplete={handleCompleteFollowUp}
                    onDelete={handleDeleteFollowUp}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </Reveal>

        {/* Urgent Applications */}
        <Reveal className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Urgent Applications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Applications that need your attention right now.
                </p>
              </div>

              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-400/20">
                {urgentApplications.length}
              </span>
            </div>

            {urgentApplications.length === 0 ? (
              <div className="relative mt-6 rounded-2xl bg-black/20 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                  <Icon name="check" className="h-6 w-6" />
                </div>

                <p className="mt-3 text-green-400">
                  Nothing urgent right now.
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  You're all caught up.
                </p>
              </div>
            ) : (
              <div className="relative mt-6 space-y-3">
                {urgentApplications.map((application) => {
                  const deadlineStatus = getDeadlineStatus(
                    application.deadline
                  );

                  return (
                    <Link
                      key={application.id}
                      to={`/applications/${application.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <CompanyAvatar name={application.company} />

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">
                              {application.role}
                            </p>

                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 ring-1 ring-red-400/20">
                              Urgent
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-400">
                            {application.company}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {formatDashboardDate(application.deadline)}
                        </span>

                        {deadlineStatus && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${deadlineStatus.className}`}
                          >
                            {deadlineStatus.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* Upcoming Deadlines */}
        <Reveal className="mt-12">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Upcoming Deadlines
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Applications that need your attention soon.
                </p>
              </div>

              <Link
                to="/applications"
                className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                View all
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon="clock"
                title="No upcoming deadlines."
                description="Add deadlines to your applications to see them here."
              />
            ) : (
              <div className="mt-6 space-y-3">
                {upcomingDeadlines.map((application) => {
                  const deadlineStatus = getDeadlineStatus(
                    application.deadline
                  );

                  return (
                    <Link
                      key={application.id}
                      to={`/applications/${application.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <CompanyAvatar name={application.company} />

                        <div className="min-w-0">
                          <p className="font-medium">
                            {application.role}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {application.company}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {formatDashboardDate(application.deadline)}
                        </span>

                        {deadlineStatus && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${deadlineStatus.className}`}
                          >
                            {deadlineStatus.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </Reveal>

        {/* Pipeline */}
        <Reveal className="mt-12">
          <GlassCard>
            <h3 className="text-lg font-semibold">
              Application Pipeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Where every application stands right now.
            </p>

            {/* Segmented bar */}
            <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/5">
              {Object.keys(statusLabels).map((status, index) => {
                const count = summary[status] || 0;

                if (count === 0 || pipelineTotal === 0) {
                  return null;
                }

                return (
                  <SegmentBar
                    key={status}
                    percent={(count / pipelineTotal) * 100}
                    className={statusStyles[status].bar}
                    delay={index * 90}
                    title={`${statusLabels[status]}: ${count}`}
                  />
                );
              })}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(statusLabels).map(([status, label]) => (
                <Link
                  key={status}
                  to={`/applications?status=${status}`}
                  className="group rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-black/30"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${statusStyles[status].dot}`}
                    />

                    <p className="text-sm text-slate-400">{label}</p>
                  </div>

                  <p className="mt-2 text-3xl font-bold">
                    <AnimatedNumber value={summary[status] || 0} />
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {pipelineTotal > 0
                      ? Math.round(
                          ((summary[status] || 0) / pipelineTotal) * 100
                        )
                      : 0}
                    % of total
                  </p>
                </Link>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        {/* Priority Overview */}
        <Reveal className="mt-12">
          <GlassCard>
            <div>
              <h3 className="text-lg font-semibold">
                Priority Overview
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                See how your applications are prioritized.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Link
                to="/applications"
                className="group rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-red-400/30 hover:bg-black/30"
              >
                <p className="text-sm text-red-400">High Priority</p>

                <p className="mt-2 text-4xl font-bold">
                  <AnimatedNumber value={priorityCounts.high} />
                </p>

                <div className="mt-3">
                  <AnimatedBar
                    percent={
                      priorityTotal > 0
                        ? (priorityCounts.high / priorityTotal) * 100
                        : 0
                    }
                    className="bg-gradient-to-r from-red-500 to-rose-400"
                    height="h-1.5"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Needs the most attention
                </p>
              </Link>

              <Link
                to="/applications"
                className="group rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/30 hover:bg-black/30"
              >
                <p className="text-sm text-yellow-400">
                  Medium Priority
                </p>

                <p className="mt-2 text-4xl font-bold">
                  <AnimatedNumber value={priorityCounts.medium} />
                </p>

                <div className="mt-3">
                  <AnimatedBar
                    percent={
                      priorityTotal > 0
                        ? (priorityCounts.medium / priorityTotal) * 100
                        : 0
                    }
                    className="bg-gradient-to-r from-yellow-500 to-amber-300"
                    height="h-1.5"
                    delay={100}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Worth following up
                </p>
              </Link>

              <Link
                to="/applications"
                className="group rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-black/30"
              >
                <p className="text-sm text-slate-400">Low Priority</p>

                <p className="mt-2 text-4xl font-bold">
                  <AnimatedNumber value={priorityCounts.low} />
                </p>

                <div className="mt-3">
                  <AnimatedBar
                    percent={
                      priorityTotal > 0
                        ? (priorityCounts.low / priorityTotal) * 100
                        : 0
                    }
                    className="bg-gradient-to-r from-slate-500 to-slate-300"
                    height="h-1.5"
                    delay={200}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Keep on your radar
                </p>
              </Link>
            </div>
          </GlassCard>
        </Reveal>

        {/* Deadlines */}
        <Reveal className="mt-12">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Deadlines</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Track overdue and upcoming application deadlines.
                </p>
              </div>

              <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-slate-300 ring-1 ring-white/10">
                {
                  applications.filter(
                    (application) => application.deadline
                  ).length
                }
              </span>
            </div>

            <div className="mt-6 space-y-6">
              {(() => {
                const deadlineApplications = applications
                  .filter((application) => application.deadline)
                  .slice(0, 5);

                const overdue = deadlineApplications.filter(
                  (application) =>
                    getDeadlineInfo(application.deadline)?.type ===
                    "overdue"
                );

                const dueSoon = deadlineApplications.filter(
                  (application) => {
                    const info = getDeadlineInfo(
                      application.deadline
                    );

                    return (
                      info?.type === "today" || info?.type === "soon"
                    );
                  }
                );

                const upcoming = deadlineApplications.filter(
                  (application) =>
                    getDeadlineInfo(application.deadline)?.type ===
                    "upcoming"
                );

                return (
                  <>
                    {/* Overdue */}
                    {overdue.length > 0 && (
                      <DeadlineGroup
                        title="Overdue"
                        applications={overdue}
                        titleClassName="text-red-400"
                      />
                    )}

                    {/* Due Soon */}
                    {dueSoon.length > 0 && (
                      <DeadlineGroup
                        title="Due Soon"
                        applications={dueSoon}
                        titleClassName="text-yellow-400"
                      />
                    )}

                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                      <DeadlineGroup
                        title="Upcoming"
                        applications={upcoming}
                        titleClassName="text-slate-300"
                      />
                    )}

                    {deadlineApplications.length === 0 && (
                      <EmptyState
                        icon="clock"
                        title="No application deadlines."
                        description="Deadlines you add will show up here."
                      />
                    )}
                  </>
                );
              })()}
            </div>
          </GlassCard>
        </Reveal>

        {/* Application Insights */}
        <Reveal className="mt-12">
          <GlassCard>
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Application Insights
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                A quick overview of your application activity and
                resume matching.
              </p>
            </div>

            {insightsLoading && !insights && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Shimmer className="h-28" />
                <Shimmer className="h-28" />
                <Shimmer className="h-28" />
                <Shimmer className="h-28" />
              </div>
            )}

            {insightsError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {insightsError}
              </div>
            )}

            {insights && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <p className="text-sm text-gray-400">Applications</p>
                  <p className="mt-2 text-3xl font-bold">
                    <AnimatedNumber value={insights.total_applications} />
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <p className="text-sm text-gray-400">Analyzed</p>
                  <p className="mt-2 text-3xl font-bold">
                    <AnimatedNumber
                      value={insights.analyzed_applications}
                    />
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <p className="text-sm text-gray-400">Average Match</p>
                  <p className="mt-2 text-3xl font-bold">
                    {insights.average_match_score !== null &&
                    insights.average_match_score !== undefined ? (
                      <AnimatedNumber
                        value={insights.average_match_score}
                        suffix="%"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
                  <p className="text-sm text-gray-400">High Priority</p>
                  <p className="mt-2 text-3xl font-bold">
                    <AnimatedNumber
                      value={insights.priority_counts?.high || 0}
                    />
                  </p>
                </div>
              </div>
            )}

            {insights && (
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-300">
                    Application Status
                  </h3>

                  <div className="space-y-2">
                    {Object.entries(insights.status_counts || {}).map(
                      ([status, count], index) => (
                        <div
                          key={status}
                          className="rounded-xl bg-black/20 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm capitalize text-gray-300">
                              {status}
                            </span>

                            <span className="font-semibold">
                              {count}
                            </span>
                          </div>

                          <div className="mt-2">
                            <AnimatedBar
                              percent={
                                insights.total_applications > 0
                                  ? (count / insights.total_applications) *
                                    100
                                  : 0
                              }
                              className={
                                statusStyles[status]?.bar ||
                                "bg-indigo-400"
                              }
                              height="h-1"
                              delay={index * 70}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-300">
                    Priority Distribution
                  </h3>

                  <div className="space-y-2">
                    {Object.entries(insights.priority_counts || {}).map(
                      ([priority, count], index) => (
                        <div
                          key={priority}
                          className="rounded-xl bg-black/20 px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm capitalize text-gray-300">
                              {priority}
                            </span>

                            <span className="font-semibold">
                              {count}
                            </span>
                          </div>

                          <div className="mt-2">
                            <AnimatedBar
                              percent={
                                insights.total_applications > 0
                                  ? (count / insights.total_applications) *
                                    100
                                  : 0
                              }
                              className={
                                priority === "high"
                                  ? "bg-red-400"
                                  : priority === "low"
                                    ? "bg-slate-400"
                                    : "bg-yellow-400"
                              }
                              height="h-1"
                              delay={index * 70}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </Reveal>

        {insights?.ai_insights && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* AI Summary */}
            <Reveal className="lg:col-span-2">
              <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6 backdrop-blur-xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-200">
                    <Icon name="sparkle" className="h-5 w-5" />
                  </div>

                  <h3 className="font-semibold">
                    AI Application Summary
                  </h3>
                </div>

                <p className="relative mt-4 text-sm leading-6 text-gray-300">
                  {insights.ai_insights.summary}
                </p>
              </div>
            </Reveal>

            {/* Recommendations */}
            <Reveal delay={0}>
              <InsightList
                title="Recommendations"
                items={insights.ai_insights.recommendations}
                dot="bg-indigo-400"
              />
            </Reveal>

            {/* Positive Patterns */}
            <Reveal delay={80}>
              <InsightList
                title="Positive Patterns"
                items={insights.ai_insights.positive_patterns}
                dot="bg-emerald-400"
              />
            </Reveal>

            {/* Areas to Improve */}
            <Reveal delay={0}>
              <InsightList
                title="Areas to Improve"
                items={insights.ai_insights.areas_to_improve}
                dot="bg-amber-400"
              />
            </Reveal>

            {/* Next Actions */}
            <Reveal delay={80}>
              <InsightList
                title="Suggested Next Actions"
                items={insights.ai_insights.next_actions}
                dot="bg-cyan-400"
              />
            </Reveal>
          </div>
        )}

        {/* AI Match Overview */}
        <Reveal className="mt-12">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Top Matches</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Applications with the strongest resume compatibility.
                </p>
              </div>

              <Link
                to="/applications"
                className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                View applications
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {matchAnalytics?.top_matches?.slice(0, 4).map((match) => {
                const matchLabel = getMatchLabel(match.score);

                return (
                  <Link
                    key={match.application_id}
                    to={`/applications/${match.application_id}`}
                    className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-black/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <CompanyAvatar name={match.company} />

                        <div className="min-w-0">
                          <p className="font-medium">{match.company}</p>

                          <p className="mt-1 truncate text-sm text-slate-400">
                            {match.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end">
                        <ProgressRing
                          value={match.score}
                          size={64}
                          stroke={6}
                          showLabel
                        />

                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${matchLabel.className}`}
                        >
                          {matchLabel.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-300 ring-1 ring-green-400/20">
                        {match.matched_skills?.length || 0} matched
                      </span>

                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300 ring-1 ring-red-400/20">
                        {match.missing_skills?.length || 0} missing
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          match.current_priority === "high"
                            ? "bg-red-500/10 text-red-300 ring-1 ring-red-400/20"
                            : match.current_priority === "low"
                              ? "bg-green-500/10 text-green-300 ring-1 ring-green-400/20"
                              : "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/20"
                        }`}
                      >
                        Priority:{" "}
                        {(match.current_priority || "medium")
                          .charAt(0)
                          .toUpperCase() +
                          (match.current_priority || "medium").slice(1)}
                      </span>

                      {match.suggested_priority &&
                        match.suggested_priority !==
                          match.current_priority && (
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-blue-400/20">
                            AI suggests:{" "}
                            {match.suggested_priority
                              .charAt(0)
                              .toUpperCase() +
                              match.suggested_priority.slice(1)}
                          </span>
                        )}
                    </div>

                    {match.missing_skills?.length > 0 && (
                      <p className="mt-3 text-xs text-slate-500">
                        Missing:{" "}
                        {match.missing_skills.slice(0, 3).join(", ")}
                        {match.missing_skills.length > 3 ? "..." : ""}
                      </p>
                    )}
                  </Link>
                );
              })}

              {(!matchAnalytics?.top_matches ||
                matchAnalytics.top_matches.length === 0) && (
                <div className="md:col-span-2">
                  <EmptyState
                    icon="sparkle"
                    title="No resume matches yet."
                    description="Analyze a resume against a job description to see your match scores here."
                  />
                </div>
              )}
            </div>
          </GlassCard>
        </Reveal>

        {/* Match Score Distribution */}
        <Reveal className="mt-12">
          <GlassCard>
            <div>
              <h3 className="text-lg font-semibold">
                Match Score Distribution
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                See how your analyzed applications are distributed by
                match score.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {[
                {
                  label: "90–100%",
                  key: "90_100",
                  description: "Excellent matches",
                  bar: "bg-gradient-to-r from-emerald-500 to-emerald-300",
                },
                {
                  label: "75–89%",
                  key: "75_89",
                  description: "Strong matches",
                  bar: "bg-gradient-to-r from-sky-500 to-sky-300",
                },
                {
                  label: "60–74%",
                  key: "60_74",
                  description: "Moderate matches",
                  bar: "bg-gradient-to-r from-amber-500 to-amber-300",
                },
                {
                  label: "Below 60%",
                  key: "below_60",
                  description: "Weak matches",
                  bar: "bg-gradient-to-r from-rose-500 to-rose-300",
                },
              ].map((bucket, index) => {
                const count =
                  matchAnalytics?.score_distribution?.[bucket.key] || 0;

                const total = matchAnalytics?.analyzed_applications || 0;

                const percentage =
                  total > 0 ? Math.round((count / total) * 100) : 0;

                return (
                  <div key={bucket.key}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {bucket.label}
                        </p>

                        <p className="text-xs text-slate-500">
                          {bucket.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-semibold">
                          {count}
                        </span>

                        <span className="ml-2 text-xs text-slate-500">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <AnimatedBar
                        percent={percentage}
                        className={bucket.bar}
                        delay={index * 100}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </Reveal>

        {/* Skill Gaps */}
        <Reveal className="mt-12">
          <GlassCard>
            <div>
              <h3 className="text-lg font-semibold">Skill Gaps</h3>

              <p className="mt-1 text-sm text-slate-500">
                Skills frequently missing from your resume matches.
              </p>
            </div>

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {/* Required Skills */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">
                      Required Skills
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Skills you're missing that are required by jobs.
                    </p>
                  </div>

                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-300 ring-1 ring-red-400/20">
                    Required
                  </span>
                </div>

                {requiredSkillGaps.length === 0 ? (
                  <div className="rounded-2xl bg-black/20 p-5 text-center">
                    <p className="text-sm text-green-400">
                      No required skill gaps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requiredSkillGaps.map(
                      ({ skill, count }, index) => (
                        <div
                          key={skill}
                          className="rounded-2xl bg-black/20 p-4 transition duration-300 hover:bg-black/30"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">
                                {skill}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Missing from {count} application
                                {count === 1 ? "" : "s"}
                              </p>
                            </div>

                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-400/20">
                              {count}
                            </span>
                          </div>

                          <div className="mt-3">
                            <AnimatedBar
                              percent={(count / maxRequiredGap) * 100}
                              className="bg-gradient-to-r from-red-500 to-rose-300"
                              height="h-1"
                              delay={index * 80}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Preferred Skills */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">
                      Preferred Skills
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Nice-to-have skills missing from jobs.
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs text-yellow-300 ring-1 ring-yellow-400/20">
                    Preferred
                  </span>
                </div>

                {preferredSkillGaps.length === 0 ? (
                  <div className="rounded-2xl bg-black/20 p-5 text-center">
                    <p className="text-sm text-slate-400">
                      No preferred skill gaps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preferredSkillGaps.map(
                      ({ skill, count }, index) => (
                        <div
                          key={skill}
                          className="rounded-2xl bg-black/20 p-4 transition duration-300 hover:bg-black/30"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">
                                {skill}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Missing from {count} application
                                {count === 1 ? "" : "s"}
                              </p>
                            </div>

                            <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300 ring-1 ring-yellow-400/20">
                              {count}
                            </span>
                          </div>

                          <div className="mt-3">
                            <AnimatedBar
                              percent={(count / maxPreferredGap) * 100}
                              className="bg-gradient-to-r from-yellow-500 to-amber-300"
                              height="h-1"
                              delay={index * 80}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </Reveal>

        {/* Recent Applications */}
        <Reveal className="mt-12">
          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Recent Applications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest job applications.
                </p>
              </div>

              <Link
                to="/applications"
                className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {applications.slice(0, 5).map((application) => {
                const deadlineInfo = getDeadlineInfo(
                  application.deadline
                );

                const match = findMatch(application.id);

                return (
                  <div
                    key={application.id}
                    className="group rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-black/30"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Application Info */}
                      <Link
                        to={`/applications/${application.id}`}
                        className="flex min-w-0 items-center gap-4"
                      >
                        <CompanyAvatar name={application.company} />

                        <div className="min-w-0">
                          <p className="font-medium">
                            {application.company}
                          </p>

                          <p className="mt-1 text-sm text-slate-400">
                            {application.role}
                          </p>

                          {deadlineInfo && (
                            <div className="mt-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${deadlineInfo.badgeClassName}`}
                              >
                                {deadlineInfo.label}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Match Score */}
                      {match && (
                        <div className="rounded-full bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 ring-1 ring-purple-400/20">
                          {match.score}% Match
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={application.status}
                          onChange={(event) =>
                            handleStatusChange(
                              application.id,
                              event.target.value
                            )
                          }
                          className="rounded-full border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none transition hover:border-white/20 focus:border-indigo-400"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        <Link
                          to={`/applications/${application.id}`}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10"
                        >
                          View
                        </Link>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Added {formatDateTime(application.created_at)}
                    </p>
                  </div>
                );
              })}

              {applications.length === 0 && (
                <EmptyState
                  icon="list"
                  title="No applications yet."
                  description="Add your first application to start tracking."
                />
              )}
            </div>
          </GlassCard>
        </Reveal>
      </main>
    </div>
  );
}

/* =========================================================
   Animation primitives
   ========================================================= */

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
      { threshold: 0.06 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`dash-reveal ${visible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function AnimatedNumber({ value, suffix = "", duration = 1000 }) {
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
      setWidth(Math.max(0, Math.min(percent, 100)));
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

function SegmentBar({ percent, className, delay = 0, title }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth(percent), 150 + delay);

    return () => clearTimeout(timeout);
  }, [percent, delay]);

  return (
    <div
      title={title}
      className={`h-full transition-[width] duration-1000 ease-out ${className}`}
      style={{ width: `${width}%` }}
    />
  );
}

function ProgressRing({
  value = 0,
  size = 112,
  stroke = 9,
  showLabel = false,
}) {
  const gradientId = useId().replace(/:/g, "");

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(Number(value) || 0, 100));

    const timeout = setTimeout(() => {
      setOffset(circumference * (1 - clamped / 100));
    }, 200);

    return () => clearTimeout(timeout);
  }, [value, circumference]);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

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
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.7, 0.2, 1)",
          }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
          {Math.round(value)}%
        </div>
      )}
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`dash-shimmer relative overflow-hidden rounded-2xl bg-white/5 ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#070910] px-4 py-10 text-white sm:px-6">
      <style>{animationStyles}</style>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-12 w-72" />
            <Shimmer className="h-4 w-48" />
          </div>

          <Shimmer className="h-36 w-full lg:w-96" />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Shimmer className="h-28" />
          <Shimmer className="h-28" />
          <Shimmer className="h-28" />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
          <Shimmer className="h-32" />
        </div>

        <Shimmer className="mt-10 h-64" />
      </div>
    </div>
  );
}

/* =========================================================
   UI components
   ========================================================= */

function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>

        {subtitle && (
          <p className="text-sm text-gray-400">{subtitle}</p>
        )}
      </div>

      {action || null}
    </div>
  );
}

function HeroPill({ label, value, dot, pulse = false }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm backdrop-blur">
      <span
        className={`h-2 w-2 rounded-full ${dot} ${pulse ? "dash-pulse" : ""}`}
      />

      <span className="text-slate-400">{label}</span>

      <span className="font-semibold text-white">
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
  gradient,
  iconClassName,
}) {
  return (
    <Link
      to={to}
      className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition duration-500 group-hover:opacity-100`}
      />

      <div className="relative flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-110 ${iconClassName}`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>

        <Icon
          name="chevron"
          className="h-5 w-5 text-slate-600 transition duration-300 group-hover:translate-x-1 group-hover:text-slate-300"
        />
      </div>

      <p className="relative mt-5 text-lg font-semibold">{title}</p>

      <p className="relative mt-2 text-sm text-slate-400">
        {description}
      </p>
    </Link>
  );
}

function StatCard({ label, value, suffix = "", to, accent }) {
  const content = (
    <>
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-60 transition duration-300 group-hover:opacity-100`}
      />

      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl transition duration-500 group-hover:opacity-30`}
      />

      <p className="relative text-sm text-slate-400">{label}</p>

      <p className="relative mt-3 text-4xl font-bold tracking-tight">
        {value === null || value === undefined ? (
          "—"
        ) : (
          <AnimatedNumber value={value} suffix={suffix} />
        )}
      </p>
    </>
  );

  const classes =
    "group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20";

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

function CompanyAvatar({ name }) {
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
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palette.length;

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-lg shadow-black/30 ${palette[index]}`}
    >
      {letter}
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="mt-2 rounded-2xl bg-black/20 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>

      {description && (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      )}
    </div>
  );
}

function FollowUpItem({
  followUp,
  badge,
  index = 0,
  onComplete,
  onDelete,
}) {
  return (
    <div
      className="dash-fade-up flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-300 hover:border-white/20 hover:bg-black/30 md:flex-row md:items-center md:justify-between"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex min-w-0 items-start gap-4">
        <CompanyAvatar name={followUp.company} />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white">{followUp.company}</p>

            {badge}
          </div>

          <p className="text-sm text-gray-400">{followUp.role}</p>

          {followUp.note && (
            <p className="mt-1 text-xs text-gray-500">
              {followUp.note}
            </p>
          )}

          <p className="mt-2 text-sm text-gray-400">
            {new Date(followUp.scheduled_at).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/applications/${followUp.application_id}`}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          View Application
        </Link>

        <button
          type="button"
          onClick={() => onComplete(followUp)}
          className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-400 transition hover:bg-green-500/20 active:scale-95"
        >
          Mark Done
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(followUp)}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 active:scale-95"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function InsightList({ title, items, dot }) {
  return (
    <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
      <h3 className="font-semibold">{title}</h3>

      <div className="mt-4 space-y-3">
        {items?.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition duration-300 hover:border-white/20 hover:bg-white/[0.08]"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
            />

            <p className="text-sm leading-5 text-gray-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeadlineGroup({ title, applications, titleClassName }) {
  return (
    <div>
      <h4 className={`mb-3 text-sm font-semibold ${titleClassName}`}>
        {title}
      </h4>

      <div className="space-y-3">
        {applications.map((application) => {
          const deadlineInfo = getDeadlineInfo(application.deadline);

          return (
            <Link
              key={application.id}
              to={`/applications/${application.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <CompanyAvatar name={application.company} />

                <div>
                  <p className="font-medium">{application.company}</p>

                  <p className="text-sm text-slate-400">
                    {application.role}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm font-medium text-slate-200">
                  {formatDate(application.deadline)}
                </p>

                {deadlineInfo && (
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${deadlineInfo.badgeClassName}`}
                  >
                    {deadlineInfo.label}
                  </span>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  {statusLabels[application.status]}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    chevron: "M9 6l6 6-6 6",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    check: "M5 13l4 4L19 7",
    alert: "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
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

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
      type: "overdue",
      label: `${Math.abs(difference)} day${
        Math.abs(difference) === 1 ? "" : "s"
      } overdue`,
      badgeClassName:
        "bg-red-500/10 text-red-300 ring-1 ring-red-400/20",
    };
  }

  if (difference === 0) {
    return {
      type: "today",
      label: "Due today",
      badgeClassName:
        "bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/20",
    };
  }

  if (difference <= 3) {
    return {
      type: "soon",
      label: `${difference} day${difference === 1 ? "" : "s"} left`,
      badgeClassName:
        "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/20",
    };
  }

  return {
    type: "upcoming",
    label: `${difference} days left`,
    badgeClassName: "bg-white/5 text-slate-300 ring-1 ring-white/10",
  };
}

function getDeadlineStatus(value) {
  if (!value) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${value}T00:00:00`);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();

  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      label: "Overdue",
      className: "bg-red-500/10 text-red-300 ring-1 ring-red-400/20",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className: "bg-red-500/10 text-red-300 ring-1 ring-red-400/20",
    };
  }

  if (daysLeft === 1) {
    return {
      label: "1 day left",
      className:
        "bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/20",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} days left`,
      className:
        "bg-orange-500/10 text-orange-300 ring-1 ring-orange-400/20",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} days left`,
      className:
        "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/20",
    };
  }

  return {
    label: `${daysLeft} days left`,
    className: "bg-white/5 text-slate-300 ring-1 ring-white/10",
  };
}

function formatDashboardDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMatchLabel(score) {
  if (score >= 90) {
    return {
      label: "Excellent Match",
      className:
        "bg-green-500/10 text-green-300 ring-1 ring-green-400/20",
    };
  }

  if (score >= 75) {
    return {
      label: "Strong Match",
      className: "bg-blue-500/10 text-blue-300 ring-1 ring-blue-400/20",
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate Match",
      className:
        "bg-yellow-500/10 text-yellow-300 ring-1 ring-yellow-400/20",
    };
  }

  return {
    label: "Weak Match",
    className: "bg-red-500/10 text-red-300 ring-1 ring-red-400/20",
  };
}

function isUrgentApplication(application) {
  if (!application.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${application.deadline}T00:00:00`);
  deadline.setHours(0, 0, 0, 0);

  const daysLeft = Math.round(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    return true;
  }

  return daysLeft <= 3 && application.priority === "high";
}

export default Dashboard;