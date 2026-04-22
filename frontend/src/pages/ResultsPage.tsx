import { useState } from "react";
import type { AnalyzeResponse, Biomarker } from "../types/index.ts";
import PatientHeader from "../components/PatientHeader.tsx";
import BiomarkerTable from "../components/BiomarkerTable.tsx";

interface ResultsPageProps {
  result: AnalyzeResponse;
  onReset: () => void;
  onUploadAnother?: () => void;
}

export default function ResultsPage({ result, onReset, onUploadAnother }: ResultsPageProps) {
  const { patient, biomarkers } = result;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "optimal" | "normal" | "out_of_range">("all");

  const optimalCount = biomarkers.filter((b) => b.status === "optimal").length;
  const outOfRangeCount = biomarkers.filter((b) => b.status === "out_of_range").length;

  // Filter biomarkers
  const filtered = biomarkers.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group filtered results by category
  const grouped = filtered.reduce<Record<string, Biomarker[]>>((acc, bm) => {
    const cat = bm.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(bm);
    return acc;
  }, {});

  // Sort categories: out-of-range first
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const aHasFlag = grouped[a].some((bm) => bm.status === "out_of_range");
    const bHasFlag = grouped[b].some((bm) => bm.status === "out_of_range");
    if (aHasFlag && !bHasFlag) return -1;
    if (!aHasFlag && bHasFlag) return 1;
    return a.localeCompare(b);
  });

  const downloadCSV = () => {
    const rows = [
      ["Biomarker", "Original Name", "Value", "Unit", "Reference Range", "Status"],
      ...biomarkers.map((b) => [
        b.name,
        b.original_name,
        String(b.value),
        b.unit,
        b.reference_text,
        b.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biomarker-report-${patient.date_of_birth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Lab Report Analysis</h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={downloadCSV}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Download CSV
            </button>
            {onUploadAnother && (
              <button
                onClick={onUploadAnother}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Compare Another
              </button>
            )}
            <button
              onClick={onReset}
              className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Upload New
            </button>
          </div>
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

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search biomarker by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "optimal", "normal", "out_of_range"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {status === "all" ? "All" : status === "out_of_range" ? "Out of Range" : status}
              </button>
            ))}
          </div>
        </div>

        {/* Biomarker tables grouped by category */}
        {sortedCategories.length > 0 ? (
          sortedCategories.map((cat) => (
            <BiomarkerTable key={cat} category={cat} biomarkers={grouped[cat]} />
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <p className="text-gray-500 text-sm">No biomarkers match your search.</p>
          </div>
        )}
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
