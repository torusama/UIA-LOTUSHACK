import { useState } from "react";
import { scoreProfile, matchScholarships, getExecutiveSummary } from "../api/client";
import { ScoreBar } from "../components/ScoreDisplay";
import { Button, Tag } from "../components/Button";

export default function Dashboard({ profile, essayScore, interviewScore }) {
  const [summary, setSummary]         = useState(null);
  const [scoreResult, setScoreResult] = useState(null);
  const [scholarships, setScholarships] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  async function handleAnalyze() {
    setLoading(true); setError(null);
    try {
      const school = profile.school_name || "MIT";
      const [scoreData, scholarData, summaryData] = await Promise.all([
        scoreProfile(school, profile, essayScore, interviewScore),
        matchScholarships(school, profile, essayScore),
        getExecutiveSummary(school, profile, essayScore, interviewScore),
      ]);
      setScoreResult(scoreData);
      setScholarships(scholarData);
      setSummary(summaryData);
    } catch (e) {
      setError("Lỗi kết nối. Kiểm tra backend đang chạy.");
    } finally {
      setLoading(false);
    }
  }

  const school = profile.school_name || "MIT";

  return (
    <section>
      <h2 style={{ marginBottom: 6 }}>Admission Dashboard — {school}</h2>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
        Điền đầy đủ hồ sơ ở trên, hoàn thành Essay & Interview để có kết quả chính xác nhất.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Tag color={essayScore ? "#dcfce7" : "#f3f4f6"} textColor={essayScore ? "#15803d" : "#6b7280"}>
          {essayScore ? "✓" : "○"} Essay
        </Tag>
        <Tag color={interviewScore ? "#dcfce7" : "#f3f4f6"} textColor={interviewScore ? "#15803d" : "#6b7280"}>
          {interviewScore ? "✓" : "○"} Interview
        </Tag>
      </div>

      <Button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Đang phân tích toàn bộ hồ sơ..." : "🔍 Phân tích hồ sơ"}
      </Button>

      {error && <p style={{ color: "#dc2626", marginTop: 10, fontSize: 14 }}>{error}</p>}

      {summary && <ExecutiveSummary data={summary} school={school} />}
      {scoreResult && <ScoreSection data={scoreResult} essayScore={essayScore} interviewScore={interviewScore} />}
      {scholarships && <ScholarshipSection data={scholarships} />}
    </section>
  );
}

// ── Executive Summary ──────────────────────────────────────────────────────
function ExecutiveSummary({ data, school }) {
  const verdictConfig = {
    Reach:  { bg: "#fee2e2", color: "#dc2626" },
    Match:  { bg: "#fef9c3", color: "#92400e" },
    Safety: { bg: "#dcfce7", color: "#15803d" },
  };
  const vc = verdictConfig[data.verdict] || verdictConfig["Reach"];

  return (
    <div style={{ background: "#f8faff", border: "2px solid #bfdbfe", borderRadius: 14, padding: 24, marginTop: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#1e40af" }}>📋 Executive Summary</h2>
        <span style={{ background: vc.bg, color: vc.color, padding: "4px 16px", borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
          {data.verdict}
        </span>
        <span style={{ background: "#f3f4f6", color: "#374151", padding: "4px 16px", borderRadius: 20, fontWeight: 600, fontSize: 14 }}>
          {data.overall_strength}
        </span>
      </div>

      {data.top_insights && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>🔑 Key Insights</div>
          {data.top_insights.map((insight, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 14 }}>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>→</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {data.biggest_strength && (
          <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#15803d", marginBottom: 6 }}>✅ Điểm mạnh lớn nhất</div>
            <div style={{ fontSize: 14, color: "#374151" }}>{data.biggest_strength}</div>
          </div>
        )}
        {data.biggest_gap && (
          <div style={{ background: "#fff7ed", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#c2410c", marginBottom: 6 }}>⚠️ Điểm cần cải thiện</div>
            <div style={{ fontSize: 14, color: "#374151" }}>{data.biggest_gap}</div>
          </div>
        )}
      </div>

      {data.recommendation && (
        <div style={{ background: "#eff6ff", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1d4ed8", marginBottom: 6 }}>💡 Chiến lược đề xuất</div>
          <div style={{ fontSize: 14, color: "#374151" }}>{data.recommendation}</div>
        </div>
      )}

      {data.action_plan && data.action_plan.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>📌 Action Plan</div>
          {data.action_plan.map((action, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #e5e7eb", fontSize: 14 }}>
              <span style={{ background: "#1e40af", color: "white", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Score Section ──────────────────────────────────────────────────────────
function ScoreSection({ data, essayScore, interviewScore }) {
  const tierConfig = {
    reach:  { bg: "#fee2e2", text: "#dc2626" },
    match:  { bg: "#fef9c3", text: "#92400e" },
    safety: { bg: "#dcfce7", text: "#15803d" },
  };
  const tc = tierConfig[data.tier || "reach"];

  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ marginBottom: 16 }}>📊 Phân tích chi tiết — {data.school}</h3>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#1e40af", lineHeight: 1 }}>
            {data.estimated_probability}%
          </div>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Xác suất trúng tuyển ước tính (Acceptance rate: {data.acceptance_rate}%)
          </div>
        </div>
        <span style={{ background: tc.bg, color: tc.text, padding: "6px 18px", borderRadius: 20, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
          {(data.tier || "reach").toUpperCase()}
        </span>
      </div>

      <h4 style={{ marginBottom: 12 }}>Điểm từng tiêu chí</h4>
      {data.breakdown && Object.entries(data.breakdown).map(([name, info]) => (
        <div key={name} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{name}</span>
            <span style={{ color: "#6b7280" }}>
              {info.your_value && `Của bạn: ${info.your_value} / Yêu cầu: ${info.required} — `}
              {info.note && `${info.note} — `}
              <strong>{info.score}/100</strong>
            </span>
          </div>
          <ScoreBar label="" value={info.score} />
        </div>
      ))}

      {data.top_gaps && data.top_gaps.length > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 14, marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#c2410c", marginBottom: 8 }}>🚨 Điểm yếu cần cải thiện</div>
          {data.top_gaps.map((gap, i) => (
            <div key={i} style={{ fontSize: 14, marginBottom: 4 }}>• {gap}</div>
          ))}
        </div>
      )}

      {essayScore?.scores && <Breakdown title="Essay — chi tiết" scores={essayScore.scores} max={10} />}
      {interviewScore?.dimension_scores && <Breakdown title="Interview — chi tiết" scores={interviewScore.dimension_scores} max={10} />}
    </div>
  );
}

function Breakdown({ title, scores, max }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h4 style={{ marginBottom: 12 }}>{title}</h4>
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

// ── Scholarships ───────────────────────────────────────────────────────────
function ScholarshipSection({ data }) {
  const potentialColor = (p) => {
    if (p === "Full potential") return { bg: "#dcfce7", color: "#15803d" };
    if (p === "Partial") return { bg: "#fef9c3", color: "#92400e" };
    return { bg: "#f3f4f6", color: "#6b7280" };
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ marginBottom: 6 }}>🏆 Học bổng phù hợp</h3>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>{data.summary}</p>

      {data.school_scholarships?.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12, color: "#374151" }}>Học bổng của trường</h4>
          {data.school_scholarships.map((s, i) => {
            const pc = potentialColor(s.potential);
            return (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.amount}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{s.criteria}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ background: pc.bg, color: pc.color, padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                      {s.potential}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Fit: {s.fit_score}/100</span>
                  </div>
                </div>
                {s.notes?.length > 0 && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
                    {s.notes.map((n, j) => (
                      <span key={j} style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 12, borderRadius: 6, padding: "2px 8px", marginRight: 6 }}>{n}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {data.external_scholarships?.length > 0 && (
        <>
          <h4 style={{ marginTop: 20, marginBottom: 12, color: "#374151" }}>Học bổng bên ngoài</h4>
          {data.external_scholarships.map((s, i) => {
            const pc = potentialColor(s.potential);
            return (
              <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{s.amount}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{s.criteria}</div>
                  </div>
                  <span style={{ background: pc.bg, color: pc.color, padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, alignSelf: "flex-start" }}>
                    {s.potential}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}