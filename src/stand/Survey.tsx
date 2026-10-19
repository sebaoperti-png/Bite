import { useEffect, useRef, useState } from "react";
import { QUESTIONS, UI, type Lang } from "./questions";
import { saveEntry, startAutoSync, localResponses, outboxSize, flush, clearDevice, toCsv } from "./store";
import { FORMS_ENDPOINT } from "../shared/forms";
import { ThinkingOrb } from "thinking-orbs";

const params = new URLSearchParams(window.location.search);
const KIOSK = params.has("kiosk");
const SOURCE = params.get("ref") || (KIOSK ? "stand-tablet" : "direct");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESET_AFTER = 12;      // seconds on the thank-you screen (kiosk)
const IDLE_RESET = 75_000;   // abandoned survey goes back to the start (kiosk)
const ATTRACT_AFTER = 20_000; // start page untouched this long → the "waiting" screen (kiosk)

type Step = "start" | number | "contact" | "thanks";
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const initialLang = (): Lang => (params.get("lang") === "de" || (!params.get("lang") && navigator.language.toLowerCase().startsWith("de")) ? "de" : "en");

const LETTERS = "ABCDEFGH";
// Which consent wording people saw: saved with every email so the consent can be proven (Art. 7(1) GDPR)
const CONSENT_VERSION = "survey-2026-10-20";
const ONLINE = SOURCE === "landing";
// A made-up but stable order number for this visit, like the ticket from a waiter's pad
const ORDER_NO = String(41 + (localResponses().length % 900)).padStart(4, "0");

export function Survey() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [step, setStep] = useState<Step>("start");
  const [leaving, setLeaving] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [interview, setInterview] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESET_AFTER);
  const [admin, setAdmin] = useState(false);
  const taps = useRef<number[]>([]);
  const timer = useRef(0);
  const t = UI[lang];

  useEffect(() => startAutoSync(), []);

  // Kiosk: when nobody has touched the tablet for a while on the start page, show the "waiting" screen
  const [waiting, setWaiting] = useState(KIOSK);
  useEffect(() => {
    if (!KIOSK || step !== "start" || waiting) return;
    let id = window.setTimeout(() => setWaiting(true), ATTRACT_AFTER);
    const poke = () => { window.clearTimeout(id); id = window.setTimeout(() => setWaiting(true), ATTRACT_AFTER); };
    window.addEventListener("pointerdown", poke);
    return () => { window.clearTimeout(id); window.removeEventListener("pointerdown", poke); };
  }, [step, waiting]);
  const todayCount = localResponses().filter((r) => new Date(r.at).toDateString() === new Date().toDateString()).length;
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // The current page of the pad tears off, then the next one is shown
  const go = (s: Step) => {
    window.clearTimeout(timer.current);
    setLeaving(true);
    timer.current = window.setTimeout(() => { setStep(s); setLeaving(false); window.scrollTo(0, 0); }, 330);
  };

  const reset = () => {
    setStep("start"); setAnswers({}); setEmail(""); setNewsletter(false); setInterview(false); setError(""); setCountdown(RESET_AFTER);
    setLang(initialLang());
  };

  // Kiosk: thank-you screen counts down to the next visitor
  useEffect(() => {
    if (!KIOSK || step !== "thanks") return;
    if (countdown <= 0) { reset(); return; }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [step, countdown]);

  // Kiosk: someone walked away halfway — go back to the start
  useEffect(() => {
    if (!KIOSK || step === "start" || step === "thanks") return;
    const id = window.setTimeout(reset, IDLE_RESET);
    return () => window.clearTimeout(id);
  }, [step, answers, email]);

  const tapLogo = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 5) { taps.current = []; setAdmin(true); }
  };

  const total = QUESTIONS.length;
  const qIndex = typeof step === "number" ? step : -1;
  const q = qIndex >= 0 ? QUESTIONS[qIndex] : null;
  const answered = QUESTIONS.filter((x) => { const v = answers[x.id]; return Array.isArray(v) ? v.length > 0 : !!v; }).length;

  const choose = (optId: string) => {
    if (!q || leaving) return;
    if (q.multi) {
      const cur = (answers[q.id] as string[] | undefined) ?? [];
      let next = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
      if (optId === "nothing") next = cur.includes("nothing") ? [] : ["nothing"];
      else next = next.filter((x) => x !== "nothing");
      if (next.length > q.multi) next = next.slice(next.length - q.multi);
      setAnswers({ ...answers, [q.id]: next });
    } else {
      setAnswers({ ...answers, [q.id]: optId });
      // leave time to see the pen circle the answer
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => go(qIndex + 1 < total ? qIndex + 1 : "contact"), 480);
    }
  };

  const next = () => go(qIndex + 1 < total ? qIndex + 1 : "contact");
  const back = () => go(step === "contact" ? total - 1 : qIndex <= 0 ? "start" : qIndex - 1);

  const finish = (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    if (mail && !EMAIL_RE.test(mail)) { setError(t.badEmail); return; }
    if (mail && !newsletter && !interview) { setError(t.needChoice); return; }
    saveEntry({
      id: uid(), at: new Date().toISOString(), source: SOURCE, device: KIOSK ? "kiosk" : "phone", lang, answers,
      ...(mail ? { email: mail.toLowerCase(), newsletter, interview, consentVersion: CONSENT_VERSION } : {}),
    });
    go("thanks");
  };

  const pageKey = typeof step === "number" ? `q${step}` : step;
  const menu = [...t.menu, ONLINE ? t.anon : t.dessert];

  return (
    <div className="st-page">
      {waiting && step === "start" && (
        <button className="st-attract" onClick={() => { setWaiting(false); go(0); }} aria-label={t.start}>
          <span className="st-attract-orb"><ThinkingOrb state="breathing" size={64} theme="dark" /></span>
          <span className="st-attract-eyebrow">{t.eyebrow}</span>
          <span className="st-attract-title">{t.attractTitle}</span>
          <span className="st-attract-sub">{t.attractSub}</span>
          {todayCount > 0 && <span className="st-attract-count">{t.attractCount(todayCount)}</span>}
          <span className="st-attract-tap">{t.attractTap}</span>
        </button>
      )}
      <Decor />
      <header className="st-top">
        <button className="st-logo" onClick={tapLogo} aria-label="Bite">
          <img src="landing/logo.png" alt="" /><span>Bite</span>
        </button>
        {step !== "start" && step !== "thanks" && (
          <div className="st-courses" aria-label={t.course(Math.min(qIndex + 1 || total, total), total)}>
            {QUESTIONS.map((x, i) => (
              <span key={x.id} className={`${i < answered && i !== qIndex ? "done" : ""} ${i === qIndex ? "now" : ""}`} />
            ))}
          </div>
        )}
        <div className="st-lang" role="group" aria-label="Language">
          {(["de", "en"] as Lang[]).map((l) => (
            <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
      </header>

      <main className="st-main">
        <div className={`st-pad ${leaving ? "leaving" : ""} ${step === "thanks" ? "is-receipt" : ""}`} key={pageKey}>
          {step !== "thanks" && (
            <div className="st-pad-head">
              <span>BITE · {t.pad}</span>
              <span>{t.order} № {ORDER_NO}</span>
            </div>
          )}

          {step === "start" && (
            <section className="st-start">
              <KitchenTimer />
              <div className="st-eyebrow">{t.eyebrow}</div>
              <h1 className="st-h1">{t.headline}</h1>
              <p className="st-lead">{t.intro}</p>
              <div className="st-menu">
                <div className="st-menu-title"><i />{t.menuTitle}<i /></div>
                {menu.map(([a, b], i) => (
                  <div key={a} className="st-menu-line" style={{ ["--i" as string]: i }}><span>{a}</span><i /><b>{b}</b></div>
                ))}
              </div>
              <button className="st-primary" onClick={() => go(0)}>{t.start} <span aria-hidden>→</span></button>
              <p className="st-small st-start-privacy">{t.startPrivacy} <a href="legal.html#survey" target="_blank" rel="noopener">{t.privacy}</a>.</p>
            </section>
          )}

          {q && (
            <section>
              <div className="st-count">{t.course(qIndex + 1, total)}</div>
              <h2 className="st-h2">{q.title[lang]}</h2>
              {(q.hint || q.multi) && <p className="st-hint">{q.hint?.[lang] ?? t.pickMore(q.multi!)}</p>}
              <div className={`st-options ${q.options.length > 4 ? "st-grid" : ""}`}>
                {q.options.map((o, i) => {
                  const val = answers[q.id];
                  const on = Array.isArray(val) ? val.includes(o.id) : val === o.id;
                  return (
                    <button key={o.id} className={`st-option ${on ? "on" : ""}`} aria-pressed={on} onClick={() => choose(o.id)} style={{ ["--i" as string]: i }}>
                      <span className="st-key">
                        {LETTERS[i]}
                        <svg className="st-scribble" viewBox="0 0 48 48" aria-hidden><path d="M26 5C39 5 45 14 44 24s-9 19-21 19S3 35 4 23 14 4 30 7" pathLength={1} /></svg>
                      </span>
                      <span className="st-label-text">{o.label[lang]}</span>
                      <i className="st-dots" />
                      <svg className="st-tick" viewBox="0 0 24 24" aria-hidden><path d="M4 13l5 5L20 6" pathLength={1} /></svg>
                    </button>
                  );
                })}
              </div>
              <div className="st-nav">
                <button className="st-ghost" onClick={back}>← {t.back}</button>
                {q.multi && (
                  <button className="st-primary small" onClick={next}>
                    {((answers[q.id] as string[] | undefined)?.length ?? 0) > 0 ? t.next : t.skip} →
                  </button>
                )}
              </div>
            </section>
          )}

          {step === "contact" && (
            <form onSubmit={finish} noValidate>
              <div className="st-count">{t.course(total, total)} · ✓</div>
              <h2 className="st-h2">{t.contactTitle}</h2>
              <p className="st-hint">{t.contactHint}</p>
              <label className="st-label">
                {t.email}
                <input className="st-input" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="name@example.com" />
              </label>
              {email.trim() && (
                <div className="st-checks">
                  <label><input type="checkbox" checked={interview} onChange={(e) => { setInterview(e.target.checked); setError(""); }} /> <span>{t.interview}</span></label>
                  <label><input type="checkbox" checked={newsletter} onChange={(e) => { setNewsletter(e.target.checked); setError(""); }} /> <span>{t.newsletter}</span></label>
                  <p className="st-small">{t.privacyShort} <a href="legal.html#survey" target="_blank" rel="noopener">{t.privacy}</a></p>
                </div>
              )}
              {error && <p className="st-error" role="alert">{error}</p>}
              <div className="st-nav">
                <button type="button" className="st-ghost" onClick={back}>← {t.back}</button>
                <button type="submit" className="st-primary small">{t.finish} ✓</button>
              </div>
            </form>
          )}

          {step === "thanks" && (
            <section className="st-receipt" aria-live="polite">
              {!ONLINE && <Candy />}
              <div className="st-r-head">
                <b>BITE</b>
                <span>{t.yourOrder} · № {ORDER_NO}</span>
              </div>
              <div className="st-r-rule" />
              {QUESTIONS.map((x, i) => {
                const v = answers[x.id];
                const ids = ([] as string[]).concat(v ?? []);
                const label = ids.map((id) => x.options.find((o) => o.id === id)?.label[lang]).filter(Boolean).join(", ") || t.nothingPicked;
                return (
                  <div key={x.id} className="st-r-row" style={{ ["--i" as string]: i }}>
                    <span>1 ×</span><b>{label}</b>
                  </div>
                );
              })}
              <div className="st-r-rule" />
              <div className="st-r-total"><span>{t.total}</span><b>{lang === "de" ? "0,00 €" : "€0.00"} · {t.free}</b></div>
              <span className="st-stamp">{t.paid}</span>
              <h1 className="st-h1 small">{t.thanks}</h1>
              <p className="st-lead">{ONLINE ? t.thanksOnline : t.thanksSub}</p>
              {newsletter && email.trim() && <p className="st-inbox">✉️ {t.checkInbox}</p>}
              {!ONLINE && <div className="st-grab">{KIOSK ? t.grab : t.grabPhone}</div>}
              {KIOSK ? (
                <button className="st-ghost" onClick={reset}>{t.reset(countdown)} · {t.again}</button>
              ) : (
                <a className="st-primary" href="bite.html">{t.tryApp} <span aria-hidden>→</span></a>
              )}
              <div className="st-r-zigzag" aria-hidden />
            </section>
          )}
        </div>
      </main>

      {admin && <AdminPanel onClose={() => setAdmin(false)} />}
    </div>
  );
}

/** A kitchen timer whose ring runs down a minute, in a loop */
function KitchenTimer() {
  return (
    <svg className="st-timer" viewBox="0 0 80 84" aria-hidden>
      <rect x="34" y="2" width="12" height="8" rx="2.5" fill="#6b21d9" />
      <circle cx="40" cy="46" r="32" fill="#fff" stroke="#efe8fb" strokeWidth="6" />
      <circle className="st-timer-ring" cx="40" cy="46" r="32" fill="none" stroke="#9b4aff" strokeWidth="6" strokeLinecap="round" pathLength={1} transform="rotate(-90 40 46)" />
      <line className="st-timer-hand" x1="40" y1="46" x2="40" y2="24" stroke="#160a2e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="40" cy="46" r="4" fill="#160a2e" />
      <text x="40" y="68" textAnchor="middle" fontSize="10" fontWeight="900" fill="#6b21d9" fontFamily="Inter, sans-serif">60s</text>
    </svg>
  );
}

/** A wrapped sweet that pops out on the receipt (the reward at the stand) */
function Candy() {
  return (
    <svg className="st-candy" viewBox="0 0 120 60" aria-hidden>
      <path d="M30 30L6 14v32z" fill="#b87fff" />
      <path d="M90 30l24-16v32z" fill="#b87fff" />
      <ellipse cx="60" cy="30" rx="32" ry="22" fill="#6b21d9" />
      <path d="M40 16c6 10 6 18 0 28M60 9c6 12 6 30 0 42M80 16c-6 10-6 18 0 28" stroke="#9b4aff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="20" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-20 50 20)" />
    </svg>
  );
}

/** Plate, cup and a few ingredients floating around the pad */
function Decor() {
  return (
    <div className="st-decor" aria-hidden>
      <svg className="st-d-plate" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" fill="#fff" />
        <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="2" />
        <circle cx="60" cy="60" r="31" fill="none" stroke="rgba(107,33,217,0.1)" strokeWidth="2" />
        <path d="M10 22v26M6 22v12a4 4 0 0 0 8 0V22M10 48v50" stroke="#b9a6dc" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M110 22c-6 0-8 14-8 24h8v52" stroke="#b9a6dc" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg className="st-d-cup" viewBox="0 0 90 90">
        <g className="st-d-steam" fill="none" stroke="#c9b8e8" strokeWidth="3" strokeLinecap="round">
          <path d="M34 26c-4-5 4-8 0-13" /><path d="M46 24c-4-5 4-8 0-13" />
        </g>
        <ellipse cx="42" cy="78" rx="34" ry="6" fill="#e6dcf7" />
        <path d="M18 36h48v22a20 20 0 0 1-20 20h-8a20 20 0 0 1-20-20z" fill="#fff" stroke="rgba(107,33,217,0.15)" strokeWidth="2" />
        <path d="M66 42h6a8 8 0 0 1 0 16h-6" fill="none" stroke="#fff" strokeWidth="6" />
        <ellipse cx="42" cy="37" rx="22" ry="4" fill="#7a4a2a" />
      </svg>
      <svg className="st-d-leaf" viewBox="0 0 40 40"><path d="M6 34C6 16 18 6 34 6c0 16-10 28-28 28z" fill="#4fd18b" /><path d="M8 32L30 10" stroke="#2f9e67" strokeWidth="2" /></svg>
      <span className="st-d-bit b1" /><span className="st-d-bit b2" /><span className="st-d-bit b3" />
    </div>
  );
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState(localResponses);
  const [pending, setPending] = useState(outboxSize);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => { setRows(localResponses()); setPending(outboxSize()); };
  const sendNow = async () => { setBusy(true); await flush(); setBusy(false); refresh(); };
  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bite-stand-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const today = new Date().toDateString();
  const todayCount = rows.filter((r) => new Date(r.at).toDateString() === today).length;
  const emails = rows.filter((r) => r.email).length;

  return (
    <div className="st-admin" role="dialog" aria-modal="true">
      <div className="st-admin-box">
        <h2>Stand admin</h2>
        <ul>
          <li><b>{rows.length}</b> answers on this device · <b>{todayCount}</b> today · <b>{emails}</b> emails</li>
          <li>{FORMS_ENDPOINT ? <><b>{pending}</b> waiting to be sent to the Google Sheet</> : <>⚠️ No Google Sheet connected (src/shared/forms.ts) — answers stay on this device. Export them as CSV.</>}</li>
          <li>Mode: <b>{KIOSK ? "kiosk (auto-reset)" : "phone"}</b></li>
        </ul>
        <div className="st-admin-actions">
          {FORMS_ENDPOINT && <button onClick={sendNow} disabled={busy}>{busy ? "Sending…" : "Send now"}</button>}
          <button onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
          <a href={KIOSK ? "stand.html" : "stand.html?kiosk"}>{KIOSK ? "Leave kiosk mode" : "Switch to kiosk mode"}</a>
          <a href="stand.html?screen" target="_blank" rel="noopener">Open results screen</a>
          {confirmClear ? (
            <button className="danger" onClick={() => { clearDevice(); refresh(); setConfirmClear(false); }}>Yes, delete {rows.length} answers from this device</button>
          ) : (
            <button className="danger" onClick={() => setConfirmClear(true)} disabled={!rows.length}>Clear this device</button>
          )}
        </div>
        <button className="st-admin-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
