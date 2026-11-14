// "Report a bug" for the website and the app. Anyone can open it from a link (openBugReport()); the report goes to
// the team's Google Sheet (tab "Bugs", through the same Apps Script as the survey: stand-setup/google-apps-script.js,
// type "bug"). A scheduled check reads new reports, reproduces them and prepares a fix; nothing in a report is ever
// executed or trusted as an instruction. Technical details (page, screen, browser, language) are sent only if ticked.
import { useEffect, useRef, useState } from "react";
import { postForm } from "./forms";
import { t, getLang } from "./i18n";
import "./bugreport.css";

const EVENT = "bite:report-bug";
/** true once the Apps Script behind FORMS_ENDPOINT has its "bug" branch (stand-setup/google-apps-script.js).
    Until then reports open an email to hello@bitetable.de instead, so they never land in the survey tab. */
const SHEET_READY = true;
/** opens the report dialog from anywhere (a footer link, a settings row…) */
export const openBugReport = () => window.dispatchEvent(new Event(EVENT));

type State = "idle" | "sending" | "done" | "error";

export function BugReportHost({ where }: { where: "site" | "app" }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState(true);
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<State>("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    const open = () => { setState("idle"); setErr(""); dlg.current?.showModal(); requestAnimationFrame(() => area.current?.focus()); };
    window.addEventListener(EVENT, open);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  const close = () => dlg.current?.close();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) { setState("done"); return; }                // a bot filled the hidden field
    if (text.trim().length < 10) { setErr(t("Tell us a little more, at least a sentence.")); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr(t("That email doesn't look right.")); return; }
    setErr(""); setState("sending");
    const page = `${location.pathname}${location.search.replace(/([?&])(t|token|code|access_token)=[^&]*/g, "$1")}${location.hash}`;
    if (!SHEET_READY) {
      const body = `${text.trim()}\n\n${details ? `Page: ${page}\nScreen: ${innerWidth}x${innerHeight}\nBrowser: ${navigator.userAgent}\nLanguage: ${getLang()}` : ""}`;
      location.href = `mailto:hello@bitetable.de?subject=${encodeURIComponent(`Bug report (${where})`)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
      setState("done"); setText(""); setEmail(""); return;
    }
    const ok = await postForm({
      type: "bug", where, text: text.trim().slice(0, 2000), email: email.trim().slice(0, 120), lang: getLang(),
      ...(details ? { page: page.slice(0, 200), screen: `${innerWidth}x${innerHeight}@${devicePixelRatio}`, ua: navigator.userAgent.slice(0, 200), at: new Date().toISOString() } : {}),
    });
    if (ok) { setState("done"); setText(""); setEmail(""); } else setState("error");
  };

  return (
    <dialog ref={dlg} className="br" aria-labelledby="br-title" onClick={(e) => { if (e.target === dlg.current) close(); }}>
      <div className="br-card">
        <button type="button" className="br-x" onClick={close} aria-label={t("Close")}>×</button>
        {state === "done" ? (
          <div className="br-done">
            <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" /><path d="M14 25l7 7 13-15" /></svg>
            <h2 id="br-title">{t("Thank you, it's in the kitchen.")}</h2>
            <p>{t("We read every report and fix what we can, usually within a day.")}{email ? ` ${t("We'll write to you when it's fixed.")}` : ""}</p>
            <button type="button" className="br-send" onClick={close}>{t("Back to Bite")}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="br-title">{t("Something not working?")}</h2>
            <p className="br-lead">{t("Tell us what happened and what you expected. A sentence or two is enough.")}</p>
            <label className="br-field">
              <span>{t("What went wrong")}</span>
              <textarea ref={area} value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} required placeholder={t("For example: the Join button does nothing on my phone.")} />
            </label>
            <label className="br-field">
              <span>{t("Your email, if you'd like an answer (optional)")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
            </label>
            <label className="br-check">
              <input type="checkbox" checked={details} onChange={(e) => setDetails(e.target.checked)} />
              <span>{t("Include technical details (this page, screen size, browser, language). No personal data.")}</span>
            </label>
            <input className="br-trap" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} aria-hidden />
            {(err || state === "error") && <p className="br-err" role="alert">{err || t("It didn't go through. Check your connection and try again, or write to hello@bitetable.de.")}</p>}
            <button type="submit" className="br-send" disabled={state === "sending"}>{state === "sending" ? t("Sending…") : t("Send report")}</button>
            <p className="br-fine">{t("Reports are stored in our team's Google Sheet. Details in the")} <a href="legal.html#privacy">{t("privacy policy")}</a>.</p>
          </form>
        )}
      </div>
    </dialog>
  );
}
