import json
from pathlib import Path

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())

def build_essay_prompt(essay_text: str, school_name: str, student_profile: dict) -> str:
    school = SCHOOLS.get(school_name, {})
    criteria = "\n".join(f"- {c}" for c in school.get("essay_criteria", []))
    activities = student_profile.get('activities', [])
    activities_str = ", ".join(activities) if isinstance(activities, list) else str(activities)

    # Major-specific notes
    major = student_profile.get('major', '')
    major_notes = school.get("major_specific_notes", {}).get(major, "")
    major_section = f"\nSPECIAL FOCUS FOR {major.upper()}:\n- {major_notes}" if major_notes else ""
    major_instruction = f"\n6. For {major}: check specifically for {major_notes}" if major_notes else ""

    return f"""You are a senior admissions officer at {school_name} with 15+ years of experience.
Your job is to give HONEST, SPECIFIC, and ACTIONABLE feedback on this student's essay.

STUDENT PROFILE:
- Name: {student_profile.get('name', 'N/A')}
- GPA: {student_profile.get('gpa', 'N/A')}
- Applying for: {major}
- Activities: {activities_str}

{school_name} ESSAY CRITERIA:
{criteria if criteria else "- Clarity of narrative\\n- Authenticity and voice\\n- Intellectual curiosity\\n- Fit with school mission\\n- Originality"}
{major_section}

STUDENT'S ESSAY:
\"\"\"
{essay_text}
\"\"\"

EVALUATION INSTRUCTIONS:
1. Read the essay carefully before scoring
2. Be SPECIFIC — quote exact phrases when giving feedback
3. Flag any CLICHÉ phrases (e.g. "ever since I was young", "passion for", "changed my life")
4. Assess if the essay sounds GENERIC or truly personal
5. Check if the student's story CONNECTS to {school_name}'s values/mission{major_instruction}

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
  "strengths": [
    "<specific strength with example from essay>",
    "<specific strength with example from essay>",
    "<specific strength with example from essay>"
  ],
  "weaknesses": [
    "<specific weakness with example from essay>",
    "<specific weakness with example from essay>"
  ],
  "cliche_flags": [
    {{
      "phrase": "<exact cliche phrase from essay>",
      "suggestion": "<how to make it more original>"
    }}
  ],
  "paragraph_suggestions": [
    {{
      "quote": "<exact short quote from essay that needs work>",
      "issue": "<what's wrong with this part>",
      "suggestion": "<concrete rewrite suggestion>"
    }}
  ],
  "summary": "<3-4 sentence overall verdict — be honest, mention both what works and what needs improvement>"
}}"""


def build_essay_rewrite_prompt(original: str, issue: str, suggestion: str, school_name: str) -> str:
    return f"""You are a college essay coach helping a student apply to {school_name}.

Rewrite the following paragraph to address the issue noted.

ORIGINAL PARAGRAPH:
\"\"\"
{original}
\"\"\"

ISSUE: {issue}
SUGGESTION: {suggestion}

Rules:
- Keep the student's authentic voice — do NOT make it sound too polished or generic
- Keep roughly the same length
- Make the change feel natural

Return ONLY valid JSON:
{{
  "rewritten": "<the improved paragraph>",
  "changes_made": ["<change 1>", "<change 2>", "<change 3>"]
}}"""