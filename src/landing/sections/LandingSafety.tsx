// SAFETY — a scroll story. The section sticks to the screen while four protection layers lock,
// one by one, each setting one thing on a table; when all four are set a cloche reveals the Bite "b" and the
// headline "It's the product." takes over — on phones too, in a compact layout that fits one screen. With reduced
// motion the story plays on its own once the section is on screen, without locking the scroll.
import { useEffect, useRef, useState } from "react";
import { Course } from "../../shared/Restaurant";
import { t } from "../../shared/i18n";

const LAYERS = [
  {
    title: "Personal safety",
    icon: <><path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5L12 3z" /><path d="M9 12l2 2 4-4" /></>,
    points: ["Hosts verified: ID, video call, meal tasting & references", "Group dinners first — never anonymous 1-on-1", "Two-way reviews & ratings after every meal"],
  },
  {
    title: "Food safety & hygiene",
    icon: <><line x1="4" y1="18" x2="20" y2="18" /><path d="M5 18a7 7 0 0 1 14 0" /><line x1="12" y1="5" x2="12" y2="8" /><circle cx="12" cy="4" r="1" /></>,
    points: ["Host hygiene & allergen guidelines", "Sample-meal tasting during onboarding", "Dedicated food-quality rating on every meal"],
  },
  {
    title: "Payments",
    icon: <><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="7" y1="14.5" x2="11" y2="14.5" /></>,
    points: ["100% in-app secure payments via Stripe", "No off-platform cash — always a trail", "Event insurance in place on every booking"],
  },
  {
    title: "Data & privacy",
    icon: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15.5" r="1" /></>,
    points: ["GDPR-compliant by design", "Data minimization — only what's needed", "Consent-based & fully user-controlled"],
  },
];

// What each layer puts on the table, drawn small for its menu page (same objects as the table scene)
const ART = [
  <><path d="M30 8h18l-2 14a7 7 0 0 1-14 0z" /><path d="M39 29v20M31 52h16" /><path d="M54 40h30l3 12H51z" /><path d="M62 46l3 3 6-6" /></>,
  <><ellipse cx="48" cy="40" rx="34" ry="14" /><ellipse cx="48" cy="38" rx="20" ry="7" /><path d="M72 10l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM22 14l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4z" /></>,
  <><path d="M30 8v14a5 5 0 0 0 10 0V8M35 8v48" /><path d="M62 8c-6 0-8 14-8 24h8v24" /><rect x="70" y="30" width="20" height="14" rx="2" /><path d="M70 35h20" /></>,
  <><rect x="10" y="12" width="76" height="44" rx="6" /><rect x="16" y="18" width="64" height="32" rx="4" strokeDasharray="3 4" /><rect x="40" y="31" width="16" height="12" rx="2" /><path d="M43 31v-4a5 5 0 0 1 10 0v4" /></>,
];

// What the safety receipt lists at the end
const RECEIPT = [
  { k: "Host verification", v: "4 steps" },
  { k: "In-app payments", v: "100%" },
  { k: "Data protection", v: "GDPR" },
  { k: "Insurance", v: "every event" },
];

const FINAL = 5; // stage after the 4 layers: the seal
// where in the scroll (0–1) each layer locks, and where the seal comes
const STARTS = [0.08, 0.24, 0.4, 0.56, 0.72];

/** Scroll progress through the tall wrapper (desktop and phones), or a timed sequence (reduced motion) → stage 0…5 */
function useStage(wrapRef: React.RefObject<HTMLDivElement>) {
  const [stage, setStage] = useState(0);
  const [scrolly, setScrolly] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: no-preference)"); // phones too: a compact one-screen layout (landing.css)
    const update = () => setScrolly(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (scrolly) {
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
          // while the story holds the screen, floating buttons step aside (phones: they would cover the card)
          document.body.classList.toggle("sh-active", r.top <= 0 && r.bottom >= window.innerHeight);
          // 0–8% intro, four layers until 72%, then the seal
          setStage(p < STARTS[0] ? 0 : p < STARTS[1] ? 1 : p < STARTS[2] ? 2 : p < STARTS[3] ? 3 : p < STARTS[4] ? 4 : FINAL);
        });
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); document.body.classList.remove("sh-active"); };
    }
    // Phones: play the story once it is on screen
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || timer) return;
      let s = 0;
      timer = window.setInterval(() => { s += 1; setStage(s); if (s >= FINAL) window.clearInterval(timer); }, 1100);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [scrolly, wrapRef]);

  return { stage, scrolly };
}

export function LandingSafety() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { stage, scrolly } = useStage(wrapRef);
  const locked = Math.min(stage, 4);
  const sealed = stage >= FINAL;
  // phones: tapping a bubble shows that layer's card (until the scroll moves on)
  const [picked, setPicked] = useState<number | null>(null);
  useEffect(() => { setPicked(null); }, [stage]);
  const shownIdx = picked ?? (locked > 0 ? locked - 1 : -1);
  const current = shownIdx >= 0 && (!sealed || picked !== null) ? LAYERS[shownIdx] : null;

  // tapping a bubble that is not locked yet scrolls to the moment it locks (so it pops)
  const goTo = (i: number) => {
    const el = wrapRef.current;
    if (!el || !scrolly) { setPicked(i); return; }
    if (i < locked) { setPicked(i); return; }
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * (STARTS[i] + 0.03), behavior: "smooth" });
  };

  return (
    <section className="dk-out-light sh-section" id="safety" style={{ position: "relative", isolation: "isolate", ["--dust-top" as string]: "0px", ["--dust-bottom" as string]: "380px" }}>
      <div className="chalk-dust" aria-hidden />
      <div ref={wrapRef} className={`sh-wrap ${scrolly ? "scrolly" : ""}`}>
        <div className={`sh-sticky ${sealed ? "sealed" : ""}`}>
          <div className="sh-bg" aria-hidden />

          {/* Left: the claim, the layer list and, at the end, the big reveal */}
          <div className="sh-left">
            <Course n={6} name={t("House rules")} light size={22}>{t("trust & safety")}</Course>
            <h2 className="sh-title">{t("Safety isn't a feature.")}</h2>
            <p className="sh-reveal">{t("It's the product.")}<span className="sh-sparkles" aria-hidden><i style={{ ["--x" as string]: "2%", ["--y" as string]: "10%", ["--d" as string]: "0.1s", ["--s" as string]: 1 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "18%", ["--y" as string]: "-30%", ["--d" as string]: "0.35s", ["--s" as string]: 0.7 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "46%", ["--y" as string]: "-24%", ["--d" as string]: "0.2s", ["--s" as string]: 1.2 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "70%", ["--y" as string]: "-34%", ["--d" as string]: "0.5s", ["--s" as string]: 0.8 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "96%", ["--y" as string]: "4%", ["--d" as string]: "0.3s", ["--s" as string]: 1 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "88%", ["--y" as string]: "90%", ["--d" as string]: "0.6s", ["--s" as string]: 0.7 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "58%", ["--y" as string]: "104%", ["--d" as string]: "0.45s", ["--s" as string]: 0.9 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "26%", ["--y" as string]: "96%", ["--d" as string]: "0.25s", ["--s" as string]: 0.6 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "-4%", ["--y" as string]: "60%", ["--d" as string]: "0.55s", ["--s" as string]: 0.8 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i><i style={{ ["--x" as string]: "104%", ["--y" as string]: "52%", ["--d" as string]: "0.15s", ["--s" as string]: 0.6 }}><svg viewBox="0 0 20 20"><path d="M10 0c.8 5.2 4 8.6 10 10-6 1.4-9.2 4.8-10 10-.8-5.2-4-8.6-10-10 6-1.4 9.2-4.8 10-10z" /></svg></i></span></p>

            {/* The waiter's check before service: a paper slip, one line per layer, ticked by hand as it locks */}
            <div className={`sh-steps os ${sealed ? "sealed" : ""}`}>
              <div className="os-head">
                <span>{t("Table 07")}</span>
                <b>{t("Before service")}</b>
              </div>
              <ol className="os-list">
                {LAYERS.map((l, i) => {
                  const done = i < locked;
                  const now = i === locked - 1 && !sealed;
                  return (
                    <li key={l.title} className={`os-row ${done ? "done" : ""} ${now ? "now" : ""}`}>
                      <span className="os-num">0{i + 1}</span>
                      <span className="os-name">{t(l.title)}</span>
                      <i className="os-dots" aria-hidden />
                      <svg className="os-tick" viewBox="0 0 28 24" aria-hidden><path d="M3 13c3 2 5 5 7 8 4-8 9-14 16-19" pathLength="1" /></svg>
                    </li>
                  );
                })}
              </ol>
              <div className="os-foot">
                <span className="os-plates" aria-hidden>
                  {LAYERS.map((l, i) => <i key={l.title} className={i < locked ? "on" : ""} />)}
                </span>
                <span><b>{locked}/4</b> {t("set")}</span>
              </div>
              <span className="os-stamp">{t("Ready to serve")}</span>
            </div>

          </div>

          {/* Centre: a table seen from above. Each layer of protection sets one thing on it, with a handwritten label:
              the glass and place card (verified people), the plate (food & hygiene), the cutlery and napkin (payments),
              the placemat (your data). At the end a cloche comes down on the plate and lifts to reveal the Bite "b". */}
          <div className={`tb ${sealed ? "sealed" : ""}`} aria-hidden>
            <svg viewBox="0 0 600 600" className="tb-svg">
              <defs>
                <radialGradient id="tb-cloth" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#fffdf7" /><stop offset="1" stopColor="#efe6d6" /></radialGradient>
                <pattern id="tb-weave" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 4h8M4 0v8" stroke="rgba(107,33,217,0.05)" strokeWidth="1" /></pattern>
                <linearGradient id="tb-steel" x1="0" x2="1"><stop offset="0" stopColor="#8f84a8" /><stop offset=".35" stopColor="#f4f1fa" /><stop offset=".6" stopColor="#c9c1da" /><stop offset="1" stopColor="#7d7296" /></linearGradient>
                <radialGradient id="tb-glass" cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#ffffff" stopOpacity=".95" /><stop offset=".55" stopColor="#dcd0f5" stopOpacity=".55" /><stop offset="1" stopColor="#b39ddb" stopOpacity=".7" /></radialGradient>
              </defs>
              {/* the table */}
              <circle cx="300" cy="300" r="262" fill="rgba(0,0,0,0.35)" transform="translate(0 14)" />
              <circle cx="300" cy="300" r="262" fill="url(#tb-cloth)" />
              <circle cx="300" cy="300" r="262" fill="url(#tb-weave)" />
              <circle cx="300" cy="300" r="246" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="2" strokeDasharray="2 7" />

              {/* 4 · placemat (data & privacy) */}
              <g className={`tb-item tb-mat ${locked >= 4 ? "on" : ""}`}>
                <rect x="118" y="168" width="364" height="270" rx="26" fill="#e9defb" />
                <rect x="130" y="180" width="340" height="246" rx="20" fill="none" stroke="#b39ddb" strokeWidth="2" strokeDasharray="5 6" />
                <g transform="translate(440 396)" fill="none" stroke="#6b21d9" strokeWidth="2.4" strokeLinecap="round"><rect x="-9" y="-3" width="18" height="14" rx="3" /><path d="M-5-3v-4a5 5 0 0 1 10 0v4" /></g>
              </g>
              {/* 3 · cutlery + napkin (payments) */}
              <g className={`tb-item tb-fork ${locked >= 3 ? "on" : ""}`}>
                <path d="M152 222l40-10 10 160-40 10z" fill="#fff" stroke="rgba(107,33,217,0.15)" strokeWidth="1.5" />
                <g transform="translate(172 300)"><rect x="-11" y="-8" width="22" height="15" rx="3" fill="none" stroke="#6b21d9" strokeWidth="2" /><path d="M-11-3h22" stroke="#6b21d9" strokeWidth="2" /></g>
                <path d="M170 210v40M162 210v18a8 8 0 0 0 16 0v-18M170 250v130" fill="none" stroke="#8f84a8" strokeWidth="6" strokeLinecap="round" />
              </g>
              <g className={`tb-item tb-knife ${locked >= 3 ? "on" : ""}`}>
                <path d="M432 208c-10 0-14 26-14 46h14v128" fill="none" stroke="#8f84a8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              {/* 2 · plate (food & hygiene) */}
              <g className={`tb-item tb-plate ${locked >= 2 ? "on" : ""}`}>
                <circle cx="300" cy="310" r="100" fill="rgba(46,16,96,0.12)" transform="translate(0 8)" />
                <circle cx="300" cy="310" r="100" fill="#fff" />
                <circle cx="300" cy="310" r="74" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="3" />
                <path className="tb-shine" d="M232 262a96 96 0 0 1 60-46" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
              </g>
              {/* the Bite "b" served on the plate at the end */}
              {/* the logo "b" (as on the app icon: one round bite out of the top right, with tooth marks), drawn in the logo's own coordinates and scaled onto the plate */}
              <g transform="translate(243 256) scale(0.2)" style={{ transformBox: "view-box", transformOrigin: "0 0" }}>
                <mask id="tb-bite" maskUnits="userSpaceOnUse" x="0" y="0" width="549" height="549">
                  <rect width="549" height="549" fill="#fff" />
                  <path d="M190 405q72 62 144 0" fill="none" stroke="#000" strokeWidth="26" strokeLinecap="round" />
                  <g className="tb-teeth" fill="#000">
                    <circle cx="446" cy="205" r="80" /><circle cx="416" cy="279" r="17" /><circle cx="368" cy="222" r="17" />
                  </g>
                </mask>
                <g className="tb-b">
                  <g mask="url(#tb-bite)" fill="#6b21d9">
                    <rect x="107" y="30" width="83" height="330" rx="41.5" />
                    <circle cx="285" cy="340" r="178" />
                  </g>
                </g>
              </g>
              {/* crumbs from the bite */}
              <g className="tb-crumbs">
                {[[16, -14], [24, 4], [10, -26], [28, -6], [18, 16], [6, -20]].map(([x, y], k) => (
                  <circle key={k} cx="324" cy="300" r={k % 2 ? 2.6 : 3.4} fill="#7c2ff0" style={{ ["--x" as string]: `${x}px`, ["--y" as string]: `${y}px`, ["--k" as string]: k }} />
                ))}
              </g>
              {/* 1 · glass + place card (verified people) */}
              <g className={`tb-item tb-glass ${locked >= 1 ? "on" : ""}`}>
                <circle cx="472" cy="166" r="36" fill="rgba(46,16,96,0.12)" transform="translate(4 8)" />
                <circle cx="472" cy="166" r="36" fill="url(#tb-glass)" stroke="rgba(107,33,217,0.25)" strokeWidth="2" />
                <circle className="tb-ripple" cx="472" cy="166" r="22" fill="none" stroke="rgba(107,33,217,0.25)" strokeWidth="1.5" />
              </g>
              <g className={`tb-item tb-card ${locked >= 1 ? "on" : ""}`}>
                <path d="M200 128h196l6 40H194z" fill="#fffdf7" stroke="rgba(107,33,217,0.2)" strokeWidth="1.5" />
                <text x="298" y="155" textAnchor="middle" fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="22" fill="#3b1a78">{t("Your host · verified")}</text>
                <circle cx="396" cy="128" r="11" fill="#0a9c62" /><path d="M391 128l3.5 3.5 6-7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </g>
              {/* the cloche that comes down and lifts at the end */}
              <g className="tb-cloche">
                <path d="M200 316a100 100 0 0 1 200 0z" fill="url(#tb-steel)" />
                <path d="M228 276a76 76 0 0 1 48-40" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".7" />
                <rect x="286" y="198" width="28" height="14" rx="7" fill="#7d7296" />
                <rect x="192" y="314" width="216" height="10" rx="5" fill="#6b5f86" />
              </g>
            </svg>
            {/* handwritten labels, each appears with its object */}
            {LAYERS.map((l, i) => (
              <span key={l.title} className={`tb-label l${i} ${i < locked ? "on" : ""}`}>{t(l.title)}</span>
            ))}
          </div>

          {/* Phones: the four layers as bubbles that pop when they lock (tap one to jump there) */}
          <div className="sh-bubbles" role="tablist" aria-label={t("Layers of protection")}>
            {LAYERS.map((l, i) => {
              const state = i < locked ? "popped" : i === locked && !sealed ? "next" : "idle";
              return (
                <button key={l.title} role="tab" aria-selected={shownIdx === i} className={`shb ${state} ${shownIdx === i ? "shown" : ""}`} onClick={() => goTo(i)} style={{ ["--i" as string]: i }}>
                  <span className="shb-bubble" aria-hidden />
                  <span className="shb-drops" aria-hidden>{Array.from({ length: 8 }, (_, k) => <i key={k} style={{ ["--a" as string]: `${k * 45}deg` }} />)}</span>
                  <span className="shb-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{i < locked ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : l.icon}</svg>
                  </span>
                  <span className="shb-label">{t(l.title)}</span>
                </button>
              );
            })}
          </div>

          {/* Right: what the layer that just locked covers, and the safety receipt at the end */}
          <div className="sh-right">
            {sealed && picked === null ? (
              <div className="sh-receipt-slot">
                <div className="sh-receipt">
                  <div className="sh-r-head">
                    <b>BITE</b>
                    <span>{t("Safety receipt")}</span>
                    <span>{t("Valid for every dinner")}</span>
                  </div>
                  <div className="sh-r-rule" />
                  {RECEIPT.map((r) => (
                    <div key={r.k} className="sh-r-row"><span>{t(r.k)}</span><i /><b>{t(r.v)} ✓</b></div>
                  ))}
                  <div className="sh-r-rule" />
                  <div className="sh-r-row sh-r-total"><span>{t("Trust violations tolerated")}</span><i /><b>0</b></div>
                  <p className="sh-r-small">{t("One trust violation means immediate suspension.")}</p>
                  <div className="sh-r-barcode" aria-hidden />
                  <span className="sh-stamp">{t("VERIFIED")}</span>
                </div>
              </div>
            ) : current ? (
              /* each layer as a page of the menu: what it puts on the table, drawn, then the "dish" and its description */
              <div key={current.title} className="sh-card mc">
                <div className="mc-top"><span>No. 0{shownIdx + 1}</span><i aria-hidden /><span>{t("House rule")}</span></div>
                <svg className="mc-art" viewBox="0 0 96 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ART[shownIdx]}</svg>
                <h3>{t(current.title)}</h3>
                <ul>{current.points.map((p) => <li key={p}>{t(p)}</li>)}</ul>
                <div className="mc-foot">{t("Served at every dinner")}</div>
              </div>
            ) : (
              <div className="sh-card mc sh-hint">
                <div className="mc-top"><span>{t("Tonight")}</span><i aria-hidden /><span>{t("House rules")}</span></div>
                <h3>{t("Every dinner is protected across four layers.")}</h3>
                <p>{scrolly ? t("Scroll to lock them, one by one ↓") : t("Watch them lock, one by one.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
