import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import AuthPage from "./pages/AuthPage";
import { ProfileBar } from "./components/ProfileBar";
import EssayReview from "./pages/EssayReview";
import InterviewSim from "./pages/InterviewSim";
import Dashboard from "./pages/Dashboard";
import { onUserChange, logOut } from "./lib/firebase";

const DEFAULT_PROFILE = {
  name: "",
  gpa: "",
  major: "Computer Science",
  activities: "",
  activity_categories: [],
  activity_details: {},
  sat: "",
  ielts: "",
  act: "",
  school_name: "MIT",
};

const TABS = [
  { id: "essay", label: "Essay" },
  { id: "interview", label: "Interview" },
  { id: "dashboard", label: "Dashboard" },
];

const T = {
  navy: "#001946",
  cobalt: "#00419e",
  onSurface: "#1b1c1a",
  onSurfaceVar: "#44474d",
  outlineVar: "#c5c6cd",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600;700&display=swap');
  body { background:linear-gradient(160deg,#dbeafe 0%,#ede9fe 40%,#bfdbfe 70%,#e0f2fe 100%)!important; min-height:100vh; color:#1b1c1a!important; font-family:'Inter',-apple-system,sans-serif!important; -webkit-font-smoothing:antialiased; }
  .app-header {
    position:sticky; top:0; z-index:40;
    background:rgba(219,234,254,0.65); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
    box-shadow:0 1px 0 rgba(99,102,241,0.12),0 4px 24px rgba(99,102,241,0.08); border-bottom:1px solid rgba(165,180,252,0.3);
    display:flex; align-items:center; padding:0 28px; height:64px; gap:16px; margin-bottom:24px;
  }
  .brand { font-family:'Manrope',sans-serif; font-weight:800; font-size:17px; color:#001946; letter-spacing:-0.02em; }
  .nav-pill-wrap { display:inline-flex; gap:4px; background:rgba(196,181,253,0.25); border:1px solid rgba(165,180,252,0.3); border-radius:999px; padding:4px; margin-left:auto; }
  .nav-pill { padding:8px 22px; border-radius:999px; border:none; cursor:pointer; font-size:13px; font-weight:600; font-family:'Inter',sans-serif; color:#3730a3; background:transparent; transition:color 0.18s,background 0.18s,box-shadow 0.18s; white-space:nowrap; }
  .nav-pill:hover:not(.active) { color:#001946; background:rgba(255,255,255,0.65); }
  .nav-pill.active { background:linear-gradient(135deg,#00419e 0%,#2559bd 100%); color:#fff; font-weight:700; box-shadow:0 4px 16px rgba(37,89,189,0.3); }
  .page-wrap { animation:pgIn 0.24s ease; }
  @keyframes pgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .page-shell { background:rgba(255,255,255,0.72); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border-radius:20px; padding:28px; box-shadow:0 4px 24px rgba(99,102,241,0.08); border:1px solid rgba(255,255,255,0.8); transition:box-shadow 0.25s ease,border-color 0.25s ease; }
  .page-shell:hover { box-shadow:0 8px 36px rgba(99,102,241,0.16),0 0 0 2px rgba(165,180,252,0.2); border-color:rgba(165,180,252,0.55); }
  .app-enter { animation:appIn 0.4s ease both; }
  @keyframes appIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
`;

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const initials =
    user.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div style={{ position: "relative", marginLeft: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "1.5px solid #c5c6cd",
          borderRadius: 999,
          padding: "4px 12px 4px 4px",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.cobalt)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#c5c6cd")}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
            }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#001946,#2559bd)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "#fff",
              fontFamily: "'Manrope',sans-serif",
            }}
          >
            {initials}
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: T.onSurface }}>
          {user.name?.split(" ")[0]}
        </span>
        <span style={{ fontSize: 10, color: T.onSurfaceVar }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(27,28,26,0.12)",
            padding: 8,
            minWidth: 190,
            zIndex: 100,
            animation: "pgIn 0.15s ease",
          }}
        >
          <div
            style={{
              padding: "10px 12px 12px",
              borderBottom: "1px solid rgba(197,198,205,0.3)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: T.onSurfaceVar, marginTop: 2 }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "none",
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              color: "#c0392b",
              cursor: "pointer",
              borderRadius: 10,
              marginTop: 4,
              fontFamily: "'Inter',sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf2f2")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing"); // "landing" | "auth" | "app"
  const [tab, setTab] = useState("essay");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [essayScore, setEssayScore] = useState(null);
  const [interviewScore, setInterviewScore] = useState(null);

  // Listen to Firebase auth state on mount
  useEffect(() => {
    const unsub = onUserChange((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u) setScreen("app");
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setScreen("landing");
  };

  // Splash while checking auth
  if (!authChecked)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background:
            "linear-gradient(160deg,#dbeafe 0%,#ede9fe 40%,#bfdbfe 70%,#e0f2fe 100%)",
        }}
      >
        <div
          style={{
            fontFamily: "'Manrope',sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: T.navy,
            opacity: 0.4,
          }}
        >
          UniMatch AI
        </div>
      </div>
    );

  return (
    <>
      <style>{css}</style>

      {screen === "landing" && (
        <LandingPage
          onEnter={() => (user ? setScreen("app") : setScreen("auth"))}
          onLogin={() => setScreen("auth")}
          onRegister={() => setScreen("auth")}
        />
      )}

      {screen === "auth" && (
        <AuthPage
          onSuccess={(u) => {
            setUser(u);
            setScreen("app");
          }}
          onBack={() => setScreen("landing")}
        />
      )}

      {screen === "app" && user && (
        <div
          style={{
            minHeight: "100vh",
            background:
              "linear-gradient(160deg,#dbeafe 0%,#ede9fe 40%,#bfdbfe 70%,#e0f2fe 100%)",
            position: "relative",
          }}
        >
          {/* Grid overlay */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
              backgroundImage:
                "linear-gradient(rgba(99,102,241,0.09) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.09) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage:
                "radial-gradient(ellipse 90% 80% at 50% 20%,black 20%,transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 90% 80% at 50% 20%,black 20%,transparent 100%)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "-5%",
              left: "15%",
              width: 500,
              height: 500,
              borderRadius: "50%",
              background: "rgba(147,197,253,0.3)",
              filter: "blur(90px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "30%",
              right: "-5%",
              width: 380,
              height: 380,
              borderRadius: "50%",
              background: "rgba(196,181,253,0.2)",
              filter: "blur(80px)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <header
            className="app-header app-enter"
            style={{ position: "sticky", zIndex: 10 }}
          >
            <span className="brand">UniMatch AI</span>

            <nav className="nav-pill-wrap">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={`nav-pill ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <UserMenu user={user} onLogout={handleLogout} />
          </header>

          <div
            style={{
              maxWidth: 980,
              margin: "0 auto",
              padding: "0 20px 40px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <ProfileBar profile={profile} onChange={setProfile} />
            <div className="page-wrap" key={tab}>
              <div className="page-shell">
                {tab === "essay" && (
                  <EssayReview profile={profile} onResult={setEssayScore} />
                )}
                {tab === "interview" && (
                  <InterviewSim
                    profile={profile}
                    onReport={setInterviewScore}
                  />
                )}
                {tab === "dashboard" && (
                  <Dashboard
                    profile={profile}
                    essayScore={essayScore}
                    interviewScore={interviewScore}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
