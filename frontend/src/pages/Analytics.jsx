import { useEffect, useId, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api/client";

/* =========================================================
   Constants
   ========================================================= */

const statuses = [
  {
    key: "saved",
    label: "Saved",
    color: "#94a3b8",
    dot: "bg-slate-400",
    bar: "bg-gradient-to-r from-slate-500 to-slate-300",
  },
  {
    key: "applied",
    label: "Applied",
    color: "#38bdf8",
    dot: "bg-sky-400",
    bar: "bg-gradient-to-r from-sky-500 to-sky-300",
  },
  {
    key: "screening",
    label: "Screening",
    color: "#fbbf24",
    dot: "bg-amber-400",
    bar: "bg-gradient-to-r from-amber-500 to-amber-300",
  },
  {
    key: "interview",
    label: "Interview",
    color: "#a78bfa",
    dot: "bg-violet-400",
    bar: "bg-gradient-to-r from-violet-500 to-violet-300",
  },
  {
    key: "offer",
    label: "Offer",
    color: "#34d399",
    dot: "bg-emerald-400",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-300",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#fb7185",
    dot: "bg-rose-400",
    bar: "bg-gradient-to-r from-rose-500 to-rose-300",
  },
];

const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };
const GRID_STROKE = "rgba(148, 163, 184, 0.12)";

const animationStyles = `
@keyframes an-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes an-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes an-shimmer {
  100% { transform: translateX(100%); }
}
@keyframes an-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.an-fade-up { animation: an-fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.an-float { animation: an-float 16s ease-in-out infinite; }
.an-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: an-gradient 8s linear infinite;
}
.an-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: an-shimmer 1.5s infinite;
}
.an-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.7s cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.an-reveal.is-visible { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .an-fade-up, .an-float, .an-gradient-text, .an-shimmer::after {
    animation: none !important;
  }
  .an-reveal { opacity: 1; transform: none; transition: none; }
}
`;

/* =========================================================
   Page
   ========================================================= */

function Analytics() {
  const reduceMotion = usePrefersReducedMotion();

  const [summary, setSummary] = useState(null);
  const [applications, setApplications] = useState([]);
  const [matchAnalytics, setMatchAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [trendsError, setTrendsError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

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

  async function loadTrends() {
    setTrendsLoading(true);
    setTrendsError("");

    try {
      const response = await api.get("/analytics/trends");
      setTrends(response.data);
    } catch (error) {
      console.error(error);
      setTrendsError(
        error.response?.data?.detail ||
          "Unable to load application trends."
      );
    } finally {
      setTrendsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
    loadTrends();
  }, []);

  function retry() {
    loadAnalytics();
    loadTrends();
  }

  /* ---------- Loading / error ---------- */

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="relative z-0 min-h-screen bg-[#070910] text-white">
        <style>{animationStyles}</style>

        <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="an-fade-up max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
              <Icon name="alert" className="h-6 w-6" />
            </div>

            <p className="mt-4 text-lg font-semibold text-red-200">{error}</p>

            <button
              type="button"
              onClick={retry}
              className="mt-6 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 ring-1 ring-red-400/30 transition hover:bg-red-500/20"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------- Derived data ---------- */

  const chartData = statuses.map((status) => ({
    key: status.key,
    name: status.label,
    applications: summary[status.key],
  }));

  const funnelData = [
    {
      label: "Total Applications",
      value: summary.total_applications,
      bar: "bg-gradient-to-r from-indigo-500 to-indigo-300",
    },
    {
      label: "Applied",
      value: summary.applied,
      bar: statuses[1].bar,
    },
    {
      label: "Screening",
      value: summary.screening,
      bar: statuses[2].bar,
    },
    {
      label: "Interview",
      value: summary.interview,
      bar: statuses[3].bar,
    },
    {
      label: "Offer",
      value: summary.offer,
      bar: statuses[4].bar,
    },
  ];

  const deadlineApplications = applications.filter(
    (application) => application.deadline
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueApplications = deadlineApplications.filter((application) => {
    const deadline = new Date(`${application.deadline}T00:00:00`);

    return deadline < today;
  });

  const dueSoonApplications = deadlineApplications.filter((application) => {
    const deadline = new Date(`${application.deadline}T00:00:00`);

    const difference = (deadline - today) / (1000 * 60 * 60 * 24);

    return difference >= 0 && difference <= 3;
  });

  const upcomingApplications = deadlineApplications.filter((application) => {
    const deadline = new Date(`${application.deadline}T00:00:00`);

    const difference = (deadline - today) / (1000 * 60 * 60 * 24);

    return difference > 3;
  });

  const interviewRate =
    summary.total_applications > 0
      ? Math.round(
          ((summary.interview + summary.offer) / summary.total_applications) *
            100
        )
      : 0;

  const offerRate =
    summary.interview + summary.offer > 0
      ? Math.round(
          (summary.offer / (summary.interview + summary.offer)) * 100
        )
      : 0;

  const rejectionRate =
    summary.total_applications > 0
      ? Math.round((summary.rejected / summary.total_applications) * 100)
      : 0;

  const averageScore = matchAnalytics?.average_score || 0;

  const donutData = statuses
    .map((status) => ({
      key: status.key,
      name: status.label,
      value: summary[status.key] || 0,
      color: status.color,
    }))
    .filter((item) => item.value > 0);

  const statusTotal = statuses.reduce(
    (total, status) => total + (summary[status.key] || 0),
    0
  );

  /* ---------- Render ---------- */

  return (
    <div className="relative z-0 min-h-screen bg-[#070910] text-white">
      <style>{animationStyles}</style>

      {/* Ambient background: pinned to the viewport but confined to this page's content area */}
      <div
        aria-hidden="true"
        className="pointer-events-none sticky top-0 z-0 -mb-[100vh] h-screen overflow-hidden"
      >
        <div className="an-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="an-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="an-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <section className="an-fade-up">
          <p className="text-sm font-medium text-indigo-300">Insights</p>

          <h1 className="an-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Analytics
          </h1>

          <p className="mt-3 text-slate-400">
            Understand your job search at a glance.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <HeroPill
              label="Applications"
              value={summary.total_applications}
              dot="bg-indigo-400"
            />

            <HeroPill
              label="Reached interviews"
              value={interviewRate}
              suffix="%"
              dot="bg-violet-400"
            />

            <HeroPill
              label="Avg. resume match"
              value={averageScore}
              suffix="%"
              dot="bg-cyan-400"
            />
          </div>
        </section>

        {/* Overview cards */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delay={0}>
            <MetricCard
              label="Total Applications"
              value={summary.total_applications}
              accent="from-indigo-400 to-indigo-600"
              icon="briefcase"
              spark={trends?.monthly_counts}
              reduceMotion={reduceMotion}
            />
          </Reveal>

          <Reveal delay={70}>
            <MetricCard
              label="Upcoming Deadlines"
              value={summary.upcoming_deadlines}
              accent="from-amber-400 to-orange-500"
              icon="clock"
            />
          </Reveal>

          <Reveal delay={140}>
            <MetricCard
              label="Interview Rate"
              value={interviewRate}
              suffix="%"
              accent="from-violet-400 to-fuchsia-500"
              icon="users"
            />
          </Reveal>

          <Reveal delay={210}>
            <MetricCard
              label="Offer Rate"
              value={offerRate}
              suffix="%"
              accent="from-emerald-400 to-teal-500"
              icon="award"
            />
          </Reveal>
        </section>

        {/* Resume match analytics + top matches */}
        <section className="mt-8 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <GlassCard className="h-full">
              <SectionTitle
                title="Resume Match Analytics"
                subtitle="See how well your resume matches the jobs you're targeting."
              />

              <div className="mt-6 flex items-center gap-6">
                <ProgressRing value={averageScore} size={128} stroke={10} showLabel />

                <div>
                  <p className="text-sm text-slate-400">Average Match</p>

                  <p className="mt-1 text-3xl font-bold">
                    <AnimatedNumber
                      value={matchAnalytics ? matchAnalytics.average_score : 0}
                      suffix="%"
                    />
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Average compatibility across analyzed jobs.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-black/20 p-5">
                <p className="text-sm text-slate-400">Analyzed Jobs</p>

                <p className="mt-2 text-3xl font-bold">
                  <AnimatedNumber
                    value={matchAnalytics ? matchAnalytics.analyzed_applications : 0}
                  />
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Applications with resume match analysis.
                </p>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={80}>
            <GlassCard className="h-full">
              <SectionTitle
                title="Top Resume Matches"
                subtitle="Jobs where your resume has the strongest compatibility."
              />

              {!matchAnalytics?.top_matches?.length ? (
                <EmptyBox
                  icon="sparkle"
                  title="No resume matches yet."
                  description="Analyze a resume against a job description to see scores here."
                />
              ) : (
                <div className="mt-6 space-y-3">
                  {matchAnalytics.top_matches.slice(0, 5).map((match, index) => (
                    <div
                      key={match.application_id}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="w-5 shrink-0 text-center text-sm font-semibold text-slate-600">
                          {index + 1}
                        </span>

                        <CompanyAvatar name={match.company} />

                        <div className="min-w-0">
                          <p className="truncate font-medium">{match.company}</p>

                          <p className="mt-1 truncate text-sm text-slate-400">
                            {match.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:w-56">
                        <div className="min-w-0 flex-1">
                          <AnimatedBar
                            percent={match.score}
                            className="bg-gradient-to-r from-emerald-500 to-cyan-300"
                            height="h-1.5"
                            delay={index * 90}
                          />

                          <p className="mt-1.5 text-xs text-slate-500">
                            {match.matched_skills?.length || 0} matched
                          </p>
                        </div>

                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-300 ring-1 ring-green-400/20">
                          {match.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </Reveal>
        </section>

        {/* Skill gaps */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Skill Gaps"
              subtitle="Skills that are frequently missing from your resume matches."
            />

            <div className="mt-6 grid gap-8 md:grid-cols-2">
              <SkillGapColumn
                title="Required Skills"
                description="Required skills missing from your resume."
                tag="Required"
                tagClassName="bg-red-500/10 text-red-300 ring-red-400/20"
                countClassName="bg-red-500/10 text-red-300 ring-red-400/20"
                barClassName="bg-gradient-to-r from-red-500 to-rose-300"
                emptyText="No required skill gaps."
                emptyClassName="text-green-400"
                gaps={matchAnalytics?.skill_gaps?.required}
              />

              <SkillGapColumn
                title="Preferred Skills"
                description="Nice-to-have skills missing from your resume."
                tag="Preferred"
                tagClassName="bg-yellow-500/10 text-yellow-300 ring-yellow-400/20"
                countClassName="bg-yellow-500/10 text-yellow-300 ring-yellow-400/20"
                barClassName="bg-gradient-to-r from-yellow-500 to-amber-300"
                emptyText="No preferred skill gaps."
                emptyClassName="text-slate-400"
                gaps={matchAnalytics?.skill_gaps?.preferred}
              />
            </div>
          </GlassCard>
        </Reveal>

        {/* Pipeline chart */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Application Pipeline"
              subtitle="Applications grouped by their current status."
            />

            <div className="mt-8 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 10,
                  }}
                >
                  <defs>
                    {statuses.map((status) => (
                      <linearGradient
                        key={status.key}
                        id={`pipeline-${status.key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={status.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={status.color} stopOpacity={0.25} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={GRID_STROKE}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />

                  <Bar
                    dataKey="applications"
                    name="Applications"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={64}
                    isAnimationActive={!reduceMotion}
                    animationDuration={1000}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={`url(#pipeline-${entry.key})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </Reveal>

        {/* Advanced Trends */}
        <section className="mt-8 space-y-8">
          {/* Trend overview */}
          <Reveal>
            <GlassCard>
              <SectionTitle
                title="Application Trends"
                subtitle="Track how your job search activity changes over time."
              />

              {trendsLoading ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Shimmer className="h-28" />
                  <Shimmer className="h-28" />
                  <Shimmer className="h-28" />
                  <Shimmer className="h-28" />
                </div>
              ) : trendsError ? (
                <TrendsError message={trendsError} onRetry={loadTrends} />
              ) : trends ? (
                <>
                  {/* Trend KPI cards */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Total Applications"
                      value={trends.total_applications}
                      accent="from-indigo-400 to-indigo-600"
                      compact
                    />

                    <MetricCard
                      label="Active Applications"
                      value={trends.active_applications}
                      accent="from-cyan-400 to-teal-500"
                      compact
                    />

                    <MetricCard
                      label="Interview Rate"
                      value={trends.rates.interview_rate}
                      suffix="%"
                      accent="from-violet-400 to-fuchsia-500"
                      compact
                    />

                    <MetricCard
                      label="Offer Rate"
                      value={trends.rates.offer_rate}
                      suffix="%"
                      accent="from-emerald-400 to-teal-500"
                      compact
                    />
                  </div>

                  {/* Status distribution */}
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-300">
                      Status Distribution
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {statuses.map((status) => (
                        <div
                          key={status.key}
                          className="flex items-center justify-between rounded-2xl bg-black/20 p-4 transition duration-300 hover:bg-black/30"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-400">
                            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>

                          <span className="text-lg font-semibold">
                            <AnimatedNumber
                              value={trends.status_counts?.[status.key] || 0}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </GlassCard>
          </Reveal>

          {/* Monthly activity */}
          <Reveal>
            <GlassCard>
              <SectionTitle
                title="Monthly Application Activity"
                subtitle="Number of applications created each month."
              />

              {trendsLoading ? (
                <Shimmer className="mt-6 h-72" />
              ) : trendsError ? (
                <TrendsError message={trendsError} onRetry={loadTrends} />
              ) : trends?.monthly_counts?.length ? (
                <div className="mt-8 h-[350px] w-full overflow-x-auto">
                  <div
                    style={{
                      minWidth: `${Math.max(trends.monthly_counts.length * 100, 700)}px`,
                      height: "100%",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={trends.monthly_counts.map((item) => ({
                          ...item,
                          label: formatAnalyticsMonth(item.month),
                        }))}
                        margin={{
                          top: 10,
                          right: 20,
                          left: 0,
                          bottom: 10,
                        }}
                      >
                        <defs>
                          <linearGradient id="monthly-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={GRID_STROKE}
                          vertical={false}
                        />

                        <XAxis
                          dataKey="label"
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={70}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={AXIS_TICK}
                          axisLine={false}
                          tickLine={false}
                        />

                        <Tooltip
                          content={<ChartTooltip />}
                          cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        />

                        <Bar
                          dataKey="count"
                          name="Applications"
                          fill="url(#monthly-gradient)"
                          radius={[8, 8, 0, 0]}
                          maxBarSize={56}
                          isAnimationActive={!reduceMotion}
                          animationDuration={1000}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <EmptyBox
                  icon="chart"
                  title="No monthly application data available yet."
                />
              )}
            </GlassCard>
          </Reveal>

          {/* Outcome rates */}
          <Reveal>
            <GlassCard>
              <SectionTitle
                title="Application Outcome Rates"
                subtitle="Overview of how your applications are progressing."
              />

              {!trendsLoading && trends && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <ConversionCard
                    label="Interview Rate"
                    value={trends.rates.interview_rate}
                    suffix="%"
                    description="Share of total applications reaching interviews."
                    ring
                  />

                  <ConversionCard
                    label="Offer Rate"
                    value={trends.rates.offer_rate}
                    suffix="%"
                    description="Share of total applications resulting in offers."
                    ring
                  />

                  <ConversionCard
                    label="Rejection Rate"
                    value={trends.rates.rejection_rate}
                    suffix="%"
                    description="Share of total applications currently rejected."
                    ring
                  />
                </div>
              )}

              {trendsLoading && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Shimmer className="h-40" />
                  <Shimmer className="h-40" />
                  <Shimmer className="h-40" />
                </div>
              )}

              {!trendsLoading && trendsError && (
                <TrendsError message={trendsError} onRetry={loadTrends} />
              )}
            </GlassCard>
          </Reveal>
        </section>

        {/* Funnel */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Application Funnel"
              subtitle="See how applications progress through your job search."
            />

            <div className="mt-8 space-y-5">
              {funnelData.map((stage, index) => {
                const percentage =
                  summary.total_applications > 0
                    ? Math.round((stage.value / summary.total_applications) * 100)
                    : 0;

                return (
                  <div key={stage.label}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">
                        {stage.label}
                      </span>

                      <span className="text-sm text-slate-400">
                        {stage.value}{" "}
                        <span className="text-slate-600">({percentage}%)</span>
                      </span>
                    </div>

                    <AnimatedBar
                      percent={percentage}
                      className={stage.bar}
                      height="h-3"
                      delay={index * 110}
                    />
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </Reveal>

        {/* Deadline overview */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Deadline Overview"
              subtitle="Keep track of applications that need attention."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <DeadlineMetric
                label="Overdue"
                value={overdueApplications.length}
                description="Deadlines that have passed"
                tone="border-red-500/20 bg-red-500/5"
                valueClassName="text-red-400"
              />

              <DeadlineMetric
                label="Due Soon"
                value={dueSoonApplications.length}
                description="Due within the next 3 days"
                tone="border-yellow-500/20 bg-yellow-500/5"
                valueClassName="text-yellow-400"
              />

              <DeadlineMetric
                label="Upcoming"
                value={upcomingApplications.length}
                description="More than 3 days away"
                tone="border-white/10 bg-white/[0.03]"
                valueClassName="text-slate-100"
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
          </GlassCard>
        </Reveal>

        {/* Conversion */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Job Search Conversion"
              subtitle="See how your applications are progressing."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ConversionCard
                label="Applied → Interview"
                value={interviewRate}
                suffix="%"
                description="Applications reaching interviews or offers"
              />

              <ConversionCard
                label="Interview → Offer"
                value={offerRate}
                suffix="%"
                description="Offers as a share of interviews and offers"
              />

              <ConversionCard
                label="Rejected"
                value={summary.rejected}
                description="Applications currently rejected"
              />

              <ConversionCard
                label="Rejection Rate"
                value={rejectionRate}
                suffix="%"
                description="Share of total applications"
              />
            </div>
          </GlassCard>
        </Reveal>

        {/* Status breakdown */}
        <Reveal className="mt-8">
          <GlassCard>
            <SectionTitle
              title="Status Breakdown"
              subtitle="How your applications are split across statuses."
            />

            <div className="mt-6 grid items-center gap-8 lg:grid-cols-5">
              {/* Donut */}
              <div className="relative mx-auto h-64 w-64 lg:col-span-2">
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={78}
                        outerRadius={112}
                        paddingAngle={3}
                        cornerRadius={6}
                        stroke="none"
                        isAnimationActive={!reduceMotion}
                        animationDuration={1000}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>

                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-full border border-dashed border-white/10 text-sm text-slate-500">
                    No data yet
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-bold">
                    <AnimatedNumber value={statusTotal} />
                  </p>

                  <p className="text-xs text-slate-500">Total</p>
                </div>
              </div>

              {/* Tiles */}
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-3">
                {statuses.map((status, index) => (
                  <div
                    key={status.key}
                    className="rounded-2xl bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:bg-black/30"
                  >
                    <p className="flex items-center gap-2 text-sm text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                      {status.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      <AnimatedNumber value={summary[status.key] || 0} />
                    </p>

                    <div className="mt-3">
                      <AnimatedBar
                        percent={
                          statusTotal > 0
                            ? ((summary[status.key] || 0) / statusTotal) * 100
                            : 0
                        }
                        className={status.bar}
                        height="h-1"
                        delay={index * 80}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </Reveal>
      </main>
    </div>
  );
}

/* =========================================================
   Section components
   ========================================================= */

function SkillGapColumn({
  title,
  description,
  tag,
  tagClassName,
  countClassName,
  barClassName,
  emptyText,
  emptyClassName,
  gaps,
}) {
  const visibleGaps = (gaps || []).slice(0, 6);
  const maxCount = Math.max(1, ...visibleGaps.map((gap) => gap.count));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-medium">{title}</h3>

          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${tagClassName}`}
        >
          {tag}
        </span>
      </div>

      {visibleGaps.length === 0 ? (
        <div className="rounded-2xl bg-black/20 p-5 text-center">
          <p className={`text-sm ${emptyClassName}`}>{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGaps.map((gap, index) => (
            <div
              key={gap.skill}
              className="rounded-2xl bg-black/20 p-4 transition duration-300 hover:bg-black/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{gap.skill}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    Missing from {gap.count} application
                    {gap.count === 1 ? "" : "s"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${countClassName}`}
                >
                  {gap.count}
                </span>
              </div>

              <div className="mt-3">
                <AnimatedBar
                  percent={(gap.count / maxCount) * 100}
                  className={barClassName}
                  height="h-1"
                  delay={index * 80}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrendsError({ message, onRetry }) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-red-300">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 ring-1 ring-red-400/30 transition hover:bg-red-500/20"
      >
        Retry
      </button>
    </div>
  );
}

function ConversionCard({ label, value, suffix = "", description, ring = false }) {
  return (
    <div className="group rounded-2xl bg-black/20 p-5 transition duration-300 hover:-translate-y-1 hover:bg-black/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>

          <p className="mt-2 text-3xl font-bold">
            <AnimatedNumber value={value} suffix={suffix} />
          </p>
        </div>

        {ring && <ProgressRing value={Number(value) || 0} size={56} stroke={6} />}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function DeadlineMetric({ label, value, description, tone, valueClassName }) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${tone}`}
    >
      <p className="text-sm text-slate-400">{label}</p>

      <p className={`mt-2 text-4xl font-bold ${valueClassName}`}>
        <AnimatedNumber value={value} />
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function DeadlineList({ title, applications, titleClassName }) {
  return (
    <div className="mt-8">
      <h3 className={`mb-3 text-sm font-semibold ${titleClassName}`}>{title}</h3>

      <div className="space-y-3">
        {applications.slice(0, 5).map((application) => (
          <div
            key={application.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/20 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-black/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <CompanyAvatar name={application.company} />

              <div>
                <p className="font-medium">{application.company}</p>

                <p className="text-sm text-slate-400">{application.role}</p>
              </div>
            </div>

            <p className="inline-flex items-center gap-2 text-sm text-slate-300">
              <Icon name="clock" className="h-4 w-4 text-slate-500" />
              {formatDate(application.deadline)}
            </p>
          </div>
        ))}
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

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>

      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

function HeroPill({ label, value, suffix = "", dot }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${dot}`} />

      <span className="text-slate-400">{label}</span>

      <span className="font-semibold text-white">
        <AnimatedNumber value={value} suffix={suffix} />
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix = "",
  accent,
  icon,
  spark,
  compact = false,
  reduceMotion = false,
}) {
  const sparkId = useId().replace(/:/g, "");
  const hasSpark = Array.isArray(spark) && spark.length > 1;

  return (
    <div
      className={`group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 ${
        compact ? "p-5" : "p-6"
      } ${hasSpark ? "pb-16" : ""}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-60 transition duration-300 group-hover:opacity-100`}
      />

      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl transition duration-500 group-hover:opacity-30`}
      />

      <div className="relative flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>

        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition duration-300 group-hover:scale-110 group-hover:text-white">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        )}
      </div>

      <p
        className={`relative mt-3 font-bold tracking-tight ${
          compact ? "text-3xl" : "text-4xl"
        }`}
      >
        <AnimatedNumber value={value} suffix={suffix} />
      </p>

      {hasSpark && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>

              <Area
                type="monotone"
                dataKey="count"
                stroke="#818cf8"
                strokeWidth={2}
                fill={`url(#${sparkId})`}
                isAnimationActive={!reduceMotion}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1020]/95 px-3 py-2 text-sm shadow-xl shadow-black/50 backdrop-blur">
      {(label || payload[0]?.payload?.name) && (
        <p className="text-xs text-slate-400">
          {label || payload[0].payload.name}
        </p>
      )}

      {payload.map((item) => (
        <p key={item.dataKey || item.name} className="mt-0.5 font-semibold text-white">
          {item.value}{" "}
          <span className="font-normal text-slate-400">
            {item.name === "Applications" ? "applications" : item.name}
          </span>
        </p>
      ))}
    </div>
  );
}

function EmptyBox({ icon, title, description }) {
  return (
    <div className="mt-6 rounded-2xl bg-black/20 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-400">
        <Icon name={icon} className="h-6 w-6" />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>

      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
  );
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
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-lg shadow-black/30 ${palette[index]}`}
    >
      {letter}
    </div>
  );
}

/* =========================================================
   Animation primitives
   ========================================================= */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    setReduced(query.matches);

    function handleChange(event) {
      setReduced(event.matches);
    }

    query.addEventListener?.("change", handleChange);

    return () => query.removeEventListener?.("change", handleChange);
  }, []);

  return reduced;
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
      { threshold: 0.06 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`an-reveal ${visible ? "is-visible" : ""} ${className}`}
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

function ProgressRing({ value = 0, size = 112, stroke = 9, showLabel = false }) {
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
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">
          {Math.round(Number(value) || 0)}%
        </div>
      )}
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`an-shimmer relative overflow-hidden rounded-3xl bg-white/5 ${className}`}
    />
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="relative z-0 min-h-screen bg-[#070910] text-white">
      <style>{animationStyles}</style>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="space-y-3">
          <Shimmer className="h-4 w-24 !rounded-lg" />
          <Shimmer className="h-12 w-64 !rounded-xl" />
          <Shimmer className="h-4 w-72 !rounded-lg" />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Shimmer className="h-36" />
          <Shimmer className="h-36" />
          <Shimmer className="h-36" />
          <Shimmer className="h-36" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <Shimmer className="h-72 lg:col-span-2" />
          <Shimmer className="h-72 lg:col-span-3" />
        </div>

        <Shimmer className="mt-8 h-96" />
      </main>
    </div>
  );
}

/* =========================================================
   Icons + helpers
   ========================================================= */

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    briefcase:
      "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 13h18",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    users:
      "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    award:
      "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.9L7 22l5-3 5 3-1.2-8.1",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    chart: "M3 3v18h18M8 17v-5M13 17V8M18 17v-9",
    alert:
      "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
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

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAnalyticsMonth(value) {
  const [year, month] = value.split("-");

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

export default Analytics;