import type { AnalyzeResponse, Biomarker } from "../types/index.ts";
import PatientHeader from "../components/PatientHeader.tsx";
import BiomarkerTable from "../components/BiomarkerTable.tsx";

interface ResultsPageProps {
  result: AnalyzeResponse;
  onReset: () => void;
}

export default function ResultsPage({ result, onReset }: ResultsPageProps) {
  const { patient, biomarkers } = result;

  const optimalCount = biomarkers.filter((b) => b.status === "optimal").length;
  const outOfRangeCount = biomarkers.filter((b) => b.status === "out_of_range").length;

  // Group by category
  const grouped = biomarkers.reduce<Record<string, Biomarker[]>>((acc, bm) => {
    const cat = bm.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(bm);
    return acc;
  }, {});

  // Sort categories: out-of-range categories first
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aHasFlag = grouped[a].some((bm) => bm.status === "out_of_range");
    const bHasFlag = grouped[b].some((bm) => bm.status === "out_of_range");
    if (aHasFlag && !bHasFlag) return -1;
    if (!aHasFlag && bHasFlag) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Lab Report Analysis</h1>
          <button
            onClick={onReset}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Upload new report
          </button>
        </div>

        <PatientHeader
          patient={patient}
          biomarkerCount={biomarkers.length}
          optimalCount={optimalCount}
          outOfRangeCount={outOfRangeCount}
        />

        {/* Legend */}
        <div className="flex gap-4 text-xs mb-5 flex-wrap">
          <LegendItem color="bg-green-100 border-green-200" label="Optimal — within evidence-based ideal range" />
          <LegendItem color="bg-yellow-100 border-yellow-200" label="Normal — within lab reference range" />
          <LegendItem color="bg-red-100 border-red-200" label="Out of Range — outside lab reference range" />
        </div>

        {/* Biomarker tables grouped by category */}
        {sortedCategories.map((cat) => (
          <BiomarkerTable key={cat} category={cat} biomarkers={grouped[cat]} />
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block w-3 h-3 rounded border ${color}`} />
      <span className="text-gray-500">{label}</span>
    </div>
  );
}
