import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import AuthPage    from "./pages/AuthPage";
import { ProfileBar } from "./components/ProfileBar";
import EssayReview  from "./pages/EssayReview";
import InterviewSim from "./pages/InterviewSim";
import Dashboard    from "./pages/Dashboard";
import ProfilePage  from "./pages/ProfilePage";
import { onUserChange, logOut, saveHistoryEntry } from "./lib/firebase";

const DEFAULT_PROFILE = {
  name: "", gpa: "", major: "Computer Science", activities: "",
  activity_categories: [], activity_details: {},
  sat: "", ielts: "", act: "", school_name: "MIT",
};

const TABS = [
  { id: "essay",     label: "Essay" },
  { id: "interview", label: "Interview" },
  { id: "dashboard", label: "Dashboard" },
];

const T = {
  navy: "#001946", cobalt: "#00419e",
  onSurface: "#1b1c1a", onSurfaceVar: "#44474d", outlineVar: "#c5c6cd",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');
  body { background:#fbf9f5!important; color:#1b1c1a!important; font-family:'Inter',-apple-system,sans-serif!important; -webkit-font-smoothing:antialiased; }
  .app-header {
    position:sticky; top:0; z-index:40;
    background:rgba(251,249,245,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    box-shadow:0 1px 40px rgba(27,28,26,0.06);
    display:flex; align-items:center; padding:0 28px; height:64px; gap:16px; margin-bottom:24px;
  }
  .brand { font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; color:#001946; letter-spacing:-0.02em; }
  .nav-pill-wrap { display:inline-flex; gap:4px; background:#efeeea; border-radius:999px; padding:4px; margin-left:auto; }
  .nav-pill { padding:8px 22px; border-radius:999px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; color:#44474d; background:transparent; transition:color 0.18s,background 0.18s,box-shadow 0.18s; white-space:nowrap; }
  .nav-pill:hover:not(.active) { color:#001946; background:rgba(255,255,255,0.65); }
  .nav-pill.active { background:linear-gradient(135deg,#00419e 0%,#2559bd 100%); color:#fff; font-weight:700; box-shadow:0 4px 16px rgba(37,89,189,0.3); }
  .page-wrap { animation:pgIn 0.24s ease; }
  @keyframes pgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .page-shell { background:#fff; border-radius:20px; padding:28px; box-shadow:0 4px 24px rgba(27,28,26,0.05); }
  .app-enter { animation:appIn 0.4s ease both; }
  @keyframes appIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
`;

function UserMenu({ user, onLogout, onProfile }) {
  const [open, setOpen] = useState(false);
  const initials = user.name?.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() || "U";

  return (
    <div style={{ position: "relative", marginLeft: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "1.5px solid #c5c6cd",
          borderRadius: 999, padding: "4px 12px 4px 4px",
          cursor: "pointer", transition: "border-color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = T.cobalt}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#c5c6cd"}
      >
        {user.avatar
          ? <img src={user.avatar} alt="" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }} referrerPolicy="no-referrer" />
          : <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#001946,#2559bd)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"'Manrope',sans-serif" }}>{initials}</div>
        }
        <span style={{ fontSize:13, fontWeight:600, color:T.onSurface }}>{user.name?.split(" ")[0]}</span>
        <span style={{ fontSize:10, color:T.onSurfaceVar }}>▾</span>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", right:0,
          background:"#fff", borderRadius:16,
          boxShadow:"0 8px 32px rgba(27,28,26,0.12)",
          padding:8, minWidth:190, zIndex:100,
          animation:"pgIn 0.15s ease",
        }}>
          <div style={{ padding:"10px 12px 12px", borderBottom:"1px solid rgba(197,198,205,0.3)" }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{user.name}</div>
            <div style={{ fontSize:11, color:T.onSurfaceVar, marginTop:2 }}>{user.email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); onProfile(); }}
            style={{
              display:"flex", alignItems:"center", gap:8,
              width:"100%", textAlign:"left",
              padding:"10px 12px", background:"none", border:"none",
              fontSize:13, fontWeight:600, color:T.onSurface,
              cursor:"pointer", borderRadius:10, marginTop:4,
              fontFamily:"'Inter',sans-serif", transition:"background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <span>👤</span> Hồ sơ cá nhân
          </button>
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            style={{
              display:"block", width:"100%", textAlign:"left",
              padding:"10px 12px", background:"none", border:"none",
              fontSize:13, fontWeight:600, color:"#c0392b",
              cursor:"pointer", borderRadius:10,
              fontFamily:"'Inter',sans-serif", transition:"background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#fdf2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen]   = useState("landing");
  const [tab, setTab]         = useState("essay");
  const [user, setUser]       = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile]               = useState(DEFAULT_PROFILE);
  const [essayScore, setEssayScore]         = useState(null);
  const [interviewScore, setInterviewScore] = useState(null);

  useEffect(() => {
    const unsub = onUserChange((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) setScreen("app");
    });
    return unsub;
  }, []);

  // Save FULL essay result
  async function handleEssayResult(data) {
    setEssayScore(data);
    if (user?.uid) {
      try {
        await saveHistoryEntry(user.uid, "essay", {
          school: profile.school_name || "MIT",
          // summary fields for card display
          scores: data.scores || {},
          summary: data.summary || "",
          // full result để xem lại
          full_result: data,
        });
      } catch (e) { console.warn("Save essay failed:", e); }
    }
  }

  // Save FULL interview result
  async function handleInterviewReport(data) {
    setInterviewScore(data);
    if (user?.uid) {
      try {
        await saveHistoryEntry(user.uid, "interview", {
          school: profile.school_name || "MIT",
          overall_score: data.overall_score || 0,
          dimension_scores: data.dimension_scores || {},
          summary: data.summary || "",
          // full result để xem lại
          full_result: data,
        });
      } catch (e) { console.warn("Save interview failed:", e); }
    }
  }

  // Save FULL dashboard result
  async function handleDashboardResult(scoreData) {
    if (user?.uid && scoreData) {
      try {
        await saveHistoryEntry(user.uid, "dashboard", {
          school: scoreData.school || profile.school_name || "MIT",
          tier: scoreData.tier || "reach",
          overall_score: scoreData.overall_score || 0,
          estimated_probability: scoreData.estimated_probability || 0,
          component_scores: scoreData.component_scores || {},
          top_gaps: scoreData.top_gaps || [],
          // full result để xem lại
          full_result: scoreData,
        });
      } catch (e) { console.warn("Save dashboard failed:", e); }
    }
  }

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setScreen("landing");
  };

  if (!authChecked) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#fbf9f5" }}>
      <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:18, color:T.navy, opacity:0.4 }}>UniMatch AI</div>
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {screen === "landing" && (
        <LandingPage
          onEnter={() => user ? setScreen("app") : setScreen("auth")}
          onLogin={() => setScreen("auth")}
          onRegister={() => setScreen("auth")}
        />
      )}

      {screen === "auth" && (
        <AuthPage
          onSuccess={(u) => { setUser(u); setScreen("app"); }}
          onBack={() => setScreen("landing")}
        />
      )}

      {(screen === "app" || screen === "profile") && user && (
        <div style={{ minHeight:"100vh", background:"#fbf9f5" }}>
          <header className="app-header app-enter">
            <span className="brand">UniMatch AI</span>

            {screen === "app" && (
              <nav className="nav-pill-wrap">
                {TABS.map(t => (
                  <button key={t.id} className={`nav-pill ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </nav>
            )}

            {screen === "profile" && (
              <button
                onClick={() => setScreen("app")}
                style={{
                  marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
                  background:"none", border:"1.5px solid #c5c6cd", borderRadius:999,
                  padding:"6px 16px", cursor:"pointer", fontSize:13, fontWeight:600, color:T.onSurface,
                }}
              >
                ← Quay lại
              </button>
            )}

            <UserMenu user={user} onLogout={handleLogout} onProfile={() => setScreen("profile")} />
          </header>

          <div style={{ maxWidth:980, margin:"0 auto", padding:"0 20px 40px" }}>
            {screen === "profile" ? (
              <div className="page-wrap">
                <div className="page-shell">
                  <ProfilePage user={user} />
                </div>
              </div>
            ) : (
              <>
                <ProfileBar profile={profile} onChange={setProfile} />
                <div className="page-wrap" key={tab}>
                  <div className="page-shell">
                    {tab==="essay"     && <EssayReview  profile={profile} onResult={handleEssayResult} />}
                    {tab==="interview" && <InterviewSim profile={profile} onReport={handleInterviewReport} />}
                    {tab==="dashboard" && <Dashboard    profile={profile} essayScore={essayScore} interviewScore={interviewScore} onSave={handleDashboardResult} />}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}