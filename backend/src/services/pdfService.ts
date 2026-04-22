import { createRequire } from "module";

const require = createRequire(import.meta.url);
// pdf-parse is a CommonJS module
const pdfParse = require("pdf-parse");

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text as string;
}
