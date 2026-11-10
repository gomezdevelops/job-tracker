import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  { title: "Create your account", note: "You're here", done: true },
  { title: "Add your first application", note: "Takes about a minute" },
  { title: "Upload a resume", note: "PDF or Word" },
  { title: "See your match score", note: "Per job, automatically" },
];

const STRENGTH_LEVELS = [
  { label: "Weak", text: "text-rose-400", bar: "bg-rose-500" },
  { label: "Fair", text: "text-amber-400", bar: "bg-amber-500" },
  { label: "Good", text: "text-sky-400", bar: "bg-sky-500" },
  { label: "Strong", text: "text-emerald-400", bar: "bg-emerald-500" },
];

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "mail")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    );
  if (name === "lock")
    return (
      <svg {...common}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  if (name === "eye")
    return (
      <svg {...common}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  if (name === "eye-off")
    return (
      <svg {...common}>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 4.4-1" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </svg>
    );
  if (name === "briefcase")
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...common} strokeWidth={2.4}>
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    );
  return null;
}

function getPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    extra: password.length >= 12 || /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return { checks, score };
}

function FirstWeekPreview() {
  return (
    <div className="relative w-full max-w-xl" aria-hidden="true">
      {/* glow behind card */}
      <div className="absolute -inset-6 rounded-[2rem] bg-blue-600/20 blur-3xl" />

      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
        <div className="mb-5 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="ml-3 text-xs text-slate-500">Your first week</span>
        </div>

        <ol className="space-y-2.5">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              style={{ animationDelay: `${index * 140}ms` }}
              className={`reg-in flex items-center gap-3 rounded-xl border p-3 ${
                step.done
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-slate-800 bg-slate-950"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-slate-700 text-xs font-medium text-slate-500"
                }`}
              >
                {step.done ? <Icon name="check" className="h-4 w-4" /> : index + 1}
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {step.title}
                </p>
                <p
                  className={`truncate text-xs ${
                    step.done ? "text-emerald-300" : "text-slate-500"
                  }`}
                >
                  {step.note}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {/* Match preview */}
        <div
          style={{ animationDelay: "700ms" }}
          className="reg-in mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">Northwind</p>
              <p className="truncate text-xs text-slate-400">Frontend Engineer</p>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300 ring-1 ring-inset ring-blue-400/20">
              82% match
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="reg-fill h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
              style={{ "--w": "82%", animationDelay: "900ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { checks, score } = getPasswordStrength(password);
  const level = STRENGTH_LEVELS[Math.max(score, 1) - 1];
  const strengthLabel = checks.length ? level.label : "Too short";

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await register(email, password);

      navigate("/login", {
        state: {
          registered: true,
          email,
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.detail || "Unable to create your account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[1.1fr_1fr]">
      <style>{`
        @keyframes reg-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes reg-fill {
          from { width: 0; }
          to { width: var(--w); }
        }
        .reg-in { opacity: 0; animation: reg-in 520ms ease-out forwards; }
        .reg-fill { width: 0; animation: reg-fill 1100ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .reg-in { opacity: 1; animation: none; }
          .reg-fill { width: var(--w); animation: none; }
        }
      `}</style>

      {/* Left: story panel (desktop only) */}
      <aside className="relative hidden overflow-hidden border-r border-slate-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(37,99,235,0.28), transparent 45%), radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "auto, 24px 24px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Icon name="briefcase" />
          </span>
          <span className="text-lg font-semibold">Job Tracker</span>
        </div>

        <div className="relative my-12 flex flex-1 flex-col justify-center gap-10">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Set up in a minute. Never lose a follow-up.
            </h1>
            <p className="mt-4 text-slate-400">
              Create your account, add your first application, and Job Tracker
              keeps the deadlines, reminders, and resume matches in one place.
            </p>
          </div>

          <FirstWeekPreview />
        </div>

        <p className="relative text-sm text-slate-500">
          No more spreadsheets with forty tabs and no idea who replied.
        </p>
      </aside>

      {/* Right: form */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Icon name="briefcase" />
            </span>
            <div>
              <h1 className="text-2xl font-bold leading-none">Job Tracker</h1>
              <p className="mt-1 text-sm text-slate-400">
                Start tracking your job applications.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
          >
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="mt-1 text-sm text-slate-400">
              It takes less than a minute.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-slate-300"
              >
                Email
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="mail" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="lock" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  aria-describedby="password-help"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} />
                </button>
              </div>

              {/* Strength meter */}
              <div id="password-help" className="mt-3" aria-live="polite">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((segment) => (
                    <span
                      key={segment}
                      className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        password && segment <= score && checks.length
                          ? level.bar
                          : password && segment === 1
                            ? "bg-rose-500"
                            : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {password ? "Password strength" : "Use 8 or more characters"}
                  </span>

                  {password && (
                    <span
                      className={`font-medium ${
                        checks.length ? level.text : "text-rose-400"
                      }`}
                    >
                      {strengthLabel}
                    </span>
                  )}
                </div>

                <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-3">
                  {[
                    { label: "8+ characters", met: checks.length },
                    { label: "Upper & lower case", met: checks.mixedCase },
                    { label: "A number", met: checks.number },
                  ].map((rule) => (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-1.5 transition-colors ${
                        rule.met ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          rule.met
                            ? "bg-emerald-500/20"
                            : "border border-slate-700"
                        }`}
                      >
                        {rule.met && <Icon name="check" className="h-3 w-3" />}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {submitting ? "Creating account..." : "Create account"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Register;