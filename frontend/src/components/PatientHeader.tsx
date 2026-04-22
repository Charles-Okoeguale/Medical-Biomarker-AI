import type { PatientInfo } from "../types/index.ts";

interface PatientHeaderProps {
  patient: PatientInfo;
  biomarkerCount: number;
  optimalCount: number;
  outOfRangeCount: number;
}

export default function PatientHeader({
  patient,
  biomarkerCount,
  optimalCount,
  outOfRangeCount,
}: PatientHeaderProps) {
  const formattedDob = patient.date_of_birth
    ? new Date(patient.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const formattedReport = patient.report_date
    ? new Date(patient.report_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {patient.name || "Patient"}
          </h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="capitalize">{patient.sex}</span>
            <span>DOB: {formattedDob}</span>
            <span>Age: {patient.age}</span>
            <span>Report: {formattedReport}</span>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Stat label="Total" value={biomarkerCount} color="text-gray-700" />
          <Stat label="Optimal" value={optimalCount} color="text-green-700" />
          <Stat
            label="Out of Range"
            value={outOfRangeCount}
            color="text-red-700"
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center min-w-[60px] bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
