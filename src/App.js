import { useState, useRef, useEffect, useCallback } from "react";

// ── Supabase config ──────────────────────────────────────────
const SUPABASE_URL = "https://dxsdqsnindodsivauvyd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4c2Rxc25pbmRvZHNpdmF1dnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzU3NzQsImV4cCI6MjA5MjQ1MTc3NH0.jiBZAlUdHDqP2So_VTL0Ot9_H6eDYXyOtiiZHPtMn_E";

const sb = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  get: (table, query = "") => sb(`${table}?${query}`),
  insert: (table, data) => sb(table, { method: "POST", body: JSON.stringify(data) }),
  update: (table, query, data) => sb(`${table}?${query}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (table, query) => sb(`${table}?${query}`, { method: "DELETE", prefer: "return=minimal" }),
  upsert: (table, data) => sb(table, { method: "POST", body: JSON.stringify(data), prefer: "resolution=merge-duplicates,return=representation" }),
};

// ── Constants ────────────────────────────────────────────────
const COLORS = {
  garnet: "#4E0A0B", garnetLight: "#7a1215",
  cottonCandy: "#E38792", cottonCandyLight: "#f0b3bb",
  cottonCandyBg: "#fce8eb",
  khaki: "#9DAD71", khakiLight: "#b8c98a",
};
const ADMIN_NAME = "Yasmine. S";
const ADMIN_PASS = "AdminSMut99";
const GENRES = ["Romance","Fantasy","Mystery","Thriller","Historical Fiction","Literary Fiction","Sci-Fi","Non-Fiction","Horror","YA","Biography","Self-Help"];
const AVATARS = ["🌸","📖","🌹","🦋","✨","🌿","🎭","🌙","🍵","🕯️","💌","🌺"];
const SHELF_LABELS = { read: "Read", reading: "Currently Reading", want: "Want to Read" };
const SHELF_COLORS = { read: COLORS.khaki, reading: COLORS.cottonCandy, want: COLORS.garnetLight };
const GIFS = [
  { label: "Cozy reading", url: "https://media.giphy.com/media/NV4cSrRYXXwfUcYnua/giphy.gif" },
  { label: "Book love", url: "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif" },
  { label: "Tea time", url: "https://media.giphy.com/media/3oEjHQgEHRUMiVbpZC/giphy.gif" },
  { label: "Excited", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif" },
  { label: "Heart", url: "https://media.giphy.com/media/26FLdaDQ5f72FPbEI/giphy.gif" },
  { label: "Flowers", url: "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif" },
];

// ── UI helpers ───────────────────────────────────────────────
const iStyle = (extra = {}) => ({
  padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${COLORS.cottonCandy}`,
  fontSize: 14, fontFamily: "Georgia, serif", background: "#fff", outline: "none",
  boxSizing: "border-box", width: "100%", ...extra,
});

function Btn({ onClick, children, color = COLORS.garnet, textColor = "#fff", disabled = false, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "9px 20px", background: disabled ? "#ccc" : color, color: disabled ? "#fff" : textColor, border: "none", borderRadius: 20, cursor: disabled ? "default" : "pointer", fontSize: 13, fontFamily: "Georgia, serif", fontWeight: 600, ...style }}>
      {children}
    </button>
  );
}

function Stars({ rating, onRate, size = 16 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onRate?.(s)} onMouseEnter={() => onRate && setHover(s)} onMouseLeave={() => setHover(0)}
          style={{ fontSize: size, cursor: onRate ? "pointer" : "default", color: s <= (hover || rating || 0) ? "#c8860a" : "#ddd" }}>★</span>
      ))}
    </div>
  );
}

function AvatarImg({ member, size = 40 }) {
  if (member?.profile_pic) return <img src={member.profile_pic} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${COLORS.cottonCandy}`, flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS.cottonCandyLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5, flexShrink: 0, border: `2px solid ${COLORS.cottonCandyLight}` }}>{member?.avatar || "📖"}</div>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: `1.5px solid ${COLORS.cottonCandyLight}`, ...style }}>{children}</div>;
}

function BookCard({ book, entry, onShelfChange, onReview, isOwn }) {
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState(entry?.review || "");
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 14, border: `1.5px solid ${COLORS.cottonCandyLight}` }}>
      <div style={{ fontSize: 34, textAlign: "center", marginBottom: 6 }}>{book.cover}</div>
      <div style={{ fontWeight: 700, fontSize: 12, color: COLORS.garnet, textAlign: "center" }}>{book.title}</div>
      <div style={{ fontSize: 11, color: "#999", textAlign: "center", marginBottom: 6 }}>{book.author}</div>
      <div style={{ fontSize: 10, background: COLORS.cottonCandyLight, color: COLORS.garnet, borderRadius: 20, padding: "2px 8px", display: "inline-block", marginBottom: 6 }}>{book.genre}</div>
      {entry && <div style={{ marginBottom: 6 }}><span style={{ fontSize: 10, color: "#fff", background: SHELF_COLORS[entry.shelf], borderRadius: 20, padding: "2px 8px" }}>{SHELF_LABELS[entry.shelf]}</span></div>}
      {entry?.rating > 0 && <Stars rating={entry.rating} size={13} />}
      {entry?.review && <div style={{ fontSize: 11, color: "#777", fontStyle: "italic", marginTop: 4 }}>"{entry.review}"</div>}
      {isOwn && (
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.keys(SHELF_LABELS).map(s => (
            <button key={s} onClick={() => onShelfChange(book.id, s)}
              style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, border: "none", cursor: "pointer", background: entry?.shelf === s ? SHELF_COLORS[s] : "#eee", color: entry?.shelf === s ? "#fff" : "#555" }}>
              {SHELF_LABELS[s]}
            </button>
          ))}
          {entry?.shelf === "read" && (
            <button onClick={() => setShowReview(v => !v)} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, border: "none", cursor: "pointer", background: COLORS.garnet, color: "#fff" }}>
              {showReview ? "Close" : "✏️ Review"}
            </button>
          )}
        </div>
      )}
      {showReview && isOwn && (
        <div style={{ marginTop: 8 }}>
          <Stars rating={entry?.rating} onRate={r => onReview(book.id, r, reviewText)} size={16} />
          <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write your review..."
            style={{ ...iStyle(), marginTop: 6, resize: "vertical", minHeight: 56, fontSize: 12 }} />
          <button onClick={() => { onReview(book.id, entry?.rating || 0, reviewText); setShowReview(false); }}
            style={{ marginTop: 6, padding: "4px 14px", background: COLORS.garnet, color: "#fff", border: "none", borderRadius: 20, fontSize: 11, cursor: "pointer" }}>Save</button>
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);

  // data
  const [members, setMembers] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [votes, setVotes] = useState([]);
  const [books, setBooks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [chat, setChat] = useState([]);
  const [feed, setFeed] = useState([]);

  // forms
  const [lName, setLName] = useState(""); const [lPass, setLPass] = useState(""); const [lErr, setLErr] = useState("");
  const [sName, setSName] = useState(""); const [sPass, setSPass] = useState(""); const [sPass2, setSPass2] = useState("");
  const [sAvatar, setSAvatar] = useState("🌸"); const [sGenres, setSGenres] = useState([]); const [sErr, setSErr] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", genre: "Romance", cover: "📗" });
  const [nomTitle, setNomTitle] = useState(""); const [nomAuthor, setNomAuthor] = useState("");
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [mtgForm, setMtgForm] = useState({ title: "", location: "", date: "", time: "", notes: "", image_url: "" });
  const [chatInput, setChatInput] = useState(""); const [showGifPicker, setShowGifPicker] = useState(false);
  const [editBio, setEditBio] = useState(false); const [bioText, setBioText] = useState("");
  const [viewMember, setViewMember] = useState(null);
  const chatFileRef = useRef(); const profilePicRef = useRef(); const chatEndRef = useRef();

  // ── load all data ──
  const loadAll = useCallback(async () => {
    try {
      const [m, s, n, v, b, mt, c, f] = await Promise.all([
        db.get("members", "order=joined_at.asc"),
        db.get("shelves", "order=id.asc"),
        db.get("nominees", "order=id.asc"),
        db.get("votes", "order=id.asc"),
        db.get("books", "order=id.asc"),
        db.get("meetings", "order=date.asc"),
        db.get("chat_messages", "order=created_at.asc"),
        db.get("feed", "order=created_at.desc&limit=30"),
      ]);
      setMembers(m); setShelves(s); setNominees(n); setVotes(v);
      setBooks(b); setMeetings(mt); setChat(c); setFeed(f);
      setDbError(false);
    } catch (e) {
      setDbError(true);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  // poll every 8 seconds for real-time feel
  useEffect(() => {
    const t = setInterval(loadAll, 8000);
    return () => clearInterval(t);
  }, [loadAll]);

  const addFeed = async (memberId, text) => {
    try { await db.insert("feed", { member_id: memberId, text }); } catch {}
    loadAll();
  };

  // ── auth ──
  const doLogin = async () => {
    const name = lName.trim(); const pass = lPass.trim();
    if (!name || !pass) { setLErr("Please fill in both fields."); return; }
    setLoading(true);
    try {
      const isAdmin = name === ADMIN_NAME && pass === ADMIN_PASS;
      const existing = members.find(m => m.name.toLowerCase() === name.toLowerCase());
      if (isAdmin && !existing) {
        const [nm] = await db.insert("members", { name: ADMIN_NAME, password: ADMIN_PASS, avatar: "👑", genres: [], is_admin: true, bio: "" });
        setCurrentUser(nm); setScreen("app"); setLErr(""); setLoading(false); return;
      }
      if (!existing) { setLErr("No account found. Please sign up first."); setLoading(false); return; }
      if (existing.password !== pass) { setLErr("Wrong password. Try again."); setLoading(false); return; }
      setCurrentUser({ ...existing, isAdmin: existing.is_admin });
      setScreen("app"); setLErr(""); setLName(""); setLPass("");
    } catch { setLErr("Connection error. Check your setup."); }
    setLoading(false);
  };

  const doSignup = async () => {
    const name = sName.trim();
    if (!name) { setSErr("Please enter your name."); return; }
    if (sPass.length < 4) { setSErr("Password must be at least 4 characters."); return; }
    if (sPass !== sPass2) { setSErr("Passwords do not match."); return; }
    if (members.find(m => m.name.toLowerCase() === name.toLowerCase())) { setSErr("Name already taken."); return; }
    setLoading(true);
    try {
      const [nm] = await db.insert("members", { name, password: sPass, avatar: sAvatar, genres: sGenres, is_admin: false, bio: "" });
      setCurrentUser(nm);
      await addFeed(nm.id, `${nm.name} joined Meet & Read! 🎉`);
      setScreen("app"); setSErr("");
    } catch { setSErr("Connection error. Try again."); }
    setLoading(false);
  };

  // ── shelf ──
  const updateShelf = async (bookId, shelf) => {
    const uid = currentUser.id;
    const existing = shelves.find(s => s.member_id === uid && s.book_id === bookId);
    if (existing) {
      await db.update("shelves", `id=eq.${existing.id}`, { shelf });
    } else {
      await db.insert("shelves", { member_id: uid, book_id: bookId, shelf });
    }
    const book = books.find(b => b.id === bookId);
    await addFeed(uid, `${currentUser.name} ${shelf==="read"?"finished":shelf==="reading"?"started reading":"wants to read"} "${book?.title}" ${shelf==="read"?"✅":shelf==="reading"?"📖":"🔖"}`);
    loadAll();
  };

  const updateReview = async (bookId, rating, review) => {
    const existing = shelves.find(s => s.member_id === currentUser.id && s.book_id === bookId);
    if (existing) await db.update("shelves", `id=eq.${existing.id}`, { rating, review });
    const book = books.find(b => b.id === bookId);
    if (rating) await addFeed(currentUser.id, `${currentUser.name} rated "${book?.title}" ${"⭐".repeat(rating)}`);
    loadAll();
  };

  const addBook = async () => {
    if (!newBook.title || !newBook.author) return;
    const [b] = await db.insert("books", newBook);
    await addFeed(currentUser.id, `${currentUser.name} added "${b.title}" to the library 📚`);
    setShowAddBook(false); setNewBook({ title: "", author: "", genre: "Romance", cover: "📗" });
    loadAll();
  };

  // ── vote ──
  const nominate = async () => {
    if (!nomTitle.trim() || !nomAuthor.trim()) return;
    const [n] = await db.insert("nominees", { title: nomTitle.trim(), author: nomAuthor.trim(), nominated_by: currentUser.id });
    await addFeed(currentUser.id, `${currentUser.name} nominated "${n.title}" for Book of the Month! 📚`);
    setNomTitle(""); setNomAuthor(""); loadAll();
  };

  const castVote = async (nomId) => {
    const uid = currentUser.id;
    const existing = votes.find(v => v.nominee_id === nomId && v.member_id === uid);
    if (existing) {
      await db.delete("votes", `id=eq.${existing.id}`);
    } else {
      // remove any existing vote first
      const myVote = votes.find(v => v.member_id === uid);
      if (myVote) await db.delete("votes", `id=eq.${myVote.id}`);
      await db.insert("votes", { nominee_id: nomId, member_id: uid });
    }
    loadAll();
  };

  // ── meetings ──
  const saveMeeting = async () => {
    if (!mtgForm.title.trim() || !mtgForm.location.trim() || !mtgForm.date || !mtgForm.time) return;
    const [m] = await db.insert("meetings", mtgForm);
    await addFeed(currentUser.id, `📅 New meeting: "${m.title}" on ${m.date}`);
    setShowAddMeeting(false); setMtgForm({ title: "", location: "", date: "", time: "", notes: "", image_url: "" });
    loadAll();
  };

  const toggleRsvp = async (meetingId) => {
    const uid = currentUser.id;
    const meeting = meetings.find(m => m.id === meetingId);
    const rsvps = meeting.rsvps || [];
    const updated = rsvps.includes(uid) ? rsvps.filter(x => x !== uid) : [...rsvps, uid];
    await db.update("meetings", `id=eq.${meetingId}`, { rsvps: updated });
    loadAll();
  };

  // ── chat ──
  const sendMsg = async (imageUrl = null, gifUrl = null) => {
    const text = chatInput.trim();
    if (!text && !imageUrl && !gifUrl) return;
    await db.insert("chat_messages", { member_id: currentUser.id, text: text || null, image_url: imageUrl, gif_url: gifUrl });
    setChatInput(""); setShowGifPicker(false);
    await loadAll();
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleChatImg = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => sendMsg(ev.target.result);
    r.readAsDataURL(f); e.target.value = "";
  };

  const handleProfilePic = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      const url = ev.target.result;
      await db.update("members", `id=eq.${currentUser.id}`, { profile_pic: url });
      setCurrentUser(u => ({ ...u, profile_pic: url }));
      loadAll();
    };
    r.readAsDataURL(f); e.target.value = "";
  };

  const saveBio = async () => {
    await db.update("members", `id=eq.${currentUser.id}`, { bio: bioText });
    setCurrentUser(u => ({ ...u, bio: bioText }));
    setEditBio(false); loadAll();
  };

  const toggleGenre = async (genre) => {
    const genres = currentUser.genres?.includes(genre)
      ? currentUser.genres.filter(g => g !== genre)
      : [...(currentUser.genres || []), genre];
    await db.update("members", `id=eq.${currentUser.id}`, { genres });
    setCurrentUser(u => ({ ...u, genres }));
    loadAll();
  };

  // ── derived ──
  const userShelf = shelves.filter(s => s.member_id === currentUser?.id);
  const getMemberById = id => members.find(m => m.id === id);

  // ── layout ──
  const H1 = ({ children }) => <h1 style={{ color: COLORS.garnet, fontFamily: "Georgia, serif", margin: "0 0 20px", borderBottom: `2px solid ${COLORS.cottonCandy}`, paddingBottom: 8 }}>{children}</h1>;

  const Nav = () => (
    <nav style={{ background: COLORS.garnet, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.25)", flexWrap: "wrap", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>📖</span>
        <span style={{ color: "#F2EEE8", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16 }}>Meet & Read</span>
        {currentUser?.is_admin && <span style={{ fontSize: 10, background: COLORS.khaki, color: "#fff", borderRadius: 20, padding: "1px 8px" }}>admin</span>}
      </div>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[["home","🏠"],["shelf","📚"],["vote","🗳️"],["meetings","📅"],["chat","💬"],["members","👥"],["profile","👤"]].map(([p, icon]) => (
          <button key={p} onClick={() => { setPage(p); setViewMember(null); }}
            style={{ padding: "5px 9px", background: page===p ? COLORS.cottonCandy : "transparent", color: page===p ? COLORS.garnet : "#F2EEE8", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            {icon} {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
        <button onClick={() => { setCurrentUser(null); setScreen("login"); setPage("home"); }}
          style={{ padding: "5px 9px", background: "transparent", color: COLORS.cottonCandyLight, border: "none", cursor: "pointer", fontSize: 11 }}>logout</button>
      </div>
    </nav>
  );

  const wrap = (content) => (
    <div style={{ minHeight: "100vh", background: COLORS.cottonCandyBg, fontFamily: "Georgia, serif" }}>
      <Nav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>{content}</div>
    </div>
  );

  // ── DB error banner ──
  if (dbError) return (
    <div style={{ minHeight: "100vh", background: COLORS.cottonCandyBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 24 }}>
      <Card style={{ maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: COLORS.garnet }}>Database not set up yet</h2>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6 }}>
          Please run the SQL setup script in your Supabase SQL Editor first, then refresh this page.
        </p>
        <button onClick={loadAll} style={{ marginTop: 12, padding: "10px 24px", background: COLORS.garnet, color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 14 }}>
          Try again
        </button>
      </Card>
    </div>
  );

  // ── LOGIN ──
  if (screen === "login") return (
    <div style={{ minHeight: "100vh", background: COLORS.cottonCandyBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(78,10,11,0.13)" }}>
        <div style={{ fontSize: 56, marginBottom: 6 }}>📖</div>
        <h1 style={{ color: COLORS.garnet, fontSize: 28, margin: "0 0 4px" }}>Meet & Read</h1>
        <p style={{ color: COLORS.cottonCandy, marginBottom: 24, fontSize: 13 }}>Your cozy book club companion</p>
        <input value={lName} onChange={e => setLName(e.target.value)} placeholder="Your name" style={iStyle({ marginBottom: 10 })} />
        <input type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="Password" onKeyDown={e => e.key==="Enter" && doLogin()} style={iStyle({ marginBottom: 8 })} />
        {lErr && <p style={{ color: "#c0392b", fontSize: 12, margin: "0 0 10px" }}>{lErr}</p>}
        <Btn onClick={doLogin} disabled={loading} style={{ width: "100%", padding: 12, fontSize: 15, marginBottom: 14 }}>{loading ? "Logging in…" : "Log in ✨"}</Btn>
        <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>New here? <span onClick={() => { setScreen("signup"); setLErr(""); }} style={{ color: COLORS.garnet, cursor: "pointer", fontWeight: 700 }}>Create an account</span></p>
      </div>
    </div>
  );

  // ── SIGNUP ──
  if (screen === "signup") return (
    <div style={{ minHeight: "100vh", background: COLORS.cottonCandyBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 36, maxWidth: 460, width: "100%", boxShadow: "0 8px 32px rgba(78,10,11,0.13)" }}>
        <div style={{ fontSize: 44, textAlign: "center", marginBottom: 4 }}>📖</div>
        <h2 style={{ color: COLORS.garnet, textAlign: "center", margin: "0 0 20px" }}>Join Meet & Read</h2>
        <label style={{ fontSize: 12, color: COLORS.garnet, fontWeight: 700 }}>Your name</label>
        <input value={sName} onChange={e => setSName(e.target.value)} placeholder="Full name or nickname" style={iStyle({ marginBottom: 12, marginTop: 4 })} />
        <label style={{ fontSize: 12, color: COLORS.garnet, fontWeight: 700 }}>Password</label>
        <input type="password" value={sPass} onChange={e => setSPass(e.target.value)} placeholder="Choose a password (min. 4 chars)" style={iStyle({ marginBottom: 10, marginTop: 4 })} />
        <input type="password" value={sPass2} onChange={e => setSPass2(e.target.value)} placeholder="Confirm password" style={iStyle({ marginBottom: 14 })} />
        <label style={{ fontSize: 12, color: COLORS.garnet, fontWeight: 700 }}>Choose your avatar</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 16px" }}>
          {AVATARS.map(a => <button key={a} onClick={() => setSAvatar(a)} style={{ fontSize: 22, padding: 6, borderRadius: 10, border: `2px solid ${sAvatar===a?COLORS.garnet:"transparent"}`, background: sAvatar===a?COLORS.cottonCandyLight:COLORS.cottonCandyBg, cursor: "pointer" }}>{a}</button>)}
        </div>
        <label style={{ fontSize: 12, color: COLORS.garnet, fontWeight: 700 }}>Favourite genres (optional)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 18px" }}>
          {GENRES.map(g => <button key={g} onClick={() => setSGenres(gs => gs.includes(g)?gs.filter(x=>x!==g):[...gs,g])} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "none", cursor: "pointer", background: sGenres.includes(g)?COLORS.garnet:COLORS.cottonCandyLight, color: sGenres.includes(g)?"#fff":COLORS.garnet }}>{g}</button>)}
        </div>
        {sErr && <p style={{ color: "#c0392b", fontSize: 12, margin: "0 0 10px" }}>{sErr}</p>}
        <Btn onClick={doSignup} disabled={loading} style={{ width: "100%", padding: 12, fontSize: 15, marginBottom: 12 }}>{loading ? "Creating…" : "Create account 🌸"}</Btn>
        <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", margin: 0 }}>Already a member? <span onClick={() => { setScreen("login"); setSErr(""); }} style={{ color: COLORS.garnet, cursor: "pointer", fontWeight: 700 }}>Log in</span></p>
      </div>
    </div>
  );

  if (!currentUser) return null;

  // ── HOME ──
  if (page === "home") return wrap(<>
    <div style={{ background: `linear-gradient(135deg,${COLORS.garnet},${COLORS.garnetLight})`, borderRadius: 16, padding: 24, marginBottom: 24, color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <AvatarImg member={currentUser} size={64} />
      <div>
        <h2 style={{ margin: 0, fontSize: 22 }}>Welcome back, {currentUser.name}! 🌸</h2>
        <p style={{ margin: "6px 0 0", opacity: 0.8, fontSize: 13 }}>{userShelf.filter(e=>e.shelf==="read").length} read · {userShelf.filter(e=>e.shelf==="reading").length} in progress · {userShelf.filter(e=>e.shelf==="want").length} on wishlist</p>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
      {[
        { l:"Books Read", v:userShelf.filter(e=>e.shelf==="read").length, i:"✅", bg:COLORS.khaki },
        { l:"Reading Now", v:userShelf.filter(e=>e.shelf==="reading").length, i:"📖", bg:COLORS.cottonCandy },
        { l:"Want to Read", v:userShelf.filter(e=>e.shelf==="want").length, i:"🔖", bg:COLORS.garnetLight },
        { l:"Members", v:members.length, i:"👥", bg:COLORS.khakiLight },
      ].map(s => <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: "14px 8px", color: "#fff", textAlign: "center" }}><div style={{ fontSize: 20 }}>{s.i}</div><div style={{ fontSize: 24, fontWeight: 700 }}>{s.v}</div><div style={{ fontSize: 10, opacity: 0.9 }}>{s.l}</div></div>)}
    </div>
    <H1>📰 Club Feed</H1>
    {feed.length === 0 ? <p style={{ color: "#bbb", fontStyle: "italic" }}>Activity will appear here as members interact!</p>
      : feed.map(item => {
          const mem = getMemberById(item.member_id);
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center", border: `1px solid ${COLORS.cottonCandyLight}`, marginBottom: 8 }}>
              <AvatarImg member={mem} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.garnet }}>{item.text}</div>
                <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{new Date(item.created_at).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
  </>);

  // ── SHELF ──
  if (page === "shelf") return wrap(<>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <H1>📚 My Bookshelf</H1>
      <Btn onClick={() => setShowAddBook(v => !v)}>+ Add Book</Btn>
    </div>
    {showAddBook && (
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ color: COLORS.garnet, margin: "0 0 14px" }}>Add a New Book</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <input value={newBook.title} onChange={e => setNewBook(b=>({...b,title:e.target.value}))} placeholder="Title" style={iStyle()} />
          <input value={newBook.author} onChange={e => setNewBook(b=>({...b,author:e.target.value}))} placeholder="Author" style={iStyle()} />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={newBook.genre} onChange={e => setNewBook(b=>({...b,genre:e.target.value}))} style={{ ...iStyle(), width: "auto", padding: "8px 12px" }}>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            {["📗","📘","📕","📙","📒","📔"].map(c => <button key={c} onClick={() => setNewBook(b=>({...b,cover:c}))} style={{ fontSize: 22, padding: 6, borderRadius: 8, border: `2px solid ${newBook.cover===c?COLORS.garnet:"transparent"}`, background: "transparent", cursor: "pointer" }}>{c}</button>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={addBook}>Save</Btn>
          <Btn onClick={() => setShowAddBook(false)} color={COLORS.cottonCandyLight} textColor={COLORS.garnet}>Cancel</Btn>
        </div>
      </Card>
    )}
    {["reading","read","want"].map(shelf => {
      const sb = userShelf.filter(e=>e.shelf===shelf).map(e=>({ entry:e, book:books.find(b=>b.id===e.book_id) })).filter(x=>x.book);
      return (
        <div key={shelf} style={{ marginBottom: 28 }}>
          <h2 style={{ color: COLORS.garnet, fontSize: 15, marginBottom: 12 }}><span style={{ background: SHELF_COLORS[shelf], borderRadius: 20, padding: "3px 14px", color: "#fff", fontSize: 13 }}>{SHELF_LABELS[shelf]} ({sb.length})</span></h2>
          {sb.length===0 ? <p style={{ color:"#ccc", fontStyle:"italic", fontSize:13 }}>No books here yet.</p>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
                {sb.map(({book,entry}) => <BookCard key={book.id} book={book} entry={entry} isOwn onShelfChange={updateShelf} onReview={updateReview} />)}
              </div>}
        </div>
      );
    })}
    {books.filter(b => !userShelf.find(e=>e.book_id===b.id)).length > 0 && (
      <div><h2 style={{ color:COLORS.garnet, fontSize:15, marginBottom:12 }}>📖 Club Library</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>
          {books.filter(b => !userShelf.find(e=>e.book_id===b.id)).map(book => <BookCard key={book.id} book={book} isOwn onShelfChange={updateShelf} onReview={updateReview} />)}
        </div>
      </div>
    )}
    {books.length===0 && !showAddBook && <div style={{ textAlign:"center", padding:48, color:"#ccc" }}><div style={{ fontSize:48, marginBottom:12 }}>📚</div><p>No books yet — click <strong>+ Add Book</strong>!</p></div>}
  </>);

  // ── VOTE ──
  if (page === "vote") {
    const getVoteCount = id => votes.filter(v=>v.nominee_id===id).length;
    const sorted = [...nominees].sort((a,b) => getVoteCount(b.id)-getVoteCount(a.id));
    const top = Math.max(...nominees.map(n=>getVoteCount(n.id)),0);
    return wrap(<>
      <H1>🗳️ Book of the Month Vote</H1>
      <Card style={{ marginBottom:28 }}>
        <h3 style={{ color:COLORS.garnet, margin:"0 0 14px" }}>Nominate a Book</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
          <input value={nomTitle} onChange={e=>setNomTitle(e.target.value)} placeholder="Book title" style={iStyle()} />
          <input value={nomAuthor} onChange={e=>setNomAuthor(e.target.value)} placeholder="Author" style={iStyle()} onKeyDown={e=>e.key==="Enter"&&nominate()} />
        </div>
        <Btn onClick={nominate} disabled={!nomTitle.trim()||!nomAuthor.trim()}>Nominate 📚</Btn>
      </Card>
      {sorted.length===0 ? <div style={{ textAlign:"center", padding:40, color:"#ccc" }}><div style={{ fontSize:40, marginBottom:10 }}>🗳️</div><p>No nominations yet!</p></div>
        : sorted.map((nom,i) => {
            const vc = getVoteCount(nom.id);
            const hasVoted = votes.some(v=>v.nominee_id===nom.id&&v.member_id===currentUser.id);
            const nomBy = getMemberById(nom.nominated_by);
            const pct = top>0?(vc/top)*100:0;
            return (
              <Card key={nom.id} style={{ marginBottom:12, border:`2px solid ${i===0&&top>0?COLORS.garnet:COLORS.cottonCandyLight}`, position:"relative" }}>
                {i===0&&top>0&&<div style={{ position:"absolute",top:-11,right:14,background:COLORS.garnet,color:"#fff",fontSize:11,padding:"2px 12px",borderRadius:20 }}>🏆 Leading</div>}
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontWeight:700, color:COLORS.garnet, fontSize:16 }}>{nom.title}</div>
                    <div style={{ fontSize:12, color:"#999", marginBottom:10 }}>by {nom.author} · nominated by {nomBy?.name||"?"}</div>
                    <div style={{ background:COLORS.cottonCandyBg, borderRadius:10, height:8, overflow:"hidden" }}>
                      <div style={{ height:"100%", background:COLORS.cottonCandy, width:`${pct}%`, transition:"width 0.5s", borderRadius:10 }} />
                    </div>
                    <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>{vc} vote{vc!==1?"s":""}</div>
                  </div>
                  <Btn onClick={()=>castVote(nom.id)} color={hasVoted?COLORS.garnet:COLORS.cottonCandyLight} textColor={hasVoted?"#fff":COLORS.garnet}>{hasVoted?"✓ Voted":"Vote"}</Btn>
                </div>
              </Card>
            );
          })}
    </>);
  }

  // ── MEETINGS ──
  if (page === "meetings") return wrap(<>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
      <H1>📅 Club Meetings</H1>
      {currentUser.is_admin && <Btn onClick={()=>setShowAddMeeting(v=>!v)}>{showAddMeeting?"Cancel":"+ Add Meeting"}</Btn>}
    </div>
    {currentUser.is_admin && showAddMeeting && (
      <Card style={{ marginBottom:28, border:`2px solid ${COLORS.cottonCandy}` }}>
        <h3 style={{ color:COLORS.garnet, margin:"0 0 16px" }}>New Meeting</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          {[["title","Meeting title *","text"],["location","Location *","text"],["date","Date *","date"],["time","Time *","time"]].map(([k,ph,t]) => (
            <div key={k}>
              <label style={{ fontSize:12, color:COLORS.garnet, fontWeight:700, display:"block", marginBottom:4 }}>{ph}</label>
              <input type={t} value={mtgForm[k]} onChange={e=>setMtgForm(m=>({...m,[k]:e.target.value}))} style={iStyle()} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12, color:COLORS.garnet, fontWeight:700, display:"block", marginBottom:4 }}>Location image URL (optional)</label>
          <input value={mtgForm.image_url} onChange={e=>setMtgForm(m=>({...m,image_url:e.target.value}))} placeholder="https://..." style={iStyle()} />
          {mtgForm.image_url && <img src={mtgForm.image_url} alt="preview" onError={e=>e.target.style.display="none"} style={{ marginTop:8, width:"100%", height:120, objectFit:"cover", borderRadius:10 }} />}
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, color:COLORS.garnet, fontWeight:700, display:"block", marginBottom:4 }}>Notes (optional)</label>
          <textarea value={mtgForm.notes} onChange={e=>setMtgForm(m=>({...m,notes:e.target.value}))} placeholder="Any info for members..." style={{ ...iStyle(), resize:"vertical", minHeight:70 }} />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={saveMeeting} disabled={!mtgForm.title.trim()||!mtgForm.location.trim()||!mtgForm.date||!mtgForm.time}>Save Meeting</Btn>
          <Btn onClick={()=>setShowAddMeeting(false)} color={COLORS.cottonCandyLight} textColor={COLORS.garnet}>Cancel</Btn>
        </div>
      </Card>
    )}
    {meetings.length===0
      ? <div style={{ textAlign:"center", padding:48, color:"#ccc" }}><div style={{ fontSize:48, marginBottom:12 }}>📅</div><p>{currentUser.is_admin?"No meetings yet — add one above!":"No meetings planned yet. Check back soon!"}</p></div>
      : meetings.map(m => {
          const going = (m.rsvps||[]).includes(currentUser.id);
          const rsvpPeople = (m.rsvps||[]).map(id=>getMemberById(id)).filter(Boolean);
          return (
            <Card key={m.id} style={{ marginBottom:20, padding:0, overflow:"hidden" }}>
              {m.image_url ? <img src={m.image_url} alt={m.location} onError={e=>e.target.style.display="none"} style={{ width:"100%", height:180, objectFit:"cover" }} />
                : <div style={{ height:72, background:`linear-gradient(135deg,${COLORS.garnet},${COLORS.cottonCandy})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30 }}>📍</div>}
              <div style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <h3 style={{ margin:"0 0 6px", color:COLORS.garnet, fontSize:19 }}>{m.title}</h3>
                    <div style={{ fontSize:13, color:"#777", marginBottom:2 }}>📍 {m.location}</div>
                    <div style={{ fontSize:13, color:"#777" }}>🗓 {new Date(m.date).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} at {m.time}</div>
                  </div>
                  {currentUser.is_admin && <button onClick={async()=>{await db.delete("meetings",`id=eq.${m.id}`);loadAll();}} style={{ background:"none", border:"none", color:"#ddd", cursor:"pointer", fontSize:20 }}>🗑</button>}
                </div>
                {m.notes && <p style={{ fontSize:13, color:"#666", margin:"10px 0 0", fontStyle:"italic" }}>{m.notes}</p>}
                <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:16, flexWrap:"wrap" }}>
                  <Btn onClick={()=>toggleRsvp(m.id)} color={going?COLORS.khaki:COLORS.cottonCandyLight} textColor={going?"#fff":COLORS.garnet}>{going?"✓ Going!":"RSVP"}</Btn>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ display:"flex" }}>{rsvpPeople.slice(0,5).map((p,i)=><div key={p.id} style={{ marginLeft:i===0?0:-8, zIndex:5-i }}><AvatarImg member={p} size={28} /></div>)}</div>
                    <span style={{ fontSize:13, color:COLORS.garnet, fontWeight:700 }}>{(m.rsvps||[]).length} {(m.rsvps||[]).length===1?"person":"people"} going</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
  </>);

  // ── CHAT ──
  if (page === "chat") return (
    <div style={{ height:"100vh", background:COLORS.cottonCandyBg, fontFamily:"Georgia, serif", display:"flex", flexDirection:"column" }}>
      <Nav />
      <div style={{ maxWidth:700, margin:"0 auto", width:"100%", flex:1, display:"flex", flexDirection:"column", padding:"16px 16px 0", overflow:"hidden" }}>
        <H1>💬 Club Chat</H1>
        <div style={{ flex:1, overflowY:"auto", background:"#fff", borderRadius:16, padding:16, border:`1.5px solid ${COLORS.cottonCandyLight}`, marginBottom:10, display:"flex", flexDirection:"column", gap:12 }}>
          {chat.length===0 ? <div style={{ textAlign:"center", color:"#ccc", margin:"auto" }}><div style={{ fontSize:36 }}>💬</div><p>No messages yet!</p></div>
            : chat.map(msg => {
                const sender = getMemberById(msg.member_id);
                const isMe = msg.member_id===currentUser.id;
                return (
                  <div key={msg.id} style={{ display:"flex", gap:8, flexDirection:isMe?"row-reverse":"row", alignItems:"flex-end" }}>
                    <AvatarImg member={sender} size={30} />
                    <div style={{ maxWidth:"70%" }}>
                      {!isMe && <div style={{ fontSize:11, color:"#bbb", marginBottom:3 }}>{sender?.name}</div>}
                      <div style={{ background:isMe?COLORS.garnet:COLORS.cottonCandyBg, color:isMe?"#fff":COLORS.garnet, borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"10px 14px" }}>
                        {msg.text && <div style={{ fontSize:14 }}>{msg.text}</div>}
                        {msg.image_url && <img src={msg.image_url} alt="" style={{ maxWidth:"100%", borderRadius:10, marginTop:msg.text?8:0 }} />}
                        {msg.gif_url && <img src={msg.gif_url} alt="gif" style={{ maxWidth:"100%", borderRadius:10, marginTop:msg.text?8:0 }} />}
                      </div>
                      <div style={{ fontSize:10, color:"#ccc", marginTop:2, textAlign:isMe?"right":"left" }}>{new Date(msg.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                  </div>
                );
              })}
          <div ref={chatEndRef} />
        </div>
        {showGifPicker && (
          <div style={{ background:"#fff", borderRadius:14, padding:12, marginBottom:8, border:`1.5px solid ${COLORS.cottonCandyLight}` }}>
            <div style={{ fontSize:12, color:COLORS.garnet, fontWeight:700, marginBottom:8 }}>Pick a GIF</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {GIFS.map(g => <div key={g.url} onClick={()=>sendMsg(null,g.url)} style={{ cursor:"pointer", borderRadius:10, overflow:"hidden", border:"2px solid transparent" }} onMouseEnter={e=>e.currentTarget.style.borderColor=COLORS.garnet} onMouseLeave={e=>e.currentTarget.style.borderColor="transparent"}><img src={g.url} alt={g.label} style={{ width:"100%", height:75, objectFit:"cover" }} /><div style={{ fontSize:10, color:"#888", textAlign:"center", padding:"2px 0" }}>{g.label}</div></div>)}
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:8, paddingBottom:14, alignItems:"center" }}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Type a message..." onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMsg()} style={{ ...iStyle(), flex:1, borderRadius:24 }} />
          <Btn onClick={()=>setShowGifPicker(v=>!v)} color={COLORS.cottonCandyLight} textColor={COLORS.garnet} style={{ padding:"9px 12px" }}>GIF</Btn>
          <Btn onClick={()=>chatFileRef.current.click()} color={COLORS.cottonCandyLight} textColor={COLORS.garnet} style={{ padding:"9px 12px" }}>🖼</Btn>
          <Btn onClick={()=>sendMsg()} style={{ padding:"9px 18px" }}>Send</Btn>
          <input ref={chatFileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleChatImg} />
        </div>
      </div>
    </div>
  );

  // ── MEMBERS ──
  if (page === "members") {
    const target = viewMember ? getMemberById(viewMember) : null;
    if (target) {
      const ms = shelves.filter(s=>s.member_id===target.id);
      return wrap(<>
        <button onClick={()=>setViewMember(null)} style={{ background:"none", border:"none", color:COLORS.garnet, cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Back to Members</button>
        <Card style={{ background:`linear-gradient(135deg,${COLORS.garnet},${COLORS.garnetLight})`, color:"#fff", textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><AvatarImg member={target} size={90} /></div>
          <h2 style={{ margin:"0 0 4px" }}>{target.name}</h2>
          {target.is_admin && <span style={{ fontSize:11, background:COLORS.khaki, color:"#fff", borderRadius:20, padding:"1px 10px" }}>admin</span>}
          <p style={{ opacity:0.7, fontSize:13, margin:"6px 0 10px" }}>Member since {new Date(target.joined_at).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</p>
          {target.bio && <p style={{ opacity:0.9, fontSize:14, fontStyle:"italic", maxWidth:400, margin:"0 auto 12px" }}>"{target.bio}"</p>}
          {(target.genres||[]).length>0 && <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center", marginBottom:12 }}>{target.genres.map(g=><span key={g} style={{ background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"2px 10px", fontSize:11 }}>{g}</span>)}</div>}
          <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
            <span>📚 {ms.filter(e=>e.shelf==="read").length} read</span>
            <span>📖 {ms.filter(e=>e.shelf==="reading").length} reading</span>
            <span>🔖 {ms.filter(e=>e.shelf==="want").length} want</span>
          </div>
        </Card>
        {["read","reading","want"].map(shelf=>{
          const sb=ms.filter(e=>e.shelf===shelf).map(e=>({entry:e,book:books.find(b=>b.id===e.book_id)})).filter(x=>x.book);
          return sb.length>0?(<div key={shelf} style={{ marginBottom:20 }}><h3 style={{ color:COLORS.garnet }}>{SHELF_LABELS[shelf]}</h3><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:12 }}>{sb.map(({book,entry})=><BookCard key={book.id} book={book} entry={entry} isOwn={false}/>)}</div></div>):null;
        })}
        {ms.length===0&&<p style={{ color:"#ccc", fontStyle:"italic" }}>No books yet.</p>}
      </>);
    }
    return wrap(<>
      <H1>👥 Club Members</H1>
      {members.length===0 ? <p style={{ color:"#ccc", fontStyle:"italic" }}>No members yet!</p>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
            {members.map(mem=>{
              const ms=shelves.filter(s=>s.member_id===mem.id);
              return (
                <div key={mem.id} onClick={()=>setViewMember(mem.id)} style={{ background:"#fff", borderRadius:16, padding:20, textAlign:"center", border:`2px solid ${mem.id===currentUser.id?COLORS.garnet:COLORS.cottonCandyLight}`, cursor:"pointer", transition:"transform 0.15s,box-shadow 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.boxShadow="0 4px 16px rgba(78,10,11,0.12)"}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none"}}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><AvatarImg member={mem} size={60} /></div>
                  <div style={{ fontWeight:700, color:COLORS.garnet, fontSize:15 }}>{mem.name}</div>
                  <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:4, flexWrap:"wrap" }}>
                    {mem.id===currentUser.id&&<span style={{ fontSize:10, background:COLORS.cottonCandyLight, color:COLORS.garnet, borderRadius:20, padding:"1px 8px" }}>You</span>}
                    {mem.is_admin&&<span style={{ fontSize:10, background:COLORS.khaki, color:"#fff", borderRadius:20, padding:"1px 8px" }}>admin</span>}
                  </div>
                  {mem.bio&&<p style={{ fontSize:11, color:"#888", fontStyle:"italic", margin:"8px 0 4px" }}>"{mem.bio.slice(0,55)}{mem.bio.length>55?"…":""}"</p>}
                  <div style={{ display:"flex", justifyContent:"center", gap:14, marginTop:10 }}>
                    <div><div style={{ fontWeight:700, color:COLORS.garnet }}>{ms.filter(e=>e.shelf==="read").length}</div><div style={{ fontSize:10, color:"#aaa" }}>Read</div></div>
                    <div><div style={{ fontWeight:700, color:COLORS.cottonCandy }}>{ms.filter(e=>e.shelf==="reading").length}</div><div style={{ fontSize:10, color:"#aaa" }}>Reading</div></div>
                    <div><div style={{ fontWeight:700, color:COLORS.khaki }}>{ms.filter(e=>e.shelf==="want").length}</div><div style={{ fontSize:10, color:"#aaa" }}>Wishlist</div></div>
                  </div>
                  {(mem.genres||[]).length>0&&<div style={{ display:"flex", flexWrap:"wrap", gap:4, justifyContent:"center", marginTop:10 }}>{mem.genres.slice(0,3).map(g=><span key={g} style={{ background:COLORS.cottonCandyBg, color:COLORS.garnet, borderRadius:20, padding:"2px 8px", fontSize:10 }}>{g}</span>)}</div>}
                </div>
              );
            })}
          </div>}
    </>);
  }

  // ── PROFILE ──
  if (page === "profile") return wrap(<>
    <div style={{ background:`linear-gradient(135deg,${COLORS.garnet},${COLORS.garnetLight})`, borderRadius:16, padding:28, color:"#fff", marginBottom:24, textAlign:"center" }}>
      <div style={{ position:"relative", width:"fit-content", margin:"0 auto 12px" }}>
        <AvatarImg member={currentUser} size={90} />
        <button onClick={()=>profilePicRef.current.click()} style={{ position:"absolute", bottom:0, right:-4, background:COLORS.cottonCandy, border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✏️</button>
        <input ref={profilePicRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleProfilePic} />
      </div>
      <h2 style={{ margin:"6px 0 0", fontSize:24 }}>{currentUser.name}</h2>
      {currentUser.is_admin&&<div style={{ fontSize:11, background:COLORS.khaki, color:"#fff", borderRadius:20, padding:"2px 12px", display:"inline-block", margin:"4px 0 8px" }}>admin</div>}
      <p style={{ opacity:0.7, fontSize:13, margin:"4px 0 14px" }}>Member since {new Date(currentUser.joined_at).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</p>
      <div style={{ display:"flex", justifyContent:"center", gap:28 }}>
        {[{v:userShelf.filter(e=>e.shelf==="read").length,l:"Read"},{v:userShelf.filter(e=>e.shelf==="reading").length,l:"Reading"},{v:userShelf.filter(e=>e.shelf==="want").length,l:"Want"}].map(s=><div key={s.l}><div style={{ fontSize:22, fontWeight:700 }}>{s.v}</div><div style={{ fontSize:11, opacity:0.8 }}>{s.l}</div></div>)}
      </div>
    </div>
    <Card style={{ marginBottom:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <h3 style={{ color:COLORS.garnet, margin:0 }}>📝 My Bio</h3>
        {!editBio&&<Btn onClick={()=>{setEditBio(true);setBioText(currentUser.bio||"")}} color={COLORS.cottonCandyLight} textColor={COLORS.garnet} style={{ padding:"6px 14px", fontSize:12 }}>Edit</Btn>}
      </div>
      {editBio?(<><textarea value={bioText} onChange={e=>setBioText(e.target.value)} placeholder="Introduce yourself..." style={{ ...iStyle(), resize:"vertical", minHeight:80, marginBottom:10 }} /><div style={{ display:"flex", gap:8 }}><Btn onClick={saveBio}>Save</Btn><Btn onClick={()=>setEditBio(false)} color={COLORS.cottonCandyLight} textColor={COLORS.garnet}>Cancel</Btn></div></>)
        : <p style={{ color:currentUser.bio?"#555":"#ccc", fontStyle:"italic", fontSize:14, margin:0 }}>{currentUser.bio||"No bio yet — tell the club about yourself!"}</p>}
    </Card>
    <Card style={{ marginBottom:20 }}>
      <h3 style={{ color:COLORS.garnet, margin:"0 0 12px" }}>Change Avatar</h3>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {AVATARS.map(a=><button key={a} onClick={async()=>{await db.update("members",`id=eq.${currentUser.id}`,{avatar:a});setCurrentUser(u=>({...u,avatar:a}));loadAll();}} style={{ fontSize:28, padding:6, borderRadius:10, border:`2px solid ${currentUser.avatar===a?COLORS.garnet:"transparent"}`, background:currentUser.avatar===a?COLORS.cottonCandyLight:COLORS.cottonCandyBg, cursor:"pointer" }}>{a}</button>)}
      </div>
    </Card>
    <Card style={{ marginBottom:20 }}>
      <h3 style={{ color:COLORS.garnet, margin:"0 0 12px" }}>📚 Genre Preferences</h3>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {GENRES.map(g=><button key={g} onClick={()=>toggleGenre(g)} style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:12, background:(currentUser.genres||[]).includes(g)?COLORS.garnet:COLORS.cottonCandyLight, color:(currentUser.genres||[]).includes(g)?"#fff":COLORS.garnet, transition:"all 0.2s" }}>{g}</button>)}
      </div>
    </Card>
    {userShelf.filter(e=>e.review).length>0&&(
      <Card>
        <h3 style={{ color:COLORS.garnet, margin:"0 0 14px" }}>✍️ My Reviews</h3>
        {userShelf.filter(e=>e.review).map(entry=>{
          const book=books.find(b=>b.id===entry.book_id);
          return book?(<div key={entry.id} style={{ borderBottom:`1px solid ${COLORS.cottonCandyBg}`, paddingBottom:14, marginBottom:14 }}><div style={{ fontWeight:700, color:COLORS.garnet }}>{book.title}</div><Stars rating={entry.rating} size={14}/><div style={{ fontSize:13, color:"#666", fontStyle:"italic", marginTop:4 }}>"{entry.review}"</div></div>):null;
        })}
      </Card>
    )}
  </>);

  return null;
}
