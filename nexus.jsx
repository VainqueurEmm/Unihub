
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Firebase init ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyB2z3FyUOAxr09WqPNA7pdHwjERzs-gT4U",
  authDomain: "unihub-63121.firebaseapp.com",
  projectId: "unihub-63121",
  storageBucket: "unihub-63121.firebasestorage.app",
  messagingSenderId: "131658609125",
  appId: "1:131658609125:web:fe0cd9fac5d1bfd0473f0c",
  measurementId: "G-6H13Z0446W",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ── Constants ──────────────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm
const TAGS = ["#General", "#CAT", "#Assignment", "#Exam", "#VenueChange", "#Urgent"];
const TAG_COLORS = {
  "#General": "#4ade80",
  "#CAT": "#f97316",
  "#Assignment": "#60a5fa",
  "#Exam": "#f43f5e",
  "#VenueChange": "#a78bfa",
  "#Urgent": "#fbbf24",
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const G = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a26",
  border: "#2a2a3a",
  accent: "#6ee7b7",
  accent2: "#34d399",
  text: "#e2e8f0",
  muted: "#64748b",
  danger: "#f43f5e",
  warn: "#fbbf24",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${G.bg}; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; }

  .nexus-title { font-family: 'Syne', sans-serif; font-weight: 800; letter-spacing: -1px; }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .slide-up { animation: slideUp 0.3s ease forwards; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .glow { box-shadow: 0 0 20px rgba(110,231,183,0.15); }
  .tag-pill { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
  .nav-btn { background: none; border: none; padding: 10px 16px; border-radius: 10px; color: ${G.muted}; font-size: 13px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .nav-btn:hover, .nav-btn.active { background: ${G.card}; color: ${G.accent}; }
  .nav-btn.active { color: ${G.accent}; }
  .btn-primary { background: ${G.accent}; color: #0a0a0f; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
  .btn-primary:hover { background: ${G.accent2}; transform: translateY(-1px); }
  .btn-ghost { background: transparent; border: 1px solid ${G.border}; color: ${G.text}; padding: 9px 18px; border-radius: 10px; font-size: 14px; transition: all 0.2s; }
  .btn-ghost:hover { border-color: ${G.accent}; color: ${G.accent}; }
  .btn-danger { background: transparent; border: 1px solid ${G.danger}; color: ${G.danger}; padding: 6px 14px; border-radius: 8px; font-size: 12px; transition: all 0.2s; }
  .btn-danger:hover { background: ${G.danger}; color: white; }
  .input-field { width: 100%; background: ${G.surface}; border: 1px solid ${G.border}; color: ${G.text}; padding: 11px 14px; border-radius: 10px; font-size: 14px; outline: none; transition: border 0.2s; }
  .input-field:focus { border-color: ${G.accent}; }
  .input-field::placeholder { color: ${G.muted}; }
  .card { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 16px; padding: 20px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal-box { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 20px; padding: 28px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .timetable-cell { border: 1px solid ${G.border}; padding: 4px; min-height: 56px; border-radius: 6px; background: ${G.surface}; position: relative; overflow: hidden; }
  .unit-block { border-radius: 6px; padding: 4px 6px; font-size: 10px; line-height: 1.3; cursor: pointer; transition: opacity 0.2s; }
  .unit-block:hover { opacity: 0.85; }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
const timeStr = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
const unitColors = ["#6ee7b7","#60a5fa","#f97316","#a78bfa","#f43f5e","#fbbf24","#34d399","#38bdf8","#fb7185","#c084fc"];
const getColor = (str) => unitColors[(str || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % unitColors.length];
const now = () => new Date();
const fmtDate = (ts) => ts?.toDate ? ts.toDate().toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

// ── Auth Screen ────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [method, setMethod] = useState("email"); // email | regnumber
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getEmail = () => method === "regnumber" ? `${regNo.toLowerCase().replace(/\s/g,"")}@tum.ac.ke` : email;

  const handleEmailAuth = async () => {
    setError(""); setLoading(true);
    try {
      const em = getEmail();
      if (mode === "register") {
        if (!displayName.trim()) { setError("Enter your full name"); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, em, password);
        await updateProfile(cred.user, { displayName });
        await setDoc(doc(db, "users", cred.user.uid), { displayName, email: em, regNo: method === "regnumber" ? regNo : "", createdAt: serverTimestamp() });
      } else {
        await signInWithEmailAndPassword(auth, em, password);
      }
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth.*\)\.?/, ""));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, { displayName: cred.user.displayName, email: cred.user.email, createdAt: serverTimestamp() });
    } catch (e) {
      setError(e.message.replace("Firebase: ", ""));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: `radial-gradient(ellipse at 20% 50%, rgba(110,231,183,0.06) 0%, transparent 60%), ${G.bg}` }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, background: G.accent, borderRadius: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 24, fontFamily: "Syne", fontWeight: 800, color: "#0a0a0f" }}>N</span>
          </div>
          <h1 className="nexus-title" style={{ fontSize: 32, color: G.text }}>Nexus</h1>
          <p style={{ color: G.muted, fontSize: 14, marginTop: 4 }}>BSCS Year 2 · TUM</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", background: G.surface, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === m ? G.accent : "transparent", color: mode === m ? "#0a0a0f" : G.muted, fontWeight: 600, fontSize: 13, transition: "all 0.2s" }}>
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Method toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["email","regnumber"].map(m => (
              <button key={m} onClick={() => { setMethod(m); setError(""); }} className="btn-ghost" style={{ flex: 1, fontSize: 12, padding: "7px 0", borderColor: method === m ? G.accent : G.border, color: method === m ? G.accent : G.muted }}>
                {m === "email" ? "Email" : "Reg Number"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <input className="input-field" placeholder="Full Name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
          )}

          {method === "regnumber" ? (
            <div style={{ marginBottom: 14 }}>
              <input className="input-field" placeholder="Reg Number (e.g. CT101/00123/22)" value={regNo} onChange={e => setRegNo(e.target.value)} />
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <input className="input-field" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmailAuth()} />
          </div>

          {error && <p style={{ color: G.danger, fontSize: 13, marginBottom: 14, background: "rgba(244,63,94,0.1)", padding: "8px 12px", borderRadius: 8 }}>{error}</p>}

          <button className="btn-primary" style={{ width: "100%", padding: "12px 0", marginBottom: 12 }} onClick={handleEmailAuth} disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: G.border }} />
            <span style={{ color: G.muted, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: G.border }} />
          </div>

          <button onClick={handleGoogle} disabled={loading} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: `1px solid ${G.border}`, background: "transparent", color: G.text, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#4285f4"}
            onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.9 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-21 0-1.4-.1-2.7-.5-4z"/></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Announcements ──────────────────────────────────────────────────────────────
function Announcements({ user }) {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("#General");
  const [pinned, setPinned] = useState(false);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, []);

  const submit = async () => {
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "announcements"), {
      title, body, tag, pinned,
      author: user.displayName || user.email,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
    setTitle(""); setBody(""); setTag("#General"); setPinned(false);
    setShowForm(false); setLoading(false);
  };

  const del = async (id, uid) => {
    if (uid !== user.uid) return;
    await deleteDoc(doc(db, "announcements", id));
  };

  const filtered = filter === "All" ? posts : posts.filter(p => p.tag === filter);
  const pinnedPosts = filtered.filter(p => p.pinned);
  const regularPosts = filtered.filter(p => !p.pinned);
  const ordered = [...pinnedPosts, ...regularPosts];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 className="nexus-title" style={{ fontSize: 22 }}>Announcements</h2>
          <p style={{ color: G.muted, fontSize: 13 }}>{posts.length} posts · live</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Post</button>
      </div>

      {/* Tag filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {["All", ...TAGS].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 14px", borderRadius: 999, border: `1px solid ${filter === t ? TAG_COLORS[t] || G.accent : G.border}`, background: filter === t ? (TAG_COLORS[t] || G.accent) + "20" : "transparent", color: filter === t ? (TAG_COLORS[t] || G.accent) : G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ordered.length === 0 && <div style={{ textAlign: "center", padding: 60, color: G.muted }}>No announcements yet. Be the first to post!</div>}
        {ordered.map((p, i) => (
          <div key={p.id} className="card slide-up" style={{ borderLeft: `3px solid ${TAG_COLORS[p.tag] || G.accent}`, animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  {p.pinned && <span style={{ fontSize: 10, background: G.warn + "20", color: G.warn, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>📌 PINNED</span>}
                  <span className="tag-pill" style={{ background: (TAG_COLORS[p.tag] || G.accent) + "20", color: TAG_COLORS[p.tag] || G.accent }}>{p.tag}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.title}</h3>
                <p style={{ color: G.muted, fontSize: 13, lineHeight: 1.6 }}>{p.body}</p>
                <p style={{ color: G.muted, fontSize: 11, marginTop: 10 }}>By {p.author} · {fmtDate(p.createdAt)}</p>
              </div>
              {p.uid === user.uid && (
                <button className="btn-danger" onClick={() => del(p.id, p.uid)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Post Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box slide-up">
            <h3 className="nexus-title" style={{ fontSize: 20, marginBottom: 20 }}>New Announcement</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input className="input-field" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea className="input-field" placeholder="Write your announcement..." rows={4} value={body} onChange={e => setBody(e.target.value)} style={{ resize: "vertical" }} />
              <div>
                <p style={{ fontSize: 12, color: G.muted, marginBottom: 8 }}>Tag</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {TAGS.map(t => (
                    <button key={t} onClick={() => setTag(t)} style={{ padding: "4px 12px", borderRadius: 999, border: `1px solid ${tag === t ? TAG_COLORS[t] : G.border}`, background: tag === t ? TAG_COLORS[t] + "25" : "transparent", color: tag === t ? TAG_COLORS[t] : G.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ accentColor: G.accent, width: 16, height: 16 }} />
                <span style={{ fontSize: 13 }}>Pin this announcement</span>
              </label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={submit} disabled={loading}>{loading ? "Posting..." : "Post Announcement"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timetable ──────────────────────────────────────────────────────────────────
function Timetable({ user }) {
  const [units, setUnits] = useState([]);
  const [slots, setSlots] = useState([]);
  const [view, setView] = useState("grid"); // grid | today
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitLecturer, setUnitLecturer] = useState("");
  const [slotUnit, setSlotUnit] = useState("");
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState(8);
  const [slotEnd, setSlotEnd] = useState(10);
  const [slotVenue, setSlotVenue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "units"), snap => setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsub2 = onSnapshot(collection(db, "slots"), snap => setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, []);

  const addUnit = async () => {
    if (!unitName.trim() || !unitCode.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "units"), { name: unitName, code: unitCode, lecturer: unitLecturer, addedBy: user.uid });
    setUnitName(""); setUnitCode(""); setUnitLecturer("");
    setShowUnitForm(false); setLoading(false);
  };

  const delUnit = async (id) => {
    await deleteDoc(doc(db, "units", id));
    // also delete related slots
    const related = slots.filter(s => s.unitId === id);
    await Promise.all(related.map(s => deleteDoc(doc(db, "slots", s.id))));
  };

  const addSlot = async () => {
    if (!slotUnit || slotEnd <= slotStart) return;
    setLoading(true);
    await addDoc(collection(db, "slots"), { unitId: slotUnit, day: slotDay, start: slotStart, end: slotEnd, venue: slotVenue });
    setSlotUnit(""); setSlotVenue(""); setShowSlotForm(false); setLoading(false);
  };

  const delSlot = async (id) => await deleteDoc(doc(db, "slots", id));

  const getSlotForCell = (day, hour) => {
    return slots.filter(s => s.day === day && s.start <= hour && s.end > hour);
  };

  const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now().getDay()];
  const todaySlots = slots.filter(s => s.day === todayName).sort((a,b) => a.start - b.start);
  const nowHour = now().getHours() + now().getMinutes() / 60;
  const currentSlot = todaySlots.find(s => s.start <= nowHour && s.end > nowHour);
  const nextSlot = todaySlots.find(s => s.start > nowHour);

  const getUnit = (id) => units.find(u => u.id === id);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="nexus-title" style={{ fontSize: 22 }}>Timetable</h2>
          <p style={{ color: G.muted, fontSize: 13 }}>{units.length} units · {slots.length} sessions</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", background: G.surface, borderRadius: 10, padding: 3 }}>
            {["grid","today"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: view === v ? G.accent : "transparent", color: view === v ? "#0a0a0f" : G.muted, fontWeight: 600, fontSize: 12, transition: "all 0.2s" }}>{v === "grid" ? "Weekly" : "Today"}</button>
            ))}
          </div>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowUnitForm(true)}>+ Unit</button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowSlotForm(true)}>+ Session</button>
        </div>
      </div>

      {/* Today View */}
      {view === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Now/Next cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card" style={{ borderColor: currentSlot ? G.accent : G.border }}>
              <p style={{ fontSize: 10, color: G.accent, fontWeight: 700, marginBottom: 6 }}>NOW</p>
              {currentSlot ? (
                <>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{getUnit(currentSlot.unitId)?.code}</p>
                  <p style={{ color: G.muted, fontSize: 12 }}>{currentSlot.venue || "No venue"}</p>
                  <p style={{ color: G.muted, fontSize: 11, marginTop: 4 }}>Until {timeStr(currentSlot.end)}</p>
                </>
              ) : <p style={{ color: G.muted, fontSize: 13 }}>Free period</p>}
            </div>
            <div className="card">
              <p style={{ fontSize: 10, color: G.muted, fontWeight: 700, marginBottom: 6 }}>NEXT</p>
              {nextSlot ? (
                <>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{getUnit(nextSlot.unitId)?.code}</p>
                  <p style={{ color: G.muted, fontSize: 12 }}>{nextSlot.venue || "No venue"}</p>
                  <p style={{ color: G.muted, fontSize: 11, marginTop: 4 }}>{timeStr(nextSlot.start)}</p>
                </>
              ) : <p style={{ color: G.muted, fontSize: 13 }}>Nothing more today</p>}
            </div>
          </div>

          <h3 style={{ fontSize: 14, color: G.muted, fontWeight: 600 }}>{todayName}'s Schedule</h3>
          {todaySlots.length === 0 && <div style={{ textAlign: "center", padding: 40, color: G.muted }}>No classes today 🎉</div>}
          {todaySlots.map(s => {
            const u = getUnit(s.unitId);
            const isPast = s.end <= nowHour;
            const isCurrent = s.start <= nowHour && s.end > nowHour;
            return (
              <div key={s.id} className="card" style={{ borderLeft: `3px solid ${getColor(s.unitId)}`, opacity: isPast ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    {isCurrent && <span style={{ fontSize: 10, background: G.accent + "20", color: G.accent, padding: "2px 8px", borderRadius: 999, fontWeight: 700, display: "inline-block", marginBottom: 6 }}>● ONGOING</span>}
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{u?.code} <span style={{ fontWeight: 400, color: G.muted }}>— {u?.name}</span></p>
                    <p style={{ color: G.muted, fontSize: 13, marginTop: 2 }}>{timeStr(s.start)} – {timeStr(s.end)} · {s.venue || "TBA"}</p>
                    {u?.lecturer && <p style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{u.lecturer}</p>}
                  </div>
                  <button className="btn-danger" onClick={() => delSlot(s.id)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {view === "grid" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 700 }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", gap: 4, marginBottom: 4 }}>
              <div />
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: d === todayName ? G.accent : G.muted, padding: "6px 0" }}>{d.slice(0,3)}</div>
              ))}
            </div>
            {/* Time rows */}
            {HOURS.map(h => (
              <div key={h} style={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", gap: 4, marginBottom: 4 }}>
                <div style={{ fontSize: 10, color: G.muted, textAlign: "right", paddingRight: 8, paddingTop: 4 }}>{timeStr(h)}</div>
                {DAYS.map(d => {
                  const cellSlots = getSlotForCell(d, h);
                  return (
                    <div key={d} className="timetable-cell">
                      {cellSlots.map(s => {
                        const u = getUnit(s.unitId);
                        const isFirst = s.start === h;
                        if (!isFirst) return <div key={s.id} style={{ height: "100%", background: getColor(s.unitId) + "18" }} />;
                        return (
                          <div key={s.id} className="unit-block" style={{ background: getColor(s.unitId) + "25", borderLeft: `2px solid ${getColor(s.unitId)}`, color: getColor(s.unitId) }}>
                            <div style={{ fontWeight: 700 }}>{u?.code}</div>
                            {s.venue && <div style={{ color: G.muted, fontSize: 9 }}>{s.venue}</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Units list */}
      <div style={{ marginTop: 32 }}>
        <h3 className="nexus-title" style={{ fontSize: 16, marginBottom: 14 }}>Registered Units</h3>
        {units.length === 0 && <p style={{ color: G.muted, fontSize: 13 }}>No units added yet. Click "+ Unit" to add your first.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {units.map(u => (
            <div key={u.id} className="card" style={{ borderLeft: `3px solid ${getColor(u.id)}`, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: getColor(u.id) }}>{u.code}</p>
                  <p style={{ fontSize: 13, marginTop: 2 }}>{u.name}</p>
                  {u.lecturer && <p style={{ color: G.muted, fontSize: 11, marginTop: 2 }}>{u.lecturer}</p>}
                </div>
                <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => delUnit(u.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Unit Modal */}
      {showUnitForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowUnitForm(false)}>
          <div className="modal-box slide-up">
            <h3 className="nexus-title" style={{ fontSize: 20, marginBottom: 20 }}>Add Unit</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input-field" placeholder="Unit Code (e.g. EEE 4250)" value={unitCode} onChange={e => setUnitCode(e.target.value)} />
              <input className="input-field" placeholder="Unit Name (e.g. Digital Electronics)" value={unitName} onChange={e => setUnitName(e.target.value)} />
              <input className="input-field" placeholder="Lecturer (optional)" value={unitLecturer} onChange={e => setUnitLecturer(e.target.value)} />
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowUnitForm(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={addUnit} disabled={loading}>{loading ? "Saving..." : "Add Unit"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showSlotForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSlotForm(false)}>
          <div className="modal-box slide-up">
            <h3 className="nexus-title" style={{ fontSize: 20, marginBottom: 20 }}>Add Session</h3>
            {units.length === 0 ? (
              <p style={{ color: G.warn }}>Please add at least one unit first.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <select className="input-field" value={slotUnit} onChange={e => setSlotUnit(e.target.value)}>
                  <option value="">Select Unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.code} — {u.name}</option>)}
                </select>
                <select className="input-field" value={slotDay} onChange={e => setSlotDay(e.target.value)}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>Start Time</p>
                    <select className="input-field" value={slotStart} onChange={e => setSlotStart(Number(e.target.value))}>
                      {HOURS.map(h => <option key={h} value={h}>{timeStr(h)}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: G.muted, marginBottom: 6 }}>End Time</p>
                    <select className="input-field" value={slotEnd} onChange={e => setSlotEnd(Number(e.target.value))}>
                      {HOURS.slice(1).map(h => <option key={h} value={h}>{timeStr(h)}</option>)}
                    </select>
                  </div>
                </div>
                <input className="input-field" placeholder="Venue (e.g. LT3, Lab 2)" value={slotVenue} onChange={e => setSlotVenue(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowSlotForm(false)}>Cancel</button>
                  <button className="btn-primary" style={{ flex: 2 }} onClick={addSlot} disabled={loading}>{loading ? "Saving..." : "Add Session"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState("announcements");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.bg }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${G.border}`, borderTopColor: G.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: G.muted, fontSize: 14 }}>Loading Nexus...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) return <><style>{css}</style><AuthScreen onAuth={setUser} /></>;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 80% 10%, rgba(110,231,183,0.04) 0%, transparent 50%), ${G.bg}` }}>
        {/* Top Nav */}
        <nav style={{ background: G.surface, borderBottom: `1px solid ${G.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: G.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: "#0a0a0f" }}>N</span>
              </div>
              <span className="nexus-title" style={{ fontSize: 18 }}>Nexus</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "announcements", label: "Announcements", icon: "📢" },
                { id: "timetable", label: "Timetable", icon: "📅" },
              ].map(t => (
                <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                  <span>{t.icon}</span><span style={{ display: window.innerWidth > 500 ? "inline" : "none" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right", display: window.innerWidth > 400 ? "block" : "none" }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{user.displayName || "Student"}</p>
              <p style={{ fontSize: 11, color: G.muted }}>BSCS Year 2</p>
            </div>
            <button onClick={() => signOut(auth)} className="btn-ghost" style={{ fontSize: 12, padding: "6px 14px" }}>Sign Out</button>
          </div>
        </nav>

        {/* Content */}
        <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
          {tab === "announcements" && <Announcements user={user} />}
          {tab === "timetable" && <Timetable user={user} />}
        </main>
      </div>
    </>
  );
}
