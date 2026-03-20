"""
Profile Scoring — Full implementation.
- Detailed academic fit per criterion (GPA, SAT, IELTS, ACT)
- Extracurricular scoring
- Reach/Match/Safety classification
- School recommendations
- Scholarship matching
- Executive Summary
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from services.openai_service import chat_completion
import json
from pathlib import Path

router = APIRouter()
SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())


class ProfileScoreRequest(BaseModel):
    school_name: str
    student_profile: dict     # gpa, sat, ielts, act, toefl, activities, major, name
    essay_score: dict | None
    interview_score: dict | None


class RecommendRequest(BaseModel):
    student_profile: dict
    target_major: str = ""


class ScholarshipRequest(BaseModel):
    school_name: str
    student_profile: dict
    essay_score: dict | None = None


# ── helpers ────────────────────────────────────────────────────────────────

def _score_numeric(value, low, high, weight=100):
    """Score a numeric value against a [low, high] range. Returns 0-100."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    if v >= high:
        return 100
    if v >= low:
        return int(50 + 50 * (v - low) / (high - low))
    if v >= low * 0.9:
        return int(30 + 20 * (v - low * 0.9) / (low * 0.1))
    return max(0, int(30 * (v / (low * 0.9))))


def _score_gpa(value, required):
    try:
        v = float(value)
        r = float(required)
    except (TypeError, ValueError):
        return None
    if v >= r:
        return 100
    if v >= r - 0.1:
        return 80
    if v >= r - 0.2:
        return 60
    if v >= r - 0.3:
        return 40
    return max(0, int(40 * (v / r)))


def _score_activities(activities_text: str) -> tuple[int, str]:
    """Heuristic score for extracurricular depth from text description."""
    if not activities_text or len(activities_text.strip()) < 10:
        return 30, "Không có thông tin hoạt động ngoại khóa"
    text = activities_text.lower()
    score = 40  # base
    notes = []

    depth_keywords = ["president", "founder", "leader", "captain", "chair", "director", "led", "founded", "created", "built", "launched"]
    impact_keywords = ["award", "prize", "win", "national", "international", "competition", "published", "research", "patent", "medal"]
    variety_keywords = ["volunteer", "internship", "club", "sport", "music", "art", "community", "project", "team", "hack"]

    depth_hits = sum(1 for k in depth_keywords if k in text)
    impact_hits = sum(1 for k in impact_keywords if k in text)
    variety_hits = sum(1 for k in variety_keywords if k in text)

    score += min(30, depth_hits * 10)
    score += min(20, impact_hits * 10)
    score += min(10, variety_hits * 3)

    if depth_hits >= 2:
        notes.append("Leadership nổi bật")
    if impact_hits >= 1:
        notes.append("Có thành tích / giải thưởng")
    if variety_hits >= 3:
        notes.append("Đa dạng hoạt động")
    if not notes:
        notes.append("Cần bổ sung chiều sâu và impact")

    return min(100, score), " · ".join(notes)


def _tier_from_scores(component_scores: dict, acceptance_rate: float) -> tuple[str, float]:
    """Determine reach/match/safety and estimate probability."""
    weights = {
        "gpa_fit": 0.25,
        "sat_fit": 0.20,
        "ielts_fit": 0.15,
        "extracurricular": 0.20,
        "essay_quality": 0.20,
    }
    total_weight = 0
    weighted = 0
    for k, w in weights.items():
        v = component_scores.get(k)
        if v is not None:
            weighted += v * w
            total_weight += w
    if total_weight == 0:
        overall = 50
    else:
        overall = weighted / total_weight

    # Scale from base acceptance rate
    if overall >= 85:
        multiplier = 3.5
    elif overall >= 75:
        multiplier = 2.0
    elif overall >= 65:
        multiplier = 1.0
    elif overall >= 50:
        multiplier = 0.5
    else:
        multiplier = 0.2

    prob = min(0.92, acceptance_rate * multiplier * 10)

    if prob > 0.35:
        tier = "safety"
    elif prob > 0.12:
        tier = "match"
    else:
        tier = "reach"

    return tier, round(prob * 100, 1), round(overall)


# ── POST /profile/score ────────────────────────────────────────────────────

@router.post("/score")
async def score_profile(req: ProfileScoreRequest):
    school = SCHOOLS.get(req.school_name, {})
    reqs = school.get("requirements", {})
    profile = req.student_profile

    component_scores = {}
    breakdown = {}

    # GPA
    gpa_score = _score_gpa(profile.get("gpa"), reqs.get("GPA", 3.9))
    if gpa_score is not None:
        component_scores["gpa_fit"] = gpa_score
        breakdown["GPA"] = {
            "your_value": profile.get("gpa", "N/A"),
            "required": f'>= {reqs.get("GPA", "3.9")}',
            "score": gpa_score,
        }

    # SAT
    sat_range = reqs.get("SAT", [1400, 1600])
    sat_score = _score_numeric(profile.get("sat"), sat_range[0], sat_range[1])
    if sat_score is not None:
        component_scores["sat_fit"] = sat_score
        breakdown["SAT"] = {
            "your_value": profile.get("sat", "N/A"),
            "required": f'{sat_range[0]}–{sat_range[1]}',
            "score": sat_score,
        }

    # IELTS
    ielts_score = _score_numeric(profile.get("ielts"), reqs.get("IELTS", 7.0), 9.0)
    if ielts_score is not None:
        component_scores["ielts_fit"] = ielts_score
        breakdown["IELTS"] = {
            "your_value": profile.get("ielts", "N/A"),
            "required": f'>= {reqs.get("IELTS", "7.0")}',
            "score": ielts_score,
        }

    # ACT (optional)
    act_range = reqs.get("ACT", [33, 36])
    act_score = _score_numeric(profile.get("act"), act_range[0], act_range[1])
    if act_score is not None:
        component_scores["act_fit"] = act_score
        breakdown["ACT"] = {
            "your_value": profile.get("act"),
            "required": f'{act_range[0]}–{act_range[1]}',
            "score": act_score,
        }

    # Extracurricular
    ec_score, ec_note = _score_activities(profile.get("activities", ""))
    component_scores["extracurricular"] = ec_score
    breakdown["Extracurricular"] = {"note": ec_note, "score": ec_score}

    # Essay
    if req.essay_score:
        essay_overall = req.essay_score.get("scores", {}).get("overall", 5)
        component_scores["essay_quality"] = int(essay_overall * 10)
    else:
        component_scores["essay_quality"] = 50
    breakdown["Essay"] = {"score": component_scores["essay_quality"],
                          "note": "Từ kết quả Essay Analysis" if req.essay_score else "Chưa phân tích essay"}

    # Interview
    if req.interview_score:
        interview_overall = req.interview_score.get("overall_score", 50)
        component_scores["interview"] = interview_overall
        breakdown["Interview"] = {"score": interview_overall, "note": "Từ kết quả Interview"}

    # Tier + probability
    tier, probability, overall_score = _tier_from_scores(
        component_scores, school.get("acceptance_rate", 0.1)
    )

    # Identify top gaps
    gaps = []
    for name, info in breakdown.items():
        s = info.get("score", 100)
        if s < 60:
            gaps.append(f"{name}: {s}/100 — cần cải thiện")

    return JSONResponse({
        "overall_score": overall_score,
        "estimated_probability": probability,
        "tier": tier,
        "component_scores": component_scores,
        "breakdown": breakdown,
        "top_gaps": gaps,
        "school": school.get("name", req.school_name),
        "acceptance_rate": round(school.get("acceptance_rate", 0.1) * 100, 1),
    })


# ── POST /profile/recommend ────────────────────────────────────────────────

@router.post("/recommend")
async def recommend_schools(req: RecommendRequest):
    """
    So sánh hồ sơ student với tất cả schools trong database.
    Trả về danh sách Reach / Match / Safety.
    """
    profile = req.student_profile

    results = []
    for school_id, school in SCHOOLS.items():
        reqs = school.get("requirements", {})
        scores = {}

        gpa = _score_gpa(profile.get("gpa"), reqs.get("GPA", 3.9))
        if gpa: scores["gpa_fit"] = gpa

        sat_range = reqs.get("SAT", [1400, 1600])
        sat = _score_numeric(profile.get("sat"), sat_range[0], sat_range[1])
        if sat: scores["sat_fit"] = sat

        ielts = _score_numeric(profile.get("ielts"), reqs.get("IELTS", 7.0), 9.0)
        if ielts: scores["ielts_fit"] = ielts

        ec_score, _ = _score_activities(profile.get("activities", ""))
        scores["extracurricular"] = ec_score

        tier, prob, overall = _tier_from_scores(scores, school.get("acceptance_rate", 0.1))

        results.append({
            "id": school_id,
            "name": school["name"],
            "location": school.get("location", ""),
            "acceptance_rate": round(school.get("acceptance_rate", 0.1) * 100, 1),
            "tier": tier,
            "estimated_probability": prob,
            "overall_fit": overall,
        })

    results.sort(key=lambda x: x["overall_fit"], reverse=True)

    reach   = [r for r in results if r["tier"] == "reach"][:3]
    match   = [r for r in results if r["tier"] == "match"][:3]
    safety  = [r for r in results if r["tier"] == "safety"][:3]

    return JSONResponse({
        "reach": reach,
        "match": match,
        "safety": safety,
    })


# ── POST /profile/scholarships ─────────────────────────────────────────────

@router.post("/scholarships")
async def match_scholarships(req: ScholarshipRequest):
    school = SCHOOLS.get(req.school_name, {})
    scholarships = school.get("scholarships", [])
    profile = req.student_profile

    # Score each scholarship
    scored = []
    for s in scholarships:
        fit_score = 50
        notes = []

        if s["type"] == "merit_based":
            gpa_s = _score_gpa(profile.get("gpa"), 3.7) or 50
            sat_range = school.get("requirements", {}).get("SAT", [1400, 1600])
            sat_s = _score_numeric(profile.get("sat"), sat_range[0], sat_range[1]) or 50
            ec_s, _ = _score_activities(profile.get("activities", ""))
            fit_score = int((gpa_s * 0.4) + (sat_s * 0.3) + (ec_s * 0.3))
            if fit_score >= 75:
                notes.append("Hồ sơ phù hợp tốt")
            elif fit_score >= 55:
                notes.append("Có cơ hội — cần củng cố extracurricular")
            else:
                notes.append("Cần cải thiện thêm trước khi apply")
        else:  # need_based
            fit_score = 70
            notes.append("Phụ thuộc vào tình hình tài chính gia đình")

        if req.essay_score:
            essay_s = req.essay_score.get("scores", {}).get("overall", 5)
            if essay_s >= 8:
                fit_score = min(100, fit_score + 10)
                notes.append("Essay mạnh — lợi thế lớn")
            elif essay_s < 6:
                fit_score = max(0, fit_score - 10)
                notes.append("Cần cải thiện essay")

        potential = "Không khả thi" if fit_score < 40 else ("Partial" if fit_score < 70 else "Full potential")

        scored.append({
            **s,
            "fit_score": fit_score,
            "potential": potential,
            "notes": notes,
        })

    scored.sort(key=lambda x: x["fit_score"], reverse=True)

    # External scholarships suggestion
    external = []
    country = profile.get("country", "").lower()
    if "viet" in country or "vietnam" in country or country == "vn":
        external = [
            {
                "name": "Học bổng Chính phủ Việt Nam (Vingroup)",
                "type": "external",
                "amount": "Partial to Full",
                "criteria": "GPA cao, lãnh đạo cộng đồng",
                "fit_score": 65,
                "potential": "Partial"
            },
            {
                "name": "VEF (Vietnam Education Foundation)",
                "type": "external",
                "amount": "Full funding",
                "criteria": "STEM fields, strong academics",
                "fit_score": 70,
                "potential": "Full potential"
            },
            {
                "name": "Fulbright Vietnam",
                "type": "external",
                "amount": "Full funding (graduate)",
                "criteria": "Leadership, community impact",
                "fit_score": 60,
                "potential": "Partial"
            }
        ]

    return JSONResponse({
        "school_scholarships": scored,
        "external_scholarships": external,
        "summary": f"Tìm thấy {len(scored)} học bổng từ {school.get('name', req.school_name)} và {len(external)} học bổng bên ngoài phù hợp."
    })


# ── POST /profile/summary ──────────────────────────────────────────────────

@router.post("/summary")
async def executive_summary(req: ProfileScoreRequest):
    """
    Gọi GPT để tạo Executive Summary ngắn gọn từ toàn bộ hồ sơ.
    """
    school = SCHOOLS.get(req.school_name, {})
    profile = req.student_profile

    system_prompt = f"""You are a senior admissions consultant. Given the student's profile, generate a concise executive summary for their application to {school.get('name', req.school_name)}.

Return ONLY valid JSON:
{{
  "verdict": "Reach | Match | Safety",
  "overall_strength": "Strong | Average | Needs Improvement",
  "top_insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "biggest_strength": "<1-2 sentences>",
  "biggest_gap": "<1-2 sentences>",
  "recommendation": "<2-3 sentences of strategic advice>",
  "action_plan": ["<action 1>", "<action 2>", "<action 3>"]
}}"""

    user_content = f"""Student profile:
- GPA: {profile.get('gpa', 'N/A')}
- SAT: {profile.get('sat', 'N/A')}
- IELTS: {profile.get('ielts', 'N/A')}
- ACT: {profile.get('act', 'N/A')}
- Major: {profile.get('major', 'N/A')}
- Activities: {profile.get('activities', 'N/A')}
- School applying: {req.school_name}
- Acceptance rate: {round(school.get('acceptance_rate', 0.1) * 100, 1)}%
- Essay score: {req.essay_score.get('scores', {}).get('overall', 'N/A') if req.essay_score else 'Not analyzed'}
- Interview score: {req.interview_score.get('overall_score', 'N/A') if req.interview_score else 'Not done'}"""

    result = await chat_completion(
        system_prompt=system_prompt,
        messages=[{"role": "user", "content": user_content}],
        json_mode=True,
    )
    return JSONResponse(result)


# ── GET /profile/schools ───────────────────────────────────────────────────

@router.get("/schools")
async def list_schools():
    return [{"id": k, "name": v["name"], "acceptance_rate": round(v.get("acceptance_rate", 0.1) * 100, 1)}
            for k, v in SCHOOLS.items()]