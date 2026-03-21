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
  // ── Essay PDF ──────────────────────────────────────────────────────────────
export const reviewEssayPdf = async (file, schoolName, studentProfile) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("school_name", schoolName);
  formData.append("student_profile", JSON.stringify(studentProfile));

  const res = await fetch("/essay/review-pdf", {
    method: "POST",
    body: formData, // KHÔNG set Content-Type — browser tự set multipart
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

// ── Interview ──────────────────────────────────────────────────────────────
export const interviewAsk = (schoolName, studentProfile, conversationHistory, userAnswer) =>
  post("/interview/ask", {
    school_name: schoolName,
    student_profile: studentProfile,
    conversation_history: conversationHistory,
    user_answer: userAnswer,
    voice_enabled: true,   // ← đổi từ false thành true
  });
export const speakQuestion = async (text) => {
  const res = await fetch("/interview/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, "answer.webm");
  const res = await fetch("/interview/transcribe", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Transcribe error: ${res.status}`);
  return res.json();
};
export const endInterview = (schoolName, conversationHistory) =>
  post("/interview/report", {
    school_name: schoolName,
    conversation_history: conversationHistory,
  });

// ── Profile ────────────────────────────────────────────────────────────────
export const scoreProfile = (schoolName, studentProfile, essayScore, interviewScore) =>
  post("/profile/score", {
    school_name: schoolName,
    student_profile: studentProfile,
    essay_score: essayScore,
    interview_score: interviewScore,
  });

export const recommendSchools = (studentProfile) =>
  post("/profile/recommend", { student_profile: studentProfile });

export const matchScholarships = (schoolName, studentProfile, essayScore) =>
  post("/profile/scholarships", {
    school_name: schoolName,
    student_profile: studentProfile,
    essay_score: essayScore,
  });

export const getExecutiveSummary = (schoolName, studentProfile, essayScore, interviewScore) =>
  post("/profile/summary", {
    school_name: schoolName,
    student_profile: studentProfile,
    essay_score: essayScore,
    interview_score: interviewScore,
  });

export const getSchools = () =>
  fetch("/profile/schools").then((r) => r.json());