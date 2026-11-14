// "A note from the kitchen": a small card that greets new visitors once and says honestly where Bite stands —
// what is already there (report & block, price cap, support by email) and what is still being cooked (ID checks,
// payments in the app, reviews). It appears after the cookie choice, never covers the page, and once closed it
// stays closed (localStorage). Bump VERSION when the list changes, so returning visitors see the news once.
import { useEffect, useState } from "react";
import { t } from "../../shared/i18n";

const KEY = "bite_kitchen_note";
const VERSION = "2026-11-14";

const COOKING = ["ID checks for hosts", "Payments in the app"];
const READY = ["Reviews after every dinner, both ways", "Report or block anyone in one tap", "A price cap: nobody makes a profit", "Help by email: hello@bitetable.de"];

export function LandingKitchenNote({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  // phones: a slim pill on the first screen, the full card only when tapped; the pill steps aside once you scroll
  const [small] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  const [expanded, setExpanded] = useState(false);
  const [away, setAway] = useState(false);
  useEffect(() => {
    if (!small || !open) return;
    const onScroll = () => setAway(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [small, open]);

  useEffect(() => {
    if (!ready) return;
    let seen = "";
    try { seen = localStorage.getItem(KEY) || ""; } catch { /* private mode: show it */ }
    if (seen === VERSION || new URLSearchParams(location.search).has("nonote")) return;
    const id = window.setTimeout(() => setOpen(true), 2600); // after the intro and the cookie card
    return () => window.clearTimeout(id);
  }, [ready]);

  const close = () => {
    try { localStorage.setItem(KEY, VERSION); } catch { /* ignore */ }
    setClosing(true);
    window.setTimeout(() => { setOpen(false); setClosing(false); }, 320);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  if (small && !expanded) return (
    <button type="button" className={`kn-pill ${away ? "away" : ""}`} onClick={() => setExpanded(true)} aria-haspopup="dialog" {...(away ? { tabIndex: -1 } : {})}>
      <i aria-hidden />{t("Bite is just opening its doors")} <u>{t("What's ready?")}</u>
    </button>
  );
  return (
    <div className={`kn ${closing ? "out" : ""}`} role="dialog" aria-labelledby="kn-title" aria-modal="false">
      <div className="kn-head">
        <span>{t("A note from the kitchen")}</span>
        <button type="button" className="kn-x" onClick={close} aria-label={t("Close")}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <h2 id="kn-title" className="kn-title">{t("Bite is just opening its doors")}</h2>
      <p className="kn-lead">{t("We're testing with the first neighbours. Here is what's on the table, and what's still cooking.")}</p>
      <div className="kn-cols">
        <div>
          <p className="kn-label">{t("Already served")}</p>
          <ul>{READY.map((r) => <li key={r} className="ok"><svg viewBox="0 0 24 24" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{t(r)}</li>)}</ul>
        </div>
        <div>
          <p className="kn-label">{t("Still cooking")}</p>
          <ul>{COOKING.map((c) => <li key={c} className="soon"><svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>{t(c)}</li>)}</ul>
        </div>
      </div>
      <div className="kn-actions">
        <button type="button" className="kn-ok" onClick={close}>{t("Got it")}</button>
        <a href="#safety" className="kn-more" onClick={close}>{t("How we keep you safe")}</a>
      </div>
    </div>
  );
}
