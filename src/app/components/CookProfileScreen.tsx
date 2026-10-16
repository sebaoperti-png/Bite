import { useState } from "react";
import { useStore, copyText } from "../store";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, Star, MapPin, Clock, Users, MessageCircle,
  Shield, BadgeCheck, Globe, Zap, ChefHat, CheckCircle,
  Heart, Share2,
} from "lucide-react";
import { t, tMaybe, dec } from "../../shared/i18n";
import { localPlace } from "../location";

interface CookProfileScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

const REVIEWS = [
  {
    id: 1,
    name: "Lena F.",
    avatar: "app/img/1438761681033-160x160.jpg",
    rating: 5,
    date: "May 2025",
    text: "An incredible host — the Thai curry was better than any restaurant I've been to. The atmosphere was so warm and welcoming!",
  },
  {
    id: 2,
    name: "Marco D.",
    avatar: "app/img/1507003211169-160x160.jpg",
    rating: 5,
    date: "Apr 2025",
    text: "Amazing evening. Great food, great conversation. Speaks perfect English too which was a bonus for me.",
  },
  {
    id: 3,
    name: "Anna R.",
    avatar: "app/img/1544005313-160x160.jpg",
    rating: 4,
    date: "Mar 2025",
    text: "Really lovely experience, the pasta was fresh and delicious. Will definitely be back!",
  },
];

const CUISINES = ["Italian", "Thai", "Mediterranean", "Moroccan"];
const DIETARY = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free"];

export function CookProfileScreen({ onBack, onContinue }: CookProfileScreenProps) {
  const [liked, setLiked] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const store = useStore();
  const name = store.profile.name;
  const first = name.split(" ")[0];
  const share = async () => {
    const ok = await copyText(t("{name} hosts home-cooked meals on Bite:", { name }) + " https://sebaoperti-png.github.io/Bite/");
    store.showToast(ok ? t("Profile link copied") : t("Link: sebaoperti-png.github.io/Bite"));
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      {/* Status bar space */}
      <div style={{ height: "max(env(safe-area-inset-top), 14px)", background: "#fff", flexShrink: 0 }} />

      {/* Sticky Header */}
      <div
        className="flex items-center justify-between px-4 pb-3 pt-2 flex-shrink-0"
        style={{ background: "#fff", borderBottom: "1px solid rgba(107,33,217,0.08)" }}
      >
        <motion.button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: "#f0ecfa" }}
          whileTap={{ scale: 0.88 }}
        >
          <ChevronLeft size={18} color="#6b21d9" strokeWidth={2.5} />
        </motion.button>
        <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{t("Your host profile")}</p>
        <motion.button
          onClick={() => { setLiked(l => !l); store.showToast(liked ? t("Removed from favourites") : t("Saved to favourites")); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: "#f0ecfa" }}
          whileTap={{ scale: 0.85 }}
        >
          <Heart
            size={17}
            color={liked ? "#e9345a" : "#7c6fa0"}
            fill={liked ? "#e9345a" : "none"}
            strokeWidth={2.2}
          />
        </motion.button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Hero Card */}
        <div style={{ background: "#fff", marginBottom: 8 }}>
          {/* Cover + Avatar */}
          <div className="relative" style={{ height: 140 }}>
            <img
              src="app/img/1556909114-1200x420.jpg"
              alt={t("Kitchen")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.35))" }} />
          </div>

          <div className="px-5" style={{ position: "relative", marginTop: -40, paddingBottom: 20 }}>
            {/* Avatar */}
            <div className="relative inline-block" style={{ marginBottom: 12 }}>
              <div
                aria-label={name}
                style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid #fff", background: "linear-gradient(135deg,#6b21d9,#9b4aff)", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span style={{ fontSize: 30, fontWeight: 900, color: "#fff" }}>{name.charAt(0)}</span>
              </div>
              <motion.div
                className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
                style={{ width: 24, height: 24, background: "#0a7c4e", border: "2.5px solid #fff" }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
              >
                <CheckCircle size={12} color="#fff" strokeWidth={2.5} />
              </motion.div>
            </div>

            {/* Name + badges row */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#160a2e", lineHeight: 1.2 }}>{name}</h2>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ background: "#e5f7f0", flexShrink: 0 }}
                  >
                    <BadgeCheck size={11} color="#0a7c4e" strokeWidth={2.5} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#0a7c4e" }}>{t("VERIFIED")}</span>
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#7c6fa0", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} color="#7c6fa0" strokeWidth={2} />
                  {localPlace(store.profile.neighbourhood)}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={share} aria-label={t("Share profile")}>
                <Share2 size={18} color="#7c6fa0" strokeWidth={2} />
              </motion.button>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-4">
              {[
                { value: dec(4.9), label: "Rating", icon: <Star size={13} color="#f59e0b" fill="#f59e0b" /> },
                { value: "47", label: "Meals", icon: <ChefHat size={13} color="#6b21d9" strokeWidth={2} /> },
                { value: "98%", label: "Response", icon: <Zap size={13} color="#6b21d9" strokeWidth={2} /> },
              ].map(({ value, label, icon }) => (
                <div key={label} className="flex-1 flex flex-col items-center py-3 rounded-2xl" style={{ background: "#f5f4f9" }}>
                  <div className="flex items-center gap-1 mb-0.5">{icon}<span style={{ fontSize: 17, fontWeight: 900, color: "#160a2e" }}>{value}</span></div>
                  <span style={{ fontSize: 10, color: "#7c6fa0", fontWeight: 600 }}>{t(label)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About section */}
        <Section title={t("About {name}", { name: first })}>
          <p style={{ fontSize: 13.5, color: "#4a3a6e", lineHeight: 1.7 }}>
            "{tMaybe(store.profile.bio)}"
          </p>
        </Section>

        {/* Details grid */}
        <Section title={t("Details")}>
          <div className="flex flex-col gap-3">
            <DetailRow icon={<Globe size={15} color="#6b21d9" strokeWidth={2} />} label={t("Languages")} value={t("Italian, English, German")} />
            <DetailRow icon={<MapPin size={15} color="#6b21d9" strokeWidth={2} />} label={t("Location")} value={localPlace(store.profile.neighbourhood)} />
            <DetailRow icon={<Clock size={15} color="#6b21d9" strokeWidth={2} />} label={t("Avg. response time")} value={t("Under 1 hour")} />
            <DetailRow icon={<Zap size={15} color="#6b21d9" strokeWidth={2} />} label={t("Response rate")} value="98%" />
            <DetailRow icon={<Users size={15} color="#6b21d9" strokeWidth={2} />} label={t("Completed meals")} value={t("47 meals hosted")} />
            <DetailRow icon={<MessageCircle size={15} color="#6b21d9" strokeWidth={2} />} label={t("Member since")} value={t("January 2024")} />
          </div>
        </Section>

        {/* Verifications */}
        <Section title={t("Identity & Trust")}>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: Shield, label: "Government ID verified", done: true },
              { icon: BadgeCheck, label: "Email address verified", done: true },
              { icon: MessageCircle, label: "Phone number verified", done: true },
            ].map(({ icon: Icon, label, done }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={15} color={done ? "#0a7c4e" : "#c4b8de"} strokeWidth={2} />
                <span style={{ fontSize: 13, color: done ? "#160a2e" : "#c4b8de", fontWeight: done ? 600 : 400 }}>{t(label)}</span>
                {done && <CheckCircle size={14} color="#0a7c4e" strokeWidth={2} style={{ marginLeft: "auto", flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </Section>

        {/* Cuisines */}
        <Section title={t("Cuisine Specialties")}>
          <div className="flex flex-wrap gap-2 mb-4">
            {CUISINES.map(c => (
              <span key={c} className="px-3.5 py-1.5 rounded-full" style={{ background: "#ede8fb", fontSize: 12.5, fontWeight: 700, color: "#6b21d9" }}>{t(c)}</span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#7c6fa0", fontWeight: 600, marginBottom: 10 }}>{t("Dietary options offered")}</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY.map(d => (
              <span key={d} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#e5f7f0", fontSize: 12, fontWeight: 700, color: "#0a7c4e" }}>
                <CheckCircle size={10} color="#0a7c4e" strokeWidth={2.5} />
                {t(d)}
              </span>
            ))}
          </div>
        </Section>

        {/* Reviews */}
        <Section title={t("Reviews ({n})", { n: REVIEWS.length })} action={
          <motion.button onClick={() => setShowAllReviews(s => !s)} whileTap={{ scale: 0.9 }}>
            <span style={{ fontSize: 12, color: "#6b21d9", fontWeight: 700 }}>
              {showAllReviews ? t("Show less") : t("See all")}
            </span>
          </motion.button>
        }>
          {/* Overall rating bar */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl" style={{ background: "#f5f4f9" }}>
            <div className="flex flex-col items-center">
              <span style={{ fontSize: 34, fontWeight: 900, color: "#160a2e", lineHeight: 1 }}>{dec(4.9)}</span>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} color="#f59e0b" fill="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: 10, color: "#7c6fa0", marginTop: 3 }}>{t("out of 5")}</span>
            </div>
            <div className="flex-1">
              {[5,4,3].map((stars, idx) => (
                <div key={stars} className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 10, color: "#7c6fa0", width: 8 }}>{stars}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "#e0d8f5" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "#6b21d9" }}
                      initial={{ width: 0 }}
                      animate={{ width: idx === 0 ? "85%" : idx === 1 ? "12%" : "3%" }}
                      transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {(showAllReviews ? REVIEWS : REVIEWS.slice(0, 2)).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <img src={r.avatar} alt={r.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#160a2e" }}>{r.name}</span>
                        <span style={{ fontSize: 11, color: "#7c6fa0" }}>{t(r.date)}</span>
                      </div>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} size={10} color="#f59e0b" fill="#f59e0b" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12.5, color: "#4a3a6e", lineHeight: 1.65 }}>{t(r.text)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* Bottom spacing */}
        <div style={{ height: 120 }} />
      </div>

      {/* Sticky CTA */}
      <div
        className="px-5 pb-8 pt-4 flex flex-col gap-3 flex-shrink-0"
        style={{ background: "linear-gradient(to top, #fff 70%, transparent)", borderTop: "1px solid rgba(107,33,217,0.07)" }}
      >
        <motion.button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", pointerEvents: "none" }}
            animate={{ x: [-400, 400] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
          <ChefHat size={18} color="#fff" strokeWidth={2} />
          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{t("Start Hosting")}</span>
        </motion.button>

        <motion.button
          onClick={onBack}
          className="w-full py-3 rounded-2xl flex items-center justify-center"
          style={{ background: "transparent", border: "1.5px solid rgba(107,33,217,0.18)" }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#7c6fa0" }}>{t("Maybe later")}</span>
        </motion.button>
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", marginBottom: 8, padding: "18px 20px" }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0ecfa" }}>
        {icon}
      </div>
      <span style={{ fontSize: 12.5, color: "#7c6fa0", fontWeight: 500, minWidth: 120 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#160a2e", fontWeight: 700, marginLeft: "auto", textAlign: "right" }}>{value}</span>
    </div>
  );
}
