# UniMatch AI — Hackathon Project

## Project Structure

```text
unimatch-ai/
├── README.md
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   └── schools.json
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── essay.py
│   │   ├── interview.py
│   │   └── profile.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── openai_service.py
│   │   ├── elevenlabs_service.py
│   │   └── crawl_service.py
│   └── prompts/
│       ├── __init__.py
│       ├── essay_prompts.py
│       └── interview_prompts.py
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── client.js
        ├── components/
        │   ├── Button.jsx
        │   ├── ProfileBar.jsx
        │   └── ScoreDisplay.jsx
        └── pages/
            ├── EssayReview.jsx
            ├── InterviewSim.jsx
            └── Dashboard.jsx
```

## Stack

- **Frontend**: React (Vite)
- **Backend**: FastAPI (Python)
- **AI**: OpenAI GPT-4o + Whisper | ElevenLabs (voice)
- **Data (secondary)**: Exa, Bright Data, TinyFish

---

## ⚡ Quick Start (both servers in 5 minutes)

### Backend

```bash
cd backend
cp .env.example .env        # Fill in OPENAI_API_KEY at minimum
pip install -r requirements.txt
uvicorn main:app --reload   # Runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install -g yarn
yarn install
yarn dev                   # Runs on http://localhost:5173
```

---

## Priority Features (must demo)

| #   | Feature             | Backend file           | Frontend file            |
| --- | ------------------- | ---------------------- | ------------------------ |
| 1   | Essay Analysis      | `routers/essay.py`     | `pages/EssayReview.jsx`  |
| 2   | Interview Simulator | `routers/interview.py` | `pages/InterviewSim.jsx` |

## Secondary Features (pitch as roadmap)

- Profile scoring with live data → `routers/profile.py` + `services/crawl_service.py`
- PDF essay upload → `routers/essay.py::review_essay_pdf`
- Voice input (student speaks) → `routers/interview.py::transcribe`
- Scholarship matching → not yet implemented
- School recommendations → not yet implemented

---

## Team Split

| Person                  | Owns                               | Files                                           |
| ----------------------- | ---------------------------------- | ----------------------------------------------- |
| 1 — Frontend            | React UI for Essay + Interview     | `frontend/src/`                                 |
| 2 — Backend             | FastAPI endpoints                  | `backend/routers/`, `backend/main.py`           |
| 3 — AI/Prompts          | Prompts + school data              | `backend/prompts/`, `backend/data/schools.json` |
| 4 — Integration + Pitch | Connect FE↔BE, demo script, slides | All                                             |

---

## API Summary

```
POST /essay/review          → { scores, criterion_feedback, strengths, weaknesses, paragraph_suggestions }
POST /interview/ask         → { question, feedback_on_previous, score_on_previous, interview_phase }
POST /interview/speak       → MP3 audio stream
POST /interview/report      → { overall_score, dimension_scores, improvement_tips }
POST /profile/score         → { estimated_probability, tier, component_scores }
GET  /profile/schools       → [{ id, name }]
```

---

## Demo Script (for judges)

1. Fill in profile: Name=Alex, GPA=3.8, Major=CS, School=MIT
2. Go to **Essay** tab → paste a sample essay → click Analyze
3. Show breakdown: scores per MIT criteria, paragraph suggestions
4. Go to **Interview** tab → Start Interview → answer 2-3 questions with voice on
5. Click End & Report → show dimension scores and tips
6. Go to **Dashboard** → Calculate → show admission % and action plan

Total demo time: ~4 minutes
