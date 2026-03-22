import { useState, useEffect } from "react";
import { getHistory } from "../lib/firebase";

// Import lại các component result để render trong modal
import EssayReview from "./EssayReview";
import InterviewSim from "./InterviewSim";

const T = { navy: "#001946", cobalt: "#00419e", border: "#e5e7eb" };

function timeAgo(ts) {
  if (!ts) return "";
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function scoreLabel(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.8) return { text: "Excellent", color: "#065f46", bg: "#d1fae5" };
  if (pct >= 0.6) return { text: "Good", color: "#92400e", bg: "#fef9c3" };
  if (pct >= 0.4) return { text: "Average", color: "#9a3412", bg: "#fff7ed" };
  return { text: "Needs Work", color: "#991b1b", bg: "#fee2e2" };
}

function tierLabel(tier) {
  if (tier === "safety")
    return { text: "Safety", color: "#15803d", bg: "#dcfce7" };
  if (tier === "match")
    return { text: "Match", color: "#92400e", bg: "#fef9c3" };
  return { text: "Reach", color: "#dc2626", bg: "#fee2e2" };
}

// ── Modal overlay ──────────────────────────────────────────────
function Modal({ onClose, children }) {
  // Close on backdrop click
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 860,
          padding: 32,
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          animation: "modalIn 0.2s ease",
        }}
      >
        <style>{`@keyframes modalIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

// ── Essay full result (dùng lại EssayResult từ EssayReview) ────
function EssayFullResult({ entry }) {
  const result = entry.full_result;
  if (!result) return <p style={{ color: "#9ca3af" }}>No data available.</p>;

  const scores = result.scores || {};
  const suggestions = result.paragraph_suggestions || [];
  const criteria = result.criterion_feedback || [];

  const SCORE_LABELS = {
    clarity_of_story: "Clarity of Story",
    authenticity: "Authenticity",
    school_fit: "School Fit",
    originality: "Originality",
    overall: "Overall",
  };

  function scoreTag(score, max = 10) {
    const pct = score / max;
    if (pct >= 0.8)
      return {
        text: "Excellent",
        color: "#065f46",
        bg: "#ecfdf5",
        bar: "#10b981",
      };
    if (pct >= 0.6)
      return { text: "Good", color: "#92400e", bg: "#fffbeb", bar: "#f59e0b" };
    if (pct >= 0.4)
      return {
        text: "Average",
        color: "#9a3412",
        bg: "#fff7ed",
        bar: "#f97316",
      };
    return {
      text: "Needs Work",
      color: "#991b1b",
      bg: "#fef2f2",
      bar: "#ef4444",
    };
  }

  const ovTag = scoreTag(scores.overall || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>
          📝 Essay — {entry.school}
        </h3>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {timeAgo(entry.createdAt)}
        </div>
      </div>

      {/* Summary banner */}
      <div
        style={{
          background: "#111827",
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: ovTag.bar }}>
            {ovTag.text}
          </div>
        </div>
        <div
          style={{ width: 1, height: 40, background: "#2d3748", flexShrink: 0 }}
        />
        <p
          style={{ margin: 0, color: "#9ca3af", fontSize: 13, lineHeight: 1.7 }}
        >
          {result.summary}
        </p>
      </div>

      {/* Scores */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 18px",
            borderBottom: "1px solid #f3f4f6",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#9ca3af",
          }}
        >
          Score Breakdown
        </div>
        {Object.entries(scores)
          .filter(([k]) => k !== "overall")
          .map(([k, v]) => {
            const tag = scoreTag(v);
            return (
              <div
                key={k}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "11px 18px",
                  borderBottom: "1px solid #f9fafb",
                }}
              >
                <div
                  style={{
                    width: 130,
                    fontSize: 13,
                    color: "#374151",
                    flexShrink: 0,
                  }}
                >
                  {SCORE_LABELS[k] || k.replace(/_/g, " ")}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    background: "#f3f4f6",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(v / 10) * 100}%`,
                      background: tag.bar,
                      borderRadius: 99,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 9px",
                    borderRadius: 99,
                    color: tag.color,
                    background: tag.bg,
                  }}
                >
                  {tag.text}
                </span>
              </div>
            );
          })}
      </div>

      {/* Strengths / Weaknesses */}
      {(result.strengths?.length > 0 || result.weaknesses?.length > 0) && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            {
              title: "Strengths",
              items: result.strengths || [],
              dot: "#10b981",
              hc: "#065f46",
            },
            {
              title: "Areas to Improve",
              items: result.weaknesses || [],
              dot: "#f97316",
              hc: "#9a3412",
            },
          ].map(({ title, items, dot, hc }) => (
            <div
              key={title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "10px 18px",
                  borderBottom: "1px solid #f3f4f6",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: hc,
                }}
              >
                {title}
              </div>
              <div style={{ padding: "12px 18px" }}>
                {items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 8,
                      fontSize: 13,
                      color: "#374151",
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: dot,
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paragraph suggestions */}
      {suggestions.length > 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              borderBottom: "1px solid #f3f4f6",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Suggested Edits ({suggestions.length})
          </div>
          <div
            style={{
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  background: "#fffbeb",
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 13,
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <div
                  style={{
                    fontStyle: "italic",
                    color: "#92400e",
                    marginBottom: 8,
                    padding: "4px 10px",
                    background: "#fef3c7",
                    borderRadius: 6,
                  }}
                >
                  "{s.quote}"
                </div>
                <p style={{ marginBottom: 6 }}>
                  <strong style={{ color: "#dc2626" }}>Issue:</strong> {s.issue}
                </p>
                <p style={{ margin: 0, color: "#15803d" }}>
                  <strong>Suggestion:</strong> {s.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rubric */}
      {criteria.length > 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              borderBottom: "1px solid #f3f4f6",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            {entry.school} Admissions Rubric
          </div>
          {criteria.map((c, i) => {
            const tag = scoreTag(c.score);
            return (
              <div
                key={i}
                style={{
                  padding: "13px 18px",
                  borderBottom: "1px solid #f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    {c.criterion?.replace(/_/g, " ")}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 9px",
                      borderRadius: 99,
                      color: tag.color,
                      background: tag.bg,
                    }}
                  >
                    {tag.text}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.6,
                  }}
                >
                  {c.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Interview full result ───────────────────────────────────────
function InterviewFullResult({ entry }) {
  const report = entry.full_result;
  if (!report) return <p style={{ color: "#9ca3af" }}>No data available.</p>;

  const dims = report.dimension_scores || {};
  const signalMap = {
    strong: { bg: "#dcfce7", text: "#15803d" },
    moderate: { bg: "#fef9c3", text: "#92400e" },
    weak: { bg: "#fee2e2", text: "#dc2626" },
  };
  const signal = report.admission_likelihood_signal || "moderate";
  const col = signalMap[signal];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>
          🎤 Interview — {entry.school}
        </h3>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {timeAgo(entry.createdAt)}
        </div>
      </div>

      <div
        style={{
          background: "#f0f9ff",
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: "#1e40af",
                lineHeight: 1,
              }}
            >
              {report.overall_score}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Overall score</div>
          </div>
          {report.admission_likelihood_percent != null && (
            <div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#7c3aed",
                  lineHeight: 1,
                }}
              >
                {report.admission_likelihood_percent}%
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Admission likelihood
              </div>
            </div>
          )}
          <span
            style={{
              background: col.bg,
              color: col.text,
              padding: "5px 14px",
              borderRadius: 20,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {signal.toUpperCase()} signal
          </span>
        </div>

        {/* Dimension scores */}
        {Object.keys(dims).length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {Object.entries(dims).map(([k, v]) => {
              const t = scoreLabel(v);
              return (
                <div
                  key={k}
                  style={{
                    background: t.bg,
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                    minWidth: 80,
                  }}
                >
                  <div
                    style={{ fontWeight: 700, fontSize: 13, color: t.color }}
                  >
                    {t.text}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "#6b7280",
                      marginTop: 2,
                      textTransform: "capitalize",
                    }}
                  >
                    {k.replace(/_/g, " ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {report.summary && (
          <p
            style={{
              color: "#374151",
              fontSize: 14,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {report.summary}
          </p>
        )}
      </div>

      {report.top_moments?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            ✨ Highlights
          </div>
          {report.top_moments.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 6,
                fontSize: 14,
                color: "#15803d",
              }}
            >
              <span>•</span>
              {m}
            </div>
          ))}
        </div>
      )}

      {report.improvement_tips?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            📌 Areas to improve
          </div>
          {report.improvement_tips.map((tip, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 14 }}
            >
              <span>•</span>
              {tip}
            </div>
          ))}
        </div>
      )}

      {report.next_steps?.length > 0 && (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
            🚀 Next steps
          </div>
          {report.next_steps.map((s, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 14 }}
            >
              <span>•</span>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard full result ───────────────────────────────────────
function DashboardFullResult({ entry }) {
  const data = entry.full_result;
  if (!data) return <p style={{ color: "#9ca3af" }}>No data available.</p>;

  const tierConfig = {
    reach: { bg: "#fee2e2", text: "#dc2626" },
    match: { bg: "#fef9c3", text: "#92400e" },
    safety: { bg: "#dcfce7", text: "#15803d" },
  };
  const tc = tierConfig[data.tier || "reach"];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>
          📊 Dashboard — {entry.school}
        </h3>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>
          {timeAgo(entry.createdAt)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#1e40af",
              lineHeight: 1,
            }}
          >
            {data.estimated_probability}%
          </div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Acceptance probability (Acceptance rate: {data.acceptance_rate}%)
          </div>
        </div>
        <span
          style={{
            background: tc.bg,
            color: tc.text,
            padding: "6px 18px",
            borderRadius: 20,
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 6,
          }}
        >
          {(data.tier || "reach").toUpperCase()}
        </span>
      </div>

      {/* Breakdown */}
      {data.breakdown && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
            Score by criterion
          </div>
          {Object.entries(data.breakdown).map(([name, info]) => (
            <div key={name} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 500 }}>{name}</span>
                <span style={{ color: "#6b7280" }}>
                  {info.your_value &&
                    `Yours: ${info.your_value} / Required: ${info.required} — `}
                  {info.note && `${info.note} — `}
                  <strong>{info.score}/100</strong>
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "#f3f4f6",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 99,
                    width: `${info.score}%`,
                    background:
                      info.score >= 75
                        ? "#10b981"
                        : info.score >= 50
                          ? "#f59e0b"
                          : "#ef4444",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data.top_gaps?.length > 0 && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 10,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#c2410c",
              marginBottom: 8,
            }}
          >
            🚨 Weaknesses to address
          </div>
          {data.top_gaps.map((gap, i) => (
            <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>
              • {gap}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History card (clickable) ────────────────────────────────────
function HistoryCard({ entry, onClick }) {
  const getTag = () => {
    if (entry.type === "essay") {
      const overall = entry.scores?.overall;
      return overall != null ? scoreLabel(overall) : null;
    }
    if (entry.type === "interview") {
      const score = entry.overall_score;
      return score != null ? scoreLabel(score, 100) : null;
    }
    if (entry.type === "dashboard") {
      return entry.tier ? tierLabel(entry.tier) : null;
    }
    return null;
  };

  const icons = { essay: "📝", interview: "🎤", dashboard: "📊" };
  const iconBgs = {
    essay: "#eff6ff",
    interview: "#f0fdf4",
    dashboard: "#fdf4ff",
  };
  const titles = {
    essay: `Essay — ${entry.school || "N/A"}`,
    interview: `Interview — ${entry.school || "N/A"}`,
    dashboard: `Dashboard — ${entry.school || "N/A"}`,
  };

  const tag = getTag();

  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 18px",
          background: "white",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: iconBgs[entry.type],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 20,
          }}
        >
          {icons[entry.type]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>
            {titles[entry.type]}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {timeAgo(entry.createdAt)}
          </div>
        </div>
        {tag && (
          <span
            style={{
              background: tag.bg,
              color: tag.color,
              padding: "3px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {tag.text}
          </span>
        )}
        <span
          style={{
            color: "#9ca3af",
            fontSize: 11,
            flexShrink: 0,
            marginLeft: 4,
          }}
        >
          →
        </span>
      </div>
    </div>
  );
}

// ── Main ProfilePage ────────────────────────────────────────────
export default function ProfilePage({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    getHistory(user.uid)
      .then(setHistory)
      .catch((e) => console.error("Load history failed:", e))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const counts = {
    essay: history.filter((h) => h.type === "essay").length,
    interview: history.filter((h) => h.type === "interview").length,
    dashboard: history.filter((h) => h.type === "dashboard").length,
  };

  const filtered = history.filter((h) => filter === "all" || h.type === filter);
  const initials =
    user.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div>
      {/* Modal to review results */}
      {viewing && (
        <Modal onClose={() => setViewing(null)}>
          {viewing.type === "essay" && <EssayFullResult entry={viewing} />}
          {viewing.type === "interview" && (
            <InterviewFullResult entry={viewing} />
          )}
          {viewing.type === "dashboard" && (
            <DashboardFullResult entry={viewing} />
          )}
        </Modal>
      )}

      {/* User info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            referrerPolicy="no-referrer"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #e5e7eb",
            }}
          />
        ) : (
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#001946,#2559bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            {initials}
          </div>
        )}
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#111827" }}>
            {user.name}
          </h2>
          <div style={{ fontSize: 14, color: "#6b7280" }}>{user.email}</div>
          {user.createdAt && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Member since:{" "}
              {(user.createdAt?.toDate
                ? user.createdAt.toDate()
                : new Date(user.createdAt)
              ).toLocaleDateString("en-US")}
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: "Essay Analyses",
            value: counts.essay,
            icon: "📝",
            color: "#eff6ff",
            textColor: "#1d4ed8",
          },
          {
            label: "Mock Interviews",
            value: counts.interview,
            icon: "🎤",
            color: "#f0fdf4",
            textColor: "#15803d",
          },
          {
            label: "Dashboard Analyses",
            value: counts.dashboard,
            icon: "📊",
            color: "#fdf4ff",
            textColor: "#7c3aed",
          },
        ].map(({ label, value, icon, color, textColor }) => (
          <div
            key={label}
            style={{
              background: color,
              borderRadius: 12,
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: textColor,
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter + History */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>
          Activity History
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all", label: "All" },
            { id: "essay", label: "📝 Essay" },
            { id: "interview", label: "🎤 Interview" },
            { id: "dashboard", label: "📊 Dashboard" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: filter === f.id ? T.cobalt : T.border,
                background: filter === f.id ? "#eff6ff" : "white",
                color: filter === f.id ? T.cobalt : "#6b7280",
                fontWeight: filter === f.id ? 600 : 400,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            border: `2px dashed ${T.border}`,
            borderRadius: 14,
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          No activity found{filter !== "all" ? " for this type" : ""}.
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
            Click any item to view the full result
          </p>
          {filtered.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              onClick={() => setViewing(entry)}
            />
          ))}
        </>
      )}
    </div>
  );
}
