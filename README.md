# Biomarker Analyzer

A web app that uploads a lab report PDF, extracts all biomarkers using AI, standardizes names and units into English, and classifies each result as **optimal**, **normal**, or **out of range** based on the patient's age and sex.

---

## Architecture

**Frontend:** React + TypeScript + Tailwind CSS (Vite)  
**Backend:** Node.js + TypeScript + Express  
**AI:** OpenAI GPT-4o (reads PDF, extracts biomarkers, translates Spanish → English, normalizes units)  
**No database:** PDFs are processed in memory and discarded — nothing persists between requests.

---

## Setup & Run

### Prerequisites
- Docker & Docker Compose installed
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Steps

**1. Clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/biomarker-analyzer.git
cd biomarker-analyzer
```

**2. Create `.env` file**
```bash
cp backend/.env.example backend/.env
```

**3. Add your API key**
Open `backend/.env` and fill in:
```
OPENAI_API_KEY=sk-proj-your-key-here
PORT=3008
FRONTEND_URL=http://localhost:5173
```

**4. Run the app**
```bash
docker-compose up --build
```

Open [http://localhost:5173](http://localhost:5173) and upload `challenge.pdf`. Results appear in ~10 seconds.

**5. Stop the app**
```bash
docker-compose down
```

### Optional: Run locally (without Docker)

**Backend:**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3008
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## How It Works

1. **Upload PDF** — Drag-and-drop or file picker. Sent as `multipart/form-data`, max 10 MB.

2. **AI extracts biomarkers** — GPT-4o reads the PDF and returns structured JSON:
   - Extracts patient info (name, age, sex, report date)
   - Extracts every biomarker (name, value, unit, reference range)
   - Translates Spanish names to English
   - Normalizes units (e.g., `x10³/mm³` → `×10³/µL`)
   - Response enforced as valid JSON via OpenAI's `response_format`

3. **Classification** — Deterministic TypeScript code scores each biomarker:
   - **Out of range** — value is outside the lab's reference range
   - **Optimal** — value is within evidence-based ideal targets
   - **Normal** — value is within the lab range but not optimal

4. **Display results** — Table grouped by category, color-coded, mobile-responsive.

---

## Status Meanings

| Status | Meaning |
|---|---|
| 🟢 Optimal | Within evidence-based ideal target range |
| 🟡 Normal | Within lab reference range but not optimal |
| 🔴 Out of Range | Outside the lab's reference range |

---

## Cloud Deployment

If deploying to production:

- **Frontend:** AWS CloudFront + S3 (static Vite build served globally)
- **Backend:** AWS ECS Fargate (stateless container, auto-scaling)
- **API Key:** AWS Secrets Manager (never in environment variables)
- **Load Balancer:** AWS ALB (enforces 10 MB file size limit)
- **Logs:** CloudWatch (request logs, errors, latency)

No database or storage bucket needed — PDFs are processed in memory and never stored.

---

## Project Structure

```
biomarker-app/
├── challenge.pdf                          ← sample lab report for testing
├── docker-compose.yml                     ← run: docker-compose up
├── README.md
├── backend/
│   ├── .env.example                       ← copy to .env, add OPENAI_API_KEY
│   ├── src/
│   │   ├── services/
│   │   │   ├── pdfService.ts              ← extract text from PDF
│   │   │   ├── aiService.ts               ← call GPT-4o, parse JSON
│   │   │   └── classificationService.ts   ← score biomarkers
│   │   ├── routes/
│   │   │   └── analyze.ts                 ← POST /api/analyze
│   │   ├── types/index.ts                 ← shared TypeScript interfaces
│   │   └── index.ts                       ← Express entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── UploadPage.tsx             ← drag-and-drop PDF upload
    │   │   └── ResultsPage.tsx            ← results table grouped by category
    │   ├── components/
    │   │   ├── BiomarkerTable.tsx         ← desktop table + mobile cards
    │   │   ├── PatientHeader.tsx          ← patient info + summary stats
    │   │   └── StatusBadge.tsx            ← color-coded status pill
    │   ├── types/index.ts
    │   └── App.tsx
    └── package.json
```

---

## Why No Database?

The app is a pure transform pipeline: **PDF in → JSON out**.

- No user accounts to store
- No history to persist
- No saved results needed
- Each request is independent

PDFs are processed in memory and discarded immediately — privacy by design. A database would add complexity and operational overhead with zero benefit.