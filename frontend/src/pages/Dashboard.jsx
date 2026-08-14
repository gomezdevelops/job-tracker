import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { Link } from "react-router-dom";

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offers",
  rejected: "Rejected",
};

function Dashboard() {
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [matchAnalytics, setMatchAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const requiredSkillGaps =
    matchAnalytics?.skill_gaps?.required || [];

  const preferredSkillGaps =
    matchAnalytics?.skill_gaps?.preferred || [];

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-6 text-center">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <section>
          <h2 className="text-3xl font-bold">
            Welcome back
          </h2>

          <p className="mt-2 text-slate-400">
            {user?.email}
          </p>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Applications"
            value={summary.total_applications}
            to="/applications"
          />

          <StatCard
            label="Applied"
            value={summary.applied}
            to="/applications?status=applied"
          />

          <StatCard
            label="Interviews"
            value={summary.interview}
            to="/applications?status=interview"
          />

          <StatCard
            label="Offers"
            value={summary.offer}
            to="/applications?status=offer"
          />
          <StatCard
            label="Average Match"
            value={
              matchAnalytics
                ? `${matchAnalytics.average_score}%`
                : "—"
            }
          />

          <StatCard
            label="Analyzed Jobs"
            value={
              matchAnalytics
                ? matchAnalytics.analyzed_applications
                : 0
            }
          />
        </section>

        {/* Urgent Applications */}
        <section className="mt-8">
          <div className="rounded-2xl border border-red-900/50 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Urgent Applications
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Applications that need your attention right now.
                </p>
              </div>

              <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-300">
                {urgentApplications.length}
              </span>
            </div>

            {urgentApplications.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-950 p-6 text-center">
                <p className="text-green-400">
                  Nothing urgent right now.
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  You're all caught up.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {urgentApplications.map((application) => {
                  const deadlineStatus =
                    getDeadlineStatus(
                      application.deadline
                    );

                  return (
                    <Link
                      key={application.id}
                      to={`/applications/${application.id}`}
                      className="flex flex-col gap-3 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {application.role}
                          </p>

                          <span className="rounded-full bg-red-950 px-2.5 py-1 text-xs font-medium text-red-300">
                            Urgent
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {application.company}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {formatDashboardDate(
                            application.deadline
                          )}
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
        </section>

        {/* Upcoming Deadlines */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                View all
              </Link>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="mt-6 rounded-xl bg-slate-950 p-6 text-center">
                <p className="text-slate-400">
                  No upcoming deadlines.
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Add deadlines to your applications to see them here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {upcomingDeadlines.map((application) => {
                  const deadlineStatus =
                    getDeadlineStatus(
                      application.deadline
                    );

                  return (
                    <Link
                      key={application.id}
                      to={`/applications/${application.id}`}
                      className="flex flex-col gap-3 rounded-xl bg-slate-950 p-4 transition hover:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {application.role}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {application.company}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm text-slate-500">
                          {formatDashboardDate(
                            application.deadline
                          )}
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
        </section>

        {/* Pipeline */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold">
              Application Pipeline
            </h3>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {Object.entries(statusLabels).map(
                ([status, label]) => (
                  <Link
                    key={status}
                    to={`/applications?status=${status}`}
                    className="rounded-xl bg-slate-950 p-4 transition hover:bg-slate-800"
                  >
                    <p className="text-sm text-slate-400">
                      {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {summary[status]}
                    </p>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>

        {/* Deadlines */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Deadlines
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Track overdue and upcoming application deadlines.
                </p>
              </div>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300">
                {applications.filter(
                  (application) => application.deadline
                ).length}
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
                      info?.type === "today" ||
                      info?.type === "soon"
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
                      <p className="py-6 text-center text-slate-500">
                        No application deadlines.
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </section>
        {/* AI Match Overview */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Top Matches
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Applications with the strongest resume compatibility.
                </p>
              </div>

              <Link
                to="/applications"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                View applications
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {matchAnalytics?.top_matches?.slice(0, 4).map(
                (match) => (
                  <Link
                    key={match.application_id}
                    to={`/applications/${match.application_id}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {match.company}
                        </p>

                        <p className="mt-1 truncate text-sm text-slate-400">
                          {match.role}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold">
                          {match.score}%
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            getMatchLabel(match.score).className
                          }`}
                        >
                          {getMatchLabel(match.score).label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-950 px-3 py-1 text-xs text-green-300">
                        {match.matched_skills?.length || 0} matched
                      </span>

                      <span className="rounded-full bg-red-950 px-3 py-1 text-xs text-red-300">
                        {match.missing_skills?.length || 0} missing
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          match.current_priority === "high"
                            ? "bg-red-950 text-red-300"
                            : match.current_priority === "low"
                              ? "bg-green-950 text-green-300"
                              : "bg-yellow-950 text-yellow-300"
                        }`}
                      >
                        Priority:{" "}
                        {(match.current_priority || "medium")
                          .charAt(0)
                          .toUpperCase() +
                          (match.current_priority || "medium").slice(1)}
                      </span>

                      {match.suggested_priority &&
                        match.suggested_priority !== match.current_priority && (
                          <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-medium text-blue-300">
                            AI suggests:{" "}
                            {match.suggested_priority.charAt(0).toUpperCase() +
                              match.suggested_priority.slice(1)}
                          </span>
                        )}
                    </div>

                    {match.missing_skills?.length > 0 && (
                      <p className="mt-3 text-xs text-slate-500">
                        Missing:{" "}
                        {match.missing_skills.slice(0, 3).join(", ")}
                        {match.missing_skills.length > 3
                          ? "..."
                          : ""}
                      </p>
                    )}
                  </Link>
                )
              )}

              {(!matchAnalytics?.top_matches ||
                matchAnalytics.top_matches.length === 0) && (
                <div className="rounded-xl bg-slate-950 p-6 text-center md:col-span-2">
                  <p className="text-slate-400">
                    No resume matches yet.
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Analyze a resume against a job description to see
                    your match scores here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* Match Score Distribution */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <h3 className="text-lg font-semibold">
                Match Score Distribution
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                See how your analyzed applications are distributed by match score.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  label: "90–100%",
                  key: "90_100",
                  description: "Excellent matches",
                },
                {
                  label: "75–89%",
                  key: "75_89",
                  description: "Strong matches",
                },
                {
                  label: "60–74%",
                  key: "60_74",
                  description: "Moderate matches",
                },
                {
                  label: "Below 60%",
                  key: "below_60",
                  description: "Weak matches",
                },
              ].map((bucket) => {
                const count =
                  matchAnalytics?.score_distribution?.[
                    bucket.key
                  ] || 0;

                const total =
                  matchAnalytics?.analyzed_applications || 0;

                const percentage =
                  total > 0
                    ? Math.round((count / total) * 100)
                    : 0;

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

                      <span className="text-sm font-semibold">
                        {count}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <h3 className="text-lg font-semibold">
                Skill Gaps
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Skills frequently missing from your resume matches.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
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

                  <span className="rounded-full bg-red-950 px-2.5 py-1 text-xs text-red-300">
                    Required
                  </span>
                </div>

                {requiredSkillGaps.length === 0 ? (
                  <div className="rounded-xl bg-slate-950 p-5 text-center">
                    <p className="text-sm text-green-400">
                      No required skill gaps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requiredSkillGaps.map(
                      ({ skill, count }) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between rounded-xl bg-slate-950 p-4"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {skill}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Missing from {count} application
                              {count === 1 ? "" : "s"}
                            </p>
                          </div>

                          <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-300">
                            {count}
                          </span>
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

                  <span className="rounded-full bg-yellow-950 px-2.5 py-1 text-xs text-yellow-300">
                    Preferred
                  </span>
                </div>

                {preferredSkillGaps.length === 0 ? (
                  <div className="rounded-xl bg-slate-950 p-5 text-center">
                    <p className="text-sm text-slate-400">
                      No preferred skill gaps.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preferredSkillGaps.map(
                      ({ skill, count }) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between rounded-xl bg-slate-950 p-4"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {skill}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Missing from {count} application
                              {count === 1 ? "" : "s"}
                            </p>
                          </div>

                          <span className="rounded-full bg-yellow-950 px-3 py-1 text-xs font-medium text-yellow-300">
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
                {/* Recent Applications */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
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
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                View all
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {applications.slice(0, 5).map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Application Info */}
                    <Link
                      to={`/applications/${application.id}`}
                      className="min-w-0"
                    >
                      <p className="font-medium">
                        {application.company}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {application.role}
                      </p>

                      {application.deadline && (
                        <div className="mt-2">
                          {(() => {
                            const deadlineInfo =
                              getDeadlineInfo(
                                application.deadline
                              );

                            return deadlineInfo ? (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${deadlineInfo.badgeClassName}`}
                              >
                                {deadlineInfo.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </Link>

                    {/* Match Score */}
                    {matchAnalytics?.top_matches?.find(
                      (match) =>
                        match.application_id === application.id
                    ) && (
                      <div className="rounded-full bg-purple-950 px-3 py-1.5 text-xs font-medium text-purple-300">
                        {
                          matchAnalytics.top_matches.find(
                            (match) =>
                              match.application_id === application.id
                          ).score
                        }% Match
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
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none transition hover:border-slate-600 focus:border-blue-500"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="screening">
                          Screening
                        </option>
                        <option value="interview">
                          Interview
                        </option>
                        <option value="offer">Offer</option>
                        <option value="rejected">
                          Rejected
                        </option>
                      </select>

                      <Link
                        to={`/applications/${application.id}`}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs transition hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Added{" "}
                    {formatDateTime(application.created_at)}
                  </p>
                </div>
              ))}

              {applications.length === 0 && (
                <p className="py-6 text-center text-slate-500">
                  No applications yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/applications/new"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
            >
              <p className="text-lg font-semibold">
                Add Application
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Track a new job opportunity.
              </p>
            </Link>

            <Link
              to="/applications"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
            >
              <p className="text-lg font-semibold">
                View Applications
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Manage your complete application pipeline.
              </p>
            </Link>

            <Link
              to="/resumes"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
            >
              <p className="text-lg font-semibold">
                Manage Resumes
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Upload and manage your resumes.
              </p>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
function DeadlineGroup({
  title,
  applications,
  titleClassName,
}) {
  return (
    <div>
      <h4
        className={`mb-3 text-sm font-semibold ${titleClassName}`}
      >
        {title}
      </h4>

      <div className="space-y-3">
        {applications.map((application) => {
          const deadlineInfo = getDeadlineInfo(
            application.deadline
          );

          return (
            <Link
              key={application.id}
              to={`/applications/${application.id}`}
              className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {application.company}
                </p>

                <p className="text-sm text-slate-400">
                  {application.role}
                </p>
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

function StatCard({ label, value, to }) {
  const content = (
    <>
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-4xl font-bold">
        {value}
      </p>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600 hover:bg-slate-800"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      {content}
    </div>
  );
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatDateTime(value) {
  return new Date(value).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}
function getDeadlineInfo(deadline) {
  if (!deadline) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(
    `${deadline}T00:00:00`
  );
  deadlineDate.setHours(0, 0, 0, 0);

  const difference = Math.ceil(
    (deadlineDate - today) /
      (1000 * 60 * 60 * 24)
  );

  if (difference < 0) {
    return {
      type: "overdue",
      label: `${Math.abs(difference)} day${
        Math.abs(difference) === 1 ? "" : "s"
      } overdue`,
      badgeClassName:
        "bg-red-950 text-red-300",
    };
  }

  if (difference === 0) {
    return {
      type: "today",
      label: "Due today",
      badgeClassName:
        "bg-orange-950 text-orange-300",
    };
  }

  if (difference <= 3) {
    return {
      type: "soon",
      label: `${difference} day${
        difference === 1 ? "" : "s"
      } left`,
      badgeClassName:
        "bg-yellow-950 text-yellow-300",
    };
  }

  return {
    type: "upcoming",
    label: `${difference} days left`,
    badgeClassName:
      "bg-slate-800 text-slate-300",
  };
}
function getDeadlineStatus(value) {
  if (!value) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(
    `${value}T00:00:00`
  );
  deadline.setHours(0, 0, 0, 0);

  const diffTime =
    deadline.getTime() - today.getTime();

  const daysLeft = Math.round(
    diffTime / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) {
    return {
      label: "Overdue",
      className:
        "bg-red-950 text-red-300",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className:
        "bg-red-950 text-red-300",
    };
  }

  if (daysLeft === 1) {
    return {
      label: "1 day left",
      className:
        "bg-orange-950 text-orange-300",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} days left`,
      className:
        "bg-orange-950 text-orange-300",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} days left`,
      className:
        "bg-yellow-950 text-yellow-300",
    };
  }

  return {
    label: `${daysLeft} days left`,
    className:
      "bg-slate-800 text-slate-300",
  };
}
function formatDashboardDate(value) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMatchLabel(score) {
  if (score >= 90) {
    return {
      label: "Excellent Match",
      className: "bg-green-950 text-green-300",
    };
  }

  if (score >= 75) {
    return {
      label: "Strong Match",
      className: "bg-blue-950 text-blue-300",
    };
  }

  if (score >= 60) {
    return {
      label: "Moderate Match",
      className: "bg-yellow-950 text-yellow-300",
    };
  }

  return {
    label: "Weak Match",
    className: "bg-red-950 text-red-300",
  };
}

function isUrgentApplication(application) {
  if (!application.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(
    `${application.deadline}T00:00:00`
  );
  deadline.setHours(0, 0, 0, 0);

  const daysLeft = Math.round(
    (deadline.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (daysLeft <= 0) {
    return true;
  }

  return (
    daysLeft <= 3 &&
    application.priority === "high"
  );
}

export default Dashboard;