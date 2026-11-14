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

const SLOW = 1.4;              // the story is written in 16 "beats"; it plays 1.4× slower
const BEATS = 18;               // 16 beats of story + a 2-beat hold on the phone when the note arrives
const LOOP = BEATS * SLOW;
const HOLD_AT = 3.6, HOLD = 2;

/* ---------- timeline helpers ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x: number) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
/** 0 → 1 between a and b (eased) */
const ramp = (t: number, a: number, b: number, f = ease) => f(clamp((t - a) / (b - a)));
/** piecewise keyframes [[time, value], …] */
const sine = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
function keys(t: number, k: [number, number][], f = ease) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * f((t - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
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
  // the light goes off like a real switch: a flicker, then dark
  const off = ramp(t, w.leave + 0.1, w.leave + 0.6, (x) => x);
  const light = off <= 0 ? 1 : off >= 1 ? 0 : (1 - off) * (off < 0.35 ? (Math.sin(off * 90) > 0 ? 1 : 0.35) : 1);
  const breath = 1 + Math.sin(t * 2.4 + w.c * 1.7) * 0.014;
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
        {/* the phone's light on the face, until the note makes them smile */}
        {pinged && t < w.leave && <path d={`M84 ${H - 20}L30 46Q40 30 60 34z`} fill="url(#hs-phonelight)" opacity={0.3 * glow * (1 - mood * 0.6)} />}
        <g opacity={1 - gone} transform={`translate(${44 + gone * 18} ${70 + Math.sin(t * 1.6 + w.c) * 0.8}) scale(1 ${breath})`}><Person look={LOOKS[w.look]} mood={mood} down={down} blink={blink} /></g>
        <path d={`M8 ${H - 14}h${W - 16}`} stroke="#efe6ff" strokeWidth="5" strokeLinecap="round" />
        <g opacity={1 - gone}><ellipse cx="46" cy={H - 17} rx="13" ry="3.4" fill="#fff" /><ellipse cx="46" cy={H - 18} rx="7" ry="2" fill={["#e0a050", "#c9553a", "#7fb069", "#e8c547", "#d98a4e", "#b5563a"][w.look]} /></g>
        <g opacity={1 - gone}>
          <rect x="80" y={H - 25} width="9" height="14" rx="1.6" fill="#1d1230" />
          {pinged && t < w.leave ? <g style={{ filter: `drop-shadow(0 0 ${2 + glow * 3}px rgba(255,255,255,0.8))` }}>
            <rect x="80.7" y={H - 24.2} width="7.6" height="12.4" rx="1.1" fill="#f4efff" />
            <rect x="81.4" y={H - 22.6} width="6.2" height="3.2" rx=".7" fill="#6b21d9" />
            <rect x="82" y={H - 21.6} width="1.2" height="1.2" rx=".3" fill="#fff" />
            <path d={`M81.6 ${H - 18}h5.6M81.6 ${H - 16.8}h4`} stroke="#160a2e" strokeWidth=".5" />
            <rect x="83.2" y={H - 15.2} width="3.6" height="1.6" rx=".8" fill={t > 4.05 && w.id === "A" ? "#0a8f5a" : "#6b21d9"} />
          </g> : <rect x="80.7" y={H - 24.2} width="7.6" height="12.4" rx="1.1" fill="#2a1a3a" />}
        </g>
        <path d={`M0 0h16c-6 30-4 70 4 ${H}h-20z`} fill="#4b2e8a" opacity=".85" />
        <path d={`M${W} 0h-16c6 30 4 70-4 ${H}h20z`} fill="#4b2e8a" opacity=".85" />
        {w.id === "A" && <g stroke="rgba(220,230,255,0.45)" strokeWidth="1.1" strokeLinecap="round">
          {Array.from({ length: 14 }, (_, i) => { const yy = 4 + ((t * 70 + i * 37) % (H - 22)); const xx = 10 + ((i * 53) % (W - 20)); return <path key={i} d={`M${xx} ${yy}l-2 9`} />; })}
        </g>}
      </g>
      <rect width={W} height={H} rx="4" fill="url(#hs-sheen)" />
      <rect width={W} height={H} rx="4" fill="none" stroke="#120824" strokeWidth="7" />
      <path d={`M${W / 2} 0v${H}`} stroke="#120824" strokeWidth="4" opacity=".6" />
      <rect x="-8" y={H + 2} width={W + 16} height="8" rx="3" fill="#3e2780" />
      <path d={`M-8 ${H + 10}h${W + 16}`} stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
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
      <ellipse cx={HALL.x + HALL.w / 2} cy={HALL.y + HALL.h / 2} rx={HALL.w * 0.75} ry={HALL.h * 1.3} fill="url(#hs-spill)" opacity={light} />
      <rect x={HALL.x - 7} y={HALL.y - 7} width={HALL.w + 14} height={HALL.h + 14} rx="9" fill="#120824" />
      <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" fill="#180d30" />
      <g clipPath="url(#hs-hallclip)" opacity={light}>
        <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} fill="url(#hs-warm)" />
        <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} fill="url(#hs-sheen)" />
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
            <g key={i} transform={`translate(${sx} ${HALL.y + 96 + (1 - s) * 14 - Math.max(0, Math.sin(t * 7 + i)) * toast * 2}) scale(${0.95 * Math.max(0.01, s)} ${0.95 * Math.max(0.01, s) * (1 + Math.sin(t * 2.6 + i) * 0.012)})`} opacity={clamp(s)}>
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
function useClock(paused: boolean, still: boolean, box: React.RefObject<HTMLDivElement | null>) {
  const [t, setT] = useState(still ? 12.6 : 0);
  const base = useRef(0);
  const now = useRef(0);
  // the film starts only once it is on screen, and not before the page has finished loading
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(() => typeof document !== "undefined" && document.readyState === "complete");
  useEffect(() => {
    if (loaded) return;
    const on = () => setLoaded(true);
    window.addEventListener("load", on, { once: true });
    return () => window.removeEventListener("load", on);
  }, [loaded]);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > 0);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, [box]);
  useEffect(() => {
    if (still || paused || !visible || !loaded) return;
    base.current = performance.now() - now.current * 1000;
    let raf = 0, last = 0;
    // 60 frames a second on computers, 30 on phones (half the work, and it still reads as smooth there)
    const gap = window.matchMedia("(max-width: 640px)").matches ? 32 : 15;
    const tick = (ms: number) => { if (ms - last > gap) { last = ms; const v = ((ms - base.current) / 1000) % LOOP; now.current = v; setT(v); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, still, visible, loaded]);
  return t;
}

export function HeroSpot() {
  const [still] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const [paused, setPaused] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const r = useClock(paused, still, box) / (still ? 1 : SLOW);        // film time (beats)
  // story time: frozen while the camera holds on the phone, so the note gets its moment
  const t = still ? r : r < HOLD_AT ? r : r < HOLD_AT + HOLD ? HOLD_AT : r - HOLD;

  // the camera: where it looks and how close, over time
  const cx = keys(r, [[0, 128], [3.6, 128], [4.3, 154], [5.7, 154], [6.4, 128], [6.5, 128], [7.6, 270], [9.2, 300], [11.6, 300], [12.8, 260], [16.0, 260], [17.0, 300]], sine);
  const cy = keys(r, [[0, 165], [3.6, 168], [4.3, 196], [5.7, 196], [6.4, 168], [6.5, 168], [7.6, 260], [9.2, 410], [11.6, 410], [12.8, 448], [16.0, 448], [17.0, 410]], sine);
  const cz = keys(r, [[0, 3.5], [3.4, 3.7], [4.3, 8.2], [5.7, 8.6], [6.4, 3.4], [6.5, 3.4], [7.6, 1.7], [9.2, 1.0], [11.6, 1.0], [12.8, 2.0], [15.6, 2.15], [17.0, 1.0]], sine);
  const fade = still ? 0 : Math.max(1 - ramp(r, 0, 0.6), ramp(r, 17.5, 18));
  // a hand-held camera: a breath of drift, never still
  const hx = still ? 0 : Math.sin(r * 0.9) * 1.6 + Math.sin(r * 2.3) * 0.5, hy = still ? 0 : Math.cos(r * 0.7) * 1.2;
  // it rains while everyone eats alone, and stops when the table fills up
  const rain = still ? 0 : 1 - ramp(t, 7.4, 9.6);
  const cap = (a: number, b: number) => ramp(t, a, a + 0.4) * (1 - ramp(t, b - 0.4, b));
  const capR = (a: number, b: number) => ramp(r, a, a + 0.4) * (1 - ramp(r, b - 0.4, b));
  const join = r > 5.05;

  return (
    <div className="hs2" ref={box}>
      <svg viewBox="0 0 600 750" className="hs2-svg" aria-hidden>
        <defs>
          <linearGradient id="hs-room" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7d86d8" /><stop offset="1" stopColor="#4a4ea3" /></linearGradient>
          <linearGradient id="hs-phonelight" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor="rgba(207,230,255,0.9)" /><stop offset="1" stopColor="rgba(207,230,255,0)" /></linearGradient>
          <radialGradient id="hs-lamp"><stop offset="0" stopColor="rgba(255,240,200,0.35)" /><stop offset="1" stopColor="rgba(255,240,200,0)" /></radialGradient>
          <linearGradient id="hs-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd690" /><stop offset="1" stopColor="#ffab55" /></linearGradient>
          <radialGradient id="hs-sky" cx="0.8" cy="0.05" r="1"><stop offset="0" stopColor="#40287f" /><stop offset=".5" stopColor="#24134c" /><stop offset="1" stopColor="#150a2e" /></radialGradient>
          <mask id="hs-bite"><rect x="400" y="0" width="200" height="220" fill="#fff" />{[[572, 74, 12], [578, 96, 11], [571, 118, 10]].map(([x, y, r], n) => <circle key={n} cx={x} cy={y} r={r} fill="#000" />)}</mask>
          <radialGradient id="hs-moonglow"><stop offset=".55" stopColor="rgba(230,220,255,0.35)" /><stop offset="1" stopColor="rgba(230,220,255,0)" /></radialGradient>
          <radialGradient id="hs-lampglow"><stop offset="0" stopColor="rgba(255,226,150,0.45)" /><stop offset="1" stopColor="rgba(255,226,150,0)" /></radialGradient>
          <radialGradient id="hs-spill"><stop offset="0" stopColor="rgba(255,190,110,0.55)" /><stop offset="1" stopColor="rgba(255,190,110,0)" /></radialGradient>
          <linearGradient id="hs-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".35" stopColor="rgba(255,255,255,0)" /><stop offset=".5" stopColor="rgba(255,255,255,0.13)" /><stop offset=".62" stopColor="rgba(255,255,255,0)" /></linearGradient>
          <clipPath id="hs-hallclip"><rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" /></clipPath>
        </defs>
        <rect width="600" height="750" fill="url(#hs-sky)" />
        <g transform={`translate(300 375) scale(${cz}) translate(${-cx - hx} ${-cy - hy})`}>
          {[[540, 230], [575, 330], [20, 40], [555, 470], [590, 160], [30, 300]].map(([x, y], n) => <circle key={n} cx={x} cy={y} r="1.8" fill="#fff" opacity={0.3 + 0.7 * Math.abs(Math.sin(t * 1.4 + n))} />)}
          <circle cx="530" cy="96" r="70" fill="url(#hs-moonglow)" />
          <circle cx="530" cy="96" r="44" fill="#f3eeff" mask="url(#hs-bite)" />
          <circle cx="516" cy="86" r="6" fill="#e2d9f7" mask="url(#hs-bite)" /><circle cx="534" cy="112" r="4" fill="#e2d9f7" /><circle cx="510" cy="110" r="3" fill="#e2d9f7" />
          {/* clouds drifting past the moon */}
          {[[0, 70, 1], [1, 128, 0.7]].map(([n, y, sc]) => { const x = 380 + ((t * (n ? 9 : 6) + n * 140) % 320); return <g key={n} transform={`translate(${x} ${y}) scale(${sc})`} opacity={0.5}><ellipse cx="0" cy="0" rx="34" ry="11" fill="#3a2575" /><ellipse cx="18" cy="-8" rx="20" ry="11" fill="#3a2575" /><ellipse cx="-14" cy="-5" rx="16" ry="9" fill="#3a2575" /></g>; })}
          {/* smoke from the chimney */}
          {[0, 1, 2, 3].map((n) => { const k = ((t * 0.55 + n / 4) % 1); return <circle key={`sm${n}`} cx={109 + Math.sin(k * 6 + n) * 6 + k * 16} cy={26 - k * 70} r={5 + k * 12} fill="#c9b8ef" opacity={(1 - k) * 0.22} />; })}
          <rect x="50" y="76" width="420" height="700" rx="10" fill="#2b1a57" />
          <rect x="40" y="62" width="440" height="22" rx="7" fill="#3c2575" />
          <rect x="96" y="30" width="26" height="36" rx="3" fill="#3c2575" /><path d="M400 62v-34M392 34h16M396 44h8" stroke="#3c2575" strokeWidth="3" strokeLinecap="round" />
          <g stroke="rgba(255,255,255,0.04)">{Array.from({ length: 30 }, (_, n) => <path key={n} d={`M50 ${100 + n * 22}h420`} />)}</g>
          <DarkWindow x={COLX[1]} y={110} />
          <DarkWindow x={COLX[2]} y={240} />
          {/* stairwell lights: they come on as the neighbours go down */}
          {WINDOWS.map((w) => { const on = ramp(t, w.leave + 0.25, w.leave + 0.45) * (1 - ramp(t, w.leave + 1.7, w.leave + 2.1)); const sx = w.c === 2 ? COLX[2] - 11 : COLX[w.c] + W + 5; return <g key={`st${w.id}`}><rect x={sx} y={w.y + 30} width="8" height="26" rx="2" fill="#150a2e" /><rect x={sx} y={w.y + 30} width="8" height="26" rx="2" fill="#ffd690" opacity={on} style={{ filter: on > 0.1 ? "drop-shadow(0 0 6px #ffcf7a)" : undefined }} /></g>; })}
          <Hall t={t} />
          {WINDOWS.map((w) => <Window key={w.id} w={w} t={t} />)}
          {WINDOWS.map((w) => <Walker key={`k${w.id}`} w={w} t={t} />)}
          <rect x="-200" y="742" width="1000" height="60" fill="#120a26" />
          <g transform="translate(505 742)"><path d="M0 0v-120q0-14 14-14h10" stroke="#3b2a66" strokeWidth="5" fill="none" /><path d="M18 -138h20l-4 9h-12z" fill="#3b2a66" /><ellipse cx="28" cy="-112" rx="38" ry="46" fill="url(#hs-lampglow)" /><circle cx="28" cy="-127" r="4" fill="#ffe7a8" /></g>
          <g transform="translate(14 742)"><path d="M0 0v-36" stroke="#2a1d14" strokeWidth="5" /><circle cy="-52" r="24" fill="#2f5d4a" /><circle cx="-12" cy="-40" r="16" fill="#2a5242" /><circle cx="12" cy="-40" r="16" fill="#336a52" /></g>
          <path d="M228 780v-120a32 32 0 0 1 64 0v120z" fill="#5b35a8" stroke="#120824" strokeWidth="6" />
          <circle cx="281" cy="722" r="3.4" fill="#ffd98f" />
        </g>
        {/* rain, in front of everything (screen space, so it stays put while the camera moves) */}
        {rain > 0.01 && <g stroke="rgba(214,224,255,0.55)" strokeWidth="1.4" strokeLinecap="round" opacity={rain}>
          {Array.from({ length: 34 }, (_, i) => { const x = (i * 97) % 640 - 20; const y = ((t * 520 + i * 211) % 820) - 60; return <path key={i} d={`M${x} ${y}l-7 ${18 + (i % 3) * 6}`} opacity={0.35 + (i % 4) * 0.15} />; })}
        </g>}
        <rect width="600" height="750" fill="#150a2e" opacity={fade} />
      </svg>

      <div aria-hidden style={{ display: "contents" }}>
      <p className="hs2-cap top" style={{ opacity: still ? 0 : capR(0.6, 3.4) }}>{tr("Another dinner alone.")}</p>
      <div className="hs2-note" style={{ opacity: still ? 0 : capR(4.0, 6.2), transform: `translate(-50%, ${(1 - ramp(r, 4.0, 4.45, back)) * 40}px) scale(${0.9 + 0.1 * ramp(r, 4.0, 4.45, back)}) rotate(${Math.sin(Math.max(0, r - 4.0) * 40) * 2 * (1 - ramp(r, 4.0, 4.6))}deg)` }}>
        <span className="hs2-note-app"><i />Bite</span>
        <strong>{tr("Amina, 1st floor, is cooking tajine tonight")}</strong>
        <span className="hs2-note-sub">{tr("1 seat left. Want to join?")}</span>
        <span className={`hs2-join ${join ? "on" : ""}`}>{join ? tr("You're in!") : tr("Join")}</span>
        <span className="hs2-tap" style={{ opacity: ramp(r, 4.8, 4.95) * (1 - ramp(r, 5.1, 5.4)), transform: `scale(${0.6 + ramp(r, 4.9, 5.2)})` }} />
      </div>
      <p className="hs2-cap top" style={{ opacity: still ? 0 : cap(5.6, 7.5) }}>{tr("Your neighbours got it too.")}</p>
      <p className="hs2-cap bottom" style={{ opacity: still ? 1 : cap(10.0, 12.4) }}>{tr("Nobody eats alone tonight.")}</p>
      <div className="hs2-reserved" style={{ opacity: still ? 0 : cap(12.5, 14.0), transform: `translate(-50%, 0) rotate(-4deg) scale(${0.6 + 0.4 * ramp(t, 12.5, 12.9, back)})` }}>{tr("Reserved for you")}</div>
      <div className="hs2-end" style={{ opacity: still ? 0 : capR(16.2, 17.8) }}>
        <svg viewBox="0 0 549 549" width="64" height="64" style={{ overflow: "visible" }}>
          <defs><mask id="hs-endbite" maskUnits="userSpaceOnUse" x="-100" y="-100" width="749" height="749"><rect x="-100" y="-100" width="749" height="749" fill="#fff" />
            {[[405, 198, 20], [434, 228, 22], [456, 267, 22], [469, 311, 20]].map(([x, y, rr], n) => <circle key={n} cx={x} cy={y} r={rr * 1.25 * ramp(r, 16.75 + n * 0.05, 16.95 + n * 0.05, back)} fill="#000" />)}</mask></defs>
          <g mask="url(#hs-endbite)" transform={`rotate(${Math.sin(Math.max(0, r - 16.8) * 30) * 4 * (1 - ramp(r, 16.8, 17.2))} 285 340)`}><rect x="107" y="30" width="83" height="330" rx="41.5" fill="#fff" /><circle cx="285" cy="340" r="178" fill="#fff" /></g>
          <path d="M190 405q72 62 144 0" fill="none" stroke="#6b21d9" strokeWidth="26" strokeLinecap="round" />
          {/* crumbs */}
          {[[0, -40, 30], [1, 10, 50], [2, -10, 80]].map(([n, dx, dy]) => { const k = ramp(r, 16.85 + n * 0.04, 17.4 + n * 0.04, (x) => x); return <circle key={n} cx={470 + dx * k + k * 40} cy={260 + dy * k + k * k * 120} r={12 - n * 2} fill="#fff" opacity={k > 0 && k < 1 ? 1 - k : 0} />; })}
        </svg>
        <p>{tr("Food is better shared.")}</p>
      </div>
      </div>
      {!still && <button type="button" className="hs2-play" onClick={() => setPaused((p) => !p)} aria-label={paused ? tr("Play the film") : tr("Pause the film")}>
        {paused ? <svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" /></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" /></svg>}
      </button>}
    </div>
  );
}
