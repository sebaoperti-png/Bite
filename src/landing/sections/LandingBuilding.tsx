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

/* ---------- the windows (one SVG each, 300×200) ---------- */

/** a German "Kreuzstock" window: room behind, pendant lamp, folded curtains, bevelled frame, stone sill */
function Frame({ children, lit, box, front }: { children: React.ReactNode; lit: "cold" | "warm"; box?: boolean; /** drawn over the frame: things stuck on the glass or popping out */ front?: React.ReactNode }) {
  return (
    <svg className={`bd-win ${lit}`} viewBox="0 0 300 206" aria-hidden>
      <defs>
        <radialGradient id={`bd-glow-${lit}`} cx="50%" cy="20%" r="70%"><stop offset="0" className="bd-glow-a" /><stop offset="1" className="bd-glow-b" /></radialGradient>
      </defs>
      <rect x="0" y="0" width="300" height="190" className="bd-win-room" />
      <rect x="0" y="0" width="300" height="190" fill={`url(#bd-glow-${lit})`} className="bd-win-glow" />
      {/* back wall: a faint wallpaper and the skirting board */}
      <g className="bd-wall">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${12 + i * 22} 0v152`} />)}</g>
      <rect x="0" y="152" width="300" height="38" className="bd-win-floor" />
      <path d="M0 152h300" className="bd-skirting" />
      {/* pendant lamp */}
      <path d="M150 0v8" className="bd-cord" />
      <path d="M136 22l5-14h18l5 14z" className="bd-shade" />
      <ellipse cx="150" cy="23" rx="6" ry="2.6" className="bd-lamp" />
      {children}
      {/* curtains with folds, tied back */}
      <path d="M10 6c8 0 18 2 24 0c-3 40-12 70-9 104c3 26 7 50 4 78h-19z" className="bd-curtain" />
      <path d="M18 14c-2 50 4 96 0 172M26 12c-3 40 1 80-3 110" className="bd-fold" />
      <path d="M290 6c-8 0-18 2-24 0c3 40 12 70 9 104c-3 26-7 50-4 78h19z" className="bd-curtain" />
      <path d="M282 14c2 50-4 96 0 172M274 12c3 40-1 80 3 110" className="bd-fold" />
      <path d="M8 112q10 6 20-2M292 112q-10 6-20-2" className="bd-tie" />
      {/* glass sheen */}
      <path d="M60 10l40 0l-60 90l0-40z M190 10l26 0l-50 76l0-26z" className="bd-sheen" />
      {/* frame: outer, bevel, mullion, transom */}
      <rect x="4" y="4" width="292" height="182" className="bd-win-frame" />
      <rect x="9" y="9" width="282" height="172" className="bd-win-bevel" />
      <path d="M150 4v182M4 40h292" className="bd-win-bar" />
      <path d="M152 8v176M8 42h288" className="bd-win-bar-hi" />
      {/* sill (and a flower box on some floors) */}
      <path d="M-8 186h316l-6 12h-304z" className="bd-win-sill" />
      {box && <g className="bd-box"><rect x="196" y="170" width="92" height="18" rx="3" />{[206, 222, 238, 254, 270].map((x, i) => <g key={x}><path d={`M${x} 170q-4-14 2-22`} className="bd-stem" /><circle cx={x + 2} cy={148 + (i % 2) * 6} r="6" className={i % 2 ? "bd-bloom b" : "bd-bloom"} /></g>)}</g>}
      {front}
    </svg>
  );
}

type Look = { skin: string; shirt: string; hair: string; style?: "short" | "bun" | "long" | "curly" | "grey" };

/** a person seen from the front, at a table whose top is at y=148: head, neck, shoulders, arms resting, hands */
function Person({ x, look, mood = "happy", phone, raise }: { x: number; look: Look; mood?: "happy" | "sad"; phone?: boolean; raise?: boolean }) {
  const { skin, shirt, hair, style = "short" } = look;
  return (
    <g transform={`translate(${x} 0)`}>
      {style === "long" && <path d="M-22 74c-2 30 2 52 8 66h28c6-14 10-36 8-66z" fill={hair} />}
      <path d="M-34 152c0-30 12-44 34-46c22 2 34 16 34 46z" fill={shirt} />
      <path d="M-34 152c0-30 12-44 34-46" className="bd-shade-line" />
      <rect x="-6" y="96" width="12" height="12" rx="3" fill={skin} />
      <ellipse cx="-20" cy="80" rx="3.5" ry="5" fill={skin} /><ellipse cx="20" cy="80" rx="3.5" ry="5" fill={skin} />
      <ellipse cx="0" cy="78" rx="19" ry="21" fill={skin} />
      {style === "short" && <path d="M-19 74c-2-16 8-24 19-24s21 8 19 24c-4-8-10-11-19-11s-15 3-19 11z" fill={hair} />}
      {style === "bun" && <><circle cx="0" cy="52" r="9" fill={hair} /><path d="M-19 76c-2-16 8-24 19-24s21 8 19 24c-6-9-12-12-19-12s-13 3-19 12z" fill={hair} /></>}
      {style === "long" && <path d="M-20 80c-3-20 6-30 20-30s23 10 20 30c-6-12-12-15-20-15s-14 3-20 15z" fill={hair} />}
      {style === "curly" && <g fill={hair}>{[[-15, 62], [-6, 56], [5, 56], [14, 62], [18, 72], [-18, 72]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="8" />)}</g>}
      {style === "grey" && <g fill={hair}><path d="M-19 76c-2-14 8-22 19-22s21 8 19 22c-5-6-12-8-19-8s-14 2-19 8z" /><circle cx="-17" cy="70" r="7" /><circle cx="17" cy="70" r="7" /></g>}
      {mood === "sad"
        ? <><path d="M-9 76q3-2 6 0M3 76q3-2 6 0" className="bd-eyes" /><path d="M-5 90q5-4 10 0" className="bd-mouth" /></>
        : <><circle cx="-6.5" cy="77" r="2" className="bd-eye" /><circle cx="6.5" cy="77" r="2" className="bd-eye" /><path d="M-6 87q6 6 12 0" className="bd-mouth" /><circle cx="-11" cy="85" r="3.5" className="bd-blush" /><circle cx="11" cy="85" r="3.5" className="bd-blush" /></>}
      {/* arms and hands on the table */}
      {raise
        ? <><path d="M22 120q14-10 16-34" className="bd-arm" stroke={shirt} /><circle cx="38" cy="84" r="5" fill={skin} /><path d="M33 64h10l-2 16h-6z" className="bd-glass" /></>
        : <path d="M24 122q6 18-4 26" className="bd-arm" stroke={shirt} />}
      <path d="M-24 122q-6 18 4 26" className="bd-arm" stroke={shirt} />
      <ellipse cx="-18" cy="148" rx="6" ry="4" fill={skin} />
      {!raise && <ellipse cx="18" cy="148" rx="6" ry="4" fill={skin} />}
      {phone && <>
        <path d="M-2 96L-30 150h56z" className="bd-phone-light" />
        <rect x="8" y="134" width="13" height="20" rx="3" fill="#1d1d2b" transform="rotate(-10 14 144)" /><rect x="10" y="136" width="9" height="15" rx="1.5" fill="#bfe3ff" transform="rotate(-10 14 144)" />
      </>}
    </g>
  );
}

function Table({ x1, x2 }: { x1: number; x2: number }) {
  return <><rect x={x1} y="146" width={x2 - x1} height="8" rx="3" className="bd-table" /><rect x={x1} y="154" width={x2 - x1} height="5" className="bd-table-edge" /></>;
}

function WinAlone() {
  return (
    <Frame lit="cold">
      {/* a small framed picture and a clock: late again */}
      <rect x="196" y="74" width="34" height="26" rx="2" className="bd-picture" /><path d="M200 96l9-10 7 6 6-8 6 12z" className="bd-picture-art" />
      <circle cx="82" cy="84" r="12" className="bd-clock" /><path d="M82 84v-7M82 84l5 3" className="bd-hands" />
      <Person x={138} look={{ skin: "#f1c7a3", shirt: "#5b7fe0", hair: "#3a2a20" }} mood="sad" phone />
      <Table x1={96} x2={210} />
      <ellipse cx="180" cy="146" rx="20" ry="5" className="bd-plate" /><ellipse cx="180" cy="144.5" rx="11" ry="2.8" className="bd-food dull" />
      <g className="bd-rain">{[[44, 20], [86, 74], [236, 30], [262, 100], [118, 18], [206, 90], [60, 120], [244, 140]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l-4 16`} />)}</g>
      <g className="bd-drops">{[[70, 40], [228, 64], [110, 130], [256, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" />)}</g>
    </Frame>
  );
}

function WinReceipt() {
  return (
    <Frame lit="warm" box front={<>
      {/* the receipt taped to the glass */}
      <g className="bd-receipt" transform="translate(-4 10) rotate(-4 212 96)">
        <path d="M160 24h104v124l-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5-6.5 5-6.5-5z" className="bd-paper" />
        <rect x="192" y="16" width="40" height="14" className="bd-tape" transform="rotate(6 212 23)" />
        <text x="212" y="46" textAnchor="middle" className="bd-rc-h">{t("BITE · TABLE 1")}</text>
        <text x="168" y="70" className="bd-rc">{t("groceries")}</text><text x="256" y="70" textAnchor="end" className="bd-rc">{money(48)}</text>
        <text x="168" y="88" className="bd-rc">{t("÷ 8 plates")}</text>
        <path d="M168 100h88" className="bd-rc-rule" />
        <text x="168" y="116" className="bd-rc">{t("per plate")}</text><text x="256" y="136" textAnchor="end" className="bd-rc big">{money(6)}</text>
      </g>
      </>}>
      {/* the kitchen counter with the shopping */}
      <rect x="18" y="136" width="128" height="16" rx="2" className="bd-counter" />
      <path d="M36 138l7-44h46l7 44z" className="bd-bag" /><path d="M52 94q14-20 28 0" className="bd-bag-handle" />
      <path d="M56 96l4-26" stroke="#4f9d48" strokeWidth="6" strokeLinecap="round" /><circle cx="70" cy="92" r="8" fill="#e85d4a" /><circle cx="48" cy="96" r="7" fill="#f2b13b" />
      <rect x="104" y="96" width="12" height="40" rx="5" className="bd-bottle" /><rect x="107" y="88" width="6" height="10" rx="2" className="bd-bottle" />
      <ellipse cx="132" cy="132" rx="12" ry="5" fill="#d9a35b" />
    </Frame>
  );
}

function WinPhone() {
  return (
    <Frame lit="cold" front={<>
      {/* the note on the phone, big */}
      <g className="bd-note">
        <rect x="160" y="64" width="128" height="98" rx="14" className="bd-note-card" />
        <circle cx="176" cy="81" r="7" fill="#6b21d9" />
        <text x="188" y="85" className="bd-nt-app">{t("BITE · now")}</text>
        <text x="170" y="108" className="bd-nt">{t("Amina, 1st floor:")}</text>
        <text x="170" y="124" className="bd-nt">{t("tajine tonight")}</text>
        <rect x="212" y="132" width="68" height="22" rx="11" fill="#6b21d9" /><text x="246" y="147" textAnchor="middle" className="bd-nt-join">{t("Join")}</text>
      </g>
      </>}>
      {/* the sofa */}
      <path d="M18 112h120a10 10 0 0 1 10 10v30H8v-30a10 10 0 0 1 10-10z" className="bd-sofa" />
      <Person x={80} look={{ skin: "#c48a5f", shirt: "#ee7a59", hair: "#1e1611", style: "curly" }} />
      <rect x="8" y="140" width="140" height="14" rx="4" className="bd-sofa-seat" />
    </Frame>
  );
}

function WinTable() {
  const people: [number, Look, boolean][] = [
    [62, { skin: "#f1c9a5", shirt: "#ff8fab", hair: "#1d1a24", style: "bun" }, false],
    [112, { skin: "#e8b48f", shirt: "#2a9d8f", hair: "#5b3a24" }, true],
    [164, { skin: "#a8714b", shirt: "#f4f0ea", hair: "#1b1410", style: "long" }, false],
    [244, { skin: "#f2cdb5", shirt: "#7b9acc", hair: "#e9e6ef", style: "grey" }, false],
  ];
  return (
    <Frame lit="warm" box>
      <path d="M14 20q68 26 136 0t136 0" className="bd-string" />
      {[34, 64, 94, 124, 154, 184, 214, 244, 270].map((x, i) => <circle key={x} cx={x} cy={20 + 8 * Math.sin((i / 8) * Math.PI * 2)} r="3.6" className="bd-bulb" style={{ animationDelay: `${i * 0.2}s` }} />)}
      {people.map(([x, look, raise]) => <Person key={x} x={x} look={look} raise={raise} />)}
      {/* the free chair, with its reserved card */}
      <path d="M188 150v-46a12 12 0 0 1 12-12h8a12 12 0 0 1 12 12v46" className="bd-free" />
      <Table x1={14} x2={286} />
      {[62, 112, 164, 204, 244].map((x) => <ellipse key={x} cx={x} cy="146" rx="14" ry="4" className="bd-plate" />)}
      <path d="M196 144l8-12l8 12z" className="bd-tent" />
      {/* the tajine, lid lifted */}
      <ellipse cx="138" cy="145" rx="16" ry="5" fill="#b5562d" /><path d="M130 134l10-18l6 7z" fill="#c96a3a" />
      <path d="M132 130c-4-6 4-9 0-15M142 126c-4-6 4-9 0-15" className="bd-steam" />
    </Frame>
  );
}

/** the ground floor: the lobby and the lift. The arc dial comes down to E, it dings, the doors slide open */
function Lift() {
  const marks = ["E", "1", "2", "3", "4"];
  return (
    <svg className="bd-liftart" viewBox="0 0 300 270" aria-hidden>
      <defs>
        <linearGradient id="bd-steel" x1="0" x2="1"><stop offset="0" stopColor="#8d869c" /><stop offset=".45" stopColor="#d9d4e2" /><stop offset=".55" stopColor="#c4bed0" /><stop offset="1" stopColor="#7d7690" /></linearGradient>
        <radialGradient id="bd-cabin" cx="50%" cy="10%" r="90%"><stop offset="0" stopColor="#ffe1a6" /><stop offset="1" stopColor="#c98a3f" /></radialGradient>
        <clipPath id="bd-shaft"><rect x="86" y="74" width="128" height="176" /></clipPath>
      </defs>
      {/* lobby: tiled wainscot and a chequered floor */}
      <rect x="0" y="0" width="300" height="250" className="bd-lobby" />
      <g className="bd-tiles">{Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${i * 20} 170v80`} />)}<path d="M0 170h300" /></g>
      <g className="bd-floor-tiles">{Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 30 + (i % 2 ? 0 : 0)} y="250" width="15" height="20" />)}</g>
      {/* the arc indicator above the doors */}
      <g transform="translate(150 54)">
        <path d="M-40 0a40 40 0 0 1 80 0" className="bd-dial" />
        {marks.map((m, i) => { const a = Math.PI + (i / 4) * Math.PI; return <text key={m} x={Math.cos(a) * 30} y={Math.sin(a) * 30 + 4} textAnchor="middle" className="bd-dial-n">{m}</text>; })}
        <path d="M0 0L0 -26" className="bd-needle" />
        <circle r="4" className="bd-needle-hub" />
        <circle cx="52" cy="-6" r="5" className="bd-ding" />
      </g>
      {/* the cabin behind the doors: warm light, mirror, rail, the "1" button glowing */}
      <g clipPath="url(#bd-shaft)">
        <rect x="86" y="74" width="128" height="176" fill="url(#bd-cabin)" />
        <rect x="104" y="90" width="92" height="96" rx="3" className="bd-mirror" /><path d="M118 100l30 76M136 100l26 64" className="bd-mirror-shine" />
        <path d="M96 196h108" className="bd-rail" />
        <rect x="186" y="140" width="16" height="40" rx="3" className="bd-panel" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx="194" cy={174 - i * 7.5} r="2.6" className={i === 1 ? "bd-btn-1" : "bd-btn-n"} />)}
        <rect x="86" y="236" width="128" height="14" className="bd-cabin-floor" />
      </g>
      {/* the doors */}
      <g className="bd-door-l"><rect x="86" y="74" width="64" height="176" fill="url(#bd-steel)" /><path d="M146 74v176" className="bd-door-edge" /></g>
      <g className="bd-door-r"><rect x="150" y="74" width="64" height="176" fill="url(#bd-steel)" /><path d="M154 74v176" className="bd-door-edge" /></g>
      {/* the surround */}
      <path d="M78 250V66h144v184" className="bd-surround" />
      {/* call button */}
      <rect x="236" y="140" width="22" height="36" rx="4" className="bd-call" /><path d="M247 150l-5 7h10z" className="bd-call-up" /><circle cx="247" cy="166" r="3" className="bd-call-dn" />
      {/* plant and bike */}
      <g transform="translate(38 196)"><path d="M-14 54l4-30h20l4 30z" fill="#7a4a2a" /><circle cx="0" cy="12" r="18" fill="#3f8f3a" /><circle cx="-12" cy="22" r="12" fill="#4f9d48" /><circle cx="12" cy="20" r="12" fill="#367d39" /></g>
    </svg>
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

      <Floor id="safety" n="0" onLit={setAt} art={<Lift />}>
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
