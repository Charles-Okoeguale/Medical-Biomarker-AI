import type {
  AIExtractedBiomarker,
  AIExtractionResult,
  Biomarker,
  AnalyzeResponse,
} from "../types/index.js";

// Optimal ranges are tighter than lab "normal" ranges.
// These represent evidence-based optimal targets, not just disease thresholds.
// Keys are lowercase English biomarker names (partial match supported).
interface OptimalRange {
  low: number;
  high: number;
}

const OPTIMAL_RANGES: Record<string, OptimalRange> = {
  // Complete Blood Count
  "red blood cells (male)": { low: 4.5, high: 5.5 },
  "red blood cells (female)": { low: 4.0, high: 5.0 },
  hemoglobin: { low: 13.5, high: 16.0 },
  hematocrit: { low: 40, high: 48 },
  "mean corpuscular volume": { low: 80, high: 96 },
  "mean corpuscular hemoglobin": { low: 27, high: 33 },
  "mean corpuscular hemoglobin concentration": { low: 32, high: 36 },
  "red cell distribution width": { low: 11.5, high: 14.0 },
  "white blood cells": { low: 4.5, high: 9.0 },
  neutrophils: { low: 1.8, high: 7.0 },
  lymphocytes: { low: 1.2, high: 3.8 },
  monocytes: { low: 0.1, high: 0.8 },
  eosinophils: { low: 0.02, high: 0.45 },
  basophils: { low: 0, high: 0.15 },
  platelets: { low: 180, high: 350 },
  "mean platelet volume": { low: 7.5, high: 11.5 },

  // Lipid Panel
  "total cholesterol": { low: 150, high: 180 },
  "hdl cholesterol": { low: 55, high: 100 },
  "ldl cholesterol": { low: 50, high: 100 },
  "non-hdl cholesterol": { low: 0, high: 120 },
  triglycerides: { low: 40, high: 100 },
  "lipoprotein (a)": { low: 0, high: 20 },
  "apolipoprotein b": { low: 60, high: 90 },

  // Metabolic / Glucose
  glucose: { low: 75, high: 90 },
  "hemoglobin a1c": { low: 4.0, high: 5.3 },

  // Kidney
  creatinine: { low: 0.7, high: 1.1 },
  "uric acid": { low: 3.5, high: 6.0 },
  "estimated gfr": { low: 90, high: 999 },
  urea: { low: 10, high: 45 },

  // Proteins / Inflammation
  "total protein": { low: 65, high: 80 },
  albumin: { low: 40, high: 50 },
  "c-reactive protein": { low: 0, high: 1.0 },

  // Liver
  alt: { low: 5, high: 30 },
  ast: { low: 10, high: 30 },
  ggt: { low: 5, high: 25 },
  "alkaline phosphatase": { low: 40, high: 100 },
  bilirubin: { low: 0.2, high: 1.0 },

  // Thyroid
  tsh: { low: 1.0, high: 2.5 },
  "free t4": { low: 1.0, high: 1.5 },
  "free t3": { low: 3.0, high: 3.8 },

  // Vitamins & Minerals
  "vitamin d": { low: 40, high: 80 },
  "vitamin b12": { low: 400, high: 900 },
  ferritin: { low: 50, high: 150 },
  iron: { low: 70, high: 150 },
  magnesium: { low: 2.0, high: 2.5 },
  zinc: { low: 90, high: 120 },

  // Hormones
  testosterone: { low: 400, high: 700 },
  "free testosterone": { low: 9, high: 30 },
  cortisol: { low: 10, high: 20 },
  dhea: { low: 200, high: 400 },
  insulin: { low: 2, high: 6 },
};

function findOptimalRange(
  name: string,
  sex: "male" | "female"
): OptimalRange | null {
  const lower = name.toLowerCase();

  // Sex-specific RBC lookup
  if (lower.includes("red blood cell") || lower.includes("erythrocyte")) {
    const key = `red blood cells (${sex})`;
    return OPTIMAL_RANGES[key] ?? null;
  }

  // Direct match first
  if (OPTIMAL_RANGES[lower]) return OPTIMAL_RANGES[lower];

  // Partial match
  for (const [key, range] of Object.entries(OPTIMAL_RANGES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return range;
    }
  }
  return null;
}

function numericValue(val: number | string): number | null {
  if (typeof val === "number") return val;
  // Handle "<0.2" → treat as 0 for comparison purposes
  const stripped = val.replace(/[<>]/g, "").trim();
  const n = parseFloat(stripped);
  return isNaN(n) ? null : n;
}

function classifyBiomarker(
  biomarker: AIExtractedBiomarker,
  sex: "male" | "female"
): "optimal" | "normal" | "out_of_range" {
  const val = numericValue(biomarker.value);
  if (val === null) return "normal"; // can't classify non-numeric

  const refLow = biomarker.reference_low;
  const refHigh = biomarker.reference_high;

  // Check out_of_range first against lab reference range
  if (refLow !== null && val < refLow) return "out_of_range";
  if (refHigh !== null && val > refHigh) return "out_of_range";

  // Check optimal range
  const optimal = findOptimalRange(biomarker.name, sex);
  if (optimal) {
    if (val >= optimal.low && val <= optimal.high) return "optimal";
    return "normal"; // within lab range but outside optimal
  }

  // No optimal range defined — anything within lab range is "normal"
  return "normal";
}

export function classifyAll(extraction: AIExtractionResult): AnalyzeResponse {
  const { patient, biomarkers } = extraction;

  const classified: Biomarker[] = biomarkers.map((bm) => ({
    ...bm,
    status: classifyBiomarker(bm, patient.sex),
  }));

  return {
    patient,
    biomarkers: classified,
    raw_text_length: 0,
  };
}
