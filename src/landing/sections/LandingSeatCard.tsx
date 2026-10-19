// HERO SIGN-UP — "Save me a seat": the stay-updated form as a restaurant reservation card, with a plate,
// a coffee cup and a few ingredients floating around it. After sending, a "RESERVED" table sign pops up.
// Same data flow as before: Google Apps Script endpoint if set (src/shared/forms.ts), otherwise kept in this browser.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FORMS_ENDPOINT, postForm } from "../../shared/forms";
import { t } from "../../shared/i18n";
import { Tilt, Arrowed } from "../../shared/Motion";

const ROLES = [
  { id: "eat", label: "To eat" },
  { id: "host", label: "To host" },
  { id: "both", label: "Both" },
] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LandingSeatCard() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"eat" | "host" | "both">("eat");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  // Which card is on top of the deck: the 60-second survey first, the reservation behind it
  const [front, setFront] = useState<"survey" | "seat">("survey");
  useEffect(() => {
    const onHash = () => { if (window.location.hash === "#waitlist") setFront("seat"); };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError(t("Please enter a valid email address.")); return; }
    if (!consent) { setError(t("Tick the box so we're allowed to email you.")); return; }
    setError("");
    setState("sending");
    const entry = { email: email.trim().toLowerCase(), role, area: city.trim(), at: new Date().toISOString() };
    try {
      if (FORMS_ENDPOINT) {
        const source = new URLSearchParams(window.location.search).get("ref") || "landing";
        if (!(await postForm({ type: "waitlist", ...entry, source }))) throw new Error("not saved");
      } else {
        try {
          const list = JSON.parse(localStorage.getItem("bite_waitlist") || "[]");
          localStorage.setItem("bite_waitlist", JSON.stringify([...list, entry]));
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 700));
      }
      setState("done");
    } catch {
      setState("error");
    }
  };

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
        <button role="tab" aria-selected={front === "survey"} className={front === "survey" ? "on" : ""} onClick={() => setFront("survey")}>{front === "survey" && <motion.span layoutId="rs-pill" className="rs-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}<span>{t("60-sec survey")}</span></button>
        <button role="tab" aria-selected={front === "seat"} className={front === "seat" ? "on" : ""} onClick={() => setFront("seat")}>{front === "seat" && <motion.span layoutId="rs-pill" className="rs-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}<span>{t("Save a seat")}</span></button>
      </div>

      <Tilt max={5} className="rs-tilt">
      <div className="rs-deck">
      {/* Card 1: the 60-second survey, styled like a waiter's order pad */}
      <div className={`rs-card rs-survey ${front === "survey" ? "front" : "back"}`} onClick={front === "survey" ? undefined : () => setFront("survey")}>
        <div className="rs-head">
          <span>{t("Survey")}</span>
          <span className="rs-no">60 SEC</span>
        </div>
        <div className="rs-survey-top">
          <h2>{t("Got 60 seconds?")}</h2>
          <svg className="rs-timer" viewBox="0 0 80 80" aria-hidden>
            <rect x="34" y="2" width="12" height="7" rx="2" fill="#6b21d9" />
            <circle cx="40" cy="44" r="32" fill="#fff" stroke="#efe8fb" strokeWidth="6" />
            <circle className="rs-timer-ring" cx="40" cy="44" r="32" fill="none" stroke="#9b4aff" strokeWidth="6" strokeLinecap="round" pathLength={1} transform="rotate(-90 40 44)" />
            <line className="rs-timer-hand" x1="40" y1="44" x2="40" y2="22" stroke="#160a2e" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="40" cy="44" r="4" fill="#160a2e" />
            <text x="40" y="66" textAnchor="middle" fontSize="10" fontWeight="900" fill="#6b21d9" fontFamily="Inter, sans-serif">60s</text>
          </svg>
        </div>
        <p className="rs-sub">{t("Tell us how you eat — 8 quick questions that shape what we build next.")}</p>
        <ul className="rs-qs">
          <li><span>1</span>{t("How often do you cook at home?")}</li>
          <li><span>2</span>{t("Would you eat at a neighbour's table?")}</li>
          <li><span>3</span>{t("What would you pay per plate?")}</li>
          <li className="more">{t("+ 5 more, just as quick")}</li>
        </ul>
        <a className="rs-go" href="stand.html?ref=landing">{t("Start the survey")} <span aria-hidden>→</span></a>
        <p className="rs-fine">{t("Anonymous · 8 questions · about 1 minute")}</p>
        <button type="button" className="rs-switch" onClick={(e) => { e.stopPropagation(); setFront("seat"); }}>{t("Rather get updates? Save me a seat")} ↓</button>
      </div>

      {/* Card 2: the reservation (stay-updated sign-up) */}
      <div className={`rs-card rs-seat ${state === "done" ? "done" : ""} ${front === "seat" ? "front" : "back"}`} onClick={front === "seat" ? undefined : () => setFront("seat")}>
        <div className="rs-head">
          <span>{t("Reservation")}</span>
          <span className="rs-no">№ 0042</span>
        </div>

        {state === "done" ? (
          <div className="rs-done">
            <div className="rs-tent" aria-hidden>
              <span className="rs-tent-top" />
              <span className="rs-tent-front"><b>{t("RESERVED")}</b><em>BITE</em></span>
            </div>
            <h3>{t("Your seat is saved.")}</h3>
            <p>{t("We'll keep")} <b>{email.trim()}</b> {t("updated on Bite's news.")}</p>
            <div className="rs-links">
              <a className="lm" href="bite.html"><Arrowed text={t("Try the demo app →")} /></a>
              <a className="lm" href="stand.html?ref=landing"><Arrowed text={t("Got 60 seconds? Take our survey →")} /></a>
            </div>
          </div>
        ) : (
          <form className="rs-form" onSubmit={submit} noValidate>
            <h2>{t("Save me a seat.")}</h2>
            <p className="rs-sub">{t("Bite is still in the kitchen. Leave your email and we'll keep a seat for you — plus news on how to be part of it.")}</p>

            <div className="rs-label">{t("I'm coming…")}</div>
            <div className="rs-roles" role="radiogroup" aria-label={t("I'm interested as…")}>
              {ROLES.map((r) => (
                <button key={r.id} type="button" role="radio" aria-checked={role === r.id} className={`rs-role ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id)}>{t(r.label)}</button>
              ))}
            </div>

            <label className="rs-line">
              <span>{t("Email")}</span>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder={t("you@example.com")} autoComplete="email" maxLength={120} />
            </label>
            <label className="rs-line">
              <span>{t("Your city")} <em>{t("(optional)")}</em></span>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("e.g. Frankfurt, Fulda, Berlin…")} maxLength={60} />
            </label>

            <label className="rs-consent">
              <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError(""); }} />
              <span>{t("Yes, keep me updated on Bite's news. I can unsubscribe any time — see the")} <a href="legal.html#privacy">{t("privacy policy")}</a>.</span>
            </label>

            {(error || state === "error") && <p className="rs-error" role="alert">{error || t("Something went wrong — please try again in a moment.")}</p>}

            <button type="submit" className="rs-go" disabled={state === "sending"}>
              {state === "sending" ? t("Saving…") : t("Save my seat")}
              <span aria-hidden>→</span>
            </button>
          </form>
        )}
      </div>
      </div>
      </Tilt>
    </div>
  );
}
