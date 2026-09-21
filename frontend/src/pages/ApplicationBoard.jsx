import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

const columns = [
  {
    key: "saved",
    title: "Saved",
  },
  {
    key: "applied",
    title: "Applied",
  },
  {
    key: "screening",
    title: "Screening",
  },
  {
    key: "interview",
    title: "Interview",
  },
  {
    key: "offer",
    title: "Offer",
  },
  {
    key: "rejected",
    title: "Rejected",
  },
];

function ApplicationBoard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedApplication, setDraggedApplication] = useState(null);

  async function loadApplications() {
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
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleStatusChange(
    applicationId,
    newStatus
  ) {
    try {
      setError("");

      await api.patch(
        `/applications/${applicationId}`,
        {
          status: newStatus,
        }
      );

      await loadApplications();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to update application status."
      );
    }
  }

  function handleDragStart(application) {
    setDraggedApplication(application);
  }

  function handleDragEnd() {
    setDraggedApplication(null);
  }

  async function handleDrop(newStatus) {
    if (!draggedApplication) {
      return;
    }

    if (draggedApplication.status === newStatus) {
      setDraggedApplication(null);
      return;
    }

    try {
      setError("");

      await api.patch(
        `/applications/${draggedApplication.id}`,
        {
          status: newStatus,
        }
      );

      await loadApplications();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to update application status."
      );
    } finally {
      setDraggedApplication(null);
    }
  }

  function getApplicationsForColumn(status) {
    return applications.filter(
      (application) =>
        application.status === status
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading application board...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Header */}
        <div className="mb-8">
            <Link
                to="/applications"
                className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
            >
                <span>←</span>
                Back to Applications
            </Link>

            <h1 className="text-3xl font-bold text-white">
                Application Board
            </h1>

            <p className="mt-2 text-slate-400">
                Track your applications across every stage
                of the hiring process.
            </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-max gap-4">
            {columns.map((column) => {
              const columnApplications =
                getApplicationsForColumn(column.key);

              return (
                <section
                  key={column.key}
                  onDragOver={(event) =>
                    event.preventDefault()
                  }
                  onDrop={() =>
                    handleDrop(column.key)
                  }
                  className={`w-72 shrink-0 rounded-2xl border p-4 transition ${
                    draggedApplication
                      ? "border-blue-500/40 bg-blue-500/5"
                      : "border-slate-800 bg-slate-900"
                  }`}
                >
                  {/* Column Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-semibold text-white">
                      {column.title}
                    </h2>

                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                      {columnApplications.length}
                    </span>
                  </div>

                  {/* Applications */}
                  <div className="space-y-3">
                    {columnApplications.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
                        No applications
                      </p>
                    ) : (
                      columnApplications.map(
                        (application) => (
                          <article
                            key={application.id}
                            draggable
                            onDragStart={() =>
                              handleDragStart(application)
                            }
                            onDragEnd={handleDragEnd}
                            className={`cursor-grab rounded-xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-600 active:cursor-grabbing ${
                              draggedApplication?.id ===
                              application.id
                                ? "opacity-50"
                                : ""
                            }`}
                          >
                            {/* Company */}
                            <Link
                              to={`/applications/${application.id}`}
                              className="font-medium text-white hover:text-blue-400"
                            >
                              {application.company}
                            </Link>

                            {/* Role */}
                            <p className="mt-1 text-sm text-slate-400">
                              {application.role}
                            </p>

                            {/* Priority */}
                            {application.priority && (
                              <p className="mt-2 text-xs text-slate-500">
                                Priority:{" "}
                                {application.priority}
                              </p>
                            )}

                            {/* Status Selector */}
                            <select
                              value={application.status}
                              onChange={(event) =>
                                handleStatusChange(
                                  application.id,
                                  event.target.value
                                )
                              }
                              className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
                            >
                              {columns.map(
                                (statusColumn) => (
                                  <option
                                    key={
                                      statusColumn.key
                                    }
                                    value={
                                      statusColumn.key
                                    }
                                  >
                                    Move to{" "}
                                    {statusColumn.title}
                                  </option>
                                )
                              )}
                            </select>
                          </article>
                        )
                      )
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ApplicationBoard;