import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/client";

/* =========================================================
   Styles
   ========================================================= */

const animationStyles = `
@keyframes rs-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rs-float {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50%      { transform: translate3d(36px, -26px, 0) scale(1.08); }
}
@keyframes rs-bob {
  0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
  50%      { transform: translateY(-10px) rotate(var(--r, 0deg)); }
}
@keyframes rs-spin {
  to { transform: rotate(360deg); }
}
@keyframes rs-shimmer {
  100% { transform: translateX(100%); }
}
@keyframes rs-pop {
  from { opacity: 0; transform: translateY(12px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes rs-gradient {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes rs-lift {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

.rs-fade-up { animation: rs-fade-up 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.rs-float { animation: rs-float 16s ease-in-out infinite; }
.rs-bob { animation: rs-bob 7s ease-in-out infinite; }
.rs-spin { animation: rs-spin 6s linear infinite; }
.rs-pop { animation: rs-pop 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1) both; }
.rs-lift { animation: rs-lift 2.6s ease-in-out infinite; }
.rs-gradient-text {
  background-image: linear-gradient(90deg, #ffffff, #a5b4fc, #67e8f9, #ffffff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: rs-gradient 8s linear infinite;
}
.rs-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
  animation: rs-shimmer 1.5s infinite;
}

@media (prefers-reduced-motion: reduce) {
  .rs-fade-up, .rs-float, .rs-bob, .rs-spin, .rs-pop, .rs-lift, .rs-gradient-text, .rs-shimmer::after {
    animation: none !important;
  }
}
`;

/* =========================================================
   Page
   ========================================================= */

function Resumes() {
  const fileInputRef = useRef(null);
  const dragDepth = useRef(0);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState({});
  const [confirmResume, setConfirmResume] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  /* ---------- Data loading ---------- */

  async function loadResumes() {
    try {
      setError("");

      const response = await api.get("/resumes");

      setResumes(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to load resumes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResumes();
  }, []);

  // Success messages fade away on their own.
  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timeout = setTimeout(() => setSuccess(""), 5000);

    return () => clearTimeout(timeout);
  }, [success]);

  /* ---------- Helpers ---------- */

  function setBusy(key, value) {
    setPending((current) => ({ ...current, [key]: value }));
  }

  function openFilePicker() {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  }

  /* ---------- Upload ---------- */

  async function uploadFile(file) {
    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    const isPdf =
      file.type === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files are supported.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadName(file.name);

    try {
      const formData = new FormData();

      formData.append("file", file);

      await api.post("/resumes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(
              Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
            );
          }
        },
      });

      setSuccess("Resume uploaded successfully.");

      await loadResumes();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to upload resume."
      );
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadName("");
    }
  }

  function handleUpload(event) {
    const input = event.target;
    const file = input.files?.[0];

    uploadFile(file).finally(() => {
      input.value = "";
    });
  }

  /* ---------- Drag and drop ---------- */

  function handleDragEnter(event) {
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDragLeave(event) {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);

    if (dragDepth.current === 0) {
      setDragging(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    if (uploading) {
      return;
    }

    uploadFile(event.dataTransfer?.files?.[0]);
  }

  /* ---------- Resume actions ---------- */

  async function handleSetDefault(resumeId) {
    setBusy(`default:${resumeId}`, true);

    try {
      setError("");
      setSuccess("");

      await api.patch(`/resumes/${resumeId}/default`);

      setSuccess("Default resume updated successfully.");

      await loadResumes();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to set default resume."
      );
    } finally {
      setBusy(`default:${resumeId}`, false);
    }
  }

  async function handleViewResume(resumeId) {
    // Open the tab right away so the browser doesn't treat it as a blocked popup.
    const viewer = window.open("", "_blank");

    setBusy(`view:${resumeId}`, true);

    try {
      setError("");

      const response = await api.get(`/resumes/${resumeId}/file`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data);

      if (viewer) {
        viewer.location.href = blobUrl;
      } else {
        window.open(blobUrl, "_blank");
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
    } catch (error) {
      console.error(error);

      viewer?.close();

      setError(
        error.response?.data?.detail ||
          "Unable to open resume."
      );
    } finally {
      setBusy(`view:${resumeId}`, false);
    }
  }

  async function handleDownloadResume(resume) {
    setBusy(`download:${resume.id}`, true);

    try {
      setError("");

      const response = await api.get(`/resumes/${resume.id}/file`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(response.data);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = resume.filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to download resume."
      );
    } finally {
      setBusy(`download:${resume.id}`, false);
    }
  }

  async function confirmDelete() {
    if (!confirmResume) {
      return;
    }

    const id = confirmResume.id;

    setConfirmBusy(true);

    try {
      setError("");

      await api.delete(`/resumes/${id}`);

      setResumes((current) =>
        current.filter((resume) => resume.id !== id)
      );

      setSuccess("Resume deleted successfully.");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.detail ||
          "Unable to delete resume."
      );
    } finally {
      setConfirmBusy(false);
      setConfirmResume(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "recently";
    }

    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatFileSize(bytes) {
    if (!bytes) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /* ---------- Derived ---------- */

  const defaultResume = resumes.find((resume) => resume.is_default);

  const totalMatches = resumes.reduce(
    (total, resume) => total + (resume.match_count ?? 0),
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
        <div className="rs-float absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div
          className="rs-float absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="rs-float absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-3xl"
          style={{ animationDelay: "-10s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070910_85%)]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Hero */}
        <section className="rs-fade-up flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-indigo-300">Library</p>

            <h1 className="rs-gradient-text mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Resumes
            </h1>

            <p className="mt-3 text-slate-400">
              Upload and manage your resumes for job matching.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <HeroPill
                label="Resumes"
                value={resumes.length}
                dot="bg-indigo-400"
              />

              <HeroPill
                label="Applications matched"
                value={totalMatches}
                dot="bg-cyan-400"
              />

              {defaultResume && (
                <div className="flex max-w-full items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm backdrop-blur">
                  <Icon name="star" className="h-4 w-4 shrink-0 text-emerald-300" />

                  <span className="truncate text-emerald-200">
                    {defaultResume.filename}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-indigo-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                name={uploading ? "spinner" : "upload"}
                className={`h-4 w-4 ${uploading ? "animate-spin" : "transition group-hover:-translate-y-0.5"}`}
              />
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>

          <PaperStack />
        </section>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleUpload}
          className="hidden"
        />

        {/* Notices */}
        {error && (
          <Notice tone="error" message={error} onClose={() => setError("")} />
        )}

        {success && (
          <Notice
            tone="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        )}

        {/* Drop zone */}
        <section
          className="rs-fade-up mt-10"
          style={{ animationDelay: "100ms" }}
        >
          <DropZone
            dragging={dragging}
            uploading={uploading}
            progress={progress}
            uploadName={uploadName}
            compact={resumes.length > 0}
            onBrowse={openFilePicker}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </section>

        {/* Library */}
        <section className="mt-10">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
              <Shimmer className="h-64" />
              <Shimmer className="h-64" />
            </div>
          ) : resumes.length === 0 ? (
            <div className="rs-fade-up rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
                <Icon name="file" className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-lg font-semibold">No resumes yet</h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Upload a PDF resume to start matching it against your
                applications.
              </p>

              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Your First Resume
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {resumes.map((resume, index) => (
                <div
                  key={resume.id}
                  className="rs-fade-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                >
                  <TiltCard>
                    <ResumeCard
                      resume={resume}
                      uploadedLabel={formatDate(
                        resume.uploaded_at || resume.created_at
                      )}
                      sizeLabel={formatFileSize(resume.file_size)}
                      pending={pending}
                      onView={handleViewResume}
                      onDownload={handleDownloadResume}
                      onSetDefault={handleSetDefault}
                      onDelete={() => setConfirmResume(resume)}
                    />
                  </TiltCard>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ConfirmDialog
        resume={confirmResume}
        busy={confirmBusy}
        onCancel={() => setConfirmResume(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/* =========================================================
   Resume card
   ========================================================= */

function ResumeCard({
  resume,
  uploadedLabel,
  sizeLabel,
  pending,
  onView,
  onDownload,
  onSetDefault,
  onDelete,
}) {
  const matchCount = resume.match_count ?? 0;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white/[0.03] backdrop-blur-xl transition-colors duration-300 sm:flex-row ${
        resume.is_default
          ? "border-emerald-400/40 shadow-lg shadow-emerald-500/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {resume.is_default && (
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
      )}

      {/* Paper preview */}
      <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 px-8 py-8 sm:w-44 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative w-28 -rotate-3 transition duration-500 group-hover:rotate-0 group-hover:scale-105">
          <PaperPreview
            seed={`${resume.id}-${resume.filename}`}
            accent={resume.is_default ? "bg-emerald-400" : "bg-indigo-400"}
          />
        </div>

        {resume.is_default && (
          <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40">
            <Icon name="star" className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Details */}
      <div className="relative flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-semibold" title={resume.filename}>
            {resume.filename}
          </h2>

          {resume.is_default && (
            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 ring-1 ring-green-400/20">
              Default
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Uploaded {uploadedLabel}
          {" · "}
          {sizeLabel}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-green-400 ring-1 ring-green-400/20">
            <Icon name="check" className="h-3 w-3" />
            Resume text extracted
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-slate-400 ring-1 ring-white/10">
            <Icon name="target" className="h-3 w-3" />
            {matchCount}{" "}
            {matchCount === 1
              ? "application matched"
              : "applications matched"}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <ActionButton
            icon="eye"
            label="View PDF"
            loading={pending[`view:${resume.id}`]}
            onClick={() => onView(resume.id)}
          />

          <ActionButton
            icon="download"
            label="Download"
            loading={pending[`download:${resume.id}`]}
            onClick={() => onDownload(resume)}
          />

          {resume.is_default ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 ring-1 ring-green-400/20">
              <Icon name="star" className="h-4 w-4" />
              Default Resume
            </span>
          ) : (
            <ActionButton
              icon="star"
              label="Set as Default"
              loading={pending[`default:${resume.id}`]}
              onClick={() => onSetDefault(resume.id)}
            />
          )}

          <button
            type="button"
            onClick={onDelete}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 active:scale-95"
          >
            <Icon name="trash" className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function ActionButton({ icon, label, onClick, loading = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon
        name={loading ? "spinner" : icon}
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
      />
      {label}
    </button>
  );
}

/* =========================================================
   Drop zone
   ========================================================= */

function DropZone({
  dragging,
  uploading,
  progress,
  uploadName,
  compact,
  onBrowse,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const active = dragging || uploading;

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onBrowse();
    }
  }

  return (
    <div
      role="button"
      tabIndex={uploading ? -1 : 0}
      aria-label="Upload a PDF resume. Drag and drop a file here or press Enter to browse."
      aria-busy={uploading}
      onClick={onBrowse}
      onKeyDown={handleKeyDown}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative block overflow-hidden rounded-3xl p-[2px] outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-indigo-400/60 ${
        uploading ? "cursor-progress" : "cursor-pointer"
      } ${dragging ? "scale-[1.01]" : ""}`}
    >
      {/* Rotating gradient border */}
      <span
        aria-hidden="true"
        className={`rs-spin pointer-events-none absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_55%,#818cf8_70%,#22d3ee_85%,transparent_100%)] transition-opacity duration-500 ${
          active ? "opacity-100" : "opacity-40 group-hover:opacity-80"
        }`}
      />

      <div
        className={`relative rounded-[22px] backdrop-blur-xl transition-colors duration-300 ${
          dragging ? "bg-[#10142a]" : "bg-[#0a0c14]"
        } ${compact ? "px-6 py-6" : "px-6 py-14"}`}
      >
        <div
          className={`flex items-center gap-5 text-left ${
            compact ? "flex-row" : "flex-col text-center"
          }`}
        >
          <div
            className={`relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-200 ring-1 ring-inset ring-white/10 ${
              compact ? "h-14 w-14" : "h-20 w-20"
            } ${active ? "" : "rs-lift"}`}
          >
            <Icon
              name={uploading ? "spinner" : "upload"}
              className={`${compact ? "h-6 w-6" : "h-9 w-9"} ${
                uploading ? "animate-spin" : ""
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            {uploading ? (
              <>
                <p className="truncate font-medium text-white">
                  Uploading {uploadName}
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width] duration-300 ease-out"
                    style={{ width: `${Math.max(progress, 6)}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {progress < 100
                    ? `${progress}% uploaded`
                    : "Extracting resume text..."}
                </p>
              </>
            ) : dragging ? (
              <p className="text-lg font-semibold text-indigo-200">
                Drop your PDF to upload
              </p>
            ) : (
              <>
                <p
                  className={`font-semibold text-white ${
                    compact ? "text-base" : "text-xl"
                  }`}
                >
                  Drag and drop a PDF resume here
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  or{" "}
                  <span className="font-medium text-indigo-300 underline-offset-4 group-hover:underline">
                    browse your files
                  </span>
                  . PDF only.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Paper illustrations
   ========================================================= */

function PaperPreview({ seed = "resume", accent = "bg-indigo-400" }) {
  const sections = useMemo(() => {
    const random = seededRandom(seed);

    return [0, 1, 2].map(() => ({
      lines: Array.from(
        { length: 2 + Math.floor(random() * 3) },
        () => 55 + Math.round(random() * 45)
      ),
      heading: 30 + Math.round(random() * 25),
    }));
  }, [seed]);

  return (
    <div
      className="relative aspect-[3/4] w-full"
      style={{ filter: "drop-shadow(0 14px 22px rgba(0, 0, 0, 0.5))" }}
    >
      <div
        className="absolute inset-0 overflow-hidden bg-gradient-to-br from-white to-slate-200 p-3"
        style={{
          clipPath:
            "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className={`h-5 w-5 shrink-0 rounded-full ${accent}`} />

          <div className="flex-1 space-y-1">
            <span className="block h-1 w-4/5 rounded-full bg-slate-700/70" />
            <span className="block h-[3px] w-1/2 rounded-full bg-slate-400/70" />
          </div>
        </div>

        {/* Sections */}
        <div className="mt-3 space-y-2.5">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <span
                className={`mb-1 block h-[3px] rounded-full ${accent} opacity-80`}
                style={{ width: `${section.heading}%` }}
              />

              <div className="space-y-[3px]">
                {section.lines.map((width, lineIndex) => (
                  <span
                    key={lineIndex}
                    className="block h-[3px] rounded-full bg-slate-400/60"
                    style={{ width: `${width}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Folded corner */}
      <span
        className="absolute right-0 top-0 h-4 w-4 bg-gradient-to-bl from-slate-400 to-slate-200"
        style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }}
      />
    </div>
  );
}

function PaperStack() {
  const sheets = [
    { seed: "stack-a", rotate: "-9deg", x: "0%", delay: "0s", accent: "bg-fuchsia-400" },
    { seed: "stack-b", rotate: "6deg", x: "34%", delay: "-2s", accent: "bg-cyan-400" },
    { seed: "stack-c", rotate: "-2deg", x: "17%", delay: "-4s", accent: "bg-indigo-400", front: true },
  ];

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto hidden h-64 w-80 shrink-0 lg:block"
    >
      <div className="absolute inset-6 rounded-full bg-indigo-600/20 blur-3xl" />

      {sheets.map((sheet) => (
        <div
          key={sheet.seed}
          className="rs-bob absolute top-4 w-36"
          style={{
            left: sheet.x,
            "--r": sheet.rotate,
            animationDelay: sheet.delay,
            zIndex: sheet.front ? 2 : 1,
          }}
        >
          <PaperPreview seed={sheet.seed} accent={sheet.accent} />
        </div>
      ))}
    </div>
  );
}

function seededRandom(seed) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return function random() {
    hash += 0x6d2b79f5;

    let t = hash;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* =========================================================
   UI components
   ========================================================= */

function TiltCard({ children }) {
  const ref = useRef(null);

  function handleMove(event) {
    const element = ref.current;

    if (
      !element ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      return;
    }

    const rect = element.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    element.style.transform = `perspective(1000px) rotateX(${(-y * 5).toFixed(
      2
    )}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
  }

  function handleLeave() {
    if (ref.current) {
      ref.current.style.transform = "";
    }
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="h-full transition-transform duration-200 ease-out will-change-transform"
    >
      {children}
    </div>
  );
}

function HeroPill({ label, value, dot }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${dot}`} />

      <span className="text-slate-400">{label}</span>

      <span className="font-semibold text-white">
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

function AnimatedNumber({ value, duration = 900 }) {
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

  return <>{Math.round(display)}</>;
}

function Notice({ tone, message, onClose }) {
  const isError = tone === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`rs-pop mt-6 flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm backdrop-blur-xl ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-green-500/30 bg-green-500/10 text-green-200"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          isError ? "bg-red-500/30" : "bg-green-500/30"
        }`}
      >
        <Icon name={isError ? "alert" : "check"} className="h-3 w-3" />
      </span>

      <p className="flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
        className="opacity-60 transition hover:opacity-100"
      >
        <Icon name="x" className="h-4 w-4" />
      </button>
    </div>
  );
}

function Shimmer({ className = "" }) {
  return (
    <div
      className={`rs-shimmer relative overflow-hidden rounded-3xl bg-white/5 ${className}`}
    />
  );
}

function ConfirmDialog({ resume, busy, onCancel, onConfirm }) {
  useEffect(() => {
    if (!resume) {
      return undefined;
    }

    function handleKey(event) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [resume, busy, onCancel]);

  if (!resume) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-resume-title"
    >
      <div
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="rs-pop relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1020] p-6 shadow-2xl shadow-black/60">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
          <Icon name="trash" className="h-6 w-6" />
        </div>

        <h3
          id="delete-resume-title"
          className="mt-4 text-lg font-semibold text-white"
        >
          Delete this resume?
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-200">{resume.filename}</span>
          ? This can't be undone.
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
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    download: "M12 4v12M7 11l5 5 5-5M4 20h16",
    file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
    trash:
      "M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3",
    check: "M5 13l4 4L19 7",
    x: "M6 6l12 12M18 6L6 18",
    target:
      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
    spinner: "M12 3a9 9 0 1 0 9 9",
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

export default Resumes;