// ASK BITE — the maître d' of the landing page (bottom-right): finds tables, answers questions. While it thinks
// it shows what it is doing (a short reasoning list), then serves its suggestions on a small menu card.
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { answer, askRemote, greeting, type AssistantReply } from "../../shared/assistant";
import { withFee, euro } from "../../app/data";
import { asset } from "../asset";
import { t, t as tr, tMaybe, dateLabel, getLang } from "../../shared/i18n";

interface Msg { id: number; from: "bot" | "me"; reply?: AssistantReply; text: string; done: boolean }

const LINK_CHIPS: Record<string, string> = {
  "Start hosting": "bite.html?host",
};

let nextId = 1;

/** A small bow tie: the maître d's mark */
function BowTie({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 18" aria-hidden>
      <path d="M2 2.5c0-1 1-1.5 2-1L14 7v4L4 16.5c-1 .5-2 0-2-1z" fill="currentColor" />
      <path d="M30 2.5c0-1-1-1.5-2-1L18 7v4l10 5.5c1 .5 2 0 2-1z" fill="currentColor" />
      <rect x="13" y="5.5" width="6" height="7" rx="2" fill="currentColor" />
      <path d="M5 5l6 3.5M27 5l-6 3.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function LandingAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  // The reasoning lines shown while the maître d' thinks, and how many are already done
  const [steps, setSteps] = useState<string[]>([]);
  const [stepDone, setStepDone] = useState(0);
  const [nudge, setNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A small "Ask me" nudge appears a few seconds after the page opens
  useEffect(() => {
    // …and steps aside again after a while, so it never sits on top of the page for long
    // on phones the sticky bar has its own "Ask Bite" button, so no nudge there
    if (window.matchMedia("(max-width: 640px)").matches) return;
    const t = window.setTimeout(() => setNudge(true), 9000);
    const t2 = window.setTimeout(() => setNudge(false), 17000);
    return () => { window.clearTimeout(t); window.clearTimeout(t2); };
  }, []);

  // opened from elsewhere (the phone sticky bar): window.dispatchEvent(new Event("bite:ask"))
  useEffect(() => {
    const ask = () => setOpen(true);
    window.addEventListener("bite:ask", ask);
    return () => window.removeEventListener("bite:ask", ask);
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) pushBot(greeting(), 300);
    if (open) { setNudge(false); window.setTimeout(() => inputRef.current?.focus(), 250); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  // Bot messages appear word by word, like a chat assistant typing
  const pushBot = (reply: AssistantReply, delay = 1100, lines?: string[]) => {
    setThinking(true);
    const ls = lines ?? [];
    setSteps(ls);
    setStepDone(0);
    ls.forEach((_, i) => window.setTimeout(() => setStepDone(i + 1), ((i + 1) * delay) / (ls.length + 0.4)));
    window.setTimeout(() => {
      setThinking(false);
      setSteps([]);
      const id = nextId++;
      const words = reply.text.split(" ");
      setMsgs((m) => [...m, { id, from: "bot", reply, text: "", done: false }]);
      let i = 0;
      const tick = window.setInterval(() => {
        i += 2;
        const done = i >= words.length;
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, text: words.slice(0, i).join(" "), done } : x)));
        if (done) window.clearInterval(tick);
      }, 45);
    }, delay);
  };

  // The real maître d' (Gemini, through the Edge Function bite-ask) answers first, with the real meals on Bite.
  // If it can't (offline, busy, today's questions used up), the rule-based answer() takes over.
  const [waiting, setWaiting] = useState(false);
  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking || waiting) return;
    setInput("");
    const history = msgs.filter((m) => m.done).map((m) => ({ from: m.from, text: m.text }));
    setMsgs((m) => [...m, { id: nextId++, from: "me", text: q, done: true }]);
    setWaiting(true); setThinking(true);
    const live = [tr("Reading your question"), tr("Checking tonight's kitchens"), tr("Choosing for you")];
    setSteps(live); setStepDone(0);
    const timers = live.map((_, i) => window.setTimeout(() => setStepDone(i + 1), 900 * (i + 1)));
    const remote = await askRemote(q, history, getLang());
    timers.forEach(window.clearTimeout);
    setWaiting(false);
    if (remote && remote !== "limit") { pushBot(remote, 250, []); return; }
    const reply = answer(q);
    if (reply.meals?.length) reply.text = `${tr("I can't reach the kitchen right now, so here are examples from our demo.")} ${reply.text}`;
    if (remote === "limit") reply.text = `${tr("I've answered a lot of questions today, so here is my quick version.")} ${reply.text}`;
    pushBot(reply, 300, []);
  };

  return (
    <>
      {!open && nudge && (
        <button className="as-nudge" onClick={() => setOpen(true)}>{t("Hungry? Let me find you a table.")}</button>
      )}
      <button className={`as-fab ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label={open ? t("Close the Bite assistant") : t("Open the Bite assistant")} aria-expanded={open}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        ) : (
          <>
            <BowTie className="as-spark" />
            <span className="as-fab-label">{t("Ask Bite")}</span>
          </>
        )}
      </button>

      {open && (
        <div className="as-panel" role="dialog" aria-label={t("Bite assistant")}>
          <header className="as-head">
            <span className="as-avatar"><img src={asset("landing/logo.png")} alt="" /><BowTie className="as-avatar-tie" /></span>
            <div>
              <b>{t("Your maître d'")}</b>
              <span><i className="as-online" />{" "}{t("Finds you a table and answers questions")}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("Close")}>✕</button>
          </header>

          <div className="as-list" ref={listRef} aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`as-msg ${m.from}`}>
                <div className="as-bubble">{m.text}{m.from === "bot" && !m.done && <span className="as-caret" />}</div>
                {m.from === "bot" && m.done && m.reply?.live && (
                  <div className="as-meals">
                    <span className="as-menu-title">{t("The maître d' suggests")}</span>
                    {m.reply.live.map((meal) => {
                      const d = new Date(meal.starts_at);
                      const when = d.toLocaleString(getLang() === "de" ? "de-DE" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                      return (
                        <a key={meal.id} className="as-meal" href={`bite.html?live&meal=${encodeURIComponent(meal.id)}`}>
                          {meal.image ? <img src={meal.image.startsWith("https://") ? meal.image : asset(meal.image)} alt="" /> : <span className="as-meal-noimg" aria-hidden />}
                          <span className="as-meal-body">
                            <b>{meal.title}</b>
                            <span>{[meal.host, meal.place, when].filter(Boolean).join(", ")}</span>
                          </span>
                          <em>{meal.price_cents === 0 ? t("Free") : euro(meal.price_cents / 100)}</em>
                        </a>
                      );
                    })}
                  </div>
                )}
                {m.from === "bot" && m.done && m.reply?.meals && (
                  <div className="as-meals">
                    <span className="as-menu-title">{t("The maître d' suggests")}</span>
                    {m.reply.meals.map((meal) => (
                      <a key={meal.id} className="as-meal" href={`bite.html?preview&meal=${meal.id}`}>
                        <img src={asset(meal.image)} alt="" />
                        <span className="as-meal-body">
                          <b>{tMaybe(meal.title)}</b>
                          <span>{meal.host} · {t(meal.location.split(", ").pop() ?? "")} · {dateLabel(meal.date).split(",")[0]} {meal.time}</span>
                        </span>
                        <em>{euro(withFee(meal.price))}</em>
                      </a>
                    ))}
                  </div>
                )}
                {m.from === "bot" && m.done && m.reply?.chips && m.reply.chips.length > 0 && m.id === msgs[msgs.length - 1]?.id && (
                  <div className="as-chips">
                    {m.reply.chips.map((c) =>
                      c === t("Start hosting") ? (
                        <a key={c} className="as-chip link" href={LINK_CHIPS["Start hosting"]}>{c}</a>
                      ) : (
                        <button key={c} className="as-chip" onClick={() => send(c)}>{c}</button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="as-msg bot">
                <div className="as-bubble as-thinking">
                  <ThinkingOrb state="searching" size={20} theme="light" aria-label={t("Looking for tables…")} />
                  {steps.length ? (
                    <ol className="as-steps">
                      {steps.map((st, i) => (
                        i <= stepDone && <li key={st} className={i < stepDone ? "done" : "now"}>
                          {i < stepDone ? <svg viewBox="0 0 16 16" aria-hidden><path d="M3 8.5l3 3 7-7" /></svg> : <i />}{st}
                        </li>
                      ))}
                    </ol>
                  ) : <span>{t("Looking for tables…")}</span>}
                </div>
              </div>
            )}
          </div>

          <form className="as-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("e.g. vegan dinner in Berlin…")} aria-label={t("Ask the Bite assistant")} maxLength={200} />
            <button type="submit" disabled={!input.trim() || thinking} aria-label={t("Send")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
          <p className="as-foot">{t("Answers come from Google Gemini, using only what Bite really offers. Please don't share personal details.")} <a href="legal.html#privacy">{t("Privacy")}</a></p>
        </div>
      )}
    </>
  );
}
