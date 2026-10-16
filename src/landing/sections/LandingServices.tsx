// FOUR WAYS TO EAT — expanding illustrated panels (a big icon per way): the active one opens up, the others shrink to a label.
// Cycles on its own while visible; hover (or tap) opens a panel.
import { useEffect, useRef, useState } from "react";
import { HandPlatter, Utensils, CookingPot, Bike } from "lucide-react";
import { SCENES } from "./ServiceScenes";
import { t } from "../../shared/i18n";

const CYCLE_MS = 3800;

const WAYS = [
  {
    title: "Pick-up",
    text: "Grab a home-cooked meal to go from a cook on your street.",
    tag: "Lunch on the way home",
    Icon: HandPlatter,
  },
  {
    title: "Eat together",
    text: "Pull up a chair at someone's table and share the meal.",
    tag: "Small tables, up to 6",
    Icon: Utensils,
  },
  {
    title: "Cook together",
    text: "Learn a recipe hands-on with a cook who's mastered it.",
    tag: "Take the recipe home",
    Icon: CookingPot,
  },
  {
    title: "Delivery",
    text: "We're working on it: soon you'll be able to have it dropped at your door, still warm.",
    tag: "Coming soon",
    soon: true,
    Icon: Bike,
  },
];

export function LandingServices() {
  const [active, setActive] = useState(1);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
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
    <section ref={ref} className="r-pad-96 sv-dark" id="services" style={{ padding: "380px 24px" }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "28px", color: "#b87fff" }}>{t("four ways to eat")}</span>
          <h2 className="r-h-44" style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "8px 0 0", color: "#fff" }}>{t("However you like your food")}</h2>
          <p style={{ fontSize: "21px", color: "#c4b4e2", maxWidth: "720px", margin: "22px auto 0", lineHeight: 1.55 }}>{t("Take it home, pull up a chair or cook side by side — every option is home-cooked by a neighbour, and the cost is split fairly.")}</p>
        </div>

        <div className="ws-row" onMouseLeave={() => setHovering(false)}>
          {WAYS.map((w, i) => {
            const on = i === active;
            return (
              <button
                key={w.title}
                className={`ws-panel ${on ? "on" : ""} ${"soon" in w ? "is-soon" : ""}`}
                aria-expanded={on}
                onMouseEnter={() => { setHovering(true); setActive(i); }}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="ws-dots" aria-hidden />
                <span className="ws-art" aria-hidden>
                  <span className="ws-ring" />
                  <w.Icon className="ws-big" strokeWidth={1.5} />
                </span>
                <span className="ws-scene">{(() => { const Scene = SCENES[i]; return <Scene />; })()}</span>
                {"soon" in w && <span className="ws-soon">{t("Coming soon")}</span>}
                <span className="ws-vertical">{t(w.title)}</span>
                <span className="ws-body">
                  {!("soon" in w) && <span className="ws-tag">{t(w.tag)}</span>}
                  <span className="ws-title">{t(w.title)}</span>
                  <span className="ws-text">{t(w.text)}</span>
                </span>
                <span className="ws-num">0{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
