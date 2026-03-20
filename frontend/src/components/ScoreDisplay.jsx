export function scoreColor(score, max = 10) {
  const pct = score / max;
  if (pct >= 0.8) return "#16a34a";
  if (pct >= 0.6) return "#ca8a04";
  return "#dc2626";
}

export function ScorePill({ label, score, max = 10 }) {
  return (
    <div style={{
      background: "#f3f4f6", borderRadius: 10,
      padding: "10px 16px", textAlign: "center", minWidth: 110,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: scoreColor(score, max) }}>
        {score}/{max}
      </div>
      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize", marginTop: 2 }}>
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
        <span style={{ fontWeight: 600 }}>{value}/{max}</span>
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
