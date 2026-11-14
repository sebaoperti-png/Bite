// FOUR WAYS TO EAT (course No. 4, Sides): on the chalkboard the ways to eat written up as today's specials, beside
// them a little deck of menu cards. The picked way's card sits on top with its animated scene; changing the pick
// tosses the top card to the back. Cycles on its own while visible (the chalk line fills like a timer); hover or tap.
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

export function LandingServices() {
  const [active, setActive] = useState(1);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prev, setPrev] = useState(-1);
  const last = useRef(1);
  const ref = useRef<HTMLElement>(null);
  // remember which card was on top, so it can be tossed to the back of the deck
  useEffect(() => { if (last.current !== active) { setPrev(last.current); last.current = active; } }, [active]);
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
    <section ref={ref} className="r-pad-96 sv-dark" id="services" style={{ padding: "236px 24px", position: "relative", isolation: "isolate" }}>
      <div className="chalk-dust" aria-hidden />
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <Course n={4} name={t("Sides")} light size={28}>{t("four ways to eat")}</Course>
          <h2 className="r-h-44" style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.035em", lineHeight: 1.02, margin: "8px 0 0", color: "#fff" }}><span className="chalk-text"><RevealWords>{t("However you like your food")}</RevealWords></span><svg className="chalk-line" viewBox="0 0 300 16" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M4 10c40-7 80-8 120-4s90 6 172-2" /></svg></h2>
          <p style={{ fontSize: "21px", color: "#c4b4e2", maxWidth: "720px", margin: "22px auto 0", lineHeight: 1.55 }}>{t("Take it home, pull up a chair or cook side by side, every option is home-cooked by a neighbour, and the cost is split fairly.")}</p>
        </div>

        <div className="sd" onMouseLeave={() => setHovering(false)}>
          {/* today's specials, in chalk; the line being served fills up like a timer */}
          <div className="sd-board" role="tablist" aria-label={t("Today's specials")}>
            <span className="sd-board-title">{t("Today's specials")}</span>
            {WAYS.map((w, i) => (
              <button
                key={w.title}
                type="button"
                role="tab"
                className={`sd-line ${i === active ? "on" : ""} ${w.soon ? "soon" : ""}`}
                aria-selected={i === active}
                onMouseEnter={() => { setHovering(true); setActive(i); }}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
              >
                <span className="sd-n">{NUMERALS[i]}.</span>
                <span className="sd-name">{t(w.title)}<svg className="sd-ring" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden><path pathLength={1} d="M150 4C230 2 296 14 294 32S220 58 140 56 4 46 6 28 80 4 166 6" /></svg></span>
                <i className="sd-dots" aria-hidden />
                <span className="sd-tag">{t(w.tag)}</span>
                {i === active && visible && !hovering && !reduceMotion && <i key={`t${active}`} className="sd-timer" style={{ animationDuration: `${CYCLE_MS}ms` }} aria-hidden />}
              </button>
            ))}
          </div>

          {/* the menu cards: a little deck, the picked way on top; the card before is tossed to the back */}
          <div className="sd-deck" aria-live="polite">
            {WAYS.map((w, i) => {
              const depth = (i - active + WAYS.length) % WAYS.length;
              const Scene = SCENES[i];
              return (
                <article
                  key={w.title}
                  className={`sd-card d${depth} ${i === prev && i !== active ? "toss" : ""} ${w.soon ? "soon" : ""}`}
                  aria-hidden={depth !== 0}
                  onClick={() => depth !== 0 && setActive(i)}
                >
                  <div className="sd-card-top"><span>{t("No.")} 0{i + 1}</span><span>{t(w.tag)}</span></div>
                  <div className={`sd-card-art ${depth === 0 ? "live" : ""}`}><Scene /></div>
                  <b>{t(w.title)}</b>
                  <p>{t(w.text)}</p>
                  {w.soon && <em className="sd-stamp">{t("Coming soon")}</em>}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
