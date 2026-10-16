import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send, CheckCircle, Star, Leaf, Wine, Clock, MapPin, Calendar, Users, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { euro, type Meal } from "../data";
import { useStore, timeLabel, type ChatMessage } from "../store";
import { useIsDesktop } from "../useIsDesktop";
import { localPlace } from "../location";
import { t, tMaybe, dateLabel } from "../../shared/i18n";

const QUICK_REPLIES = [
  { icon: Leaf,   label: "I'm vegetarian" },
  { icon: Clock,  label: "What time exactly?" },
  { icon: Wine,   label: "Can I bring wine?" },
  { icon: MapPin, label: "See you there!" },
];

/** A conversation with a host. When opened right after booking, it starts with the confirmation card. */
export function ChatScreen({ conversationId, bookingId, onBack, onOpenMeal }: {
  conversationId: string;
  bookingId?: string;
  onBack: () => void;
  onOpenMeal: (m: Meal) => void;
}) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const conv = store.conversations.find((c) => c.id === conversationId);
  const booking = bookingId ? store.bookings.find((b) => b.id === bookingId) : store.bookings.find((b) => b.conversationId === conversationId && b.status === "confirmed" && !b.guest);
  const meal = (booking && store.mealById(booking.mealId)) || (conv?.mealId ? store.mealById(conv.mealId) : undefined);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typing = !!store.typing[conversationId];

  useEffect(() => { store.markRead(conversationId); }, [conv?.messages.length]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [conv?.messages.length, typing]);
  useEffect(() => { if (isDesktop) inputRef.current?.focus(); }, [isDesktop]);

  if (!conv) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#160a2e" }}>{t("This conversation is no longer available.")}</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl" style={{ background: "#6b21d9", color: "#fff", fontWeight: 700 }}>{t("Go back")}</button>
      </div>
    );
  }

  const send = (t?: string) => {
    const msg = (t ?? text).trim();
    if (!msg) return;
    setText("");
    store.sendMessage(conversationId, msg);
  };

  const header = (
    <div className="px-4 pt-2 pb-3 md:py-4 flex items-center gap-3 flex-shrink-0" style={{ background: "#ffffff", borderBottom: "1px solid rgba(107,33,217,0.08)" }}>
      <motion.button onClick={onBack} aria-label={t("Back")} className="p-2 rounded-xl" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.88 }}>
        <ChevronLeft size={18} color="#6b21d9" strokeWidth={2.5} />
      </motion.button>
      <div className="relative">
        <img src={conv.avatar} alt="" className="w-10 h-10 rounded-full object-cover" style={{ border: "2px solid #6b21d9" }} />
        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full" style={{ background: "#10b981", border: "1.5px solid #fff" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{conv.name}</p>
        <p style={{ fontSize: 11.5, color: typing ? "#6b21d9" : "#10b981", fontWeight: 600 }}>{typing ? t("Typing…") : isDesktop ? t("Online · usually replies in minutes") : t("Online")}</p>
      </div>
      {meal && !isDesktop && (
        <button onClick={() => onOpenMeal(meal)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl" style={{ background: "#f0ecfa", fontSize: 11.5, fontWeight: 700, color: "#6b21d9" }}>{t("Meal")}{" "}<ChevronRight size={12} />
        </button>
      )}
    </div>
  );

  const confirmation = booking && meal && (
    <motion.div className="rounded-2xl overflow-hidden" initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.1 }}>
      <div className="p-4" style={{ background: booking.status === "cancelled" ? "linear-gradient(135deg, #7c6fa0, #a99cc8)" : "linear-gradient(135deg, #6b21d9, #9b4aff)" }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={16} color="#fff" />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{booking.status === "cancelled" ? t("Booking cancelled · refunded") : t("Booking confirmed")}</span>
        </div>
        <button onClick={() => onOpenMeal(meal)} className="flex gap-3 text-left w-full">
          <img src={meal.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{tMaybe(meal.title)}</p>
            <p className="flex items-center gap-1" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", marginTop: 2 }}><Calendar size={11} />{dateLabel(meal.date)} · {meal.time}</p>
            <p className="flex items-center gap-1 truncate" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}><MapPin size={11} />{localPlace(meal.location)}</p>
            <p className="flex items-center gap-1" style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}><Users size={11} />{booking.guests > 1 ? t("{n} guests", { n: booking.guests }) : t("1 guest")} · {t("{price} paid", { price: euro(booking.total) })}</p>
          </div>
        </button>
      </div>
      {booking.status === "confirmed" && (
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "#ede8fb" }}>
          <span style={{ fontSize: 12, color: "#6b21d9", fontWeight: 700 }}>{booking.rating ? t("Thanks for rating!") : t("Rate {name} after the meal", { name: conv.name.split(" ")[0] })}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.button key={i} aria-label={i > 1 ? t("{n} stars", { n: i }) : t("1 star")} onClick={() => store.rateBooking(booking.id, i)} whileTap={{ scale: 0.72 }} animate={{ scale: i <= (booking.rating ?? 0) ? 1.15 : 1 }}>
                <Star size={16} fill={i <= (booking.rating ?? 0) ? "#f59e0b" : "none"} color={i <= (booking.rating ?? 0) ? "#f59e0b" : "#a99cc8"} />
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const messages = (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3 [&>*]:flex-shrink-0" style={{ scrollbarWidth: "none" }}>
      {!isDesktop && confirmation}
      {conv.messages.length === 0 && (
        <p className="text-center py-8" style={{ fontSize: 13, color: "#7c6fa0" }}>{t("Say hello to {name} — ask about the menu, allergies or timing.", { name: conv.name.split(" ")[0] })}</p>
      )}
      <AnimatePresence initial={false}>
        {conv.messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 28 }}>
            <ChatBubble message={msg} avatar={conv.avatar} />
          </motion.div>
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {typing && (
          <motion.div className="flex items-end gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <img src={conv.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
            <div className="flex items-center gap-1 px-4 py-3 rounded-2xl" style={{ background: "#ffffff", borderBottomLeftRadius: 6 }}>
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: "#c4b8de" }} animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );

  const input = (
    <div className="px-4 pt-2 flex-shrink-0" style={{ background: "#ffffff", borderTop: "1px solid rgba(107,33,217,0.08)", paddingBottom: isDesktop ? 14 : "max(env(safe-area-inset-bottom), 16px)" }}>
      <div className="flex gap-2 mb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {QUICK_REPLIES.map(({ icon: Icon, label }) => (
          <motion.button key={label} onClick={() => send(t(label))} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#e6dcfa]" style={{ background: "#f0ecfa", fontSize: 12, color: "#6b21d9", fontWeight: 600, whiteSpace: "nowrap" }} whileTap={{ scale: 0.92 }}>
            <Icon size={11} color="#6b21d9" strokeWidth={2} />
            {t(label)}
          </motion.button>
        ))}
      </div>
      <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <div className="flex-1 flex items-center px-4 py-2.5 rounded-full" style={{ background: "#f0ecfa" }}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("Message {name}…", { name: conv.name })}
            aria-label={t("Message {name}", { name: conv.name })}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "#160a2e" }}
            maxLength={500}
          />
        </div>
        <motion.button type="submit" aria-label={t("Send")} className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: text.trim() ? "#6b21d9" : "#ede8fb" }} whileTap={{ scale: 0.85 }}>
          <Send size={15} color={text.trim() ? "#fff" : "#a99cc8"} strokeWidth={2} />
        </motion.button>
      </form>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ height: "max(env(safe-area-inset-top), 14px)", background: "#fff", flexShrink: 0 }} />
        {header}
        {messages}
        {input}
      </div>
    );
  }

  return (
    <div className="h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto h-full w-full max-w-[1100px] px-8 py-8 grid gap-6" style={{ gridTemplateColumns: meal ? "360px 1fr" : "1fr" }}>
        {meal && (
          <aside className="flex flex-col gap-4 overflow-y-auto">
            {confirmation || (
              <button onClick={() => onOpenMeal(meal)} className="rounded-3xl overflow-hidden text-left" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>
                <img src={meal.image} alt="" className="w-full h-40 object-cover" />
                <div className="p-4">
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#160a2e" }}>{tMaybe(meal.title)}</p>
                  <p style={{ fontSize: 13, color: "#7c6fa0", marginTop: 2 }}>{dateLabel(meal.date)} · {meal.time} · {euro(meal.price)}</p>
                  <p className="flex items-center gap-1 mt-2" style={{ fontSize: 13, fontWeight: 700, color: "#6b21d9" }}>{t("View meal")}{" "}<ChevronRight size={14} /></p>
                </div>
              </button>
            )}
            <div className="rounded-3xl p-4" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e" }}>{t("Good to know")}</p>
              <ul className="mt-2 flex flex-col gap-1.5" style={{ fontSize: 12.5, color: "#4a3a6e" }}>
                <li>{t("• Keep payments and chat inside Bite — you're covered.")}</li>
                <li>{t("• Free cancellation up to 24h before the meal.")}</li>
                <li>{t("• Something wrong? Our safety line is 24/7.")}</li>
              </ul>
            </div>
          </aside>
        )}
        <section className="flex flex-col min-h-0 rounded-3xl overflow-hidden" style={{ background: "#faf9fd", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>
          {header}
          {messages}
          {input}
        </section>
      </div>
    </div>
  );
}

function ChatBubble({ message, avatar }: { message: ChatMessage; avatar: string }) {
  const isMe = message.sender === "me";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
      <div className="max-w-[74%]">
        <div
          className="px-4 py-2.5 rounded-2xl"
          style={{
            background: isMe ? "#6b21d9" : "#ffffff",
            borderBottomRightRadius: isMe ? 6 : undefined,
            borderBottomLeftRadius: !isMe ? 6 : undefined,
            boxShadow: isMe ? "0 2px 12px rgba(107,33,217,0.28)" : "0 2px 8px rgba(107,33,217,0.06)",
          }}
        >
          <p style={{ fontSize: 14, color: isMe ? "#fff" : "#160a2e", lineHeight: 1.5, overflowWrap: "anywhere" }}>{tMaybe(message.text)}</p>
        </div>
        <p className={`mt-1 ${isMe ? "text-right" : "text-left"}`} style={{ fontSize: 10, color: "#7c6fa0" }}>
          {timeLabel(message.at)}{isMe && <span style={{ marginLeft: 4, color: "#9b4aff" }}>✓✓</span>}
        </p>
      </div>
    </div>
  );
}
