import { useState, useCallback, DragEvent, ChangeEvent } from "react";
import type { AnalyzeResponse } from "../types/index.ts";

interface UploadPageProps {
  onResult: (result: AnalyzeResponse) => void;
}

export default function UploadPage({ onResult }: UploadPageProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const submitFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);

      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }

      setLoading(true);
      try {
        const form = new FormData();
        form.append("pdf", file);

        const res = await fetch("/api/analyze", {
          method: "POST",
          body: form,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Analysis failed. Please try again.");
          return;
        }

        onResult(data as AnalyzeResponse);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        setError(`Connection error: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    },
    [onResult]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) submitFile(file);
    },
    [submitFile]
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) submitFile(file);
    },
    [submitFile]
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Biomarker Analyzer
        </h1>
        <p className="text-sm text-center text-gray-500 mb-8">
          Upload a lab report PDF to extract, standardize, and classify your biomarkers.
        </p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"}
          `}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading}
          />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm text-gray-600">Analyzing your report with AI…</p>
              {fileName && <p className="text-xs text-gray-400">{fileName}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop your PDF here
              </p>
              <p className="text-xs text-gray-400">or click to browse — max 10 MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
