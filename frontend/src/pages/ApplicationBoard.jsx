import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api from "../api/client";

/* =========================================================
   Constants
   ========================================================= */

const columns = [
  {
    key: "saved",
    title: "Saved",
    dot: "bg-slate-400",
    text: "text-slate-300",
    bar: "bg-gradient-to-r from-slate-500 to-slate-300",
    flow: "bg-slate-400",
    edge: "from-transparent via-slate-400 to-transparent",
    over: "border-slate-400/60 shadow-[0_0_44px_-12px_rgba(148,163,184,0.55)]",
    bracket: "border-slate-300",
    badge: "bg-slate-500/10 text-slate-300 ring-slate-400/20",
  },
  {
    key: "applied",
    title: "Applied",
    dot: "bg-sky-400",
    text: "text-sky-300",
    bar: "bg-gradient-to-r from-sky-500 to-sky-300",
    flow: "bg-sky-400",
    edge: "from-transparent via-sky-400 to-transparent",
    over: "border-sky-400/60 shadow-[0_0_44px_-12px_rgba(56,189,248,0.6)]",
    bracket: "border-sky-300",
    badge: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
  },
  {
    key: "screening",
    title: "Screening",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bar: "bg-gradient-to-r from-amber-500 to-amber-300",
    flow: "bg-amber-400",
    edge: "from-transparent via-amber-400 to-transparent",
    over: "border-amber-400/60 shadow-[0_0_44px_-12px_rgba(251,191,36,0.55)]",
    bracket: "border-amber-300",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  },
  {
    key: "interview",
    title: "Interview",
    dot: "bg-violet-400",
    text: "text-violet-300",
    bar: "bg-gradient-to-r from-violet-500 to-violet-300",
    flow: "bg-violet-400",
    edge: "from-transparent via-violet-400 to-transparent",
    over: "border-violet-400/60 shadow-[0_0_44px_-12px_rgba(167,139,250,0.6)]",
    bracket: "border-violet-300",
    badge: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
  },
  {
    key: "offer",
    title: "Offer",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-300",
    flow: "bg-emerald-400",
    edge: "from-transparent via-emerald-400 to-transparent",
    over: "border-emerald-400/60 shadow-[0_0_44px_-12px_rgba(52,211,153,0.6)]",
    bracket: "border-emerald-300",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  },
  {
    key: "rejected",
    title: "Rejected",
    dot: "bg-rose-400",
    text: "text-rose-300",
    bar: "bg-gradient-to-r from-rose-500 to-rose-300",
    flow: "bg-rose-400",
    edge: "from-transparent via-rose-400 to-transparent",
    over: "border-rose-400/60 shadow-[0_0_44px_-12px_rgba(251,113,133,0.55)]",
    bracket: "border-rose-300",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
  },
];

const PRIORITY_FILTERS = [
  { value: "", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PRIORITY_META = {
  high: { level: 3, label: "High", bar: "bg-rose-400", text: "text-rose-300" },
  medium: { level: 2, label: "Medium", bar: "bg-amber-400", text: "text-amber-300" },
  low: { level: 1, label: "Low", bar: "bg-emerald-400", text: "text-emerald-300" },
};

const animationStyles = `
@keyframes bd-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bd-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes bd-shimmer {
  100% { transform: translateX(100%); }
}
@keyframes bd-scan {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}
@keyframes bd-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes bd-land {
  0%   { transform: scale(0.94); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.7); }
  60%  { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(129, 140, 248, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
}
@keyframes bd-burst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}
@keyframes bd-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
  70%  { box-shadow: 0 0 0 7px rgba(248, 113, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
@keyframes bd-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes bd-flow {
  from { background-position: 0 0; }
  to   { background-position: 24px 0; }
}

.bd-fade-up { animation: bd-fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.bd-float { animation: bd-float 16s ease-in-out infinite; }
.bd-pop { animation: bd-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
.bd-land { animation: bd-land 0.7s ease-out both; }
.bd-pulse { animation: bd-pulse 2s ease-out infinite; }
.bd-scan { animation: bd-scan 4.5s ease-in-out infinite; }
.bd-flow-rail {
  background-image: radial-gradient(circle, rgba(129, 140, 248, 0.9) 1.5px, transparent 1.6px);
  background-size: 24px 4px;
  background-repeat: repeat-x;
  animation: bd-flow 1.2s linear infinite;
}
.bd-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: bd-gradient 8s linear infinite;
}
.bd-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: bd-shimmer 1.5s infinite;
}
.bd-lane::-webkit-scrollbar { width: 6px; }
.bd-lane::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 999px; }
.bd-board::-webkit-scrollbar { height: 8px; }
.bd-board::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 999px; }

@media (prefers-reduced-motion: reduce) {
  .bd-fade-up, .bd-float, .bd-pop, .bd-land, .bd-pulse, .bd-scan, .bd-flow-rail,
  .bd-gradient-text, .bd-shimmer::after {
    animation: none !important;
  }
}
`;

/* =========================================================
   Page
   ========================================================= */

function ApplicationBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedApplication, setDraggedApplication] = useState(null);
  const [overColumn, setOverColumn] = useState(null);
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [lastMove, setLastMove] = useState(null);
  const [landedId, setLandedId] = useState(null);
  const [burstKey, setBurstKey] = useState(0);

  const inflight = useRef(0);
  const undoTimer = useRef(null);
  const landTimer = useRef(null);
  const searchRef = useRef(null);

  /* ---------- Data loading ---------- */

  async function loadApplications({ silent = false } = {}) {
    try {
      setError("");

      const response = await api.get("/applications");

      setApplications(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to load applications."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadApplications();

    return () => {
      clearTimeout(undoTimer.current);
      clearTimeout(landTimer.current);
    };
  }, []);

  /* ---------- Moving applications ---------- */

  // Moves instantly on screen, then confirms with the server. If the server
  // refuses, the card slides back and the error is shown.
  async function moveApplication(applicationId, newStatus, options = {}) {
    const target = applications.find(
      (application) => application.id === applicationId
    );

    if (!target || target.status === newStatus) {
      return;
    }

    const previousStatus = target.status;

    setError("");

    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? { ...application, status: newStatus }
          : application
      )
    );

    setLandedId(applicationId);
    clearTimeout(landTimer.current);
    landTimer.current = setTimeout(() => setLandedId(null), 800);

    if (newStatus === "offer") {
      setBurstKey((value) => value + 1);
    }

    inflight.current += 1;

    try {
      await api.patch(`/applications/${applicationId}`, {
        status: newStatus,
      });

      if (!options.skipUndo) {
        setLastMove({
          id: applicationId,
          company: target.company,
          from: previousStatus,
          to: newStatus,
          key: Date.now(),
        });

        clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setLastMove(null), 6000);
      } else {
        setLastMove(null);
      }
    } catch (error) {
      console.error(error);

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId &&
          application.status === newStatus
            ? { ...application, status: previousStatus }
            : application
        )
      );

      setError(
        error.response?.data?.detail ||
          "Unable to update application status."
      );
    } finally {
      inflight.current -= 1;

      // Re-sync with the server once every pending move has settled.
      if (inflight.current === 0) {
        loadApplications({ silent: true });
      }
    }
  }

  function handleStatusChange(applicationId, newStatus) {
    moveApplication(applicationId, newStatus);
  }

  function handleUndo() {
    if (!lastMove) {
      return;
    }

    const move = lastMove;

    setLastMove(null);
    clearTimeout(undoTimer.current);

    moveApplication(move.id, move.from, { skipUndo: true });
  }

  /* ---------- Drag and drop ---------- */

  function handleDragStart(event, application) {
    event.dataTransfer.effectAllowed = "move";

    try {
      event.dataTransfer.setData("text/plain", String(application.id));
    } catch {
      /* some browsers restrict this, dragging still works */
    }

    setDraggedApplication(application);
  }

  function handleDragEnd() {
    setDraggedApplication(null);
    setOverColumn(null);
  }

  function handleDrop(newStatus) {
    setOverColumn(null);

    if (!draggedApplication) {
      return;
    }

    if (draggedApplication.status === newStatus) {
      setDraggedApplication(null);
      return;
    }

    const id = draggedApplication.id;

    setDraggedApplication(null);

    moveApplication(id, newStatus);
  }

  function getApplicationsForColumn(status) {
    return applications.filter(
      (application) => application.status === status
    );
  }

  /* ---------- Keyboard: "/" focuses search ---------- */

  useEffect(() => {
    function handleKey(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const active = document.activeElement;
      const tag = active?.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        active?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* ---------- Derived data ---------- */

  const total = applications.length;

  const counts = columns.reduce((result, column) => {
    result[column.key] = applications.filter(
      (application) => application.status === column.key
    ).length;

    return result;
  }, {});

  const active = counts.applied + counts.screening + counts.interview;

  const momentum =
    total > 0
      ? Math.round(((counts.interview + counts.offer) / total) * 100)
      : 0;

  const normalizedQuery = query.trim().toLowerCase();
  const filtersActive = Boolean(normalizedQuery || priorityFilter);

  function matchesFilters(application) {
    const matchesQuery =
      !normalizedQuery ||
      application.company?.toLowerCase().includes(normalizedQuery) ||
      application.role?.toLowerCase().includes(normalizedQuery);

    const matchesPriority =
      !priorityFilter || (application.priority || "") === priorityFilter;

    return Boolean(matchesQuery && matchesPriority);
  }

  const matchCount = applications.filter(matchesFilters).length;

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="relative z-0 min-h-screen bg-[#070910] text-white">
        <style>{animationStyles}</style>

        <main className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6" aria-busy="true">
          <div className="space-y-3">
            <Shimmer className="h-4 w-28 !rounded-lg" />
            <Shimmer className="h-12 w-72 !rounded-xl" />
            <Shimmer className="h-4 w-96 max-w-full !rounded-lg" />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Shimmer className="h-24" />
            <Shimmer className="h-24" />
            <Shimmer className="h-24" />
            <Shimmer className="h-24" />
          </div>

          <div className="mt-8 flex gap-4 overflow-hidden">
            {columns.map((column) => (
              <Shimmer key={column.key} className="h-[28rem] w-[18.5rem] shrink-0" />
            ))}
          </div>
        </main>
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
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 25%, transparent 75%)",
            maskImage:
              "radial-gradient(ellipse at center, black 25%, transparent 75%)",
          }}
        />

        <div className="bd-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="bd-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="bd-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_88%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-10 sm:px-6">
        {/* Header */}
        <header className="bd-fade-up">
          <Link
            to="/applications"
            className="group mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <Icon
              name="arrowLeft"
              className="h-4 w-4 transition group-hover:-translate-x-1"
            />
            Back to Applications
          </Link>

          <p className="text-sm font-medium text-indigo-300">Mission control</p>

          <h1 className="bd-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Application Board
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Track your applications across every stage of the hiring process.
            Drag a card to a new stage, or focus it and press{" "}
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
              ←
            </kbd>{" "}
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">
              →
            </kbd>
            .
          </p>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bd-pop mt-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200 backdrop-blur-xl"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/30">
              <Icon name="alert" className="h-3 w-3" />
            </span>

            <p className="flex-1">{error}</p>

            <button
              type="button"
              onClick={() => loadApplications({ silent: true })}
              className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-medium ring-1 ring-red-400/30 transition hover:bg-red-500/20"
            >
              Retry
            </button>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="opacity-60 transition hover:opacity-100"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* HUD */}
        <section
          className="bd-fade-up mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animationDelay: "80ms" }}
        >
          <HudTile
            label="In pipeline"
            value={total}
            accent="from-indigo-400 to-indigo-600"
            hint="Total applications"
          />

          <HudTile
            label="Active"
            value={active}
            accent="from-sky-400 to-cyan-500"
            hint="Applied, screening, interview"
          />

          <HudTile
            label="Interviews"
            value={counts.interview}
            accent="from-violet-400 to-fuchsia-500"
            hint="Currently interviewing"
          />

          <HudTile
            label="Momentum"
            value={momentum}
            suffix="%"
            accent="from-emerald-400 to-teal-500"
            hint="Reached interview or offer"
          />
        </section>

        {/* Flow rail */}
        <section
          className="bd-fade-up mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
          style={{ animationDelay: "140ms" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Pipeline flow</p>

            <p className="text-xs text-slate-500">
              {total} application{total === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-4 flex h-2.5 gap-1 overflow-hidden rounded-full bg-white/5">
            {columns.map((column) =>
              counts[column.key] > 0 && total > 0 ? (
                <FlowSegment
                  key={column.key}
                  percent={(counts[column.key] / total) * 100}
                  className={column.flow}
                  title={`${column.title}: ${counts[column.key]}`}
                />
              ) : null
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {columns.map((column) => (
              <span
                key={column.key}
                className="inline-flex items-center gap-2 text-xs text-slate-400"
              >
                <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                {column.title}
                <span className="font-mono font-semibold text-slate-200">
                  {counts[column.key]}
                </span>
              </span>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section
          className="bd-fade-up mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          style={{ animationDelay: "200ms" }}
        >
          <div className="relative w-full lg:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="search" className="h-5 w-5" />
            </span>

            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Scan company or role..."
              aria-label="Search the board by company or role"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-12 text-sm text-white outline-none backdrop-blur-xl transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-500 sm:block">
                  /
                </kbd>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              role="radiogroup"
              aria-label="Filter by priority"
              className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl"
            >
              {PRIORITY_FILTERS.map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  role="radio"
                  aria-checked={priorityFilter === option.value}
                  onClick={() => setPriorityFilter(option.value)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition duration-300 ${
                    priorityFilter === option.value
                      ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filtersActive && (
              <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/20">
                {matchCount} match{matchCount === 1 ? "" : "es"}
              </span>
            )}
          </div>
        </section>

        {/* Kanban board */}
        <div
          className="bd-board bd-fade-up mt-6 overflow-x-auto pb-6"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex min-w-max gap-4">
            {columns.map((column) => {
              const columnApplications = getApplicationsForColumn(column.key);
              const visibleMatches = columnApplications.filter(matchesFilters).length;
              const isOver =
                overColumn === column.key &&
                draggedApplication &&
                draggedApplication.status !== column.key;

              return (
                <section
                  key={column.key}
                  aria-label={`${column.title} stage`}
                  onDragEnter={(event) => {
                    if (!draggedApplication) return;
                    event.preventDefault();
                    setOverColumn(column.key);
                  }}
                  onDragOver={(event) => {
                    if (!draggedApplication) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";

                    if (overColumn !== column.key) {
                      setOverColumn(column.key);
                    }
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setOverColumn((current) =>
                        current === column.key ? null : current
                      );
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(column.key);
                  }}
                  className={`relative flex w-[18.5rem] shrink-0 flex-col overflow-hidden rounded-3xl border bg-white/[0.03] p-4 backdrop-blur-xl transition duration-300 ${
                    isOver
                      ? column.over
                      : draggedApplication
                        ? "border-white/20 bg-white/[0.05]"
                        : "border-white/10"
                  }`}
                >
                  {/* Scanning edge */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
                    <div
                      className={`bd-scan h-px w-2/5 bg-gradient-to-r ${column.edge}`}
                    />
                  </div>

                  {/* Targeting brackets */}
                  {isOver && (
                    <>
                      <span className={`pointer-events-none absolute left-2 top-2 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 ${column.bracket}`} />
                      <span className={`pointer-events-none absolute right-2 top-2 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 ${column.bracket}`} />
                      <span className={`pointer-events-none absolute bottom-2 left-2 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 ${column.bracket}`} />
                      <span className={`pointer-events-none absolute bottom-2 right-2 h-4 w-4 rounded-br-lg border-b-2 border-r-2 ${column.bracket}`} />
                    </>
                  )}

                  {/* Celebration */}
                  {column.key === "offer" && burstKey > 0 && (
                    <Burst key={burstKey} />
                  )}

                  {/* Column header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-semibold text-white">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${column.dot} shadow-[0_0_12px_currentColor] ${column.text}`}
                        />
                        {column.title}
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-xs ring-1 ring-inset ${column.badge}`}
                      >
                        {filtersActive
                          ? `${visibleMatches}/${columnApplications.length}`
                          : columnApplications.length}
                      </span>
                    </div>

                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${column.bar}`}
                        style={{
                          width: `${
                            total > 0
                              ? (columnApplications.length / total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Applications */}
                  <div className="bd-lane -mr-2 max-h-[62vh] min-h-[8rem] flex-1 space-y-3 overflow-y-auto pr-2">
                    {columnApplications.length === 0 && !isOver ? (
                      <p className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                        No applications
                      </p>
                    ) : (
                      columnApplications.map((application, index) => (
                        <BoardCard
                          key={application.id}
                          application={application}
                          index={index}
                          dimmed={filtersActive && !matchesFilters(application)}
                          dragging={draggedApplication?.id === application.id}
                          landed={landedId === application.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}

                    {isOver && (
                      <div
                        className={`bd-pop flex h-20 items-center justify-center rounded-2xl border-2 border-dashed ${column.bracket} bg-white/[0.03] text-xs font-medium ${column.text}`}
                      >
                        Drop to move to {column.title}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <UndoToast move={lastMove} onUndo={handleUndo} onClose={() => setLastMove(null)} />
    </div>
  );
}

/* =========================================================
   Board card
   ========================================================= */

function BoardCard({
  application,
  index,
  dimmed,
  dragging,
  landed,
  onDragStart,
  onDragEnd,
  onStatusChange,
}) {
  const ref = useRef(null);

  const priority = PRIORITY_META[application.priority];
  const deadline = getDeadlineInfo(application.deadline);
  const urgent = isUrgentApplication(application);

  function handleMouseMove(event) {
    const element = ref.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();

    element.style.setProperty("--x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  function handleKeyDown(event) {
    // Only react when the card itself is focused, not its link or select.
    if (event.target !== event.currentTarget) {
      return;
    }

    const currentIndex = columns.findIndex(
      (column) => column.key === application.status
    );

    if (event.key === "ArrowRight" && currentIndex < columns.length - 1) {
      event.preventDefault();
      onStatusChange(application.id, columns[currentIndex + 1].key);
    }

    if (event.key === "ArrowLeft" && currentIndex > 0) {
      event.preventDefault();
      onStatusChange(application.id, columns[currentIndex - 1].key);
    }
  }

  return (
    <article
      ref={ref}
      draggable
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      onDragStart={(event) => onDragStart(event, application)}
      onDragEnd={onDragEnd}
      aria-label={`${application.role} at ${application.company}. Use left and right arrow keys to move between stages.`}
      style={{
        animationDelay: `${Math.min(index, 8) * 45}ms`,
        backgroundImage:
          "radial-gradient(180px circle at var(--x, -100px) var(--y, -100px), rgba(129,140,248,0.16), transparent 70%)",
      }}
      className={`bd-fade-up group relative cursor-grab rounded-2xl border bg-[#0b0e18] p-4 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-white/25 focus-visible:border-indigo-400/70 focus-visible:ring-2 focus-visible:ring-indigo-400/30 active:cursor-grabbing ${
        landed ? "bd-land border-indigo-400/60" : "border-white/10"
      } ${dragging ? "scale-95 opacity-40" : ""} ${
        dimmed ? "opacity-25 saturate-0" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar name={application.company} />

        <div className="min-w-0 flex-1">
          {/* Company */}
          <Link
            to={`/applications/${application.id}`}
            draggable={false}
            className="block truncate font-medium text-white transition hover:text-indigo-300"
          >
            {application.company}
          </Link>

          {/* Role */}
          <p className="mt-0.5 truncate text-sm text-slate-400">
            {application.role}
          </p>
        </div>

        {urgent && (
          <span
            title="Urgent"
            className="bd-pulse mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400"
          />
        )}
      </div>

      {/* Signals */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Priority */}
        {application.priority && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-inset ring-white/10">
            {priority && <SignalBars level={priority.level} barClassName={priority.bar} />}
            <span>
              Priority:{" "}
              <span className={priority?.text || "text-slate-300"}>
                {application.priority}
              </span>
            </span>
          </span>
        )}

        {deadline && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${deadline.className}`}
          >
            <Icon name="clock" className="h-3 w-3" />
            {deadline.label}
          </span>
        )}
      </div>

      {/* Status Selector */}
      <div className="relative mt-4">
        <select
          value={application.status}
          onChange={(event) =>
            onStatusChange(application.id, event.target.value)
          }
          aria-label={`Move ${application.company} to another stage`}
          className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-3 pr-9 text-xs text-slate-300 outline-none transition hover:border-white/20 focus:border-indigo-400/60"
        >
          {columns.map((statusColumn) => (
            <option
              key={statusColumn.key}
              value={statusColumn.key}
              className="bg-slate-900"
            >
              Move to {statusColumn.title}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Icon name="chevronDown" className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

/* =========================================================
   UI components
   ========================================================= */

function SignalBars({ level, barClassName }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-[3px] rounded-sm ${
            bar <= level ? barClassName : "bg-white/15"
          }`}
          style={{ height: `${4 + bar * 3}px` }}
        />
      ))}
    </span>
  );
}

function HudTile({ label, value, suffix = "", accent, hint }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent} opacity-60 transition duration-300 group-hover:opacity-100`}
      />

      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-10 blur-2xl transition duration-500 group-hover:opacity-30`}
      />

      <p className="relative text-xs font-medium uppercase tracking-widest text-slate-400">
        {label}
      </p>

      <p className="relative mt-2 font-mono text-4xl font-bold tracking-tight">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>

      <p className="relative mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function FlowSegment({ percent, className, title }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth(percent), 150);

    return () => clearTimeout(timeout);
  }, [percent]);

  return (
    <div
      title={title}
      className={`h-full rounded-full transition-[width] duration-1000 ease-out ${className}`}
      style={{ width: `${width}%` }}
    />
  );
}

function Burst() {
  const particles = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    const distance = 70 + (index % 3) * 22;

    return {
      dx: `${Math.round(Math.cos(angle) * distance)}px`,
      dy: `${Math.round(Math.sin(angle) * distance)}px`,
      color: ["#34d399", "#22d3ee", "#a78bfa", "#fbbf24"][index % 4],
      delay: `${(index % 4) * 40}ms`,
    };
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-8 z-20 h-0 w-0"
    >
      {particles.map((particle, index) => (
        <span
          key={index}
          className="absolute h-2 w-2 rounded-full"
          style={{
            backgroundColor: particle.color,
            "--dx": particle.dx,
            "--dy": particle.dy,
            animation: `bd-burst 1.1s ease-out ${particle.delay} both`,
          }}
        />
      ))}
    </div>
  );
}

function UndoToast({ move, onUndo, onClose }) {
  if (!move) {
    return null;
  }

  const to = columns.find((column) => column.key === move.to);

  return createPortal(
    <div
      key={move.key}
      role="status"
      aria-live="polite"
      className="bd-pop fixed bottom-6 right-6 z-[100] max-w-sm"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1020]/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${to?.dot || "bg-indigo-400"}`}
        />

        <p className="text-sm text-slate-200">
          <span className="font-medium text-white">{move.company}</span> moved
          to {to?.title || move.to}
        </p>

        <button
          type="button"
          onClick={onUndo}
          className="rounded-lg bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/30 transition hover:bg-indigo-500/25 active:scale-95"
        >
          Undo
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-slate-500 transition hover:text-white"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
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
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-lg shadow-black/30 ${palette[index]}`}
    >
      {letter}
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`bd-shimmer relative overflow-hidden rounded-3xl bg-white/5 ${className}`}
    />
  );
}

function AnimatedNumber({ value, suffix = "", duration = 900 }) {
  const target = Number(value) || 0;

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
      {Math.round(display)}
      {suffix}
    </>
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrowLeft: "M19 12H5M11 6l-6 6 6 6",
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    x: "M6 6l12 12M18 6L6 18",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    chevronDown: "M6 9l6 6 6-6",
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

/* =========================================================
   Helpers
   ========================================================= */

function getDaysLeft(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${value}T00:00:00`);
  deadline.setHours(0, 0, 0, 0);

  return Math.round(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getDeadlineInfo(value) {
  if (!value) {
    return null;
  }

  const daysLeft = getDaysLeft(value);

  if (daysLeft < 0) {
    return {
      label: "Overdue",
      className: "bg-red-500/10 text-red-300 ring-red-400/20",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className: "bg-red-500/10 text-red-300 ring-red-400/20",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
      className: "bg-orange-500/10 text-orange-300 ring-orange-400/20",
    };
  }

  if (daysLeft <= 7) {
    return {
      label: `${daysLeft} days left`,
      className: "bg-yellow-500/10 text-yellow-300 ring-yellow-400/20",
    };
  }

  return {
    label: `${daysLeft} days left`,
    className: "bg-white/5 text-slate-300 ring-white/10",
  };
}

function isUrgentApplication(application) {
  if (!application.deadline) {
    return false;
  }

  const daysLeft = getDaysLeft(application.deadline);

  if (daysLeft <= 0) {
    return true;
  }

  return daysLeft <= 3 && application.priority === "high";
}

export default ApplicationBoard;