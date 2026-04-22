import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze.js";

const app = express();
const PORT = process.env.PORT ?? 3008;

// In Docker the request arrives from nginx (same host), so allow all origins
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", port: PORT });
});

app.use("/api", analyzeRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
