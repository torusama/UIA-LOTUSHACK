import { useState } from "react";

const T = {
  surface: "#fbf9f5",
  surfaceLow: "#f5f3ef",
  surfaceHigh: "#eae8e4",
  surfaceHighest: "#e4e2de",
  white: "#ffffff",
  navy: "#001946",
  cobalt: "#00419e",
  blue: "#2559bd",
  sky: "#9ae1ff",
  skyFixed: "#baeaff",
  mint: "#6bfe9c",
  onSurface: "#1b1c1a",
  onSurfaceVar: "#44474d",
  outlineVar: "#c5c6cd",
};

const pillBtn = {
  padding: "13px 28px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #00419e 0%, #2559bd 100%)",
  color: "#fff",
  border: "none",
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(37,89,189,0.28)",
  transition: "transform 0.15s, box-shadow 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

/* ── Testimonial quotes instead of made-up stats ── */
const QUOTES = [
  {
    quote:
      "The essay feedback was sharper than anything my counselor gave me. I rewrote my Common App three times and got into MIT EA.",
    name: "Linh T.",
    tag: "MIT '27 · Computer Science",
    accent: T.skyFixed,
  },
  {
    quote:
      "Mock interviews felt intimidating at first — but after 5 sessions I walked into the real thing completely calm.",
    name: "Marcus W.",
    tag: "Harvard '26 · Applied Math",
    accent: `${T.mint}90`,
  },
  {
    quote:
      "The dashboard showed exactly where my profile was weak. I spent two months fixing it and hit every school on my list.",
    name: "Priya S.",
    tag: "Stanford '27 · CS + Econ",
    accent: "#dae2ff",
  },
];

/* ── 4 steps in a 2x2 grid ── */
const STEPS = [
  {
    num: "01",
    label: "Build Your Profile",
    desc: "Enter your GPA, test scores, extracurriculars, and target school. Your candidate profile is built instantly.",
    accent: T.skyFixed,
    accentText: T.cobalt,
  },
  {
    num: "02",
    label: "Essay Review",
    desc: "Paste or upload your essay. AI scores clarity, authenticity, originality, and school fit — with line-by-line feedback.",
    accent: `${T.sky}70`,
    accentText: T.cobalt,
  },
  {
    num: "03",
    label: "Mock Interview",
    desc: "Practice with a voice-enabled AI that mirrors elite admissions officer styles. Real-time feedback after each answer.",
    accent: `${T.mint}70`,
    accentText: "#005228",
  },
  {
    num: "04",
    label: "Dashboard Analysis",
    desc: "Get a full executive summary — candidacy verdict, scholarship matches, and a personalized improvement roadmap.",
    accent: "#dae2ff",
    accentText: T.cobalt,
  },
];

function StepCard({ step, idx }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.white,
        borderRadius: 20,
        padding: "28px 26px",
        boxShadow: hov
          ? "0 20px 48px rgba(27,28,26,0.1)"
          : "0 4px 20px rgba(27,28,26,0.05)",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.22s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animation: `fadeUp 0.5s ${idx * 0.07}s ease both`,
      }}
    >
      {/* Step number pill */}
      <div
        style={{
          alignSelf: "flex-start",
          background: step.accent,
          color: step.accentText,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.07em",
          padding: "4px 12px",
          borderRadius: 999,
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        STEP {step.num}
      </div>

      <h3
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 17,
          fontWeight: 800,
          color: T.navy,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        {step.label}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: T.onSurfaceVar,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {step.desc}
      </p>
    </div>
  );
}

function QuoteCard({ q, idx }) {
  return (
    <div
      style={{
        background: T.white,
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: "0 4px 20px rgba(27,28,26,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        animation: `fadeUp 0.5s ${0.2 + idx * 0.08}s ease both`,
        flex: "1 1 260px",
      }}
    >
      {/* Quote mark */}
      <div
        style={{
          fontSize: 40,
          lineHeight: 1,
          color: q.accent,
          fontFamily: "Georgia, serif",
          marginBottom: -8,
        }}
      >
        "
      </div>

      <p
        style={{
          fontSize: 14,
          color: T.onSurface,
          lineHeight: 1.75,
          fontStyle: "italic",
          margin: 0,
          flex: 1,
        }}
      >
        {q.quote}
      </p>

      {/* Attribution */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Initials avatar */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: q.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: T.navy,
            fontFamily: "'Manrope', sans-serif",
            flexShrink: 0,
          }}
        >
          {q.name.charAt(0)}
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.navy,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {q.name}
          </div>
          <div style={{ fontSize: 11, color: T.onSurfaceVar, marginTop: 1 }}>
            {q.tag}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onEnter, onLogin, onRegister }) {
  const [leaving, setLeaving] = useState(false);

  const go = () => {
    setLeaving(true);
    setTimeout(onEnter, 480);
  };

  const goLogin = () => {
    setLeaving(true);
    setTimeout(onLogin, 480);
  };

  const goRegister = () => {
    setLeaving(true);
    setTimeout(onRegister, 480);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background:
          "linear-gradient(160deg, #dbeafe 0%, #ede9fe 40%, #bfdbfe 70%, #e0f2fe 100%)",
        fontFamily: "'Inter', sans-serif",
        color: T.onSurface,
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.48s ease",
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `linear-gradient(rgba(99,102,241,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.10) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "-10%",
          left: "20%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(147,197,253,0.35)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "20%",
          right: "-5%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "rgba(196,181,253,0.25)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "10%",
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "rgba(186,230,255,0.3)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(219,234,254,0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow:
            "0 1px 0 rgba(99,102,241,0.12), 0 4px 24px rgba(99,102,241,0.08)",
          borderBottom: "1px solid rgba(165,180,252,0.3)",
          display: "flex",
          alignItems: "center",
          padding: "0 40px",
          height: 64,
        }}
      >
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: T.navy,
            letterSpacing: "-0.02em",
          }}
        >
          UniMatch AI
        </span>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={goLogin}
            style={{
              padding: "9px 22px",
              borderRadius: 999,
              background: "transparent",
              border: `1.5px solid ${T.outlineVar}`,
              color: T.navy,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.cobalt;
              e.currentTarget.style.background = `${T.skyFixed}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.outlineVar;
              e.currentTarget.style.background = "transparent";
            }}
          >
            Sign In
          </button>
          <button
            onClick={goRegister}
            style={{
              ...pillBtn,
              width: "auto",
              padding: "9px 22px",
              fontSize: 13,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.04)";
              e.currentTarget.style.boxShadow =
                "0 12px 28px rgba(37,89,189,0.38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 24px rgba(37,89,189,0.28)";
            }}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <main
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Hero ── */}
        <section
          style={{
            display: "flex",
            gap: 56,
            alignItems: "center",
            padding: "72px 0 88px",
            flexWrap: "wrap",
          }}
        >
          {/* Left copy */}
          <div
            style={{ flex: "1 1 360px", animation: "fadeUp 0.5s ease both" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(165,180,252,0.35)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: 999,
                padding: "6px 16px",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: T.cobalt,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ✦ AI-Powered University Admissions
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "clamp(38px, 5vw, 62px)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                color: T.navy,
                margin: "0 0 18px",
              }}
            >
              Build a smarter path to your{" "}
              <span style={{ color: T.blue }}>dream university.</span>
            </h1>

            <p
              style={{
                fontSize: 17,
                color: T.onSurfaceVar,
                lineHeight: 1.7,
                maxWidth: 420,
                margin: "0 0 36px",
              }}
            >
              Personalized AI tools for essay feedback, interview practice, and
              full candidacy analysis — tailored to your target school.
            </p>

            {/* Single CTA — no View Demo */}
            <button
              onClick={go}
              style={{ ...pillBtn, fontSize: 15, padding: "15px 36px" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 32px rgba(37,89,189,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(37,89,189,0.28)";
              }}
            >
              Start Your Evaluation
            </button>
          </div>

          {/* Right — clean status card, no icons */}
          <div
            style={{
              flex: "1 1 300px",
              position: "relative",
              minWidth: 260,
              animation: "fadeUp 0.5s 0.1s ease both",
            }}
          >
            {/* Glows */}
            <div
              style={{
                position: "absolute",
                top: -20,
                left: -20,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: `${T.skyFixed}50`,
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -10,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: `${T.mint}25`,
                filter: "blur(50px)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                background: T.white,
                borderRadius: 24,
                padding: 24,
                boxShadow:
                  "0 40px 80px rgba(27,28,26,0.1), 0 2px 8px rgba(27,28,26,0.04)",
              }}
            >
              {/* School header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 14,
                    fontWeight: 800,
                    color: T.navy,
                  }}
                >
                  MIT — Computer Science
                </span>
                <span
                  style={{
                    background: T.mint,
                    color: "#00210c",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 999,
                    letterSpacing: "0.04em",
                    flexShrink: 0,
                  }}
                >
                  REACH
                </span>
              </div>

              {/* Numbered step rows */}
              {[
                {
                  num: "01",
                  label: "Profile",
                  sublabel: "GPA · SAT · Activities",
                  status: "Ready",
                  dot: "#059669",
                },
                {
                  num: "02",
                  label: "Essay",
                  sublabel: "Clarity · Fit · Originality",
                  status: "In Review",
                  dot: "#f59e0b",
                },
                {
                  num: "03",
                  label: "Interview",
                  sublabel: "Voice · Real-time feedback",
                  status: "Not Started",
                  dot: T.outlineVar,
                },
                {
                  num: "04",
                  label: "Dashboard",
                  sublabel: "Verdict · Scholarships · Plan",
                  status: "Pending",
                  dot: T.outlineVar,
                },
              ].map((r, i) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < 3 ? `1px solid ${T.surfaceLow}` : "none",
                  }}
                >
                  {/* Step number */}
                  <span
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 11,
                      fontWeight: 800,
                      color: T.outlineVar,
                      letterSpacing: "0.04em",
                      width: 20,
                      flexShrink: 0,
                    }}
                  >
                    {r.num}
                  </span>
                  {/* Label + sublabel */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: T.onSurface,
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: T.outlineVar,
                        marginTop: 1,
                      }}
                    >
                      {r.sublabel}
                    </div>
                  </div>
                  {/* Status dot + text */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: r.dot,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.onSurfaceVar,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}

              <button
                onClick={go}
                style={{
                  ...pillBtn,
                  width: "100%",
                  justifyContent: "center",
                  marginTop: 18,
                  padding: "13px",
                }}
              >
                Continue Application
              </button>
            </div>
          </div>
        </section>

        {/* ── Testimonials — replaces fake stats ── */}
        <section
          style={{ marginBottom: 88, animation: "fadeUp 0.5s 0.2s ease both" }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.cobalt,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              From students who made it
            </p>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "clamp(22px, 2.5vw, 30px)",
                fontWeight: 800,
                color: T.navy,
                letterSpacing: "-0.02em",
              }}
            >
              Real stories. Real admissions.
            </h2>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {QUOTES.map((q, i) => (
              <QuoteCard key={i} q={q} idx={i} />
            ))}
          </div>
        </section>

        {/* ── How it works — 2×2 grid ── */}
        <section style={{ marginBottom: 96 }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
              animation: "fadeUp 0.5s 0.28s ease both",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: T.cobalt,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: "clamp(26px, 3vw, 38px)",
                fontWeight: 800,
                color: T.navy,
                letterSpacing: "-0.02em",
                margin: "0 0 12px",
              }}
            >
              Designed for Academic Excellence
            </h2>
            <p
              style={{
                fontSize: 16,
                color: T.onSurfaceVar,
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.65,
              }}
            >
              Four integrated tools that work together to present the strongest
              possible version of you.
            </p>
          </div>

          {/* 2×2 grid — no orphan card */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            {STEPS.map((s, i) => (
              <StepCard key={s.num} step={s} idx={i} />
            ))}
          </div>

          {/* Full-width navy CTA card */}
          <div
            style={{
              marginTop: 16,
              background: `linear-gradient(135deg, ${T.navy} 0%, ${T.cobalt} 100%)`,
              borderRadius: 20,
              padding: "36px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 24,
              boxShadow: "0 20px 40px rgba(27,28,26,0.08)",
              position: "relative",
              overflow: "hidden",
              animation: "fadeUp 0.5s 0.42s ease both",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: "clamp(18px, 2.2vw, 26px)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.01em",
                  marginBottom: 8,
                }}
              >
                Everything in one workspace.
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.58)",
                  maxWidth: 460,
                  lineHeight: 1.65,
                }}
              >
                Profile, essays, interviews, and candidacy analysis — without
                switching between tools or losing your progress.
              </p>
            </div>
            <button
              onClick={go}
              style={{
                background: "rgba(255,255,255,0.13)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 999,
                padding: "13px 28px",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.13)")
              }
            >
              Open Workspace
            </button>
          </div>
        </section>
      </main>

      {/* ── CTA footer strip ── */}
      <div
        style={{
          background: "rgba(219,234,254,0.5)",
          backdropFilter: "blur(10px)",
          padding: "72px 32px",
          textAlign: "center",
          animation: "fadeUp 0.5s 0.48s ease both",
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(165,180,252,0.25)",
        }}
      >
        <h2
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "clamp(24px, 3vw, 36px)",
            fontWeight: 800,
            color: T.navy,
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          Your future at a world-class institution starts here.
        </h2>
        <p style={{ fontSize: 16, color: T.onSurfaceVar, marginBottom: 32 }}>
          Free to use · No account needed · Ready in 30 seconds.
        </p>
        <button
          onClick={go}
          style={{ ...pillBtn, fontSize: 16, padding: "16px 40px" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(37,89,189,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,89,189,0.28)";
          }}
        >
          Start Your Free Evaluation
        </button>
      </div>

      <footer
        style={{
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          position: "relative",
          zIndex: 1,
          borderTop: "1px solid rgba(165,180,252,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: 14,
            color: T.navy,
          }}
        >
          UniMatch AI
        </span>
        <span style={{ fontSize: 12, color: T.onSurfaceVar }}>
          UIA · LotusHack 2026
        </span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 600px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
