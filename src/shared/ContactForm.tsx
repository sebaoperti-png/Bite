// "Write to us": the contact form (the Impressum's second direct way to reach us, next to the email address).
// openContact() opens it from anywhere. The message goes through the Apps Script (type "contact") into the tab
// "Contact" of the team sheet and arrives as an email at hello@bitetable.de with the sender as reply-to.
import { useEffect, useRef, useState } from "react";
import { postForm } from "./forms";
import { t, getLang } from "./i18n";
import "./bugreport.css";

const EVENT = "bite:contact";
export const openContact = () => window.dispatchEvent(new Event(EVENT));

export function ContactHost() {
  const dlg = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    const open = () => { setState("idle"); setErr(""); setShown(true); dlg.current?.showModal(); requestAnimationFrame(() => requestAnimationFrame(() => first.current?.focus())); };
    window.addEventListener(EVENT, open);
    // legal.html#contact opens it straight away
    if (location.hash === "#contact") window.setTimeout(open, 300);
    return () => window.removeEventListener(EVENT, open);
  }, []);

  const close = () => dlg.current?.close();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) { setState("done"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErr(t("We need your email to answer you.")); return; }
    if (text.trim().length < 5) { setErr(t("Tell us a little more, at least a sentence.")); return; }
    setErr(""); setState("sending");
    const ok = await postForm({ type: "contact", name: name.trim().slice(0, 80), email: email.trim().slice(0, 120), text: text.trim().slice(0, 3000), lang: getLang() });
    if (ok) { setState("done"); setText(""); } else setState("error");
  };

  return (
    <dialog ref={dlg} className="br" aria-labelledby="ct-title" onClose={() => setShown(false)} onClick={(e) => { if (e.target === dlg.current) close(); }}>
      {shown && <div className="br-card">
        <button type="button" className="br-x" onClick={close} aria-label={t("Close")}>×</button>
        {state === "done" ? (
          <div className="br-done">
            <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" /><path d="M14 25l7 7 13-15" /></svg>
            <h2 id="ct-title">{t("Thanks, we got your message.")}</h2>
            <p>{t("We usually answer within a day, by email.")}</p>
            <button type="button" className="br-send" onClick={close}>{t("Back to Bite")}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="ct-title">{t("Write to us")}</h2>
            <p className="br-lead">{t("A question, an idea or a problem: we read everything and answer by email, usually within a day.")}</p>
            <label className="br-field">
              <span>{t("Your name (optional)")}</span>
              <input ref={first} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
            </label>
            <label className="br-field">
              <span>{t("Your email")}</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required maxLength={120} />
            </label>
            <label className="br-field">
              <span>{t("Your message")}</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={3000} required />
            </label>
            <input className="br-trap" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} aria-hidden />
            {(err || state === "error") && <p className="br-err" role="alert">{err || t("It didn't go through. Check your connection and try again, or write to hello@bitetable.de.")}</p>}
            <button type="submit" className="br-send" disabled={state === "sending"}>{state === "sending" ? t("Sending…") : t("Send message")}</button>
            <p className="br-fine">{t("We use your name and email only to answer you. Details in the")} <a href="legal.html#privacy">{t("privacy policy")}</a>.</p>
          </form>
        )}
      </div>}
    </dialog>
  );
}
