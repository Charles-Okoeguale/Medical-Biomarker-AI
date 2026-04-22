import type { AnalyzeResponse } from "../types/index.ts";

interface ComparisonResult {
  name: string;
  value1: number | string;
  value2: number | string;
  change: number;
  percentChange: string;
  unit: string;
  status1: string;
  status2: string;
}

interface ComparisonPageProps {
  results: AnalyzeResponse[];
  onReset: () => void;
}

export default function ComparisonPage({ results, onReset }: ComparisonPageProps) {
  const [report1, report2] = results;

  const getComparison = (name: string): ComparisonResult | null => {
    const bm1 = report1.biomarkers.find((b) => b.name === name);
    const bm2 = report2.biomarkers.find((b) => b.name === name);

    if (!bm1 || !bm2) return null;

    const val1 = typeof bm1.value === "number" ? bm1.value : parseFloat(String(bm1.value)) || 0;
    const val2 = typeof bm2.value === "number" ? bm2.value : parseFloat(String(bm2.value)) || 0;
    const change = val2 - val1;
    const percentChange = val1 !== 0 ? ((change / Math.abs(val1)) * 100).toFixed(1) : "N/A";

    return {
      name,
      value1: bm1.value,
      value2: bm2.value,
      change,
      percentChange,
      unit: bm2.unit,
      status1: bm1.status,
      status2: bm2.status,
    };
  };

  const allNames = new Set([
    ...report1.biomarkers.map((b) => b.name),
    ...report2.biomarkers.map((b) => b.name),
  ]);

  const comparisons: ComparisonResult[] = Array.from(allNames)
    .map((name) => getComparison(name))
    .filter((c): c is ComparisonResult => c !== null);

  const sorted = [...comparisons].sort((a, b) => {
    const getScore = (status: string) => (status === "optimal" ? 3 : status === "normal" ? 2 : 1);
    const scoreA = getScore(a.status2) - getScore(a.status1);
    const scoreB = getScore(b.status2) - getScore(b.status1);
    return scoreB - scoreA;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Biomarker Comparison</h1>
          <button
            onClick={onReset}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Start Over
          </button>
        </div>

        {/* Report dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Report 1</p>
            <p className="text-lg font-semibold text-gray-800">{formatDate(report1.patient.date_of_birth)}</p>
            <p className="text-xs text-gray-400">{report1.biomarkers.length} biomarkers</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Report 2</p>
            <p className="text-lg font-semibold text-gray-800">{formatDate(report2.patient.date_of_birth)}</p>
            <p className="text-xs text-gray-400">{report2.biomarkers.length} biomarkers</p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Biomarker</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Report 1</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Report 2</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-600">Change</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-600">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((comp) => {
                  const changeColor =
                    comp.percentChange === "N/A"
                      ? "text-gray-500"
                      : comp.change > 0
                      ? "text-orange-600"
                      : "text-green-600";
                  const trendEmoji =
                    comp.percentChange === "N/A" ? "—" : comp.change > 0 ? "📈" : "📉";

                  return (
                    <tr key={comp.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{comp.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {comp.value1}{" "}
                        <span className="text-xs text-gray-500">{comp.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {comp.value2}{" "}
                        <span className="text-xs text-gray-500">{comp.unit}</span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${changeColor}`}>
                        {comp.change > 0 ? "+" : ""}
                        {comp.change.toFixed(2)} ({comp.percentChange}%)
                      </td>
                      <td className="px-4 py-3 text-center text-lg">{trendEmoji}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Improved</p>
            <p className="text-2xl font-bold text-green-700">
              {sorted.filter((c) => c.change < 0 && c.percentChange !== "N/A").length}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-medium">Stable</p>
            <p className="text-2xl font-bold text-yellow-700">
              {sorted.filter((c) => Math.abs(c.change) < 0.01 || c.percentChange === "N/A").length}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Increased</p>
            <p className="text-2xl font-bold text-orange-700">
              {sorted.filter((c) => c.change > 0 && c.percentChange !== "N/A").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}