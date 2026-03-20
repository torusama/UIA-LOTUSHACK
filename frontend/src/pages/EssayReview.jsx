import { useState } from "react";
import { reviewEssay } from "../api/client";
import { ScorePill, scoreColor } from "../components/ScoreDisplay";
import { Button } from "../components/Button";

export default function EssayReview({ profile, onResult }) {
  const [essayText, setEssayText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);

  async function handleSubmit() {
    if (essayText.trim().length < 100) { setError("Nhập tối thiểu 100 ký tự."); return; }
    setLoading(true); setError(null);
    try {
      const data = await reviewEssay(essayText, profile.school_name || "MIT", profile);
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

      <textarea
        rows={12}
        placeholder="Dán essay vào đây..."
        value={essayText}
        onChange={(e) => setEssayText(e.target.value)}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Đang phân tích..." : "Phân tích Essay"}
        </Button>
        <span style={{ color: "#9ca3af", fontSize: 13 }}>{essayText.length} ký tự</span>
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
      <h3 style={{ marginBottom: 12 }}>Điểm tổng quan</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(scores).map(([k, v]) => (
          <ScorePill key={k} label={k.replace(/_/g, " ")} score={v} />
        ))}
      </div>

      {result.summary && (
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 14 }}>
          <strong>Tóm tắt:</strong> {result.summary}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Card bg="#f0fdf4" title="✅ Điểm mạnh" titleColor="#15803d" items={result.strengths} />
        <Card bg="#fff7ed" title="⚠️ Cần cải thiện" titleColor="#c2410c" items={result.weaknesses} />
      </div>

      {criteria.length > 0 && (
        <>
          <h3 style={{ marginBottom: 12 }}>Rubric chi tiết</h3>
          {criteria.map((c, i) => (
            <div key={i} style={{ borderLeft: `4px solid ${scoreColor(c.score)}`, paddingLeft: 14, marginBottom: 14 }}>
              <strong>{c.criterion}</strong>
              <span style={{ marginLeft: 8, color: scoreColor(c.score), fontWeight: 600 }}>{c.score}/10</span>
              <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13 }}>{c.comment}</p>
            </div>
          ))}
        </>
      )}

      {suggestions.length > 0 && (
        <>
          <h3 style={{ margin: "24px 0 12px" }}>Gợi ý sửa cụ thể</h3>
          {suggestions.map((s, i) => (
            <div key={i} style={{ background: "#fef9c3", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 13 }}>
              <p style={{ fontStyle: "italic", color: "#78350f", marginBottom: 6 }}>"{s.quote}"</p>
              <p style={{ marginBottom: 4 }}><strong>Vấn đề:</strong> {s.issue}</p>
              <p><strong>Gợi ý:</strong> {s.suggestion}</p>
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
