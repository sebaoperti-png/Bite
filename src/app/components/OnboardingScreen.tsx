import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Utensils, ArrowRight, Check } from "lucide-react";
import logoImg from "../logo.png";

type Role = "cook" | "eat" | null;

interface OnboardingScreenProps {
  onCook: () => void;
  onEat: () => void;
  onSignIn: () => void;
}

export function OnboardingScreen({ onCook, onEat, onSignIn }: OnboardingScreenProps) {
  const [selected, setSelected] = useState<Role>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleContinue = () => {
    if (!selected) return;
    setConfirmed(true);
    setTimeout(() => {
      selected === "cook" ? onCook() : onEat();
    }, 700);
  };

  return (
    <div
      className="relative flex flex-col h-full overflow-y-auto md:justify-center"
      style={{ fontFamily: "'Inter', sans-serif", background: "#160a2e" }}
    >
      {/* Top gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,33,217,0.55) 0%, transparent 70%), linear-gradient(180deg, #1c0e3a 0%, #0e0620 100%)",
        }}
      />

      {/* Decorative orbs */}
      <motion.div
        className="absolute"
        style={{ width: 300, height: 300, borderRadius: "50%", top: -80, left: -80, background: "radial-gradient(circle, rgba(107,33,217,0.18) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.08, 1], rotate: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{ width: 200, height: 200, borderRadius: "50%", bottom: 180, right: -60, background: "radial-gradient(circle, rgba(184,127,255,0.14) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Status bar */}
      <div style={{ height: "max(env(safe-area-inset-top), 14px)", flexShrink: 0 }} />

      {/* Logo */}
      <div className="relative flex flex-col items-center pt-10 pb-8 px-6">
        {/* Logo glow ring */}
        <motion.div
          className="absolute"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            top: 24,
            background: "radial-gradient(circle, rgba(107,33,217,0.35) 0%, transparent 70%)",
            filter: "blur(16px)",
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.img
          src={logoImg}
          alt="Bite"
          style={{ width: 96, height: 96, borderRadius: 28, objectFit: "cover" }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 20 }}
        />

        <motion.div
          className="mt-5 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(184,127,255,0.9)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Welcome to
          </p>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>
            Bite
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginTop: 6, lineHeight: 1.5 }}>
            Real food, real people,<br />your neighbourhood
          </p>
        </motion.div>
      </div>

      {/* Question card */}
      <motion.div
        className="relative mx-5 md:mx-auto md:w-[480px] rounded-3xl overflow-hidden flex-shrink-0"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 260, damping: 24 }}
      >
        <div className="px-5 pt-5 pb-4">
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(184,127,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            New member
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginTop: 4, lineHeight: 1.2 }}>
            What brings you here?
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
            We'll personalise your experience
          </p>
        </div>

        {/* Option cards */}
        <div className="px-4 pb-5 flex flex-col gap-3">
          <RoleCard
            role="cook"
            selected={selected === "cook"}
            onSelect={() => setSelected("cook")}
            icon={ChefHat}
            title="Cook for others"
            desc="Cook a little extra, share your table and split the cost of the groceries"
            accent="#9b4aff"
            accentBg="rgba(107,33,217,0.35)"
          />
          <RoleCard
            role="eat"
            selected={selected === "eat"}
            onSelect={() => setSelected("eat")}
            icon={Utensils}
            title="Find & eat"
            desc="Discover homemade food from cooks in your neighbourhood"
            accent="#b87fff"
            accentBg="rgba(184,127,255,0.25)"
          />
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="relative px-5 mt-5 md:px-0 md:mx-auto md:w-[480px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: selected ? 1 : 0.4, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <motion.button
          onClick={handleContinue}
          disabled={!selected}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 relative overflow-hidden"
          style={{
            background: selected ? "linear-gradient(135deg, #6b21d9, #9b4aff)" : "rgba(255,255,255,0.08)",
            border: selected ? "none" : "1px solid rgba(255,255,255,0.1)",
          }}
          whileTap={selected ? { scale: 0.97 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <AnimatePresence mode="wait">
            {confirmed ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <Check size={18} color="#fff" strokeWidth={2.5} />
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Let's go!</span>
              </motion.div>
            ) : (
              <motion.div key="label" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span style={{ color: selected ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 800, fontSize: 15 }}>
                  {selected ? `Continue as ${selected === "cook" ? "a cook" : "a food lover"}` : "Pick an option above"}
                </span>
                {selected && <ArrowRight size={16} color="#fff" strokeWidth={2.5} />}
              </motion.div>
            )}
          </AnimatePresence>

          {selected && (
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
              animate={{ x: [-390, 390] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Sign in link */}
      <motion.p
        className="relative text-center mt-4 pb-6"
        style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Already have an account?{" "}
        <button onClick={onSignIn} style={{ color: "#b87fff", fontWeight: 700 }}>Log in</button>
      </motion.p>
    </div>
  );
}

function RoleCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  desc,
  accent,
  accentBg,
}: {
  role: Role;
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
  accent: string;
  accentBg: string;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className="w-full text-left flex items-start gap-3.5 p-4 rounded-2xl relative overflow-hidden"
      style={{
        background: selected ? accentBg : "rgba(255,255,255,0.04)",
        border: selected ? `1.5px solid ${accent}55` : "1.5px solid rgba(255,255,255,0.08)",
      }}
      whileTap={{ scale: 0.97 }}
      animate={{ scale: selected ? 1.01 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Icon */}
      <motion.div
        className="flex items-center justify-center flex-shrink-0 rounded-xl"
        style={{
          width: 44,
          height: 44,
          background: selected ? accent : "rgba(255,255,255,0.07)",
        }}
        animate={{ background: selected ? accent : "rgba(255,255,255,0.07)" }}
        transition={{ duration: 0.2 }}
      >
        <Icon size={20} color={selected ? "#fff" : "rgba(255,255,255,0.45)"} strokeWidth={selected ? 2.2 : 1.6} />
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p style={{ fontSize: 15, fontWeight: 700, color: selected ? "#ffffff" : "rgba(255,255,255,0.75)" }}>{title}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3, lineHeight: 1.45 }}>{desc}</p>
      </div>

      {/* Selection indicator */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: accent }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
          >
            <Check size={10} color="#fff" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
