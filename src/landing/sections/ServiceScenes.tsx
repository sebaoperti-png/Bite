// Animated illustrations for the "four ways to eat" panels (pure SVG + CSS, animations in landing.css under .sc-*).
// They only animate while their panel is open (.ws-panel.on).
import { t } from "../../shared/i18n";

const FOOD = { tomato: "#ff5a6e", carrot: "#ffa04d", leaf: "#4fd18b", yolk: "#ffd36b", cream: "#fff6e8" };

function Steam({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".85">
      <path className="sc-steam" d="M-18 0c-8-10 8-18 0-30s8-18 0-30" />
      <path className="sc-steam d2" d="M0 -4c-8-10 8-18 0-30s8-18 0-30" />
      <path className="sc-steam d3" d="M18 0c-8-10 8-18 0-30s8-18 0-30" />
    </g>
  );
}

function Chip({ x, y, text, dot, cls = "" }: { x: number; y: number; w?: number; text: string; dot: string; cls?: string }) {
  const label = t(text);
  const w = 44 + label.length * 7.6; // fits the text in either language
  return (
    <g className={`sc-chip ${cls}`} transform={`translate(${x} ${y})`}>
      <rect width={w} height="34" rx="17" fill="#fff" />
      <circle cx="18" cy="17" r="6" fill={dot} />
      <text x="32" y="22" fontSize="14" fontWeight="800" fill="#160a2e" fontFamily="Inter, sans-serif">{label}</text>
    </g>
  );
}

/** Pick-up: a warm takeaway bag with steam, a ready-time chip and a price chip */
export function PickupScene() {
  return (
    <svg className="sc" viewBox="0 0 400 300" aria-hidden>
      <ellipse cx="200" cy="262" rx="110" ry="14" fill="rgba(0,0,0,0.18)" />
      <g className="sc-bob">
        <Steam x={200} y={92} s={0.9} />
        {/* bag */}
        <path d="M128 110h144l12 148H116z" fill={FOOD.cream} />
        <path d="M128 110h144l-6 22H134z" fill="#f0dcc0" />
        <path d="M168 110v-14a32 32 0 0 1 64 0v14" fill="none" stroke="#f0dcc0" strokeWidth="9" strokeLinecap="round" />
        {/* sticker */}
        <circle cx="200" cy="190" r="34" fill="#6b21d9" />
        <text x="200" y="204" textAnchor="middle" fontSize="40" fontWeight="900" fill="#fff" fontFamily="Inter, sans-serif">B</text>
        <path d="M222 168a12 12 0 1 0 14 10" fill="#6b21d9" />
      </g>
      <Chip x={18} y={70} w={124} text="Ready 18:30" dot={FOOD.leaf} cls="d1" />
      <Chip x={282} y={150} w={100} text="€6 plate" dot={FOOD.yolk} cls="d2" />
      <Chip x={30} y={200} w={112} text="2 min away" dot={FOOD.tomato} cls="d3" />
    </svg>
  );
}

/** Eat together: a round table from above, plates around a shared pot, guests' avatars around it */
export function TogetherScene() {
  const seats = [
    { a: -90, c: "#ff7aa8", n: "M" },
    { a: -30, c: "#ffd36b", n: "J" },
    { a: 30, c: "#4fd18b", n: "L" },
    { a: 90, c: "#7fb4ff", n: "C" },
    { a: 150, c: "#ffa04d", n: "B" },
    { a: 210, c: "", n: "+" }, // the free seat
  ];
  return (
    <svg className="sc" viewBox="0 0 400 300" aria-hidden>
      <g className="sc-table">
        <circle cx="200" cy="150" r="104" fill="rgba(255,255,255,0.14)" />
        <circle cx="200" cy="150" r="88" fill="rgba(255,255,255,0.22)" />
        {seats.map((s, i) => {
          const r = (s.a * Math.PI) / 180;
          const px = 200 + Math.cos(r) * 62, py = 150 + Math.sin(r) * 62;
          const ax = 200 + Math.cos(r) * 128, ay = 150 + Math.sin(r) * 128;
          return (
            <g key={i}>
              {s.c && <g className={`sc-pop d${i}`}>
                <circle cx={px} cy={py} r="19" fill="#fff" />
                <circle cx={px} cy={py} r="12" fill={FOOD.cream} />
                <circle cx={px - 4} cy={py - 2} r="4" fill={FOOD.tomato} />
                <circle cx={px + 4} cy={py + 3} r="3.5" fill={FOOD.leaf} />
              </g>}
              <g className={`sc-seat d${i}`}>
                {s.c ? (
                  <circle cx={ax} cy={ay} r="18" fill={s.c} stroke="#fff" strokeWidth="3" />
                ) : (
                  <circle className="sc-free" cx={ax} cy={ay} r="17" fill="rgba(255,255,255,0.1)" stroke="#fff" strokeWidth="2.5" strokeDasharray="5 4" />
                )}
                <text x={ax} y={ay + 6} textAnchor="middle" fontSize="16" fontWeight="900" fill={s.c ? "#160a2e" : "#fff"} fontFamily="Inter, sans-serif">{s.n}</text>
              </g>
            </g>
          );
        })}
        {/* shared pot in the middle */}
        <circle cx="200" cy="150" r="28" fill="#2a1553" />
        <circle cx="200" cy="150" r="22" fill="#ffa04d" />
        <circle cx="193" cy="145" r="5" fill={FOOD.yolk} />
        <circle cx="207" cy="155" r="4" fill={FOOD.leaf} />
      </g>
      <Steam x={200} y={128} s={0.55} />
      <g className="sc-chip d2" transform="translate(296 18)">
        <rect width="92" height="34" rx="17" fill="#ff3d7f" />
        <text x="46" y="22" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">{t("5 / 6 seats")}</text>
      </g>
    </svg>
  );
}

/** Cook together: ingredients drop into a bubbling pot, the lid hops, a recipe card floats by */
export function CookScene() {
  return (
    <svg className="sc" viewBox="0 0 400 300" aria-hidden>
      <ellipse cx="200" cy="272" rx="120" ry="12" fill="rgba(0,0,0,0.18)" />
      {/* falling ingredients */}
      <g className="sc-drop d0"><circle cx="168" cy="40" r="15" fill={FOOD.tomato} /><path d="M163 27l5 5 5-5" stroke={FOOD.leaf} strokeWidth="4" fill="none" strokeLinecap="round" /></g>
      <g className="sc-drop d1"><path d="M222 22l14 6-24 40z" fill={FOOD.carrot} /><path d="M232 20l8-8M236 26l10-4" stroke={FOOD.leaf} strokeWidth="4" strokeLinecap="round" /></g>
      <g className="sc-drop d2"><path d="M198 30c14-12 30-4 30 10-14 6-26 2-30-10z" fill={FOOD.leaf} /></g>
      <g className="sc-drop d3"><path d="M180 30a14 10 0 0 1 28 0z" fill="#e8d5c0" /><rect x="189" y="30" width="10" height="12" rx="3" fill="#f6ead9" /></g>
      {/* pot */}
      <g>
        <rect x="104" y="150" width="192" height="112" rx="26" fill="#fff" />
        <rect x="104" y="150" width="192" height="26" rx="10" fill="#efe6fb" />
        <rect x="78" y="166" width="32" height="14" rx="7" fill="#fff" />
        <rect x="290" y="166" width="32" height="14" rx="7" fill="#fff" />
        <circle className="sc-bubble d0" cx="160" cy="150" r="7" fill={FOOD.carrot} />
        <circle className="sc-bubble d1" cx="200" cy="148" r="9" fill={FOOD.tomato} />
        <circle className="sc-bubble d2" cx="240" cy="150" r="6" fill={FOOD.yolk} />
      </g>
      <g className="sc-lid">
        <rect x="96" y="128" width="208" height="16" rx="8" fill="#d9c2ff" />
        <rect x="186" y="114" width="28" height="16" rx="8" fill="#d9c2ff" />
      </g>
      <g className="sc-chip d1" transform="translate(286 52) rotate(6)">
        <rect width="100" height="66" rx="12" fill="#fff" />
        <text x="14" y="24" fontSize="12" fontWeight="900" fill="#6b21d9" fontFamily="Inter, sans-serif">{t("RECIPE")}</text>
        <rect x="14" y="34" width="70" height="6" rx="3" fill="#e5dbf5" />
        <rect x="14" y="46" width="52" height="6" rx="3" fill="#e5dbf5" />
      </g>
    </svg>
  );
}

/** Delivery (coming soon): a bike riding along a dotted route towards a map pin */
export function DeliveryScene() {
  return (
    <svg className="sc sc-grey" viewBox="0 0 400 300" aria-hidden>
      <path className="sc-route" d="M30 230C110 230 120 150 200 150s100-70 170-70" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 16" />
      <g className="sc-pin">
        <path d="M370 34c-16 0-28 12-28 27 0 20 28 44 28 44s28-24 28-44c0-15-12-27-28-27z" fill="#fff" />
        <circle cx="370" cy="61" r="10" fill="#3a3545" />
      </g>
      <g className="sc-ride">
        <g transform="translate(150 150)">
          <circle className="sc-wheel" cx="-34" cy="40" r="22" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray="10 6" />
          <circle className="sc-wheel" cx="40" cy="40" r="22" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray="10 6" />
          <path d="M-34 40L0 0h30L40 40M0 0l-8-16h-14M30 0l-6-14" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-8" y="-58" width="44" height="40" rx="8" fill="#d6d1de" />
          <text x="14" y="-30" textAnchor="middle" fontSize="20" fontWeight="900" fill="#3a3545" fontFamily="Inter, sans-serif">B</text>
        </g>
      </g>
    </svg>
  );
}

export const SCENES = [PickupScene, TogetherScene, CookScene, DeliveryScene];
