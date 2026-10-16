import { useState } from "react";
import { ChevronLeft, Star, MapPin, Clock, Users, Heart, Share2, CheckCircle, ChevronDown, ShoppingBag, Utensils, ChefHat, Leaf, MessageCircle, Link2, Mail, Send, ExternalLink, Trash2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { withFee, euro, type Meal } from "../data";
import { useStore, copyText } from "../store";
import { useIsDesktop } from "../useIsDesktop";
import { Sheet } from "./Sheet";
import { SheetHeader } from "./HomeScreen";
import { localPlace } from "../location";
import { t, tMaybe, dateLabel, dec } from "../../shared/i18n";

const SAMPLE_REVIEWS = [
  { name: "Julia R.",   stars: 5, text: "Absolutely beautiful meal. The host was warm and the food tasted just like home. Will definitely be back!" },
  { name: "Thomas B.",  stars: 5, text: "Great vibe, generous portions, lovely conversation. Exactly what Bite is all about." },
  { name: "Fatima A.",  stars: 4, text: "Really enjoyed it. The flavours were incredible — only wish there had been a little more time to chat at the end." },
];

const SVC_CONFIG = {
  pickup:          { label: "Pick-up",      color: "#c05e00", bg: "#fff4e5", Icon: ShoppingBag, cta: "Order" },
  "eat-together":  { label: "Eat Together", color: "#6b21d9", bg: "#ede8fb", Icon: Utensils,    cta: "Join table" },
  "cook-together": { label: "Cook Together",color: "#0a7c4e", bg: "#e5f7f0", Icon: ChefHat,     cta: "Join the cooking" },
};

const APP_URL = "https://sebaoperti-png.github.io/Bite/bite.html";

interface DetailScreenProps {
  meal: Meal;
  onBack: () => void;
  onBook: () => void;
  onMessage: () => void;
  onOpenChat: (conversationId: string) => void;
  onUnpublished: () => void;
}

export function DetailScreen({ meal, onBack, onBook, onMessage, onOpenChat, onUnpublished }: DetailScreenProps) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const liked = store.isLiked(meal.id);
  const left = store.seatsLeft(meal);
  const myBooking = store.bookings.find((b) => b.mealId === meal.id && b.status === "confirmed" && !b.guest);
  const guestBookings = meal.ownedByMe ? store.bookings.filter((b) => b.mealId === meal.id && b.guest && b.status === "confirmed") : [];
  const [activeImage, setActiveImage] = useState(0);
  const [showReviews, setShowReviews] = useState(isDesktop);
  const [showShare, setShowShare] = useState(false);
  const svc = SVC_CONFIG[meal.serviceType];
  const { Icon } = svc;

  const images = [meal.image, ...(meal.gallery ?? [])];

  const shareText = t("{title} with {host} on Bite — {date}, {time}. {price}.", { title: tMaybe(meal.title), host: meal.host, date: dateLabel(meal.date), time: meal.time, price: euro(meal.price) });
  const shareTo = async (where: "whatsapp" | "email" | "copy" | "more") => {
    setShowShare(false);
    if (where === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${APP_URL}`)}`, "_blank", "noopener");
    if (where === "email") window.location.href = `mailto:?subject=${encodeURIComponent(t("Join me at {title}", { title: tMaybe(meal.title) }))}&body=${encodeURIComponent(`${shareText}\n\n${APP_URL}`)}`;
    if (where === "copy") store.showToast((await copyText(`${shareText} ${APP_URL}`)) ? t("Link copied") : t("Link: sebaoperti-png.github.io/Bite"));
    if (where === "more") {
      if (navigator.share) { try { await navigator.share({ title: tMaybe(meal.title), text: shareText, url: APP_URL }); } catch { /* cancelled */ } }
      else store.showToast((await copyText(`${shareText} ${APP_URL}`)) ? t("Link copied") : t("Link: sebaoperti-png.github.io/Bite"));
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meal.location)}`;

  /* ── Building blocks shared by phone and desktop ── */

  const actionButtons = (
    <div className="flex gap-2 flex-shrink-0">
      <motion.button aria-label={t("Share")} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.92)", boxShadow: isDesktop ? "0 0 0 1px rgba(107,33,217,0.12)" : undefined }} whileTap={{ scale: 0.85 }} onClick={() => setShowShare(true)}>
        <Share2 size={15} color="#160a2e" strokeWidth={2} />
      </motion.button>
      <motion.button aria-label={liked ? t("Remove from saved") : t("Save meal")} aria-pressed={liked} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.92)", boxShadow: isDesktop ? "0 0 0 1px rgba(107,33,217,0.12)" : undefined }} whileTap={{ scale: 0.75 }} onClick={() => store.toggleLike(meal.id)}>
        <motion.div animate={{ scale: liked ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.28 }}>
          <Heart size={15} fill={liked ? "#e9345a" : "none"} color={liked ? "#e9345a" : "#160a2e"} strokeWidth={2} />
        </motion.div>
      </motion.button>
    </div>
  );

  const gallery = (height: number, rounded: boolean) => (
    <div className={`relative flex-shrink-0 overflow-hidden ${rounded ? "rounded-3xl" : ""}`} style={{ height }}>
      <AnimatePresence mode="wait">
        <motion.img key={activeImage} src={images[activeImage]} alt={tMaybe(meal.title)} className="absolute inset-0 w-full h-full object-cover" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      </AnimatePresence>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(22,10,46,0.3) 0%, transparent 40%, rgba(22,10,46,0.55) 100%)" }} />
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <motion.button key={i} aria-label={t("Photo {n}", { n: i + 1 })} onClick={() => setActiveImage(i)} animate={{ width: activeImage === i ? 18 : 6, background: activeImage === i ? "#ffffff" : "rgba(255,255,255,0.45)" }} className="h-1.5 rounded-full" transition={{ type: "spring", stiffness: 400 }} />
          ))}
        </div>
      )}
      <div className="absolute bottom-10 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: svc.bg }}>
        <Icon size={12} color={svc.color} strokeWidth={2.5} />
        <span style={{ fontSize: 12, fontWeight: 700, color: svc.color }}>{t(svc.label)}</span>
      </div>
    </div>
  );

  const titleBlock = (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h1 style={{ fontSize: isDesktop ? 36 : 22, fontWeight: 900, color: "#160a2e", lineHeight: 1.15, letterSpacing: isDesktop ? "-0.02em" : undefined, flex: 1 }}>{tMaybe(meal.title)}</h1>
        {!isDesktop && (
          <div className="flex-shrink-0 text-right">
            <p style={{ fontSize: 22, fontWeight: 800, color: "#6b21d9" }}>{euro(meal.price)}</p>
            <p style={{ fontSize: 10.5, color: "#7c6fa0" }}>{t("+ 12% service fee")}</p>
          </div>
        )}
        {isDesktop && actionButtons}
      </div>
      <motion.button className="flex items-center gap-1.5 mt-2" onClick={() => setShowReviews((v) => !v)} whileTap={{ scale: 0.96 }} aria-expanded={showReviews}>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={13} fill={i <= Math.round(meal.rating) ? "#f59e0b" : "#e5e7eb"} color={i <= Math.round(meal.rating) ? "#f59e0b" : "#e5e7eb"} />
          ))}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: "#160a2e" }}>{meal.reviews ? dec(meal.rating) : t("New")}</span>
        <span style={{ fontSize: 13.5, color: "#7c6fa0" }}>({meal.reviews === 1 ? t("1 review") : t("{n} reviews", { n: meal.reviews })})</span>
        <motion.div animate={{ rotate: showReviews ? 180 : 0 }}>
          <ChevronDown size={14} color="#7c6fa0" strokeWidth={2} />
        </motion.div>
      </motion.button>
    </div>
  );

  const hostCard = (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(107,33,217,0.07)" }}>
      <div className="p-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <img src={meal.hostAvatar} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid #6b21d9" }} />
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#6b21d9", border: "1.5px solid #fff" }}>
            <CheckCircle size={8} color="#fff" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{meal.host}{meal.ownedByMe && <span style={{ fontWeight: 600, color: "#0a7c4e" }}>{" "}{t("· you")}</span>}</p>
          <p style={{ fontSize: 12.5, color: "#7c6fa0" }}>{t("Verified host · {n} meals shared", { n: meal.reviews })}</p>
        </div>
        {!meal.ownedByMe && (
          <motion.button onClick={onMessage} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl hover:bg-[#e6dcfa]" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.92 }}>
            <MessageCircle size={15} color="#6b21d9" strokeWidth={2.2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#6b21d9" }}>{t("Message")}</span>
          </motion.button>
        )}
      </div>
      <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(107,33,217,0.07)" }}>
        <p style={{ fontSize: 14, color: "#4a3a6e", lineHeight: 1.6, paddingTop: 10 }}>"{tMaybe(meal.hostBio)}"</p>
      </div>
    </div>
  );

  const infoPills = (
    <div className="flex gap-2">
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl flex-1 min-w-0" style={{ background: isDesktop ? "#f7f4fd" : "#ffffff" }}>
        <Clock size={14} color="#6b21d9" strokeWidth={2} className="flex-shrink-0" />
        <span className="truncate" style={{ fontSize: 13, color: "#160a2e", fontWeight: 600 }}>{dateLabel(meal.date)} · {meal.time}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl" style={{ background: isDesktop ? "#f7f4fd" : "#ffffff" }}>
        <Users size={14} color="#6b21d9" strokeWidth={2} />
        <span style={{ fontSize: 13, color: left === 0 ? "#e9345a" : "#160a2e", fontWeight: 700 }}>{left === 0 ? t("Sold out") : t("{n} left", { n: left })}</span>
      </div>
    </div>
  );

  const location = (
    <a href={mapsUrl} target="_blank" rel="noopener" className="block rounded-2xl overflow-hidden group" style={{ boxShadow: "0 2px 12px rgba(107,33,217,0.07)" }}>
      <div className="relative flex items-center justify-center" style={{ height: isDesktop ? 140 : 90, background: "linear-gradient(135deg, #d8ccf5, #c4b0ef)" }}>
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(107,33,217,0.15) 0px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(107,33,217,0.15) 0px, transparent 1px, transparent 28px)" }} />
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#6b21d9" }}>
            <MapPin size={16} color="#fff" />
          </div>
        </motion.div>
      </div>
      <div className="p-3 flex items-center gap-2" style={{ background: "#ffffff" }}>
        <MapPin size={14} color="#6b21d9" strokeWidth={2} className="flex-shrink-0" />
        <span className="flex-1 truncate" style={{ fontSize: 13, color: "#160a2e", fontWeight: 600 }}>{localPlace(myBooking || meal.ownedByMe ? meal.location : meal.location.split(", ").slice(-2).join(", "))}</span>
        <span className="flex items-center gap-1 group-hover:underline" style={{ fontSize: 12.5, fontWeight: 700, color: "#6b21d9" }}>{t("Map")}{" "}<ExternalLink size={12} /></span>
      </div>
      {!myBooking && !meal.ownedByMe && <p className="px-3 pb-3" style={{ background: "#fff", fontSize: 11.5, color: "#7c6fa0" }}>{t("Exact address shared after booking")}</p>}
    </a>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div>
      <p style={{ fontSize: 12, fontWeight: 800, color: "#7c6fa0", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );

  const seatsBooked = meal.seats - left;
  const whoIsComing = meal.ownedByMe && section(t("Who's coming · {booked}/{seats} seats booked", { booked: seatsBooked, seats: meal.seats }), (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 2px 12px rgba(107,33,217,0.07)" }}>
      {guestBookings.length === 0 ? (
        <div className="flex items-center gap-3 p-4">
          <motion.span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#10b981" }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
          <p style={{ fontSize: 13.5, color: "#4a3a6e" }}>{t("Your meal is live — neighbours nearby can see it and book now.")}</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {guestBookings.map((b) => (
            <motion.div key={b.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(107,33,217,0.06)" }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <img src={b.guest!.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{b.guest!.name}</p>
                <p style={{ fontSize: 12, color: "#7c6fa0" }}>{b.guests === 1 ? t("1 seat") : t("{n} seats", { n: b.guests })} · {t("{price} paid in-app", { price: euro(b.total) })}</p>
              </div>
              <motion.button onClick={() => onOpenChat(b.conversationId)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-[#e6dcfa]" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.92 }}>
                <MessageCircle size={14} color="#6b21d9" />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6b21d9" }}>{t("Message")}</span>
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  ));


  const dietary = section(t("Dietary info"), (
    <div className="flex gap-2 flex-wrap">
      {meal.tags.map((tag) => {
        const match = store.profile.dietary.includes(tag);
        return (
          <span key={tag} className="px-3 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: match ? "#dcfce7" : "#ede8fb", fontSize: 12.5, color: match ? "#15803d" : "#6b21d9", fontWeight: 600 }}>
            <CheckCircle size={11} />{t(tag)}
          </span>
        );
      })}
    </div>
  ));

  const proof = meal.costProof;
  const costBox = proof && section(t("How this price was set"), (
    <div className="rounded-2xl p-4" style={{ background: "#ffffff", boxShadow: "0 2px 12px rgba(107,33,217,0.07)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 800, background: proof.kind === "receipt" ? "#e5f7f0" : "#ede8fb", color: proof.kind === "receipt" ? "#0a7c4e" : "#6b21d9" }}>
          {proof.kind === "receipt" ? t("🧾 Receipt-backed") : t("🤖 Estimated by Bite")}
        </span>
        <span style={{ fontSize: 12, color: "#7c6fa0" }}>{proof.kind === "receipt" ? t("Host scanned the grocery receipt") : t("Based on the menu and table size")}</span>
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap" style={{ fontSize: isDesktop ? 15 : 13.5, color: "#160a2e" }}>
        <span>{t("Groceries")}{" "}<b>{euro(proof.total)}</b></span>
        <span style={{ color: "#a99cc8" }}>÷</span>
        <span><b>{proof.people}</b>{" "}{t("people (host included)")}</span>
        <span style={{ color: "#a99cc8" }}>=</span>
        <span className="px-2.5 py-1 rounded-lg" style={{ background: "#6b21d9", color: "#fff", fontWeight: 900 }}>{t("{price} each", { price: euro(meal.price) })}</span>
      </div>
      <p style={{ fontSize: 12, color: "#7c6fa0", marginTop: 10, lineHeight: 1.5 }}>{t("🔒 Price cap: hosts can't charge more than the real cost per person — nobody makes a profit, everyone eats for less.")}</p>
    </div>
  ));

  const description = section(t("About this meal"), <p style={{ fontSize: isDesktop ? 16 : 14, color: "#160a2e", lineHeight: 1.7 }}>{tMaybe(meal.description)}</p>);

  const ingredients = meal.serviceType === "cook-together" && meal.ingredients && meal.ingredients.length > 0 && (
    <div className="p-4 rounded-2xl" style={{ background: "#e5f7f0", border: "1px solid rgba(10,124,78,0.18)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Leaf size={14} color="#0a7c4e" strokeWidth={2} />
        <p style={{ fontSize: 12, fontWeight: 700, color: "#0a7c4e", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("Ingredients provided")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {meal.ingredients.map((ing) => (
          <div key={ing} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#0a7c4e" }} />
            <span style={{ fontSize: 13.5, color: "#0a7c4e", fontWeight: 500 }}>{tMaybe(ing)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const reviews = (
    <AnimatePresence initial={false}>
      {showReviews && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          {section(t("Reviews"), meal.reviews === 0 ? (
            <p style={{ fontSize: 14, color: "#7c6fa0" }}>{t("No reviews yet — be the first to eat here!")}</p>
          ) : (
            <div className={isDesktop ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
              {SAMPLE_REVIEWS.map((r) => (
                <div key={r.name} className="p-4 rounded-2xl" style={{ background: "#ffffff", boxShadow: "0 2px 8px rgba(107,33,217,0.06)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#ede8fb" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#6b21d9" }}>{r.name[0]}</span>
                    </div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: "#160a2e" }}>{r.name}</p>
                    <div className="flex gap-0.5 ml-auto">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} fill={s <= r.stars ? "#f59e0b" : "#e5e7eb"} color={s <= r.stars ? "#f59e0b" : "#e5e7eb"} />)}
                    </div>
                  </div>
                  <p style={{ fontSize: 13.5, color: "#4a3a6e", lineHeight: 1.55 }}>{t(r.text)}</p>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ctaLabel = meal.ownedByMe ? t("Unpublish listing") : myBooking ? t("You're booked · Open chat") : left === 0 ? t("Sold out") : `${t(svc.cta)} · ${euro(withFee(meal.price))}`;
  const ctaAction = () => {
    if (meal.ownedByMe) { store.unpublish(meal.id); onUnpublished(); return; }
    if (myBooking) { onMessage(); return; }
    if (left > 0) onBook();
  };
  const ctaButton = (
    <motion.button
      onClick={ctaAction}
      disabled={!meal.ownedByMe && !myBooking && left === 0}
      className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
      style={{ background: meal.ownedByMe ? "#fff" : left === 0 && !myBooking ? "#c4b8de" : myBooking ? "#0a7c4e" : "linear-gradient(135deg, #6b21d9, #9b4aff)", border: meal.ownedByMe ? "1.5px solid #e9345a" : "none", boxShadow: meal.ownedByMe ? undefined : "0 12px 28px rgba(107,33,217,0.25)" }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
    >
      {meal.ownedByMe ? <Trash2 size={16} color="#e9345a" /> : myBooking ? <MessageCircle size={16} color="#fff" /> : null}
      <span style={{ color: meal.ownedByMe ? "#e9345a" : "#fff", fontWeight: 800, fontSize: 16 }}>{ctaLabel}</span>
    </motion.button>
  );

  const shareSheet = (
    <Sheet open={showShare} onClose={() => setShowShare(false)}>
      <SheetHeader title={t("Share this meal")} onClose={() => setShowShare(false)} />
      <div className="grid grid-cols-4 gap-3 p-5 pb-8 md:pb-6">
        {([
          { id: "whatsapp", label: "WhatsApp", bg: "#25D366", Icon: Send },
          { id: "email", label: "Email", bg: "#160a2e", Icon: Mail },
          { id: "copy", label: "Copy link", bg: "#6b21d9", Icon: Link2 },
          { id: "more", label: "More", bg: "#8e8e93", Icon: Share2 },
        ] as const).map(({ id, label, bg, Icon: I }) => (
          <motion.button key={id} className="flex flex-col items-center gap-2" whileTap={{ scale: 0.88 }} onClick={() => shareTo(id)}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
              <I size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 12, color: "#7c6fa0", fontWeight: 600 }}>{t(label)}</span>
          </motion.button>
        ))}
      </div>
    </Sheet>
  );

  if (isDesktop) {
    return (
      <div className="h-full overflow-y-auto" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto w-full max-w-[1160px] px-8 pt-6 pb-16">
          <button onClick={onBack} className="flex items-center gap-1 mb-4 px-2 py-1.5 -ml-2 rounded-lg hover:bg-[#ede8fb]" style={{ fontSize: 15, fontWeight: 700, color: "#6b21d9" }}>
            <ChevronLeft size={17} strokeWidth={2.5} />{" "}{t("Back")}</button>
          {gallery(440, true)}
          <div className="grid grid-cols-[1fr_380px] gap-10 mt-8 items-start">
            <div className="flex flex-col gap-7">
              {titleBlock}
              {whoIsComing}
              {hostCard}
              {description}
              {costBox}
              {dietary}
              {ingredients}
              {reviews}
            </div>
            <aside className="sticky top-6 flex flex-col gap-4">
              <div className="rounded-3xl p-6" style={{ background: "#fff", boxShadow: "0 8px 32px rgba(46,16,96,0.08)" }}>
                <div className="flex items-baseline gap-1.5">
                  <span style={{ fontSize: 32, fontWeight: 900, color: "#160a2e" }}>{euro(meal.price)}</span>
                  <span style={{ fontSize: 15, color: "#7c6fa0" }}>{t("contribution")}</span>
                </div>
                <p style={{ fontSize: 13, color: "#7c6fa0" }}>{t("Shares the cost of the ingredients · + 12% Bite service fee")}</p>
                <div className="my-4">{infoPills}</div>
                {ctaButton}
                <p className="flex items-center justify-center gap-1.5 mt-3" style={{ fontSize: 12.5, color: "#7c6fa0" }}>
                  <ShieldCheck size={14} color="#0a7c4e" />{" "}{t("Free cancellation up to 24h before")}</p>
              </div>
              {location}
            </aside>
          </div>
        </div>
        {shareSheet}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      <div className="relative">
        {gallery(270, false)}
        <div className="absolute flex items-center justify-between px-4" style={{ top: "max(env(safe-area-inset-top), 14px)", marginTop: 8, left: 0, right: 0 }}>
          <motion.button onClick={onBack} aria-label={t("Back")} className="w-10 h-10 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.92)" }} whileTap={{ scale: 0.85 }}>
            <ChevronLeft size={19} color="#160a2e" strokeWidth={2.5} />
          </motion.button>
          {actionButtons}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 flex flex-col gap-4 [&>*]:flex-shrink-0" style={{ scrollbarWidth: "none" }}>
        {titleBlock}
        {whoIsComing}
        {hostCard}
        {infoPills}
        {location}
        {dietary}
        {description}
        {costBox}
        {ingredients}
        {reviews}
        <div style={{ height: 96, flexShrink: 0 }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 pt-4" style={{ background: "linear-gradient(to top, #f5f4f9 75%, transparent)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
        {ctaButton}
      </div>

      {shareSheet}
    </div>
  );
}
