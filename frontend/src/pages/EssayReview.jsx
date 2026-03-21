import { useState } from "react";
import { reviewEssay, reviewEssayPdf } from "../api/client";
import { ScorePill, scoreColor, scoreLabel } from "../components/ScoreDisplay";
import { Button } from "../components/Button";

export default function EssayReview({ profile, onResult }) {
  const [mode, setMode]           = useState("text");
  const [essayText, setEssayText] = useState("");
  const [pdfFile, setPdfFile]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  async function handleSubmit() {
    setLoading(true); setError(null);
    try {
      const cleanProfile = {
        ...profile,
        activities: typeof profile.activities === "string"
          ? profile.activities.split(",").map(a => a.trim()).filter(Boolean)
          : profile.activities || [],
      };

      let data;
      if (mode === "pdf") {
        if (!pdfFile) { setError("Vui lòng chọn file PDF."); setLoading(false); return; }
        data = await reviewEssayPdf(pdfFile, profile.school_name || "MIT", cleanProfile);
      } else {
        if (essayText.trim().length < 100) { setError("Nhập tối thiểu 100 ký tự."); setLoading(false); return; }
        data = await reviewEssay(essayText, profile.school_name || "MIT", cleanProfile);
      }

      setResult(data);
      onResult(data);
    } catch {
      setError("Lỗi kết nối API. Kiểm tra API key và backend đang chạy.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>Essay Analysis — {profile.school_name || "MIT"}</h2>

      {/* Tab chọn Text / PDF */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["text", "pdf"].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setResult(null); }}
            style={{
              padding: "7px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13,
              border: mode === m ? "none" : "1px solid #d1d5db",
              background: mode === m ? "#2563eb" : "white",
              color: mode === m ? "white" : "#374151",
              fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === "text" ? "📝 Dán text" : "📄 Upload PDF"}
          </button>
        ))}
      </div>

      {/* Input */}
      {mode === "text" ? (
        <textarea
          rows={12}
          placeholder="Dán essay vào đây..."
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" }}
        />
      ) : (
        <div
          style={{ border: "2px dashed #93c5fd", borderRadius: 10, padding: 32, textAlign: "center", background: "#eff6ff", cursor: "pointer" }}
          onClick={() => document.getElementById("pdf-input").click()}
        >
          <input id="pdf-input" type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setPdfFile(e.target.files[0])} />
          {pdfFile
            ? <p style={{ color: "#1d4ed8", fontWeight: 600 }}>📄 {pdfFile.name}</p>
            : <>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📄</p>
                <p style={{ color: "#3b82f6", fontWeight: 600 }}>Click để chọn file PDF</p>
                <p style={{ color: "#93c5fd", fontSize: 12, marginTop: 4 }}>Chỉ chấp nhận file .pdf</p>
              </>
          }
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang phân tích..." : "Phân tích Essay"}
        </Button>
        {mode === "text" && <span style={{ color: "#9ca3af", fontSize: 13 }}>{essayText.length} ký tự</span>}
      </div>

      {error && <p style={{ color: "#dc2626", marginTop: 8, fontSize: 14 }}>{error}</p>}
      {result && <EssayResult result={result} />}
    </section>
  );
}

function EssayResult({ result }) {
  const scores      = result.scores || {};
  const criteria    = result.criterion_feedback || [];
  const suggestions = result.paragraph_suggestions || [];

  return (
    <div style={{ marginTop: 32 }}>

      {/* 1. Điểm tổng quan — label thay số */}
      <h3 style={{ marginBottom: 12 }}>Điểm tổng quan</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(scores).map(([k, v]) => (
          <ScorePill key={k} label={k.replace(/_/g, " ")} score={v} />
        ))}
      </div>

      {/* 2. Tóm tắt */}
      {result.summary && (
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 14 }}>
          <strong>Tóm tắt:</strong> {result.summary}
        </div>
      )}

      {/* 3. Câu cần sửa ← lên trên */}
      {suggestions.length > 0 && (
        <>
          <h3 style={{ margin: "0 0 12px" }}>✏️ Câu cần sửa + gợi ý thay thế</h3>
          {suggestions.map((s, i) => (
            <div key={i} style={{ background: "#fef9c3", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13 }}>
              <div style={{
                fontStyle: "italic", color: "#78350f", marginBottom: 8,
                padding: "8px 12px", background: "#fde68a", borderRadius: 6,
                borderLeft: "3px solid #f59e0b"
              }}>
                ❝ {s.quote} ❞
              </div>
              <p style={{ marginBottom: 6 }}>
                <strong style={{ color: "#dc2626" }}>⚠️ Vấn đề:</strong> {s.issue}
              </p>
              <p style={{ color: "#15803d" }}>
                <strong>✅ Gợi ý:</strong> {s.suggestion}
              </p>
            </div>
          ))}
        </>
      )}

      {/* 4. Điểm mạnh / Điểm yếu */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "20px 0" }}>
        <Card bg="#f0fdf4" title="✅ Điểm mạnh" titleColor="#15803d" items={result.strengths} />
        <Card bg="#fff7ed" title="⚠️ Cần cải thiện" titleColor="#c2410c" items={result.weaknesses} />
      </div>

      {/* 5. Rubric chi tiết */}
      {criteria.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>📋 Đánh giá chi tiết theo rubric</h3>
          {criteria.map((c, i) => (
            <div key={i} style={{ borderLeft: `4px solid ${scoreColor(c.score)}`, paddingLeft: 14, marginBottom: 14 }}>
              <strong>{c.criterion}</strong>
              <span style={{
                marginLeft: 8, fontSize: 12, fontWeight: 600,
                color: scoreLabel(c.score).color,
                background: scoreLabel(c.score).bg,
                padding: "2px 8px", borderRadius: 99,
              }}>
                {scoreLabel(c.score).text}
              </span>
              <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13 }}>{c.comment}</p>
            </div>
          ))}
        </>
      )}

    </div>
  );
}

function Card({ bg, title, titleColor, items = [] }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: 16 }}>
      <strong style={{ color: titleColor }}>{title}</strong>
      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
        {items.map((item, i) => <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{item}</li>)}
      </ul>
    </div>
  );
}