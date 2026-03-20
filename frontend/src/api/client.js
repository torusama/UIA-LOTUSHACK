// Vite proxy handles /essay, /interview, /profile → localhost:8000
async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Essay ──────────────────────────────────────────────────────────────────
export const reviewEssay = (essayText, schoolName, studentProfile) =>
  post("/essay/review", {
    essay_text: essayText,
    school_name: schoolName,
    student_profile: studentProfile,
  });

// ── Interview ──────────────────────────────────────────────────────────────
export const interviewAsk = (schoolName, studentProfile, conversationHistory, userAnswer) =>
  post("/interview/ask", {
    school_name: schoolName,
    student_profile: studentProfile,
    conversation_history: conversationHistory,
    user_answer: userAnswer,
    voice_enabled: false,
  });

export const speakQuestion = async (text) => {
  const res = await fetch("/interview/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const blob = await res.blob();
  return URL.createObjectURL(blob); // returns audio URL for <audio> tag
};

export const endInterview = (schoolName, conversationHistory) =>
  post("/interview/report", {
    school_name: schoolName,
    conversation_history: conversationHistory,
  });

// ── Profile Score (secondary) ──────────────────────────────────────────────
export const scoreProfile = (schoolName, studentProfile, essayScore, interviewScore) =>
  post("/profile/score", {
    school_name: schoolName,
    student_profile: studentProfile,
    essay_score: essayScore,
    interview_score: interviewScore,
  });

export const getSchools = () =>
  fetch("/profile/schools").then((r) => r.json());
