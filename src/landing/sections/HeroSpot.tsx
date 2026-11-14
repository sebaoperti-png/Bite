// The hero's little "spot" (14 s, loops): a block of flats at night. Behind six windows, six neighbours eat alone,
// a bit sad. Their phones light up: "Dinner together tonight? 1st floor, Amina's tajine." They smile, their windows
// go dark, a dotted path runs from each window to the long table on the first floor, which lights up with
// string lights, and there they all are, eating together, with one seat kept free: "Reserved for you".
// Drawn in SVG, moved with CSS (landing.css, .sp-*). Decorative (aria-hidden): the story is told in words beside it.
// With reduced motion the last scene (everyone at the table) is shown, still.
import { t } from "../../shared/i18n";

type Look = { skin: string; shirt: string; hair: string; style: "short" | "bun" | "long" | "cap" | "bald" };
const LOOKS: Look[] = [
  { skin: "#f2c6a0", shirt: "#7aa0e8", hair: "#3b2a20", style: "short" },
  { skin: "#c98b5e", shirt: "#e97a5d", hair: "#1f1712", style: "bun" },
  { skin: "#f6d3b3", shirt: "#3fae8f", hair: "#b8742e", style: "long" },
  { skin: "#8d5a3b", shirt: "#f08bb0", hair: "#1a1310", style: "short" },
  { skin: "#e8b48e", shirt: "#4c7be0", hair: "#e9e2d8", style: "bald" },
  { skin: "#b77850", shirt: "#9b6be0", hair: "#2a1d14", style: "cap" },
];

/** a neighbour, seated, facing us; origin = middle of the shoulders */
function Person({ look, x, y, s = 1, mood }: { look: Look; x: number; y: number; s?: number; mood: "window" | "table" }) {
  const hair = {
    short: <path d="M-12 -24c0-10 6-15 12-15s12 5 12 15c-3-5-7-7-12-7s-9 2-12 7z" />,
    bun: <><circle cx="0" cy="-42" r="6" /><path d="M-12 -24c0-10 6-15 12-15s12 5 12 15c-4-6-8-8-12-8s-8 2-12 8z" /></>,
    long: <path d="M-13 -22c0-12 6-17 13-17s13 5 13 17v14h-5v-14c-2-4-5-6-8-6s-6 2-8 6v14h-5z" />,
    cap: <path d="M-12 -26c1-9 6-13 12-13s11 4 12 13zM10 -27h8v3h-9z" />,
    bald: <path d="M-12 -20c-1-4 0-8 2-10M12 -20c1-4 0-8-2-10" fill="none" strokeWidth="3" />,
  }[look.style];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-17 22v-12c0-9 7-14 17-14s17 5 17 14v12z" fill={look.shirt} />
      <circle cx="0" cy="-20" r="12" fill={look.skin} />
      <g fill={look.hair} stroke={look.hair}>{hair}</g>
      <circle cx="-4.5" cy="-20" r="1.4" fill="#2a1a3a" /><circle cx="4.5" cy="-20" r="1.4" fill="#2a1a3a" />
      {mood === "window" ? (
        <>
          <path className="sp-sad" d="M-4 -12.5q4 -3 8 0" fill="none" stroke="#2a1a3a" strokeWidth="1.6" strokeLinecap="round" />
          <path className="sp-happy" d="M-5 -14q5 5 10 0" fill="none" stroke="#2a1a3a" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : <path d="M-5 -14q5 5 10 0" fill="none" stroke="#2a1a3a" strokeWidth="1.8" strokeLinecap="round" />}
    </g>
  );
}

// six windows with someone alone behind them: [column, row]
const LONELY: [number, number][] = [[0, 0], [2, 0], [0, 1], [1, 1], [0, 3], [2, 3]];
const COLX = [62, 177, 292];
const ROWY = { 0: 84, 1: 204, 3: 474 } as Record<number, number>;
const HALL = { x: 50, y: 326, w: 360, h: 118 };
const SEATS = [82, 131, 180, 278, 327, 376];
const FREE = 229;

export function HeroSpot() {
  return (
    <div className="sp" aria-hidden>
      <svg viewBox="0 0 520 620" className="sp-svg">
        <defs>
          <linearGradient id="sp-cool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8e9ce8" /><stop offset="1" stopColor="#5d63b8" /></linearGradient>
          <linearGradient id="sp-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd98f" /><stop offset="1" stopColor="#ffb25c" /></linearGradient>
          <radialGradient id="sp-moon" cx="0.4" cy="0.4" r="0.7"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#e6dcff" /></radialGradient>
          <clipPath id="sp-hall"><rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" /></clipPath>
        </defs>

        {/* sky + bitten moon */}
        <circle cx="462" cy="70" r="40" fill="url(#sp-moon)" className="sp-moonglow" />
        <circle cx="494" cy="54" r="10" fill="#2a1757" /><circle cx="499" cy="72" r="9" fill="#2a1757" /><circle cx="493" cy="89" r="8" fill="#2a1757" />
        {[[440, 170], [480, 230], [20, 30], [470, 300], [500, 150]].map(([x, y], n) => <circle key={n} cx={x} cy={y} r="1.8" fill="#fff" className="sp-star" style={{ animationDelay: `${n * 0.7}s` }} />)}

        {/* the building */}
        <rect x="30" y="56" width="400" height="580" rx="10" fill="#2b1a55" />
        <rect x="22" y="44" width="416" height="20" rx="6" fill="#3a2470" />
        <g stroke="rgba(255,255,255,0.045)" strokeWidth="1">{Array.from({ length: 26 }, (_, n) => <path key={n} d={`M30 ${80 + n * 22}h400`} />)}</g>

        {/* windows: the lonely ones, two dark ones with a plant */}
        {[[1, 0], [2, 1]].map(([c, r]) => (
          <g key={`d${c}${r}`} transform={`translate(${COLX[c]} ${ROWY[r]})`}>
            <rect width="96" height="92" rx="4" fill="#1a0f33" stroke="#140a28" strokeWidth="6" />
            <path d="M48 0v92" stroke="#140a28" strokeWidth="4" />
            <path d="M58 82v-14h12v14z" fill="#6b4a8a" /><circle cx="60" cy="62" r="6" fill="#4caf7a" /><circle cx="68" cy="60" r="6" fill="#3d9a68" />
          </g>
        ))}
        {LONELY.map(([c, r], i) => (
          <g key={`w${i}`} className="sp-win" style={{ ["--i" as string]: i }} transform={`translate(${COLX[c]} ${ROWY[r]})`}>
            <rect width="96" height="92" rx="4" fill="#1a0f33" />
            <rect width="96" height="92" rx="4" fill="url(#sp-cool)" className="sp-light" />
            <g className="sp-who">
              <Person look={LOOKS[i]} x={34} y={58} s={0.95} mood="window" />
              <path d="M8 72h70" stroke="#e9e4ff" strokeWidth="4" strokeLinecap="round" />
              <ellipse cx="56" cy="69" rx="9" ry="2.6" fill="#fff" />
              {/* the phone that lights up */}
              <rect x="46" y="52" width="8" height="13" rx="2" fill="#2a1a3a" className="sp-phone" />
            </g>
            <rect width="96" height="92" rx="4" fill="none" stroke="#140a28" strokeWidth="6" />
            <path d="M48 0v92" stroke="#140a28" strokeWidth="4" opacity=".55" />
            {/* the notification */}
            <g className="sp-ping" transform="translate(76 -6)">
              <circle r="15" fill="#ff5a8a" />
              <path d="M-5 3h10l-2-3v-4a3 3 0 0 0-6 0v4zM-1.5 5a1.5 1.5 0 0 0 3 0" fill="#fff" />
            </g>
          </g>
        ))}

        {/* dotted paths from each window to the long table */}
        {LONELY.map(([c, r], i) => {
          const sx = COLX[c] + 48, sy = r === 3 ? ROWY[r] : ROWY[r] + 92, ex = SEATS[i], ey = r === 3 ? HALL.y + HALL.h : HALL.y;
          const mx = (sx + ex) / 2 + (i % 2 ? 26 : -26);
          return <path key={`p${i}`} className="sp-path" style={{ ["--i" as string]: i }} d={`M${sx} ${sy}Q${mx} ${(sy + ey) / 2} ${ex} ${ey}`} pathLength={1} />;
        })}

        {/* the long table on the first floor */}
        <rect x={HALL.x - 6} y={HALL.y - 6} width={HALL.w + 12} height={HALL.h + 12} rx="8" fill="#140a28" />
        <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} rx="6" fill="#1a0f33" />
        <g clipPath="url(#sp-hall)">
          <rect x={HALL.x} y={HALL.y} width={HALL.w} height={HALL.h} fill="url(#sp-warm)" className="sp-hall-light" />
          <path className="sp-garland" d={`M${HALL.x} ${HALL.y + 10}q45 16 90 0t90 0t90 0t90 0`} fill="none" stroke="#5a3a20" strokeWidth="1.2" />
          {Array.from({ length: 12 }, (_, n) => <circle key={n} className="sp-bulb" cx={HALL.x + 15 + n * 30} cy={HALL.y + 14 + (n % 3 === 1 ? 3 : 1)} r="3.2" style={{ animationDelay: `${(n % 4) * 0.35}s` }} />)}
          {SEATS.map((x, n) => (
            <g key={`s${n}`} className="sp-seat" style={{ ["--i" as string]: n }}>
              <Person look={LOOKS[n]} x={x} y={HALL.y + 82} s={0.9} mood="table" />
            </g>
          ))}
          {/* the free seat */}
          <rect x={FREE - 14} y={HALL.y + 50} width="28" height="40" rx="5" fill="none" stroke="#ff5a8a" strokeWidth="2.5" strokeDasharray="5 4" className="sp-free" />
          <rect x={HALL.x + 16} y={HALL.y + 88} width={HALL.w - 32} height="12" rx="4" fill="#fffaf2" />
          {[...SEATS, FREE].map((x, n) => <ellipse key={`pl${n}`} className="sp-plate" style={{ ["--i" as string]: n }} cx={x} cy={HALL.y + 88} rx="11" ry="3.5" fill="#fff" stroke="#e7c9a0" />)}
        </g>
        <g className="sp-tag" transform={`translate(${FREE} ${HALL.y + HALL.h + 30}) rotate(-4)`}>
          <rect x="-78" y="-17" width="156" height="34" rx="9" fill="#ff5a8a" />
          <text x="0" y="6" textAnchor="middle" className="sp-tag-text">{t("Reserved for you")}</text>
        </g>

        {/* front door */}
        <path d="M200 636v-110a30 30 0 0 1 60 0v110z" fill="#5b35a8" stroke="#140a28" strokeWidth="5" />
        <circle cx="249" cy="584" r="3" fill="#ffd98f" />
      </svg>
    </div>
  );
}
