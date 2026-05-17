import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const ALL_YARNS = [
  // Base — always available
  { id:"merino",        name:"Merino Wool",      sub:"Natural",        weight:"Worsted",   color:"#C87898", cost:8,  price:15, unlockRep:0,  upgrade:null },
  { id:"alpaca",        name:"Alpaca Blend",      sub:"Natural",        weight:"DK",        color:"#B89870", cost:10, price:18, unlockRep:0,  upgrade:null },
  { id:"cotton",        name:"Cotton",            sub:"Natural",        weight:"Fingering", color:"#60A888", cost:6,  price:12, unlockRep:0,  upgrade:null },
  { id:"silk",          name:"Silk Blend",        sub:"Natural",        weight:"Lace",      color:"#E8A8C0", cost:15, price:28, unlockRep:0,  upgrade:null },
  { id:"chunky",        name:"Chunky Wool",       sub:"Natural",        weight:"Bulky",     color:"#D09838", cost:7,  price:14, unlockRep:0,  upgrade:null },
  { id:"cashmere",      name:"Cashmere",          sub:"Natural",        weight:"DK",        color:"#8878C0", cost:20, price:35, unlockRep:0,  upgrade:null },
  // Colorways — reputation-gated
  { id:"merino_rose",   name:"Merino Wool",       sub:"Dusty Rose",     weight:"Worsted",   color:"#D4789A", cost:9,  price:17, unlockRep:25, upgrade:null },
  { id:"merino_grey",   name:"Merino Wool",       sub:"Storm Grey",     weight:"Worsted",   color:"#8898A8", cost:9,  price:17, unlockRep:35, upgrade:null },
  { id:"alpaca_fern",   name:"Alpaca Blend",      sub:"Fern Green",     weight:"DK",        color:"#6A9870", cost:11, price:20, unlockRep:40, upgrade:null },
  { id:"cotton_coral",  name:"Cotton",            sub:"Sunrise Coral",  weight:"Fingering", color:"#E07860", cost:7,  price:14, unlockRep:45, upgrade:null },
  { id:"silk_plum",     name:"Silk Blend",        sub:"Midnight Plum",  weight:"Lace",      color:"#8060A0", cost:16, price:30, unlockRep:55, upgrade:null },
  { id:"chunky_cream",  name:"Chunky Wool",       sub:"Arctic White",   weight:"Bulky",     color:"#E0D8C8", cost:8,  price:16, unlockRep:50, upgrade:null },
  // Hand-dyed — requires Dyeing Station
  { id:"dyed_merino",   name:"Hand-Dyed Merino",  sub:"Autumn Harvest", weight:"Worsted",   color:"#C06030", cost:12, price:22, unlockRep:0,  upgrade:"dyeingStation" },
  { id:"dyed_silk",     name:"Hand-Dyed Silk",    sub:"Ocean Depths",   weight:"Lace",      color:"#3070A0", cost:18, price:38, unlockRep:0,  upgrade:"dyeingStation" },
];

const PROJECTS = {
  merino:"a cozy sweater", merino_rose:"a romantic cardigan", merino_grey:"a classic pullover",
  alpaca:"warm mittens",   alpaca_fern:"nature-inspired gloves",
  cotton:"a summer top",   cotton_coral:"a beach cover-up",
  silk:"a delicate shawl", silk_plum:"an evening wrap",
  chunky:"a chunky blanket", chunky_cream:"a Scandi-style throw",
  cashmere:"a luxurious scarf",
  dyed_merino:"a one-of-a-kind sweater", dyed_silk:"a heirloom shawl",
};

const UPGRADES_DEF = [
  { id:"seatingNook",   name:"Seating Nook",   cost:100, icon:"🛋️", desc:"Comfy armchairs for browsers. Customers are 60% more patient." },
  { id:"patternRack",   name:"Pattern Rack",   cost:80,  icon:"📋", desc:"Project patterns & books. 25% chance to upsell a pattern for +$8." },
  { id:"dyeingStation", name:"Dyeing Station", cost:180, icon:"🎨", desc:"Dye your own colourways. Unlocks premium hand-dyed yarns." },
  { id:"goodLighting",  name:"Good Lighting",  cost:120, icon:"💡", desc:"Beautiful display lighting. One extra customer visits each day." },
  { id:"coffeeNook",    name:"Coffee Station", cost:150, icon:"☕", desc:"Fresh coffee for browsers. Customers spend 15% more per visit." },
];

const REGULARS_DEF = [
  { id:"margaret", name:"Margaret", avatar:"👩‍🦳", fav:"merino",   colorFav:"merino_rose", project:"her annual Christmas sweater",  tip:6,  greeting:`"Oh hello dear! You always have the most beautiful merino."` },
  { id:"priya",    name:"Priya",    avatar:"👩",   fav:"silk",     colorFav:"silk_plum",   project:"an intricate lace shawl",      tip:10, greeting:`"I've been dreaming about this project all week!"` },
  { id:"helen",    name:"Helen",    avatar:"👵",   fav:"cotton",   colorFav:"cotton_coral",project:"gifts for the grandchildren",   tip:4,  greeting:`"The little ones grow so fast — I must get knitting!"` },
  { id:"sofia",    name:"Sofia",    avatar:"🧑",   fav:"cashmere", colorFav:null,          project:"a luxury accessory",           tip:15, greeting:`"I've checked three other shops. I do hope you have cashmere."` },
  { id:"diane",    name:"Diane",    avatar:"👩‍🦱", fav:"chunky",   colorFav:"chunky_cream",project:"a quick weekend project",       tip:5,  greeting:`"You won't believe my week. I need yarn therapy immediately."` },
];

const EVENTS_DEF = [
  { type:"knitNight",   name:"Knit Night",   icon:"🌙", days:[3,6,9,12,15,18,21,24], extraCusts:3, repBonus:6,  desc:"Loyal knitters gather for an evening stitch-along. Regulars are more likely to attend!", premium:false, bigBuy:false },
  { type:"trunkShow",   name:"Trunk Show",   icon:"✨", days:[5,10,15,20],            extraCusts:4, repBonus:10, desc:"A premium showcase — discerning customers looking for the very best.", premium:true, bigBuy:false },
  { type:"holidaySale", name:"Holiday Sale", icon:"🎄", days:[14],                    extraCusts:6, repBonus:14, desc:"The big seasonal rush! Everyone is in a gifting mood and buying in large quantities.", premium:false, bigBuy:true },
];

const RAND_NAMES = ["Abby","Beth","Claire","Dana","Eve","Fran","Grace","Harriet","Ivy","Joan","Kay","Laura","Meredith","Nancy","Olive"];
const AVATARS = ["👩","👩‍🦳","👩‍🦱","🧑","👵","🧓","👩‍🎨","🧕"];

let _uid = 0;
const mkCust = (yarn, name, avatar, patience, project, opts = {}) => ({
  id: _uid++, yarn, name, avatar,
  patience, max: patience,
  project,
  amount: opts.bigBuy ? Math.ceil(Math.random()*2)+2 : (opts.amount ?? Math.ceil(Math.random()*3)),
  isRegular: opts.isRegular || null,
  greeting:  opts.greeting  || null,
  tipAmount: opts.tipAmount || 0,
});

const zeroInv = () => Object.fromEntries(ALL_YARNS.map(y => [y.id, 0]));

// ─── YARN BALL SVG ────────────────────────────────────────────────────────────

function YarnBall({ color, size = 36 }) {
  const gid = `yb${color.replace(/\W/g,"")}s${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink:0 }}>
      <defs>
        <radialGradient id={gid} cx="37%" cy="31%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55"/>
          <stop offset="100%" stopColor={color} stopOpacity="1"/>
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill={`url(#${gid})`} style={{ filter:`drop-shadow(0 2px 5px ${color}66)` }}/>
      <ellipse cx="20" cy="20" rx="11" ry="18" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.3"/>
      <ellipse cx="20" cy="20" rx="18" ry="10" fill="none" stroke="rgba(255,255,255,0.38)" strokeWidth="1.3"/>
      <line x1="7" y1="13" x2="33" y2="28" stroke="rgba(255,255,255,0.28)" strokeWidth="1"/>
    </svg>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function QtyBtn({ onClick, label, C, accent }) {
  return (
    <button onClick={onClick} style={{ width:28, height:28, borderRadius:8, border:`1px solid ${C.border}`, background:accent?`${C.rose}22`:C.cream, fontSize:17, lineHeight:"26px", color:accent?C.roseDk:C.muted, fontWeight:700, padding:0 }}>
      {label}
    </button>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function Woolsworth() {
  const [money,    setMoney]    = useState(200);
  const [day,      setDay]      = useState(1);
  const [rep,      setRep]      = useState(22);
  const [phase,    setPhase]    = useState("morning");
  const [inv,      setInv]      = useState(zeroInv());
  const [cart,     setCart]     = useState(zeroInv());
  const [upgrades, setUpgrades] = useState(Object.fromEntries(UPGRADES_DEF.map(u=>[u.id,false])));
  const [loyalty,  setLoyalty]  = useState(Object.fromEntries(REGULARS_DEF.map(r=>[r.id,0])));
  const [custs,    setCusts]    = useState([]);
  const [toSpawn,  setToSpawn]  = useState(0);
  const [spawnCd,  setSpawnCd]  = useState(0);
  const [stats,    setStats]    = useState({ earned:0, served:0, missed:0 });
  const [toasts,   setToasts]   = useState([]);
  const closingRef = useRef(false); // ref avoids re-triggering the effect on close
  const [tab,      setTab]      = useState("stock");

  // Stale-closure guards
  const custsRef  = useRef(custs);
  const ctxRef    = useRef({ upgrades, rep, day });
  useEffect(() => { custsRef.current = custs; },              [custs]);
  useEffect(() => { ctxRef.current = { upgrades, rep, day }; }, [upgrades, rep, day]);

  const todayEvent     = EVENTS_DEF.find(e => e.days.includes(day)) || null;
  const availableYarns = useMemo(() =>
    ALL_YARNS.filter(y => y.unlockRep <= rep && (!y.upgrade || upgrades[y.upgrade])),
    [rep, upgrades]
  );
  const nextUnlocks = ALL_YARNS.filter(y => y.unlockRep > rep && !y.upgrade)
                                .sort((a,b) => a.unlockRep - b.unlockRep);

  const toast = useCallback((msg, type="good") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  // ── GAME TICK ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open") return;
    const iv = setInterval(() => {
      setCusts(prev => {
        const updated = prev.map(c => ({ ...c, patience: c.patience - 0.25 }));
        const gone    = updated.filter(c => c.patience <= 0);
        if (gone.length) {
          setRep(r => Math.max(0, r - gone.length * 4));
          setStats(s => ({ ...s, missed: s.missed + gone.length }));
          gone.forEach(c => toast(`${c.name} left — out of ${c.yarn.name} 😢`, "bad"));
        }
        return updated.filter(c => c.patience > 0);
      });
      setSpawnCd(t => t - 0.25);
    }, 250);
    return () => clearInterval(iv);
  }, [phase, toast]);

  // ── CUSTOMER SPAWN ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "open" || toSpawn <= 0 || spawnCd > 0) return;

    const { upgrades: upg, rep: r, day: d } = ctxRef.current;
    const floor = custsRef.current;
    const avail = ALL_YARNS.filter(y => y.unlockRep <= r && (!y.upgrade || upg[y.upgrade]));
    if (!avail.length) return;

    const ev = EVENTS_DEF.find(e => e.days.includes(d)) || null;
    const patience = upg.seatingNook ? 21 : 13;

    // 30% chance of a regular on day 2+ (if not already on the floor)
    const regPool  = REGULARS_DEF.filter(reg => !floor.some(c => c.isRegular === reg.id));
    const useReg   = d >= 2 && regPool.length > 0 && Math.random() < 0.30;

    let newCust;
    if (useReg) {
      const reg  = regPool[Math.floor(Math.random() * regPool.length)];
      const yarn = (reg.colorFav && avail.find(y => y.id === reg.colorFav))
                 || avail.find(y => y.id === reg.fav)
                 || avail[0];
      newCust = mkCust(yarn, reg.name, reg.avatar, upg.seatingNook ? 26 : 18,
        reg.project, { isRegular:reg.id, greeting:reg.greeting, tipAmount:reg.tip, amount:2 });
    } else {
      const pool   = (ev?.premium ? avail.filter(y => y.price >= 18) : avail);
      const bucket = pool.length ? pool : avail;
      const yarn   = bucket[Math.floor(Math.random() * bucket.length)];
      newCust = mkCust(yarn,
        RAND_NAMES[Math.floor(Math.random() * RAND_NAMES.length)],
        AVATARS[Math.floor(Math.random() * AVATARS.length)],
        patience, PROJECTS[yarn.id] || "a special project",
        { bigBuy: ev?.bigBuy || false });
    }

    setCusts(p => [...p, newCust]);
    setToSpawn(n => n - 1);
    setSpawnCd(3 + Math.random() * 3.5);
  }, [phase, toSpawn, spawnCd]);

  // ── AUTO-CLOSE ─────────────────────────────────────────────────────────────
  // Uses a ref (not state) for the closing flag so setting it doesn't
  // re-trigger this effect and cancel the timeout before it fires.
  useEffect(() => {
    if (phase !== "open" || toSpawn > 0 || custs.length > 0) return;
    if (closingRef.current) return;
    closingRef.current = true;
    const t = setTimeout(() => {
      setPhase("evening");
      closingRef.current = false;
    }, 1300);
    return () => clearTimeout(t);
  }, [phase, toSpawn, custs.length]);

  // ── SERVE ─────────────────────────────────────────────────────────────────
  const serve = c => {
    if (inv[c.yarn.id] < c.amount) {
      toast(`Need ${c.amount - inv[c.yarn.id]} more ${c.yarn.name}!`, "warn");
      return;
    }
    setInv(p => ({ ...p, [c.yarn.id]: p[c.yarn.id] - c.amount }));

    const mult    = upgrades.coffeeNook ? 1.15 : 1;
    let earned    = Math.round(c.yarn.price * c.amount * mult);
    const bonuses = [];

    if (upgrades.patternRack && Math.random() < 0.25) {
      earned += 8;
      bonuses.push("+ pattern 📋");
    }
    if (c.isRegular) {
      const cur  = loyalty[c.isRegular] || 0;
      const next = cur + 1;
      setLoyalty(p => ({ ...p, [c.isRegular]: next }));
      if (next % 3 === 0) {
        earned += c.tipAmount;
        bonuses.push(`+$${c.tipAmount} tip 💝`);
      }
    }

    setMoney(m => m + earned);
    setRep(r => Math.min(100, r + (c.isRegular ? 4 : 3)));
    setStats(s => ({ ...s, earned: s.earned + earned, served: s.served + 1 }));
    setCusts(p => p.filter(x => x.id !== c.id));
    toast(`✨ +$${earned} — ${c.name} is delighted!${bonuses.length ? " " + bonuses.join(" ") : ""}`, "good");
  };

  // ── ORDERING ──────────────────────────────────────────────────────────────
  const cartTotal = availableYarns.reduce((s, y) => s + (cart[y.id]||0) * y.cost, 0);

  const adjustCart = (id, d) => {
    const y = ALL_YARNS.find(y => y.id === id);
    if (!y || (d > 0 && money - cartTotal < y.cost)) return;
    setCart(p => ({ ...p, [id]: Math.max(0, (p[id]||0) + d) }));
  };

  const placeOrder = () => {
    if (!cartTotal || cartTotal > money) return;
    setMoney(m => m - cartTotal);
    setInv(p => {
      const n = { ...p };
      availableYarns.forEach(y => { n[y.id] = (n[y.id]||0) + (cart[y.id]||0); });
      return n;
    });
    setCart(zeroInv());
    toast("Stock delivered! 📦", "good");
  };

  const buyUpgrade = u => {
    if (money < u.cost || upgrades[u.id]) return;
    setMoney(m => m - u.cost);
    setUpgrades(p => ({ ...p, [u.id]: true }));
    toast(`${u.icon} ${u.name} installed!`, "good");
  };

  const openShop = () => {
    const n = 5 + Math.floor(rep / 30)
            + (todayEvent?.extraCusts || 0)
            + (upgrades.goodLighting ? 1 : 0);
    setToSpawn(n);
    setSpawnCd(1.2);
    setStats({ earned:0, served:0, missed:0 });
    setPhase("open");
  };

  const nextDay = () => {
    if (todayEvent) setRep(r => Math.min(100, r + todayEvent.repBonus));
    closingRef.current = false;
    setDay(d => d + 1);
    setPhase("morning");
    setCusts([]);
    setTab("stock");
  };

  // ── PALETTE ───────────────────────────────────────────────────────────────
  const C = {
    card:"rgba(255,252,246,0.97)", rose:"#C07090", roseDk:"#924560",
    sage:"#6A9870", sageDk:"#4A7850", gold:"#C09040", cream:"#F5E8D4",
    border:"rgba(150,100,70,0.18)", text:"#3A2018", muted:"#7A5040",
    sh:"0 2px 16px rgba(90,50,30,0.10), 0 1px 3px rgba(90,50,30,0.06)",
  };
  const hf = "'Playfair Display','Georgia',serif";
  const bf = "'Lato','Helvetica Neue',sans-serif";
  const cardSt = (e={}) => ({ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, boxShadow:C.sh, ...e });
  const btnSt  = (bg,e={}) => ({ background:bg, color:"#FFF", border:"none", borderRadius:12, padding:"10px 20px", fontFamily:bf, fontSize:13, fontWeight:700, cursor:"pointer", textShadow:"0 1px 2px rgba(0,0,0,0.2)", boxShadow:"0 2px 8px rgba(0,0,0,0.1)", transition:"filter 0.15s,transform 0.1s", ...e });

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 15% 10%, #FFE4D0 0%, #FFF8F0 55%, #F8F0E8 100%)", fontFamily:bf, color:C.text }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(150,100,70,0.25);border-radius:3px}
        button{transition:filter 0.15s,transform 0.1s;cursor:pointer}
        button:hover{filter:brightness(1.08);transform:translateY(-1px)}
        button:active{transform:translateY(0);filter:brightness(0.97)}
        @keyframes popIn{from{opacity:0;transform:scale(0.9) translateX(12px)}to{opacity:1;transform:scale(1)translateX(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.62}}
        .pop{animation:popIn .32s cubic-bezier(.34,1.5,.64,1)}
        .slide{animation:slideDown .36s ease}
        .pulse{animation:blink 1.9s ease-in-out infinite}
        .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;line-height:1.6}
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${C.roseDk},${C.rose})`, color:"#FFF8F2", padding:"14px 28px", display:"flex", alignItems:"center", gap:22, boxShadow:"0 3px 18px rgba(100,40,60,0.3)" }}>
        <div>
          <div style={{ fontFamily:hf, fontSize:22, fontWeight:700 }}>🧶 Woolsworth & Co.</div>
          <div style={{ fontSize:11, opacity:.72, textTransform:"uppercase", letterSpacing:".07em", marginTop:1 }}>Your cosy yarn shop</div>
        </div>
        <div style={{ flex:1 }}/>
        {[{l:"Day",v:day},{l:"Cash",v:`$${money}`}].map(s=>(
          <div key={s.l} style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, opacity:.68, textTransform:"uppercase", letterSpacing:".1em", marginBottom:2 }}>{s.l}</div>
            <div style={{ fontFamily:hf, fontSize:20, fontWeight:700 }}>{s.v}</div>
          </div>
        ))}
        <div style={{ textAlign:"center", minWidth:110 }}>
          <div style={{ fontSize:10, opacity:.68, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Reputation</div>
          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:6, height:8, width:110 }}>
            <div style={{ width:`${rep}%`, height:"100%", background:"linear-gradient(90deg,#FFD060,#FFA030)", borderRadius:6, transition:"width .6s" }}/>
          </div>
          <div style={{ fontSize:10, opacity:.78, marginTop:3 }}>{rep}/100</div>
        </div>
        {todayEvent && (
          <div style={{ background:"rgba(255,220,60,0.25)", borderRadius:20, padding:"6px 14px", fontSize:11, letterSpacing:".05em", border:"1px solid rgba(255,220,60,0.4)" }}>
            {todayEvent.icon} {todayEvent.name}
          </div>
        )}
        <div style={{ background:"rgba(255,255,255,0.18)", borderRadius:20, padding:"6px 16px", fontSize:11, textTransform:"uppercase", letterSpacing:".06em" }}>
          {phase==="morning"?"☀️ Morning":phase==="open"?"🔔 Open":"🌙 Evening"}
        </div>
      </div>

      {/* ── TOASTS ──────────────────────────────────────────────────────────── */}
      <div style={{ position:"fixed", top:72, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
        {toasts.map(t=>(
          <div key={t.id} className="slide" style={{ background:t.type==="good"?"#3A7A4A":t.type==="bad"?"#A04040":"#907030", color:"#FFF", padding:"10px 16px", borderRadius:12, fontSize:13, boxShadow:"0 4px 18px rgba(0,0,0,0.22)", maxWidth:300, lineHeight:1.4 }}>{t.msg}</div>
        ))}
      </div>

      <div style={{ maxWidth:980, margin:"0 auto", padding:"28px 20px" }}>

        {/* ════════════ MORNING ════════════ */}
        {phase==="morning" && (
          <div className="slide">
            {todayEvent && (
              <div style={{ background:"linear-gradient(135deg,#FFF8D0,#FFE8A0)", border:`1px solid ${C.gold}66`, borderRadius:16, padding:"14px 22px", marginBottom:22, display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:36 }}>{todayEvent.icon}</span>
                <div>
                  <div style={{ fontFamily:hf, fontSize:16, fontWeight:700, color:"#7A5010" }}>{todayEvent.name} Today!</div>
                  <div style={{ fontSize:13, color:"#8A6020", marginTop:2 }}>{todayEvent.desc}</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:hf, fontSize:28, color:C.roseDk, marginBottom:4 }}>Good morning! ☀️</h2>
              <p style={{ color:C.muted, fontSize:14 }}>Day {day} — you have <strong style={{ color:C.sage }}>${money}</strong> to spend before opening.</p>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex", gap:6, marginBottom:22 }}>
              {[{id:"stock",l:"📦 Stock"},{id:"upgrades",l:"🔨 Upgrades"},{id:"events",l:"📅 Events"}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} style={{ ...btnSt(tab===t.id?`linear-gradient(135deg,${C.rose},${C.roseDk})`:"rgba(150,100,70,0.1)"), color:tab===t.id?"#FFF":C.muted, boxShadow:"none" }}>{t.l}</button>
              ))}
            </div>

            {/* ── STOCK tab ── */}
            {tab==="stock" && <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                {availableYarns.map(y=>{
                  const isNew = y.unlockRep > 0 && rep - y.unlockRep < 8;
                  return (
                    <div key={y.id} style={cardSt({ padding:"14px 16px" })}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <YarnBall color={y.color} size={36}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                            <span style={{ fontFamily:hf, fontSize:13, fontWeight:600 }}>{y.name}</span>
                            {isNew      && <span className="badge" style={{ background:"#FFE060",  color:"#8A6000" }}>New!</span>}
                            {y.upgrade  && <span className="badge" style={{ background:"#E0D0F8",  color:"#5040A0" }}>Hand-dyed</span>}
                          </div>
                          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{y.sub} · {y.weight}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:10 }}>
                        <span style={{ color:C.muted }}>${y.cost} cost → <strong style={{ color:C.sage }}>${y.price}</strong></span>
                        <span style={{ color:inv[y.id]>0?C.sage:C.muted, fontWeight:700 }}>×{inv[y.id]||0}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8 }}>
                        <QtyBtn onClick={()=>adjustCart(y.id,-1)} label="−" C={C}/>
                        <span style={{ fontWeight:700, minWidth:20, textAlign:"center" }}>{cart[y.id]||0}</span>
                        <QtyBtn onClick={()=>adjustCart(y.id,1)} label="+" C={C} accent/>
                      </div>
                    </div>
                  );
                })}
              </div>

              {nextUnlocks.length > 0 && (
                <div style={{ ...cardSt({ padding:"12px 18px", marginBottom:16 }), background:"rgba(240,236,252,0.8)" }}>
                  <div style={{ fontSize:12, color:C.muted, fontWeight:700, marginBottom:8 }}>🔒 Unlocks as your reputation grows</div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {nextUnlocks.slice(0,5).map(y=>(
                      <div key={y.id} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.65)", borderRadius:10, padding:"5px 12px" }}>
                        <YarnBall color={y.color} size={18}/>
                        <span style={{ fontSize:11, color:C.muted }}>{y.name} — {y.sub}</span>
                        <span className="badge" style={{ background:"rgba(150,100,70,0.12)", color:C.muted }}>rep {y.unlockRep}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={cardSt({ padding:"16px 22px", display:"flex", alignItems:"center", gap:16 })}>
                <div style={{ fontSize:14 }}>
                  Order total: <strong style={{ color:cartTotal>money?"#B03030":C.sage, fontSize:16 }}>${cartTotal}</strong>
                  {cartTotal>0 && money-cartTotal>=0 && <span style={{ color:C.muted, fontSize:12, marginLeft:10 }}>→ ${money-cartTotal} left</span>}
                </div>
                <div style={{ flex:1 }}/>
                {cartTotal>0 && <button onClick={placeOrder} style={btnSt(`linear-gradient(135deg,${C.sage},${C.sageDk})`, { opacity:cartTotal>money?.5:1 })}>📦 Receive Order</button>}
                <button onClick={openShop} style={btnSt(`linear-gradient(135deg,${C.rose},${C.roseDk})`, { padding:"10px 24px", fontSize:14 })}>🔔 Open the Shop</button>
              </div>
            </>}

            {/* ── UPGRADES tab ── */}
            {tab==="upgrades" && <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:18 }}>
                {UPGRADES_DEF.map(u=>{
                  const owned = upgrades[u.id];
                  const canAfford = money >= u.cost;
                  return (
                    <div key={u.id} style={cardSt({ padding:"20px 18px", background:owned?"rgba(106,152,112,0.1)":C.card })}>
                      <div style={{ fontSize:38, marginBottom:10 }}>{u.icon}</div>
                      <div style={{ fontFamily:hf, fontSize:15, fontWeight:600, marginBottom:6, color:owned?C.sageDk:C.text }}>{u.name}</div>
                      <div style={{ fontSize:12, color:C.muted, lineHeight:1.55, marginBottom:14 }}>{u.desc}</div>
                      {owned
                        ? <div style={{ ...btnSt(`linear-gradient(135deg,${C.sage},${C.sageDk})`), textAlign:"center", cursor:"default", pointerEvents:"none" }}>✓ Installed</div>
                        : <button onClick={()=>buyUpgrade(u)} style={btnSt(canAfford?`linear-gradient(135deg,${C.rose},${C.roseDk})`:"rgba(150,100,70,0.15)", { width:"100%", color:canAfford?"#FFF":C.muted, cursor:canAfford?"pointer":"not-allowed" })}>
                            {canAfford ? `Buy · $${u.cost}` : `$${u.cost} (need $${u.cost-money} more)`}
                          </button>
                      }
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign:"center" }}>
                <button onClick={openShop} style={btnSt(`linear-gradient(135deg,${C.rose},${C.roseDk})`, { padding:"12px 32px", fontSize:15 })}>🔔 Open the Shop</button>
              </div>
            </>}

            {/* ── EVENTS tab ── */}
            {tab==="events" && <>
              <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
                {EVENTS_DEF.map(e=>{
                  const isToday  = e.days.includes(day);
                  const upcoming = e.days.find(d => d > day);
                  return (
                    <div key={e.type} style={cardSt({ padding:"18px 22px", display:"flex", gap:16, alignItems:"flex-start", background:isToday?"rgba(255,240,195,0.97)":C.card, border:isToday?`1px solid ${C.gold}88`:C.border })}>
                      <span style={{ fontSize:38, flexShrink:0, lineHeight:1 }}>{e.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ fontFamily:hf, fontSize:16, fontWeight:600 }}>{e.name}</span>
                          {isToday && <span className="badge" style={{ background:"#FFD060", color:"#7A5010" }}>Today!</span>}
                        </div>
                        <div style={{ fontSize:13, color:C.muted, lineHeight:1.55, marginBottom:8 }}>{e.desc}</div>
                        <div style={{ display:"flex", gap:18, fontSize:12, color:C.muted }}>
                          <span>+{e.extraCusts} extra customers</span>
                          <span>+{e.repBonus} reputation at close</span>
                          {!isToday && upcoming && <span>Next: Day {upcoming}</span>}
                          {isToday && upcoming  && <span>Repeats: Day {upcoming}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign:"center" }}>
                <button onClick={openShop} style={btnSt(`linear-gradient(135deg,${C.rose},${C.roseDk})`, { padding:"12px 32px", fontSize:15 })}>🔔 Open the Shop</button>
              </div>
            </>}
          </div>
        )}

        {/* ════════════ OPEN ════════════ */}
        {phase==="open" && (
          <div className="slide" style={{ display:"flex", gap:22 }}>

            <div style={{ flex:2, minWidth:0 }}>
              {todayEvent && (
                <div style={{ background:"linear-gradient(135deg,#FFF8D0,#FFE8A0)", border:`1px solid ${C.gold}55`, borderRadius:14, padding:"10px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{todayEvent.icon}</span>
                  <span style={{ fontFamily:hf, fontSize:14, color:"#7A5010" }}>{todayEvent.name} — special customers today!</span>
                </div>
              )}
              <div style={{ marginBottom:18 }}>
                <h2 style={{ fontFamily:hf, fontSize:24, color:C.roseDk }}>The shop is open! 🔔</h2>
                <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>
                  {toSpawn>0 ? `${custs.length} inside · ${toSpawn} on the way`
                  : custs.length>0 ? `Last ${custs.length} customer${custs.length>1?"s":""}!`
                  : "Closing time… counting the till ✨"}
                </p>
              </div>

              {custs.length===0 && (
                <div style={{ textAlign:"center", padding:"56px 20px", color:C.muted }}>
                  <div className="pulse" style={{ fontSize:56, marginBottom:14 }}>🌸</div>
                  <div style={{ fontFamily:hf, fontSize:15, fontStyle:"italic" }}>{toSpawn>0?"Waiting for customers…":"Wrapping up the day…"}</div>
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {custs.map(c=>{
                  const pct  = c.patience/c.max;
                  const bar  = pct>0.55?C.sage:pct>0.28?C.gold:"#C04040";
                  const ok   = (inv[c.yarn.id]||0) >= c.amount;
                  const isReg = !!c.isRegular;
                  const price = Math.round(c.yarn.price*(c.amount||1)*(upgrades.coffeeNook?1.15:1));
                  return (
                    <div key={c.id} className="pop" style={cardSt({ padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:14, border:isReg?`1px solid ${C.rose}66`:C.border, background:isReg?"rgba(255,238,248,0.98)":C.card })}>
                      <div style={{ flexShrink:0, textAlign:"center" }}>
                        <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${c.yarn.color}44,${c.yarn.color}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, border:`2px solid ${isReg?C.rose:c.yarn.color}55` }}>
                          {c.avatar}
                        </div>
                        {isReg && <div style={{ fontSize:10, color:C.rose, fontWeight:700, marginTop:3, letterSpacing:".03em" }}>Regular</div>}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={{ fontFamily:hf, fontWeight:600, fontSize:15 }}>{c.name}</span>
                          {!ok && <span className="badge" style={{ background:"#FFE8D8", color:"#A05020" }}>Out of stock</span>}
                        </div>
                        {c.greeting && <div style={{ fontSize:12, color:C.rose, fontStyle:"italic", marginBottom:5, lineHeight:1.4 }}>{c.greeting}</div>}
                        <div style={{ fontSize:12, color:C.muted, lineHeight:1.55 }}>
                          Working on <em>{c.project}</em> — needs{" "}
                          <strong style={{ color:C.text }}>{c.amount} skein{c.amount>1?"s":""}</strong> of{" "}
                          <strong style={{ color:c.yarn.color }}>{c.yarn.name}</strong>
                          {c.yarn.sub!=="Natural" && <span> ({c.yarn.sub})</span>}
                          <span style={{ color:C.muted }}> [{c.yarn.weight}]</span>
                        </div>
                        <div style={{ marginTop:8, background:"#EAE0D8", borderRadius:6, height:5 }}>
                          <div style={{ width:`${pct*100}%`, height:"100%", background:bar, borderRadius:6, transition:"width .35s linear,background .5s" }}/>
                        </div>
                      </div>
                      <button onClick={()=>serve(c)} style={btnSt(ok?`linear-gradient(135deg,${c.yarn.color},${c.yarn.color}BB)`:"#C8BAB0", { cursor:ok?"pointer":"not-allowed", opacity:ok?1:.6, flexShrink:0, minWidth:112, marginTop:4 })}>
                        Serve · <strong>${price}</strong>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ flex:1, minWidth:190 }}>
              <div style={cardSt({ padding:"16px", position:"sticky", top:20 })}>
                <div style={{ fontFamily:hf, fontSize:15, color:C.roseDk, marginBottom:14 }}>🗃️ Stock</div>
                {availableYarns.map(y=>(
                  <div key={y.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <YarnBall color={y.color} size={20}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{y.name}</div>
                      {y.sub!=="Natural" && <div style={{ fontSize:10, color:C.muted }}>{y.sub}</div>}
                    </div>
                    <div style={{ fontWeight:700, fontSize:14, color:(inv[y.id]||0)===0?"#C04040":(inv[y.id]||0)<=1?C.gold:C.sage }}>{inv[y.id]||0}</div>
                  </div>
                ))}
                <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
                  {[{l:"Earned",v:`$${stats.earned}`,c:C.sage},{l:"Served",v:stats.served,c:C.text}].map(s=>(
                    <div key={s.l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.muted, marginBottom:4 }}>
                      <span>{s.l}</span><strong style={{ color:s.c }}>{s.v}</strong>
                    </div>
                  ))}
                </div>
                {UPGRADES_DEF.some(u=>upgrades[u.id]) && (
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Active Upgrades</div>
                    {UPGRADES_DEF.filter(u=>upgrades[u.id]).map(u=>(
                      <div key={u.id} style={{ fontSize:11, color:C.sage, marginBottom:3 }}>{u.icon} {u.name}</div>
                    ))}
                  </div>
                )}
                {Object.values(loyalty).some(v=>v>0) && (
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:10 }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginBottom:6 }}>Loyal Regulars</div>
                    {REGULARS_DEF.filter(r=>loyalty[r.id]>0).map(r=>(
                      <div key={r.id} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <span style={{ fontSize:14 }}>{r.avatar}</span>
                        <span style={{ fontSize:11, color:C.muted }}>{r.name}</span>
                        <span style={{ fontSize:10, color:C.rose, marginLeft:"auto" }}>×{loyalty[r.id]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ════════════ EVENING ════════════ */}
        {phase==="evening" && (
          <div className="slide" style={{ maxWidth:530, margin:"0 auto", textAlign:"center" }}>
            <div style={{ fontSize:68, marginBottom:16 }}>🌙</div>
            <h2 style={{ fontFamily:hf, fontSize:30, color:C.roseDk, marginBottom:6 }}>Day {day} Complete</h2>

            {todayEvent && (
              <div style={{ background:"linear-gradient(135deg,#FFF8D0,#FFE8A0)", border:`1px solid ${C.gold}66`, borderRadius:14, padding:"12px 20px", marginBottom:20, fontSize:14, color:"#7A5010" }}>
                {todayEvent.icon} <strong>{todayEvent.name}</strong> — +{todayEvent.repBonus} reputation!
              </div>
            )}

            <div style={cardSt({ padding:"28px 32px", marginBottom:20 })}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:24 }}>
                {[{l:"Earned",v:`$${stats.earned}`,i:"💰",c:C.sage},{l:"Served",v:stats.served,i:"🧶",c:C.rose},{l:"Missed",v:stats.missed,i:"😢",c:stats.missed>2?"#B03030":C.muted}].map(s=>(
                  <div key={s.l}>
                    <div style={{ fontSize:32, marginBottom:6 }}>{s.i}</div>
                    <div style={{ fontFamily:hf, fontSize:24, fontWeight:700, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:".08em", marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:C.cream, borderRadius:12, padding:"14px 18px", fontSize:14, color:C.muted, marginBottom:20, lineHeight:1.6, fontStyle:"italic" }}>
                {stats.missed===0
                  ? "✨ Perfect day — every customer found exactly what they needed!"
                  : stats.served>=stats.missed*2
                    ? "Good work today! A few slipped away — try stocking more variety tomorrow."
                    : "Tricky day. Order a wider range before you open tomorrow."}
              </div>
              <div style={{ display:"flex", justifyContent:"center", gap:36 }}>
                {[{l:"Cash on hand",v:`$${money}`,c:C.sage},{l:"Reputation",v:`${rep}/100`,c:C.gold}].map(s=>(
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>{s.l}</div>
                    <div style={{ fontFamily:hf, fontSize:22, color:s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {rep>=75 && (
              <div style={{ marginBottom:14, background:"#FFF8E0", border:`1px solid ${C.gold}55`, borderRadius:14, padding:"12px 20px", fontSize:13, color:"#7A5010" }}>
                🌟 Your reputation is soaring — the whole town is talking about Woolsworth & Co.!
              </div>
            )}
            {nextUnlocks.length>0 && nextUnlocks[0].unlockRep<=rep+12 && (
              <div style={{ marginBottom:14, background:"rgba(240,235,255,.9)", border:"1px solid rgba(120,100,200,.3)", borderRadius:14, padding:"12px 20px", fontSize:13, color:"#5040A0" }}>
                🎨 Almost there! <strong>{nextUnlocks[0].name} — {nextUnlocks[0].sub}</strong> unlocks at rep {nextUnlocks[0].unlockRep}.
              </div>
            )}
            {(()=>{ const ne=EVENTS_DEF.find(e=>e.days.find(d=>d>day)); const nd=ne?.days.find(d=>d>day); return ne&&nd?(
              <div style={{ marginBottom:14, background:"rgba(255,248,220,.9)", border:`1px solid ${C.gold}44`, borderRadius:14, padding:"12px 20px", fontSize:13, color:"#8A6020" }}>
                {ne.icon} Next event: <strong>{ne.name}</strong> on Day {nd}
              </div>
            ):null; })()}

            <button onClick={nextDay} style={btnSt(`linear-gradient(135deg,${C.rose},${C.roseDk})`, { padding:"14px 40px", fontSize:16, fontFamily:hf, borderRadius:16, boxShadow:"0 6px 20px rgba(130,50,80,.3)" })}>
              Start Day {day+1} →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
