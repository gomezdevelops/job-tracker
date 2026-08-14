import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

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

function NewApplication() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

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

      await api.post("/applications", payload);

      navigate("/applications");
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
          detail || "Unable to create application."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-4">
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
          <h1 className="text-3xl font-bold">
            Add Application
          </h1>

          <p className="mt-2 text-slate-400">
            Save a job and keep all of its details in one place.
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

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Company */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Company *
              </label>

              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                required
                placeholder="Google"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Role *
              </label>

              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                required
                placeholder="Frontend Engineer"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* Status */}
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
            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Priority
              </label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Date applied */}
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

            {/* Deadline */}
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
            </div>

            {/* JD URL */}
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

          {/* Job description */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Job Description
            </label>

            <textarea
              name="jd_text"
              value={form.jd_text}
              onChange={handleChange}
              rows={7}
              placeholder="Paste the job description here..."
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Interview notes, recruiter information, things to remember..."
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/applications"
              className="rounded-lg border border-slate-700 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : "Save Application"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default NewApplication;