import json
import random
from pathlib import Path

SCHOOLS = json.loads((Path(__file__).parent.parent / "data" / "schools.json").read_text())

# ── 10 câu giới thiệu bản thân ────────────────────────────────────────────
INTRO_QUESTIONS = [
    "Could you please introduce yourself? Tell me your name, where you're from, and what you're currently studying.",
    "Let's start with you — who are you, where are you from, and what brings you to apply for this opportunity?",
    "I'd love to hear about you first. Can you give me a brief introduction — your background, your field of study, and what drives you?",
    "Before we dive in, tell me a little about yourself — your name, hometown, and what you're passionate about academically.",
    "Let's begin with your story. Where are you from, what are you studying, and what's one thing that makes you unique?",
    "Please introduce yourself — your name, your academic background, and something that defines who you are as a student.",
    "To get started, could you share who you are, where you're from, and what you're currently pursuing academically?",
    "Tell me about yourself — your name, your studies, and what led you to pursue higher education abroad.",
    "I'd like to know who I'm speaking with. Please introduce yourself — your background, your major, and your goals.",
    "Let's open with an introduction. Who are you, where are you from, and what are you studying right now?",
]

# ── 50 câu hỏi phỏng vấn tổng quát ──────────────────────────────────────
GENERAL_QUESTIONS = [
    # Motivation
    "What made you decide to apply to MIT specifically, and why this major?",
    "Why did you choose MIT over other universities you could have applied to?",
    "What is it about MIT's program that excites you the most?",
    "How did you first hear about MIT, and what drew you to apply?",
    "What specific resources or programs at MIT align with your goals?",
    # Academic
    "Can you walk me through your academic achievements — GPA, awards, or competitions?",
    "What has been your most challenging academic experience, and how did you handle it?",
    "Tell me about a subject or project you are genuinely passionate about and why.",
    "How would your professors or teachers describe you as a student?",
    "What academic skills do you feel are your strongest, and how have you developed them?",
    # Extracurriculars
    "Tell me about your activities outside the classroom — clubs, volunteering, or leadership roles.",
    "What is the most meaningful extracurricular activity you've been involved in, and why?",
    "Have you ever led a team or project? Walk me through that experience.",
    "How do you balance academic responsibilities with extracurricular commitments?",
    "What community impact have you made through your activities outside school?",
    # Career vision
    "Where do you see yourself 5 to 10 years after graduating?",
    "How does studying at MIT help you achieve your long-term career goals?",
    "What specific career path are you considering, and why does it interest you?",
    "How does your intended major connect to the real-world problems you want to solve?",
    "What skills do you hope to develop during your time at MIT?",
    # Scholarship justification
    "Why should we choose you for this scholarship over hundreds of other qualified applicants?",
    "What makes your application stand out from others we have reviewed?",
    "How will you make the most of this scholarship opportunity if awarded?",
    "What impact do you plan to create that justifies investing in your education?",
    "In what ways are you more prepared for this opportunity than your peers?",
    # Adaptability
    "How do you plan to adapt to a new culture and country while studying abroad?",
    "Have you ever lived away from home or in an unfamiliar environment? How did you cope?",
    "What challenges do you anticipate when studying in a foreign country, and how will you overcome them?",
    "How will you maintain your mental and emotional well-being while studying far from home?",
    "What steps have you already taken to prepare yourself for life abroad?",
    # Challenge and growth
    "Tell me about a difficult moment in your life and what you learned from it.",
    "Describe a time you failed at something and how you recovered from it.",
    "What is the biggest obstacle you have had to overcome, academically or personally?",
    "Tell me about a time you had to step outside your comfort zone.",
    "How have setbacks or failures shaped the person you are today?",
    # Giving back
    "After completing your degree, how do you plan to contribute to your home country?",
    "How will your education at MIT benefit your community back home?",
    "What specific problem in your community do you want to help solve?",
    "How do you see yourself as a bridge between your home country and the global community?",
    "What legacy do you want to leave after your studies abroad?",
    # Values and character
    "What are your three most important personal values, and how do they show up in your life?",
    "Tell me about someone who has significantly influenced your academic or personal journey.",
    "How do you handle disagreement or conflict with peers or colleagues?",
    "Describe a situation where you had to stand up for something you believed in.",
    "What does integrity mean to you, and can you give an example of how you have demonstrated it?",
    # Reflective
    "Is there anything about MIT that excites or concerns you?",
    "What question do you wish interviewers would ask you that we have not asked yet?",
    "If you could go back and change one decision in your academic life, what would it be?",
    "What would you want your professors and classmates at MIT to know about you?",
    "Is there anything important about yourself that you have not had the chance to share today?",
]


def build_interviewer_system_prompt(school_name: str, student_profile: dict) -> str:
    school = SCHOOLS.get(school_name, {})
    criteria = "\n".join(f"- {c}" for c in school.get("essay_criteria", []))

    # Turn 1: 1 câu giới thiệu bản thân (từ intro pool)
    turn1 = random.choice(INTRO_QUESTIONS)

    # Turn 2-9: 8 câu từ general pool — hoàn toàn khác chủ đề
    general_picked = random.sample(GENERAL_QUESTIONS, 8)
    general_picked = [q.replace("{school}", school_name) for q in general_picked]

    all_questions = [turn1] + general_picked

    questions_block = "\n\n".join(
      f"Turn {i+1}{' (OPENING)' if i == 0 else ''}: Ask — \"{q}\""
      for i, q in enumerate(all_questions)
    )

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

INTERVIEW STRUCTURE — Follow this exact turn order. Do not skip or reorder turns:

{questions_block}

Turn 10 (CLOSING): Say — "We're almost at the end of our session. Is there anything you'd like to add, or any questions you have for us?" Then thank them warmly and wrap up. Set interview_phase = "closing".

OFF-TOPIC DETECTION — Apply this rule to EVERY single answer, without exception:

Before moving to the next question, you MUST check if the student's answer is meaningful.

An answer is ALWAYS OFF-TOPIC or INVALID if it contains:
- Greetings or farewells: "Bye", "Hi", "Hello", "Thanks", "See you", "Goodbye", "Bye bye"
- Single words or very short phrases under 8 words with no real content
- Numbers only: "1 2 3 4 5", "one two three"
- Random words unrelated to the question
- Repetition of what the interviewer said
- Anything that is clearly not an attempt to answer the question

THIS RULE APPLIES EVERY TURN — not just the first time.
Even if the student has already given a bad answer before, you MUST call it out AGAIN.
There is NO limit to how many times you can flag an off-topic answer.

If the answer is OFF-TOPIC or INVALID, you MUST:
1. Do NOT move to the next turn under any circumstances
2. Respond with a short, direct callout. Examples:
   - "That still doesn't answer my question. Let me try again — [rephrase simply]"
   - "I need you to actually answer the question. [repeat question]"
   - "That's not quite what I was asking. Let's try once more — [repeat question]"
3. Ask the EXACT same question again, rephrased slightly
4. Set ALL score fields to 1 in score_on_previous
5. Keep interview_phase as "opening" or "middle" — never advance
6. In interviewer_note, write "FLAGGED: off-topic answer, repeating question"

RULES:
1. Ask ONE question at a time. Never combine two questions.
2. After a valid answer, give brief genuine feedback (1-2 sentences), then move to the next turn.
3. Adapt naturally — if they say something interesting, acknowledge it before moving on.
4. Keep your questions short and conversational — this is a voice interview.
5. NEVER reward off-topic or one-word answers by moving forward.

RESPONSE FORMAT — Always return valid JSON:
{{
  "question": "<your next spoken question>",
  "feedback_on_previous": "<1-2 sentence warm reaction to their last answer, null if first question>",
  "score_on_previous": {{
    "authenticity": <1-10 or null>,
    "depth": <1-10 or null>,
    "school_fit": <1-10 or null>
  }},
  "interview_phase": "opening|middle|closing",
  "interviewer_note": "<internal note — what you noticed, what you will probe next>"
}}"""


def build_final_interview_report_prompt(transcript: list, school_name: str, duration_seconds: int = 0) -> str:
    conversation = "\n".join([
        f"{'Interviewer' if m['role']=='assistant' else 'Student'}: {m['content']}"
        for m in transcript
    ])

    duration_note = f"Total duration: {duration_seconds // 60}m {duration_seconds % 60}s." if duration_seconds else ""

    return f"""You are an expert admissions consultant. Analyze this complete {school_name} mock interview transcript and generate an honest, constructive assessment.

{duration_note}

TRANSCRIPT:
{conversation}

Evaluate these dimensions:
1. Self-introduction (Turn 1-2): Was it clear, engaging, well-structured?
2. Motivation for school and major: Did they show genuine research and passion?
3. Academic profile presentation: Specific or vague?
4. Extracurriculars: Did they show leadership and initiative?
5. Career vision: Realistic and connected to their studies?
6. Scholarship justification: Compelling and unique?
7. Adaptability: Confident or anxious about studying abroad?
8. Resilience: Did their challenge story show real growth?
9. Communication: Natural, confident, clear delivery?
10. Authenticity: Did it feel genuine or rehearsed?

STRICT SCORING RULES — You must follow these exactly:
- If the student gave ONLY one-word answers, greetings, or off-topic responses: overall_score must be 1-5
- If fewer than 3 meaningful, on-topic answers were given: admission_likelihood_percent must be 0
- If the student said NOTHING meaningful (only greetings, one words, silence): admission_likelihood_percent must be exactly 0, overall_score must be exactly 1
- Single words like "Bye", "Thanks", "Hi", "Ok" = score 1/10 for every dimension
- Do NOT give charity points. A score of 40+ requires at least 4 substantive, relevant answers
- A score of 70+ requires at least 7 solid, on-topic answers across all turns
- The score must reflect ACTUAL performance only, not the student's potential
- If the transcript shows the student barely participated, be brutally honest

Return JSON:
{{
  "overall_score": <1-100>,
  "admission_likelihood_percent": <0-100>,
  "admission_likelihood_signal": "strong|moderate|weak",
  "dimension_scores": {{
    "self_introduction": <1-10>,
    "motivation_clarity": <1-10>,
    "communication": <1-10>,
    "authenticity": <1-10>,
    "school_fit": <1-10>,
    "resilience_grit": <1-10>
  }},
  "intro_assessment": "<2-3 sentences specifically about their self-introduction>",
  "top_moments": ["<best answer or moment>", "<another strong moment>"],
  "weak_moments": ["<where they struggled>"],
  "improvement_tips": ["<specific actionable tip>", "<another tip>", "<one more>"],
  "summary": "<4-5 sentence honest assessment, tone like a caring mentor, be direct about poor performance>",
  "next_steps": ["<what to practice>", "<another specific next step>"]
}}"""