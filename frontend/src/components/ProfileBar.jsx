const FIELDS = [
  { key: "name",        placeholder: "Tên (e.g. Alex)" },
  { key: "gpa",         placeholder: "GPA (e.g. 3.8)" },
  { key: "sat",         placeholder: "SAT (e.g. 1480)" },
  { key: "ielts",       placeholder: "IELTS (e.g. 7.5)" },
  { key: "act",         placeholder: "ACT (e.g. 33)" },
  { key: "major",       placeholder: "Major (e.g. CS)" },
  { key: "school_name", placeholder: "Trường (e.g. MIT)" },
];

export function ProfileBar({ profile, onChange }) {
  return (
    <div style={{
      background: "white", padding: "14px 16px",
      borderRadius: 10, border: "1px solid #e5e7eb",
      marginBottom: 24,
    }}>
      <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 10 }}>
        HỒ SƠ HỌC SINH
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FIELDS.map(({ key, placeholder }) => (
          <input
            key={key}
            placeholder={placeholder}
            value={profile[key] || ""}
            onChange={(e) => onChange({ ...profile, [key]: e.target.value })}
            style={{
              padding: "7px 12px", borderRadius: 8,
              border: "1px solid #d1d5db", fontSize: 13, flex: 1, minWidth: 110,
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <textarea
          placeholder="Hoạt động ngoại khóa, giải thưởng, leadership... (e.g. President of Robotics Club, won national math olympiad, research intern at VinAI)"
          value={profile.activities || ""}
          onChange={(e) => onChange({ ...profile, activities: e.target.value })}
          rows={2}
          style={{
            width: "100%", padding: "7px 12px", borderRadius: 8,
            border: "1px solid #d1d5db", fontSize: 13, resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}