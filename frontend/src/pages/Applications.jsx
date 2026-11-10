import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

/* =========================================================
   Constants
   ========================================================= */

const statusMeta = {
  saved: {
    label: "Saved",
    badge: "bg-slate-500/10 text-slate-300 ring-slate-400/20",
    dot: "bg-slate-400",
    accent: "bg-slate-400",
  },
  applied: {
    label: "Applied",
    badge: "bg-sky-500/10 text-sky-300 ring-sky-400/20",
    dot: "bg-sky-400",
    accent: "bg-sky-400",
  },
  screening: {
    label: "Screening",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    dot: "bg-amber-400",
    accent: "bg-amber-400",
  },
  interview: {
    label: "Interview",
    badge: "bg-violet-500/10 text-violet-300 ring-violet-400/20",
    dot: "bg-violet-400",
    accent: "bg-violet-400",
  },
  offer: {
    label: "Offer",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
    dot: "bg-emerald-400",
    accent: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
    dot: "bg-rose-400",
    accent: "bg-rose-400",
  },
};

const priorityMeta = {
  high: {
    label: "High Priority",
    badge: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
    dot: "bg-rose-400",
  },
  medium: {
    label: "Medium Priority",
    badge: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
    dot: "bg-amber-400",
  },
  low: {
    label: "Low Priority",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
    dot: "bg-emerald-400",
  },
};

const SORT_OPTIONS = [
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
  { value: "deadline", label: "Deadline" },
  { value: "date_applied", label: "Applied date" },
  { value: "company", label: "Company" },
  { value: "role", label: "Role" },
  { value: "priority", label: "Priority" },
];

const animationStyles = `
@keyframes app-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes app-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes app-shimmer {
  100% { transform: translateX(100%); }
}
@keyframes app-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes app-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
  70%  { box-shadow: 0 0 0 8px rgba(248, 113, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
@keyframes app-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.app-fade-up { animation: app-fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.app-float { animation: app-float 16s ease-in-out infinite; }
.app-pop { animation: app-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
.app-pulse { animation: app-pulse 2s ease-out infinite; }
.app-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: app-gradient 8s linear infinite;
}
.app-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: app-shimmer 1.5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .app-fade-up, .app-float, .app-pop, .app-pulse, .app-gradient-text, .app-shimmer::after {
    animation: none !important;
  }
}
`;

/* =========================================================
   Page
   ========================================================= */

function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [priorityRecommendations, setPriorityRecommendations] = useState({});
  const [priorityLoading, setPriorityLoading] = useState({});
  const [priorityErrors, setPriorityErrors] = useState({});

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const searchRef = useRef(null);
  const toastTimer = useRef(null);

  /* ---------- Data loading ---------- */

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/applications", {
        params: {
          ...(status && { status }),
          ...(priority && { priority }),
          sort_by: sortBy,
          order,
        },
      });

      setApplications(response.data);
    } catch (error) {
      console.error(error);
      setError("Unable to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [status, priority, sortBy, order]);

  // Keep the filter in sync when the URL changes (e.g. dashboard links).
  useEffect(() => {
    setStatus(searchParams.get("status") || "");
  }, [searchParams]);

  function changeStatus(value) {
    setStatus(value);
    setSearchParams(value ? { status: value } : {}, { replace: true });
  }

  /* ---------- Derived data ---------- */

  const filteredApplications = applications.filter((application) => {
    const query = search.toLowerCase();

    const matchesSearch =
      application.company?.toLowerCase().includes(query) ||
      application.role?.toLowerCase().includes(query) ||
      application.jd_text?.toLowerCase().includes(query) ||
      application.notes?.toLowerCase().includes(query);

    return matchesSearch;
  });

  const hasFilters = Boolean(status || priority || search.trim());

  const visibleIds = filteredApplications.map((application) => application.id);

  const selectedVisibleCount = visibleIds.filter((id) =>
    selectedApplications.includes(id)
  ).length;

  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  /* ---------- Selection ---------- */

  function toggleApplicationSelection(applicationId) {
    setSelectedApplications((current) =>
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId]
    );
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedApplications((current) =>
        current.filter((id) => !visibleIds.includes(id))
      );
      return;
    }

    setSelectedApplications((current) => [
      ...new Set([...current, ...visibleIds]),
    ]);
  }

  // Drop selections that are no longer visible after filtering.
  useEffect(() => {
    const visible = new Set(
      filteredApplications.map((application) => application.id)
    );

    setSelectedApplications((current) => {
      const next = current.filter((id) => visible.has(id));

      return next.length === current.length ? current : next;
    });
  }, [search, status, priority, sortBy, order, applications]);

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

  /* ---------- Toast ---------- */

  function showToast(message, tone = "success") {
    setToast({ message, tone, id: Date.now() });

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- Confirm dialog ---------- */

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

  /* ---------- Priority recommendation ---------- */

  async function handlePriorityRecommendation(applicationId) {
    setPriorityLoading((prev) => ({
      ...prev,
      [applicationId]: true,
    }));

    setPriorityErrors((prev) => ({
      ...prev,
      [applicationId]: "",
    }));

    try {
      const response = await api.post(
        `/applications/${applicationId}/priority-recommendation`
      );

      setPriorityRecommendations((prev) => ({
        ...prev,
        [applicationId]: response.data,
      }));
    } catch (error) {
      setPriorityErrors((prev) => ({
        ...prev,
        [applicationId]:
          error.response?.data?.detail ||
          "Failed to generate priority recommendation.",
      }));
    } finally {
      setPriorityLoading((prev) => ({
        ...prev,
        [applicationId]: false,
      }));
    }
  }

  function dismissRecommendation(applicationId) {
    setPriorityRecommendations((prev) => {
      const next = { ...prev };
      delete next[applicationId];
      return next;
    });
  }

  function handlePriorityUpdated(applicationId, newPriority) {
    setApplications((current) =>
      current.map((application) =>
        application.id === applicationId
          ? { ...application, priority: newPriority }
          : application
      )
    );
  }

  /* ---------- Bulk actions ---------- */

  async function handleBulkStatusChange(newStatus) {
    if (selectedApplications.length === 0) {
      return;
    }

    setBulkActionLoading(true);

    try {
      await api.patch("/applications/bulk/status", {
        application_ids: selectedApplications,
        status: newStatus,
      });

      const count = selectedApplications.length;

      setSelectedApplications([]);
      await loadApplications();

      showToast(
        `${count} application${count === 1 ? "" : "s"} moved to ${
          statusMeta[newStatus]?.label || newStatus
        }.`
      );
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.detail ||
          "Unable to update application statuses.",
        "error"
      );
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkPriorityChange(newPriority) {
    if (selectedApplications.length === 0) {
      return;
    }

    setBulkActionLoading(true);

    try {
      await api.patch("/applications/bulk/priority", {
        application_ids: selectedApplications,
        priority: newPriority,
      });

      const count = selectedApplications.length;

      setSelectedApplications([]);
      await loadApplications();

      showToast(
        `${count} application${count === 1 ? "" : "s"} set to ${
          priorityMeta[newPriority]?.label || newPriority
        }.`
      );
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.detail ||
          "Unable to update application priorities.",
        "error"
      );
    } finally {
      setBulkActionLoading(false);
    }
  }

  function handleBulkDelete() {
    if (selectedApplications.length === 0) {
      return;
    }

    const count = selectedApplications.length;

    setConfirmDialog({
      title: `Delete ${count} application${count === 1 ? "" : "s"}?`,
      message: `Are you sure you want to delete ${count} selected application${
        count === 1 ? "" : "s"
      }? This can't be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setBulkActionLoading(true);

        try {
          await api.delete("/applications/bulk", {
            data: {
              application_ids: selectedApplications,
            },
          });

          setSelectedApplications([]);
          await loadApplications();

          showToast(`${count} application${count === 1 ? "" : "s"} deleted.`);
        } catch (error) {
          console.error(error);
          showToast(
            error.response?.data?.detail ||
              "Unable to delete selected applications.",
            "error"
          );
        } finally {
          setBulkActionLoading(false);
        }
      },
    });
  }

  /* ---------- Single delete ---------- */

  function handleDelete(id) {
    const target = applications.find((application) => application.id === id);

    setConfirmDialog({
      title: "Delete this application?",
      message: target
        ? `${target.role} at ${target.company} will be permanently removed.`
        : "This application will be permanently removed.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await api.delete(`/applications/${id}`);

          setApplications((current) =>
            current.filter((application) => application.id !== id)
          );

          setSelectedApplications((current) =>
            current.filter((selectedId) => selectedId !== id)
          );

          showToast("Application deleted.");
        } catch (error) {
          console.error(error);
          showToast("Unable to delete application.", "error");
        }
      },
    });
  }

  function clearFilters() {
    setSearch("");
    setPriority("");
    changeStatus("");
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
        <div className="app-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="app-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="app-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}
        <header className="app-fade-up flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-300">Pipeline</p>

            <h1 className="app-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Applications
            </h1>

            <p className="mt-3 text-slate-400">
              Manage and track your job applications.
            </p>
          </div>

          <Link
            to="/applications/new"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95"
          >
            <Icon
              name="plus"
              className="h-4 w-4 transition duration-300 group-hover:rotate-90"
            />
            New application
          </Link>
        </header>

        {/* Filters */}
        <section
          className="app-fade-up mt-8 space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
          style={{ animationDelay: "80ms" }}
        >
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Icon name="search" className="h-5 w-5" />
            </span>

            <input
              ref={searchRef}
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-12 pr-24 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
            />

            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
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

          {/* Status tabs */}
          <div
            role="tablist"
            aria-label="Filter by status"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            <StatusTab
              active={status === ""}
              onClick={() => changeStatus("")}
              label="All statuses"
            />

            {Object.entries(statusMeta).map(([key, meta]) => (
              <StatusTab
                key={key}
                active={status === key}
                onClick={() => changeStatus(key)}
                label={meta.label}
                dot={meta.dot}
              />
            ))}
          </div>

          {/* Priority + sort */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="radiogroup"
              aria-label="Filter by priority"
              className="inline-flex w-full rounded-xl border border-white/10 bg-black/30 p-1 lg:w-auto"
            >
              {[
                { value: "", label: "All priorities" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ].map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  role="radio"
                  aria-checked={priority === option.value}
                  onClick={() => setPriority(option.value)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition duration-300 lg:flex-none ${
                    priority === option.value
                      ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {option.value && (
                    <span
                      className={`mr-2 inline-block h-1.5 w-1.5 rounded-full ${
                        priorityMeta[option.value].dot
                      }`}
                    />
                  )}
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1 lg:w-48 lg:flex-none">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort by"
                  className="w-full appearance-none rounded-xl border border-white/10 bg-black/30 py-3 pl-4 pr-10 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-indigo-400/60"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-slate-900"
                    >
                      Sort: {option.label}
                    </option>
                  ))}
                </select>

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="chevronDown" className="h-4 w-4" />
                </span>
              </div>

              <button
                type="button"
                onClick={() => setOrder((value) => (value === "desc" ? "asc" : "desc"))}
                aria-label={`Order: ${order === "desc" ? "descending" : "ascending"}`}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-black/40 active:scale-95"
              >
                <Icon
                  name="arrowDown"
                  className={`h-4 w-4 transition-transform duration-300 ${
                    order === "asc" ? "rotate-180" : ""
                  }`}
                />
                {order === "desc" ? "Desc" : "Asc"}
              </button>
            </div>
          </div>
        </section>

        {/* Results header + select all */}
        {!loading && !error && (
          <div
            className="app-fade-up mt-6 flex flex-wrap items-center justify-between gap-4 px-1"
            style={{ animationDelay: "140ms" }}
          >
            <div className="flex items-center gap-3">
              {filteredApplications.length > 0 && (
                <>
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={selectedVisibleCount > 0}
                    onChange={toggleSelectAll}
                    label="Select all visible applications"
                  />

                  <span className="text-sm text-slate-300">
                    Select All Visible
                  </span>
                </>
              )}

              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-white/10">
                {filteredApplications.length} result
                {filteredApplications.length === 1 ? "" : "s"}
              </span>

              {selectedApplications.length > 0 && (
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-indigo-400/20">
                  {selectedApplications.length} selected
                </span>
              )}
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-indigo-300 transition hover:text-indigo-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <div className="mt-4">
          {loading && (
            <div className="grid gap-4" aria-busy="true">
              <Shimmer className="h-40" />
              <Shimmer className="h-40" />
              <Shimmer className="h-40" />
              <Shimmer className="h-40" />
            </div>
          )}

          {error && (
            <div className="app-fade-up rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-300">
                <Icon name="alert" className="h-6 w-6" />
              </div>

              <p className="mt-4 font-medium text-red-200">{error}</p>

              <button
                type="button"
                onClick={loadApplications}
                className="mt-5 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 ring-1 ring-red-400/30 transition hover:bg-red-500/20"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredApplications.length === 0 && (
            <div className="app-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
                <Icon name={hasFilters ? "search" : "briefcase"} className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                {hasFilters ? "No applications found" : "No applications yet"}
              </h2>

              <p className="mt-2 text-slate-400">
                {hasFilters
                  ? "Try changing your filters or add a new application."
                  : "Add your first application to start tracking."}
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Clear filters
                  </button>
                )}

                <Link
                  to="/applications/new"
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Add application
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {!loading &&
              filteredApplications.map((application, index) => (
                <ApplicationCard
                  key={application.id}
                  index={index}
                  application={application}
                  selected={selectedApplications.includes(application.id)}
                  onSelect={toggleApplicationSelection}
                  onDelete={handleDelete}
                  onPriorityUpdated={handlePriorityUpdated}
                  onNotify={showToast}
                  onPriorityRecommendation={handlePriorityRecommendation}
                  onDismissRecommendation={dismissRecommendation}
                  priorityRecommendation={priorityRecommendations[application.id]}
                  priorityLoading={priorityLoading[application.id]}
                  priorityError={priorityErrors[application.id]}
                />
              ))}
          </div>
        </div>

        {/* Bulk actions (floating) */}
        {selectedApplications.length > 0 && (
          <div className="app-pop sticky bottom-4 z-20 mt-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-indigo-400/30 bg-[#0d1020]/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-bold text-indigo-200">
                  {selectedApplications.length}
                </span>

                <div>
                  <p className="font-medium text-white">
                    {selectedApplications.length} application
                    {selectedApplications.length === 1 ? "" : "s"} selected
                  </p>

                  <p className="text-sm text-slate-400">
                    Apply an action to all selected applications.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Status */}
                <div className="relative">
                  <select
                    defaultValue=""
                    disabled={bulkActionLoading}
                    aria-label="Change status of selected applications"
                    onChange={(event) => {
                      if (event.target.value) {
                        handleBulkStatusChange(event.target.value);
                        event.target.value = "";
                      }
                    }}
                    className="appearance-none rounded-xl border border-white/10 bg-black/40 py-2.5 pl-4 pr-9 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-900">
                      Change Status
                    </option>
                    {Object.entries(statusMeta).map(([key, meta]) => (
                      <option key={key} value={key} className="bg-slate-900">
                        {meta.label}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="chevronDown" className="h-4 w-4" />
                  </span>
                </div>

                {/* Priority */}
                <div className="relative">
                  <select
                    defaultValue=""
                    disabled={bulkActionLoading}
                    aria-label="Change priority of selected applications"
                    onChange={(event) => {
                      if (event.target.value) {
                        handleBulkPriorityChange(event.target.value);
                        event.target.value = "";
                      }
                    }}
                    className="appearance-none rounded-xl border border-white/10 bg-black/40 py-2.5 pl-4 pr-9 text-sm text-slate-200 outline-none transition hover:border-white/20 focus:border-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-900">
                      Change Priority
                    </option>
                    {Object.entries(priorityMeta).map(([key, meta]) => (
                      <option key={key} value={key} className="bg-slate-900">
                        {meta.label}
                      </option>
                    ))}
                  </select>

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Icon name="chevronDown" className="h-4 w-4" />
                  </span>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkActionLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300/30 border-t-red-300" />
                  ) : (
                    <Icon name="trash" className="h-4 w-4" />
                  )}
                  {bulkActionLoading ? "Processing..." : "Delete Selected"}
                </button>

                {/* Clear */}
                <button
                  type="button"
                  disabled={bulkActionLoading}
                  onClick={() => setSelectedApplications([])}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
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
   Application card
   ========================================================= */

function ApplicationCard({
  application,
  index,
  selected,
  onSelect,
  onDelete,
  onPriorityUpdated,
  onNotify,
  onPriorityRecommendation,
  onDismissRecommendation,
  priorityRecommendation,
  priorityLoading,
  priorityError,
}) {
  const [editingPriority, setEditingPriority] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);

  const currentPriority = application.priority || "medium";
  const urgent = isUrgentApplication(application);
  const deadlineInfo = getDeadlineInfo(application.deadline);
  const recommended = priorityRecommendation?.recommended_priority;

  async function savePriority(newPriority) {
    setSavingPriority(true);

    try {
      await api.patch(`/applications/${application.id}`, {
        priority: newPriority,
      });

      onPriorityUpdated(application.id, newPriority);
      setEditingPriority(false);
    } catch (error) {
      console.error(error);
      onNotify("Unable to update priority.", "error");
    } finally {
      setSavingPriority(false);
    }
  }

  function handlePriorityChange(event) {
    savePriority(event.target.value);
  }

  return (
    <article
      className={`app-fade-up group relative overflow-hidden rounded-3xl border bg-white/[0.03] p-5 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 sm:p-6 ${
        selected
          ? "border-indigo-400/50 bg-indigo-500/[0.06] shadow-lg shadow-indigo-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
    >
      {/* Status accent */}
      <span
        className={`absolute inset-y-0 left-0 w-1 ${
          statusMeta[application.status]?.accent || "bg-slate-500"
        } opacity-70 transition group-hover:opacity-100`}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* Application information */}
        <div className="flex min-w-0 items-start gap-4">
          <div className="mt-1">
            <Checkbox
              checked={selected}
              onChange={() => onSelect(application.id)}
              label={`Select ${application.role} at ${application.company}`}
            />
          </div>

          <CompanyAvatar name={application.company} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-semibold">{application.role}</h2>

              {urgent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 ring-1 ring-red-400/20">
                  <span className="app-pulse h-1.5 w-1.5 rounded-full bg-red-400" />
                  Urgent
                </span>
              )}

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                  statusMeta[application.status]?.badge ||
                  "bg-white/5 text-slate-300 ring-white/10"
                }`}
              >
                {statusMeta[application.status]?.label || application.status}
              </span>

              {editingPriority ? (
                <select
                  autoFocus
                  value={currentPriority}
                  onChange={handlePriorityChange}
                  onBlur={() => {
                    if (!savingPriority) {
                      setEditingPriority(false);
                    }
                  }}
                  disabled={savingPriority}
                  className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 outline-none focus:border-indigo-400/60"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingPriority(true)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition hover:brightness-125 ${priorityMeta[currentPriority].badge}`}
                  title="Change priority"
                >
                  {priorityMeta[currentPriority].label}
                </button>
              )}

              <button
                type="button"
                onClick={() => onPriorityRecommendation(application.id)}
                disabled={priorityLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 transition hover:bg-purple-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {priorityLoading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-purple-300/30 border-t-purple-300" />
                ) : (
                  <Icon name="sparkle" className="h-3.5 w-3.5" />
                )}
                {priorityLoading ? "Analyzing..." : "AI Priority"}
              </button>
            </div>

            <p className="mt-1.5 text-slate-400">{application.company}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {application.date_applied && (
                <span className="inline-flex items-center gap-2">
                  <Icon name="calendar" className="h-4 w-4" />
                  Applied: {formatDate(application.date_applied)}
                </span>
              )}

              {application.deadline && (
                <div className="flex items-center gap-2">
                  <Icon name="clock" className="h-4 w-4" />

                  <span>Deadline: {formatDate(application.deadline)}</span>

                  {deadlineInfo && (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${deadlineInfo.className}`}
                    >
                      {deadlineInfo.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            {application.notes && (
              <p className="mt-4 line-clamp-2 text-sm text-slate-400">
                {application.notes}
              </p>
            )}

            {priorityError && (
              <div className="app-pop mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {priorityError}
              </div>
            )}

            {priorityRecommendation && (
              <div className="app-pop relative mt-4 overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/20 blur-2xl" />

                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-200">
                      <Icon name="sparkle" className="h-4 w-4" />
                    </span>

                    <h4 className="font-medium text-gray-200">
                      AI Priority Recommendation
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium capitalize text-purple-300 ring-1 ring-purple-400/20">
                      {priorityRecommendation.recommended_priority}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDismissRecommendation(application.id)}
                      aria-label="Dismiss recommendation"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="relative mt-3 text-sm leading-5 text-gray-400">
                  {priorityRecommendation.reason}
                </p>

                <div className="relative mt-3 text-xs text-gray-400">
                  <span className="font-medium text-gray-300">Urgency:</span>{" "}
                  <span className="capitalize">
                    {priorityRecommendation.urgency}
                  </span>
                </div>

                {priorityRecommendation.actions?.length > 0 && (
                  <div className="relative mt-4">
                    <p className="mb-2 text-xs font-medium text-gray-300">
                      Suggested Actions
                    </p>

                    <ul className="space-y-2">
                      {priorityRecommendation.actions.map((action, actionIndex) => (
                        <li
                          key={actionIndex}
                          className="flex gap-2 text-xs leading-5 text-gray-400"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-purple-400" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recommended &&
                  priorityMeta[recommended] &&
                  recommended !== currentPriority && (
                    <button
                      type="button"
                      onClick={() => savePriority(recommended)}
                      disabled={savingPriority}
                      className="relative mt-4 rounded-lg border border-purple-400/30 bg-purple-500/10 px-3 py-2 text-xs font-medium text-purple-200 transition hover:bg-purple-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPriority
                        ? "Applying..."
                        : `Apply ${priorityMeta[recommended].label}`}
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/applications/${application.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10 active:scale-95"
          >
            <Icon name="eye" className="h-4 w-4" />
            View
          </Link>

          <button
            type="button"
            onClick={() => onDelete(application.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 active:scale-95"
          >
            <Icon name="trash" className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   UI components
   ========================================================= */

function StatusTab({ active, onClick, label, dot }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-300 active:scale-95 ${
        active
          ? "bg-gradient-to-r from-indigo-500/30 to-violet-500/20 text-white ring-1 ring-inset ring-indigo-400/40"
          : "bg-white/[0.04] text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {label}
    </button>
  );
}

function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const inputRef = useRef(null);

  const showIndeterminate = indeterminate && !checked;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = showIndeterminate;
    }
  }, [showIndeterminate]);

  return (
    <label className="relative inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer sr-only"
      />

      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400/60 ${
          checked || showIndeterminate
            ? "border-indigo-400 bg-indigo-500 text-white"
            : "border-white/20 bg-white/5 hover:border-white/40"
        }`}
      >
        {checked && <Icon name="check" className="h-3.5 w-3.5" />}
        {showIndeterminate && <Icon name="minus" className="h-3.5 w-3.5" />}
      </span>
    </label>
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
      className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg shadow-black/30 sm:flex ${palette[index]}`}
    >
      {letter}
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`app-shimmer relative overflow-hidden rounded-3xl bg-white/5 ${className}`}
    />
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="app-pop relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1020] p-6 shadow-2xl shadow-black/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <Icon name="trash" className="h-6 w-6" />
        </div>

        <h3 id="confirm-title" className="mt-4 text-lg font-semibold text-white">
          {dialog.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {dialog.message}
        </p>

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
            {busy && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
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
      key={toast.id}
      role="status"
      aria-live="polite"
      className="app-pop fixed bottom-6 right-6 z-[100] max-w-sm"
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
          className="ml-2 text-current opacity-60 transition hover:opacity-100"
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
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    x: "M6 6l12 12M18 6L6 18",
    plus: "M12 5v14M5 12h14",
    check: "M5 13l4 4L19 7",
    minus: "M6 12h12",
    trash:
      "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    calendar: "M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
    chevronDown: "M6 9l6 6 6-6",
    arrowDown: "M12 5v14M6 13l6 6 6-6",
    briefcase:
      "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M3 13h18",
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

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDeadlineInfo(value) {
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
      className: "bg-red-500/10 text-red-300 ring-red-400/20",
    };
  }

  if (daysLeft === 0) {
    return {
      label: "Due today",
      className: "bg-red-500/10 text-red-300 ring-red-400/20",
    };
  }

  if (daysLeft === 1) {
    return {
      label: "1 day left",
      className: "bg-orange-500/10 text-orange-300 ring-orange-400/20",
    };
  }

  if (daysLeft <= 3) {
    return {
      label: `${daysLeft} days left`,
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

export default Applications;