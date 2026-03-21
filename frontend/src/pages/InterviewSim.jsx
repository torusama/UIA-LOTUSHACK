import { useState, useRef, useEffect } from "react";
import {
  interviewAsk,
  speakQuestion,
  transcribeAudio,
  endInterview,
} from "../api/client";
import { Button, Tag } from "../components/Button";
import { ScorePill } from "../components/ScoreDisplay";

const MAX_TURNS = 10;

export default function InterviewSim({ profile, onReport }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [phase, setPhase] = useState("idle");
  const [feedback, setFeedback] = useState(null);
  const [report, setReport] = useState(null);
  const [turnCount, setTurnCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(9 * 60);
  const [speechAnalysis, setSpeechAnalysis] = useState(null);
  const [micWarning, setMicWarning] = useState("");
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pendingUserText, setPendingUserText] = useState("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const historyRef = useRef([]);
  const turnCountRef = useRef(0);
  const typingRef = useRef(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, feedback, speechAnalysis, typingText, pendingUserText]);

  // Hiện từng từ theo đúng tốc độ audio
  function startWordSync(text, durationSec) {
    clearInterval(typingRef.current);
    setIsTyping(true);
    setTypingText("");

    const words = text.split(" ");
    const msPerWord = (durationSec * 1000) / words.length;
    let i = 0;

    typingRef.current = setInterval(() => {
      i++;
      setTypingText(words.slice(0, i).join(" "));
      if (i >= words.length) {
        clearInterval(typingRef.current);
        // isTyping tắt ở onended
      }
    }, msPerWord);
  }

  // Fallback khi không có duration — hiện nhanh theo ký tự
  function startTypewriterFallback(text) {
    clearInterval(typingRef.current);
    setIsTyping(true);
    setTypingText("");
    const delay = 40;
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

  function setupAudio(questionText) {
    const audio = audioRef.current;
    let syncStarted = false;

    audio.ontimeupdate = () => {
      if (!syncStarted && audio.duration && isFinite(audio.duration)) {
        syncStarted = true;
        audio.ontimeupdate = null;
        startWordSync(questionText, audio.duration);
      }
    };

    audio.onended = () => {
      setIsAISpeaking(false);
      setIsTyping(false);
      clearInterval(typingRef.current);
      setTypingText(questionText);
    };

    audio.play().catch(() => startTypewriterFallback(questionText));
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 8000) {
          setMicWarning(
            "⚠️ Nothing detected. Please try again and speak clearly.",
          );
          setIsProcessing(false);
          return;
        }
        setMicWarning("");
        const data = await transcribeAudio(blob);
        if (data.wrong_language) {
          setMicWarning(
            "⚠️ Please answer in English. This is an English-only interview.",
          );
          setIsProcessing(false);
          return;
        }
        const INVALID_WORDS = [
          "hello",
          "hi",
          "bye",
          "goodbye",
          "thanks",
          "thank you",
          "yes",
          "no",
          "ok",
          "okay",
          "sure",
          "maybe",
          "hmm",
          "um",
          "uh",
        ];
        const trimmed = data.transcript.trim().toLowerCase();
        const wordCount = trimmed.split(/\s+/).length;
        const isInvalid =
          wordCount <= 3 && INVALID_WORDS.some((w) => trimmed.includes(w));
        if (isInvalid || wordCount < 4) {
          setMicWarning(
            "⚠️ Your answer is too short. Please give a complete answer.",
          );
          setIsProcessing(false);
          return;
        }
        if (data.analysis) setSpeechAnalysis(data.analysis);
        const currentHistory = historyRef.current;
        setPendingUserText(data.transcript);
        setIsProcessing(false);
        await sendTurn(currentHistory, data.transcript);
      };
      mediaRecRef.current = mr;
      mr.start(200);
      setIsRecording(true);
    } catch (err) {
      setMicWarning("⚠️ Cannot access microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecRef.current?.stop();
    mediaRecRef.current?.stream?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setIsProcessing(true);
  }

  function resetAll() {
    setPhase("idle");
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
    setPendingUserText("");
    setIsAISpeaking(false);
    setIsProcessing(false);
    setTimeLeft(9 * 60);
    clearInterval(timerRef.current);
    clearInterval(typingRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }

  async function startInterview() {
    resetAll();
    setPhase("active");
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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

      const questionText = data.question || "";
      const aiMsg = { role: "assistant", content: questionText };
      const newHistory = answer.trim()
        ? [...currentHistory, { role: "user", content: answer }, aiMsg]
        : [...currentHistory, aiMsg];

      setPendingUserText("");
      setIsTyping(true);
      setTypingText("");
      setHistory(newHistory);
      historyRef.current = newHistory;

      setTurnCount((n) => {
        turnCountRef.current = n + 1;
        return n + 1;
      });
      setFeedback(
        data.feedback_on_previous
          ? { text: data.feedback_on_previous, scores: data.score_on_previous }
          : null,
      );

      if (voiceEnabled && questionText) {
        try {
          setIsAISpeaking(true);
          if (data.audio_base64) {
            const bytes = Uint8Array.from(atob(data.audio_base64), (c) =>
              c.charCodeAt(0),
            );
            const blob = new Blob([bytes], { type: "audio/mpeg" });
            audioRef.current.src = URL.createObjectURL(blob);
          } else {
            const url = await speakQuestion(questionText);
            audioRef.current.src = url;
          }
          setupAudio(questionText);
        } catch (err) {
          setIsAISpeaking(false);
          startTypewriterFallback(questionText);
          console.error("❌ Voice error:", err);
        }
      } else if (questionText) {
        startTypewriterFallback(questionText);
      }

      if (turnCountRef.current >= MAX_TURNS) {
        setPhase("ended");
        await handleEnd();
      }
    } catch (e) {
      console.error("sendTurn error:", e.message, e);
      setPendingUserText("");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    clearInterval(timerRef.current);
    clearInterval(typingRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsTyping(false);
    setIsAISpeaking(false);
    setPhase("ended");
    setLoading(true);
    try {
      const data = await endInterview(
        profile.school_name || "MIT",
        historyRef.current,
      );
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>
          Mock Interview — {profile.school_name || "MIT"}
        </h2>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#6b7280",
            marginLeft: "auto",
          }}
        >
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
          />
          Voice
        </label>
        {phase === "active" && (
          <Tag color="#dcfce7" textColor="#15803d">
            Turn {Math.min(turnCount, MAX_TURNS)}/{MAX_TURNS}
          </Tag>
        )}
      </div>

      {phase === "active" && (
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: timeLeft < 60 ? "red" : "#374151",
            marginBottom: 12,
          }}
        >
          ⏱ {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
      )}

      <audio ref={audioRef} style={{ display: "none" }} />

      <div
        style={{
          minHeight: 320,
          maxHeight: 420,
          overflowY: "auto",
          border: "1px solid #e0e7ff",
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          background: "linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%)",
          boxShadow: "inset 0 2px 8px rgba(99,102,241,0.05)",
        }}
      >
        {phase === "idle" && (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: 100 }}>
            Press "Start Interview" to begin your mock interview
          </p>
        )}

        {history.map((msg, i) => {
          const isLastAI = msg.role === "assistant" && i === history.length - 1;
          return (
            <ChatBubble
              key={i}
              role={msg.role}
              content={isLastAI && isTyping ? typingText : msg.content}
              isTyping={isLastAI && isTyping}
            />
          );
        })}

        {pendingUserText && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                background: "#e5e7eb",
                color: "#111827",
                borderRadius: "12px 12px 0 12px",
                padding: "10px 14px",
                fontSize: 14,
                lineHeight: 1.6,
                opacity: 0.7,
              }}
            >
              {pendingUserText}
            </div>
          </div>
        )}

        {feedback && <FeedbackBanner feedback={feedback} />}
        {speechAnalysis && <SpeechAnalysisCard analysis={speechAnalysis} />}
        {loading && !isTyping && (
          <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 8 }}>
            Interviewer is thinking...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {phase === "idle" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Button onClick={startInterview}>Start Interview</Button>
        </div>
      )}

      {phase === "active" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.src = "";
                }
                clearInterval(typingRef.current);
                setIsTyping(false);
                setIsAISpeaking(false);
                startRecording();
              }
            }}
            disabled={loading || isTyping || isAISpeaking || isProcessing}
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: isRecording
                ? "#be185d"
                : "linear-gradient(135deg,#4338ca,#6d28d9)",
              border: "none",
              color: "white",
              fontSize: 28,
              cursor:
                loading || isTyping || isAISpeaking || isProcessing
                  ? "not-allowed"
                  : "pointer",
              boxShadow: isRecording
                ? "0 0 0 10px rgba(190,24,93,0.15), 0 0 0 20px rgba(190,24,93,0.06), 0 0 20px rgba(190,24,93,0.4)"
                : "0 0 0 8px rgba(99,102,241,0.12), 0 4px 20px rgba(99,102,241,0.45)",
              opacity:
                loading || isTyping || isAISpeaking || isProcessing ? 0.5 : 1,
              transition: "all 0.2s",
            }}
          >
            {isAISpeaking ? "🔊" : isRecording ? "⏹" : "🎤"}
          </button>

          {isAISpeaking && (
            <div
              style={{ color: "#4338ca", fontSize: 13, textAlign: "center" }}
            >
              🔊 Interviewer is speaking... wait before answering
            </div>
          )}
          {isTyping && !isAISpeaking && (
            <div
              style={{ color: "#4338ca", fontSize: 13, textAlign: "center" }}
            >
              🔊 Interviewer is speaking...
            </div>
          )}
          {isRecording && (
            <div
              style={{ color: "#be185d", fontSize: 13, textAlign: "center" }}
            >
              ● Recording... press ⏹ to send
            </div>
          )}
          {!isRecording &&
            !isTyping &&
            !isAISpeaking &&
            !loading &&
            !isProcessing && (
              <div
                style={{ color: "#9ca3af", fontSize: 13, textAlign: "center" }}
              >
                Press 🎤 to answer
              </div>
            )}
          {(loading || isProcessing) && !isTyping && !isAISpeaking && (
            <div
              style={{ color: "#6b7280", fontSize: 13, textAlign: "center" }}
            >
              ⏳ Processing...
            </div>
          )}

          {micWarning && (
            <div
              style={{
                background: "linear-gradient(135deg,#fce7f3,#fbcfe8)",
                border: "1px solid #f9a8d4",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#be185d",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                maxWidth: 400,
                width: "100%",
                boxShadow: "0 0 12px rgba(190,24,93,0.15)",
              }}
            >
              {micWarning}
              <button
                onClick={() => {
                  setMicWarning("");
                  startRecording();
                }}
                style={{
                  marginLeft: "auto",
                  padding: "4px 12px",
                  background: "linear-gradient(135deg,#be185d,#9d174d)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: "0 0 8px rgba(190,24,93,0.3)",
                }}
              >
                Record again
              </button>
            </div>
          )}

          <button
            onClick={handleEnd}
            disabled={loading}
            style={{
              padding: "6px 20px",
              background: "transparent",
              color: "#9ca3af",
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              fontSize: 12,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            End Interview
          </button>
        </div>
      )}

      {phase === "ended" && report && (
        <InterviewReport report={report} onRetry={startInterview} />
      )}
    </section>
  );
}

function ChatBubble({ role, content, isTyping }) {
  const isAI = role === "assistant";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isAI ? "flex-start" : "flex-end",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          background: isAI
            ? "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)"
            : "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)",
          color: isAI ? "white" : "#312e81",
          borderRadius: isAI ? "12px 12px 12px 0" : "12px 12px 0 12px",
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.6,
          minHeight: 20,
          boxShadow: isAI
            ? "0 4px 16px rgba(99,102,241,0.35), 0 0 0 1px rgba(165,180,252,0.2)"
            : "0 2px 8px rgba(99,102,241,0.08)",
        }}
      >
        {isAI && (
          <span
            style={{
              fontSize: 11,
              opacity: 0.7,
              display: "block",
              marginBottom: 4,
            }}
          >
            {isTyping ? "🔊 Interviewer speaking..." : "Interviewer"}
          </span>
        )}
        {content}
      </div>
    </div>
  );
}

function FeedbackBanner({ feedback }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
        borderRadius: 10,
        padding: 12,
        margin: "8px 0",
        fontSize: 13,
        border: "1px solid #c4b5fd",
        boxShadow: "0 0 12px rgba(167,139,250,0.2)",
      }}
    >
      <strong style={{ color: "#5b21b6" }}>Feedback:</strong>{" "}
      <span style={{ color: "#4c1d95" }}>{feedback.text}</span>
      {feedback.scores && (
        <div
          style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}
        >
          {Object.entries(feedback.scores || {}).map(([k, v]) =>
            v !== null ? (
              <span
                key={k}
                style={{
                  background: "linear-gradient(135deg,#ede9fe,#c4b5fd)",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontSize: 12,
                  color: "#5b21b6",
                  boxShadow: "0 0 6px rgba(139,92,246,0.25)",
                }}
              >
                {k.replace(/_/g, " ")}: <strong>{v}/10</strong>
              </span>
            ) : null,
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
    very_enthusiastic: {
      bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
      text: "#065f46",
      emoji: "🔥",
      glow: "0 0 10px rgba(52,211,153,0.4)",
    },
    enthusiastic: {
      bg: "linear-gradient(135deg,#d1fae5,#bbf7d0)",
      text: "#065f46",
      emoji: "😊",
      glow: "0 0 10px rgba(52,211,153,0.3)",
    },
    neutral: {
      bg: "linear-gradient(135deg,#fef9c3,#fef08a)",
      text: "#854d0e",
      emoji: "😐",
      glow: "0 0 10px rgba(251,191,36,0.3)",
    },
    flat: {
      bg: "linear-gradient(135deg,#fee2e2,#fecaca)",
      text: "#991b1b",
      emoji: "😶",
      glow: "0 0 10px rgba(248,113,113,0.3)",
    },
    nervous: {
      bg: "linear-gradient(135deg,#fef3c7,#fde68a)",
      text: "#854d0e",
      emoji: "😰",
      glow: "0 0 10px rgba(251,191,36,0.3)",
    },
  };
  const tc = toneColors[tone.tone_label] || toneColors.neutral;
  return (
    <div
      style={{
        background: "linear-gradient(135deg,#fafbff 0%,#f0f4ff 100%)",
        border: "1px solid #e0e7ff",
        borderRadius: 12,
        padding: 14,
        margin: "10px 0",
        fontSize: 13,
        boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 10, color: "#3730a3" }}>
        🎙️ Speech analysis
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: tc.bg,
          color: tc.text,
          borderRadius: 20,
          padding: "3px 12px",
          fontWeight: 600,
          marginBottom: 10,
          fontSize: 12,
          boxShadow: tc.glow,
          border: "1px solid rgba(255,255,255,0.5)",
        }}
      >
        {tc.emoji} {tone.tone_label?.replace(/_/g, " ").toUpperCase()}
      </div>
      {tone.tone_summary && (
        <div style={{ color: "#4338ca", marginBottom: 10 }}>
          {tone.tone_summary}
        </div>
      )}
      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}
      >
        {[
          ["Enthusiasm", tone.enthusiasm_score],
          ["Confidence", tone.confidence_score],
          ["Clarity", tone.clarity_score],
        ].map(
          ([label, score]) =>
            score != null && (
              <div
                key={label}
                style={{
                  background: "white",
                  border: "1px solid #e0e7ff",
                  borderRadius: 10,
                  padding: "6px 12px",
                  textAlign: "center",
                  boxShadow:
                    score >= 7
                      ? "0 0 10px rgba(52,211,153,0.3)"
                      : score >= 5
                        ? "0 0 10px rgba(251,191,36,0.3)"
                        : "0 0 10px rgba(248,113,113,0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color:
                      score >= 7
                        ? "#059669"
                        : score >= 5
                          ? "#d97706"
                          : "#dc2626",
                  }}
                >
                  {score}/10
                </div>
                <div style={{ fontSize: 11, color: "#6366f1" }}>{label}</div>
              </div>
            ),
        )}
      </div>
      {(analysis.pronunciation_issues || []).length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600, color: "#4338ca", marginBottom: 4 }}>
            ⚠️ Pronunciation issues:
          </div>
          {analysis.pronunciation_issues.map((p, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg,#ffedd5,#fed7aa)",
                borderLeft: "3px solid #fb923c",
                borderRadius: "0 8px 8px 0",
                padding: "5px 10px",
                marginBottom: 4,
                boxShadow: "0 0 8px rgba(251,146,60,0.2)",
              }}
            >
              <strong style={{ color: "#9a3412" }}>"{p.word}"</strong> —{" "}
              {p.issue}. Try:{" "}
              <em style={{ color: "#7c3aed" }}>{p.suggestion}</em>
            </div>
          ))}
        </div>
      )}
      {(analysis.filler_words || []).length > 0 && (
        <div style={{ marginBottom: 10, color: "#4338ca" }}>
          🗣️ Filler words:{" "}
          {analysis.filler_words.map((w) => (
            <span
              key={w}
              style={{
                background: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                borderRadius: 6,
                padding: "1px 8px",
                margin: "0 3px",
                fontSize: 12,
                color: "#5b21b6",
                boxShadow: "0 0 6px rgba(139,92,246,0.2)",
              }}
            >
              {w}
            </span>
          ))}
        </div>
      )}
      {analysis.overall_speech_tip && (
        <div
          style={{
            background: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "#4c1d95",
            fontSize: 12,
            boxShadow: "0 0 10px rgba(139,92,246,0.2)",
            border: "1px solid #c4b5fd",
          }}
        >
          💡 {analysis.overall_speech_tip}
        </div>
      )}
    </div>
  );
}

function InterviewReport({ report, onRetry }) {
  const dims = report.dimension_scores || {};
  const signalMap = {
    strong: {
      bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
      text: "#065f46",
      glow: "0 0 10px rgba(52,211,153,0.4)",
    },
    moderate: {
      bg: "linear-gradient(135deg,#fef3c7,#fde68a)",
      text: "#854d0e",
      glow: "0 0 10px rgba(251,191,36,0.4)",
    },
    weak: {
      bg: "linear-gradient(135deg,#fee2e2,#fecaca)",
      text: "#991b1b",
      glow: "0 0 10px rgba(248,113,113,0.4)",
    },
  };
  const signal = report.admission_likelihood_signal || "moderate";
  const col = signalMap[signal];
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f0ff 100%)",
        borderRadius: 14,
        padding: 20,
        marginTop: 20,
        border: "1px solid rgba(165,180,252,0.3)",
        boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
      }}
    >
      <h3 style={{ margin: "0 0 16px" }}>Interview Results</h3>
      {/* Overall score + admission — essay style */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #bfdbfe 100%)",
          borderRadius: 14,
          padding: "20px 24px",
          display: "flex",
          gap: 24,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          boxShadow: "0 8px 32px rgba(139,92,246,0.15)",
          border: "1px solid rgba(196,181,253,0.5)",
        }}
      >
        {(() => {
          const s = report.overall_score;
          const tag =
            s >= 80
              ? {
                  text: "Excellent",
                  color: "#059669",
                  glow: "0 0 16px rgba(5,150,105,0.4)",
                }
              : s >= 60
                ? {
                    text: "Good",
                    color: "#d97706",
                    glow: "0 0 16px rgba(217,119,6,0.4)",
                  }
                : s >= 40
                  ? {
                      text: "Average",
                      color: "#ea580c",
                      glow: "0 0 16px rgba(234,88,12,0.4)",
                    }
                  : {
                      text: "Needs Work",
                      color: "#dc2626",
                      glow: "0 0 16px rgba(220,38,38,0.4)",
                    };
          return (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: tag.color,
                  lineHeight: 1,
                  textShadow: tag.glow,
                }}
              >
                {tag.text}
              </div>
              <div style={{ fontSize: 12, color: "#6d28d9", marginTop: 4 }}>
                Overall
              </div>
            </div>
          );
        })()}
        <div
          style={{
            width: 1,
            height: 48,
            background: "rgba(139,92,246,0.2)",
            flexShrink: 0,
          }}
        />
        {report.admission_likelihood_percent != null && (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#7c3aed",
                lineHeight: 1,
                textShadow: "0 0 16px rgba(124,58,237,0.35)",
              }}
            >
              {report.admission_likelihood_percent}%
            </div>
            <div style={{ fontSize: 12, color: "#6d28d9", marginTop: 4 }}>
              Admission likelihood
            </div>
          </div>
        )}
        <div
          style={{
            width: 1,
            height: 48,
            background: "rgba(139,92,246,0.2)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            background: col.bg,
            color: col.text,
            padding: "5px 14px",
            borderRadius: 20,
            fontWeight: 600,
            fontSize: 13,
            boxShadow: col.glow,
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {signal.toUpperCase()} signal
        </span>
      </div>
      {report.intro_assessment && (
        <div
          style={{
            background: "#eff6ff",
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
            fontSize: 14,
          }}
        >
          <strong>🎯 Introduction assessment:</strong>
          <p style={{ margin: "6px 0 0", color: "#374151" }}>
            {report.intro_assessment}
          </p>
        </div>
      )}
      {report.summary && (
        <p style={{ color: "#374151", marginBottom: 14, fontSize: 14 }}>
          {report.summary}
        </p>
      )}
      {(report.top_moments || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 14 }}>✨ Highlights:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.top_moments.map((m, i) => (
              <li
                key={i}
                style={{ marginBottom: 6, fontSize: 14, color: "#15803d" }}
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(report.improvement_tips || []).length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <strong style={{ fontSize: 14 }}>📌 Areas to improve:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.improvement_tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(report.next_steps || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <strong style={{ fontSize: 14 }}>🚀 Next steps:</strong>
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            {report.next_steps.map((s, i) => (
              <li key={i} style={{ marginBottom: 6, fontSize: 14 }}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={onRetry}
        style={{
          padding: "12px 28px",
          background: "linear-gradient(135deg,#4338ca,#6d28d9)",
          color: "white",
          border: "none",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow:
            "0 4px 16px rgba(99,102,241,0.4), 0 0 0 1px rgba(165,180,252,0.2)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 6px 20px rgba(99,102,241,0.55), 0 0 0 1px rgba(165,180,252,0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 16px rgba(99,102,241,0.4), 0 0 0 1px rgba(165,180,252,0.2)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        🔄 Try Again
      </button>
    </div>
  );
}
