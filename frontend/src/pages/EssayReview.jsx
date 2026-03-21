import { useState } from "react";
import { reviewEssay, reviewEssayPdf } from "../api/client";

const SCORE_LABELS = {
  clarity_of_story: "Clarity of Story",
  authenticity:     "Authenticity",
  school_fit:       "School Fit",
  originality:      "Originality",
  overall:          "Overall",
};

function scoreTag(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.8) return { text: "Excellent", color: "#065f46", bg: "#ecfdf5", bar: "#10b981" };
  if (pct >= 0.6) return { text: "Good",      color: "#92400e", bg: "#fffbeb", bar: "#f59e0b" };
  if (pct >= 0.4) return { text: "Average",   color: "#9a3412", bg: "#fff7ed", bar: "#f97316" };
  return               { text: "Needs Work",  color: "#991b1b", bg: "#fef2f2", bar: "#ef4444" };
}

const css = `
  .essay-wrap * { box-sizing: border-box; }

  /* Sliding pill tab switcher */
  .tab-switcher {
    display: inline-flex; position: relative;
    background: #f3f4f6; border-radius: 10px; padding: 4px; gap: 0;
  }
  .tab-slider {
    position: absolute; top: 4px; bottom: 4px;
    width: calc(50% - 4px);
    background: white; border-radius: 7px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    transition: transform 0.25s cubic-bezier(.4,0,.2,1);
  }
  .tab-slider.right { transform: translateX(100%); }
  .tab-btn {
    position: relative; z-index: 1;
    padding: 9px 28px; font-size: 13px; font-weight: 500;
    border: none; background: none; cursor: pointer;
    color: #9ca3af; border-radius: 7px;
    transition: color 0.25s; white-space: nowrap; font-family: inherit;
  }
  .tab-btn.active { color: #111827; font-weight: 600; }

  /* Textarea */
  .essay-ta {
    width: 100%; min-height: 220px; padding: 16px 18px;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 14px; line-height: 1.75; resize: vertical;
    background: white; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: inherit; color: #111827;
  }
  .essay-ta:focus {
    border-color: #6b7280;
    box-shadow: 0 0 0 3px rgba(107,114,128,0.08);
  }
  .essay-ta::placeholder { color: #d1d5db; }

  /* Content fade transition */
  .panel-content {
    animation: fadeSlideIn 0.2s ease;
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Drop zone */
  .drop-zone {
    border: 1.5px dashed #d1d5db; border-radius: 10px;
    padding: 52px 24px; text-align: center; cursor: pointer;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    background: white;
  }
  .drop-zone:hover {
    border-color: #6b7280; background: #fafafa;
    box-shadow: 0 0 0 3px rgba(107,114,128,0.06);
  }
  .drop-zone.filled { border-style: solid; border-color: #374151; }

  /* Analyze button */
  .analyze-btn {
    background: #111827; color: white;
    padding: 12px 32px; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
    cursor: pointer; transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
    font-family: inherit;
  }
  .analyze-btn:hover:not(:disabled) {
    background: #1f2937;
    box-shadow: 0 4px 12px rgba(17,24,39,0.25);
  }
  .analyze-btn:active:not(:disabled) { transform: scale(0.97); }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Result cards */
  .rcard {
    background: white; border: 1px solid #e5e7eb;
    border-radius: 12px; overflow: hidden;
  }
  .rcard-header {
    padding: 12px 20px; border-bottom: 1px solid #f3f4f6;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: #9ca3af;
  }
  .score-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 20px; border-bottom: 1px solid #f9fafb;
    transition: background 0.15s;
  }
  .score-row:last-child { border-bottom: none; }
  .score-row:hover { background: #fafafa; }
  .bar-track {
    flex: 1; height: 5px; background: #f3f4f6;
    border-radius: 99px; overflow: hidden;
  }
  .bar-fill {
    height: 100%; border-radius: 99px;
    transition: width 1s cubic-bezier(.4,0,.2,1);
  }
  .rubric-row {
    display: flex; gap: 16px; padding: 14px 20px;
    border-bottom: 1px solid #f9fafb; align-items: flex-start;
    transition: background 0.15s;
  }
  .rubric-row:last-child { border-bottom: none; }
  .rubric-row:hover { background: #fafafa; }
  .badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 2px 9px; border-radius: 99px;
  }
  .suggestion-item { padding: 16px 20px; border-bottom: 1px solid #f9fafb; }
  .suggestion-item:last-child { border-bottom: none; }
  .suggestion-quote {
    font-size: 13px; color: #6b7280; font-style: italic;
    line-height: 1.65; border-left: 3px solid #e5e7eb;
    margin: 0 0 12px; padding: 6px 14px;
  }
`;

export default function EssayReview({ profile, onResult }) {
  const [mode, setMode]       = useState("text");
  const [essay, setEssay]     = useState("");
  const [pdf, setPdf]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  async function handleSubmit() {
    setLoading(true); setError(null);
    try {
      const prof = {
        ...profile,
        activities: typeof profile.activities === "string"
          ? profile.activities.split(",").map(a => a.trim()).filter(Boolean)
          : profile.activities || [],
      };
      let data;
      if (mode === "pdf") {
        if (!pdf) { setError("Please select a PDF file."); setLoading(false); return; }
        data = await reviewEssayPdf(pdf, profile.school_name || "MIT", prof);
      } else {
        if (essay.trim().length < 100) { setError("Minimum 100 characters required."); setLoading(false); return; }
        data = await reviewEssay(essay, profile.school_name || "MIT", prof);
      }
      setResult(data); onResult(data);
    } catch {
      setError("Connection error — check your API key and backend.");
    } finally { setLoading(false); }
  }

  function switchMode(m) {
    setMode(m); setError(null); setResult(null);
  }

  return (
    <div className="essay-wrap">
      <style>{css}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "#111827" }}>Essay Analysis</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
          Reviewed against <strong style={{ color: "#374151" }}>{profile.school_name || "MIT"}</strong>'s admissions rubric
        </p>
      </div>

      {/* Input panel */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

        {/* Pill tab switcher */}
        <div style={{ marginBottom: 20 }}>
          <div className="tab-switcher">
            <div className={`tab-slider ${mode === "pdf" ? "right" : ""}`} />
            <button className={`tab-btn ${mode === "text" ? "active" : ""}`} onClick={() => switchMode("text")}>
              Paste Text
            </button>
            <button className={`tab-btn ${mode === "pdf" ? "active" : ""}`} onClick={() => switchMode("pdf")}>
              Upload PDF
            </button>
          </div>
        </div>

        {/* Panel content with fade animation */}
        <div className="panel-content" key={mode}>
          {mode === "text" ? (
            <>
              <textarea
                className="essay-ta"
                placeholder="Paste your essay here..."
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: essay.length > 0 && essay.length < 100 ? "#f97316" : "#9ca3af" }}>
                  {essay.length > 0 && essay.length < 100
                    ? `${100 - essay.length} more characters needed`
                    : `${essay.length} characters`}
                </span>
                {essay.length > 0 && (
                  <button onClick={() => setEssay("")}
                    style={{ fontSize: 12, color: "#9ca3af", border: "none", background: "none", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={`drop-zone ${pdf ? "filled" : ""}`}
              onClick={() => document.getElementById("pdf-inp").click()}>
              <input id="pdf-inp" type="file" accept=".pdf" style={{ display: "none" }}
                onChange={(e) => setPdf(e.target.files[0])} />
              {pdf ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{pdf.name}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{(pdf.size / 1024).toFixed(0)} KB · Click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>Drop PDF here or click to browse</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>.pdf files only</div>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#fef2f2", borderLeft: "3px solid #ef4444", borderRadius: 6, fontSize: 13, color: "#991b1b" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="analyze-btn" disabled={loading} onClick={handleSubmit}>
            {loading ? "Analyzing..." : "Analyze Essay"}
          </button>
        </div>
      </div>

      {result && <EssayResult result={result} />}
    </div>
  );
}

function EssayResult({ result }) {
  const scores      = result.scores || {};
  const criteria    = result.criterion_feedback || [];
  const suggestions = result.paragraph_suggestions || [];
  const overall     = scores.overall || 0;
  const ovTag       = scoreTag(overall);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Summary banner */}
      <div style={{ background: "#111827", borderRadius: 12, padding: "24px 28px", display: "flex", gap: 28, alignItems: "center" }}>
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: ovTag.bar, lineHeight: 1 }}>
            {overall}<span style={{ fontSize: 20, color: "#4b5563" }}>/10</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ovTag.bar, marginTop: 6 }}>
            {ovTag.text}
          </div>
        </div>
        <div style={{ width: 1, height: 52, background: "#2d3748", flexShrink: 0 }} />
        <p style={{ margin: 0, color: "#9ca3af", fontSize: 14, lineHeight: 1.7 }}>{result.summary}</p>
      </div>

      {/* Scores */}
      <div className="rcard">
        <div className="rcard-header">Score Breakdown</div>
        {Object.entries(scores).filter(([k]) => k !== "overall").map(([k, v]) => {
          const tag = scoreTag(v);
          return (
            <div className="score-row" key={k}>
              <div style={{ width: 130, fontSize: 13, color: "#374151", flexShrink: 0 }}>
                {SCORE_LABELS[k] || k.replace(/_/g, " ")}
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(v / 10) * 100}%`, background: tag.bar }} />
              </div>
              <div style={{ width: 24, fontSize: 14, fontWeight: 700, color: tag.bar, textAlign: "right", flexShrink: 0 }}>{v}</div>
              <span className="badge" style={{ color: tag.color, background: tag.bg, flexShrink: 0, minWidth: 76, textAlign: "center" }}>{tag.text}</span>
            </div>
          );
        })}
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { title: "Strengths", items: result.strengths || [], dot: "#10b981", hc: "#065f46" },
          { title: "Areas to Improve", items: result.weaknesses || [], dot: "#f97316", hc: "#9a3412" },
        ].map(({ title, items, dot, hc }) => (
          <div className="rcard" key={title}>
            <div className="rcard-header" style={{ color: hc }}>{title}</div>
            <div style={{ padding: "14px 20px" }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 9, fontSize: 13, color: "#374151", lineHeight: 1.55 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 7 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="rcard">
          <div className="rcard-header">Rewrite Suggestions</div>
          {suggestions.map((s, i) => (
            <div className="suggestion-item" key={i}>
              <blockquote className="suggestion-quote">{s.quote}</blockquote>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#ef4444", marginBottom: 5 }}>Issue</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{s.issue}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#10b981", marginBottom: 5 }}>Suggestion</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{s.suggestion}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rubric */}
      {criteria.length > 0 && (
        <div className="rcard">
          <div className="rcard-header">MIT Admissions Rubric</div>
          {criteria.map((c, i) => {
            const tag = scoreTag(c.score);
            return (
              <div className="rubric-row" key={i}>
                <div style={{ flexShrink: 0, textAlign: "center", width: 36 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: tag.bar }}>{c.score}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>/10</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.criterion}</span>
                    <span className="badge" style={{ color: tag.color, background: tag.bg }}>{tag.text}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{c.comment}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clichés */}
      {result.cliche_flags?.length > 0 && (
        <div className="rcard">
          <div className="rcard-header" style={{ color: "#991b1b" }}>Clichés Detected</div>
          <div style={{ padding: "14px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {result.cliche_flags.map((c, i) => (
              <span key={i} style={{ fontSize: 12, color: "#991b1b", background: "#fef2f2", padding: "4px 12px", borderRadius: 99, fontStyle: "italic", border: "1px solid #fecaca" }}>
                "{c}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}