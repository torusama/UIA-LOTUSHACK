export function Button({ children, onClick, disabled, variant = "primary", style = {} }) {
  const variants = {
    primary: { background: "#1e40af", color: "white" },
    secondary: { background: "#6b7280", color: "white" },
    danger:  { background: "#dc2626", color: "white" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 22px",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Tag({ children, color = "#e5e7eb", textColor = "#374151" }) {
  return (
    <span style={{
      background: color, color: textColor,
      padding: "2px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}
