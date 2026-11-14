// HERO SIGN-UP — "Save me a seat": the stay-updated form as a restaurant reservation card, with a plate,
// a coffee cup and a few ingredients floating around it. After sending, a "RESERVED" table sign pops up.
// The form itself is SeatForm (src/shared/SeatForm.tsx), shared with the app's "No tables near you, yet" page.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { t } from "../../shared/i18n";
import { Tilt } from "../../shared/Motion";
import { SeatForm } from "../../shared/SeatForm";

export function LandingSeatCard() {
  const [done, setDone] = useState(false);
  // Which card is on top of the deck: the 60-second survey first, the reservation behind it
  const [front, setFront] = useState<"survey" | "seat">("survey");
  useEffect(() => {
    const onHash = () => { if (window.location.hash === "#waitlist") setFront("seat"); };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="rs-wrap" id="waitlist">
      <span id="get" />
      {/* decorations around the card */}
      <svg className="rs-plate" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="44" fill="#fff" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="2" />
        <circle cx="60" cy="60" r="31" fill="none" stroke="rgba(107,33,217,0.1)" strokeWidth="2" />
        <path d="M10 22v26M6 22v12a4 4 0 0 0 8 0V22M10 48v50" stroke="#b9a6dc" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M110 22c-6 0-8 14-8 24h8v52" stroke="#b9a6dc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg className="rs-cup" viewBox="0 0 90 90" aria-hidden>
        <g className="rs-cup-steam" fill="none" stroke="#c9b8e8" strokeWidth="3" strokeLinecap="round">
          <path d="M34 26c-4-5 4-8 0-13" /><path d="M46 24c-4-5 4-8 0-13" />
        </g>
        <ellipse cx="42" cy="78" rx="34" ry="6" fill="#e6dcf7" />
        <path d="M18 36h48v22a20 20 0 0 1-20 20h-8a20 20 0 0 1-20-20z" fill="#fff" stroke="rgba(107,33,217,0.15)" strokeWidth="2" />
        <path d="M66 42h6a8 8 0 0 1 0 16h-6" fill="none" stroke="#fff" strokeWidth="6" />
        <ellipse cx="42" cy="37" rx="22" ry="4" fill="#7a4a2a" />
      </svg>
      <span className="rs-bit b1" aria-hidden />
      <span className="rs-bit b2" aria-hidden />
      <span className="rs-bit b3" aria-hidden />
      <svg className="rs-leaf" viewBox="0 0 40 40" aria-hidden><path d="M6 34C6 16 18 6 34 6c0 16-10 28-28 28z" fill="#4fd18b" /><path d="M8 32L30 10" stroke="#2f9e67" strokeWidth="2" /></svg>

      <div className="rs-tabs" role="tablist">
        <button role="tab" aria-selected={front === "survey"} className={front === "survey" ? "on" : ""} onClick={() => setFront("survey")}>{front === "survey" && <motion.span layoutId="rs-pill" className="rs-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}<span>{t("Your feedback")}</span></button>
        <button role="tab" aria-selected={front === "seat"} className={front === "seat" ? "on" : ""} onClick={() => setFront("seat")}>{front === "seat" && <motion.span layoutId="rs-pill" className="rs-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}<span>{t("Save a seat")}</span></button>
      </div>

      <Tilt max={5} className="rs-tilt">
      <div className="rs-deck">
      {/* Card 1: feedback (feedback.html: rate the app, or the 60-second survey for those who haven't tried it), styled like a waiter's order pad */}
      <div className={`rs-card rs-survey ${front === "survey" ? "front" : "back"}`} onClick={front === "survey" ? undefined : () => setFront("survey")}>
        <div className="rs-head">
          <span>{t("Feedback")}</span>
        </div>
        <div className="rs-survey-top">
          <h2>{t("Tried Bite? Rate it.")}</h2>
          <svg className="rs-timer" viewBox="0 0 80 80" aria-hidden>
            <rect x="34" y="2" width="12" height="7" rx="2" fill="#6b21d9" />
            <circle cx="40" cy="44" r="32" fill="#fff" stroke="#efe8fb" strokeWidth="6" />
            <circle className="rs-timer-ring" cx="40" cy="44" r="32" fill="none" stroke="#9b4aff" strokeWidth="6" strokeLinecap="round" pathLength={1} transform="rotate(-90 40 44)" />
            <line className="rs-timer-hand" x1="40" y1="44" x2="40" y2="22" stroke="#160a2e" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="40" cy="44" r="4" fill="#160a2e" />
            <text x="40" y="66" textAnchor="middle" fontSize="10" fontWeight="900" fill="#6b21d9" fontFamily="Figtree Variable, sans-serif">2 min</text>
          </svg>
        </div>
        <p className="rs-sub">{t("Two minutes: stars, how easy it was, what to fix first. Not tried it yet? Tell us how you eat instead.")}</p>
        <ul className="rs-qs">
          <li><span>1</span>{t("How was your first taste of Bite?")}</li>
          <li><span>2</span>{t("How easy was it to use?")}</li>
          <li><span>3</span>{t("What would you change?")}</li>
          <li className="more">{t("+ a few more, just as quick")}</li>
        </ul>
        <a className="rs-go" href="feedback.html?ref=landing">{t("Give feedback")}</a>
        <p className="rs-fine">{t("Anonymous, about two minutes")}</p>
        <button type="button" className="rs-switch" onClick={(e) => { e.stopPropagation(); setFront("seat"); }}>{t("Rather get updates? Save me a seat")}</button>
      </div>

      {/* Card 2: the reservation (stay-updated sign-up) */}
      <div className={`rs-card rs-seat ${done ? "done" : ""} ${front === "seat" ? "front" : "back"}`} onClick={front === "seat" ? undefined : () => setFront("seat")}>
        <div className="rs-head">
          <span>{t("Reservation")}</span>
          <span className="rs-no">№ 0042</span>
        </div>

        <SeatForm source={new URLSearchParams(window.location.search).get("ref") || "landing"} onDone={() => setDone(true)} />
      </div>
      </div>
      </Tilt>
    </div>
  );
}
