// Bite's restaurant kit, shared by the landing, the app and the stand survey (styles in restaurant.css):
// BiteLoader – the logo "b" on a plate, bitten bite by bite (our loading state, instead of spinners)
// Cloche     – the silver dome that lifts to reveal what's under it (our "reveal" moment)
// Ornament   – a hand-drawn menu divider
// Course     – the small "course" label that opens each landing section ("No. 2 · Starter")
import { useEffect, useState } from "react";

let uid = 0;

/** The logo "b" on a plate; bites appear one after another, then the plate is "refilled" */
export function BiteLoader({ size = 56, label, dark = false }: { size?: number; label?: string; dark?: boolean }) {
  const [id] = useState(() => `bl${++uid}`);
  return (
    <span className={`bl ${dark ? "dark" : ""}`} role="status" aria-label={label}>
      <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
        <defs>
          <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
            <rect width="120" height="120" fill="white" />
            <path d="M48 81q12 10 24 0" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" />
            <circle className="bl-bite b1" cx="80" cy="50" r="6" fill="black" />
            <circle className="bl-bite b2" cx="86" cy="58" r="6.5" fill="black" />
            <circle className="bl-bite b3" cx="90" cy="68" r="6.5" fill="black" />
            <circle className="bl-bite b4" cx="91" cy="78" r="6" fill="black" />
          </mask>
        </defs>
        <circle className="bl-plate" cx="60" cy="60" r="56" />
        <circle className="bl-rim" cx="60" cy="60" r="45" />
        <g mask={`url(#${id}-m)`} className="bl-b">
          <rect x="37" y="24" width="15" height="52" rx="7.5" />
          <circle cx="62" cy="72" r="28" />
        </g>
      </svg>
      {label && <span className="bl-label">{label}</span>}
    </span>
  );
}

/** Content under a silver dome that lifts when `open` (or by itself after `delay` ms when `auto`) */
export function Cloche({ open, auto, delay = 300, children, className = "", label }: { open?: boolean; auto?: boolean; delay?: number; children: React.ReactNode; className?: string; label?: string }) {
  const [lifted, setLifted] = useState(false);
  useEffect(() => {
    if (open !== undefined) { setLifted(open); return; }
    if (!auto) return;
    const t = window.setTimeout(() => setLifted(true), delay);
    return () => window.clearTimeout(t);
  }, [open, auto, delay]);
  return (
    <div className={`cl ${lifted ? "lifted" : ""} ${className}`}>
      <div className="cl-food">{children}</div>
      <div className="cl-cover" aria-hidden>
        <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="cl-steel" x1="0" x2="1">
              <stop offset="0" stopColor="#8f84a8" /><stop offset=".35" stopColor="#f4f1fa" /><stop offset=".6" stopColor="#c9c1da" /><stop offset="1" stopColor="#7d7296" />
            </linearGradient>
          </defs>
          <path d="M14 108a86 86 0 0 1 172 0z" fill="url(#cl-steel)" />
          <path d="M40 70a62 62 0 0 1 40-36" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".7" />
          <rect x="88" y="10" width="24" height="12" rx="6" fill="#7d7296" />
          <rect x="6" y="106" width="188" height="8" rx="4" fill="#6b5f86" />
        </svg>
        {label && <span className="cl-label">{label}</span>}
      </div>
      <span className="cl-steam" aria-hidden><i /><i /><i /></span>
    </div>
  );
}

/** A small menu flourish: line, diamond, line */
export function Ornament({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <svg className={`orn ${light ? "light" : ""} ${className}`} viewBox="0 0 160 14" aria-hidden>
      <path d="M2 7h56M102 7h56" />
      <path d="M64 7c4-5 8-5 10 0 2 5 6 5 10 0" />
      <path d="M80 1l6 6-6 6-6-6z" className="orn-fill" />
      <circle cx="66" cy="7" r="1.6" className="orn-fill" /><circle cx="94" cy="7" r="1.6" className="orn-fill" />
    </svg>
  );
}

/** The course label above a landing section: "NO. 2 · STARTER —— why Bite" (name in small caps, the
    section's own handwritten subtitle after the rule) */
export function Course({ n, name, children, light = false, size = 22 }: { n: number; name: string; children?: React.ReactNode; light?: boolean; size?: number }) {
  return (
    <span className={`course ${light ? "light" : ""}`} style={{ fontSize: size }}>
      <b>No. {n} · {name}</b>
      {children && <><i />{children}</>}
    </span>
  );
}

/** The table seen from above: the host's chair at the head, booked chairs filled, yours in green, free ones dashed */
export function TableSeats({ seats, taken, mine = 0, hostAvatar, caption }: { seats: number; taken: number; mine?: number; hostAvatar?: string; caption?: React.ReactNode }) {
  const [id] = useState(() => `ts${++uid}`);
  const total = seats + 1; // + the host
  const cx = 130, cy = 78, rx = 92, ry = 52;
  const chairs = Array.from({ length: total }, (_, i) => {
    const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
    return { x: cx + Math.cos(a) * (rx + 22), y: cy + Math.sin(a) * (ry + 20), i };
  });
  const others = taken - mine;
  return (
    <figure className="ts">
      <svg viewBox="0 0 260 160" role="img" aria-label={typeof caption === "string" ? caption : undefined}>
        <defs><clipPath id={`${id}-c`}><circle r="13" /></clipPath></defs>
        <ellipse cx={cx} cy={cy + 6} rx={rx} ry={ry} className="ts-shadow" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="ts-table" />
        <ellipse cx={cx} cy={cy} rx={rx - 10} ry={ry - 8} className="ts-cloth" />
        {Array.from({ length: Math.min(total, 8) }, (_, i) => {
          const a = -Math.PI / 2 + (i / total) * Math.PI * 2;
          return <circle key={i} cx={cx + Math.cos(a) * (rx - 26)} cy={cy + Math.sin(a) * (ry - 18)} r="9" className="ts-plate" />;
        })}
        {chairs.map(({ x, y, i }) => {
          const state = i === 0 ? "host" : i <= others ? "taken" : i <= others + mine ? "mine" : "free";
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <g className={`ts-chair ${state}`} style={{ ["--i" as string]: i }}>
                <circle r="14" />
                {state === "host" && hostAvatar && <image href={hostAvatar} x="-13" y="-13" width="26" height="26" clipPath={`url(#${id}-c)`} preserveAspectRatio="xMidYMid slice" />}
                {state === "taken" && <path d="M0-5a3.5 3.5 0 1 1 0 .01M-6 7c0-4 3-6 6-6s6 2 6 6" className="ts-person" />}
                {state === "mine" && <path d="M-5 0l3.5 3.5L5.5-4" className="ts-tick" />}
                {state === "free" && <path d="M0-5v10M-5 0h10" className="ts-plus" />}
              </g>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Empty state: an empty plate, fork and knife crossed on top */
export function EmptyPlate({ size = 96 }: { size?: number }) {
  return (
    <svg className="ep" viewBox="0 0 120 120" width={size} height={size} aria-hidden>
      <ellipse cx="60" cy="68" rx="46" ry="12" className="ep-shadow" />
      <circle cx="60" cy="58" r="42" className="ep-plate" />
      <circle cx="60" cy="58" r="30" className="ep-rim" />
      <g className="ep-fork"><path d="M38 26l44 52M34 30l8-8M30 34l8-8M38 38l8-8" /></g>
      <g className="ep-knife"><path d="M84 24c-6 4-14 14-20 22l4 4L46 80" /></g>
    </svg>
  );
}
