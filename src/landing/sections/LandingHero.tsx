// HERO: "Tonight, a few streets from you". A printed invitation whose blanks are filled in by hand:
// who is cooking, what, and for how many. Every few seconds a new evening is served: the plate slides away,
// a new one is set, the handwriting fills in again and the chairs around the table fill up.
// The evenings are examples (no invented users): neighbours anyone has, with real dish photos.
// Pauses on hover or focus; the dots under the plate choose an evening; no cycling with reduced motion.
import { useEffect, useRef, useState } from "react";
import { asset } from "../asset";
import { t } from "../../shared/i18n";

interface Evening { who: string; verb: "is cooking" | "are cooking"; dish: string; guests: string; seats: number; photo: string; when: string }

const EVENINGS: Evening[] = [
  { who: "the student upstairs", verb: "is cooking", dish: "dumplings", guests: "five neighbours", seats: 5, photo: "app/img/1496116218417-800x533.jpg", when: "Tonight, 19:30" },
  { who: "the nonna on the corner", verb: "is cooking", dish: "risotto", guests: "six hungry students", seats: 6, photo: "app/img/1476124369491-800x533.jpg", when: "Friday, 20:00" },
  { who: "the couple across the yard", verb: "are cooking", dish: "paella", guests: "eight people from the street", seats: 8, photo: "app/img/1534080564583-800x533.jpg", when: "Saturday, 19:00" },
  { who: "your neighbour from Seoul", verb: "is cooking", dish: "bibimbap", guests: "four new friends", seats: 4, photo: "app/img/1590301157890-800x533.jpg", when: "Sunday, 13:00" },
];
const STEP = 4600;

function Fill({ text, k }: { text: string; k: number }) {
  return <span className="hx-fill" key={k}><span className="hx-ink">{text}</span></span>;
}

export function LandingHero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (paused || reduced.current) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % EVENINGS.length), STEP);
    return () => window.clearTimeout(id);
  }, [i, paused]);
  const e = EVENINGS[i];

  return (
    <section className="hx" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="hx-inner">
        <div className="hx-copy">
          <h1 className="hx-sr">{t("Bite: home-cooked meals with your neighbours")}</h1>
          <p className="hx-kicker">{t("Tonight, a few streets from you,")}</p>
          <p className="hx-line" aria-live="polite">
            <Fill text={t(e.who)} k={i} /> <span className="hx-print">{t(e.verb)}</span>{" "}
            <Fill text={t(e.dish)} k={i + 100} /> <span className="hx-print">{t("for")}</span>{" "}
            <Fill text={t(e.guests)} k={i + 200} /><span className="hx-print">.</span>
          </p>
          <p className="hx-sub">{t("Bite is a seat at your neighbour's table. Someone nearby cooks, you pull up a chair, you meet the people who live around you, and everyone splits what the groceries cost.")}</p>
          <div className="hx-ctas">
            <a href="bite.html" className="hx-btn primary">{t("Find a seat near me")}</a>
            <a href="bite.html?host" className="hx-btn">{t("Cook for your street")}</a>
          </div>
          <p className="hx-small">
            <a className="lm" href="stand.html?ref=landing"><span className="lm-text">{t("Tell us how you eat in 60 seconds")}</span></a>
            <span aria-hidden className="hx-sep" />
            <a className="lm" href="#waitlist"><span className="lm-text">{t("Save me a seat")}</span></a>
          </p>
        </div>

        <div className="hx-stage" aria-hidden>
          <div className="hx-cloth" />
          <svg className="hx-cutlery" viewBox="0 0 460 460">
            <path d="M34 150v70M26 150v26a8 8 0 0 0 16 0v-26M34 220v110" />
            <path d="M428 150c-11 0-15 26-15 44h15v136" />
          </svg>
          <div className="hx-plate-wrap">
            {EVENINGS.map((ev, n) => (
              <div key={ev.photo} className={`hx-plate ${n === i ? "in" : n === (i - 1 + EVENINGS.length) % EVENINGS.length ? "out" : ""}`}>
                <img src={asset(ev.photo)} alt="" loading={n === 0 ? "eager" : "lazy"} />
              </div>
            ))}
            <span className="hx-steam"><i /><i /><i /></span>
          </div>
          <div className="hx-card" key={`c${i}`}>
            <em>{t(e.when)}</em>
            <span className="hx-chairs">
              {Array.from({ length: e.seats }, (_, n) => <i key={n} style={{ ["--d" as string]: `${0.5 + n * 0.16}s` }} />)}
            </span>
            <small>{t("{n} seats at the table", { n: e.seats })}</small>
          </div>
          <p className="hx-note">{t("An evening on Bite, for example")}</p>
        </div>
        <div className="hx-dots" role="group" aria-label={t("Example evenings")}>
          {EVENINGS.map((ev, n) => (
            <button key={ev.photo} type="button" aria-label={t(ev.dish)} aria-pressed={n === i} className={n === i ? "on" : ""} onClick={() => { setI(n); setPaused(true); }} />
          ))}
        </div>
      </div>
    </section>
  );
}
