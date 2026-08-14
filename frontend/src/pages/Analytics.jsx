import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/client";

const statuses = [
  {
    key: "saved",
    label: "Saved",
  },
  {
    key: "applied",
    label: "Applied",
  },
  {
    key: "screening",
    label: "Screening",
  },
  {
    key: "interview",
    label: "Interview",
  },
  {
    key: "offer",
    label: "Offer",
  },
  {
    key: "rejected",
    label: "Rejected",
  },
];

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [matchAnalytics, setMatchAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
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
        setError("Unable to load analytics.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-slate-400">
          Loading analytics...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-6 text-red-300">
          {error}
        </div>
      </main>
    );
  }

  const chartData = statuses.map((status) => ({
    name: status.label,
    applications: summary[status.key],
  }));
  const funnelData = [
    {
      label: "Total Applications",
      value: summary.total_applications,
    },
    {
      label: "Applied",
      value: summary.applied,
    },
    {
      label: "Screening",
      value: summary.screening,
    },
    {
      label: "Interview",
      value: summary.interview,
    },
    {
      label: "Offer",
      value: summary.offer,
    },
  ];
  const deadlineApplications = applications.filter(
    (application) => application.deadline
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueApplications =
    deadlineApplications.filter((application) => {
      const deadline = new Date(
        `${application.deadline}T00:00:00`
      );

      return deadline < today;
    });

  const dueSoonApplications =
    deadlineApplications.filter((application) => {
      const deadline = new Date(
        `${application.deadline}T00:00:00`
      );

      const difference =
        (deadline - today) /
        (1000 * 60 * 60 * 24);

      return difference >= 0 && difference <= 3;
    });

  const upcomingApplications =
    deadlineApplications.filter((application) => {
      const deadline = new Date(
        `${application.deadline}T00:00:00`
      );

      const difference =
        (deadline - today) /
        (1000 * 60 * 60 * 24);

      return difference > 3;
    });

  const responseRate =
    summary.total_applications > 0
      ? Math.round(
          ((summary.screening +
            summary.interview +
            summary.offer) /
            summary.total_applications) *
            100
        )
      : 0;

  const applicationRate =
    summary.total_applications > 0
      ? Math.round(
          (summary.applied /
            summary.total_applications) *
            100
        )
      : 0;
  const interviewRate =
    summary.total_applications > 0
      ? Math.round(
          ((summary.interview + summary.offer) /
            summary.total_applications) *
            100
        )
      : 0;

  const offerRate =
    summary.interview + summary.offer > 0
      ? Math.round(
          (summary.offer /
            (summary.interview + summary.offer)) *
            100
        )
      : 0;

  const rejectionRate =
    summary.total_applications > 0
      ? Math.round(
          (summary.rejected /
            summary.total_applications) *
            100
        )
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section>
        <h1 className="text-3xl font-bold">
          Analytics
        </h1>

        <p className="mt-2 text-slate-400">
          Understand your job search at a glance.
        </p>
      </section>

      {/* Overview cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Applications"
          value={summary.total_applications}
        />

        <MetricCard
          label="Upcoming Deadlines"
          value={summary.upcoming_deadlines}
        />

        <MetricCard
          label="Interview Rate"
          value={`${interviewRate}%`}
        />

        <MetricCard
          label="Offer Rate"
          value={`${offerRate}%`}
        />
      </section>

      {/* Resume Match Analytics */}
      <section className="mt-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Resume Match Analytics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              See how well your resume matches the jobs you're targeting.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Average Match
              </p>

              <p className="mt-2 text-3xl font-bold">
                {matchAnalytics
                  ? `${matchAnalytics.average_score}%`
                  : "0%"}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Average compatibility across analyzed jobs.
              </p>
            </div>

            <div className="rounded-xl bg-slate-950 p-5">
              <p className="text-sm text-slate-400">
                Analyzed Jobs
              </p>

              <p className="mt-2 text-3xl font-bold">
                {matchAnalytics
                  ? matchAnalytics.analyzed_applications
                  : 0}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Applications with resume match analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Top Resume Matches
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Jobs where your resume has the strongest compatibility.
            </p>
          </div>

          {!matchAnalytics?.top_matches?.length ? (
            <div className="mt-6 rounded-xl bg-slate-950 p-6 text-center">
              <p className="text-slate-400">
                No resume matches yet.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {matchAnalytics.top_matches
                .slice(0, 5)
                .map((match) => (
                  <div
                    key={match.application_id}
                    className="flex flex-col gap-4 rounded-xl bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {match.company}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {match.role}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-green-950 px-3 py-1 text-sm font-medium text-green-300">
                        {match.score}%
                      </span>

                      <span className="text-xs text-slate-500">
                        {match.matched_skills?.length || 0} matched
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Skill Gaps
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Skills that are frequently missing from your resume matches.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Required Skills */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    Required Skills
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Required skills missing from your resume.
                  </p>
                </div>

                <span className="rounded-full bg-red-950 px-2.5 py-1 text-xs text-red-300">
                  Required
                </span>
              </div>

              {!matchAnalytics?.skill_gaps?.required?.length ? (
                <div className="rounded-xl bg-slate-950 p-5 text-center">
                  <p className="text-sm text-green-400">
                    No required skill gaps.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchAnalytics.skill_gaps.required
                    .slice(0, 6)
                    .map((gap) => (
                      <div
                        key={gap.skill}
                        className="flex items-center justify-between rounded-xl bg-slate-950 p-4"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {gap.skill}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Missing from {gap.count} application
                            {gap.count === 1 ? "" : "s"}
                          </p>
                        </div>

                        <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-300">
                          {gap.count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Preferred Skills */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">
                    Preferred Skills
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Nice-to-have skills missing from your resume.
                  </p>
                </div>

                <span className="rounded-full bg-yellow-950 px-2.5 py-1 text-xs text-yellow-300">
                  Preferred
                </span>
              </div>

              {!matchAnalytics?.skill_gaps?.preferred?.length ? (
                <div className="rounded-xl bg-slate-950 p-5 text-center">
                  <p className="text-sm text-slate-400">
                    No preferred skill gaps.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchAnalytics.skill_gaps.preferred
                    .slice(0, 6)
                    .map((gap) => (
                      <div
                        key={gap.skill}
                        className="flex items-center justify-between rounded-xl bg-slate-950 p-4"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {gap.skill}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Missing from {gap.count} application
                            {gap.count === 1 ? "" : "s"}
                          </p>
                        </div>

                        <span className="rounded-full bg-yellow-950 px-3 py-1 text-xs font-medium text-yellow-300">
                          {gap.count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Application Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Applications grouped by their current status.
          </p>
        </div>

        <div className="mt-8 h-[350px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 10,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: "#94a3b8",
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fill: "#94a3b8",
                }}
              />

              <Tooltip />

              <Bar
                dataKey="applications"
                name="Applications"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Application Funnel
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            See how applications progress through your job search.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {funnelData.map((stage, index) => {
            const percentage =
              summary.total_applications > 0
                ? Math.round(
                    (stage.value /
                      summary.total_applications) *
                      100
                  )
                : 0;

            return (
              <div key={stage.label}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    {stage.label}
                  </span>

                  <span className="text-sm text-slate-400">
                    {stage.value}{" "}
                    <span className="text-slate-600">
                      ({percentage}%)
                    </span>
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
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
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Deadline Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep track of applications that need attention.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <DeadlineMetric
            label="Overdue"
            value={overdueApplications.length}
            description="Deadlines that have passed"
          />

          <DeadlineMetric
            label="Due Soon"
            value={dueSoonApplications.length}
            description="Due within the next 3 days"
          />

          <DeadlineMetric
            label="Upcoming"
            value={upcomingApplications.length}
            description="More than 3 days away"
          />
        </div>

        {overdueApplications.length > 0 && (
          <DeadlineList
            title="Overdue Applications"
            applications={overdueApplications}
            titleClassName="text-red-400"
          />
        )}

        {dueSoonApplications.length > 0 && (
          <DeadlineList
            title="Due Soon"
            applications={dueSoonApplications}
            titleClassName="text-yellow-400"
          />
        )}
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            Job Search Conversion
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            See how your applications are progressing.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ConversionCard
            label="Applied → Interview"
            value={`${interviewRate}%`}
            description="Applications reaching interviews or offers"
          />

          <ConversionCard
            label="Applications → Offer"
            value={`${offerRate}%`}
            description="Overall offer conversion"
          />

          <ConversionCard
            label="Rejected"
            value={`${summary.rejected}`}
            description="Applications currently rejected"
          />

          <ConversionCard
            label="Rejection Rate"
            value={`${rejectionRate}%`}
            description="Share of total applications"
          />
        </div>
      </section>

      {/* Status breakdown */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">
          Status Breakdown
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statuses.map((status) => (
            <div
              key={status.key}
              className="rounded-xl bg-slate-950 p-5"
            >
              <p className="text-sm text-slate-400">
                {status.label}
              </p>

              <p className="mt-2 text-3xl font-bold">
                {summary[status.key]}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function ConversionCard({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
function DeadlineMetric({
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}
function DeadlineList({
  title,
  applications,
  titleClassName,
}) {
  return (
    <div className="mt-8">
      <h3
        className={`mb-3 text-sm font-semibold ${titleClassName}`}
      >
        {title}
      </h3>

      <div className="space-y-3">
        {applications.slice(0, 5).map(
          (application) => (
            <div
              key={application.id}
              className="flex flex-col gap-2 rounded-xl bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {application.company}
                </p>

                <p className="text-sm text-slate-400">
                  {application.role}
                </p>
              </div>

              <p className="text-sm text-slate-300">
                {formatDate(application.deadline)}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}
function formatDate(value) {
  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default Analytics;