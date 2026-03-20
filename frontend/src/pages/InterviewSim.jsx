import { useState, useRef, useEffect } from "react";
import { interviewAsk, speakQuestion, endInterview } from "../api/client";
import { Button, Tag } from "../components/Button";
import { ScorePill } from "../components/ScoreDisplay";

const MAX_TURNS = 6;

export default function InterviewSim({ profile, onReport }) {
  const [history, setHistory]           = useState([]);
  const [userInput, setUserInput]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [phase, setPhase]               = useState("idle");
  const [feedback, setFeedback]         = useState(null);
  const [report, setReport]             = useState(null);
  const [turnCount, setTurnCount]       = useState(0);
  const audioRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, feedback]);

  async function startInterview() {
    setPhase("active");
    setHistory([]);
    setTurnCount(0);
    setFeedback(null);
    setReport(null);
    await sendTurn([], "");
  }

  async function sendTurn(currentHistory, answer) {
    setLoading(true);
    try {
      const data = await interviewAsk(
        profile.school_name || "MIT",
        profile,
        currentHistory,
        answer,
      );

      const aiMsg = { role: "assistant", content: data.question };
      const newHistory = answer
        ? [...currentHistory, { role: "user", content: answer }, aiMsg]
        : [aiMsg];

      setHistory(newHistory);
      setTurnCount((n) => n + 1);
      setFeedback(
        data.feedback_on_previous
          ? { text: data.feedback_on_previous, scores: data.score_on_previous }
          : null
      );

      if (voiceEnabled && data.question) {
        try {
          const url = await speakQuestion(data.question);
          audioRef.current.src = url;
          audioRef.current.play();
        } catch { /* voice optional */ }
      }

      if (data.interview_phase === "closing" || turnCount + 1 >= MAX_TURNS) {
        setPhase("ended");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!userInput.trim()) return;
    const answer = userInput;
    setUserInput("");
    await sendTurn(history, answer);
  }

  async function handleEnd() {
    setPhase("ended");
    setLoading(true);
    try {
      const data = await endInterview(profile.school_name || "MIT", history);
      setReport(data);
      onReport(data);
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

      <audio ref={audioRef} style={{ display: "none" }} />

      {/* Chat window */}
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

        {history.map((msg, i) => <ChatBubble key={i} role={msg.role} content={msg.content} />)}
        {feedback && <FeedbackBanner feedback={feedback} />}
        {loading && <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>Interviewer đang suy nghĩ...</p>}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      {phase === "idle" && (
        <Button onClick={startInterview}>Bắt đầu phỏng vấn</Button>
      )}

      {phase === "active" && (
        <div style={{ display: "flex", gap: 10 }}>
          <textarea
            rows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Nhập câu trả lời... (Ctrl+Enter để gửi)"
            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSend(); }}
            style={{
              flex: 1, padding: 10, borderRadius: 8,
              border: "1px solid #d1d5db", fontSize: 14, resize: "vertical",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Button onClick={handleSend} disabled={loading}>Gửi</Button>
            <Button onClick={handleEnd} disabled={loading} variant="secondary">Kết thúc</Button>
          </div>
        </div>
      )}

      {phase === "ended" && report && <InterviewReport report={report} />}
    </section>
  );
}

function ChatBubble({ role, content }) {
  const isAI = role === "assistant";
  return (
    <div style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end", marginBottom: 10 }}>
      <div style={{
        maxWidth: "75%",
        background: isAI ? "#1e40af" : "#e5e7eb",
        color: isAI ? "white" : "#111827",
        borderRadius: isAI ? "12px 12px 12px 0" : "12px 12px 0 12px",
        padding: "10px 14px", fontSize: 14, lineHeight: 1.6,
      }}>
        {isAI && <span style={{ fontSize: 11, opacity: 0.7, display: "block", marginBottom: 4 }}>Interviewer</span>}
        {content}
      </div>
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

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 60, fontWeight: 700, color: "#1e40af", lineHeight: 1 }}>
            {report.overall_score}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Overall score</div>
        </div>
        <span style={{ background: col.bg, color: col.text, padding: "5px 14px", borderRadius: 20, fontWeight: 600 }}>
          {signal.toUpperCase()} signal
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(dims).map(([k, v]) => (
          <ScorePill key={k} label={k.replace(/_/g, " ")} score={v} />
        ))}
      </div>

      {report.summary && <p style={{ color: "#374151", marginBottom: 14, fontSize: 14 }}>{report.summary}</p>}

      {(report.improvement_tips || []).length > 0 && (
        <>
          <strong style={{ fontSize: 14 }}>Cần cải thiện:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.improvement_tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>{tip}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
