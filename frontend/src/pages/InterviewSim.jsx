import { useState, useRef, useEffect } from "react";
import { interviewAsk, speakQuestion, transcribeAudio, endInterview } from "../api/client";
import { Button, Tag } from "../components/Button";
import { ScorePill } from "../components/ScoreDisplay";

const MAX_TURNS = 10;
const CHARS_PER_MS = 15 / 1000;

export default function InterviewSim({ profile, onReport }) {
  const [history, setHistory]               = useState([]);
  const [loading, setLoading]               = useState(false);
  const [voiceEnabled, setVoiceEnabled]     = useState(true);
  const [phase, setPhase]                   = useState("idle");
  const [feedback, setFeedback]             = useState(null);
  const [report, setReport]                 = useState(null);
  const [turnCount, setTurnCount]           = useState(0);
  const [isRecording, setIsRecording]       = useState(false);
  const [timeLeft, setTimeLeft]             = useState(9 * 60);
  const [speechAnalysis, setSpeechAnalysis] = useState(null);
  const [micWarning, setMicWarning]         = useState("");
  const [typingText, setTypingText]         = useState("");
  const [isTyping, setIsTyping]             = useState(false);
  const [userTypingText, setUserTypingText] = useState("");
  const [isUserTyping, setIsUserTyping]     = useState(false);
  const [isAISpeaking, setIsAISpeaking]     = useState(false);

  const audioRef      = useRef(null);
  const bottomRef     = useRef(null);
  const mediaRecRef   = useRef(null);
  const chunksRef     = useRef([]);
  const timerRef      = useRef(null);
  const historyRef    = useRef([]);
  const turnCountRef  = useRef(0);
  const typingRef     = useRef(null);
  const userTypingRef = useRef(null);

  useEffect(() => { historyRef.current = history; }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, feedback, speechAnalysis, typingText, userTypingText]);

  function startTypewriter(text) {
    clearInterval(typingRef.current);
    setTypingText("");
    setIsTyping(true);
    const totalMs = text.length / CHARS_PER_MS;
    const delay   = Math.max(20, Math.min(60, totalMs / text.length));
    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingRef.current);
        setIsTyping(false);
      }
    }, delay);
  }

  function startUserTypewriter(text) {
    clearInterval(userTypingRef.current);
    setUserTypingText("");
    setIsUserTyping(true);
    let i = 0;
    userTypingRef.current = setInterval(() => {
      i++;
      setUserTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(userTypingRef.current);
        setIsUserTyping(false);
        setUserTypingText("");
      }
    }, 30);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 8000) {
          setMicWarning("⚠️ Không nghe thấy gì. Hãy thử ghi âm lại và nói rõ hơn.");
          return;
        }
        setMicWarning("");
        const data = await transcribeAudio(blob);
        if (!data.transcript?.trim()) {
          setMicWarning("⚠️ Không nhận diện được giọng nói. Hãy nói gần mic hơn và thử lại.");
          return;
        }
        if (data.analysis) setSpeechAnalysis(data.analysis);
        const currentHistory = historyRef.current;
        startUserTypewriter(data.transcript);
        // Gửi ngay — không chờ typewriter
        await sendTurn(currentHistory, data.transcript);
      };
      mediaRecRef.current = mr;
      mr.start(200);
      setIsRecording(true);
    } catch (err) {
      setMicWarning("⚠️ Không thể truy cập microphone. Kiểm tra quyền trình duyệt.");
    }
  }

  function stopRecording() {
    mediaRecRef.current?.stop();
    mediaRecRef.current?.stream?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  }

  async function startInterview() {
    console.log("START");
    setPhase("active");
    setHistory([]);
    historyRef.current = [];
    setTurnCount(0);
    turnCountRef.current = 0;
    setFeedback(null);
    setReport(null);
    setSpeechAnalysis(null);
    setMicWarning("");
    setTypingText("");
    setIsTyping(false);
    setUserTypingText("");
    setIsUserTyping(false);
    setTimeLeft(9 * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleEnd(); return 0; }
        return prev - 1;
      });
    }, 1000);
    await sendTurn([], "");
  }

  async function sendTurn(currentHistory, answer) {
    console.log("sendTurn called, answer:", answer);
    setLoading(true);
    try {
      console.log("Calling interviewAsk...");
      const data = await interviewAsk(
        profile.school_name || "MIT",
        profile,
        currentHistory,
        answer,
      );

      const questionText = data.question || "";
      console.log("API data:", data);

      const aiMsg = { role: "assistant", content: questionText };
      const newHistory = answer.trim()
        ? [...currentHistory, { role: "user", content: answer }, aiMsg]
        : [...currentHistory, aiMsg];

      setHistory(newHistory);
      historyRef.current = newHistory;

      setTurnCount((n) => { turnCountRef.current = n + 1; return n + 1; });
      setFeedback(
        data.feedback_on_previous
          ? { text: data.feedback_on_previous, scores: data.score_on_previous }
          : null
      );

      if (questionText) startTypewriter(questionText);

      if (voiceEnabled && questionText) {
        try {
          if (data.audio_base64) {
            const bytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
            const blob  = new Blob([bytes], { type: "audio/mpeg" });
            audioRef.current.src = URL.createObjectURL(blob);
            setIsAISpeaking(true);  
            audioRef.current.onended = () => setIsAISpeaking(false);
            audioRef.current.play().catch((err) => console.error("❌ Audio play failed:", err));
          } else {
            const url = await speakQuestion(questionText);
            audioRef.current.src = url;
            setIsAISpeaking(true);                                    // ← thêm
            audioRef.current.onended = () => setIsAISpeaking(false);
            audioRef.current.play().catch((err) => console.error("❌ Audio play failed:", err));
          }
        } catch (err) {
          console.error("❌ Voice error:", err);
        }
      }

      if (turnCountRef.current >= MAX_TURNS) {
        setPhase("ended");
        await handleEnd();
      }
    } catch (e) {
      console.error("sendTurn error:", e.message, e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    clearInterval(timerRef.current);
    clearInterval(typingRef.current);
    setPhase("ended");
    setLoading(true);
    try {
      const data = await endInterview(profile.school_name || "MIT", historyRef.current);
      setReport(data);
      onReport?.(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Mock Interview — {profile.school_name || "MIT"}</h2>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>
          <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
          Voice
        </label>
        {phase === "active" && (
          <Tag color="#dcfce7" textColor="#15803d">
            Câu {Math.min(turnCount, MAX_TURNS)}/{MAX_TURNS}
          </Tag>
        )}
      </div>

      {phase === "active" && (
        <div style={{ fontSize: 20, fontWeight: 700, color: timeLeft < 60 ? "red" : "#374151", marginBottom: 12 }}>
          ⏱ {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      )}

      <audio ref={audioRef} style={{ display: "none" }} />

      <div style={{
        minHeight: 320, maxHeight: 420, overflowY: "auto",
        border: "1px solid #e5e7eb", borderRadius: 12,
        padding: 16, marginBottom: 16, background: "#fafafa",
      }}>
        {phase === "idle" && (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 100 }}>
            Nhấn "Bắt đầu" để vào phiên phỏng vấn thử
          </p>
        )}

        {history.map((msg, i) => {
          const isLastAI = msg.role === "assistant" && i === history.length - 1;
          return (
            <ChatBubble
              key={i}
              role={msg.role}
              content={isLastAI && isTyping ? (typingText || "...") : msg.content}
              isTyping={isLastAI && isTyping}
            />
          );
        })}

        {isUserTyping && userTypingText && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <div style={{
              maxWidth: "75%", background: "#e5e7eb", color: "#111827",
              borderRadius: "12px 12px 0 12px",
              padding: "10px 14px", fontSize: 14, lineHeight: 1.6,
            }}>
              {userTypingText}
              <span style={{
                display: "inline-block", width: 2, height: 14,
                background: "#111827", marginLeft: 2, verticalAlign: "middle",
                animation: "blink 0.7s step-end infinite",
              }} />
            </div>
          </div>
        )}

        {feedback && <FeedbackBanner feedback={feedback} />}
        {speechAnalysis && <SpeechAnalysisCard analysis={speechAnalysis} />}
        {loading && !isTyping && (
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Interviewer đang suy nghĩ...</p>
        )}
        <div ref={bottomRef} />
      </div>

      {phase === "idle" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={startInterview}>Bắt đầu phỏng vấn</Button>
        </div>
      )}

      {phase === "active" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading || isTyping || isAISpeaking}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: isRecording ? "#dc2626" : "#1e40af",
              border: "none", color: "white", fontSize: 28,
              cursor: (loading || isTyping) ? "not-allowed" : "pointer",
              boxShadow: isRecording
                ? "0 0 0 10px rgba(220,38,38,0.2), 0 0 0 20px rgba(220,38,38,0.08)"
                : "0 4px 14px rgba(30,64,175,0.35)",
              opacity: (loading || isTyping || isAISpeaking) ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {isTyping ? "🔊" : isRecording ? "⏹" : "🎤"}
          </button>

          {isTyping && (
            <div style={{ color: "#1e40af", fontSize: 13, textAlign: "center" }}>
              🔊 Interviewer đang nói... chờ xong rồi trả lời
            </div>
          )}
          {isRecording && !isTyping && (
            <div style={{ color: "#dc2626", fontSize: 13, textAlign: "center" }}>
              ● Đang ghi âm... nhấn ⏹ để gửi
            </div>
          )}
          {!isRecording && !isTyping && !loading && (
            <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
              Nhấn 🎤 để trả lời
            </div>
          )}
          {loading && !isTyping && (
            <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center" }}>
              ⏳ Đang xử lý...
            </div>
          )}

          {micWarning && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 8, padding: "10px 14px", color: "#dc2626",
              fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              maxWidth: 400, width: "100%",
            }}>
              {micWarning}
              <button
                onClick={() => { setMicWarning(""); startRecording(); }}
                style={{
                  marginLeft: "auto", padding: "4px 12px",
                  background: "#dc2626", color: "white",
                  border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer",
                }}
              >
                Ghi âm lại
              </button>
            </div>
          )}

          <button
            onClick={handleEnd}
            disabled={loading}
            style={{
              padding: "6px 20px", background: "transparent",
              color: "#9ca3af", border: "1px solid #e5e7eb",
              borderRadius: 20, fontSize: 12, cursor: "pointer", marginTop: 4,
            }}
          >
            Kết thúc phỏng vấn
          </button>
        </div>
      )}

      {phase === "ended" && report && <InterviewReport report={report} />}
    </section>
  );
}

function ChatBubble({ role, content, isTyping }) {
  const isAI = role === "assistant";
  return (
    <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: 10 }}>
      <div style={{
        maxWidth: "75%",
        background: isAI ? "#1e40af" : "#e5e7eb",
        color: isAI ? "white" : "#111827",
        borderRadius: isAI ? "12px 12px 12px 0" : "12px 12px 0 12px",
        padding: "10px 14px", fontSize: 14, lineHeight: 1.6, minHeight: 20,
      }}>
        {isAI && (
          <span style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 4 }}>
            {isTyping ? "🔊 Interviewer đang nói..." : "Interviewer"}
          </span>
        )}
        {content}
        {isTyping && (
          <span style={{
            display: "inline-block", width: 2, height: 14,
            background: "white", marginLeft: 2, verticalAlign: "middle",
            animation: "blink 0.7s step-end infinite",
          }} />
        )}
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

function FeedbackBanner({ feedback }) {
  return (
    <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, margin: "8px 0", fontSize: 13 }}>
      <strong>Feedback:</strong> {feedback.text}
      {feedback.scores && (
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          {Object.entries(feedback.scores || {}).map(([k, v]) =>
            v !== null ? (
              <span key={k} style={{ background: "#dbeafe", borderRadius: 6, padding: "2px 8px", fontSize: 12 }}>
                {k.replace(/_/g, " ")}: <strong>{v}/10</strong>
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

function SpeechAnalysisCard({ analysis }) {
  if (!analysis) return null;
  const tone = analysis.tone_analysis || {};
  const toneColors = {
    very_enthusiastic: { bg: "#dcfce7", text: "#15803d", emoji: "🔥" },
    enthusiastic:      { bg: "#d1fae5", text: "#065f46", emoji: "😊" },
    neutral:           { bg: "#fef9c3", text: "#92400e", emoji: "😐" },
    flat:              { bg: "#fee2e2", text: "#dc2626", emoji: "😶" },
    nervous:           { bg: "#fef3c7", text: "#b45309", emoji: "😰" },
  };
  const tc = toneColors[tone.tone_label] || toneColors.neutral;
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, margin: "10px 0", fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 10, color: "#1e293b" }}>🎙️ Phân tích giọng nói</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: tc.bg, color: tc.text, borderRadius: 20, padding: "3px 12px", fontWeight: 600, marginBottom: 10, fontSize: 12 }}>
        {tc.emoji} {tone.tone_label?.replace(/_/g, " ").toUpperCase()}
      </div>
      {tone.tone_summary && <div style={{ color: "#475569", marginBottom: 10 }}>{tone.tone_summary}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {[["Nhiệt huyết", tone.enthusiasm_score], ["Tự tin", tone.confidence_score], ["Rõ ràng", tone.clarity_score]].map(([label, score]) =>
          score != null && (
            <div key={label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "4px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: score >= 7 ? "#16a34a" : score >= 5 ? "#d97706" : "#dc2626" }}>{score}/10</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
            </div>
          )
        )}
      </div>
      {(analysis.pronunciation_issues || []).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>⚠️ Phát âm cần chú ý:</div>
          {analysis.pronunciation_issues.map((p, i) => (
            <div key={i} style={{ background: "#fff7ed", borderLeft: "3px solid #f97316", borderRadius: "0 6px 6px 0", padding: "5px 10px", marginBottom: 4 }}>
              <strong>"{p.word}"</strong> — {p.issue}. Thử: <em>{p.suggestion}</em>
            </div>
          ))}
        </div>
      )}
      {(analysis.filler_words || []).length > 0 && (
        <div style={{ marginBottom: 10, color: "#64748b" }}>
          🗣️ Filler words: {analysis.filler_words.map(w => (
            <span key={w} style={{ background: "#f1f5f9", borderRadius: 4, padding: "1px 6px", margin: "0 3px", fontSize: 12 }}>{w}</span>
          ))}
        </div>
      )}
      {analysis.overall_speech_tip && (
        <div style={{ background: "#eff6ff", borderRadius: 8, padding: "8px 12px", color: "#1e40af", fontSize: 12 }}>
          💡 {analysis.overall_speech_tip}
        </div>
      )}
    </div>
  );
}

function InterviewReport({ report }) {
  const dims = report.dimension_scores || {};
  const signalMap = {
    strong:   { bg: "#dcfce7", text: "#15803d" },
    moderate: { bg: "#fef9c3", text: "#92400e" },
    weak:     { bg: "#fee2e2", text: "#dc2626" },
  };
  const signal = report.admission_likelihood_signal || "moderate";
  const col    = signalMap[signal];
  return (
    <div style={{ background: "#f0f9ff", borderRadius: 12, padding: 20, marginTop: 20 }}>
      <h3 style={{ margin: "0 0 16px" }}>Kết quả phỏng vấn</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: "#1e40af", lineHeight: 1 }}>{report.overall_score}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Overall score</div>
        </div>
        {report.admission_likelihood_percent != null && (
          <div>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#7c3aed", lineHeight: 1 }}>{report.admission_likelihood_percent}%</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Khả năng đậu</div>
          </div>
        )}
        <span style={{ background: col.bg, color: col.text, padding: "5px 14px", borderRadius: 20, fontWeight: 600 }}>
          {signal.toUpperCase()} signal
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(dims).map(([k, v]) => <ScorePill key={k} label={k.replace(/_/g, " ")} score={v} />)}
      </div>
      {report.intro_assessment && (
        <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 14 }}>
          <strong>🎯 Đánh giá phần giới thiệu:</strong>
          <p style={{ margin: "6px 0 0", color: "#374151" }}>{report.intro_assessment}</p>
        </div>
      )}
      {report.summary && <p style={{ color: "#374151", marginBottom: 14, fontSize: 14 }}>{report.summary}</p>}
      {(report.top_moments || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 14 }}>✨ Điểm sáng:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.top_moments.map((m, i) => <li key={i} style={{ marginBottom: 6, fontSize: 14, color: "#15803d" }}>{m}</li>)}
          </ul>
        </div>
      )}
      {(report.improvement_tips || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 14 }}>📌 Cần cải thiện:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.improvement_tips.map((tip, i) => <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{tip}</li>)}
          </ul>
        </div>
      )}
      {(report.next_steps || []).length > 0 && (
        <div>
          <strong style={{ fontSize: 14 }}>🚀 Bước tiếp theo:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.next_steps.map((s, i) => <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}