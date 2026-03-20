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
  { id: "essay",     label: "📝 Essay" },
  { id: "interview", label: "🎤 Interview" },
  { id: "dashboard", label: "📊 Dashboard" },
];

export default function App() {
  const [tab, setTab]                 = useState("essay");
  const [profile, setProfile]         = useState(DEFAULT_PROFILE);
  const [essayScore, setEssayScore]   = useState(null);
  const [interviewScore, setInterviewScore] = useState(null);

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#1e40af" }}>🎓 UniMatch AI</h1>
        <nav style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none",
                background: tab === t.id ? "#1e40af" : "#f3f4f6",
                color: tab === t.id ? "white" : "#374151",
                fontWeight: 500, fontSize: 14,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Shared profile inputs */}
      <ProfileBar profile={profile} onChange={setProfile} />

      {/* Page content */}
      {tab === "essay"     && <EssayReview  profile={profile} onResult={setEssayScore} />}
      {tab === "interview" && <InterviewSim profile={profile} onReport={setInterviewScore} />}
      {tab === "dashboard" && (
        <Dashboard
          profile={profile}
          essayScore={essayScore}
          interviewScore={interviewScore}
        />
      )}
    </div>
  );
}