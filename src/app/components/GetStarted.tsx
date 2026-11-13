// Getting started, like today's apps: a short welcome tour the first time someone opens the real app (four cards,
// skippable, can be replayed), and a "Your first steps" checklist on Home that ticks itself off as the person uses
// Bite (account, photo, a first search, a first seat or table, the safety tips). Live mode only: the demo is for
// pitches and already full of tables.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, X } from "lucide-react";
import { useStore } from "../store";
import { openSafetyTips } from "./SafetySheets";
import { t } from "../../shared/i18n";
import "../styles/getstarted.css";

const TOUR_KEY = "bite_tour_v1";
const HIDE_KEY = "bite_steps_hidden";
export const BROWSED_KEY = "bite_steps_browsed";
const TIPS_KEY = "bite_steps_tips";

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v = "1") => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
export const openTour = () => window.dispatchEvent(new Event("bite:tour"));
export const markBrowsed = () => { put(BROWSED_KEY); window.dispatchEvent(new Event("bite:steps")); };

/* ── the welcome tour ── */
const SLIDES = [
  { title: "Find a table near you", text: "Search your town or use your location. Every dinner is cooked by a neighbour, at home.",
    art: <><circle cx="60" cy="52" r="26" /><path d="M79 71l17 17" /><path d="M48 52h24M60 40v24" opacity=".35" /></> },
  { title: "Ask for a seat, say hello", text: "The host accepts each guest. Chat in the app about the menu and your allergies. The street is shared once you're in.",
    art: <><path d="M22 30h58a8 8 0 0 1 8 8v26a8 8 0 0 1-8 8H46l-14 12V72H22a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" /><path d="M34 50h34M34 60h22" /></> },
  { title: "Pay your share at the table", text: "Guests split the real grocery cost, with a cap so nobody makes a profit. For now you pay the host at the dinner, never in advance.",
    art: <><path d="M30 18h60v76l-7-5-8 5-8-5-7 5-8-5-7 5-8-5-7 5z" /><path d="M42 36h36M42 48h36M42 60h20" /><path d="M66 70h12" /></> },
  { title: "Or open your own table", text: "Cook once, share the table. Scan your receipt, set the seats, and your own dinner gets cheaper.",
    art: <><path d="M38 48c-12-1-14-17-3-20 0-12 17-15 25-6 8-9 25-6 25 6 11 3 9 19-3 20v18H38z" /><path d="M38 58h44" /><path d="M30 92h60" /></> },
];

export function WelcomeTour() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!store.live) return;
    const params = new URLSearchParams(location.search);
    if (!get(TOUR_KEY) && !params.has("notour") && !params.has("host")) { const id = window.setTimeout(() => setOpen(true), 700); return () => window.clearTimeout(id); }
  }, [store.live]);
  useEffect(() => {
    const on = () => { setI(0); setOpen(true); };
    window.addEventListener("bite:tour", on);
    return () => window.removeEventListener("bite:tour", on);
  }, []);
  const close = () => { put(TOUR_KEY); setOpen(false); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") setI((x) => Math.min(SLIDES.length - 1, x + 1)); if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1)); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="wt-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div className="wt" role="dialog" aria-modal="true" aria-labelledby="wt-title" onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}>
            <div className="wt-top">
              <span>{t("Welcome to Bite")} · {i + 1}/{SLIDES.length}</span>
              <button type="button" onClick={close} className="wt-skip">{t("Skip")}</button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }}>
                <svg className="wt-art" viewBox="0 0 120 110" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{s.art}</svg>
                <h2 id="wt-title" className="wt-title">{t(s.title)}</h2>
                <p className="wt-text">{t(s.text)}</p>
              </motion.div>
            </AnimatePresence>
            <div className="wt-dots" role="tablist" aria-label={t("Steps")}>
              {SLIDES.map((x, k) => <button key={x.title} role="tab" aria-selected={k === i} aria-label={t(x.title)} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}
            </div>
            <div className="wt-actions">
              {i > 0 && <button type="button" className="wt-back-btn" onClick={() => setI(i - 1)}>{t("Back")}</button>}
              <button type="button" className="wt-next" onClick={() => (last ? close() : setI(i + 1))}>{last ? t("Start exploring") : t("Next")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── "Your first steps" on Home ── */
export function GetStartedCard({ onAccount, onBrowse, onHost }: { onAccount: () => void; onBrowse: () => void; onHost: () => void }) {
  const store = useStore();
  const [, bump] = useState(0);
  const [hidden, setHidden] = useState(() => !!get(HIDE_KEY));
  useEffect(() => {
    const on = () => bump((x) => x + 1);
    window.addEventListener("bite:steps", on);
    return () => window.removeEventListener("bite:steps", on);
  }, []);
  if (!store.live || hidden) return null;

  const hasSeatOrTable = store.bookings.some((b) => !b.guest) || store.meals.some((m) => m.ownedByMe);
  const steps = [
    { label: t("Create your free account"), done: !!store.account, go: onAccount },
    { label: t("Add your name and a photo"), done: !!store.account && store.profileComplete, go: onAccount },
    { label: t("Look for a dinner near you"), done: !!get(BROWSED_KEY), go: onBrowse },
    { label: t("Ask for a seat, or host your own table"), done: hasSeatOrTable, go: onHost },
    { label: t("Read the safety tips"), done: !!get(TIPS_KEY), go: () => { put(TIPS_KEY); bump((x) => x + 1); openSafetyTips(); } },
  ];
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const hide = () => { put(HIDE_KEY); setHidden(true); };

  return (
    <section className="gs" aria-labelledby="gs-title">
      <div className="gs-head">
        <div className="gs-ring" style={{ ["--p" as string]: done / steps.length }} aria-hidden><span>{done}/{steps.length}</span></div>
        <div className="gs-head-text">
          <h2 id="gs-title">{t("Your first steps on Bite")}</h2>
          <p>{t("A few minutes, and you're ready for your first dinner.")}</p>
        </div>
        <button type="button" className="gs-x" onClick={hide} aria-label={t("Hide the first steps")}><X size={15} /></button>
      </div>
      <ol className="gs-list">
        {steps.map((s, k) => (
          <li key={k}>
            <button type="button" className={`gs-step ${s.done ? "done" : ""}`} onClick={s.go} disabled={s.done}>
              <span className="gs-check" aria-hidden>{s.done ? <Check size={13} strokeWidth={3.2} /> : k + 1}</span>
              <span className="gs-label">{s.label}</span>
              {!s.done && <ChevronRight size={16} className="gs-go" aria-hidden />}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="gs-tour" onClick={openTour}>{t("Take the 30-second tour")}</button>
    </section>
  );
}
