// "Rate Bite": the comment card a restaurant leaves with the bill. People who tried Bite rate it in about two
// minutes: stars, what they tried, the 10 statements of the System Usability Scale (SUS, Brooke 1996; German
// wording after Rummel 2016), what they liked, what confused them, whether they'd use it. The SUS score (0-100)
// is worked out here and stored with the raw answers (Apps Script type "feedback", tab "Feedback").
import { useMemo, useState } from "react";
import { postForm } from "../shared/forms";
import { getLang, setLang, useLang } from "../shared/i18n";
import { ThemeToggle } from "../shared/ThemeToggle";

const CONSENT_VERSION = "feedback-2026-11-14";

type L = "en" | "de";
const TX = {
  en: {
    gateQ: "Have you tried Bite yet?",
    gateLead: "One place for everything you want to tell us. Pick your way in.",
    gateYes: "Yes, I've tried it", gateYesSub: "Rate the app: two minutes",
    gateNo: "Not yet", gateNoSub: "Tell us how you eat: 60 seconds",
    title: "How was your first taste of Bite?",
    lead: "Two minutes, five short steps. Your answers decide what we fix first.",
    stars: ["Not for me", "Not great", "It's okay", "Good", "Loved it"],
    triedQ: "What did you try?",
    tried: { browse: "Looked for meals", meal: "Opened a meal", book: "Asked for a seat", host: "Started hosting", chat: "Chatted", ask: "Asked Bite (assistant)", profile: "Set up my profile" },
    susTitle: "How much do you agree?",
    susLead: "Go with your first feeling, there are no wrong answers.",
    scale: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    sus: [
      "I think I would like to use Bite often.",
      "I found Bite unnecessarily complex.",
      "I thought Bite was easy to use.",
      "I think I would need help from someone technical to use Bite.",
      "The different parts of Bite work well together.",
      "There was too much inconsistency in Bite.",
      "I imagine most people would learn to use Bite very quickly.",
      "I found Bite very cumbersome to use.",
      "I felt very confident using Bite.",
      "I needed to learn a lot of things before I could get going with Bite.",
    ],
    likedQ: "What did you like most?",
    confusedQ: "What confused you or felt wrong?",
    optional: "optional",
    useQ: "Would you really use Bite?",
    use: { yes: "Yes", maybe: "Maybe", no: "No" },
    emailQ: "Up for a 15-minute chat about it? Leave your email (optional).",
    interview: "Yes, you may email me once to set up a short interview. You can withdraw any time.",
    next: "Next", back: "Back", send: "Send my feedback", sending: "Sending…",
    step: (n: number, of: number) => `Step ${n} of ${of}`,
    needStars: "Tap a star first.",
    needAll: "Please answer every line (or pick Neutral).",
    error: "It didn't go through. Check your connection and try again.",
    thanks: "Thank you, that helps a lot.",
    scoreLine: (s: number) => `Your usability score for Bite: ${s} out of 100.`,
    scoreNote: "Above 68 is better than most apps. We'll tell you how the next version does.",
    home: "Back to bitetable.de", openApp: "Open the app",
    privacy: "Your answers are stored in our team's Google Sheet without your name. Your email only if you tick the box. Details in the",
    privacyLink: "privacy policy",
  },
  de: {
    gateQ: "Hast du Bite schon ausprobiert?",
    gateLead: "Ein Ort für alles, was du uns sagen willst. Such dir deinen Weg aus.",
    gateYes: "Ja, schon ausprobiert", gateYesSub: "Die App bewerten: zwei Minuten",
    gateNo: "Noch nicht", gateNoSub: "Erzähl uns, wie du isst: 60 Sekunden",
    title: "Wie war dein erster Eindruck von Bite?",
    lead: "Zwei Minuten, fünf kurze Schritte. Deine Antworten entscheiden, was wir zuerst verbessern.",
    stars: ["Nichts für mich", "Eher nicht", "Geht so", "Gut", "Toll"],
    triedQ: "Was hast du ausprobiert?",
    tried: { browse: "Essen gesucht", meal: "Ein Essen angesehen", book: "Einen Platz angefragt", host: "Gastgeber werden", chat: "Gechattet", ask: "Ask Bite (Assistent)", profile: "Profil eingerichtet" },
    susTitle: "Wie sehr stimmst du zu?",
    susLead: "Nimm dein erstes Gefühl, es gibt keine falschen Antworten.",
    scale: ["Stimme gar nicht zu", "Stimme nicht zu", "Neutral", "Stimme zu", "Stimme voll zu"],
    sus: [
      "Ich denke, dass ich Bite gerne häufig benutzen würde.",
      "Ich fand Bite unnötig komplex.",
      "Ich fand Bite einfach zu benutzen.",
      "Ich glaube, ich bräuchte die Hilfe einer technisch versierten Person, um Bite zu benutzen.",
      "Die verschiedenen Teile von Bite passen gut zusammen.",
      "Bite war zu uneinheitlich.",
      "Ich kann mir vorstellen, dass die meisten Menschen Bite sehr schnell lernen.",
      "Ich fand Bite sehr umständlich zu benutzen.",
      "Ich fühlte mich bei der Benutzung von Bite sehr sicher.",
      "Ich musste eine Menge lernen, bevor ich mit Bite loslegen konnte.",
    ],
    likedQ: "Was hat dir am besten gefallen?",
    confusedQ: "Was hat dich verwirrt oder gestört?",
    optional: "optional",
    useQ: "Würdest du Bite wirklich nutzen?",
    use: { yes: "Ja", maybe: "Vielleicht", no: "Nein" },
    emailQ: "Lust auf ein 15-minütiges Gespräch darüber? Hinterlass deine E-Mail (optional).",
    interview: "Ja, ihr dürft mir einmal schreiben, um ein kurzes Interview auszumachen. Ich kann jederzeit widerrufen.",
    next: "Weiter", back: "Zurück", send: "Feedback senden", sending: "Wird gesendet…",
    step: (n: number, of: number) => `Schritt ${n} von ${of}`,
    needStars: "Tippe zuerst auf einen Stern.",
    needAll: "Bitte beantworte jede Zeile (oder wähle Neutral).",
    error: "Das hat nicht geklappt. Prüf deine Verbindung und versuch es nochmal.",
    thanks: "Danke, das hilft uns sehr.",
    scoreLine: (s: number) => `Dein Usability-Wert für Bite: ${s} von 100.`,
    scoreNote: "Über 68 ist besser als die meisten Apps. Wir sagen dir, wie die nächste Version abschneidet.",
    home: "Zurück zu bitetable.de", openApp: "App öffnen",
    privacy: "Deine Antworten landen ohne Namen in der Google-Tabelle unseres Teams, deine E-Mail nur mit Häkchen. Details in der",
    privacyLink: "Datenschutzerklärung",
  },
} as const;

/** SUS: odd items score (x-1), even items (5-x), sum × 2.5 → 0-100 */
export function susScore(a: number[]) {
  if (a.length !== 10 || a.some((x) => !x)) return null;
  return Math.round(a.reduce((s, x, i) => s + (i % 2 === 0 ? x - 1 : 5 - x), 0) * 2.5);
}

const STEPS = 5;
// steps: 0 stars + what you tried, 1-2 the ten SUS lines, 3 liked/confused, 4 would you use it + email

export function Feedback() {
  const lang = useLang() as L;
  const c = TX[lang] ?? TX.en;
  const [step, setStep] = useState(0);
  // one entry point for both: people who tried Bite rate it here, the others go to the 60-second survey
  const [tried0, setTried0] = useState(() => new URLSearchParams(location.search).has("tried"));
  const [stars, setStars] = useState(0);
  const [tried, setTried] = useState<string[]>([]);
  const [sus, setSus] = useState<number[]>(Array(10).fill(0));
  const [liked, setLiked] = useState("");
  const [confused, setConfused] = useState("");
  const [use, setUse] = useState("");
  const [email, setEmail] = useState("");
  const [interview, setInterview] = useState(false);
  const [err, setErr] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const score = useMemo(() => susScore(sus), [sus]);
  const source = useMemo(() => new URLSearchParams(location.search).get("ref") || "direct", []);

  const go = (n: number) => { setErr(""); setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => {
    if (step === 0 && !stars) return setErr(c.needStars);
    if (step === 1 && sus.slice(0, 5).some((x) => !x)) return setErr(c.needAll);
    if (step === 2 && sus.slice(5).some((x) => !x)) return setErr(c.needAll);
    go(step + 1);
  };
  const send = async () => {
    const mail = email.trim();
    const withMail = interview && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    setErr(""); setState("sending");
    const ok = await postForm({
      type: "feedback", lang: getLang(), source, device: matchMedia("(pointer: coarse)").matches ? "phone" : "desktop",
      stars, tried, sus, score, liked: liked.trim().slice(0, 1500), confused: confused.trim().slice(0, 1500), use,
      ...(withMail ? { email: mail.toLowerCase(), interview: true, consentVersion: CONSENT_VERSION } : {}),
    });
    if (ok) setState("done"); else { setState("idle"); setErr(c.error); }
  };

  return (
    <div className="fb">
      <header className="fb-top">
        <a href="./" className="fb-logo"><img src="bite-icon-192.png" alt="" /><b>Bite</b></a>
        <span className="fb-tools">
          <ThemeToggle />
          <span className="fb-lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>EN</button>
            <button type="button" aria-pressed={lang === "de"} onClick={() => setLang("de")}>DE</button>
          </span>
        </span>
      </header>

      <main className="fb-card">
        {!tried0 ? (
          <section className="fb-gate">
            <h1>{c.gateQ}</h1>
            <p className="fb-lead">{c.gateLead}</p>
            <div className="fb-ways">
              <button type="button" className="fb-way main" onClick={() => setTried0(true)}><b>{c.gateYes}</b><small>{c.gateYesSub}</small></button>
              <a className="fb-way" href={`stand.html?ref=${encodeURIComponent(source === "direct" ? "feedback" : source)}`}><b>{c.gateNo}</b><small>{c.gateNoSub}</small></a>
            </div>
          </section>
        ) : state === "done" ? (
          <section className="fb-done">
            <svg viewBox="0 0 48 48" aria-hidden><circle cx="24" cy="24" r="22" /><path d="M14 25l7 7 13-15" /></svg>
            <h1>{c.thanks}</h1>
            {score !== null && <p className="fb-score">{c.scoreLine(score)}</p>}
            <p>{c.scoreNote}</p>
            <div className="fb-actions"><a className="fb-btn" href="bite.html">{c.openApp}</a><a className="fb-link" href="./">{c.home}</a></div>
          </section>
        ) : (
          <>
            <p className="fb-step">{c.step(step + 1, STEPS)}</p>
            <div className="fb-progress" aria-hidden><i style={{ width: `${((step + 1) / STEPS) * 100}%` }} /></div>

            {step === 0 && (
              <section>
                <h1>{c.title}</h1>
                <p className="fb-lead">{c.lead}</p>
                <div className="fb-stars" role="radiogroup" aria-label={c.title}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n}: ${c.stars[n - 1]}`} className={n <= stars ? "on" : ""} onClick={() => { setStars(n); setErr(""); }}>
                      <svg viewBox="0 0 24 24" aria-hidden><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" /></svg>
                    </button>
                  ))}
                </div>
                <p className="fb-starlabel" aria-live="polite">{stars ? c.stars[stars - 1] : " "}</p>
                <h2>{c.triedQ}</h2>
                <div className="fb-chips">
                  {Object.entries(c.tried).map(([k, label]) => {
                    const on = tried.includes(k);
                    return <button key={k} type="button" aria-pressed={on} className={on ? "on" : ""} onClick={() => setTried((t) => on ? t.filter((x) => x !== k) : [...t, k])}>{label}</button>;
                  })}
                </div>
              </section>
            )}

            {(step === 1 || step === 2) && (
              <section>
                <h1>{c.susTitle}</h1>
                <p className="fb-lead">{c.susLead}</p>
                <ol className="fb-sus" start={step === 1 ? 1 : 6}>
                  {c.sus.slice(step === 1 ? 0 : 5, step === 1 ? 5 : 10).map((q, j) => {
                    const i = (step === 1 ? 0 : 5) + j;
                    return (
                      <li key={i}>
                        <p id={`sus-${i}`}>{q}</p>
                        <div className="fb-scale" role="radiogroup" aria-labelledby={`sus-${i}`}>
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button key={v} type="button" role="radio" aria-checked={sus[i] === v} aria-label={c.scale[v - 1]} className={sus[i] === v ? "on" : ""}
                              onClick={() => { setSus((s) => s.map((x, k) => (k === i ? v : x))); setErr(""); }}><span>{v}</span></button>
                          ))}
                        </div>
                        <div className="fb-ends" aria-hidden><span>{c.scale[0]}</span><span>{c.scale[4]}</span></div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {step === 3 && (
              <section>
                <label className="fb-field"><span>{c.likedQ} <em>{c.optional}</em></span>
                  <textarea rows={4} maxLength={1500} value={liked} onChange={(e) => setLiked(e.target.value)} /></label>
                <label className="fb-field"><span>{c.confusedQ} <em>{c.optional}</em></span>
                  <textarea rows={4} maxLength={1500} value={confused} onChange={(e) => setConfused(e.target.value)} /></label>
              </section>
            )}

            {step === 4 && (
              <section>
                <h1>{c.useQ}</h1>
                <div className="fb-chips big">
                  {(["yes", "maybe", "no"] as const).map((k) => <button key={k} type="button" aria-pressed={use === k} className={use === k ? "on" : ""} onClick={() => setUse(k)}>{c.use[k]}</button>)}
                </div>
                <label className="fb-field"><span>{c.emailQ}</span>
                  <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} /></label>
                <label className="fb-check"><input type="checkbox" checked={interview} onChange={(e) => setInterview(e.target.checked)} /><span>{c.interview}</span></label>
                <p className="fb-fine">{c.privacy} <a href="legal.html#survey">{c.privacyLink}</a>.</p>
              </section>
            )}

            {err && <p className="fb-err" role="alert">{err}</p>}
            <div className="fb-nav">
              {step > 0 ? <button type="button" className="fb-link" onClick={() => go(step - 1)}>{c.back}</button> : <span />}
              {step < STEPS - 1
                ? <button type="button" className="fb-btn" onClick={next}>{c.next}</button>
                : <button type="button" className="fb-btn" onClick={send} disabled={state === "sending"}>{state === "sending" ? c.sending : c.send}</button>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
