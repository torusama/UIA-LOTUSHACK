import json
from pathlib import Path

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())

def build_essay_prompt(essay_text: str, school_name: str, student_profile: dict) -> str:
    school = SCHOOLS.get(school_name, {})
    criteria = "\n".join(f"- {c}" for c in school.get("essay_criteria", []))

    return f"""You are a senior admissions officer at {school_name}.
Evaluate the following student essay using {school_name}'s official rubric.

STUDENT PROFILE SUMMARY:
- GPA: {student_profile.get('gpa', 'N/A')}
- Major applying: {student_profile.get('major', 'N/A')}
- Key activities: {student_profile.get('activities', 'N/A')}

{school_name} ESSAY CRITERIA:
{criteria}

STUDENT'S ESSAY:
\"\"\"
{essay_text}
\"\"\"

Return ONLY valid JSON in this exact structure:
{{
  "scores": {{
    "clarity_of_story": <1-10>,
    "authenticity": <1-10>,
    "school_fit": <1-10>,
    "originality": <1-10>,
    "overall": <1-10>
  }},
  "criterion_feedback": [
    {{
      "criterion": "<name from rubric>",
      "score": <1-10>,
      "comment": "<2-3 sentence specific feedback>"
    }}
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "cliche_flags": ["<any cliche phrases found>"],
  "paragraph_suggestions": [
    {{
      "quote": "<exact short quote from essay that needs work>",
      "issue": "<what's wrong>",
      "suggestion": "<concrete rewrite suggestion>"
    }}
  ],
  "summary": "<2-3 sentence overall verdict>"
}}"""


def build_essay_rewrite_prompt(original: str, feedback: dict, section: str) -> str:
    """Secondary feature: rewrite a specific section based on feedback."""
    # PSEUDOCODE — implement after demo
    # 1. Extract the target section from `original`
    # 2. Pass feedback context + section to GPT-4
    # 3. Return improved version with explanation of changes
    pass
