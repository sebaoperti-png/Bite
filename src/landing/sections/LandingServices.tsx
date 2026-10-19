// FOUR WAYS TO EAT — on the chalkboard: the ways to eat written up as today's specials, and beside them the pass,
// where a cloche comes down on the plate and lifts to serve the animated scene of the way you picked.
// Cycles on its own while visible; hover or tap a line to pick it.
import { useEffect, useRef, useState } from "react";
import { SCENES } from "./ServiceScenes";
import { Course } from "../../shared/Restaurant";
import { RevealWords } from "../../shared/Motion";
import { t } from "../../shared/i18n";

const CYCLE_MS = 4400;

const WAYS = [
  { title: "Pick-up", text: "Grab a home-cooked meal to go from a cook on your street.", tag: "Lunch on the way home" },
  { title: "Eat together", text: "Pull up a chair at someone's table and share the meal.", tag: "Small tables, up to 6" },
  { title: "Cook together", text: "Learn a recipe hands-on with a cook who's mastered it.", tag: "Take the recipe home" },
  { title: "Delivery", text: "We're working on it: soon you'll be able to have it dropped at your door, still warm.", tag: "Coming soon", soon: true },
];
const NUMERALS = ["i", "ii", "iii", "iv"];
const reduceMotionNow = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function LandingServices() {
  const [active, setActive] = useState(1);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lift, setLift] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setLift(false);
    const id = window.setTimeout(() => setLift(true), reduceMotionNow() ? 0 : 520);
    return () => window.clearTimeout(id);
  }, [active]);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hovering || reduceMotion) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % WAYS.length), CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [active, visible, hovering, reduceMotion]);

  return (
    <section ref={ref} className="r-pad-96 sv-dark" id="services" style={{ padding: "380px 24px", position: "relative", isolation: "isolate" }}>
      <div className="chalk-dust" aria-hidden />
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <Course n={4} name={t("Sides")} light size={28}>{t("four ways to eat")}</Course>
          <h2 className="r-h-44" style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "8px 0 0", color: "#fff" }}><span className="chalk-text"><RevealWords>{t("However you like your food")}</RevealWords></span><svg className="chalk-line" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M4 10c40-7 80-8 120-4s90 6 172-2" /></svg></h2>
          <p style={{ fontSize: "21px", color: "#c4b4e2", maxWidth: "720px", margin: "22px auto 0", lineHeight: 1.55 }}>{t("Take it home, pull up a chair or cook side by side — every option is home-cooked by a neighbour, and the cost is split fairly.")}</p>
        </div>

        <div className="sd" onMouseLeave={() => setHovering(false)}>
          {/* today's specials, in chalk */}
          <div className="sd-board">
            <span className="sd-board-title">{t("Today's specials")}</span>
            {WAYS.map((w, i) => (
              <button
                key={w.title}
                type="button"
                className={`sd-line ${i === active ? "on" : ""} ${w.soon ? "soon" : ""}`}
                aria-pressed={i === active}
                onMouseEnter={() => { setHovering(true); setActive(i); }}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="sd-n">{NUMERALS[i]}.</span>
                <span className="sd-name">{t(w.title)}<svg className="sd-ring" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M150 4C230 2 296 14 294 32S220 58 140 56 4 46 6 28 80 4 166 6" /></svg></span>
                <i className="sd-dots" aria-hidden />
                <span className="sd-tag">{t(w.tag)}</span>
              </button>
            ))}
          </div>

          {/* the pass: the cloche comes down and lifts to serve the picked way */}
          <div className="sd-pass">
            <div key={active} className={`sd-plate ${lift ? "lifted" : ""}`}>
              <div className="sd-scene">{(() => { const Scene = SCENES[active]; return <Scene />; })()}</div>
              <svg className="sd-cloche" viewBox="0 0 200 120" aria-hidden>
                <defs><linearGradient id="sd-steel" x1="0" x2="1"><stop offset="0" stopColor="#8f84a8" /><stop offset=".35" stopColor="#f4f1fa" /><stop offset=".6" stopColor="#c9c1da" /><stop offset="1" stopColor="#7d7296" /></linearGradient></defs>
                <path d="M14 108a86 86 0 0 1 172 0z" fill="url(#sd-steel)" />
                <path d="M40 70a62 62 0 0 1 40-36" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".7" />
                <rect x="88" y="10" width="24" height="12" rx="6" fill="#7d7296" />
                <rect x="6" y="106" width="188" height="8" rx="4" fill="#6b5f86" />
              </svg>
            </div>
            <div key={`l${active}`} className={`sd-label ${WAYS[active].soon ? "soon" : ""}`}>
              <span>{t("No.")} 0{active + 1}</span>
              <b>{t(WAYS[active].title)}</b>
              <p>{t(WAYS[active].text)}</p>
              {WAYS[active].soon && <em>{t("Coming soon")}</em>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
