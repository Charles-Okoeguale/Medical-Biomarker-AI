import type { Biomarker } from "../types/index.ts";
import StatusBadge from "./StatusBadge.tsx";

interface BiomarkerTableProps {
  category: string;
  biomarkers: Biomarker[];
}

export default function BiomarkerTable({ category, biomarkers }: BiomarkerTableProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {category}
      </h3>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 w-1/3">Biomarker</th>
              <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Value</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Unit</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Reference Range</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {biomarkers.map((bm) => (
              <BiomarkerRow key={bm.name + bm.original_name} bm={bm} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card stack */}
      <div className="sm:hidden space-y-2">
        {biomarkers.map((bm) => (
          <BiomarkerCard key={bm.name + bm.original_name} bm={bm} />
        ))}
      </div>
    </div>
  );
}

function BiomarkerRow({ bm }: { bm: Biomarker }) {
  const rowBg =
    bm.status === "out_of_range"
      ? "bg-red-50"
      : bm.status === "optimal"
      ? "bg-green-50/40"
      : "";

  return (
    <tr className={rowBg}>
      <td className="px-4 py-2.5 font-medium text-gray-800">
        {bm.name}
        {bm.original_name && bm.original_name !== bm.name && (
          <span className="block text-xs text-gray-400 font-normal">{bm.original_name}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-gray-800">
        {String(bm.value)}
      </td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">{bm.unit}</td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">{bm.reference_text}</td>
      <td className="px-4 py-2.5 text-center">
        <StatusBadge status={bm.status} />
      </td>
    </tr>
  );
}

function BiomarkerCard({ bm }: { bm: Biomarker }) {
  const borderColor =
    bm.status === "out_of_range"
      ? "border-red-200 bg-red-50"
      : bm.status === "optimal"
      ? "border-green-200 bg-green-50/40"
      : "border-gray-200 bg-white";

  return (
    <div className={`rounded-lg border p-3 text-xs ${borderColor}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <p className="font-medium text-gray-800 text-sm">{bm.name}</p>
          {bm.original_name && bm.original_name !== bm.name && (
            <p className="text-gray-400">{bm.original_name}</p>
          )}
        </div>
        <StatusBadge status={bm.status} />
      </div>
      <div className="flex gap-4 text-gray-600 mt-1">
        <span>
          <span className="text-gray-400">Value: </span>
          <span className="font-mono font-semibold">{String(bm.value)} {bm.unit}</span>
        </span>
        <span>
          <span className="text-gray-400">Ref: </span>
          {bm.reference_text}
        </span>
      </div>
    </div>
  );
}
