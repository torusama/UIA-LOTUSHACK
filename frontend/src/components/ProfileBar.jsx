import { useState } from "react";

const FIELDS = [
  { key: "name",        label: "Họ và tên",   placeholder: "e.g. Nguyen Van A",  type: "text" },
  { key: "gpa",         label: "GPA",          placeholder: "0 – 4.0",            type: "number", min: 0, max: 4.0,  step: 0.01,
    validate: (v) => v < 0 ? "Không thể âm" : v > 4.0 ? "Tối đa 4.0" : null },
  { key: "sat",         label: "SAT",          placeholder: "400 – 1600",         type: "number", min: 400, max: 1600, step: 10,
    validate: (v) => v < 400 ? "Tối thiểu 400" : v > 1600 ? "Tối đa 1600" : null },
  { key: "ielts",       label: "IELTS",        placeholder: "0 – 9.0",            type: "number", min: 0, max: 9.0,  step: 0.5,
    validate: (v) => v < 0 ? "Không thể âm" : v > 9.0 ? "Tối đa 9.0" : null },
  { key: "act",         label: "ACT",          placeholder: "1 – 36",             type: "number", min: 1, max: 36,   step: 1,
    validate: (v) => v < 1 ? "Tối thiểu 1" : v > 36 ? "Tối đa 36" : null },
  { key: "major",       label: "Ngành học",    placeholder: "Computer Science", type: "text", readonly: true },
  { key: "school_name", label: "Trường apply", placeholder: "MIT",               type: "text", readonly: true },
];

const ACTIVITY_CATEGORIES = [
  { id: "academic",     emoji: "🎓", label: "Học thuật",            desc: "Olympiad, cuộc thi học thuật, học bổng" },
  { id: "research",     emoji: "🔬", label: "Nghiên cứu",           desc: "Research project, paper, lab internship" },
  { id: "leadership",   emoji: "👑", label: "Lãnh đạo",             desc: "Chủ nhiệm CLB, ban cán sự, captain đội" },
  { id: "volunteer",    emoji: "🤝", label: "Thiện nguyện",         desc: "Tình nguyện, cộng đồng, NGO" },
  { id: "internship",   emoji: "💼", label: "Thực tập / Công việc", desc: "Intern, part-time, startup" },
  { id: "sports",       emoji: "⚽", label: "Thể thao",             desc: "CLB thể thao, thi đấu, huấn luyện" },
  { id: "arts",         emoji: "🎨", label: "Nghệ thuật / Sáng tạo", desc: "Âm nhạc, hội họa, thiết kế, viết lách" },
  { id: "stem_project", emoji: "💻", label: "Dự án STEM",           desc: "App, website, robot, hackathon" },
  { id: "award",        emoji: "🏆", label: "Giải thưởng",          desc: "Giải quốc gia, quốc tế, danh hiệu" },
  { id: "other",        emoji: "✨", label: "Khác",                 desc: "Hoạt động không thuộc các mục trên" },
];

export function ProfileBar({ profile, onChange }) {
  const [errors, setErrors] = useState({});
  const [open, setOpen] = useState(true);

  const selectedCats = profile.activity_categories || [];
  const activityDetails = profile.activity_details || {};

  function handleChange(key, value, validate) {
    const num = parseFloat(value);
    const err = (validate && value !== "" && !isNaN(num)) ? validate(num) : null;
    setErrors((prev) => ({ ...prev, [key]: err }));
    onChange({ ...profile, [key]: value });
  }

  function toggleCategory(id) {
    const next = selectedCats.includes(id)
      ? selectedCats.filter((c) => c !== id)
      : [...selectedCats, id];
    const newDetails = { ...activityDetails };
    if (!next.includes(id)) delete newDetails[id];
    onChange({
      ...profile,
      activity_categories: next,
      activity_details: newDetails,
      activities: buildString(next, newDetails),
    });
  }

  function handleDetail(id, val) {
    const newDetails = { ...activityDetails, [id]: val };
    onChange({
      ...profile,
      activity_details: newDetails,
      activities: buildString(selectedCats, newDetails),
    });
  }

  function buildString(cats, details) {
    return cats.map((id) => {
      const cat = ACTIVITY_CATEGORIES.find((c) => c.id === id);
      const detail = details[id];
      return detail ? `[${cat?.label}] ${detail}` : cat?.label;
    }).join("; ");
  }

  return (
    <div style={{
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      marginBottom: 24,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", cursor: "pointer",
          borderBottom: open ? "1px solid #f3f4f6" : "none",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Hồ sơ học sinh</span>
          {!open && (
            <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
              {profile.name || "Chưa điền"} {profile.gpa ? `· GPA ${profile.gpa}` : ""} {profile.school_name ? `· ${profile.school_name}` : ""}
            </span>
          )}
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && (
        <div style={{ padding: "16px 20px" }}>
          {/* Fields grid — label trên, input dưới */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px 10px", marginBottom: 20 }}>
            {FIELDS.map(({ key, label, placeholder, type, min, max, step, validate, readonly }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 }}>
                  {label} {readonly && <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none" }}>🔒</span>}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={readonly ? placeholder : (profile[key] || "")}
                  min={min} max={max} step={step}
                  readOnly={readonly}
                  onChange={(e) => !readonly && handleChange(key, e.target.value, validate)}
                  style={{
                    width: "100%", padding: "8px 11px", borderRadius: 8,
                    border: `1.5px solid ${errors[key] ? "#ef4444" : "#e5e7eb"}`,
                    fontSize: 13, boxSizing: "border-box", outline: "none",
                    transition: "border-color 0.15s",
                    background: readonly ? "#f3f4f6" : (errors[key] ? "#fef2f2" : "#fafafa"),
                    color: readonly ? "#6b7280" : "#111827",
                    cursor: readonly ? "not-allowed" : "text",
                  }}
                  onFocus={(e) => { if (!errors[key] && !readonly) e.target.style.borderColor = "#3b82f6"; }}
                  onBlur={(e) => { if (!errors[key]) e.target.style.borderColor = "#e5e7eb"; }}
                />
                {errors[key] && (
                  <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>⚠ {errors[key]}</div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f3f4f6", marginBottom: 16 }} />

          {/* Activities */}
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 10 }}>
            Hoạt động ngoại khóa — chọn tất cả hạng mục phù hợp
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACTIVITY_CATEGORIES.map(({ id, emoji, label }) => {
              const selected = selectedCats.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px", borderRadius: 20, fontSize: 13,
                    cursor: "pointer", transition: "all 0.15s",
                    border: selected ? "1.5px solid #2563eb" : "1.5px solid #e5e7eb",
                    background: selected ? "#eff6ff" : "#fafafa",
                    color: selected ? "#1d4ed8" : "#374151",
                    fontWeight: selected ? 600 : 400,
                    boxShadow: selected ? "0 0 0 3px #dbeafe" : "none",
                  }}
                >
                  <span>{emoji}</span> {label}
                </button>
              );
            })}
          </div>

          {/* Detail inputs */}
          {selectedCats.length > 0 && (
            <div style={{ marginTop: 14, background: "#f8faff", borderRadius: 10, border: "1px solid #dbeafe", padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
                Mô tả chi tiết từng hạng mục
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedCats.map((id) => {
                  const cat = ACTIVITY_CATEGORIES.find((c) => c.id === id);
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, minWidth: 130, color: "#374151", fontWeight: 500 }}>
                        {cat.emoji} {cat.label}
                      </span>
                      <input
                        placeholder={cat.desc}
                        value={activityDetails[id] || ""}
                        onChange={(e) => handleDetail(id, e.target.value)}
                        style={{
                          flex: 1, padding: "7px 11px", borderRadius: 8,
                          border: "1.5px solid #e5e7eb", fontSize: 13,
                          background: "white", outline: "none",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                        onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}