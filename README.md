# UniMatch AI

An AI-powered college application assistant that helps students maximize their chances of admission to MIT by analyzing their academic profile, essay, and interview performance.

---

## What It Does

UniMatch AI evaluates a student's application across four dimensions and returns a **Profile Readiness Score** with a detailed breakdown and actionable improvement plan.

| Component | Weight | What's Evaluated |
|---|---|---|
| Hard Factors (GPA, SAT, IELTS) | 35 pts | Compared against MIT's actual Common Data Set |
| Extracurriculars | 20 pts | Tier-based scoring (national → regional → club → member) |
| Essay Analysis | 25 pts | Rubric across 5 criteria aligned to MIT's mission |
| Mock Interview | 20 pts | Communication, curiosity, authenticity, school fit |

**Total: 100 points → Profile Readiness Score**

---

## Features

### Profile Scoring
- Tier-based GPA scoring (3.9–4.0 = 15 pts, 3.7–3.89 = 10 pts, ...)
- SAT scoring (1550+ = 10 pts, 1510–1549 = 7 pts, ...)
- IELTS scoring (7.5+ = 10 pts, 7.0–7.4 = 7 pts, ...)
- Extracurricular tier system with bonus points for major relevance and 2+ year commitment

### Essay Analysis
Evaluated against MIT's official admissions rubric:
- Authentic voice
- Depth & specificity
- Alignment with MIT's mission
- Structure & flow
- Hook & first impression

Supports both **paste text** and **PDF upload**.

### Mock Interview Simulator
- AI acts as MIT admissions interviewer
- Asks questions based on MIT's values and student profile
- Evaluates: clear communication, intellectual curiosity, personal authenticity, school fit
- Generates a final report with dimension scores and improvement tips

### Dashboard
- **Profile Readiness Score** — overall readiness out of 100
- **Scoring Breakdown** — per-component scores so students know exactly where they stand
- **Scholarship Matching** — MIT need-based and merit-based scholarships
- **Insight & Action Plan** — concrete next steps to strengthen the application

> **Disclaimer:** This tool is a practice aid. It does not reflect or influence actual admissions decisions made by MIT's Admissions Office.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python) |
| AI | OpenAI GPT-4o + Whisper |
| Voice | ElevenLabs |
| PDF parsing | pdfplumber |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key

### Backend

```bash
cd backend
cp .env.example .env
# Fill in OPENAI_API_KEY in .env

pip install -r requirements.txt
pip install pdfplumber

uvicorn main:app --reload
# Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

```env
OPENAI_API_KEY=sk-...           # Required
ELEVENLABS_API_KEY=...          # Optional — for voice interview
ELEVENLABS_VOICE_ID=...         # Optional
EXA_API_KEY=...                 # Optional — for live data crawl
BRIGHTDATA_API_KEY=...          # Optional
```

---

## API Endpoints

```
POST /essay/review              → Full rubric-based essay analysis
POST /essay/review-pdf          → Same, from uploaded PDF file

POST /interview/ask             → One interview turn (question + feedback)
POST /interview/speak           → Text-to-speech for interviewer question
POST /interview/transcribe      → Whisper STT for student voice input
POST /interview/report          → Final interview score report

POST /profile/score             → Detailed academic fit scoring
POST /profile/scholarships      → Matched scholarships
POST /profile/summary           → GPT-generated executive summary
GET  /profile/schools           → Available schools list
```

---

## Project Structure

```
unimatch-ai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   └── schools.json          # MIT admissions data + scholarships
│   ├── routers/
│   │   ├── essay.py
│   │   ├── interview.py
│   │   └── profile.py
│   ├── services/
│   │   ├── openai_service.py
│   │   ├── elevenlabs_service.py
│   │   └── crawl_service.py
│   └── prompts/
│       ├── essay_prompts.py
│       └── interview_prompts.py
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/client.js
        ├── components/
        │   ├── ProfileBar.jsx
        │   ├── ScoreDisplay.jsx
        │   └── Button.jsx
        └── pages/
            ├── EssayReview.jsx
            ├── InterviewSim.jsx
            └── Dashboard.jsx
```

---

## Demo Script

1. Fill in student profile — Name, GPA, SAT, IELTS, extracurriculars
2. **Essay tab** → paste or upload PDF → click Analyze → view rubric breakdown
3. **Interview tab** → Start Interview → answer 2–3 questions → End & get report
4. **Dashboard tab** → Analyze Profile → view readiness score, scholarship matches, action plan

Total demo time: ~4 minutes