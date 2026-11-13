// A review after the meal, both ways: the guest rates the host (public on the host's page, first name only) and the
// host rates the guest (only the guest reads the words; other hosts see just the average when that guest asks for a
// seat). Stars, a few quick words to tap, and an optional note of up to 500 characters.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Sheet } from "./Sheet";
import { SheetHeader } from "./HomeScreen";
import { t, tMaybe } from "../../shared/i18n";
import { useStore } from "../store";
import "../styles/review.css";

const LABELS = ["", "Not good", "Could be better", "Fine", "Very good", "Wonderful"];
const CHIPS: Record<"host" | "guest", string[]> = {
  host: ["Delicious", "Generous portions", "Great company", "Clean kitchen", "Good value"],
  guest: ["Friendly", "On time", "Respectful", "Helped out", "Great conversation"],
};

export function ReviewSheet({ open, onClose, about, name, avatar, mealTitle, initialStars = 0, initialComment = "", onSave }: {
  open: boolean; onClose: () => void;
  /** "host": a guest reviews the host · "guest": a host reviews a guest */
  about: "host" | "guest";
  name: string; avatar: string; mealTitle: string;
  initialStars?: number; initialComment?: string;
  onSave: (stars: number, comment: string) => void;
}) {
  const [stars, setStars] = useState(initialStars);
  const [comment, setComment] = useState(initialComment);
  const first = name.split(" ")[0];
  useEffect(() => { if (open) { setStars(initialStars); setComment(initialComment); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const addChip = (c: string) => {
    const word = t(c);
    if (comment.toLowerCase().includes(word.toLowerCase())) return;
    setComment((x) => (x.trim() ? `${x.trim().replace(/[.!]$/, "")}. ${word}.` : `${word}.`).slice(0, 500));
  };

  return (
    <Sheet open={open} onClose={onClose} mobileMaxHeight="92%">
      <SheetHeader title={about === "host" ? t("Review your dinner") : t("Review your guest")} onClose={onClose} />
      <div className="rv overflow-y-auto px-5 pt-4 pb-6" style={{ scrollbarWidth: "none", maxHeight: "74vh" }}>
        <div className="rv-who">
          <img src={avatar} alt="" />
          <div>
            <p className="rv-q">{about === "host" ? t("How was dinner with {name}?", { name: first }) : t("How was {name} at your table?", { name: first })}</p>
            <p className="rv-meal">{mealTitle}</p>
          </div>
        </div>

        <div className="rv-stars" role="radiogroup" aria-label={t("Rating")}>
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.button key={i} type="button" role="radio" aria-checked={stars === i} aria-label={i > 1 ? t("{n} stars", { n: i }) : t("1 star")}
              onClick={() => setStars(i)} whileTap={{ scale: 0.8 }} animate={{ scale: i <= stars ? 1.08 : 1 }}>
              <Star size={34} strokeWidth={1.6} fill={i <= stars ? "#f59e0b" : "none"} color={i <= stars ? "#f59e0b" : "#c9bfe0"} />
            </motion.button>
          ))}
        </div>
        <p className="rv-label" aria-live="polite">{stars ? t(LABELS[stars]) : t("Tap the stars")}</p>

        <div className="rv-chips">
          {CHIPS[about].map((c) => <button key={c} type="button" onClick={() => addChip(c)}>{t(c)}</button>)}
        </div>
        <textarea className="rv-text" value={comment} onChange={(e) => setComment(e.target.value.slice(0, 500))} rows={3} maxLength={500}
          placeholder={about === "host" ? t("A few words for other guests (optional)") : t("A few words for {name} (optional)", { name: first })} aria-label={t("Your review")} />
        <p className="rv-count">{comment.length}/500</p>

        <p className="rv-note">{about === "host"
          ? t("Your first name, the stars and your words appear on {name}'s page.", { name: first })
          : t("{name} can read it. Other hosts only see the average when {name} asks for a seat.", { name: first })}</p>
        <button type="button" className="rv-save" disabled={!stars} onClick={() => { onSave(stars, comment.trim()); onClose(); }}>
          {initialStars ? t("Update review") : t("Send review")}
        </button>
      </div>
    </Sheet>
  );
}

/** A row of small stars (read only) */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="rv-mini" aria-label={t("{n} of 5 stars", { n: value })}>
      {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={size} fill={s <= value ? "#f59e0b" : "#e5e7eb"} color={s <= value ? "#f59e0b" : "#e5e7eb"} />)}
    </span>
  );
}

/** On Home after a dinner: "How was dinner at Anna's?" (guest) or "How were your guests?" (host), one at a time */
export function ReviewNudge() {
  const store = useStore();
  const [open, setOpen] = useState<string | null>(null);
  if (!store.live) return null;
  const now = Date.now();
  const recent = (startsAt?: string) => !!startsAt && Date.parse(startsAt) < now && now - Date.parse(startsAt) < 21 * 86400000;
  const asGuest = store.bookings.find((b) => !b.guest && b.live === "confirmed" && !b.rating && recent(store.mealById(b.mealId)?.startsAt));
  const asHost = store.bookings.find((b) => !!b.guest && b.live === "confirmed" && !b.guestRating && recent(store.mealById(b.mealId)?.startsAt));
  const b = asGuest ?? asHost;
  if (!b) return null;
  const meal = store.mealById(b.mealId);
  if (!meal) return null;
  const guestSide = b === asGuest;
  const name = guestSide ? meal.host : b.guest!.name;
  const avatar = guestSide ? meal.hostAvatar : b.guest!.avatar;
  const first = name.split(" ")[0];
  return (
    <>
      <button type="button" className="rv-nudge" onClick={() => setOpen(b.id)}>
        <img src={avatar} alt="" />
        <span><b>{guestSide ? t("How was dinner with {name}?", { name: first }) : t("How was {name} at your table?", { name: first })}</b>{t("Two taps help the next guests and hosts.")}</span>
        <span className="rv-nudge-cta">{t("Rate")}</span>
      </button>
      <ReviewSheet open={open === b.id} onClose={() => setOpen(null)} about={guestSide ? "host" : "guest"} name={name} avatar={avatar} mealTitle={tMaybe(meal.title)}
        onSave={(s, c) => (guestSide ? store.rateBooking(b.id, s, c) : store.rateGuest(b.id, s, c))} />
    </>
  );
}
