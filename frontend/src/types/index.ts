export interface PatientInfo {
  name: string;
  sex: "male" | "female";
  date_of_birth: string;
  age: number;
  report_date: string;
}

export interface Biomarker {
  name: string;
  original_name: string;
  value: number | string;
  unit: string;
  reference_low: number | null;
  reference_high: number | null;
  reference_text: string;
  status: "optimal" | "normal" | "out_of_range";
  category: string;
}

export interface AnalyzeResponse {
  patient: PatientInfo;
  biomarkers: Biomarker[];
  raw_text_length: number;
}
