import { useState } from "react";
import type { AnalyzeResponse } from "./types/index.ts";
import UploadPage from "./pages/UploadPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";
import ComparisonPage from "./pages/ComparisonPage.tsx";

type AppState = "upload" | "results" | "upload-second" | "comparison";

const SESSION_RESULTS_KEY = "biomarker-results";
const SESSION_STATE_KEY = "biomarker-appstate";

export default function App() {
  const [results, setResults] = useState<AnalyzeResponse[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_RESULTS_KEY);
      return saved ? (JSON.parse(saved) as AnalyzeResponse[]) : [];
    } catch {
      return [];
    }
  });

  const [appState, setAppState] = useState<AppState>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STATE_KEY);
      return (saved as AppState) ?? "upload";
    } catch {
      return "upload";
    }
  });

  const saveToSession = (newResults: AnalyzeResponse[], newState: AppState) => {
    try {
      sessionStorage.setItem(SESSION_RESULTS_KEY, JSON.stringify(newResults));
      sessionStorage.setItem(SESSION_STATE_KEY, newState);
    } catch {
      // sessionStorage full or unavailable — fail silently
    }
  };

  const clearSession = () => {
    try {
      sessionStorage.removeItem(SESSION_RESULTS_KEY);
      sessionStorage.removeItem(SESSION_STATE_KEY);
    } catch {
      // fail silently
    }
  };

  const handleFirstResult = (newResult: AnalyzeResponse) => {
    const newResults = [newResult];
    setResults(newResults);
    setAppState("results");
    saveToSession(newResults, "results");
  };

  const handleSecondResult = (newResult: AnalyzeResponse) => {
    const newResults = [...results, newResult];
    setResults(newResults);
    setAppState("comparison");
    saveToSession(newResults, "comparison");
  };

  const handleReset = () => {
    setResults([]);
    setAppState("upload");
    clearSession();
  };

  const handleCompareAnother = () => {
    setAppState("upload-second");
    saveToSession(results, "upload-second");
  };

  if (appState === "comparison" && results.length >= 2) {
    return <ComparisonPage results={results} onReset={handleReset} />;
  }

  if (appState === "upload-second") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white text-sm text-center py-2 px-4">
          Upload your second report to compare against{" "}
          <strong>Report 1 ({results[0]?.patient.date_of_birth})</strong>
          <button
            onClick={() => {
              setAppState("results");
              saveToSession(results, "results");
            }}
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