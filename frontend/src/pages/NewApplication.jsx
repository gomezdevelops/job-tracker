import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const STATUS_OPTIONS = [
  { key: "saved", label: "Saved", dot: "bg-slate-400", chip: "bg-slate-500/10 text-slate-300 ring-slate-400/20" },
  { key: "applied", label: "Applied", dot: "bg-sky-400", chip: "bg-sky-500/10 text-sky-300 ring-sky-400/20" },
  { key: "screening", label: "Screening", dot: "bg-amber-400", chip: "bg-amber-500/10 text-amber-300 ring-amber-400/20" },
  { key: "interview", label: "Interview", dot: "bg-violet-400", chip: "bg-violet-500/10 text-violet-300 ring-violet-400/20" },
  { key: "offer", label: "Offer", dot: "bg-emerald-400", chip: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" },
  { key: "rejected", label: "Rejected", dot: "bg-rose-400", chip: "bg-rose-500/10 text-rose-300 ring-rose-400/20" },
];

const PRIORITY_OPTIONS = [
  { key: "high", label: "High", level: 3, bar: "bg-rose-400", text: "text-rose-300" },
  { key: "medium", label: "Medium", level: 2, bar: "bg-amber-400", text: "text-amber-300" },
  { key: "low", label: "Low", level: 1, bar: "bg-emerald-400", text: "text-emerald-300" },
];

const INPUT =
  "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-white/20 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20";

const animationStyles = `
@keyframes nw-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nw-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes nw-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes nw-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes nw-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.5); }
  50%      { box-shadow: 0 0 0 8px rgba(129, 140, 248, 0); }
}

.nw-fade-up { animation: nw-fade-up 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.nw-float { animation: nw-float 16s ease-in-out infinite; }
.nw-pop { animation: nw-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
.nw-glow { animation: nw-glow 2.2s ease-in-out infinite; }
.nw-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: nw-gradient 8s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .nw-fade-up, .nw-float, .nw-pop, .nw-glow, .nw-gradient-text {
    animation: none !important;
  }
}
`;

/* =========================================================
   Page
   ========================================================= */

function NewApplication() {
  const navigate = useNavigate();
  const formRef = useRef(null);

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

  function setField(name, value) {
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
        setError(detail.map((item) => item.msg).join(", "));
      } else {
        setError(detail || "Unable to create application.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Cmd/Ctrl + Enter saves from anywhere in the form.
  function handleKeyDown(event) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  /* ---------- Derived ---------- */

  const words = form.jd_text.trim() ? form.jd_text.trim().split(/\s+/).length : 0;

  const checklist = [
    { label: "Company", done: Boolean(form.company.trim()), required: true },
    { label: "Role", done: Boolean(form.role.trim()), required: true },
    { label: "Job description", done: Boolean(form.jd_text.trim()) },
    { label: "Job URL", done: Boolean(form.jd_url.trim()) },
    { label: "Date applied", done: Boolean(form.date_applied) },
    { label: "Deadline", done: Boolean(form.deadline) },
    { label: "Notes", done: Boolean(form.notes.trim()) },
  ];

  const completeness = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );

  let tip = "Looking good. You can always edit these details later.";

  if (!form.company.trim() || !form.role.trim()) {
    tip = "Start with the company and role. Everything else is optional.";
  } else if (!form.jd_text.trim()) {
    tip = "Paste the job description to unlock skill matching, AI tailoring and interview prep.";
  } else if (!form.deadline) {
    tip = "Set a deadline and it will show up in your reminders and urgent list.";
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
        <div className="nw-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="nw-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="nw-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <header className="nw-fade-up">
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

          <p className="text-sm font-medium text-indigo-300">New entry</p>

          <h1 className="nw-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Add Application
          </h1>

          <p className="mt-3 text-slate-400">
            Save a job and keep all of its details in one place.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* ===== Form ===== */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="min-w-0 space-y-6"
          >
            {error && (
              <div
                role="alert"
                className="nw-pop flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/30">
                  <Icon name="alert" className="h-3 w-3" />
                </span>

                <p className="flex-1">{error}</p>

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

            {/* The basics */}
            <Section
              step="1"
              title="The basics"
              subtitle="Who is it with, and what is the role?"
              delay={60}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Company */}
                <Field label="Company *" htmlFor="company">
                  <input
                    id="company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    required
                    placeholder="Google"
                    autoFocus
                    className={INPUT}
                  />
                </Field>

                {/* Role */}
                <Field label="Role *" htmlFor="role">
                  <input
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                    placeholder="Frontend Engineer"
                    className={INPUT}
                  />
                </Field>
              </div>
            </Section>

            {/* Pipeline */}
            <Section
              step="2"
              title="Pipeline"
              subtitle="Where does it stand and how much does it matter?"
              delay={120}
            >
              {/* Status */}
              <fieldset>
                <legend className="mb-3 block text-sm font-medium text-slate-300">
                  Status
                </legend>

                <div
                  role="radiogroup"
                  aria-label="Status"
                  className="flex flex-wrap gap-2"
                >
                  {STATUS_OPTIONS.map((option) => {
                    const active = form.status === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setField("status", option.key)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-300 active:scale-95 ${
                          active
                            ? "bg-gradient-to-r from-indigo-500/30 to-violet-500/20 text-white ring-1 ring-inset ring-indigo-400/50"
                            : "bg-white/[0.04] text-slate-400 ring-1 ring-inset ring-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${option.dot}`} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Priority */}
              <fieldset className="mt-6">
                <legend className="mb-3 block text-sm font-medium text-slate-300">
                  Priority
                </legend>

                <div
                  role="radiogroup"
                  aria-label="Priority"
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {PRIORITY_OPTIONS.map((option) => {
                    const active = form.priority === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setField("priority", option.key)}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left transition duration-300 active:scale-95 ${
                          active
                            ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 ring-1 ring-inset ring-indigo-400/50"
                            : "bg-white/[0.04] ring-1 ring-inset ring-white/10 hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            active ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {option.label}
                        </span>

                        <SignalBars level={option.level} barClassName={option.bar} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </Section>

            {/* Dates */}
            <Section
              step="3"
              title="Dates"
              subtitle="Add dates so reminders and deadlines can work for you."
              delay={180}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Date applied */}
                <Field label="Date Applied" htmlFor="date_applied">
                  <input
                    id="date_applied"
                    type="date"
                    name="date_applied"
                    value={form.date_applied}
                    onChange={handleChange}
                    className={`${INPUT} [color-scheme:dark]`}
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <QuickChip onClick={() => setField("date_applied", addDays(0))}>
                      Today
                    </QuickChip>

                    <QuickChip onClick={() => setField("date_applied", addDays(-1))}>
                      Yesterday
                    </QuickChip>

                    {form.date_applied && (
                      <QuickChip muted onClick={() => setField("date_applied", "")}>
                        Clear
                      </QuickChip>
                    )}
                  </div>
                </Field>

                {/* Deadline */}
                <Field label="Deadline" htmlFor="deadline">
                  <input
                    id="deadline"
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    className={`${INPUT} [color-scheme:dark]`}
                  />

                  <div className="mt-2 flex flex-wrap gap-2">
                    <QuickChip onClick={() => setField("deadline", addDays(3))}>
                      In 3 days
                    </QuickChip>

                    <QuickChip onClick={() => setField("deadline", addDays(7))}>
                      In 1 week
                    </QuickChip>

                    <QuickChip onClick={() => setField("deadline", addDays(14))}>
                      In 2 weeks
                    </QuickChip>

                    {form.deadline && (
                      <QuickChip muted onClick={() => setField("deadline", "")}>
                        Clear
                      </QuickChip>
                    )}
                  </div>
                </Field>
              </div>
            </Section>

            {/* The posting */}
            <Section
              step="4"
              title="The posting"
              subtitle="Link the listing and paste the description for smarter tools."
              delay={240}
            >
              {/* JD URL */}
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

              {/* Job description */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="jd_text"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Job Description
                  </label>

                  <span className="text-xs text-slate-500">
                    {words} word{words === 1 ? "" : "s"}
                  </span>
                </div>

                <textarea
                  id="jd_text"
                  name="jd_text"
                  value={form.jd_text}
                  onChange={handleChange}
                  rows={7}
                  placeholder="Paste the job description here..."
                  className={`${INPUT} resize-y`}
                />
              </div>
            </Section>

            {/* Notes */}
            <Section
              step="5"
              title="Notes"
              subtitle="Anything worth remembering."
              delay={300}
            >
              <Field label="Notes" htmlFor="notes">
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Interview notes, recruiter information, things to remember..."
                  className={`${INPUT} resize-y`}
                />
              </Field>
            </Section>

            {/* Actions */}
            <div
              className="nw-fade-up flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ animationDelay: "360ms" }}
            >
              <p className="hidden text-xs text-slate-500 sm:block">
                Tip: press{" "}
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-slate-300">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-slate-300">
                  Enter
                </kbd>{" "}
                to save.
              </p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link
                  to="/applications"
                  className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {submitting ? "Saving..." : "Save Application"}
                </button>
              </div>
            </div>
          </form>

          {/* ===== Live preview ===== */}
          <aside className="min-w-0">
            <div className="space-y-6 lg:sticky lg:top-28">
              <PreviewCard form={form} words={words} />

              <CompletenessCard
                completeness={completeness}
                checklist={checklist}
                tip={tip}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   Preview
   ========================================================= */

function PreviewCard({ form, words }) {
  const status = STATUS_OPTIONS.find((option) => option.key === form.status);
  const priority = PRIORITY_OPTIONS.find((option) => option.key === form.priority);
  const deadline = getDeadlineInfo(form.deadline);

  return (
    <div
      className="nw-fade-up relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
      style={{ animationDelay: "120ms" }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

      <p className="relative text-xs font-medium uppercase tracking-widest text-slate-500">
        Live preview
      </p>

      <div className="relative mt-4 flex items-start gap-4">
        <CompanyAvatar name={form.company} />

        <div className="min-w-0">
          <p
            className={`truncate font-semibold ${
              form.role.trim() ? "text-white" : "text-slate-600"
            }`}
          >
            {form.role.trim() || "Role title"}
          </p>

          <p
            className={`mt-0.5 truncate text-sm ${
              form.company.trim() ? "text-slate-400" : "text-slate-600"
            }`}
          >
            {form.company.trim() || "Company name"}
          </p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-2">
        {status && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${status.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        )}

        {priority && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-inset ring-white/10">
            <SignalBars level={priority.level} barClassName={priority.bar} small />
            <span className={priority.text}>{priority.label}</span>
          </span>
        )}

        {deadline && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${deadline.className}`}
          >
            <Icon name="clock" className="h-3 w-3" />
            {deadline.label}
          </span>
        )}
      </div>

      <dl className="relative mt-5 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Applied</dt>

          <dd className="text-slate-300">
            {form.date_applied ? formatDate(form.date_applied) : "—"}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Deadline</dt>

          <dd className="text-slate-300">
            {form.deadline ? formatDate(form.deadline) : "—"}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="text-slate-500">Description</dt>

          <dd className={words > 0 ? "text-emerald-300" : "text-slate-600"}>
            {words > 0 ? `${words} words` : "Not added"}
          </dd>
        </div>
      </dl>

      {form.notes.trim() && (
        <p className="nw-pop relative mt-5 line-clamp-3 rounded-2xl bg-black/20 p-3 text-sm text-slate-400">
          {form.notes.trim()}
        </p>
      )}
    </div>
  );
}

function CompletenessCard({ completeness, checklist, tip }) {
  return (
    <div
      className="nw-fade-up rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
      style={{ animationDelay: "180ms" }}
    >
      <div className="flex items-center gap-4">
        <ProgressRing value={completeness} size={72} stroke={7} />

        <div>
          <p className="text-sm font-medium text-slate-200">Details added</p>

          <p className="mt-0.5 text-xs text-slate-500">
            The more you add, the more the tools can do.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        {checklist.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-2 transition-colors ${
              item.done ? "text-emerald-300" : "text-slate-500"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                item.done ? "bg-emerald-500/20" : "border border-white/15"
              }`}
            >
              {item.done && <Icon name="check" className="h-2.5 w-2.5" />}
            </span>

            <span className="truncate">
              {item.label}
              {item.required && !item.done ? " *" : ""}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 flex gap-2 rounded-2xl bg-indigo-500/10 p-3 text-xs leading-5 text-indigo-200 ring-1 ring-inset ring-indigo-400/20">
        <Icon name="sparkle" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {tip}
      </p>
    </div>
  );
}

/* =========================================================
   UI components
   ========================================================= */

function Section({ step, title, subtitle, delay = 0, children }) {
  return (
    <section
      className="nw-fade-up relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold text-indigo-300 ring-1 ring-inset ring-indigo-400/20">
          {step}
        </span>

        <div>
          <h2 className="text-lg font-semibold">{title}</h2>

          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

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

function QuickChip({ children, onClick, muted = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition active:scale-95 ${
        muted
          ? "text-slate-500 ring-white/10 hover:text-slate-300"
          : "bg-white/5 text-slate-300 ring-white/10 hover:bg-indigo-500/15 hover:text-indigo-200 hover:ring-indigo-400/30"
      }`}
    >
      {children}
    </button>
  );
}

function SignalBars({ level, barClassName, small = false }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-[3px] rounded-sm ${
            bar <= level ? barClassName : "bg-white/15"
          }`}
          style={{ height: `${(small ? 3 : 5) + bar * (small ? 3 : 4)}px` }}
        />
      ))}
    </span>
  );
}

function ProgressRing({ value = 0, size = 72, stroke = 7 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(Number(value) || 0, 100));

    setOffset(circumference * (1 - clamped / 100));
  }, [value, circumference]);

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
          stroke={value >= 100 ? "#34d399" : "#818cf8"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition:
              "stroke-dashoffset 0.8s cubic-bezier(0.2, 0.7, 0.2, 1), stroke 0.4s",
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
        {value}%
      </div>
    </div>
  );
}

function CompanyAvatar({ name }) {
  const trimmed = (name || "").trim();
  const letter = trimmed ? trimmed.charAt(0).toUpperCase() : "?";

  const palette = [
    "from-indigo-500 to-violet-500",
    "from-cyan-500 to-sky-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-fuchsia-500 to-pink-500",
    "from-rose-500 to-red-500",
  ];

  const index =
    trimmed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    palette.length;

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg shadow-black/30 transition-colors duration-300 ${
        trimmed
          ? `bg-gradient-to-br ${palette[index]}`
          : "bg-white/5 text-slate-600"
      }`}
    >
      {letter}
    </div>
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    arrowLeft: "M19 12H5M11 6l-6 6 6 6",
    alert:
      "M12 9v4M12 17h.01M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
    x: "M6 6l12 12M18 6L6 18",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3",
    check: "M5 13l4 4L19 7",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z",
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

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(days) {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return toISODate(date);
}

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

  const daysLeft = Math.round(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

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

export default NewApplication;