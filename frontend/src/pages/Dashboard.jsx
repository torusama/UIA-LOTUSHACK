import { useState } from "react";
import { scoreProfile } from "../api/client";
import { ScoreBar } from "../components/ScoreDisplay";
import { Button, Tag } from "../components/Button";

export default function Dashboard({ profile, essayScore, interviewScore }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleCalculate() {
    setLoading(true); setError(null);
    try {
      const data = await scoreProfile(profile.school_name || "MIT", profile, essayScore, interviewScore);
      setResult(data);
    } catch {
      setError("Lỗi khi tính điểm. Kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 style={{ marginBottom: 16 }}>Admission Dashboard — {profile.school_name || "MIT"}</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Tag color={essayScore ? "#dcfce7" : "#f3f4f6"} textColor={essayScore ? "#15803d" : "#6b7280"}>
          {essayScore ? "✓" : "○"} Essay
        </Tag>
        <Tag color={interviewScore ? "#dcfce7" : "#f3f4f6"} textColor={interviewScore ? "#15803d" : "#6b7280"}>
          {interviewScore ? "✓" : "○"} Interview
        </Tag>
      </div>

      {(!essayScore || !interviewScore) && (
        <div style={{ background: "#fef9c3", borderRadius: 10, padding: 14, marginBottom: 20, color: "#78350f", fontSize: 14 }}>
          ⚠️ Hoàn thành Essay và Interview để có kết quả chính xác nhất.
        </div>
      )}

      <Button onClick={handleCalculate} disabled={loading}>
        {loading ? "Đang tính..." : "Tính tỷ lệ đậu"}
      </Button>

      {error && <p style={{ color: "#dc2626", marginTop: 10, fontSize: 14 }}>{error}</p>}
      {result && <AdmissionResult data={result} essayScore={essayScore} interviewScore={interviewScore} />}
    </section>
  );
}

function AdmissionResult({ data, essayScore, interviewScore }) {
  const tierConfig = {
    reach:  { bg: "#fee2e2", text: "#dc2626" },
    match:  { bg: "#fef9c3", text: "#92400e" },
    safety: { bg: "#dcfce7", text: "#15803d" },
  };
  const tc = tierConfig[data.tier || "reach"];

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#1e40af", lineHeight: 1 }}>
            {data.estimated_probability}%
          </div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Xác suất trúng tuyển ước tính</div>
        </div>
        <span style={{ background: tc.bg, color: tc.text, padding: "6px 18px", borderRadius: 20, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
          {(data.tier || "reach").toUpperCase()}
        </span>
      </div>

      <h3 style={{ marginBottom: 14 }}>Điểm từng hạng mục</h3>
      {Object.entries(data.component_scores || {}).map(([k, v]) => (
        <ScoreBar key={k} label={k.replace(/_/g, " ")} value={v} />
      ))}

      {essayScore?.scores && <Breakdown title="Essay — chi tiết" scores={essayScore.scores} max={10} />}
      {interviewScore?.dimension_scores && <Breakdown title="Interview — chi tiết" scores={interviewScore.dimension_scores} max={10} />}

      <ActionPlan essayScore={essayScore} interviewScore={interviewScore} />

      {data.note && <p style={{ marginTop: 16, color: "#9ca3af", fontSize: 12 }}>* {data.note}</p>}
    </div>
  );
}

function Breakdown({ title, scores, max }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Object.entries(scores).map(([k, v]) => (
          <div key={k} style={{ background: "#f3f4f6", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{v}/{max}</div>
            <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize", marginTop: 2 }}>
              {k.replace(/_/g, " ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionPlan({ essayScore, interviewScore }) {
  const actions = [
    ...(essayScore?.weaknesses || []).map((w) => ({ icon: "📝", text: w, from: "Essay" })),
    ...(interviewScore?.improvement_tips || []).map((t) => ({ icon: "🎤", text: t, from: "Interview" })),
  ];
  if (!actions.length) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ marginBottom: 12 }}>Action Plan</h3>
      {actions.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 18 }}>{a.icon}</span>
          <div style={{ fontSize: 14 }}>
            <Tag color="#e5e7eb" textColor="#374151">{a.from}</Tag>{" "}{a.text}
          </div>
        </div>
      ))}
    </div>
  );
}
