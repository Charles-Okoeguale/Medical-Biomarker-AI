export interface PatientInfo {
  name: string;
  sex: "male" | "female";
  date_of_birth: string; // ISO date string YYYY-MM-DD
  age: number;
  report_date: string;
}

export interface Biomarker {
  name: string;           // English standardized name
  original_name: string;  // As it appeared in the PDF
  value: number | string; // string for results like "<0.2"
  unit: string;           // Standardized SI/English unit
  reference_low: number | null;
  reference_high: number | null;
  reference_text: string; // Raw reference string e.g. "< 5.7" or "3.6 - 7.7"
  status: "optimal" | "normal" | "out_of_range";
  category: string;       // e.g. "Complete Blood Count", "Lipid Panel"
}

export interface AnalyzeResponse {
  patient: PatientInfo;
  biomarkers: Biomarker[];
  raw_text_length: number;
}

export interface AIExtractedBiomarker {
  name: string;
  original_name: string;
  value: number | string;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  reference_text: string;
  category: string;
}

export interface AIExtractionResult {
  patient: PatientInfo;
  biomarkers: AIExtractedBiomarker[];
}
