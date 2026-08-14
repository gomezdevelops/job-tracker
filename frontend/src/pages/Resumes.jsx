import { useEffect, useRef, useState } from "react";
import api from "../api/client";

function Resumes() {
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      await api.post("/resumes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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
      event.target.value = "";
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) {
      return;
    }

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
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Resumes
          </h1>

          <p className="mt-2 text-slate-400">
            Upload and manage your resumes for job matching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? "Uploading..."
            : "+ Upload Resume"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </section>

      {error && (
        <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-xl border border-green-900 bg-green-950/40 px-5 py-4 text-sm text-green-300">
          {success}
        </div>
      )}

      <section className="mt-8">
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading resumes...
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <h2 className="text-lg font-semibold">
              No resumes yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Upload a PDF resume to start matching it
              against your applications.
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium hover:bg-blue-500"
            >
              Upload Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    {resume.filename}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Uploaded{" "}
                    {formatDate(resume.created_at)}
                  </p>

                  <p className="mt-2 text-xs text-green-400">
                    Resume text extracted
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(resume.id)
                  }
                  className="rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Resumes;