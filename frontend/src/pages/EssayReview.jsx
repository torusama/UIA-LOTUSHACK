import { useState } from "react";
import { reviewEssay, reviewEssayPdf } from "../api/client";

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
      bg: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
      bar: "#34d399",
      glow: "0 0 12px rgba(52,211,153,0.45), 0 2px 8px rgba(52,211,153,0.2)",
      badgeBg: "#d1fae5",
      badgeGlow: "0 0 8px rgba(52,211,153,0.5)",
    };
  if (pct >= 0.6)
    return {
      text: "Good",
      color: "#854d0e",
      bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
      bar: "#fbbf24",
      glow: "0 0 12px rgba(251,191,36,0.45), 0 2px 8px rgba(251,191,36,0.2)",
      badgeBg: "#fef3c7",
      badgeGlow: "0 0 8px rgba(251,191,36,0.5)",
    };
  if (pct >= 0.4)
    return {
      text: "Average",
      color: "#9a3412",
      bg: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
      bar: "#fb923c",
      glow: "0 0 12px rgba(251,146,60,0.45), 0 2px 8px rgba(251,146,60,0.2)",
      badgeBg: "#ffedd5",
      badgeGlow: "0 0 8px rgba(251,146,60,0.5)",
    };
  return {
    text: "Needs Work",
    color: "#991b1b",
    bg: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    bar: "#f87171",
    glow: "0 0 12px rgba(248,113,113,0.45), 0 2px 8px rgba(248,113,113,0.2)",
    badgeBg: "#fee2e2",
    badgeGlow: "0 0 8px rgba(248,113,113,0.5)",
  };
}

/**
 * Clean raw PDF text:
 * - Collapse single newlines (PDF line-wrap) → space
 * - Keep double newlines as paragraph breaks
 */
function cleanPdfText(raw) {
  if (!raw) return "";
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/([^\n])\n([^\n])/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/^ +| +$/gm, "")
    .trim();
}

/**
 * Same but protects @@highlight@@ markers from being mangled.
 */
function cleanHighlightedText(raw) {
  if (!raw) return "";
  const placeholders = [];
  const protected_ = raw.replace(/@@[^@]+@@/g, (match) => {
    placeholders.push(match);
    return `\x00HL${placeholders.length - 1}\x00`;
  });
  const cleaned = cleanPdfText(protected_);
  return cleaned.replace(/\x00HL(\d+)\x00/g, (_, i) => placeholders[+i]);
}

/**
 * Split text into paragraphs.
 * - If the text already has \n\n, use those.
 * - Otherwise auto-split: every ~4 sentences, break at a sentence boundary.
 */
function splitIntoParagraphs(text) {
  // If there are already paragraph breaks, use them
  if (text.includes("\n\n")) {
    return text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // Auto-split: split on sentence-ending punctuation followed by space + capital letter
  // Group into chunks of ~4 sentences
  const sentenceBreaks = [];
  const re = /([.!?]["'»]?)\s+(?=[A-Z])/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    sentenceBreaks.push(match.index + match[1].length);
  }

  if (sentenceBreaks.length === 0) return [text];

  const SENTENCES_PER_PARA = 4;
  const paragraphs = [];
  let start = 0;
  let sentCount = 0;

  for (let i = 0; i < sentenceBreaks.length; i++) {
    sentCount++;
    if (sentCount >= SENTENCES_PER_PARA) {
      const breakPos = sentenceBreaks[i];
      paragraphs.push(text.slice(start, breakPos).trim());
      start = breakPos;
      // skip leading space
      while (start < text.length && text[start] === " ") start++;
      sentCount = 0;
    }
  }
  // Push the remaining text
  if (start < text.length) {
    paragraphs.push(text.slice(start).trim());
  }

  return paragraphs.filter(Boolean);
}

const css = `
  .ew * { box-sizing: border-box; }

  .tab-sw { display:inline-flex; position:relative; background:#f3f4f6; border-radius:10px; padding:4px; }
  .tab-sl {
    position:absolute; top:4px; bottom:4px; width:calc(50% - 4px);
    background:white; border-radius:7px; box-shadow:0 1px 4px rgba(0,0,0,.1);
    transition:transform .25s cubic-bezier(.4,0,.2,1);
  }
  .tab-sl.r { transform:translateX(100%); }
  .tab-b {
    position:relative; z-index:1; padding:9px 28px; font-size:13px;
    font-weight:500; border:none; background:none; cursor:pointer;
    color:#9ca3af; border-radius:7px; transition:color .25s;
    white-space:nowrap; font-family:inherit;
  }
  .tab-b.on { color:#111827; font-weight:600; }

  .esstxt {
    width:100%; min-height:220px; padding:16px 18px;
    border:1.5px solid #e5e7eb; border-radius:10px;
    font-size:14px; line-height:1.75; resize:vertical;
    background:white; outline:none; font-family:inherit; color:#111827;
    transition:border-color .2s, box-shadow .2s;
  }
  .esstxt:focus { border-color:#6b7280; box-shadow:0 0 0 3px rgba(107,114,128,.08); }
  .esstxt::placeholder { color:#d1d5db; }

  .dz {
    border:1.5px dashed #d1d5db; border-radius:10px; padding:52px 24px;
    text-align:center; cursor:pointer; background:white;
    transition:border-color .2s, background .2s, box-shadow .2s;
  }
  .dz:hover { border-color:#6b7280; background:#fafafa; box-shadow:0 0 0 3px rgba(107,114,128,.06); }
  .dz.has { border-style:solid; border-color:#374151; }

  .abtn {
    background:#111827; color:white; padding:12px 32px; border:none;
    border-radius:8px; font-size:13px; font-weight:600; letter-spacing:.05em;
    cursor:pointer; font-family:inherit;
    transition:background .2s, transform .12s, box-shadow .2s;
  }
  .abtn:hover:not(:disabled) { background:#1f2937; box-shadow:0 4px 12px rgba(17,24,39,.25); }
  .abtn:active:not(:disabled) { transform:scale(.97); }
  .abtn:disabled { opacity:.4; cursor:not-allowed; }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(5px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up { animation:fadeUp .2s ease; }

  .card { background:white; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
  .card-hd {
    padding:12px 20px; border-bottom:1px solid #f3f4f6;
    font-size:10.5px; font-weight:700; letter-spacing:.1em;
    text-transform:uppercase; color:#9ca3af;
  }
  .srow {
    display:flex; align-items:center; gap:14px; padding:13px 20px;
    border-bottom:1px solid #f9fafb; transition:background .15s;
  }
  .srow:last-child { border-bottom:none; }
  .srow:hover { background:#fafafa; }
  .btrack { flex:1; height:6px; background:#f0f0f0; border-radius:99px; overflow:visible; position:relative; }
  .bfill  { height:100%; border-radius:99px; transition:width 1s cubic-bezier(.4,0,.2,1); }
  .badge {
    font-size:10px; font-weight:700; letter-spacing:.06em;
    text-transform:uppercase; padding:3px 10px; border-radius:99px; white-space:nowrap;
    border:1px solid rgba(255,255,255,0.6);
  }
  .rrow { padding:14px 20px; border-bottom:1px solid #f9fafb; transition:background .15s; }
  .rrow:last-child { border-bottom:none; }
  .rrow:hover { background:#fafafa; }

  /* Essay body */
  .essay-body {
    padding:24px 28px;
    font-size:14.5px;
    line-height:1.95;
    color:#1a1a1a;
    text-align:justify;
    hyphens:auto;
  }
  .essay-para {
    margin:0 0 1.3em;
    text-indent:0;
  }
  .essay-para:last-child { margin-bottom:0; }

  /* Yellow highlight */
  .hl {
    background:#fef08a;
    border-bottom:2px solid #f59e0b;
    border-radius:3px; padding:1px 3px;
    cursor:pointer; transition:background .15s;
  }
  .hl:hover  { background:#fde047; }
  .hl.active { background:#fbbf24; border-bottom-color:#d97706; }

  /* Inline comment card */
  @keyframes cmtIn {
    from { opacity:0; transform:translateY(-4px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .icmt {
    margin:8px 0 18px;
    border:1px solid #e5e7eb; border-radius:10px;
    background:white; box-shadow:0 4px 16px rgba(0,0,0,.08);
    overflow:hidden; animation:cmtIn .18s ease;
    text-align:left;
  }
  .icmt-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:8px 14px; background:#fafafa; border-bottom:1px solid #f3f4f6;
  }
  .icmt-lbl { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#6b7280; }
  .icmt-x {
    width:20px; height:20px; border-radius:50%; border:none; background:#e5e7eb;
    color:#6b7280; font-size:13px; line-height:1; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background .15s;
  }
  .icmt-x:hover { background:#d1d5db; color:#374151; }
  .icmt-body { padding:12px 14px; display:flex; flex-direction:column; gap:10px; }
  .icmt-sec { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; margin-bottom:3px; }
  .icmt-txt { font-size:13px; color:#374151; line-height:1.6; margin:0; }
  .cmt-nav-btn {
    flex:1; padding:6px; border:1px solid #e5e7eb; border-radius:6px;
    background:white; font-size:12px; cursor:pointer; color:#374151;
    font-family:inherit; transition:background .15s;
  }
  .cmt-nav-btn:hover:not(:disabled) { background:#f3f4f6; }
  .cmt-nav-btn:disabled { opacity:.35; cursor:not-allowed; }

  .hint-pill {
    display:inline-flex; align-items:center; gap:10px;
    background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    border:1.5px solid #fde68a; border-radius:12px;
    padding:10px 16px; font-size:12.5px; color:#92400e;
    font-weight:600; margin-bottom:20px; text-align:left;
    box-shadow:0 2px 8px rgba(245,158,11,.15);
  }
  .hint-dot {
    display:inline-flex; align-items:center; justify-content:center;
    width:26px; height:26px; border-radius:8px; flex-shrink:0;
    background:linear-gradient(135deg,#fbbf24,#f59e0b);
    box-shadow:0 2px 6px rgba(245,158,11,.4);
    font-size:13px;
  }
`;

/* ════════════════════════════════════════════════════ */
export default function EssayReview({ profile, onResult }) {
  const [mode, setMode] = useState("text");
  const [essay, setEssay] = useState("");
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const prof = {
        ...profile,
        activities:
          typeof profile.activities === "string"
            ? profile.activities
                .split(",")
                .map((a) => a.trim())
                .filter(Boolean)
            : profile.activities || [],
      };
      let data;
      if (mode === "pdf") {
        if (!pdf) {
          setError("Please select a PDF file.");
          setLoading(false);
          return;
        }
        data = await reviewEssayPdf(pdf, profile.school_name || "MIT", prof);
      } else {
        if (essay.trim().length < 100) {
          setError("Minimum 100 characters required.");
          setLoading(false);
          return;
        }
        data = await reviewEssay(essay, profile.school_name || "MIT", prof);
      }
      setResult(data);
      onResult(data);
    } catch {
      setError("Connection error — check your API key and backend.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError(null);
    setResult(null);
  }

  return (
    <div className="ew">
      <style>{css}</style>

      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: "0 0 6px",
            fontSize: 22,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          Essay Analysis
        </h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
          Reviewed against{" "}
          <strong style={{ color: "#374151" }}>
            {profile.school_name || "MIT"}
          </strong>
          's admissions rubric
        </p>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
          boxShadow: "0 1px 6px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div className="tab-sw">
            <div className={`tab-sl ${mode === "pdf" ? "r" : ""}`} />
            <button
              className={`tab-b ${mode === "text" ? "on" : ""}`}
              onClick={() => switchMode("text")}
            >
              Paste Text
            </button>
            <button
              className={`tab-b ${mode === "pdf" ? "on" : ""}`}
              onClick={() => switchMode("pdf")}
            >
              Upload PDF
            </button>
          </div>
        </div>

        <div className="fade-up" key={mode}>
          {mode === "text" ? (
            <textarea
              className="esstxt"
              placeholder="Paste your essay here (minimum 100 characters)…"
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
            />
          ) : (
            <div
              className={`dz ${pdf ? "has" : ""}`}
              onClick={() => document.getElementById("_pdfin_").click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f?.type === "application/pdf") setPdf(f);
              }}
            >
              <input
                id="_pdfin_"
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => setPdf(e.target.files[0] || null)}
              />
              {pdf ? (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {pdf.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    {(pdf.size / 1024).toFixed(0)} KB · Click to change
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: 4,
                    }}
                  >
                    Drop PDF here or click to browse
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>
                    .pdf files only
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "#fef2f2",
              borderLeft: "3px solid #ef4444",
              borderRadius: 6,
              fontSize: 13,
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <button className="abtn" disabled={loading} onClick={handleSubmit}>
            {loading ? "Analyzing…" : "Analyze Essay"}
          </button>
        </div>
      </div>

      {result && (
        <EssayResult
          result={result}
          schoolName={profile.school_name || "MIT"}
        />
      )}
    </div>
  );
}

/* ─── Highlighted essay with inline popover comments ─── */
function HighlightedEssay({ fullEssay, suggestions }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (!fullEssay) {
    return (
      <div
        style={{
          padding: "16px 20px",
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
                padding: "5px 10px",
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
    );
  }

  // 1. Clean text (fix PDF artifacts, protect markers)
  const cleaned = cleanHighlightedText(fullEssay);

  // 2. Split into paragraphs smartly
  const paragraphs = splitIntoParagraphs(cleaned);

  // 3. Parse @@highlight@@ inside each paragraph
  let hIdx = 0;
  const parsedParas = paragraphs.map((para) => {
    return para.split(/(@@[^@]+@@)/g).map((part) => {
      if (part.startsWith("@@") && part.endsWith("@@"))
        return { type: "hl", text: part.slice(2, -2), idx: hIdx++ };
      return { type: "plain", text: part };
    });
  });
  const totalHL = hIdx;

  return (
    <div className="essay-body">
      {totalHL > 0 && (
        <div className="hint-pill">
          <span className="hint-dot">✏️</span>
          <span>
            <strong>
              {totalHL} section{totalHL !== 1 ? "s" : ""}
            </strong>{" "}
            marked for revision
            <span style={{ fontWeight: 400, opacity: 0.8 }}>
              {" "}
              — click the highlighted text to view feedback
            </span>
          </span>
        </div>
      )}

      {parsedParas.map((parts, gi) => {
        const paraHasOpen = parts.some(
          (s) => s.type === "hl" && s.idx === openIdx,
        );
        return (
          <div key={gi}>
            <p className="essay-para">
              {parts.map((seg, si) => {
                if (seg.type === "plain")
                  return <span key={si}>{seg.text}</span>;
                const isOpen = openIdx === seg.idx;
                return (
                  <span
                    key={si}
                    className={`hl${isOpen ? " active" : ""}`}
                    onClick={() => setOpenIdx(isOpen ? null : seg.idx)}
                    title="Click to view feedback"
                  >
                    {seg.text}
                  </span>
                );
              })}
            </p>

            {paraHasOpen && openIdx !== null && suggestions[openIdx] && (
              <div className="icmt">
                <div className="icmt-head">
                  <span className="icmt-lbl">
                    Comment {openIdx + 1} of {totalHL}
                  </span>
                  <button className="icmt-x" onClick={() => setOpenIdx(null)}>
                    ×
                  </button>
                </div>
                <div className="icmt-body">
                  <div
                    style={{
                      background: "#fffbeb",
                      borderLeft: "3px solid #f59e0b",
                      borderRadius: "0 6px 6px 0",
                      padding: "6px 12px",
                      fontSize: 13,
                      fontStyle: "italic",
                      color: "#92400e",
                      lineHeight: 1.55,
                    }}
                  >
                    "{suggestions[openIdx].quote}"
                  </div>
                  <div>
                    <div className="icmt-sec" style={{ color: "#dc2626" }}>
                      Issue
                    </div>
                    <p className="icmt-txt">{suggestions[openIdx].issue}</p>
                  </div>
                  <div>
                    <div className="icmt-sec" style={{ color: "#059669" }}>
                      Suggestion
                    </div>
                    <p className="icmt-txt">
                      {suggestions[openIdx].suggestion}
                    </p>
                  </div>
                  {totalHL > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        paddingTop: 8,
                        borderTop: "1px solid #f3f4f6",
                      }}
                    >
                      <button
                        className="cmt-nav-btn"
                        onClick={() => setOpenIdx((i) => Math.max(0, i - 1))}
                        disabled={openIdx === 0}
                      >
                        ← Previous
                      </button>
                      <button
                        className="cmt-nav-btn"
                        onClick={() =>
                          setOpenIdx((i) => Math.min(totalHL - 1, i + 1))
                        }
                        disabled={openIdx === totalHL - 1}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Full result layout ─── */
function EssayResult({ result, schoolName }) {
  const scores = result.scores || {};
  const criteria = result.criterion_feedback || [];
  const suggestions = result.paragraph_suggestions || [];
  const overall = scores.overall || 0;
  const ovTag = scoreTag(overall);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #bfdbfe 100%)",
          borderRadius: 14,
          padding: "24px 28px",
          display: "flex",
          gap: 28,
          alignItems: "center",
          boxShadow:
            "0 8px 32px rgba(139,92,246,0.15), 0 0 0 1px rgba(196,181,253,0.4)",
          border: "1px solid rgba(196,181,253,0.5)",
        }}
      >
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: ovTag.bar,
              lineHeight: 1,
              textShadow: ovTag.glow,
            }}
          >
            {ovTag.text}
          </div>
        </div>
        <div
          style={{
            width: 1,
            height: 52,
            background: "rgba(139,92,246,0.2)",
            flexShrink: 0,
          }}
        />
        <p
          style={{ margin: 0, color: "#4c1d95", fontSize: 14, lineHeight: 1.7 }}
        >
          {result.summary}
        </p>
      </div>

      {/* Score breakdown */}
      <div className="card">
        <div className="card-hd">Score Breakdown</div>
        {Object.entries(scores)
          .filter(([k]) => k !== "overall")
          .map(([k, v]) => {
            const tag = scoreTag(v);
            return (
              <div className="srow" key={k}>
                <div
                  style={{
                    width: 140,
                    fontSize: 13,
                    color: "#374151",
                    flexShrink: 0,
                  }}
                >
                  {SCORE_LABELS[k] || k.replace(/_/g, " ")}
                </div>
                <div className="btrack">
                  <div
                    className="bfill"
                    style={{
                      width: `${(v / 10) * 100}%`,
                      background: tag.bar,
                      boxShadow: tag.glow,
                    }}
                  />
                </div>
                <span
                  className="badge"
                  style={{
                    color: tag.color,
                    background: tag.badgeBg,
                    boxShadow: tag.badgeGlow,
                  }}
                >
                  {tag.text}
                </span>
              </div>
            );
          })}
      </div>

      {/* Strengths + Weaknesses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          {
            title: "Strengths",
            items: result.strengths || [],
            dot: "#34d399",
            hc: "#065f46",
            dotGlow: "0 0 6px rgba(52,211,153,0.7)",
          },
          {
            title: "Areas to Improve",
            items: result.weaknesses || [],
            dot: "#fb923c",
            hc: "#9a3412",
            dotGlow: "0 0 6px rgba(251,146,60,0.7)",
          },
        ].map(({ title, items, dot, hc, dotGlow }) => (
          <div className="card" key={title}>
            <div className="card-hd" style={{ color: hc }}>
              {title}
            </div>
            <div style={{ padding: "14px 20px" }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 9,
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: dot,
                      flexShrink: 0,
                      marginTop: 6,
                      boxShadow: dotGlow,
                    }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Essay with highlights */}
      {suggestions.length > 0 && (
        <div className="card">
          <div className="card-hd">Essay with Suggested Edits</div>
          <HighlightedEssay
            fullEssay={result.full_essay_with_highlights}
            suggestions={suggestions}
          />
        </div>
      )}

      {/* Rubric — single badge */}
      {criteria.length > 0 && (
        <div className="card">
          <div className="card-hd">{schoolName} Admissions Rubric</div>
          {criteria.map((c, i) => {
            const tag = scoreTag(c.score);
            return (
              <div className="rrow" key={i}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    {SCORE_LABELS[c.criterion] ||
                      c.criterion
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span
                    className="badge"
                    style={{
                      color: tag.color,
                      background: tag.badgeBg,
                      boxShadow: tag.badgeGlow,
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

      {/* Clichés */}
      {result.cliche_flags?.length > 0 && (
        <div className="card">
          <div className="card-hd" style={{ color: "#be185d" }}>
            Clichés Detected
          </div>
          <div
            style={{
              padding: "14px 20px",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {result.cliche_flags.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  color: "#be185d",
                  background:
                    "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                  padding: "4px 12px",
                  borderRadius: 99,
                  fontStyle: "italic",
                  border: "1px solid #f9a8d4",
                  boxShadow: "0 0 8px rgba(190,24,93,0.15)",
                }}
              >
                "{typeof c === "string" ? c : c.phrase}"
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
