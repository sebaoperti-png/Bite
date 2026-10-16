// SAFETY — a scroll story. The section sticks to the screen while four protection layers lock,
// one by one, around a glowing shield; when all four are closed the shield seals and the
// headline "It's the product." takes over. On phones (or with reduced motion) the same story
// plays on its own once the section is on screen, without locking the scroll.
import { useEffect, useRef, useState } from "react";
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


// The orbit the layer icons travel on, and the shield outline (drawn large in the middle)
const ORBIT = 262;
const SHIELD = "M300 128l132 50v110c0 88-56 152-132 180-76-28-132-92-132-180V178l132-50z";

// What the safety receipt lists at the end
const RECEIPT = [
  { k: "Host verification", v: "4 steps" },
  { k: "In-app payments", v: "100%" },
  { k: "Data protection", v: "GDPR" },
  { k: "Insurance", v: "every event" },
];
const FINAL = 5; // stage after the 4 layers: the seal

/** Scroll progress through the tall wrapper (desktop), or a timed sequence (phones) → stage 0…5 */
function useStage(wrapRef: React.RefObject<HTMLDivElement>) {
  const [stage, setStage] = useState(0);
  const [scrolly, setScrolly] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 821px) and (prefers-reduced-motion: no-preference)");
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
          // 0–8% intro, four layers until 72%, then the seal
          setStage(p < 0.08 ? 0 : p < 0.24 ? 1 : p < 0.4 ? 2 : p < 0.56 ? 3 : p < 0.72 ? 4 : FINAL);
        });
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
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
  const current = locked > 0 ? LAYERS[locked - 1] : null;

  return (
    <section className="dk-out-light sh-section" id="safety">
      <div ref={wrapRef} className={`sh-wrap ${scrolly ? "scrolly" : ""}`}>
        <div className={`sh-sticky ${sealed ? "sealed" : ""}`}>
          <div className="sh-bg" aria-hidden />

          {/* Left: the claim, the layer list and, at the end, the big reveal */}
          <div className="sh-left">
            <span className="sh-eyebrow">{t("TRUST & SAFETY")}</span>
            <h2 className="sh-title">{t("Safety isn't a feature.")}</h2>
            <p className="sh-reveal">{t("It's the product.")}</p>

            <div className="sh-steps">
              <div className="sh-count">
                <b>{locked}/4</b> {t("layers locked")}
                <span className="sh-count-bar"><span style={{ width: `${(locked / 4) * 100}%` }} /></span>
              </div>
              {LAYERS.map((l, i) => (
                <div key={l.title} className={`sh-step ${i < locked ? "done" : ""} ${i === locked - 1 && !sealed ? "now" : ""}`}>
                  <span className="sh-step-icon" aria-hidden>
                    {i < locked ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{l.icon}</svg>
                    )}
                  </span>
                  {t(l.title)}
                </div>
              ))}
            </div>

          </div>

          {/* Centre: a big shield; the four layer icons orbit around it and light up as they lock */}
          <div className="sh-stage" aria-hidden>
            <svg viewBox="0 0 600 600" className="sh-svg">
              <defs>
                <radialGradient id="sh-core" cx="50%" cy="40%" r="60%">
                  <stop offset="0" stopColor="#c48dff" />
                  <stop offset="0.55" stopColor="#6b21d9" />
                  <stop offset="1" stopColor="#32097a" />
                </radialGradient>
                <linearGradient id="sh-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e3d0ff" />
                  <stop offset="1" stopColor="#9b4aff" />
                </linearGradient>
                <linearGradient id="sh-shine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.5" stopColor="#fff" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <clipPath id="sh-clip"><path d={SHIELD} /></clipPath>
              </defs>

              <circle cx="300" cy="300" r="210" className="sh-halo" />

              <g className="sh-orbit">
                <circle cx="300" cy="300" r={ORBIT} className="sh-ring-track" />
                <circle cx="300" cy="300" r={ORBIT} className="sh-ring-fill" pathLength={1} transform="rotate(-90 300 300)" style={{ strokeDashoffset: 1 - locked / 4 }} />
                {LAYERS.map((l, i) => {
                  const a = ((-90 + i * 90) * Math.PI) / 180;
                  return (
                    <g key={l.title} transform={`translate(${300 + Math.cos(a) * ORBIT} ${300 + Math.sin(a) * ORBIT})`}>
                      <g className={`sh-badge ${i < locked ? "on" : ""}`}>
                        <circle r="30" />
                        <g transform="translate(-14 -14) scale(1.17)" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{l.icon}</g>
                      </g>
                    </g>
                  );
                })}
              </g>

              <g className="sh-shield">
                <path d={SHIELD} fill="url(#sh-core)" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                <g clipPath="url(#sh-clip)"><rect className="sh-sweep" x="120" y="100" width="120" height="420" fill="url(#sh-shine)" transform="rotate(18 300 300)" /></g>
                <path className="sh-check" d="M246 306l38 38 76-84" fill="none" stroke="#fff" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
                <g className="sh-lock">
                  <rect x="262" y="290" width="76" height="62" rx="12" fill="#fff" />
                  <path d="M276 290v-18a24 24 0 0 1 48 0v18" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
                  <circle cx="300" cy="316" r="8" fill="#6b21d9" />
                  <rect x="296" y="318" width="8" height="18" rx="4" fill="#6b21d9" />
                </g>
              </g>
            </svg>
          </div>

          {/* Right: what the layer that just locked covers */}
          <div className="sh-right">
            {sealed ? (
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
              <div key={current.title} className="sh-card">
                <span className="sh-card-num">0{locked}</span>
                <span className="sh-card-icon" aria-hidden>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{current.icon}</svg>
                </span>
                <h3>{t(current.title)}</h3>
                <ul>{current.points.map((p) => <li key={p}>{t(p)}</li>)}</ul>
              </div>
            ) : (
              <div className="sh-card sh-hint">
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
