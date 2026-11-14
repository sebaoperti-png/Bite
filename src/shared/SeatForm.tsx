// "Save me a seat": the stay-updated sign-up (email, eat/host/both, city, consent), then a RESERVED table sign.
// Used by the landing's hero card (LandingSeatCard) and by the app's "No tables near you, yet" page (NoTables).
// Sends to the Google Apps Script endpoint (forms.ts: double opt-in newsletter), or keeps it in this browser without one.
import { useState } from "react";
import { FORMS_ENDPOINT, postForm } from "./forms";
import { getLang, t } from "./i18n";
import { Arrowed } from "./Motion";
import "./seat.css";

const ROLES = [
  { id: "eat", label: "To eat" },
  { id: "host", label: "To host" },
  { id: "both", label: "Both" },
] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SeatForm({ source, title = "Save me a seat.", intro = "Bite is still in the kitchen. Leave your email and we'll keep a seat for you, plus news on how to be part of it.", cityHint = "e.g. Frankfurt, Fulda, Berlin…", onDone, links = true }: {
  /** where the sign-up came from, saved with it (the landing passes ?ref=… or "landing") */
  source: string;
  title?: string;
  intro?: string;
  cityHint?: string;
  onDone?: () => void;
  /** after sending: show the "Open the app" / "Give us feedback" links (the landing does, the app doesn't) */
  links?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"eat" | "host" | "both">("eat");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) { setError(t("Please enter a valid email address.")); return; }
    if (!consent) { setError(t("Tick the box so we're allowed to email you.")); return; }
    setError("");
    setState("sending");
    const entry = { email: email.trim().toLowerCase(), role, area: city.trim(), at: new Date().toISOString() };
    try {
      if (FORMS_ENDPOINT) {
        if (!(await postForm({ type: "waitlist", ...entry, source, newsletter: true, lang: getLang(), consentVersion: "waitlist-2026-10-20" }))) throw new Error("not saved");
      } else {
        try {
          const list = JSON.parse(localStorage.getItem("bite_waitlist") || "[]");
          localStorage.setItem("bite_waitlist", JSON.stringify([...list, entry]));
        } catch { /* ignore */ }
        await new Promise((r) => setTimeout(r, 700));
      }
      setState("done");
      onDone?.();
    } catch {
      setState("error");
    }
  };

  if (state === "done") return (
    <div className="rs-done">
      <div className="rs-tent" aria-hidden>
        <span className="rs-tent-top" />
        <span className="rs-tent-front"><b>{t("RESERVED")}</b><em>BITE</em></span>
      </div>
      <h3>{t("Your seat is saved.")}</h3>
      <p>{t("Last step: we sent an email to")} <b>{email.trim()}</b>{t(". Click the link inside to confirm.")}</p>
      {links && (
        <div className="rs-links">
          <a className="lm" href="bite.html"><Arrowed text={t("Open the app")} /></a>
          <a className="lm" href="feedback.html?ref=landing"><Arrowed text={t("Give us feedback")} /></a>
        </div>
      )}
    </div>
  );

  return (
    <form className="rs-form" onSubmit={submit} noValidate>
      <h2>{t(title)}</h2>
      <p className="rs-sub">{t(intro)}</p>

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
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t(cityHint)} maxLength={60} />
      </label>

      <label className="rs-consent">
        <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError(""); }} />
        <span>{t("Yes, send me Bite news by email (at most once a month). I'll first get an email to confirm. I can withdraw my consent any time with the link in every email. I'm at least 16. Details in the")} <a href="legal.html#survey">{t("privacy policy")}</a>.</span>
      </label>

      {(error || state === "error") && <p className="rs-error" role="alert">{error || t("Something went wrong, please try again in a moment.")}</p>}

      <button type="submit" className="rs-go" disabled={state === "sending"}>
        {state === "sending" ? t("Saving…") : t("Save my seat")}
      </button>
    </form>
  );
}
