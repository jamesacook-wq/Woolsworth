import { useState, useEffect, useCallback, useRef } from "react";

// ── DATA ─────────────────────────────────────────────────────────────────────

const YARNS = [
  { id: "merino",   name: "Merino Wool",  weight: "Worsted",  color: "#C87898", cost: 8,  price: 15 },
  { id: "alpaca",   name: "Alpaca Blend", weight: "DK",       color: "#B89870", cost: 10, price: 18 },
  { id: "cotton",   name: "Cotton",       weight: "Fingering", color: "#60A888", cost: 6,  price: 12 },
  { id: "silk",     name: "Silk Blend",   weight: "Lace",     color: "#E8A8C0", cost: 15, price: 28 },
  { id: "chunky",   name: "Chunky Wool",  weight: "Bulky",    color: "#D09838", cost: 7,  price: 14 },
  { id: "cashmere", name: "Cashmere",     weight: "DK",       color: "#8878C0", cost: 20, price: 35 },
];

const NAMES = ["Margaret","Priya","Sofia","Helen","Diane","Cate","Ruth","Iris","Fern","June","Agnes","Vera","Dolly","Bea","Rose"];
const PROJECTS = {
  merino:   "a cozy sweater",
  alpaca:   "a pair of mittens",
  cotton:   "a summer top",
  silk:     "a delicate shawl",
  chunky:   "a chunky blanket",
  cashmere: "a luxurious scarf",
};
const AVATARS = ["👩","👩‍🦳","👩‍🦱","🧑","👵","🧓"];

let _uid = 0;
const mkCustomer = () => {
  const yarn = YARNS[Math.floor(Math.random() * YARNS.length)];
  return {
    id: _uid++,
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    yarn,
    amount: Math.ceil(Math.random() * 3),
    project: PROJECTS[yarn.id],
    patience: 13,
    max: 13,
  };
};
const zero = () => Object.fromEntries(YARNS.map(y => [y.id, 0]));

// ── YARN BALL SVG ─────────────────────────────────────────────────────────────
function YarnBall({ color, size = 36 }) {
  const id = `g${color.replace("#", "")}${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0, filter: `drop-shadow(0 2px 4px ${color}66)` }}>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${id})`} />
      <ellipse cx="20" cy="20" rx="12" ry="18" fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.35" />
      <ellipse cx="20" cy="20" rx="18" ry="10" fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.35" />
      <line x1="8" y1="12" x2="32" y2="28" stroke="#fff" strokeWidth="1" strokeOpacity="0.3" />
      <line x1="8" y1="28" x2="32" y2="12" stroke="#fff" strokeWidth="1" strokeOpacity="0.3" />
    </svg>
  );
}

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function Woolsworth() {
  const [money,  setMoney]  = useState(200);
  const [day,    setDay]    = useState(1);
  const [rep,    setRep]    = useState(22);
  const [phase,  setPhase]  = useState("morning"); // morning | open | evening
  const [inv,    setInv]    = useState(zero());
  const [cart,   setCart]   = useState(zero());
  const [custs,  setCusts]  = useState([]);
  const [toSpawn, setToSpawn] = useState(0);
  const [spawnCd, setSpawnCd] = useState(0);
  const [stats,  setStats]  = useState({ earned: 0, served: 0, missed: 0 });
  const [toasts, setToasts] = useState([]);
  const [closing, setClosing] = useState(false);

  const toast = useCallback((msg, type = "good") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  // ── GAME TICK ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open") return;
    const iv = setInterval(() => {
      setCusts(prev => {
        const updated = prev.map(c => ({ ...c, patience: c.patience - 0.25 }));
        const gone = updated.filter(c => c.patience <= 0);
        if (gone.length) {
          setRep(r => Math.max(0, r - gone.length * 5));
          setStats(s => ({ ...s, missed: s.missed + gone.length }));
          gone.forEach(c => toast(`${c.name} left — out of ${c.yarn.name} 😢`, "bad"));
        }
        return updated.filter(c => c.patience > 0);
      });
      setSpawnCd(t => t - 0.25);
    }, 250);
    return () => clearInterval(iv);
  }, [phase, toast]);

  // ── SPAWN ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open" || toSpawn <= 0 || spawnCd > 0) return;
    setCusts(p => [...p, mkCustomer()]);
    setToSpawn(n => n - 1);
    setSpawnCd(3 + Math.random() * 4);
  }, [phase, toSpawn, spawnCd]);

  // ── AUTO-CLOSE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open" || toSpawn > 0 || custs.length > 0 || closing) return;
    setClosing(true);
    const t = setTimeout(() => { setPhase("evening"); setClosing(false); }, 1400);
    return () => clearTimeout(t);
  }, [phase, toSpawn, custs.length, closing]);

  // ── ACTIONS ───────────────────────────────────────────────────────────────

  const serve = c => {
    if (inv[c.yarn.id] >= c.amount) {
      setInv(p => ({ ...p, [c.yarn.id]: p[c.yarn.id] - c.amount }));
      const earned = c.yarn.price * c.amount;
      setMoney(m => m + earned);
      setRep(r => Math.min(100, r + 3));
      setStats(s => ({ ...s, earned: s.earned + earned, served: s.served + 1 }));
      setCusts(p => p.filter(x => x.id !== c.id));
      toast(`✨ +$${earned} — ${c.name} is delighted!`, "good");
    } else {
      toast(`Need ${c.amount - inv[c.yarn.id]} more ${c.yarn.name}!`, "warn");
    }
  };

  const cartTotal = YARNS.reduce((s, y) => s + cart[y.id] * y.cost, 0);

  const adjustCart = (id, d) => {
    const y = YARNS.find(y => y.id === id);
    if (d > 0 && money - cartTotal < y.cost) return;
    setCart(p => ({ ...p, [id]: Math.max(0, p[id] + d) }));
  };

  const placeOrder = () => {
    if (!cartTotal || cartTotal > money) return;
    setMoney(m => m - cartTotal);
    setInv(p => { const n = { ...p }; YARNS.forEach(y => n[y.id] += cart[y.id]); return n; });
    setCart(zero());
    toast("Stock delivered! 📦", "good");
  };

  const openShop = () => {
    const n = 5 + Math.floor(rep / 30);
    setToSpawn(n);
    setSpawnCd(1.2);
    setStats({ earned: 0, served: 0, missed: 0 });
    setPhase("open");
  };

  const nextDay = () => { setDay(d => d + 1); setPhase("morning"); setCusts([]); };

  // ── PALETTE ───────────────────────────────────────────────────────────────

  const C = {
    bg:       "#FFF8F0",
    paper:    "#FFFBF6",
    card:     "rgba(255,252,246,0.95)",
    rose:     "#C07090",
    roseDk:   "#924560",  
    sage:     "#6A9870",
    sageDk:   "#4A7850",
    gold:     "#C09040",
    cream:    "#F5E8D4",
    border:   "rgba(150,100,70,0.18)",
    text:     "#3A2018",
    muted:    "#7A5040",
    sh:       "0 2px 16px rgba(90,50,30,0.10), 0 1px 3px rgba(90,50,30,0.07)",
  };

  const bodyFont = "'Lato', 'Helvetica Neue', sans-serif";
  const headFont = "'Playfair Display', 'Georgia', serif";

  const btn = (bg, extra = {}) => ({
    background: bg,
    color: "#FFF",
    border: "none",
    borderRadius: 12,
    padding: "10px 20px",
    fontFamily: bodyFont,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textShadow: "0 1px 2px rgba(0,0,0,0.25)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "filter 0.15s, transform 0.1s",
    ...extra,
  });

  const card = (extra = {}) => ({
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 18,
    boxShadow: C.sh,
    ...extra,
  });

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 15% 10%, #FFE4D0 0%, #FFF8F0 55%, #F8F0E8 100%)`, fontFamily: bodyFont, color: C.text }}>

      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(150,100,70,0.25); border-radius: 3px; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateX(12px); } to { opacity: 1; transform: scale(1) translateX(0); } }
        @keyframes shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        .cust-enter { animation: popIn 0.3s cubic-bezier(0.34,1.4,0.64,1); }
        .toast-enter { animation: slideDown 0.3s ease; }
        .phase-enter { animation: slideDown 0.4s ease; }
        .pulse { animation: shimmer 1.8s ease-in-out infinite; }
        button:hover { filter: brightness(1.08); transform: translateY(-1px); }
        button:active { transform: translateY(0); filter: brightness(0.98); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${C.roseDk} 0%, ${C.rose} 100%)`, color: "#FFF8F2", padding: "14px 28px", display: "flex", alignItems: "center", gap: 20, boxShadow: "0 3px 16px rgba(120,50,70,0.3)" }}>
        <div>
          <div style={{ fontFamily: headFont, fontSize: 22, fontWeight: 700, letterSpacing: "0.01em", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🧶</span> Woolsworth & Co.
          </div>
          <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>Your cozy yarn shop</div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Day */}
        <Stat label="Day" value={day} />

        {/* Money */}
        <Stat label="Cash" value={`$${money}`} />

        {/* Reputation bar */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Reputation</div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, height: 8, width: 110 }}>
            <div style={{ width: `${rep}%`, height: "100%", background: "linear-gradient(90deg, #FFD060, #FFA030)", borderRadius: 6, transition: "width 0.6s" }} />
          </div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 3 }}>{rep} / 100</div>
        </div>

        {/* Phase badge */}
        <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 20, padding: "6px 16px", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", backdropFilter: "blur(4px)" }}>
          {phase === "morning" ? "☀️ Morning" : phase === "open" ? "🔔 Open" : "🌙 Evening"}
        </div>
      </div>

      {/* ── TOASTS ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", top: 72, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{
            background: t.type === "good" ? "#3A7A4A" : t.type === "bad" ? "#A04040" : "#907030",
            color: "#FFF",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 400,
            boxShadow: "0 4px 18px rgba(0,0,0,0.22)",
            maxWidth: 280,
            lineHeight: 1.4,
          }}>{t.msg}</div>
        ))}
      </div>

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 20px" }}>

        {/* ═══════════════ MORNING ═══════════════ */}
        {phase === "morning" && (
          <div className="phase-enter">
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: headFont, fontSize: 28, color: C.roseDk, marginBottom: 4 }}>Good morning! ☀️</h2>
              <p style={{ color: C.muted, fontSize: 14 }}>
                Stock your shelves before opening — you have <strong style={{ color: C.sage }}>${money}</strong> to spend.
                {day === 1 && <span style={{ color: C.muted }}> Tip: stock a variety and watch for what customers need!</span>}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {YARNS.map(y => (
                <div key={y.id} style={card({ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 })}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <YarnBall color={y.color} size={38} />
                    <div>
                      <div style={{ fontFamily: headFont, fontSize: 14, fontWeight: 600 }}>{y.name}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{y.weight} weight</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: C.muted }}>Cost <strong style={{ color: C.text }}>${y.cost}</strong> · Sells for <strong style={{ color: C.sage }}>${y.price}</strong></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.muted }}>Stock: <strong style={{ color: inv[y.id] > 0 ? C.sage : C.muted }}>{inv[y.id]}</strong></span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <QtyBtn onClick={() => adjustCart(y.id, -1)} label="−" C={C} />
                      <span style={{ fontWeight: 700, minWidth: 18, textAlign: "center", fontSize: 15 }}>{cart[y.id]}</span>
                      <QtyBtn onClick={() => adjustCart(y.id, 1)} label="+" C={C} accent />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order bar */}
            <div style={card({ padding: "16px 22px", display: "flex", alignItems: "center", gap: 16 })}>
              <div style={{ fontFamily: bodyFont, fontSize: 14 }}>
                Order total:{" "}
                <strong style={{ color: cartTotal > money ? "#B03030" : C.sage, fontSize: 16 }}>${cartTotal}</strong>
                {cartTotal > 0 && money - cartTotal >= 0 && (
                  <span style={{ color: C.muted, fontSize: 12, marginLeft: 10 }}>→ ${money - cartTotal} remaining</span>
                )}
              </div>
              <div style={{ flex: 1 }} />
              {cartTotal > 0 && (
                <button onClick={placeOrder} style={btn(`linear-gradient(135deg, ${C.sage}, ${C.sageDk})`, { opacity: cartTotal > money ? 0.5 : 1 })}>
                  📦 Receive Order
                </button>
              )}
              <button onClick={openShop} style={btn(`linear-gradient(135deg, ${C.rose}, ${C.roseDk})`, { padding: "10px 24px", fontSize: 14 })}>
                🔔 Open the Shop
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ OPEN ═══════════════ */}
        {phase === "open" && (
          <div className="phase-enter" style={{ display: "flex", gap: 20 }}>

            {/* Customer queue */}
            <div style={{ flex: 2 }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: headFont, fontSize: 24, color: C.roseDk }}>The shop is open! 🔔</h2>
                <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
                  {toSpawn > 0
                    ? `${custs.length} customer${custs.length !== 1 ? "s" : ""} inside · ${toSpawn} more on the way`
                    : custs.length > 0
                      ? `${custs.length} customer${custs.length !== 1 ? "s" : ""} remaining — last ones of the day!`
                      : closing ? "Closing time… counting the till ✨" : ""}
                </p>
              </div>

              {custs.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
                  <div className="pulse" style={{ fontSize: 52, marginBottom: 12 }}>🌸</div>
                  <div style={{ fontFamily: headFont, fontSize: 16, fontStyle: "italic" }}>
                    {toSpawn > 0 ? "Waiting for customers…" : "Wrapping up for the day…"}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {custs.map(c => {
                  const pct = c.patience / c.max;
                  const barColor = pct > 0.55 ? C.sage : pct > 0.28 ? C.gold : "#C04040";
                  const canServe = inv[c.yarn.id] >= c.amount;
                  return (
                    <div key={c.id} className="cust-enter" style={card({ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 })}>
                      {/* Avatar */}
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: `linear-gradient(135deg, ${c.yarn.color}55, ${c.yarn.color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: `2px solid ${c.yarn.color}55` }}>
                        {c.avatar}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: headFont, fontWeight: 600, fontSize: 15 }}>{c.name}</span>
                          {!canServe && <span style={{ fontSize: 10, background: "#FFE8D8", color: "#A05020", borderRadius: 8, padding: "2px 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Out of stock</span>}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                          Making{" "}<em>{c.project}</em>{" "}— needs{" "}
                          <strong style={{ color: C.text }}>{c.amount} skein{c.amount > 1 ? "s" : ""}</strong>{" "}of{" "}
                          <span style={{ color: c.yarn.color, fontWeight: 700 }}>{c.yarn.name}</span>{" "}
                          <span style={{ color: C.muted }}>({c.yarn.weight})</span>
                        </div>
                        {/* Patience bar */}
                        <div style={{ marginTop: 8, background: "#EAE0D8", borderRadius: 6, height: 5 }}>
                          <div style={{ width: `${pct * 100}%`, height: "100%", background: barColor, borderRadius: 6, transition: "width 0.35s linear, background 0.5s" }} />
                        </div>
                      </div>

                      <button
                        onClick={() => serve(c)}
                        style={btn(
                          canServe
                            ? `linear-gradient(135deg, ${c.yarn.color}, ${c.yarn.color}BB)`
                            : "#C8BAB0",
                          { cursor: canServe ? "pointer" : "not-allowed", opacity: canServe ? 1 : 0.65, flexShrink: 0, minWidth: 100 }
                        )}
                      >
                        Serve · <strong>${c.yarn.price * c.amount}</strong>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stock sidebar */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={card({ padding: "18px 16px", position: "sticky", top: 20 })}>
                <div style={{ fontFamily: headFont, fontSize: 16, color: C.roseDk, marginBottom: 14 }}>🗃️ Current Stock</div>
                {YARNS.map(y => (
                  <div key={y.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <YarnBall color={y.color} size={22} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{y.name}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{y.weight}</div>
                    </div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 15,
                      minWidth: 24,
                      textAlign: "right",
                      color: inv[y.id] === 0 ? "#C04040" : inv[y.id] <= 1 ? C.gold : C.sage,
                    }}>{inv[y.id]}</div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted }}>
                    <span>Earned today</span>
                    <strong style={{ color: C.sage }}>${stats.earned}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginTop: 4 }}>
                    <span>Served</span>
                    <strong style={{ color: C.text }}>{stats.served}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════ EVENING ═══════════════ */}
        {phase === "evening" && (
          <div className="phase-enter" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 68, marginBottom: 16 }}>🌙</div>
            <h2 style={{ fontFamily: headFont, fontSize: 30, color: C.roseDk, marginBottom: 6 }}>Day {day} Complete</h2>
            <p style={{ color: C.muted, marginBottom: 28, fontStyle: "italic" }}>Time to close up and count the till.</p>

            <div style={card({ padding: "28px 32px", marginBottom: 20 })}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
                {[
                  { label: "Earned",  val: `$${stats.earned}`, icon: "💰", color: C.sage },
                  { label: "Served",  val: stats.served,       icon: "🧶", color: C.rose },
                  { label: "Missed",  val: stats.missed,       icon: "😢", color: stats.missed > 2 ? "#B03030" : C.muted },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontFamily: headFont, fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div style={{ background: C.cream, borderRadius: 12, padding: "14px 18px", fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6, fontStyle: "italic" }}>
                {stats.missed === 0
                  ? "✨ Wonderful — every customer left with their yarn today!"
                  : stats.served >= stats.missed * 2
                    ? "A good day overall. A few customers slipped away — stock more variety tomorrow."
                    : "Tricky day! Consider ordering more of the popular weights before tomorrow."}
              </div>

              {/* Bottom line */}
              <div style={{ display: "flex", justifyContent: "center", gap: 32, fontSize: 14 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Cash on Hand</div>
                  <div style={{ fontFamily: headFont, fontSize: 22, color: C.sage }}>${money}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Reputation</div>
                  <div style={{ fontFamily: headFont, fontSize: 22, color: C.gold }}>{rep}/100</div>
                </div>
              </div>
            </div>

            <button onClick={nextDay} style={btn(`linear-gradient(135deg, ${C.rose}, ${C.roseDk})`, { padding: "14px 40px", fontSize: 16, fontFamily: headFont, borderRadius: 16, boxShadow: "0 6px 20px rgba(140,60,80,0.3)" })}>
              Start Day {day + 1} →
            </button>

            {rep >= 75 && (
              <div style={{ marginTop: 20, background: "#FFF8E0", border: `1px solid ${C.gold}55`, borderRadius: 14, padding: "12px 20px", fontSize: 13, color: "#7A5010" }}>
                🌟 Your reputation is soaring! Customers are spreading the word about Woolsworth & Co.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS ─────────────────────────────────────────────────────────

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: "center", minWidth: 50 }}>
      <div style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function QtyBtn({ onClick, label, C, accent }) {
  return (
    <button onClick={onClick} style={{
      width: 28,
      height: 28,
      borderRadius: 8,
      border: `1px solid ${C.border}`,
      background: accent ? `${C.rose}22` : C.cream,
      cursor: "pointer",
      fontSize: 17,
      lineHeight: "26px",
      color: accent ? C.roseDk : C.muted,
      fontWeight: 700,
      padding: 0,
    }}>{label}</button>
  );
}
