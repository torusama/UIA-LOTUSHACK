import { useState, useEffect, useRef } from "react";

// --- Sample data -- replace with real props/API data ---------------------------
const MOCK_RESULT = {
  student: { name: "Alex Nguyen", targetSchool: "MIT", applyYear: 2025 },
  scores: {
    total: 72,
    hardFactors: {
      score: 22,
      max: 35,
      gpa: { val: 3.75, pts: 10 },
      sat: { val: 1530, pts: 7 },
      ielts: { val: 7.2, pts: 7 },
    },
    extracurricular: {
      score: 14,
      max: 20,
      activities: [
        { name: "National Math Olympiad", tier: 1 },
        { name: "Robotics Club President", tier: 2 },
      ],
    },
    essay: {
      score: 18,
      max: 25,
      criteria: [
        { label: "Authentic Voice", score: 4, max: 5 },
        { label: "Depth & Specificity", score: 4, max: 5 },
        { label: "School Fit", score: 3, max: 5 },
        { label: "Structure & Flow", score: 4, max: 5 },
        { label: "Hook & Originality", score: 3, max: 5 },
      ],
    },
    interview: {
      score: 16,
      max: 20,
      criteria: [
        { label: "Clear Communication", score: 4, max: 5 },
        { label: "Intellectual Curiosity", score: 3, max: 5 },
        { label: "Personal Authenticity", score: 5, max: 5 },
        { label: "School Fit", score: 4, max: 5 },
      ],
    },
  },
  essayFeedback: {
    strengths: [
      "Distinct personal voice -- does not read like a template.",
      "Strong concrete example in paragraph 2 -- convincing and specific.",
    ],
    improvements: [
      {
        priority: "high",
        title: "School Fit needs to be explicit",
        body: "The essay does not connect your story to MIT core values -- maker mindset and hands-on creativity. Add 1-2 sentences in the conclusion referencing specific programs (UROP, OpenCourseWare).",
      },
      {
        priority: "high",
        title: "Opening hook is too generic",
        body: "Try starting with a vivid, specific moment that drops the reader immediately into your experience rather than a broad statement.",
      },
      {
        priority: "medium",
        title: "Paragraph 3 is overloaded",
        body: "Two main ideas are crammed into paragraph 3. Splitting into two shorter paragraphs will improve clarity and readability.",
      },
    ],
  },
  interviewFeedback: {
    strengths: [
      "Robotics project answer was compelling -- backed by concrete metrics.",
      "Stayed natural and relaxed throughout the full 9 minutes.",
    ],
    improvements: [
      {
        priority: "high",
        title: "Intellectual Curiosity was underdeveloped",
        body: "Prepare 1-2 topics you genuinely follow and can discuss for 2-3 minutes when asked about current interests or research.",
      },
      {
        priority: "medium",
        title: "Proactively mention School Fit",
        body: "In the final two questions you never mentioned a specific reason why MIT. Weave it in organically next time.",
      },
      {
        priority: "low",
        title: "Speaking pace spiked mid-interview",
        body: "Around minutes 4-6 your pace noticeably increased. Intentional pausing makes answers sound more polished.",
      },
    ],
  },
};

// --- Helpers ------------------------------------------------------------------
function getLabel(total) {
  if (total >= 90)
    return {
      text: "Outstanding",
      color: "#065F46",
      bg: "#D1FAE5",
      accent: "#34D399",
    };
  if (total >= 80)
    return {
      text: "Very Strong",
      color: "#0F6E56",
      bg: "#E1F5EE",
      accent: "#34D399",
    };
  if (total >= 70)
    return {
      text: "Competitive",
      color: "#185FA5",
      bg: "#DBEAFE",
      accent: "#60A5FA",
    };
  if (total >= 60)
    return {
      text: "Above Average",
      color: "#1E40AF",
      bg: "#EDE9FE",
      accent: "#A78BFA",
    };
  if (total >= 50)
    return {
      text: "Average",
      color: "#92400E",
      bg: "#FEF9C3",
      accent: "#FBBF24",
    };
  if (total >= 40)
    return {
      text: "Below Average",
      color: "#854F0B",
      bg: "#FAEEDA",
      accent: "#F59E0B",
    };
  if (total >= 25)
    return {
      text: "Needs Work",
      color: "#9D174D",
      bg: "#FCE7F3",
      accent: "#F472B6",
    };
  return {
    text: "Not Ready",
    color: "#A32D2D",
    bg: "#FCEBEB",
    accent: "#F87171",
  };
}

function priorityMeta(p) {
  if (p === "high")
    return { label: "High Priority", color: "#E24B4A", bg: "#FCEBEB" };
  if (p === "medium")
    return { label: "Suggested", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Minor", color: "#5F5E5A", bg: "#F1EFE8" };
}

function criteriaRating(score) {
  if (score >= 5)
    return { label: "Excellent", color: "#0F6E56", bg: "#E1F5EE" };
  if (score >= 4) return { label: "Strong", color: "#0F6E56", bg: "#E1F5EE" };
  if (score >= 3)
    return { label: "Needs Work", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Weak", color: "#A32D2D", bg: "#FCEBEB" };
}

function gpaRating(gpa) {
  if (gpa >= 3.9)
    return { label: "Exceptional", color: "#0F6E56", bg: "#E1F5EE" };
  if (gpa >= 3.7)
    return { label: "Above Average", color: "#0F6E56", bg: "#E1F5EE" };
  if (gpa >= 3.5) return { label: "Average", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Below Average", color: "#A32D2D", bg: "#FCEBEB" };
}

function satRating(sat) {
  if (sat >= 1550)
    return { label: "Exceptional", color: "#0F6E56", bg: "#E1F5EE" };
  if (sat >= 1510)
    return { label: "Competitive", color: "#0F6E56", bg: "#E1F5EE" };
  if (sat >= 1450)
    return { label: "Meets Standard", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Below Standard", color: "#A32D2D", bg: "#FCEBEB" };
}

function ieltsRating(ielts) {
  if (ielts >= 7.5)
    return { label: "Exceptional", color: "#0F6E56", bg: "#E1F5EE" };
  if (ielts >= 7.0)
    return { label: "Meets Standard", color: "#0F6E56", bg: "#E1F5EE" };
  if (ielts >= 6.5)
    return { label: "Borderline", color: "#BA7517", bg: "#FAEEDA" };
  return { label: "Below Standard", color: "#A32D2D", bg: "#FCEBEB" };
}

const TIER_META = {
  1: {
    label: "Tier 1",
    sub: "National / International",
    color: "#185FA5",
    bg: "#E6F1FB",
  },
  2: {
    label: "Tier 2",
    sub: "Regional Leadership",
    color: "#0F6E56",
    bg: "#E1F5EE",
  },
  3: {
    label: "Tier 3",
    sub: "Club Role / Volunteer",
    color: "#BA7517",
    bg: "#FAEEDA",
  },
  4: { label: "Tier 4", sub: "Member", color: "#5F5E5A", bg: "#F1EFE8" },
};

// --- Sub-components ------------------------------------------------------------
function CircleGauge({ score, max = 100, size = 160 }) {
  const pct = score / max;
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const label = getLabel(score);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E1EEF6"
          strokeWidth={12}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1D9E75"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          top: 0,
          left: 0,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#1D9E75",
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span style={{ fontSize: 13, color: "#888780" }}>/ {max}</span>
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          padding: "4px 12px",
          borderRadius: 20,
          background: label.bg,
          color: label.color,
        }}
      >
        {label.text}
      </span>
    </div>
  );
}

const BAR_THEME = {
  green: {
    track: "#D1FAE5",
    grad: "linear-gradient(90deg,#6EE7B7,#34D399)",
    glow: "rgba(52,211,153,.45)",
    pill: { bg: "#D1FAE5", color: "#065F46" },
  },
  blue: {
    track: "#DBEAFE",
    grad: "linear-gradient(90deg,#93C5FD,#60A5FA)",
    glow: "rgba(96,165,250,.45)",
    pill: { bg: "#DBEAFE", color: "#1E40AF" },
  },
  amber: {
    track: "#FEF9C3",
    grad: "linear-gradient(90deg,#FCD34D,#FBBF24)",
    glow: "rgba(251,191,36,.4)",
    pill: { bg: "#FEF9C3", color: "#92400E" },
  },
  pink: {
    track: "#FCE7F3",
    grad: "linear-gradient(90deg,#F9A8D4,#F472B6)",
    glow: "rgba(244,114,182,.4)",
    pill: { bg: "#FCE7F3", color: "#9D174D" },
  },
  purple: {
    track: "#EDE9FE",
    grad: "linear-gradient(90deg,#C4B5FD,#A78BFA)",
    glow: "rgba(167,139,250,.4)",
    pill: { bg: "#EDE9FE", color: "#5B21B6" },
  },
};

function barRating(pct) {
  if (pct >= 85) return "Excellent";
  if (pct >= 70) return "Strong";
  if (pct >= 55) return "Good";
  if (pct >= 40) return "Average";
  return "Needs Work";
}

function ScoreBar({ label, score, max, theme = "green" }) {
  const pct = Math.round((score / max) * 100);
  const t = BAR_THEME[theme] || BAR_THEME.green;
  const rating = barRating(pct);
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 13, color: "var(--color-text-primary, #1a1a1a)" }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 10px",
            borderRadius: 20,
            background: t.pill.bg,
            color: t.pill.color,
            whiteSpace: "nowrap",
          }}
        >
          {rating}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: t.track,
          borderRadius: 4,
          overflow: "visible",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: t.grad,
            boxShadow: `0 0 10px 2px ${t.glow}`,
            borderRadius: 4,
            transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

function ComponentCard({
  icon,
  title,
  score,
  max,
  theme = "green",
  headerBadge,
  children,
}) {
  const pct = Math.round((score / max) * 100);
  const t = BAR_THEME[theme] || BAR_THEME.green;
  const cardGlow =
    {
      green: {
        borderTop: "3px solid #34D399",
        boxShadow: "0 2px 16px 0 rgba(52,211,153,.18)",
      },
      blue: {
        borderTop: "3px solid #60A5FA",
        boxShadow: "0 2px 16px 0 rgba(96,165,250,.18)",
      },
      amber: {
        borderTop: "3px solid #FBBF24",
        boxShadow: "0 2px 16px 0 rgba(251,191,36,.15)",
      },
      pink: {
        borderTop: "3px solid #F87171",
        boxShadow: "0 2px 16px 0 rgba(248,113,113,.15)",
      },
      purple: {
        borderTop: "3px solid #A78BFA",
        boxShadow: "0 2px 16px 0 rgba(167,139,250,.15)",
      },
    }[theme] || {};
  return (
    <div
      style={{
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,.12))",
        borderRadius: 12,
        padding: "16px 18px",
        ...cardGlow,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#888780", marginBottom: 2 }}>
            {icon}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        </div>
        {headerBadge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 20,
              background: t.pill.bg,
              color: t.pill.color,
            }}
          >
            {headerBadge}
          </span>
        )}
      </div>
      <div
        style={{
          height: 5,
          background: t.track,
          borderRadius: 3,
          marginBottom: 14,
          overflow: "visible",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: t.grad,
            boxShadow: `0 0 8px 1px ${t.glow}`,
            borderRadius: 3,
            transition: "width 1.4s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      {children}
    </div>
  );
}

const PRIORITY_GLASS = {
  high: {
    border: "rgba(248,113,113,.65)",
    bg: "linear-gradient(135deg,rgba(255,237,237,0.72),rgba(255,255,255,0.65))",
    badgeBg: "rgba(254,202,202,0.9)",
    badgeColor: "#B91C1C",
    label: "High Priority",
  },
  medium: {
    border: "rgba(251,191,36,.65)",
    bg: "linear-gradient(135deg,rgba(255,251,220,0.78),rgba(255,255,255,0.65))",
    badgeBg: "rgba(253,230,138,0.9)",
    badgeColor: "#92400E",
    label: "Suggested",
  },
  low: {
    border: "rgba(209,213,219,.55)",
    bg: "linear-gradient(135deg,rgba(240,240,255,0.72),rgba(255,255,255,0.65))",
    badgeBg: "rgba(224,231,255,0.95)",
    badgeColor: "#4338CA",
    label: "Minor",
  },
};

function ImprovementCard({ item }) {
  const g = PRIORITY_GLASS[item.priority] || PRIORITY_GLASS.low;
  return (
    <div
      style={{
        background: g.bg,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.82)",
        borderLeft: `3px solid ${g.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 10,
        boxShadow: "0 2px 10px rgba(160,140,220,.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            background: g.badgeBg,
            color: g.badgeColor,
            whiteSpace: "nowrap",
          }}
        >
          {g.label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
          {item.title}
        </span>
      </div>
      <p
        style={{
          fontSize: 12.5,
          fontWeight: 450,
          color: "#3d3d5c",
          margin: 0,
          lineHeight: 1.65,
        }}
      >
        {item.body}
      </p>
    </div>
  );
}

function FeedbackSection({
  title,
  strengths,
  improvements,
  accentGrad,
  accentGlow,
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.75)",
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow:
          "0 4px 24px rgba(160,140,220,.1), 0 1.5px 6px rgba(180,160,255,.08)",
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          margin: "0 0 16px",
          color: "#1a1a2e",
          paddingBottom: 14,
          borderBottom: "1px solid rgba(200,190,255,0.25)",
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span
          style={{
            width: 11,
            height: 11,
            borderRadius: 3,
            background: accentGrad,
            boxShadow: accentGlow,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        {title}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#059669",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Strengths
        </div>
        {strengths.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
            <span
              style={{
                color: "#34D399",
                fontSize: 13,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              ✓
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#2d2d4a",
                lineHeight: 1.55,
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#D97706",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          Areas to Improve
        </div>
        {improvements.map((item, i) => (
          <ImprovementCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

// --- Radar Chart (pure SVG, no library) --------------------------------------
function RadarChart({ data }) {
  const cx = 130,
    cy = 130,
    r = 90;
  const n = data.length;
  const axes = data.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const toPoint = (pct, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return {
      x: cx + r * pct * Math.cos(angle),
      y: cy + r * pct * Math.sin(angle),
    };
  };

  const rings = [0.25, 0.5, 0.75, 1];

  const polygonPath = (pct_arr) =>
    pct_arr
      .map((p, i) => {
        const pt = toPoint(p, i);
        return `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`;
      })
      .join(" ") + "Z";

  const pcts = data.map((d) => d.score / d.max);

  return (
    <svg viewBox="0 0 260 260" style={{ width: "100%", maxWidth: 260 }}>
      {/* Grid rings */}
      {rings.map((rr, ri) => (
        <polygon
          key={ri}
          points={axes
            .map((_, i) => {
              const angle = (2 * Math.PI * i) / n - Math.PI / 2;
              return `${cx + r * rr * Math.cos(angle)},${cy + r * rr * Math.sin(angle)}`;
            })
            .join(" ")}
          fill="none"
          stroke="#E1EEE8"
          strokeWidth={0.75}
        />
      ))}
      {/* Axis lines */}
      {axes.map((ax, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={ax.x}
          y2={ax.y}
          stroke="#E1EEE8"
          strokeWidth={0.75}
        />
      ))}
      {/* Data polygon */}
      <path
        d={polygonPath(pcts)}
        fill="#1D9E7522"
        stroke="#1D9E75"
        strokeWidth={1.5}
      />
      {/* Data points */}
      {pcts.map((p, i) => {
        const pt = toPoint(p, i);
        return <circle key={i} cx={pt.x} cy={pt.y} r={4} fill="#1D9E75" />;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        const anchor =
          Math.abs(Math.cos(angle)) < 0.1
            ? "middle"
            : Math.cos(angle) > 0
              ? "start"
              : "end";
        return (
          <text
            key={i}
            x={lx}
            y={ly + 4}
            textAnchor={anchor}
            fontSize={10}
            fill="#5F5E5A"
            fontFamily="sans-serif"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// --- Main Dashboard ------------------------------------------------------------
export default function ReadinessDashboard({ result = MOCK_RESULT }) {
  const { student, scores, essayFeedback, interviewFeedback } = result;
  const { total, hardFactors, extracurricular, essay, interview } = scores;
  const label = getLabel(total);

  const radarData = [
    { label: "GPA / Tests", score: hardFactors.score, max: hardFactors.max },
    {
      label: "Activities",
      score: extracurricular.score,
      max: extracurricular.max,
    },
    { label: "Essay", score: essay.score, max: essay.max },
    { label: "Interview", score: interview.score, max: interview.max },
  ];

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
        padding: "0 0 40px",
      }}
    >
      {/* -- Header -- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          marginBottom: 24,
          background: "var(--color-background-primary, #fff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,.12))",
          borderRadius: 12,
        }}
      >
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: "#888780" }}>
            Application Readiness Report
          </p>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
            {student.name}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                fontSize: 12,
                background: "#E6F1FB",
                color: "#185FA5",
                padding: "2px 10px",
                borderRadius: 20,
                fontWeight: 500,
              }}
            >
              {student.targetSchool} · {student.applyYear}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "2px 10px",
                borderRadius: 20,
                background: label.bg,
                color: label.color,
              }}
            >
              {label.text}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: label.accent,
              lineHeight: 1,
              textShadow: `0 0 18px ${label.accent}55`,
            }}
          >
            {label.text}
          </div>
          <div style={{ fontSize: 12, color: "#888780", marginTop: 4 }}>
            Admission Readiness Index
          </div>
        </div>
      </div>

      {/* -- Top row: Radar + Score breakdown -- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.6fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Radar */}
        <div
          style={{
            background: "var(--color-background-primary, #fff)",
            border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,.12))",
            borderRadius: 12,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-secondary, #5F5E5A)",
              alignSelf: "flex-start",
            }}
          >
            Profile Overview
          </p>
          <RadarChart data={radarData} />
        </div>

        {/* Score breakdown bars */}
        <div
          style={{
            background: "var(--color-background-primary, #fff)",
            border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,.12))",
            borderRadius: 12,
            padding: "18px 24px",
          }}
        >
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-secondary, #5F5E5A)",
            }}
          >
            Score Breakdown
          </p>

          <ScoreBar
            label="Hard Factors (GPA · SAT · IELTS)"
            score={hardFactors.score}
            max={hardFactors.max}
            theme="green"
          />
          <ScoreBar
            label="Extracurricular Activities"
            score={extracurricular.score}
            max={extracurricular.max}
            theme="blue"
          />
          <ScoreBar
            label="Essay"
            score={essay.score}
            max={essay.max}
            theme="amber"
          />
          <ScoreBar
            label="Mock Interview"
            score={interview.score}
            max={interview.max}
            theme="pink"
          />

          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop:
                "0.5px solid var(--color-border-tertiary, rgba(0,0,0,.1))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "#5F5E5A" }}>
              Admission Readiness Index
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: 20,
                background: label.bg,
                color: label.color,
                boxShadow: `0 0 8px ${label.accent}33`,
              }}
            >
              {label.text}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "#F1EFE8",
              borderRadius: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#5F5E5A",
                lineHeight: 1.5,
              }}
            >
              ⓘ This is a practice tool and does not determine actual admission
              decisions made by the Admission Office.
            </p>
          </div>
        </div>
      </div>

      {/* -- 4 component cards -- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {/* Hard Factors */}
        <ComponentCard
          icon="📊"
          title="Hard Factors"
          score={hardFactors.score}
          max={hardFactors.max}
          theme="green"
          headerBadge="Strong"
        >
          {[
            {
              label: `GPA ${hardFactors.gpa.val}`,
              rating: gpaRating(hardFactors.gpa.val),
            },
            {
              label: `SAT ${hardFactors.sat.val}`,
              rating: satRating(hardFactors.sat.val),
            },
            {
              label: `IELTS ${hardFactors.ielts.val}`,
              rating: ieltsRating(hardFactors.ielts.val),
            },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                marginBottom: 6,
                color: "#5F5E5A",
              }}
            >
              <span>{r.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "2px 9px",
                  borderRadius: 20,
                  background: r.rating.bg,
                  color: r.rating.color,
                  whiteSpace: "nowrap",
                }}
              >
                {r.rating.label}
              </span>
            </div>
          ))}
        </ComponentCard>

        {/* Extracurricular */}
        <ComponentCard
          icon="🏆"
          title="Extracurriculars"
          score={extracurricular.score}
          max={extracurricular.max}
          theme="blue"
          headerBadge="Good"
        >
          {extracurricular.activities.map((a, i) => {
            const tm = TIER_META[a.tier] || TIER_META[4];
            return (
              <div
                key={i}
                style={{
                  paddingBottom: 8,
                  marginBottom: 8,
                  borderBottom:
                    i < extracurricular.activities.length - 1
                      ? "0.5px solid #E8E8E5"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#5F5E5A",
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {a.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: tm.bg,
                      color: tm.color,
                    }}
                  >
                    {tm.label}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: tm.color }}>{tm.sub}</span>
              </div>
            );
          })}
        </ComponentCard>

        {/* Essay */}
        <ComponentCard
          icon="✍️"
          title="Essay"
          score={essay.score}
          max={essay.max}
          theme="amber"
          headerBadge={barRating(Math.round((essay.score / essay.max) * 100))}
        >
          {essay.criteria.map((c, i) => {
            const r = criteriaRating(c.score);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  marginBottom: 5,
                  color: "#5F5E5A",
                }}
              >
                <span>{c.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 9px",
                    borderRadius: 20,
                    background: r.bg,
                    color: r.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.label}
                </span>
              </div>
            );
          })}
        </ComponentCard>

        {/* Interview */}
        <ComponentCard
          icon="🎙️"
          title="Mock Interview"
          score={interview.score}
          max={interview.max}
          theme="pink"
          headerBadge={barRating(
            Math.round((interview.score / interview.max) * 100),
          )}
        >
          {interview.criteria.map((c, i) => {
            const r = criteriaRating(c.score);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 12,
                  marginBottom: 5,
                  color: "#5F5E5A",
                }}
              >
                <span>{c.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 9px",
                    borderRadius: 20,
                    background: r.bg,
                    color: r.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.label}
                </span>
              </div>
            );
          })}
        </ComponentCard>
      </div>

      {/* -- Feedback sections -- */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FeedbackSection
          title="Essay Analysis"
          strengths={essayFeedback.strengths}
          improvements={essayFeedback.improvements}
          accentGrad="linear-gradient(135deg,#FCD34D,#FBBF24)"
          accentGlow="0 0 8px rgba(251,191,36,.55)"
        />
        <FeedbackSection
          title="Interview Analysis"
          strengths={interviewFeedback.strengths}
          improvements={interviewFeedback.improvements}
          accentGrad="linear-gradient(135deg,#F9A8D4,#F472B6)"
          accentGlow="0 0 8px rgba(244,114,182,.55)"
        />
      </div>
    </div>
  );
}
