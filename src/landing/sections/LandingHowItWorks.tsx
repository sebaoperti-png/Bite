// HOW IT WORKS — a 3D deck of three slides that turns by itself (pauses on hover, swipe on phones)
import { useEffect, useRef, useState } from "react";
import { asset } from "../asset";
import { t } from "../../shared/i18n";

const SLIDE_MS = 4500;

const STEPS = [
  {
    n: "01",
    title: "Browse tonight's menus",
    text: "See what neighbours are cooking near you — filter by cuisine, diet or allergens.",
    tab: "Browse",
  },
  {
    n: "02",
    title: "Book your seat or pick-up",
    text: "Reserve in seconds, chat with your host and pay securely in the app.",
    tab: "Book",
  },
  {
    n: "03",
    title: "Sit down & enjoy",
    text: "Eat something made with care, meet the person who made it — then rate your meal.",
    tab: "Enjoy",
  },
];

/* ── The visual on each slide: a small piece of the real app ── */

function VisualBrowse() {
  const meals = [
    { img: "app/img/1554054204-800x533.jpg", t: "Thai Green Curry", p: "€5", who: "Maria · 19:30" },
    { img: "app/img/1551183053-800x533.jpg", t: "Tagliatelle al Ragù", p: "€6", who: "Paola · 19:00" },
    { img: "app/img/1563245372-800x533.jpg", t: "Dim Sum Sunday", p: "€7", who: "Wei · 11:30" },
  ];
  return (
    <div className="hw-vis hw-browse">
      <div className="hw-search">🔎 <span>{t("Something warm and vegan…")}</span></div>
      {meals.map((m, i) => (
        <div key={m.t} className="hw-meal" style={{ animationDelay: `${i * 0.12}s` }}>
          <img src={asset(m.img)} alt="" />
          <div><b>{t(m.t)}</b><span>{m.who}</span></div>
          <em>{m.p}</em>
        </div>
      ))}
    </div>
  );
}

function VisualBook() {
  return (
    <div className="hw-vis hw-book">
      <div className="hw-ticket">
        <img src={asset("app/img/1554054204-800x533.jpg")} alt="" />
        <div className="hw-ticket-body">
          <div className="hw-ok">{t("✓ Booking confirmed")}</div>
          <b>{t("Thai Green Curry")}</b>
          <span>{t("Tomorrow · 19:30 · 2 seats")}</span>
          <div className="hw-total"><span>{t("Total paid")}</span><b>€11.20</b></div>
        </div>
      </div>
      <div className="hw-bubble hw-host">{t("Hi! So happy you're joining 🎉")}</div>
      <div className="hw-bubble hw-me">{t("Can I bring wine? 🍷")}</div>
    </div>
  );
}

function VisualEnjoy() {
  return (
    <div className="hw-vis hw-enjoy">
      <img src={asset("app/img/1504754524776-800x533.jpg")} alt="" />
      <div className="hw-rate">
        <span>{t("Rate your dinner with Maria")}</span>
        <div className="hw-stars">★★★★★</div>
      </div>
    </div>
  );
}

const VISUALS = [VisualBrowse, VisualBook, VisualEnjoy];

export function LandingHowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar animation
  const ref = useRef<HTMLElement>(null);
  const touchX = useRef<number | null>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const go = (i: number) => { setActive((i + STEPS.length) % STEPS.length); setCycle((c) => c + 1); };

  // Only turn while the section is on screen
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || reduceMotion) return;
    const id = window.setTimeout(() => go(active + 1), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [active, visible, paused, cycle, reduceMotion]);

  return (
    <section ref={ref} className="r-pad-96" id="how" style={{ maxWidth: "1160px", margin: "0 auto", padding: "96px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "22px", color: "#6b21d9" }}>{t("how it works")}</span>
        <h2 className="r-h-44" style={{ fontSize: "44px", fontWeight: 900, letterSpacing: "-0.03em", margin: "8px 0 0" }}>{t("Three taps to a real meal")}</h2>
      </div>

      {/* Step tabs with progress bars */}
      <div className="hw-tabs" role="tablist" aria-label={t("Steps")}>
        {STEPS.map((s, i) => (
          <button key={s.n} role="tab" aria-selected={active === i} className={`hw-tab ${active === i ? "on" : ""} ${i < active ? "done" : ""}`} onClick={() => go(i)}>
            <span className="hw-tab-label">{s.n} · {t(s.tab)}</span>
            <span className="hw-tab-track">
              <span key={active === i ? `run-${cycle}` : "idle"} className="hw-tab-fill" style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused || !visible ? "paused" : "running" }} />
            </span>
          </button>
        ))}
      </div>

      {/* 3D deck */}
      <div
        className="hw-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
        onTouchEnd={(e) => {
          const start = touchX.current; touchX.current = null; setPaused(false);
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
        }}
      >
        {STEPS.map((s, i) => {
          let off = i - active;
          if (off > 1) off -= STEPS.length;
          if (off < -1) off += STEPS.length;
          const Visual = VISUALS[i];
          return (
            <article
              key={s.n}
              className={`hw-card hw-off${off}`}
              aria-hidden={off !== 0}
              onClick={() => off !== 0 && go(i)}
            >
              <div className="hw-text">
                <div className="hw-step">{t("STEP")}{" "}{s.n}</div>
                <h3>{t(s.title)}</h3>
                <p>{t(s.text)}</p>
              </div>
              <Visual />
            </article>
          );
        })}
        <button className="hw-arrow hw-prev" aria-label={t("Previous step")} onClick={() => go(active - 1)}>‹</button>
        <button className="hw-arrow hw-next" aria-label={t("Next step")} onClick={() => go(active + 1)}>›</button>
      </div>
    </section>
  );
}
