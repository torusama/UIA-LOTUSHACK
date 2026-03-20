const FIELDS = [
  { key: "name",        placeholder: "Tên (e.g. Alex)" },
  { key: "gpa",         placeholder: "GPA (e.g. 3.8)" },
  { key: "major",       placeholder: "Major (e.g. CS)" },
  { key: "school_name", placeholder: "Trường (e.g. MIT)" },
];

export function ProfileBar({ profile, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 10, flexWrap: "wrap",
      background: "white", padding: "12px 16px",
      borderRadius: 10, border: "1px solid #e5e7eb",
      marginBottom: 24,
    }}>
      <span style={{ fontSize: 13, color: "#6b7280", alignSelf: "center", whiteSpace: "nowrap" }}>
        Hồ sơ:
      </span>
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
  );
}
