import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const COLUMNS = [
  {
    title: "Applied",
    dot: "bg-slate-400",
    cards: [
      { company: "Northwind", role: "Frontend Engineer", tag: "2d ago" },
      { company: "Lumen Labs", role: "Product Designer", tag: "4d ago" },
      { company: "Parcel", role: "Backend Engineer", tag: "1w ago" },
    ],
  },
  {
    title: "Interview",
    dot: "bg-blue-400",
    cards: [
      { company: "Fieldnote", role: "Full Stack Developer", tag: "Thu 3:00 PM" },
      { company: "Orbit", role: "Data Analyst", tag: "Fri 11:30 AM" },
    ],
  },
  {
    title: "Offer",
    dot: "bg-emerald-400",
    cards: [{ company: "Kestrel", role: "Software Engineer", tag: "Reply by Mon" }],
  },
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
  return null;
}

function PipelinePreview() {
  let order = 0;

  return (
    <div className="relative w-full max-w-xl" aria-hidden="true">
      {/* glow behind board */}
      <div className="absolute -inset-6 rounded-[2rem] bg-blue-600/20 blur-3xl" />

      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="ml-3 text-xs text-slate-500">My applications</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="min-w-0">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-slate-300">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                {col.title}
                <span className="ml-auto text-slate-500">{col.cards.length}</span>
              </div>

              <div className="space-y-2">
                {col.cards.map((card) => {
                  const delay = order++ * 110;
                  const isOffer = col.title === "Offer";
                  return (
                    <div
                      key={card.company}
                      style={{ animationDelay: `${delay}ms` }}
                      className={`login-card-in rounded-lg border p-3 ${
                        isOffer
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-slate-800 bg-slate-950"
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {card.company}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {card.role}
                      </p>
                      <p
                        className={`mt-2 text-[11px] ${
                          isOffer ? "text-emerald-300" : "text-slate-500"
                        }`}
                      >
                        {card.tag}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to login. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[1.1fr_1fr]">
      <style>{`
        @keyframes login-card-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-card-in { opacity: 0; animation: login-card-in 520ms ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .login-card-in { opacity: 1; animation: none; }
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
              Every application, one clear pipeline.
            </h1>
            <p className="mt-4 text-slate-400">
              Log where you applied, track each interview, and see what needs
              a reply today.
            </p>
          </div>

          <PipelinePreview />
        </div>

        <p className="relative text-sm text-slate-500">
          Built for people with more than one tab of job posts open.
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
                Sign in to manage your applications.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
          >
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">
              Pick up where you left off.
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-11 pr-12 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="••••••••"
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
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {submitting ? "Signing in..." : "Sign in"}
            </button>

            <p className="mt-6 text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;