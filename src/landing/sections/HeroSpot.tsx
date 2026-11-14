// The hero's spot: 16 seconds, loops, like a short film with a camera.
//  1. Close on one window at night: a neighbour eats alone, rain on the glass, head down.
//  2. The phone on the table lights up: "Amina, 1st floor, is cooking tajine. 1 seat left." He taps Join and smiles.
//  3. The camera pulls back: the same note lights up five more windows, five more smiles.
//  4. The windows go dark one by one, little figures go down, the long table on the first floor lights up.
//  5. The camera goes in: everyone at one table, Amina brings the tajine, they raise their glasses, one seat
//     stays free ("Reserved for you").  6. End card: the Bite "b" and "Food is better shared."
// SVG driven by a small timeline (requestAnimationFrame); captions are HTML so they are translated.
// Decorative (aria-hidden) with a pause button; with reduced motion it shows the shared table, still.
import { useEffect, useRef, useState } from "react";
import { t as tr } from "../../shared/i18n";

const LOOP = 16;

/* ---------- timeline helpers ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
/** 0 → 1 between a and b (eased) */
const ramp = (t: number, a: number, b: number, f = ease) => f(clamp((t - a) / (b - a)));
/** piecewise keyframes [[time, value], …] */
function keys(t: number, k: [number, number][]) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * ease((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  return k[k.length - 1][1];
}

/* ---------- the people ---------- */
type Look = { skin: string; shirt: string; hair: string; style: "short" | "bun" | "long" | "curly" | "bald" | "cap" };
const LOOKS: Look[] = [
  { skin: "#f1c7a3", shirt: "#5b7fe0", hair: "#3a2a20", style: "short" },
  { skin: "#c48a5f", shirt: "#ee7a59", hair: "#1e1611", style: "bun" },
  { skin: "#f6d6b8", shirt: "#33a383", hair: "#c27c34", style: "long" },
  { skin: "#86563a", shirt: "#ef86ad", hair: "#18110d", style: "curly" },
  { skin: "#e9b892", shirt: "#7a5be0", hair: "#ece6dd", style: "bald" },
  { skin: "#b47a52", shirt: "#f2b13b", hair: "#2a1c12", style: "cap" },
];
const AMINA: Look = { skin: "#a8714b", shirt: "#ffffff", hair: "#1b1410", style: "long" };

function Hair({ look }: { look: Look }) {
  const c = look.hair;
  switch (look.style) {
    case "short": return <path d="M-13 -20c-1-11 6-17 13-17s14 6 13 17c-3-6-8-8-13-8s-10 2-13 8z" fill={c} />;
    case "bun": return <><circle cx="0" cy="-40" r="7" fill={c} /><path d="M-13 -19c-1-11 6-17 13-17s14 6 13 17c-4-7-9-9-13-9s-9 2-13 9z" fill={c} /></>;
    case "long": return <path d="M-14 -18c-1-13 6-19 14-19s15 6 14 19v18h-6v-17c-2-5-5-8-8-8s-6 3-8 8v17h-6z" fill={c} />;
    case "curly": return <g fill={c}>{[[-11, -27], [-5, -33], [3, -34], [10, -29], [13, -21], [-14, -20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6.5" />)}</g>;
    case "bald": return <path d="M-13 -18c0-3 1-5 3-7M13 -18c0-3-1-5-3-7" stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
    case "cap": return <path d="M-13 -22c1-10 6-14 13-14s12 4 13 14zM9 -23h11v4h-11z" fill={c} />;
  }
}

/** a seated person seen from the front; origin = middle of the shoulders.
    mood 0 = sad, 1 = happy; down = head bowed; arm = right arm raised (toast); blink = eyes shut */
function Person({ look, mood, down = 0, arm = 0, blink = false, glass = false }: { look: Look; mood: number; down?: number; arm?: number; blink?: boolean; glass?: boolean }) {
  const hy = down * 4;
  const happy = mood > 0.5;
  const curve = -4 + mood * 10;
  const ax = 22 - arm * 4, ay = 26 - arm * 44;
  return (
    <g>
      <path d="M-20 34v-18c0-11 9-17 20-17s20 6 20 17v18z" fill={look.shirt} />
      <path d={`M14 6Q${18 + arm * 6} ${16 - arm * 20} ${ax} ${ay}`} stroke={look.shirt} strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx={ax} cy={ay} r="4.6" fill={look.skin} />
      {glass && arm > 0.05 && <g transform={`translate(${ax} ${ay - 10})`}><path d="M-4 -8h8l-1 7a3 3 0 0 1-6 0z" fill="rgba(255,255,255,0.85)" /><path d="M-3.4 -5h6.8l-.6 4a2.6 2.6 0 0 1-5.6 0z" fill="#c2365f" /><path d="M0 2v5M-3 7h6" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" /></g>}
      <g transform={`translate(0 ${hy})`}>
        <rect x="-4.5" y="-8" width="9" height="8" fill={look.skin} />
        <circle cx="0" cy="-20" r="14" fill={look.skin} />
        <Hair look={look} />
        <path d={`M-9 -26.5l6 ${-(1 - mood) * 2.6 - 0.4}M9 -26.5l-6 ${-(1 - mood) * 2.6 - 0.4}`} stroke="#2a1a3a" strokeWidth="1.6" strokeLinecap="round" opacity={0.75} />
        {blink ? <path d="M-8 -20h4M4 -20h4" stroke="#2a1a3a" strokeWidth="1.8" strokeLinecap="round" />
          : happy ? <path d="M-8.5 -19q2.5-3.5 5 0M3.5 -19q2.5-3.5 5 0" stroke="#2a1a3a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          : <><circle cx="-5.5" cy="-19.5" r="1.7" fill="#2a1a3a" /><circle cx="5.5" cy="-19.5" r="1.7" fill="#2a1a3a" /></>}
        {mood > 0.6 && <><circle cx="-9" cy="-13" r="2.6" fill="#ff8fa8" opacity=".45" /><circle cx="9" cy="-13" r="2.6" fill="#ff8fa8" opacity=".45" /></>}
        <path d={`M-5 -10q5 ${curve} 10 0`} stroke="#2a1a3a" strokeWidth="1.8" strokeLinecap="round" fill={mood > 0.8 ? "#7a2340" : "none"} />
      </g>
    </g>
  );
}

/* ---------- the building ---------- */
const W = 116, H = 104;
const COLX = [70, 202, 334];
const WINDOWS = [
  { id: "A", c: 0, y: 110, look: 0, ping: 3.5, leave: 7.6 },
  { id: "B", c: 2, y: 110, look: 1, ping: 5.5, leave: 7.85 },
  { id: "C", c: 0, y: 240, look: 2, ping: 5.8, leave: 8.1 },
  { id: "D", c: 1, y: 240, look: 3, ping: 6.1, leave: 8.35 },
  { id: "E", c: 0, y: 560, look: 4, ping: 6.4, leave: 8.6 },
  { id: "F", c: 2, y: 560, look: 5, ping: 6.7, leave: 8.85 },
];
type Win = (typeof WINDOWS)[number];
const HALL = { x: 60, y: 372, w: 400, h: 150 };
const SEATX = [104, 156, 208, 312, 364, 416];
const FREE = 260;

function Window({ w, t }: { w: Win; t: number }) {
  const x = COLX[w.c];
  const pinged = t >= w.ping;
  const mood = ramp(t, w.ping + 0.9, w.ping + 1.4);
  const gone = ramp(t, w.leave, w.leave + 0.45);
  const light = 1 - ramp(t, w.leave + 0.1, w.leave + 0.6);
  const glow = pinged && t < w.leave ? 0.6 + 0.4 * Math.sin((t - w.ping) * 9) : 0;
  const down = (1 - mood) * (0.6 + 0.4 * Math.sin(t * 1.3 + w.c));
  const blink = ((t * 10 + w.c * 7) % 37) < 1.2;
  const ping = ramp(t, w.ping, w.ping + 0.35, back) * (1 - ramp(t, w.ping + 1.6, w.ping + 1.9));
  return (
    <g transform={`translate(${x} ${w.y})`}>
      <rect width={W} height={H} rx="4" fill="#180d30" />
      <g opacity={light}>
        <rect width={W} height={H} rx="4" fill="url(#hs-room)" />
        <path d={`M${W / 2} 0v14`} stroke="#ffffff55" strokeWidth="1.2" />
        <path d={`M${W / 2 - 10} 24a10 10 0 0 1 20 0z`} fill="#f4e9ff" />
        <ellipse cx={W / 2} cy="56" rx="44" ry="34" fill="url(#hs-lamp)" />
        <g opacity={1 - gone} transform={`translate(${44 + gone * 18} 70)`}><Person look={LOOKS[w.look]} mood={mood} down={down} blink={blink} /></g>
        <path d={`M8 ${H - 14}h${W - 16}`} stroke="#efe6ff" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="46" cy={H - 17} rx="13" ry="3.4" fill="#fff" opacity={1 - gone} />
        <rect x="80" y={H - 25} width="9" height="14" rx="2" fill={glow ? `rgba(255,255,255,${0.5 + glow / 2})` : "#2a1a3a"} style={glow ? { filter: "drop-shadow(0 0 6px #fff)" } : undefined} opacity={1 - gone} />
        <path d={`M0 0h16c-6 30-4 70 4 ${H}h-20z`} fill="#4b2e8a" opacity=".85" />
        <path d={`M${W} 0h-16c6 30 4 70-4 ${H}h20z`} fill="#4b2e8a" opacity=".85" />
        {w.id === "A" && <g stroke="rgba(220,230,255,0.45)" strokeWidth="1.1" strokeLinecap="round">
          {Array.from({ length: 14 }, (_, i) => { const yy = 4 + ((t * 70 + i * 37) % (H - 22)); const xx = 10 + ((i * 53) % (W - 20)); return <path key={i} d={`M${xx} ${yy}l-2 9`} />; })}
        </g>}
      </g>
      <rect width={W} height={H} rx="4" fill="none" stroke="#120824" strokeWidth="7" />
      <path d={`M${W / 2} 0v${H}`} stroke="#120824" strokeWidth="4" opacity=".6" />
      <rect x="-8" y={H + 2} width={W + 16} height="8" rx="3" fill="#3e2780" />
      {ping > 0.01 && <g transform={`translate(${W - 6} -4) scale(${ping})`}>
        <circle r="17" fill="#ff5a8a" />
        <circle r="17" fill="none" stroke="#ff5a8a" strokeWidth="3" opacity={1 - ((t - w.ping) % 0.8) / 0.8} transform={`scale(${1 + ((t - w.ping) % 0.8)})`} />
        <path d="M-6 4h12l-2.4-3.4v-5a3.6 3.6 0 0 0-7.2 0v5zM-1.8 6.2a1.8 1.8 0 0 0 3.6 0" fill="#fff" />
      </g>}
    </g>
  );
}

function DarkWindow({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={W} height={H} rx="4" fill="#180d30" stroke="#120824" strokeWidth="7" />
      <path d={`M${W / 2} 0v${H}`} stroke="#120824" strokeWidth="4" opacity=".6" />
      <path d="M72 94v-16h14v16z" fill="#6b4a8a" /><circle cx="74" cy="72" r="7" fill="#4caf7a" /><circle cx="84" cy="69" r="7" fill="#3d9a68" />
      <rect x="-8" y={H + 2} width={W + 16} height="8" rx="3" fill="#3e2780" />
    </g>
  );
}

/** a small figure walking from a window to the hall */
function Walker({ w, t }: { w: Win; t: number }) {
  const p = ramp(t, w.leave + 0.3, w.leave + 1.6, (x) => x);
  if (p <= 0 || p >= 1) return null;
  const sx = COLX[w.c] + W / 2, sy = w.y + H + 6;
  const above = w.y < HALL.y;
  const ex = SEATX[WINDOWS.indexOf(w)], ey = above ? HALL.y - 4 : HALL.y + HALL.h + 4;
  const x = sx + (ex - sx) * p + Math.sin(p * Math.PI) * (w.c === 1 ? 24 : w.c === 0 ? -22 : 22);
  const y = sy + (ey - sy) * p;
  const step = Math.sin(p * 30);
  const look = LOOKS[w.look];
  return (
    <g transform={`translate(${x} ${y - Math.abs(step) * 2}) scale(.42)`}>
      <circle cy="-30" r="11" fill={look.skin} />
      <rect x="-12" y="-18" width="24" height="22" rx="6" fill={look.shirt} />
      <path d={`M-6 4l${step * 6} 14M6 4l${-step * 6} 14`} stroke="#2a1a3a" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Hall({ t }: { t: number }) {
  const light = ramp(t, 8.6, 9.5);
  const toast = ramp(t, 11.3, 11.8) * (1 - ramp(t, 12.9, 13.4));
  const amina = ramp(t, 9.6, 10.6);
  const potIn = ramp(t, 10.5, 10.9, back);
  const free = ramp(t, 12.4, 12.8);
  return (
    <g>
      <rect x={HALL.x - 7} y={HALL.y - 7} width={HALL.w + 14} height={HALL.h + 14} rx="9" fill="#120824" />
      <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" fill="#180d30" />
      <g clipPath="url(#hs-hallclip)" opacity={light}>
        <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} fill="url(#hs-warm)" />
        <path d={`M${HALL.x} ${HALL.y + 12}q50 18 100 0t100 0t100 0t100 0`} fill="none" stroke="#6a4424" strokeWidth="1.3" />
        {Array.from({ length: 14 }, (_, n) => {
          const bx = HALL.x + 14 + n * 28.5, by = HALL.y + 19 + Math.sin((n / 13) * Math.PI * 8) * 3;
          return <circle key={n} cx={bx} cy={by} r="3.6" fill="#fff4c2" opacity={0.6 + 0.4 * Math.sin(t * 4 + n)} style={{ filter: "drop-shadow(0 0 4px #ffe08a)" }} />;
        })}
        <rect x="236" y={HALL.y + 32} width="48" height="34" rx="3" fill="#ffecc8" stroke="#d99a55" strokeWidth="2" />
        <path d={`M240 ${HALL.y + 62}l12-14 9 9 6-6 13 11z`} fill="#e9a25d" />
        {/* the free seat, kept for you */}
        <rect x={FREE - 18} y={HALL.y + 72} width="36" height="52" rx="8" fill="none" stroke="#ff5a8a" strokeWidth="2.6" strokeDasharray="6 5" opacity={free} />
        {SEATX.map((sx, i) => {
          const s = ramp(t, 9.0 + i * 0.16, 9.5 + i * 0.16, back);
          return (
            <g key={i} transform={`translate(${sx} ${HALL.y + 96 + (1 - s) * 14}) scale(${0.95 * Math.max(0.01, s)})`} opacity={clamp(s)}>
              <Person look={LOOKS[i]} mood={1} arm={toast * (i % 2 ? 1 : 0.85)} glass blink={((t * 10 + i * 5) % 41) < 1.2} />
            </g>
          );
        })}
        {/* Amina brings the tajine */}
        <g transform={`translate(${500 - amina * 60} ${HALL.y + 92})`} opacity={amina > 0 && t < 10.9 ? 1 : 0}>
          <Person look={AMINA} mood={1} />
        </g>
        <rect x={HALL.x + 14} y={HALL.y + 122} width={HALL.w - 28} height="14" rx="4" fill="#fffaf2" />
        <rect x={HALL.x + 14} y={HALL.y + 134} width={HALL.w - 28} height="16" fill="#f3d9b5" />
        {SEATX.map((sx, i) => <ellipse key={i} cx={sx} cy={HALL.y + 123} rx="15" ry="4.5" fill="#fff" stroke="#e5c69c" opacity={ramp(t, 9.4 + i * 0.1, 9.7 + i * 0.1)} />)}
        <g transform={`translate(${FREE} ${HALL.y + 118}) scale(${potIn})`}>
          <ellipse cx="0" cy="4" rx="26" ry="6" fill="#b5532f" />
          <path d="M-20 3c2-20 10-34 20-38c10 4 18 18 20 38z" fill="#d9663a" />
          <circle cx="0" cy="-36" r="4" fill="#b5532f" />
          {potIn > 0.9 && [-8, 0, 8].map((dx, i) => <path key={i} d={`M${dx} -44c-4-6 4-9 0-15`} stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" strokeLinecap="round" opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))} transform={`translate(0 ${-((t * 8 + i * 4) % 8)})`} />)}
        </g>
        {toast > 0.9 && t > 11.8 && t < 12.6 && <g transform={`translate(260 ${HALL.y + 44})`} opacity={1 - ramp(t, 12.1, 12.6)}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} d="M0 -10v-10" stroke="#fff6c8" strokeWidth="3" strokeLinecap="round" transform={`rotate(${a}) scale(${0.6 + ramp(t, 11.8, 12.3)})`} />)}
        </g>}
      </g>
    </g>
  );
}

/* ---------- the film ---------- */
function useClock(paused: boolean, still: boolean) {
  const [t, setT] = useState(still ? 12.6 : 0);
  const base = useRef(0);
  const now = useRef(0);
  useEffect(() => {
    if (still || paused) return;
    base.current = performance.now() - now.current * 1000;
    let raf = 0;
    const tick = (ms: number) => { const v = ((ms - base.current) / 1000) % LOOP; now.current = v; setT(v); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, still]);
  return t;
}

export function HeroSpot() {
  const [still] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [paused, setPaused] = useState(false);
  const t = useClock(paused, still);

  // the camera: where it looks and how close, over time
  const cx = keys(t, [[0, 128], [4.4, 128], [5.6, 270], [7.2, 300], [9.6, 300], [10.8, 260], [14.0, 260], [15.0, 300]]);
  const cy = keys(t, [[0, 165], [4.4, 168], [5.6, 260], [7.2, 410], [9.6, 410], [10.8, 448], [14.0, 448], [15.0, 410]]);
  const cz = keys(t, [[0, 3.5], [3.4, 3.7], [4.4, 3.4], [5.6, 1.7], [7.2, 1.0], [9.6, 1.0], [10.8, 2.0], [13.6, 2.15], [15.0, 1.0]]);
  const fade = still ? 0 : Math.max(1 - ramp(t, 0, 0.6), ramp(t, 15.5, 16));
  const cap = (a: number, b: number) => ramp(t, a, a + 0.4) * (1 - ramp(t, b - 0.4, b));
  const join = t > 4.55;

  return (
    <div className="hs2">
      <svg viewBox="0 0 600 750" className="hs2-svg" aria-hidden>
        <defs>
          <linearGradient id="hs-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d86d8" /><stop offset="1" stopColor="#4a4ea3" /></linearGradient>
          <radialGradient id="hs-lamp"><stop offset="0" stopColor="rgba(255,240,200,0.35)" /><stop offset="1" stopColor="rgba(255,240,200,0)" /></radialGradient>
          <linearGradient id="hs-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd690" /><stop offset="1" stopColor="#ffab55" /></linearGradient>
          <radialGradient id="hs-sky" cx="0.8" cy="0.05" r="1"><stop offset="0" stopColor="#40287f" /><stop offset=".5" stopColor="#24134c" /><stop offset="1" stopColor="#150a2e" /></radialGradient>
          <clipPath id="hs-hallclip"><rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" /></clipPath>
        </defs>
        <rect width="600" height="750" fill="url(#hs-sky)" />
        <g transform={`translate(300 375) scale(${cz}) translate(${-cx} ${-cy})`}>
          {[[540, 230], [575, 330], [20, 40], [555, 470], [590, 160], [30, 300]].map(([x, y], n) => <circle key={n} cx={x} cy={y} r="1.8" fill="#fff" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 1.4 + n))} />)}
          <circle cx="530" cy="96" r="44" fill="#f3eeff" style={{ filter: "drop-shadow(0 0 20px rgba(230,220,255,0.55))" }} />
          {[[566, 76, 11], [572, 96, 10], [565, 116, 9]].map(([x, y, r], n) => <circle key={n} cx={x} cy={y} r={r} fill="#2c1960" />)}
          <rect x="50" y="76" width="420" height="700" rx="10" fill="#2b1a57" />
          <rect x="40" y="62" width="440" height="22" rx="7" fill="#3c2575" />
          <g stroke="rgba(255,255,255,0.04)">{Array.from({ length: 30 }, (_, n) => <path key={n} d={`M50 ${100 + n * 22}h420`} />)}</g>
          <DarkWindow x={COLX[1]} y={110} />
          <DarkWindow x={COLX[2]} y={240} />
          <Hall t={t} />
          {WINDOWS.map((w) => <Window key={w.id} w={w} t={t} />)}
          {WINDOWS.map((w) => <Walker key={`k${w.id}`} w={w} t={t} />)}
          <path d="M228 780v-120a32 32 0 0 1 64 0v120z" fill="#5b35a8" stroke="#120824" strokeWidth="6" />
          <circle cx="281" cy="722" r="3.4" fill="#ffd98f" />
        </g>
        <rect width="600" height="750" fill="#150a2e" opacity={fade} />
      </svg>

      <div aria-hidden style={{ display: "contents" }}>
      <p className="hs2-cap top" style={{ opacity: still ? 0 : cap(0.6, 3.4) }}>{tr("Another dinner alone.")}</p>
      <div className="hs2-note" style={{ opacity: still ? 0 : cap(3.6, 5.3), transform: `translate(-50%, ${(1 - ramp(t, 3.6, 4.0, back)) * 30}px) scale(${0.94 + 0.06 * ramp(t, 3.6, 4.0, back)})` }}>
        <span className="hs2-note-app"><i />Bite</span>
        <strong>{tr("Amina, 1st floor, is cooking tajine tonight")}</strong>
        <span className="hs2-note-sub">{tr("1 seat left. Want to join?")}</span>
        <span className={`hs2-join ${join ? "on" : ""}`}>{join ? tr("You're in!") : tr("Join")}</span>
        <span className="hs2-tap" style={{ opacity: ramp(t, 4.3, 4.45) * (1 - ramp(t, 4.6, 4.9)), transform: `scale(${0.6 + ramp(t, 4.4, 4.7)})` }} />
      </div>
      <p className="hs2-cap top" style={{ opacity: still ? 0 : cap(5.6, 7.5) }}>{tr("Your neighbours got it too.")}</p>
      <p className="hs2-cap bottom" style={{ opacity: still ? 1 : cap(10.0, 12.4) }}>{tr("Nobody eats alone tonight.")}</p>
      <div className="hs2-reserved" style={{ opacity: still ? 0 : cap(12.5, 14.0), transform: `translate(-50%, 0) rotate(-4deg) scale(${0.6 + 0.4 * ramp(t, 12.5, 12.9, back)})` }}>{tr("Reserved for you")}</div>
      <div className="hs2-end" style={{ opacity: still ? 0 : cap(14.2, 15.8) }}>
        <svg viewBox="0 0 549 549" width="64" height="64"><rect x="107" y="30" width="83" height="330" rx="41.5" fill="#fff" /><circle cx="285" cy="340" r="178" fill="#fff" /><path d="M190 405q72 62 144 0" fill="none" stroke="#6b21d9" strokeWidth="26" strokeLinecap="round" /></svg>
        <p>{tr("Food is better shared.")}</p>
      </div>
      </div>
      {!still && <button type="button" className="hs2-play" onClick={() => setPaused((p) => !p)} aria-label={paused ? tr("Play the film") : tr("Pause the film")}>
        {paused ? <svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" /></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" /></svg>}
      </button>}
    </div>
  );
}
