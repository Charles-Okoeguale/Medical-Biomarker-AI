import { Router, Request, Response } from "express";
import multer from "multer";
import { extractBiomarkersFromPdf } from "../services/aiService.js";
import { extractTextFromPdf } from "../services/pdfService.js";
import { classifyAll } from "../services/classificationService.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted"));
    }
  },
});

router.post(
  "/analyze",
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No PDF file uploaded." });
        return;
      }

      const pdfBuffer = req.file.buffer;

      // Check that PDF has some extractable text (basic validity check)
      const rawText = await extractTextFromPdf(pdfBuffer).catch(() => "");
      const textLength = rawText?.trim().length ?? 0;

      console.log(`[analyze] PDF received (${pdfBuffer.length} bytes, ${textLength} chars text) — sending to OpenAI`);

      // Send the raw PDF to OpenAI (it handles the file natively)
      const extraction = await extractBiomarkersFromPdf(pdfBuffer);

      const result = classifyAll(extraction);
      result.raw_text_length = textLength;

      console.log(`[analyze] Extracted ${result.biomarkers.length} biomarkers for ${result.patient.name || "patient"}`);

      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[analyze] error:", message);
      res.status(500).json({
        error: "Analysis failed. Please try again.",
        detail: message,
      });
    }
  }
);

export default router;
