import { useState } from "react";
import { ProfileBar } from "./components/ProfileBar";
import EssayReview  from "./pages/EssayReview";
import InterviewSim from "./pages/InterviewSim";
import Dashboard    from "./pages/Dashboard";

const DEFAULT_PROFILE = {
  name: "", gpa: "", major: "Computer Science", activities: "", activity_categories: [], activity_details: {},
  sat: "", ielts: "", act: "", school_name: "MIT",
};

const TABS = [
  { id: "essay",     label: "Essay",     accent: "#2563eb", lightBg: "#eff6ff" },
  { id: "interview", label: "Interview", accent: "#7c3aed", lightBg: "#f5f3ff" },
  { id: "dashboard", label: "Dashboard", accent: "#059669", lightBg: "#ecfdf5" },
];

const css = `
  .nav-wrap {
    display: inline-flex;
    gap: 8px;
    background: #f3f4f6;
    border-radius: 14px;
    padding: 5px;
  }
  .nav-btn {
    position: relative;
    padding: 9px 24px;
    font-size: 13px; font-weight: 500;
    border: none; background: none; cursor: pointer;
    color: #9ca3af; border-radius: 10px;
    transition: color 0.2s, background 0.2s;
    white-space: nowrap; font-family: inherit;
    letter-spacing: 0.01em;
  }
  .nav-btn:hover:not(.active) { color: #6b7280; background: rgba(0,0,0,0.04); }
  .nav-btn.active { font-weight: 700; }

  .page-wrap { animation: pgIn 0.22s ease; }
  @keyframes pgIn {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .page-shell {
    border-radius: 16px; padding: 28px;
    border: 1px solid transparent;
    transition: background 0.3s;
  }
`;

export default function App() {
  const [tab, setTab]                       = useState("essay");
  const [profile, setProfile]               = useState(DEFAULT_PROFILE);
  const [essayScore, setEssayScore]         = useState(null);
  const [interviewScore, setInterviewScore] = useState(null);

  const current = TABS.find(t => t.id === tab);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <style>{css}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
            UniMatch AI
          </h1>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
            MIT · Computer Science
          </div>
        </div>

        <nav style={{ marginLeft: "auto" }}>
          <div className="nav-wrap">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  className={`nav-btn ${active ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                  style={active ? {
                    background: t.accent,
                    color: "white",
                    boxShadow: `0 2px 10px ${t.accent}55`,
                  } : {}}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <ProfileBar profile={profile} onChange={setProfile} />

      {/* Page shell — màu nền khác nhau theo tab */}
      <div className="page-wrap" key={tab}>
        <div
          className="page-shell"
          style={{
            background: current.lightBg,
            borderColor: `${current.accent}22`,
          }}
        >
          {tab === "essay"     && <EssayReview  profile={profile} onResult={setEssayScore} />}
          {tab === "interview" && <InterviewSim profile={profile} onReport={setInterviewScore} />}
          {tab === "dashboard" && (
            <Dashboard profile={profile} essayScore={essayScore} interviewScore={interviewScore} />
          )}
        </div>
      </div>
    </div>
  );
}