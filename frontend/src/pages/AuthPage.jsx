import { useState } from "react";
import { signInWithGoogle } from "../lib/firebase";

const T = {
  surface:      "#fbf9f5",
  white:        "#ffffff",
  navy:         "#001946",
  cobalt:       "#00419e",
  blue:         "#2559bd",
  skyFixed:     "#baeaff",
  mint:         "#6bfe9c",
  onSurface:    "#1b1c1a",
  onSurfaceVar: "#44474d",
  outlineVar:   "#c5c6cd",
  error:        "#c0392b",
};

const ArrowBack = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FEATURES = [
  { icon: "✦", label: "AI Essay Review", desc: "Line-by-line feedback tailored to your target school" },
  { icon: "◎", label: "Mock Interviews", desc: "Voice-enabled AI that mirrors real admissions officers" },
  { icon: "◈", label: "Candidacy Dashboard", desc: "Full profile analysis with scholarship matches" },
];

export default function AuthPage({ onSuccess, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [leaving, setLeaving] = useState(false);
  const [hoverGoogle, setHoverGoogle] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      setLeaving(true);
      setTimeout(() => onSuccess(user), 400);
    } catch (err) {
      setLoading(false);
      if (err.code === "auth/popup-closed-by-user") return;
      setError("Sign-in failed. Please try again.");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex",
      fontFamily: "'Inter', sans-serif",
      opacity: leaving ? 0 : 1,
      transition: "opacity 0.4s ease",
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "48%", minWidth: 420,
        background: `linear-gradient(145deg, ${T.navy} 0%, #002a6e 50%, ${T.cobalt} 100%)`,
        display: "flex", flexDirection: "column",
        padding: "48px 52px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />

        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -100, right: -60, width: 340, height: 340, borderRadius: "50%", background: `${T.skyFixed}15`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 280, height: 280, borderRadius: "50%", background: `${T.mint}10`, filter: "blur(70px)", pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800, fontSize: 20,
            color: "#fff", letterSpacing: "-0.02em",
          }}>UniMatch AI</span>
        </div>

        {/* Main copy */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999, padding: "6px 14px",
            marginBottom: 28, alignSelf: "flex-start",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.mint }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              AI-Powered Admissions
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "clamp(32px, 3.5vw, 48px)",
            fontWeight: 800, color: "#fff",
            lineHeight: 1.1, letterSpacing: "-0.025em",
            margin: "0 0 20px",
          }}>
            Build your path to a{" "}
            <span style={{
              background: `linear-gradient(135deg, ${T.skyFixed}, ${T.mint})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              world-class university.
            </span>
          </h1>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7, margin: "0 0 44px", maxWidth: 360,
          }}>
            The complete AI toolkit for essay review, interview practice, and candidacy analysis — built for ambitious students.
          </p>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", animation: `fadeUp 0.5s ${0.1 + i * 0.08}s ease both` }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: T.skyFixed,
                  fontWeight: 700,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div style={{ position: "relative", zIndex: 1, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
          UIA · LotusHack 2026
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        background: T.surface,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "40px 48px",
        position: "relative", overflowY: "auto",
      }}>
        {/* Subtle background texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.3,
          backgroundImage: `radial-gradient(circle at 80% 20%, ${T.skyFixed}40 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${T.mint}20 0%, transparent 50%)`,
          pointerEvents: "none",
        }} />

        {/* Back button */}
        <button onClick={onBack} style={{
          position: "absolute", top: 24, left: 28,
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: `1px solid ${T.outlineVar}`,
          borderRadius: 999, padding: "6px 14px 6px 10px",
          cursor: "pointer", fontSize: 12, fontWeight: 600,
          color: T.onSurfaceVar, fontFamily: "'Inter', sans-serif",
          transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.cobalt; e.currentTarget.style.color = T.navy; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.outlineVar; e.currentTarget.style.color = T.onSurfaceVar; }}
        >
          <ArrowBack /> Back
        </button>

        {/* Sign in card */}
        <div style={{
          width: "100%", maxWidth: 380,
          position: "relative", zIndex: 1,
          animation: "slideIn 0.5s ease both",
        }}>
          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: T.cobalt,
              letterSpacing: "0.1em", textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
              Get started — it's free
            </p>
            <h2 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 32, fontWeight: 800, color: T.navy,
              letterSpacing: "-0.025em", margin: "0 0 10px", lineHeight: 1.1,
            }}>
              Sign in to<br />UniMatch AI
            </h2>
            <p style={{ fontSize: 14, color: T.onSurfaceVar, margin: 0, lineHeight: 1.6 }}>
              New to UniMatch? Your account is created automatically on first sign-in.
            </p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            onMouseEnter={() => setHoverGoogle(true)}
            onMouseLeave={() => setHoverGoogle(false)}
            style={{
              width: "100%", padding: "15px 20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: hoverGoogle && !loading ? T.navy : T.white,
              border: `1.5px solid ${hoverGoogle && !loading ? T.navy : T.outlineVar}`,
              borderRadius: 14, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15, fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              color: hoverGoogle && !loading ? "#fff" : T.onSurface,
              boxShadow: hoverGoogle && !loading
                ? "0 8px 24px rgba(0,25,70,0.18)"
                : "0 2px 8px rgba(27,28,26,0.06)",
              transition: "all 0.2s ease",
              opacity: loading ? 0.65 : 1,
              transform: hoverGoogle && !loading ? "translateY(-1px)" : "translateY(0)",
            }}
          >
            {!loading && <GoogleLogo />}
            {loading && (
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: `2px solid ${T.outlineVar}`,
                borderTopColor: T.cobalt,
                animation: "spin 0.7s linear infinite",
              }} />
            )}
            {loading ? "Signing you in..." : "Continue with Google"}
          </button>

          {error && (
            <div style={{
              marginTop: 14, fontSize: 13, color: T.error,
              background: "#fdf2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "10px 14px", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.error} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "28px 0" }}>
            <div style={{ flex: 1, height: 1, background: T.outlineVar }} />
            <span style={{ fontSize: 11, color: T.outlineVar, fontWeight: 600, letterSpacing: "0.06em" }}>
              SECURE · PRIVATE · FREE
            </span>
            <div style={{ flex: 1, height: 1, background: T.outlineVar }} />
          </div>

          {/* Trust note */}
          <div style={{
            background: T.white,
            border: `1px solid ${T.outlineVar}40`,
            borderRadius: 14, padding: "16px 18px",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${T.skyFixed}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>🔒</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 3 }}>
                Your data stays private
              </div>
              <div style={{ fontSize: 11, color: T.onSurfaceVar, lineHeight: 1.5 }}>
                We only use your Google name and email to create your account. We never share your data.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .auth-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
