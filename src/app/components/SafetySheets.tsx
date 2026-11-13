import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, ShieldCheck, Ban, Flag, Check, Camera, ChevronRight, Phone } from "lucide-react";
import { Sheet } from "./Sheet";
import { SheetHeader } from "./HomeScreen";
import { usePhotoPicker } from "./Avatar";
import { useStore, type Person, type ReportCategory } from "../store";
import { t } from "../../shared/i18n";
import "../styles/safety.css";

/**
 * Safety tools, in Bite's restaurant language:
 *  - ReportSheet: tell Bite about a meal, a person or a message (a ticket to the kitchen)
 *  - SafetyActions: the "…" menu on a host, guest or chat (report / block)
 *  - BlockSheet: block someone (they are not told)
 *  - HouseRulesSheet: what every host agrees to before the first meal (a menu card)
 *  - ProfileGateSheet: a name and a photo before booking or hosting (a place card)
 * The same rules are enforced by the database (supabase/migrations/0005_safety.sql).
 */

const CATEGORIES: { id: ReportCategory; label: string; hint: string }[] = [
  { id: "unsafe", label: "I felt unsafe", hint: "Threats, pressure, someone crossing a line" },
  { id: "harassment", label: "Harassment or rude messages", hint: "Insults, unwanted advances, discrimination" },
  { id: "hygiene", label: "Food safety or hygiene", hint: "Spoiled food, a dirty kitchen, a hidden allergen" },
  { id: "scam", label: "Scam or fake profile", hint: "Asking for money outside Bite, fake photos" },
  { id: "no_show", label: "No-show or cancelled at the door", hint: "The host or a guest did not turn up" },
  { id: "inappropriate", label: "Inappropriate photos or text", hint: "Nudity, violence, offensive content" },
  { id: "other", label: "Something else", hint: "Tell us in your own words" },
];

export interface ReportTarget {
  /** what the report is about, shown as the sheet's title */
  about: "meal" | "person" | "message";
  mealId?: string;
  person?: Person;
  messageId?: string;
  context?: string;
}

export function ReportSheet({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const store = useStore();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (target) { setCategory(null); setDetails(""); setAlsoBlock(false); setSent(false); setError(""); } }, [target]);

  const title = target?.about === "meal" ? t("Report this meal") : target?.about === "message" ? t("Report this message") : t("Report {name}", { name: target?.person?.name.split(" ")[0] ?? "" });
  const needsWords = category === "other" && details.trim().length < 5;

  const send = async () => {
    if (!target || !category || needsWords) return;
    setBusy(true); setError("");
    try {
      await store.report({ category, details, mealId: target.mealId, personId: target.person?.id && store.live ? target.person.id : undefined, messageId: target.messageId, context: target.context });
      if (alsoBlock && target.person) await store.block(target.person);
      setSent(true);
    } catch (e) {
      setError((e as Error).message || t("Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={!!target} onClose={onClose} mobileMaxHeight="90%">
      <SheetHeader title={sent ? t("Thank you") : title} onClose={onClose} />
      <div className="overflow-y-auto px-5 pt-4 pb-6 sf-body" style={{ scrollbarWidth: "none", maxHeight: "72vh" }}>
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" className="sf-ticket" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div className="sf-ticket-head"><span>{t("To the Bite team")}</span><span>{t("Received")}</span></div>
              <motion.div className="sf-stamp" initial={{ scale: 1.6, opacity: 0, rotate: -18 }} animate={{ scale: 1, opacity: 1, rotate: -8 }} transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 16 }}>
                <Check size={16} strokeWidth={3} /> {t("Report received")}
              </motion.div>
              <p className="sf-p">{t("A person from Bite reads every report, usually within 24 hours. The person you reported is not told who sent it.")}</p>
              {alsoBlock && target?.person && <p className="sf-p">{t("You also blocked {name}.", { name: target.person.name.split(" ")[0] })}</p>}
              <Emergency />
              <button className="sf-btn" onClick={onClose}>{t("Back to Bite")}</button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="sf-lead">{t("What happened? Pick the closest one.")}</p>
              <div className="sf-cats" role="radiogroup" aria-label={t("Reason")}>
                {CATEGORIES.map((c) => (
                  <button key={c.id} role="radio" aria-checked={category === c.id} className={`sf-cat ${category === c.id ? "on" : ""}`} onClick={() => setCategory(c.id)}>
                    <span className="sf-dot">{category === c.id && <Check size={11} strokeWidth={3.5} />}</span>
                    <span><b>{t(c.label)}</b><em>{t(c.hint)}</em></span>
                  </button>
                ))}
              </div>
              <label className="sf-label" htmlFor="sf-details">{category === "other" ? t("Tell us what happened") : t("Anything else we should know? (optional)")}</label>
              <textarea id="sf-details" className="sf-textarea" rows={3} maxLength={1500} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={t("When, where, what was said…")} />
              {target?.person && (
                <label className="sf-check">
                  <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
                  <span className="sf-box">{alsoBlock && <Check size={12} strokeWidth={3.5} />}</span>
                  {t("Also block {name}", { name: target.person.name.split(" ")[0] })}
                </label>
              )}
              {error && <p className="sf-error" role="alert">{error}</p>}
              <button className="sf-btn" disabled={!category || needsWords || busy} onClick={send}>
                <Flag size={15} strokeWidth={2.6} /> {busy ? t("Sending…") : t("Send report")}
              </button>
              <Emergency />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

function Emergency() {
  return (
    <p className="sf-emergency"><Phone size={13} strokeWidth={2.6} /> {t("In danger right now? Call 110 (police) or 112 (ambulance) first.")}</p>
  );
}

/** "Block {name}?" with what it means */
export function BlockSheet({ person, onClose, onBlocked }: { person: Person | null; onClose: () => void; onBlocked?: () => void }) {
  const store = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setBusy(false); setError(""); }, [person]);
  const first = person?.name.split(" ")[0] ?? "";
  const go = async () => {
    if (!person) return;
    setBusy(true); setError("");
    try { await store.block(person); onClose(); onBlocked?.(); } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return (
    <Sheet open={!!person} onClose={onClose}>
      <SheetHeader title={t("Block {name}?", { name: first })} onClose={onClose} />
      <div className="px-5 pt-4 pb-6 sf-body">
        <ul className="sf-list">
          <li>{t("You will not see each other's meals.")}</li>
          <li>{t("Neither of you can send messages or book the other's table.")}</li>
          <li>{t("Open bookings between you are cancelled, with nothing to pay.")}</li>
          <li>{t("{name} is not told. You can unblock in Settings at any time.", { name: first })}</li>
        </ul>
        {error && <p className="sf-error" role="alert">{error}</p>}
        <button className="sf-btn sf-btn-dark" disabled={busy} onClick={go}><Ban size={15} strokeWidth={2.6} /> {busy ? t("Blocking…") : t("Block {name}", { name: first })}</button>
      </div>
    </Sheet>
  );
}

/** The quiet "…" menu: report or block a person (and report the meal, when there is one) */
export function SafetyActions({ open, onClose, person, mealId, onReport, onBlock }: {
  open: boolean; onClose: () => void; person: Person; mealId?: string;
  onReport: (t: ReportTarget) => void; onBlock: (p: Person) => void;
}) {
  const store = useStore();
  const first = person.name.split(" ")[0];
  const blocked = store.isBlocked(person.id);
  const rows = [
    ...(mealId ? [{ Icon: Flag, label: t("Report this meal"), sub: t("Food, photos or description"), go: () => onReport({ about: "meal", mealId, person }) }] : []),
    { Icon: ShieldAlert, label: t("Report {name}", { name: first }), sub: t("Behaviour, messages or profile"), go: () => onReport({ about: "person", person, mealId }) },
    blocked
      ? { Icon: Ban, label: t("Unblock {name}", { name: first }), sub: t("See each other's meals again"), go: () => void store.unblock(person.id) }
      : { Icon: Ban, label: t("Block {name}", { name: first }), sub: t("No more meals or messages between you"), go: () => onBlock(person) },
  ];
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader title={t("Safety")} onClose={onClose} />
      <div className="px-3 pt-2 pb-5 sf-body">
        {rows.map(({ Icon, label, sub, go }) => (
          <button key={label} className="sf-row" onClick={() => { onClose(); window.setTimeout(go, 180); }}>
            <span className="sf-row-icon"><Icon size={17} strokeWidth={2.2} /></span>
            <span className="sf-row-text"><b>{label}</b><em>{sub}</em></span>
            <ChevronRight size={16} />
          </button>
        ))}
        <button className="sf-row" onClick={() => { onClose(); window.setTimeout(() => window.dispatchEvent(new Event("bite:safety-tips")), 180); }}>
          <span className="sf-row-icon"><ShieldCheck size={17} strokeWidth={2.2} /></span>
          <span className="sf-row-text"><b>{t("Safety tips")}</b><em>{t("How to meet neighbours safely")}</em></span>
          <ChevronRight size={16} />
        </button>
        <p className="sf-note">{t("Bite's team reads every report. Read our safety rules on bitetable.de.")}</p>
      </div>
    </Sheet>
  );
}

export const HOUSE_RULES: { title: string; text: string }[] = [
  { title: "Cook it like it's for family", text: "Fresh ingredients, a clean kitchen, hands washed, raw and cooked food kept apart." },
  { title: "Say what's in it", text: "List the allergens you know of and answer guests' questions honestly." },
  { title: "Price it fairly", text: "Ask only for your share of the groceries. Bite is for sharing costs, not for profit." },
  { title: "Respect at the table", text: "No discrimination, no pressure, no unwanted advances. Everyone may leave at any time." },
  { title: "Keep it on Bite", text: "Chat and arrange everything in the app. Ask only for the agreed share, at the table, never in advance." },
  { title: "Be there, or say so early", text: "If you have to cancel, do it as soon as you know. Your guests are counting on you." },
];

/** What every host accepts once, before the first meal is published */
export function HouseRulesSheet({ open, onClose, onAccepted }: { open: boolean; onClose: () => void; onAccepted: () => void }) {
  const store = useStore();
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setAgree(false); setBusy(false); setError(""); } }, [open]);
  const accept = async () => {
    setBusy(true); setError("");
    try { await store.acceptHostRules(); onAccepted(); } catch (e) { setError((e as Error).message); setBusy(false); }
  };
  return (
    <Sheet open={open} onClose={onClose} mobileMaxHeight="92%">
      <SheetHeader title={t("Before your first table")} onClose={onClose} />
      <div className="overflow-y-auto px-5 pt-4 pb-6 sf-body" style={{ scrollbarWidth: "none", maxHeight: "72vh" }}>
        <div className="sf-menu">
          <p className="sf-menu-kicker">{t("Bite · house rules")}</p>
          <h3 className="sf-menu-title">{t("Six promises every host makes")}</h3>
          <ol className="sf-rules">
            {HOUSE_RULES.map((r, i) => (
              <motion.li key={r.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.06 }}>
                <span className="sf-no">{i + 1}</span>
                <span><b>{t(r.title)}</b><em>{t(r.text)}</em></span>
              </motion.li>
            ))}
          </ol>
          <p className="sf-menu-foot">{t("Breaking them can get you removed from Bite. Guests can report any table.")}</p>
        </div>
        <label className="sf-check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="sf-box">{agree && <Check size={12} strokeWidth={3.5} />}</span>
          {t("I have read the house rules and I will follow them")}
        </label>
        {error && <p className="sf-error" role="alert">{error}</p>}
        <button className="sf-btn" disabled={!agree || busy} onClick={accept}>{busy ? t("Saving…") : t("Accept and continue")}</button>
      </div>
    </Sheet>
  );
}

/** A name and a photo, so the host or the guests know who is coming */
export function ProfileGateSheet({ open, reason, onClose, onDone }: { open: boolean; reason: "book" | "host"; onClose: () => void; onDone: () => void }) {
  const store = useStore();
  const picker = usePhotoPicker();
  const [name, setName] = useState(store.profile.name);
  useEffect(() => { if (open) setName(store.profile.name); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const photo = store.profile.photo;
  const nameOk = name.trim().length >= 2;
  const save = () => {
    if (!nameOk || !photo) return;
    if (name.trim() !== store.profile.name) store.updateProfile({ name: name.trim() });
    onDone();
  };
  return (
    <Sheet open={open} onClose={onClose} mobileMaxHeight="90%">
      {picker.input}
      <SheetHeader title={reason === "host" ? t("Who is cooking?") : t("Who is coming?")} onClose={onClose} />
      <div className="px-5 pt-4 pb-6 sf-body">
        <p className="sf-lead">{reason === "host"
          ? t("Guests want to know whose table they sit at. Add a clear photo of your face and your name.")
          : t("Hosts open their home to you. Add a clear photo of your face and your name, so they know who is coming.")}</p>
        <div className="sf-place">
          <button className="sf-photo" onClick={picker.open} aria-label={t("Choose a profile photo")}>
            {photo ? <img src={photo} alt="" /> : <Camera size={26} strokeWidth={2} />}
            <span className="sf-photo-tag">{photo ? t("Change") : t("Add photo")}</span>
          </button>
          <div className="sf-place-card">
            <span className="sf-place-kicker">{t("Reserved for")}</span>
            <input className="sf-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={t("Your name")} aria-label={t("Your name")} />
          </div>
        </div>
        <button className="sf-btn" disabled={!nameOk || !photo} onClick={save}>{t("Save and continue")}</button>
        {!photo && <p className="sf-note">{t("Your photo is shown only to people on Bite.")}</p>}
      </div>
    </Sheet>
  );
}

/* ── Safety tips: while Bite has no ID checks or payments in the app yet, these keep meeting strangers safe ── */
export const SAFETY_TIPS: { title: string; text: string }[] = [
  { title: "Keep chatting on Bite", text: "Talk to the host or guest in the Bite chat. Don't move to WhatsApp or give your phone number before you've met." },
  { title: "Keep your personal data to yourself", text: "Never share bank details, ID photos, passwords or codes. Bite will never ask you for them." },
  { title: "Pay only at the table", text: "Pay your share when you arrive, never in advance. Cash or PayPal at the meal are fine. PayPal \"Friends and family\" has no buyer protection, so don't use it to pay before." },
  { title: "Tell someone where you're going", text: "For your first dinners, tell a friend the address and time, or bring them along if the host agrees." },
  { title: "Say what you can't eat", text: "Write your allergies in the chat before the day and ask what's in each dish." },
  { title: "Trust your gut", text: "You can leave at any time. In danger, call 110 or 112. Then report the person in the app: we read every report." },
];

/** Opens the tips from anywhere (the safety menu, the chat, the checkout) */
export function useSafetyTips() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => {
      setOpen(true);
      try { localStorage.setItem("bite_steps_tips", "1"); } catch { /* ignore */ }
      window.dispatchEvent(new Event("bite:steps"));
    };
    window.addEventListener("bite:safety-tips", on);
    return () => window.removeEventListener("bite:safety-tips", on);
  }, []);
  return { open, setOpen, sheet: <SafetyTipsSheet open={open} onClose={() => setOpen(false)} /> };
}
export const openSafetyTips = () => window.dispatchEvent(new Event("bite:safety-tips"));

export function SafetyTipsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} mobileMaxHeight="92%">
      <SheetHeader title={t("Safety tips")} onClose={onClose} />
      <div className="overflow-y-auto px-5 pt-4 pb-6 sf-body" style={{ scrollbarWidth: "none", maxHeight: "72vh" }}>
        <div className="sf-menu">
          <p className="sf-menu-kicker">{t("While Bite is in its early days")}</p>
          <h3 className="sf-menu-title">{t("Six tips for meeting neighbours")}</h3>
          <p className="sf-tips-lead">{t("ID checks and payments in the app are still coming. Until then, these keep every dinner safe.")}</p>
          <ol className="sf-rules">
            {SAFETY_TIPS.map((r, i) => (
              <li key={r.title}>
                <span className="sf-no">{i + 1}</span>
                <span><b>{t(r.title)}</b><em>{t(r.text)}</em></span>
              </li>
            ))}
          </ol>
          <p className="sf-menu-foot">{t("Questions or a problem? hello@bitetable.de")}</p>
        </div>
        <button className="sf-btn" onClick={onClose}>{t("Got it")}</button>
      </div>
    </Sheet>
  );
}

/** A short reminder for the top of a chat or the booking page, with a link to all the tips */
export function SafetyTipsStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`sf-strip ${compact ? "compact" : ""}`}>
      <ShieldCheck size={16} strokeWidth={2.2} />
      <span>{t("Stay safe: keep the chat on Bite, never share bank details, pay only at the table.")}</span>
      <button type="button" onClick={openSafetyTips}>{t("All tips")}</button>
    </div>
  );
}
