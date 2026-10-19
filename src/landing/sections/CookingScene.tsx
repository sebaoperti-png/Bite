// FOR COOKS — an animated kitchen that tells the headline in four steps, on a loop:
// 1 shop (ingredients drop into the pot while the shopping list ticks them off, total €42),
// 2 cook once (flame, sauce, spoon, steam), 3 share the table (seven portions fly onto seven plates),
// 4 split the bill (a €6 tag on every plate, "€42 ÷ 7 = €6 each").
// Runs only while it is on screen; with reduced motion it shows the finished table.
import { useEffect, useRef, useState } from "react";
import { t, getLang } from "../../shared/i18n";

const eur = (n: number) => (getLang() === "de" ? `${n} €` : `€${n}`);

// What goes into the pot, with what it costs (adds up to 42)
const ITEMS = [
  { id: "tomato", name: "Tomatoes", price: 9, x: 300 },
  { id: "pasta", name: "Pasta", price: 5, x: 352 },
  { id: "garlic", name: "Garlic & onion", price: 4, x: 322 },
  { id: "basil", name: "Basil", price: 3, x: 364 },
  { id: "cheese", name: "Parmesan", price: 12, x: 296 },
  { id: "oil", name: "Olive oil", price: 9, x: 338 },
];
const STEPS = ["Shop", "Cook once", "Share the table", "Split the bill"];
const PLATES = Array.from({ length: 7 }, (_, i) => 46 + i * 71);
const POT = { x: 330, y: 250 };
const PLATE_Y = 418;
// When each step starts (ms) and when the loop restarts
const AT = [0, 4000, 6800, 9400];
const LOOP = 14000;

function Ingredient({ id }: { id: string }) {
  switch (id) {
    case "tomato":
      return <><circle r="15" fill="#e8473a" /><path d="M-6-13l6 4 6-4-3 7h-6z" fill="#3fa65c" /><ellipse cx="-5" cy="-4" rx="4" ry="2.5" fill="#fff" opacity=".35" /></>;
    case "pasta":
      return <g stroke="#f2c14e" strokeWidth="3.5" strokeLinecap="round"><path d="M-16 10L12-14" /><path d="M-12 14L16-10" /><path d="M-18 4L8-18" /><path d="M-8 16L18-4" /></g>;
    case "garlic":
      return <><path d="M0-16c3 4 14 8 14 18a14 12 0 0 1-28 0c0-10 11-14 14-18z" fill="#f7f1e6" stroke="#d9cbb2" strokeWidth="1.5" /><path d="M0-6v18M-7-1c1 6 3 10 7 13M7-1c-1 6-3 10-7 13" stroke="#d9cbb2" strokeWidth="1.2" fill="none" /></>;
    case "basil":
      return <><path d="M-14 12C-14-6-2-16 14-14 14 2 2 14-14 12z" fill="#3fa65c" /><path d="M-12 10L10-11" stroke="#2c7d44" strokeWidth="1.5" /></>;
    case "cheese":
      return <><path d="M-16 10L14-12 16 10z" fill="#f6d77a" stroke="#e2b94a" strokeWidth="1.5" strokeLinejoin="round" /><circle cx="5" cy="3" r="2.5" fill="#e2b94a" /><circle cx="10" cy="-4" r="1.6" fill="#e2b94a" /></>;
    default:
      return <path d="M0-16C6-6 11 0 11 6a11 11 0 0 1-22 0c0-6 5-12 11-22z" fill="#c9a227" opacity=".9" />;
  }
}

export function CookingScene({ onStep }: { onStep?: (step: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(-1);
  const [loop, setLoop] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setStep(3); return; }
    if (!visible) return;
    const timers = AT.map((ms, i) => window.setTimeout(() => setStep(i), ms));
    timers.push(window.setTimeout(() => { setStep(-1); setLoop((l) => l + 1); }, LOOP));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [visible, loop, reduced]);

  useEffect(() => { onStep?.(step); }, [step, onStep]);

  const cls = [0, 1, 2, 3].filter((i) => step >= i).map((i) => `s${i}`).join(" ");
  const total = ITEMS.reduce((n, x) => n + x.price, 0);

  return (
    <div ref={ref} className="ck-frame">
    <div className={`ck ${cls} ${reduced ? "still" : ""}`} key={loop}>
      <svg className="ck-svg" viewBox="0 0 520 520" aria-hidden>
        <defs>
          <pattern id="ck-tiles" width="40" height="26" patternUnits="userSpaceOnUse">
            <rect width="40" height="26" fill="#f7f2fd" />
            <path d="M0 25.5h40M20 0v13M0 13h40M40 13v13M0 13v13" stroke="#e6dcf5" strokeWidth="1" fill="none" />
          </pattern>
          <linearGradient id="ck-pot" x1="0" x2="1">
            <stop offset="0" stopColor="#3b1a78" /><stop offset=".45" stopColor="#6b21d9" /><stop offset="1" stopColor="#2a1553" />
          </linearGradient>
        </defs>

        {/* kitchen: tiles, counter */}
        <rect width="520" height="360" fill="url(#ck-tiles)" />
        <rect y="350" width="520" height="170" fill="#ebe2f8" />
        <rect y="350" width="520" height="8" fill="#d9ccef" />

        {/* hob + flames */}
        <ellipse cx={POT.x} cy="352" rx="70" ry="9" fill="#2a1553" opacity=".85" />
        <g className="ck-flames">
          {[-36, -12, 12, 36].map((dx, i) => (
            <path key={dx} className="ck-flame" style={{ ["--i" as string]: i }} d={`M${POT.x + dx} 350c-6-6-4-12 0-18 4 6 6 12 0 18z`} fill="#9b4aff" />
          ))}
        </g>

        {/* ingredients falling in (drawn behind the pot front) */}
        {ITEMS.map((x, i) => (
          <g key={x.id} transform={`translate(${x.x} 236)`}>
            <g className="ck-drop" style={{ ["--i" as string]: i }}><Ingredient id={x.id} /></g>
          </g>
        ))}

        {/* pot */}
        <ellipse cx={POT.x} cy={POT.y} rx="86" ry="16" fill="#1d0f3e" />
        <ellipse className="ck-sauce" cx={POT.x} cy={POT.y + 2} rx="78" ry="12" />
        <g className="ck-bubbles">
          {[[300, 252], [340, 249], [362, 254], [318, 256]].map(([cx, cy], i) => (
            <circle key={i} className="ck-bubble" style={{ ["--i" as string]: i }} cx={cx} cy={cy} r="4" />
          ))}
        </g>
        <g className="ck-spoon">
          <path d={`M${POT.x + 10} 250L${POT.x + 70} 150`} stroke="#c49a6c" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx={POT.x + 6} cy="254" rx="14" ry="7" fill="#b08458" />
        </g>
        <path d={`M${POT.x - 86} ${POT.y}c0 0 0 56 8 74 6 14 22 22 40 22h76c18 0 34-8 40-22 8-18 8-74 8-74`} fill="url(#ck-pot)" />
        <path d={`M${POT.x - 86} ${POT.y}a86 16 0 0 0 172 0`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        <rect x={POT.x - 108} y={POT.y + 12} width="24" height="10" rx="5" fill="#2a1553" />
        <rect x={POT.x + 84} y={POT.y + 12} width="24" height="10" rx="5" fill="#2a1553" />
        <text x={POT.x} y={POT.y + 62} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="900" letterSpacing="5" fill="rgba(255,255,255,0.85)">BITE</text>

        {/* steam */}
        <g className="ck-steam" fill="none" stroke="#c9b8e8" strokeWidth="5" strokeLinecap="round">
          {[-30, 0, 30].map((dx, i) => (
            <path key={dx} style={{ ["--i" as string]: i }} d={`M${POT.x + dx} 222c-10-14 10-22 0-38s10-22 0-36`} />
          ))}
        </g>

        {/* seven plates, portions flying in, €6 tags */}
        {PLATES.map((px, i) => (
          <g key={px} transform={`translate(${px} ${PLATE_Y})`}>
            <ellipse cy="6" rx="32" ry="11" fill="rgba(46,16,96,0.12)" />
            <ellipse rx="31" ry="11" fill="#fff" stroke="#d9ccef" strokeWidth="1.5" />
            <ellipse rx="20" ry="6.5" fill="none" stroke="#efe8fb" strokeWidth="1.5" />
            <g className="ck-portion" style={{ ["--i" as string]: i, ["--dx" as string]: `${POT.x - px}px`, ["--dy" as string]: `${POT.y - PLATE_Y}px` }}>
              <ellipse cy="-3" rx="17" ry="7" fill="#e35d3f" />
              <path d="M-9-5q5-5 10 0M-2-3q5-5 10 0" stroke="#f2c14e" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="6" cy="-7" r="2.6" fill="#3fa65c" />
            </g>
            <g className="ck-tag" style={{ ["--i" as string]: i }}>
              <rect x="-22" y="-52" width="44" height="24" rx="12" fill="#160a2e" />
              <text y="-35" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="900" fill="#fff">{eur(6)}</text>
            </g>
          </g>
        ))}
      </svg>

      {/* the four steps */}
      <ol className="ck-steps">
        {STEPS.map((s, i) => <li key={s} className={step === i ? "now" : step > i ? "done" : ""}><b>{i + 1}</b>{t(s)}</li>)}
      </ol>

      {/* shopping list, ticked as things go in */}
      <div className="ck-list">
        <span className="ck-list-title">{t("Shopping list")}</span>
        {ITEMS.map((x, i) => (
          <div key={x.id} className="ck-line" style={{ ["--i" as string]: i }}><span>{t(x.name)}</span><i /><b>{eur(x.price)}</b></div>
        ))}
        <div className="ck-total"><span>{t("Total")}</span><b>{eur(total)}</b></div>
      </div>

      {/* the split */}
      <div className="ck-split">
        <span>{t("Groceries for 7: €42")} ÷ 7</span>
        <b>{t("€6 each")}</b>
      </div>
    </div>
    </div>
  );
}
