"""
Profile Scoring — Secondary feature.
Calculates admission probability by combining:
  - Essay score (from /essay/review)
  - Interview score (from /interview/report)
  - Raw profile data vs school requirements
  - Live data from Exa/Bright Data (acceptance rates, class profiles)
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.openai_service import chat_completion
from services.crawl_service import get_school_admission_data
import json
from pathlib import Path

router = APIRouter()

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())


class ProfileScoreRequest(BaseModel):
    school_name: str
    student_profile: dict     # full profile: gpa, sat, ielts, activities, major
    essay_score: dict | None  # result from /essay/review
    interview_score: dict | None  # result from /interview/report


@router.post("/score")
async def score_profile(req: ProfileScoreRequest):
    """
    PSEUDOCODE — Full scoring pipeline:

    Step 1: Compare raw numbers against school requirements
      school_req = SCHOOLS[req.school_name]["requirements"]
      academic_fit = calculate_academic_fit(student_profile, school_req)
      → Returns score 0-100 for each: GPA, SAT, IELTS, etc.

    Step 2: Fetch live acceptance rate data (Exa/Bright Data)
      live_data = await get_school_admission_data(school_name, major)
      base_rate = live_data["acceptance_rate"]   # e.g. 0.04 for MIT

    Step 3: Weight components
      weights = {
        "academic_fit":     0.30,
        "essay_quality":    0.25,
        "extracurriculars": 0.20,
        "interview_score":  0.15,
        "intangibles":      0.10,
      }

    Step 4: Ask GPT-4o for holistic assessment
      → Prompt: "Given these scores and MIT's profile, estimate admission probability
                 and identify the 3 most critical improvements."

    Step 5: Return structured report
      → { overall_score, predicted_probability, tier: reach/match/safety,
          component_scores, top_gaps, improvement_priority }
    """

    # ── DEMO VERSION: Simple rule-based scoring without live crawl ──────────
    school = SCHOOLS.get(req.school_name, {})
    req_map = school.get("requirements", {})
    profile = req.student_profile

    component_scores = {}

    # Academic fit — compare numbers
    try:
        gpa = float(profile.get("gpa", 0))
        component_scores["gpa_fit"] = min(100, int((gpa / 4.0) * 100))
    except (ValueError, TypeError):
        component_scores["gpa_fit"] = 50

    # Essay quality — use score from essay endpoint if available
    if req.essay_score:
        essay_overall = req.essay_score.get("scores", {}).get("overall", 5)
        component_scores["essay_quality"] = int(essay_overall * 10)
    else:
        component_scores["essay_quality"] = 50

    # Interview score
    if req.interview_score:
        interview_overall = req.interview_score.get("overall_score", 50)
        component_scores["interview"] = interview_overall
    else:
        component_scores["interview"] = 50

    # Weighted total
    weights = {"gpa_fit": 0.3, "essay_quality": 0.4, "interview": 0.3}
    weighted_score = sum(component_scores[k] * weights[k] for k in weights)

    # Map score to probability (MIT base rate 4% — scale accordingly)
    base_acceptance = school.get("acceptance_rate", 0.1)
    # Simple heuristic: score 80+ → 2x base rate, score 60 → base rate, <60 → below
    multiplier = max(0.1, (weighted_score - 50) / 30 + 1)
    estimated_probability = min(0.95, base_acceptance * multiplier * 10)

    tier = "reach"
    if estimated_probability > 0.4:
        tier = "safety"
    elif estimated_probability > 0.15:
        tier = "match"

    return JSONResponse({
        "overall_score": round(weighted_score),
        "estimated_probability": round(estimated_probability * 100, 1),
        "tier": tier,
        "component_scores": component_scores,
        "note": "Live crawl data integration pending — using rule-based estimates",
    })


@router.get("/schools")
async def list_schools():
    """Return available schools for frontend dropdown."""
    return [{"id": k, "name": v["name"]} for k, v in SCHOOLS.items()]
