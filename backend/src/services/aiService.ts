import OpenAI from "openai";
import type { AIExtractionResult } from "../types/index.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a medical lab report parser. You will be given a lab report PDF (which may be in Spanish or another language). Your job is to:

1. Extract the patient's demographic information.
2. Extract EVERY measured biomarker on EVERY page with its value, unit, and reference range.
3. Standardize all biomarker names into clear English medical terminology.
4. Standardize all units into SI or standard English units.
5. Return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

RULES:
- Translate Spanish biomarker names to English. Examples: "Hemoglobina" → "Hemoglobin", "Hematíes" → "Red Blood Cells", "Leucocitos" → "White Blood Cells", "Plaquetas" → "Platelets", "Neutrófilos" → "Neutrophils", "Linfocitos" → "Lymphocytes", "Monocitos" → "Monocytes", "Eosinófilos" → "Eosinophils", "Basófilos" → "Basophils", "Volumen corpuscular medio (VCM)" → "Mean Corpuscular Volume", "Hemoglobina corpuscular media (HCM)" → "Mean Corpuscular Hemoglobin", "Conc. de hgb. corpuscular media (CHCM)" → "Mean Corpuscular Hemoglobin Concentration", "Indice de anisocitosis (RDW)" → "Red Cell Distribution Width", "Volumen plaquetario medio (VPM)" → "Mean Platelet Volume", "Glucosa" → "Glucose", "Colesterol total" → "Total Cholesterol", "Colesterol HDL" → "HDL Cholesterol", "Colesterol LDL" → "LDL Cholesterol", "Colesterol no HDL" → "Non-HDL Cholesterol", "Triglicéridos" → "Triglycerides", "Lipoproteina (a)" → "Lipoprotein (a)", "Apolipoproteína B" → "Apolipoprotein B", "Proteínas totales" → "Total Protein", "Albúmina" → "Albumin", "Proteína C Reactiva" → "C-Reactive Protein", "Urato" → "Uric Acid", "Creatinina" → "Creatinine", "Hemoglobina A1c" → "Hemoglobin A1c".
- Standardize units: "x10³/mm³" → "×10³/µL", "x10⁶/mm³" → "×10⁶/µL", "g/dL" stays "g/dL", "mg/dL" stays "mg/dL", "mmol/mol" stays "mmol/mol", "g/L" stays "g/L", "mg/L" stays "mg/L", "%" stays "%", "fL" stays "fL", "pg" stays "pg".
- Numbers in Spanish format use comma as decimal separator (e.g. "4,73" = 4.73, "0,82" = 0.82) — always convert to decimal point in JSON.
- For "< X" reference: reference_low = null, reference_high = X, reference_text = "< X".
- For "> X" reference: reference_low = X, reference_high = null, reference_text = "> X".
- For "X - Y" reference: reference_low = X, reference_high = Y, reference_text = "X - Y".
- If a value starts with "<" or ">" (e.g. "<0.2"), keep the value as a string but convert any comma decimal to period.
- Do NOT include blood type (Grupo sanguíneo) or Rh factor as biomarkers.
- Compute the patient's age in whole years from date of birth and report date.
- Determine sex: "male" for HOMBRE/MASCULINO/M, "female" for MUJER/FEMENINO/F.
- Parse date of birth from "F. Nac." field, format YYYY-MM-DD.
- Parse report date from "Fecha Informe" / "Fecha Validación" / the date shown near page numbers, format YYYY-MM-DD.
- Group biomarkers into these English categories: "Complete Blood Count", "Lipid Panel", "Metabolic Panel", "Kidney Function", "Liver Function", "Thyroid", "Vitamins & Minerals", "Hormones", "Inflammation", "Proteins", "Other".
- If patient name is redacted/blank in the report, use empty string "".

REQUIRED JSON SHAPE:
{
  "patient": {
    "name": string,
    "sex": "male" | "female",
    "date_of_birth": "YYYY-MM-DD",
    "age": number,
    "report_date": "YYYY-MM-DD"
  },
  "biomarkers": [
    {
      "name": string,
      "original_name": string,
      "value": number | string,
      "unit": string,
      "reference_low": number | null,
      "reference_high": number | null,
      "reference_text": string,
      "category": string
    }
  ]
}`;

function parseJsonFromResponse(text: string): AIExtractionResult {
  const jsonText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error(
      `OpenAI returned invalid JSON. Response was:\n${text.slice(0, 500)}`
    );
  }
}

export async function extractBiomarkersFromPdf(
  pdfBuffer: Buffer
): Promise<AIExtractionResult> {
  const base64Pdf = pdfBuffer.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "file",
            file: {
              filename: "report.pdf",
              file_data: dataUrl,
            },
          } as unknown as OpenAI.Chat.Completions.ChatCompletionContentPart,
          {
            type: "text",
            text: "Extract every biomarker and patient info from this lab report. Return ONLY the JSON.",
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return parseJsonFromResponse(content);
}
