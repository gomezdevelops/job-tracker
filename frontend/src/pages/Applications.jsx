import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

const statusStyles = {
  saved: "bg-slate-800 text-slate-300",
  applied: "bg-blue-950 text-blue-300",
  screening: "bg-yellow-950 text-yellow-300",
  interview: "bg-purple-950 text-purple-300",
  offer: "bg-green-950 text-green-300",
  rejected: "bg-red-950 text-red-300",
};

const statusLabels = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};
const priorityStyles = {
  high: "bg-red-950 text-red-300",
  medium: "bg-yellow-950 text-yellow-300",
  low: "bg-green-950 text-green-300",
};

const priorityLabels = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};
function Applications() {
  const [searchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState(
    searchParams.get("status") || ""
  );
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const filteredApplications = applications.filter(
    (application) => {
      const query = search.toLowerCase();

      const matchesSearch =
        application.company
          .toLowerCase()
          .includes(query) ||
        application.role
          .toLowerCase()
          .includes(query);

      

      return matchesSearch;
    }
  );

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/applications/${id}`);

      setApplications((current) =>
        current.filter(
          (application) =>
            application.id !== id
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to delete application.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h1 className="text-3xl font-bold">
            Applications
          </h1>

          <p className="mt-2 text-slate-400">
            Manage and track your job applications.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-3">
          <input
            type="text"
            placeholder="Search company or role..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>
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
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="created_at">
                Created
              </option>
              <option value="updated_at">
                Updated
              </option>
              <option value="deadline">
                Deadline
              </option>
              <option value="date_applied">
                Applied date
              </option>
              <option value="company">
                Company
              </option>
              <option value="role">
                Role
              </option>
              <option value="priority">
                Priority
              </option>
            </select>

            <select
              value={order}
              onChange={(event) =>
                setOrder(event.target.value)
              }
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="desc">
                Desc
              </option>
              <option value="asc">
                Asc
              </option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="mt-6">
          {loading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
              Loading applications...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6 text-red-300">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredApplications.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
                <h2 className="text-xl font-semibold">
                  No applications found
                </h2>

                <p className="mt-2 text-slate-400">
                  Try changing your filters or add a
                  new application.
                </p>
              </div>
            )}

          <div className="grid gap-4">
            {!loading &&
              filteredApplications.map(
                (application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onDelete={handleDelete}
                  />
                )
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ApplicationCard({
  application,
  onDelete,
}) {
  const [editingPriority, setEditingPriority] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  async function handlePriorityChange(event) {
    const newPriority = event.target.value;

    setSavingPriority(true);

    try {
      await api.patch(
        `/applications/${application.id}`,
        {
          priority: newPriority,
        }
      );

      application.priority = newPriority;
      setEditingPriority(false);
    } catch (error) {
      console.error(error);
      alert("Unable to update priority.");
    } finally {
      setSavingPriority(false);
    }
  }
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">
              {application.role}
            </h2>
            {isUrgentApplication(application) && (
              <span className="rounded-full bg-red-950 px-3 py-1 text-xs font-medium text-red-300">
                Urgent
              </span>
            )}

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                statusStyles[
                  application.status
                ]
              }`}
            >
              {
                statusLabels[
                  application.status
                ]
              }
            </span>
            {editingPriority ? (
              <select
                autoFocus
                value={application.priority || "medium"}
                onChange={handlePriorityChange}
                onBlur={() => {
                  if (!savingPriority) {
                    setEditingPriority(false);
                  }
                }}
                disabled={savingPriority}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300 outline-none focus:border-blue-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setEditingPriority(true)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-80 ${
                  priorityStyles[
                    application.priority || "medium"
                  ]
                }`}
                title="Change priority"
              >
                {
                  priorityLabels[
                    application.priority || "medium"
                  ]
                }
              </button>
            )}
          </div>

          <p className="mt-1 text-slate-400">
            {application.company}
          </p>

          <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">
            {application.date_applied && (
              <span>
                Applied:{" "}
                {formatDate(
                  application.date_applied
                )}
              </span>
            )}

            {application.deadline && (
              <div className="flex items-center gap-2">
                <span>
                  Deadline:{" "}
                  {formatDate(application.deadline)}
                </span>

                {(() => {
                  const deadlineInfo =
                    getDeadlineInfo(
                      application.deadline
                    );

                  return deadlineInfo ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${deadlineInfo.className}`}
                    >
                      {deadlineInfo.label}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {application.notes && (
            <p className="mt-4 line-clamp-2 text-sm text-slate-400">
              {application.notes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            to={`/applications/${application.id}`}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm transition hover:bg-slate-800"
          >
            View
          </Link>

          <button
            onClick={() =>
              onDelete(application.id)
            }
            className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400 transition hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
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
function getDeadlineInfo(value) {
  if (!value) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(`${value}T00:00:00`);
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

export default Applications;