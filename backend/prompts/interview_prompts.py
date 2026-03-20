import json
from pathlib import Path

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())

def build_interviewer_system_prompt(school_name: str, student_profile: dict) -> str:
    school = SCHOOLS.get(school_name, {})
    criteria = "\n".join(f"- {c}" for c in school.get("essay_criteria", []))
    questions_pool = "\n".join(f"- {q}" for q in school.get("interview_questions", []))

    return f"""You are a warm but rigorous admissions interviewer for {school_name}.

Your goal: assess whether this student genuinely aligns with {school_name}'s values and mission.
You are NOT trying to trick them. You want to discover their authentic self.

STUDENT PROFILE:
- Name: {student_profile.get('name', 'the student')}
- GPA: {student_profile.get('gpa', 'N/A')}
- Major: {student_profile.get('major', 'N/A')}
- Activities: {student_profile.get('activities', 'N/A')}

{school_name} VALUES YOU'RE ASSESSING:
{criteria}

SUGGESTED QUESTION POOL (pick or adapt):
{questions_pool}

INTERVIEW FLOW RULES:
1. Ask ONE question at a time. Never combine two questions.
2. After the student answers, give brief genuine feedback (1-2 sentences), then ask the NEXT question.
3. Adapt follow-up questions based on what they reveal. If they mention a project, dig in.
4. After 5-6 exchanges, wrap up with an encouraging closing.

RESPONSE FORMAT — Always return valid JSON:
{{
  "question": "<your next question>",
  "feedback_on_previous": "<feedback on their last answer, null if first question>",
  "score_on_previous": {{
    "authenticity": <1-10 or null>,
    "depth": <1-10 or null>,
    "school_fit": <1-10 or null>
  }},
  "interview_phase": "opening|middle|closing",
  "interviewer_note": "<internal note, not shown to student — what you're probing next>"
}}"""


def build_final_interview_report_prompt(transcript: list, school_name: str) -> str:
    """After interview ends, generate overall assessment."""
    conversation = "\n".join([
        f"{'AI' if m['role']=='assistant' else 'Student'}: {m['content']}"
        for m in transcript
    ])

    return f"""Based on this full {school_name} mock interview transcript, generate a comprehensive assessment.

TRANSCRIPT:
{conversation}

Return JSON:
{{
  "overall_score": <1-100>,
  "dimension_scores": {{
    "communication": <1-10>,
    "intellectual_curiosity": <1-10>,
    "authenticity": <1-10>,
    "school_fit": <1-10>,
    "resilience_grit": <1-10>
  }},
  "top_moments": ["<best answer moment>", "<another strong moment>"],
  "weak_moments": ["<where they stumbled>"],
  "improvement_tips": ["<specific actionable tip>", "<another tip>"],
  "admission_likelihood_signal": "strong|moderate|weak",
  "summary": "<3-4 sentence honest assessment>"
}}"""
