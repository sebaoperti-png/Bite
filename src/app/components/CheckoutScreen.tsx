import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Minus, Plus, Shield, Lock, CreditCard, CheckCircle, Calendar, MapPin, Users, Leaf } from "lucide-react";
import confetti from "canvas-confetti";
import { feeFor, euro, type Meal } from "../data";
import { useStore, type Booking } from "../store";
import { useIsDesktop } from "../useIsDesktop";
import { localPlace } from "../location";
import { t, tMaybe, dateLabel } from "../../shared/i18n";


/** Booking step between the meal page and the confirmation chat: guests, note to host, price, (demo) payment. */
export function CheckoutScreen({ meal, onBack, onBooked }: { meal: Meal; onBack: () => void; onBooked: (b: Booking) => void }) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const left = store.seatsLeft(meal);
  const [guests, setGuests] = useState(Math.min(1, left) || 1);
  const [note, setNote] = useState(store.profile.dietary.length ? t("Hi! Just so you know, I'm {diet}.", { diet: store.profile.dietary.map((d) => t(d)).join(", ").toLowerCase() }) : "");
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const subtotal = meal.price * guests;
  const fees = Math.round(feeFor(meal.price) * guests * 100) / 100;
  const total = Math.round((subtotal + fees) * 100) / 100;
  const unit = meal.serviceType === "pickup" ? "order" : meal.serviceType === "eat-together" ? "seat" : "spot";

  const pay = () => {
    if (!agree) { setError(t("Please accept the booking terms to continue.")); return; }
    if (guests > left) { setError(t("Not enough seats left.")); return; }
    setError("");
    setPaying(true);
    setTimeout(() => {
      const b = store.book(meal, guests, note);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ["#6b21d9", "#b87fff", "#ffffff", "#9b4aff"] });
      onBooked(b);
    }, 1100);
  };

  const summary = (
    <div className="rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>
      <div className="flex gap-3 p-4">
        <img src={meal.image} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
        <div className="min-w-0">
          <p style={{ fontSize: 16, fontWeight: 800, color: "#160a2e", lineHeight: 1.25 }}>{tMaybe(meal.title)}</p>
          <p style={{ fontSize: 12.5, color: "#7c6fa0", marginTop: 2 }}>{t("with {name}", { name: meal.host })}</p>
          <div className="flex flex-col gap-0.5 mt-1.5" style={{ fontSize: 12, color: "#4a3a6e" }}>
            <span className="flex items-center gap-1.5"><Calendar size={12} color="#6b21d9" />{dateLabel(meal.date)} · {meal.time}</span>
            <span className="flex items-center gap-1.5 truncate"><MapPin size={12} color="#6b21d9" />{localPlace(meal.location.split(", ").slice(-2).join(", "))}</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid rgba(107,33,217,0.07)" }}>
        <Line label={`${euro(meal.price)} × ${guests === 1 ? t(`1 ${unit}`) : t(`{n} ${unit}s`, { n: guests })}`} value={euro(subtotal)} />
        <Line label={t("Bite service fee (12%)")} value={euro(fees)} />
        <div className="flex items-center justify-between pt-3 mt-2" style={{ borderTop: "1px dashed rgba(107,33,217,0.15)" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{t("Total")}</span>
          <motion.span key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} style={{ fontSize: 20, fontWeight: 900, color: "#6b21d9" }}>{euro(total)}</motion.span>
        </div>
        <p style={{ fontSize: 11.5, color: "#7c6fa0", marginTop: 6 }}>{t("Your contribution covers the ingredients — not a restaurant bill. Free cancellation up to 24h before.")}</p>
      </div>
    </div>
  );

  const form = (
    <div className="flex flex-col gap-4">
      {/* Guests */}
      <Card title={t("Guests")} Icon={Users}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{guests > 1 ? t("{n} people", { n: guests }) : t("1 person")}</p>
            <p style={{ fontSize: 12, color: left <= 2 ? "#e9345a" : "#7c6fa0", fontWeight: left <= 2 ? 700 : 500 }}>{left === 1 ? t("1 seat left") : t("{n} seats left", { n: left })}</p>
          </div>
          <div className="flex items-center gap-3">
            <RoundBtn label={t("Fewer guests")} disabled={guests <= 1} onClick={() => setGuests((g) => g - 1)}><Minus size={16} /></RoundBtn>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#160a2e", minWidth: 18, textAlign: "center" }}>{guests}</span>
            <RoundBtn label={t("More guests")} disabled={guests >= left} onClick={() => setGuests((g) => g + 1)} filled><Plus size={16} /></RoundBtn>
          </div>
        </div>
      </Card>

      {/* Message */}
      <Card title={t("Message to {name}", { name: meal.host.split(" ")[0] })} Icon={Leaf}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder={t("Allergies, dietary needs, or just say hi…")}
          className="w-full rounded-2xl outline-none"
          style={{ background: "#f5f4f9", border: "1.5px solid rgba(107,33,217,0.12)", padding: "10px 14px", fontSize: 14, color: "#160a2e", resize: "none", fontFamily: "inherit" }}
        />
      </Card>

      {/* Payment */}
      <Card title={t("Payment")} Icon={CreditCard}>
        <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#f7f4fd", border: "1.5px solid #6b21d9" }}>
          <div className="w-11 h-8 rounded-md flex items-center justify-center" style={{ background: "#160a2e" }}>
            <span style={{ fontSize: 10, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>{t("VISA")}</span>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{t("Visa ···· 4242")}</p>
            <p style={{ fontSize: 11.5, color: "#7c6fa0" }}>{t("Demo card — you will not be charged")}</p>
          </div>
          <CheckCircle size={18} color="#6b21d9" />
        </div>
        <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
          <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError(""); }} className="mt-0.5 w-4 h-4 accent-[#6b21d9]" />
          <span style={{ fontSize: 12.5, color: "#4a3a6e", lineHeight: 1.5 }}>{t("I agree to the")}{" "}<a href="legal.html#terms" target="_blank" rel="noopener" style={{ color: "#6b21d9", fontWeight: 700 }}>{t("booking terms")}</a>{" "}{t("and the host's house rules.")}</span>
        </label>
        <AnimatePresence>
          {error && (
            <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 12.5, color: "#e9345a", fontWeight: 700, marginTop: 8 }}>{error}</motion.p>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );

  const payButton = (
    <motion.button
      onClick={pay}
      disabled={paying || left === 0}
      className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
      style={{ background: left === 0 ? "#c4b8de" : "linear-gradient(135deg, #6b21d9, #9b4aff)", boxShadow: "0 12px 28px rgba(107,33,217,0.28)" }}
      whileTap={{ scale: 0.97 }}
    >
      {paying ? (
        <>
          <motion.span className="w-4 h-4 rounded-full border-2 border-white" style={{ borderTopColor: "transparent" }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{t("Confirming…")}</span>
        </>
      ) : (
        <>
          <Lock size={15} color="#fff" strokeWidth={2.5} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{left === 0 ? t("Sold out") : t("Confirm & pay {price}", { price: euro(total) })}</span>
        </>
      )}
    </motion.button>
  );

  const trust = (
    <div className="flex items-center justify-center gap-1.5" style={{ fontSize: 11.5, color: "#7c6fa0" }}>
      <Shield size={12} color="#0a7c4e" />{" "}{t("Secure payments · verified host · insured meal")}</div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      {!isDesktop && <div style={{ height: "max(env(safe-area-inset-top), 14px)", background: "#fff", flexShrink: 0 }} />}
      <div className={isDesktop ? "mx-auto w-full max-w-[1040px] px-8 pt-8" : "px-4 pt-2 pb-3 flex items-center gap-3"} style={isDesktop ? undefined : { background: "#fff", borderBottom: "1px solid rgba(107,33,217,0.08)" }}>
        <div className="flex items-center gap-3">
          <motion.button onClick={onBack} aria-label={t("Back")} className="p-2 rounded-xl" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.88 }}>
            <ChevronLeft size={18} color="#6b21d9" strokeWidth={2.5} />
          </motion.button>
          <div>
            <p style={{ fontSize: isDesktop ? 28 : 16, fontWeight: 900, color: "#160a2e", letterSpacing: "-0.01em" }}>{t("Confirm your booking")}</p>
            {isDesktop && <p style={{ fontSize: 14, color: "#7c6fa0" }}>{t("You won't be charged in this demo")}</p>}
          </div>
        </div>
      </div>

      {isDesktop ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1040px] px-8 py-6 grid grid-cols-[1fr_380px] gap-8 items-start">
            {form}
            <div className="sticky top-0 flex flex-col gap-4">{summary}{payButton}{trust}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 [&>*]:flex-shrink-0" style={{ scrollbarWidth: "none" }}>
            {summary}
            {form}
            {trust}
          </div>
          <div className="px-4 pt-3 flex-shrink-0" style={{ background: "#fff", borderTop: "1px solid rgba(107,33,217,0.08)", paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}>
            {payButton}
          </div>
        </>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span style={{ fontSize: 13, color: "#7c6fa0" }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#160a2e" }}>{value}</span>
    </div>
  );
}

function Card({ title, Icon, children }: { title: string; Icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl p-4" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.05)" }}>
      <p className="flex items-center gap-2 mb-3" style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        <Icon size={14} color="#6b21d9" strokeWidth={2.2} />{title}
      </p>
      {children}
    </section>
  );
}

function RoundBtn({ children, onClick, disabled, filled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; filled?: boolean; label: string }) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: filled ? "#6b21d9" : "#ede8fb", color: filled ? "#fff" : "#6b21d9", opacity: disabled ? 0.35 : 1 }}
      whileTap={disabled ? {} : { scale: 0.88 }}
    >
      {children}
    </motion.button>
  );
}
