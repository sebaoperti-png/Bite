// BECOME A HOST — on the chalkboard: hosting as a recipe in four chalk-drawn steps (the step in focus is redrawn
// and circled by hand), and the call to action as a reservation card.
import { useEffect, useRef, useState } from "react";
import { RevealWords } from "../../shared/Motion";
import { t } from "../../shared/i18n";

export function LandingBecomeAHost() {
  return (
    <>
      <section className="r-pad-96 dk-into-dark" id="become-host" style={{ padding: "380px 24px 110px", position: "relative", isolation: "isolate", ["--dust-bottom" as string]: "0px" }}>
        <div className="chalk-dust" aria-hidden />
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span className="ht-eyebrow">{t("your first table, in four steps")}</span>
            {" "}
            <h2 className="r-h-46" style={{ fontSize: "76px", fontWeight: "900", letterSpacing: "-0.035em", margin: "10px 0 0", color: "#fff", lineHeight: "1.02" }}><RevealWords><span className="chalk-text">{t("Cook for more,")}</span><br />
              <span style={{ color: "#b87fff" }}>{t("spend less.")}</span></RevealWords>
              <svg className="chalk-line" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M4 10c40-7 80-8 120-4s90 6 172-2" /></svg>
            </h2>
            {" "}
            <p style={{ fontSize: "21px", color: "#c4b4e2", maxWidth: "760px", margin: "24px auto 0", lineHeight: "1.55" }}>{t("Cooking for six costs barely more than cooking for two. Open your table in four steps — your guests chip in for the groceries.")}</p>
          </div>
          {" "}
          {/* host steps: each one lights up in turn */}
          <HostSteps />
          {" "}
          <div style={{ textAlign: "center" }}>
            {/* the call to action as a reservation card with a tear-off stub */}
            <a href="bite.html?host" className="ht-cta">
              <span className="ht-cta-main"><small>{t("Reservation")}</small>{t("Start hosting")}</span>
              <span className="ht-cta-stub" aria-hidden>→</span>
            </a>
            {" "}

          </div>
        </div>
      </section>
    </>
  );
}

// Each step drawn in chalk (every stroke has pathLength 1 so it can be redrawn when the step lights up)
const STEPS: { title: string; text: string; art: React.ReactNode }[] = [
  { title: "Get verified", text: "A quick ID check, a short video call and a sample meal — so guests know who's cooking.",
    art: <><path pathLength={1} d="M34 58c-13-1-15-19-3-22 0-13 19-17 27-6 8-11 27-7 27 6 12 3 10 21-3 22v16H34z" /><path pathLength={1} d="M34 64h48" /><circle pathLength={1} cx="90" cy="76" r="13" /><path pathLength={1} d="M84 76l4 4 8-9" /></> },
  { title: "List your meal", text: "Add your menu, date and seats in 2 minutes. Our assistant can write the description for you.",
    art: <><rect pathLength={1} x="30" y="14" width="48" height="66" rx="3" /><path pathLength={1} d="M40 28h28M44 38h20M40 50h28M40 58h22M40 66h26" /><path pathLength={1} d="M84 70l18-34 6 3-18 34-7 4z" /></> },
  { title: "Welcome guests", text: "Chat with guests before the day and confirm who joins — it's always your table, your rules.",
    art: <><path pathLength={1} d="M30 30h22l-3 20a8 8 0 0 1-16 0z" /><path pathLength={1} d="M41 58v18M33 78h16" /><path pathLength={1} d="M68 30h22l-3 20a8 8 0 0 1-16 0z" /><path pathLength={1} d="M79 58v18M71 78h16" /><path pathLength={1} d="M60 22v-8M52 24l-5-6M68 24l5-6" /></> },
  { title: "Split the bill", text: "Scan your receipt and everyone pays an equal share in the app. No cash, no awkward maths.",
    art: <><path pathLength={1} d="M36 14h48v60l-6 4-6-4-6 4-6-4-6 4-6-4-6 4-6-4z" /><path pathLength={1} d="M44 28h32M44 38h24M44 48h28" /><path pathLength={1} d="M30 60h60" strokeDasharray="4 5" /><path pathLength={1} d="M24 86l10-6M60 92v-10M96 86l-10-6" /></> },
];
const NUMERALS = ["i", "ii", "iii", "iv"];
const STEP_MS = 2600;

function HostSteps() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { setVisible(e.isIntersecting); if (e.isIntersecting) setActive(0); }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hover || reduceMotion) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, visible, hover, reduceMotion]);

  return (
    <div ref={ref} className="ht-row" onMouseLeave={() => setHover(false)}>
      {/* the chalk texture, shared by every drawing */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="ht-chalk"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" /></filter>
      </svg>
      {STEPS.map((s, i) => (
        <div
          key={s.title}
          className={`ht-step ${i === active ? "on" : ""} ${i < active ? "done" : ""}`}
          onMouseEnter={() => { setHover(true); setActive(i); }}
          onClick={() => setActive(i)}
        >
          <div className="ht-art">
            <svg viewBox="0 0 120 100" aria-hidden>
              <g filter="url(#ht-chalk)" className="ht-draw">{s.art}</g>
              <path className="ht-circle" pathLength={1} filter="url(#ht-chalk)" d="M60 4C94 2 116 22 114 50S88 98 56 96 4 76 6 48 30 6 66 6" />
            </svg>
          </div>
          <div className="ht-num">{NUMERALS[i]}.</div>
          <div className="ht-title">{t(s.title)}</div>
          <div className="ht-text">{t(s.text)}</div>
          {i < STEPS.length - 1 && (
            <svg className="ht-arrow" viewBox="0 0 80 30" aria-hidden><path filter="url(#ht-chalk)" d="M4 20c18-14 40-16 64-6M60 6l9 8-11 5" /></svg>
          )}
        </div>
      ))}
    </div>
  );
}
