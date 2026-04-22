import { useState } from "react";
import type { AnalyzeResponse } from "./types/index.ts";
import UploadPage from "./pages/UploadPage.tsx";
import ResultsPage from "./pages/ResultsPage.tsx";

export default function App() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  if (result) {
    return <ResultsPage result={result} onReset={() => setResult(null)} />;
  }

  return <UploadPage onResult={setResult} />;
}
