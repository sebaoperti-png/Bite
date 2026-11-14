// THE BUILDING (phones, 2026-11-14): the story of Bite as one block of flats at night that you walk down while
// you scroll, the same house as the hero film. Each floor is a chapter and its window lights up when you reach it:
//  4th floor  why: someone eats alone again (our real AIM 2026 number)
//  3rd floor  the price: a receipt taped to the window
//  2nd floor  how it works: the phone lights up, "Amina, 1st floor, is cooking tajine tonight"
//  1st floor  for cooks: the long table, the one free chair
//  ground     house rules pinned next to the door ("Hausordnung", like in every German stairwell),
//             the doorbell panel with the three founders, and the doormat that opens the app.
// A lift display at the side shows which floor you're on. Drawn by hand in SVG: no stock gradients, no glass cards.
// Ids people / savings / services / cooks / safety / how are kept: the nav and the footer link to them.
import { useEffect, useRef, useState } from "react";
import { t, getLang } from "../../shared/i18n";

const euro = (n: number) => (getLang() === "de" ? `${n} €` : `€${n}`);
const FLOORS = ["people", "savings", "services", "cooks", "safety"] as const;
const LABEL: Record<(typeof FLOORS)[number], string> = { people: "4", savings: "3", services: "2", cooks: "1", safety: "0" };
const PLATE: Record<string, string> = { "4": "4th floor", "3": "3rd floor", "2": "2nd floor", "1": "1st floor", "0": "Ground floor" };
const money = (n: number) => (getLang() === "de" ? n.toFixed(2).replace(".", ",") : n.toFixed(2));

/* ---------- the windows (one SVG each, 300×190) ---------- */

function Frame({ children, lit }: { children: React.ReactNode; lit: "cold" | "warm" | "off" }) {
  return (
    <svg className={`bd-win ${lit}`} viewBox="0 0 300 190" aria-hidden>
      <rect x="0" y="0" width="300" height="190" rx="4" className="bd-win-room" />
      {children}
      {/* frame, cross bar, sill, curtains */}
      <path d="M20 0q14 95 0 190M280 0q-14 95 0 190" className="bd-win-curtain" />
      <rect x="0" y="0" width="300" height="190" rx="4" className="bd-win-frame" />
      <path d="M150 0v190" className="bd-win-bar" />
      <rect x="-10" y="186" width="320" height="12" rx="3" className="bd-win-sill" />
    </svg>
  );
}

/** a person at a small table, seen from the front */
function Sitter({ x, skin, shirt, hair, sad, phone }: { x: number; skin: string; shirt: string; hair: string; sad?: boolean; phone?: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M-30 150q0-44 30-46q30 2 30 46z" fill={shirt} />
      <circle cx="0" cy="84" r="19" fill={skin} />
      <path d="M-19 82a19 19 0 0 1 38 0q-19-12-38 0z" fill={hair} />
      {sad
        ? <path d="M-6 94q6-5 12 0" stroke="#5a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        : <path d="M-6 92q6 6 12 0" stroke="#5a2a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />}
      {phone && <>
        <rect x="14" y="104" width="12" height="19" rx="2.5" fill="#cfe6ff" transform="rotate(-14 20 113)" />
        <path d="M20 106L4 86L32 84z" fill="#cfe6ff" opacity=".22" />
      </>}
    </g>
  );
}

function WinAlone() {
  return (
    <Frame lit="cold">
      <circle cx="150" cy="34" r="16" className="bd-lamp" />
      <Sitter x={128} skin="#f1c7a3" shirt="#5b7fe0" hair="#3a2a20" sad phone />
      <rect x="150" y="140" width="90" height="8" rx="3" fill="#232a55" /><rect x="190" y="148" width="7" height="42" fill="#232a55" />
      <ellipse cx="196" cy="138" rx="22" ry="6" fill="#e6ebff" /><ellipse cx="196" cy="136" rx="12" ry="3.5" fill="#c2ccf2" />
      {/* rain on the glass */}
      <g className="bd-rain">{[[40, 20], [80, 70], [235, 30], [262, 96], [118, 18], [205, 88]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l-5 20`} />)}</g>
    </Frame>
  );
}

function WinReceipt() {
  return (
    <Frame lit="warm">
      <rect x="20" y="146" width="260" height="44" className="bd-win-floor" />
      {/* the shopping bag on the table */}
      <path d="M44 150l8-46h50l8 46z" fill="#d9b27c" /><path d="M62 104q15-22 30 0" stroke="#a87b45" strokeWidth="4" fill="none" />
      <circle cx="70" cy="100" r="9" fill="#e85d4a" /><path d="M86 104l6-26" stroke="#4f9d48" strokeWidth="6" strokeLinecap="round" />
      {/* the receipt taped to the glass */}
      <g className="bd-receipt" transform="rotate(-4 205 92)">
        <path d="M152 22h106v128l-7-6-7 6-7-6-7 6-7-6-7 6-7-6-7 6-7-6-7 6-7-6-7 6-7-6-7 6-7-6z" fill="#fffdf6" />
        <rect x="186" y="14" width="40" height="14" fill="rgba(255,236,170,0.75)" transform="rotate(6 206 21)" />
        <text x="205" y="44" textAnchor="middle" className="bd-rc-h">{t("BITE · TABLE 1")}</text>
        <text x="160" y="70" className="bd-rc">{t("groceries")}</text><text x="252" y="70" textAnchor="end" className="bd-rc">{money(48)}</text>
        <text x="160" y="88" className="bd-rc">{t("÷ 8 plates")}</text>
        <path d="M162 100h88" stroke="#c9b8e6" strokeDasharray="3 3" />
        <text x="160" y="116" className="bd-rc">{t("per plate")}</text><text x="252" y="136" textAnchor="end" className="bd-rc big">{money(6)}</text>
      </g>
    </Frame>
  );
}

function WinPhone() {
  return (
    <Frame lit="cold">
      <circle cx="150" cy="34" r="16" className="bd-lamp" />
      <Sitter x={86} skin="#c48a5f" shirt="#ee7a59" hair="#1e1611" />
      {/* the note on the phone, big */}
      <g className="bd-note">
        <rect x="160" y="52" width="128" height="98" rx="12" fill="#fff" />
        <circle cx="175" cy="69" r="7" fill="#6b21d9" />
        <text x="187" y="73" className="bd-nt-app">{t("BITE · now")}</text>
        <text x="170" y="96" className="bd-nt">{t("Amina, 1st floor:")}</text>
        <text x="170" y="112" className="bd-nt">{t("tajine tonight")}</text>
        <rect x="212" y="120" width="68" height="22" rx="11" fill="#6b21d9" /><text x="246" y="135" textAnchor="middle" className="bd-nt-join">{t("Join")}</text>
      </g>
    </Frame>
  );
}

function WinTable() {
  const people: [number, string, string, string][] = [[46, "#f1c9a5", "#ff8fab", "#1d1a24"], [98, "#e8b48f", "#2a9d8f", "#5b3a24"], [150, "#a8714b", "#ffffff", "#1b1410"], [254, "#f2cdb5", "#7b9acc", "#e9e6ef"]];
  return (
    <Frame lit="warm">
      <path d="M20 22q65 26 130 0t130 0" className="bd-string" />
      {[40, 72, 104, 136, 168, 200, 232, 262].map((x, i) => <circle key={x} cx={x} cy={22 + 9 * Math.sin((i / 7) * Math.PI * 2)} r="4" className="bd-bulb" style={{ animationDelay: `${i * 0.2}s` }} />)}
      {people.map(([x, skin, shirt, hair]) => <Sitter key={x} x={x} skin={skin} shirt={shirt} hair={hair} />)}
      {/* the free chair */}
      <rect x="182" y="96" width="40" height="52" rx="8" className="bd-free" />
      <rect x="20" y="140" width="260" height="12" rx="4" fill="#fbf6ec" /><rect x="20" y="152" width="260" height="8" fill="#efe4ff" />
      <ellipse cx="150" cy="136" rx="26" ry="8" fill="#b5562d" /><path d="M140 118c-4-6 4-9 0-15M152 116c-4-6 4-9 0-15M164 118c-4-6 4-9 0-15" className="bd-steam" />
    </Frame>
  );
}

/* ---------- a floor ---------- */

function Floor({ id, n, children, art, onLit }: { id: string; n: string; children: React.ReactNode; art: React.ReactNode; onLit: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLit(true); onLit(id); } }, { rootMargin: "-35% 0px -45% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [id, onLit]);
  return (
    <section ref={ref} id={id} className={`bd-floor ${lit ? "lit" : ""}`}>
      <span className="bd-plate" aria-hidden>{t(PLATE[n])}</span>
      <div className="bd-art">{art}</div>
      <div className="bd-copy">{children}</div>
    </section>
  );
}

export function LandingBuilding() {
  const [at, setAt] = useState<string>("people");
  return (
    <div className="bd" aria-label={t("How Bite works")}>
      {/* the roof: chimney, aerial, the bitten moon */}
      <div className="bd-roof" aria-hidden>
        <svg viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice">
          <defs><mask id="bd-bite"><rect width="390" height="120" fill="#fff" /><circle cx="338" cy="30" r="9" fill="#000" /><circle cx="342" cy="46" r="8" fill="#000" /></mask></defs>
          <circle cx="318" cy="40" r="24" fill="#f3eeff" mask="url(#bd-bite)" />
          <rect x="66" y="58" width="30" height="50" className="bd-chimney" /><rect x="62" y="52" width="38" height="9" className="bd-chimney" />
          <path d="M260 104v-64M248 46h24M252 56h16" className="bd-roofline" />
          <rect x="0" y="104" width="390" height="16" className="bd-cornice" />
        </svg>
      </div>

      {/* the lift display */}
      <div className="bd-lift" aria-hidden>
        <span className="bd-lift-box"><span className="bd-lift-arrow">▼</span><b key={at}>{at === "safety" ? (getLang() === "de" ? "E" : "G") : LABEL[at as keyof typeof LABEL]}</b></span>
      </div>

      <Floor id="people" n="4" onLit={setAt} art={<WinAlone />}>
        <p className="bd-kicker">{t("Why Bite")}</p>
        <h2 className="bd-h">{t("Another dinner alone.")}</h2>
        <p className="bd-stat"><b>58%</b>{t("eat 8 or more meals a week alone")}<small>{t("Bite survey, AIM 2026")}</small></p>
        <p className="bd-p">{t("The neighbour you nod to on the stairs turns out to make the best dumplings in town. Bite gives you a reason to knock.")}</p>
      </Floor>

      <Floor id="savings" n="3" onLit={setAt} art={<WinReceipt />}>
        <p className="bd-kicker">{t("The price")}</p>
        <h2 className="bd-h">{t("Same dinner. A fraction of the price.")}</h2>
        <div className="bd-prices" role="img" aria-label={t("Price per dinner: takeaway about 15 euros, Bite about 6 euros, restaurant about 25 euros")}>
          <span><small>{t("Takeaway")}</small><s>{euro(15)}</s></span>
          <span className="bite"><small>Bite</small><b>{euro(6)}</b></span>
          <span><small>{t("Restaurant")}</small><s>{euro(25)}</s></span>
        </div>
        <p className="bd-fine">{t("Typical prices per dinner in a German city, for comparison. On Bite, hosts set an equal share of what the ingredients cost.")}</p>
      </Floor>

      <Floor id="services" n="2" onLit={setAt} art={<WinPhone />}>
        <p className="bd-kicker">{t("How it works")}</p>
        <h2 className="bd-h">{t("Three taps to a real meal")}</h2>
        <ol className="bd-steps">
          <li><b>{t("Browse tonight's menus")}</b><span>{t("See what neighbours are cooking near you, filter by cuisine, diet or allergens.")}</span></li>
          <li><b>{t("Book your seat or pick-up")}</b><span>{t("Reserve in seconds, chat with your host and pay your share at the table.")}</span></li>
          <li><b>{t("Sit down & enjoy")}</b><span>{t("Eat something made with care, meet the person who made it, then rate your meal.")}</span></li>
        </ol>
      </Floor>

      <Floor id="cooks" n="1" onLit={setAt} art={<WinTable />}>
        <p className="bd-kicker">{t("For cooks")}</p>
        <h2 className="bd-h">{t("Cook for more, spend less.")}</h2>
        <p className="bd-p">{t("Cooking for six costs barely more than cooking for two. Open your table in four steps, your guests chip in for the groceries.")}</p>
        <a className="bd-btn" href="bite.html?host">{t("Start hosting")}</a>
      </Floor>

      <Floor id="safety" n="0" onLit={setAt} art={<Entrance />}>
        {/* the house rules, pinned next to the door like every Hausordnung */}
        <div className="bd-rules">
          <i className="bd-pin" aria-hidden /><i className="bd-pin r" aria-hidden />
          <p className="bd-rules-h">{t("House rules")}</p>
          <p className="bd-rules-sub">{t("Safety isn't a feature. It's the product.")}</p>
          <ul>
            <li>{t("Reviews after every dinner, both ways")}</li>
            <li>{t("Report or block anyone in one tap")}</li>
            <li>{t("A price cap: nobody makes a profit")}</li>
            <li>{t("Help by email: hello@bitetable.de")}</li>
            <li className="soon">{t("ID checks for hosts")} <em>({t("coming")})</em></li>
            <li className="soon">{t("Payments in the app")} <em>({t("coming")})</em></li>
          </ul>
          <p className="bd-rules-sign">{t("The house management")}</p>
        </div>

        {/* the doorbell panel: the founders live here */}
        <a className="bd-bells" href="#about" aria-label={t("About us")}>
          <span className="bd-bells-top">Bite · 1. OG</span>
          {["Operti", "Maquerre", "El-Ouni"].map((n) => <span key={n} className="bd-bell"><em>{n}</em><i /></span>)}
          <span className="bd-bells-grille" aria-hidden />
        </a>
      </Floor>

      {/* the doormat: into the app */}
      <section id="how" className="bd-mat">
        <span className="bd-mat-rug">{t("Welcome")}</span>
        <p>{t("The real app, in your browser. No download needed.")}</p>
        <a className="bd-btn light" href="bite.html">{t("Open the app")}</a>
      </section>
    </div>
  );
}

/** the front door with its light, a plant and the bike */
function Entrance() {
  return (
    <svg className="bd-door" viewBox="0 0 300 220" aria-hidden>
      <rect x="96" y="20" width="108" height="200" rx="54" className="bd-door-arch" />
      <rect x="108" y="32" width="84" height="188" rx="42" className="bd-door-wood" />
      <path d="M150 34v186" className="bd-door-line" />
      <rect x="116" y="44" width="68" height="40" rx="20" className="bd-door-glass" />
      <circle cx="176" cy="132" r="4" className="bd-door-knob" />
      <circle cx="150" cy="8" r="7" className="bd-door-lamp" />
      <ellipse cx="150" cy="40" rx="70" ry="44" className="bd-door-glow" />
      <g transform="translate(36 160)"><rect x="-14" y="22" width="28" height="38" rx="4" fill="#7a4a2a" /><circle cx="0" cy="12" r="18" fill="#3f8f3a" /><circle cx="-12" cy="22" r="12" fill="#4f9d48" /><circle cx="12" cy="20" r="12" fill="#367d39" /></g>
      <g className="bd-bike" transform="translate(250 196)"><circle r="18" /><circle cx="-46" r="18" /><path d="M0 0l-18-30h-16l-12 30M-18-30l-6 30M-34-30l-4-8" /></g>
    </svg>
  );
}
