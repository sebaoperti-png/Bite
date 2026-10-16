// ASK BITE — floating assistant on the landing page (bottom-right).
import { useEffect, useRef, useState } from "react";
import { answer, greeting, type AssistantReply } from "../../shared/assistant";
import { withFee, euro } from "../../app/data";
import { asset } from "../asset";
import { t, tMaybe, dateLabel } from "../../shared/i18n";

interface Msg { id: number; from: "bot" | "me"; reply?: AssistantReply; text: string; done: boolean }

const LINK_CHIPS: Record<string, string> = {
  "Open the hosting demo": "bite.html?host",
};

let nextId = 1;

export function LandingAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [nudge, setNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // A small "Ask me" nudge appears a few seconds after the page opens
  useEffect(() => {
    const t = window.setTimeout(() => setNudge(true), 9000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) pushBot(greeting(), 300);
    if (open) { setNudge(false); window.setTimeout(() => inputRef.current?.focus(), 250); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  // Bot messages appear word by word, like a chat assistant typing
  const pushBot = (reply: AssistantReply, delay = 650) => {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
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

  const send = (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { id: nextId++, from: "me", text: t, done: true }]);
    pushBot(answer(t), 600 + Math.min(900, t.length * 12));
  };

  return (
    <>
      {!open && nudge && (
        <button className="as-nudge" onClick={() => setOpen(true)}>{t("Hungry? Ask me what's cooking 🍲")}</button>
      )}
      <button className={`as-fab ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label={open ? t("Close the Bite assistant") : t("Open the Bite assistant")} aria-expanded={open}>
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        ) : (
          <>
            <span className="as-spark" aria-hidden>✨</span>
            <span className="as-fab-label">{t("Ask Bite")}</span>
          </>
        )}
      </button>

      {open && (
        <div className="as-panel" role="dialog" aria-label={t("Bite assistant")}>
          <header className="as-head">
            <img src={asset("landing/logo.png")} alt="" />
            <div>
              <b>{t("Bite assistant")}</b>
              <span><i className="as-online" />{" "}{t("Finds meals · answers questions")}</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label={t("Close")}>✕</button>
          </header>

          <div className="as-list" ref={listRef} aria-live="polite">
            {msgs.map((m) => (
              <div key={m.id} className={`as-msg ${m.from}`}>
                <div className="as-bubble">{m.text}{m.from === "bot" && !m.done && <span className="as-caret" />}</div>
                {m.from === "bot" && m.done && m.reply?.meals && (
                  <div className="as-meals">
                    {m.reply.meals.map((meal) => (
                      <a key={meal.id} className="as-meal" href={`bite.html?meal=${meal.id}`}>
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
                      c === t("Open the hosting demo") ? (
                        <a key={c} className="as-chip link" href={LINK_CHIPS["Open the hosting demo"]}>{c} →</a>
                      ) : (
                        <button key={c} className="as-chip" onClick={() => send(c)}>{c}</button>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="as-msg bot"><div className="as-bubble as-typing"><span /><span /><span /></div></div>
            )}
          </div>

          <form className="as-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("e.g. vegan dinner in Berlin…")} aria-label={t("Ask the Bite assistant")} maxLength={200} />
            <button type="submit" disabled={!input.trim() || thinking} aria-label={t("Send")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
          <p className="as-foot">{t("Demo assistant · runs in your browser, nothing is stored")}</p>
        </div>
      )}
    </>
  );
}
