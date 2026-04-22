import { useState } from "react";
import type { AnalyzeResponse } from "./types/index.ts";
import UploadPage from "./pages/UploadPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";
import ComparisonPage from "./pages/ComparisonPage.tsx";

type AppState = "upload" | "results" | "upload-second" | "comparison";

export default function App() {
  const [results, setResults] = useState<AnalyzeResponse[]>([]);
  const [appState, setAppState] = useState<AppState>("upload");

  const handleFirstResult = (newResult: AnalyzeResponse) => {
    setResults([newResult]);
    setAppState("results");
  };

  const handleSecondResult = (newResult: AnalyzeResponse) => {
    setResults((prev) => [...prev, newResult]);
    setAppState("comparison");
  };

  const handleReset = () => {
    setResults([]);
    setAppState("upload");
  };

  const handleCompareAnother = () => {
    setAppState("upload-second");
  };

  if (appState === "comparison" && results.length >= 2) {
    return <ComparisonPage results={results} onReset={handleReset} />;
  }

  if (appState === "upload-second") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Banner reminding user this is report 2 */}
        <div className="bg-blue-600 text-white text-sm text-center py-2 px-4">
          Upload your second report to compare against{" "}
          <strong>Report 1 ({results[0]?.patient.date_of_birth})</strong>
          <button
            onClick={() => setAppState("results")}
            className="ml-4 underline text-blue-200 hover:text-white"
          >
            Cancel
          </button>
        </div>
        <UploadPage onResult={handleSecondResult} />
      </div>
    );
  }

  if (appState === "results" && results.length === 1) {
    return (
      <ResultsPage
        result={results[0]}
        onReset={handleReset}
        onUploadAnother={handleCompareAnother}
      />
    );
  }

  return <UploadPage onResult={handleFirstResult} />;
}
