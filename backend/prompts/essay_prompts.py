import json
from pathlib import Path

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())

def build_essay_prompt(essay_text: str, school_name: str, student_profile: dict, similar_essays: list = []) -> str:
    school = SCHOOLS.get(school_name, {})
    criteria = "\n".join(f"- {c}" for c in school.get("essay_criteria", []))
    default_criteria = (
        "- Clarity of narrative\n"
        "- Authenticity and voice\n"
        "- Intellectual curiosity\n"
        "- Fit with school mission\n"
        "- Originality"
    )
    criteria_text = criteria if criteria else default_criteria

    activities = student_profile.get("activities", [])
    activities_str = ", ".join(activities) if isinstance(activities, list) else str(activities)

    major = student_profile.get("major", "")
    major_notes = school.get("major_specific_notes", {}).get(major, "")
    major_section = f"\nSPECIAL FOCUS FOR {major.upper()}:\n- {major_notes}" if major_notes else ""
    major_instruction = f"\n7. For {major}: check specifically for {major_notes}" if major_notes else ""

    # Benchmark section từ RAG
    benchmark_section = ""
    if similar_essays:
        benchmarks = "\n\n---\n".join([
            f'ADMITTED ESSAY EXAMPLE {i+1}:\n"""\n{e}\n"""'
            for i, e in enumerate(similar_essays)
        ])
        benchmark_section = f"""
BENCHMARK — Real essays from students admitted to top universities:
{benchmarks}

Use these as quality reference. Compare the student's essay against these benchmarks.
"""

    return f"""You are a senior admissions officer at {school_name} with 15+ years of experience.
Your job is to give HONEST, SPECIFIC, and ACTIONABLE feedback on this student's essay.

STUDENT PROFILE:
- Name: {student_profile.get('name', 'N/A')}
- GPA: {student_profile.get('gpa', 'N/A')}
- Applying for: {major}
- Activities: {activities_str}

{school_name} ESSAY CRITERIA:
{criteria_text}
{major_section}
{benchmark_section}
STUDENT'S ESSAY:
\"\"\"
{essay_text}
\"\"\"

EVALUATION INSTRUCTIONS:
1. Read the ENTIRE essay carefully before scoring anything
2. Be SPECIFIC — quote exact phrases when giving feedback
3. Flag any CLICHÉ phrases (e.g. "ever since I was young", "passion for", "changed my life")
4. Assess if the essay sounds GENERIC or truly personal
5. Check if the student's story CONNECTS to {school_name}'s values/mission
6. For paragraph_suggestions — find ALL genuinely weak sentences:
   - Strong essay (overall >= 8)  → 1-2 suggestions
   - Average essay (overall 5-7)  → 3-4 suggestions
   - Weak essay (overall <= 4)    → 4-6 suggestions
   - ONLY flag sentences that are truly weak — never force suggestions on good sentences
   - Each suggestion must point to a DIFFERENT part of the essay{major_instruction}

IMPORTANT FOR full_essay_with_highlights:
- Copy the ENTIRE essay text exactly, preserve all line breaks
- Wrap ONLY the weak phrases/sentences with @@...@@ markers
- The number of @@ highlights must MATCH the number of paragraph_suggestions
- Example: "I have @@always been passionate about@@ technology. @@This changed my life@@."
- Do NOT change, add or remove any other text

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
  "full_essay_with_highlights": "<entire essay text with @@weak phrases@@ wrapped — number of @@ must match paragraph_suggestions count>",
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