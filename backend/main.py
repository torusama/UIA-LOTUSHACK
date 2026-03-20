from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import essay, interview, profile

load_dotenv()

app = FastAPI(title="UniMatch AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Priority 1: Demo-ready ──────────────────────────────
app.include_router(essay.router,     prefix="/essay",     tags=["Essay"])
app.include_router(interview.router, prefix="/interview", tags=["Interview"])

# ── Priority 2: After demo ──────────────────────────────
app.include_router(profile.router,   prefix="/profile",   tags=["Profile"])

@app.get("/")
def root():
    return {"status": "ok", "message": "UniMatch AI API running"}
