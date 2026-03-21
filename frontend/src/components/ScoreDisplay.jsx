export function scoreColor(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.8) return "#16a34a";
  if (pct >= 0.6) return "#ca8a04";
  return "#dc2626";
}

export function scoreLabel(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.8) return { text: "Tốt",      bg: "#f0fdf4", color: "#16a34a" };
  if (pct >= 0.6) return { text: "Ổn",        bg: "#fefce8", color: "#ca8a04" };
  if (pct >= 0.4) return { text: "Trung bình", bg: "#fff7ed", color: "#ea580c" };
  return             { text: "Cần cải thiện", bg: "#fef2f2", color: "#dc2626" };
}

export function ScorePill({ label, score, max = 10 }) {
  const { text, bg, color } = scoreLabel(score, max);
  return (
    <div style={{
      background: bg, borderRadius: 10,
      padding: "10px 16px", textAlign: "center", minWidth: 120,
      border: `1px solid ${color}22`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{text}</div>
      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize", marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, max = 100 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, textTransform: "capitalize" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: scoreColor(value, max) }}>
          {scoreLabel(value, max).text}
        </span>
      </div>
      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 8 }}>
        <div style={{
          width: `${pct}%`, height: 8, borderRadius: 99,
          background: scoreColor(value, max),
          transition: "width 0.6s",
        }} />
      </div>
    </div>
  );
}