import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import logoImg from "../logo.png";

const LOADING_STEPS = [
  "Finding cooks near you…",
  "Checking tonight's menus…",
  "Almost ready…",
];

interface SplashScreenProps {
  onDone: () => void;
  /** Returning visitors get a much shorter splash */
  fast?: boolean;
}

export function SplashScreen({ onDone, fast = false }: SplashScreenProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const k = fast ? 0.35 : 1;
    // Progress bar
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 1.6 / k;
      });
    }, 28);

    // Step text rotation
    const s1 = setTimeout(() => setStep(1), 900 * k);
    const s2 = setTimeout(() => setStep(2), 1800 * k);
    const s3 = setTimeout(() => { setDone(true); setTimeout(onDone, 600 * k); }, 2700 * k);

    return () => { clearInterval(interval); clearTimeout(s1); clearTimeout(s2); clearTimeout(s3); };
  }, [onDone, fast]);

  return (
    <div className="flex flex-col h-full items-center justify-between overflow-hidden" style={{ background: "linear-gradient(160deg, #0d0620 0%, #1a0840 40%, #2d1068 100%)", fontFamily: "'Inter', sans-serif" }}>

      {/* Background particles */}
      {Array.from({ length: 22 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
            height: i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1.5,
            top: `${8 + (i * 41) % 85}%`,
            left: `${(i * 47) % 92}%`,
            background: i % 3 === 0 ? "rgba(184,127,255,0.8)" : "rgba(255,255,255,0.5)",
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 1.8 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}

      {/* Pulsing rings */}
      {[1, 1.6, 2.2].map((scale, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            top: "50%",
            left: "50%",
            marginTop: -80,
            marginLeft: -80,
            border: "1px solid rgba(107,33,217,0.25)",
          }}
          animate={{ scale: [scale, scale + 0.6, scale], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.55, ease: "easeOut" }}
        />
      ))}

      <div style={{ height: 80 }} />

      {/* Logo area */}
      <div className="flex flex-col items-center gap-6">
        {/* Glow */}
        <motion.div
          className="absolute rounded-full"
          style={{ width: 160, height: 160, background: "radial-gradient(circle, rgba(107,33,217,0.45) 0%, transparent 70%)", filter: "blur(20px)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 18 }}
        >
          <motion.img
            src={logoImg}
            alt="Bite"
            style={{ width: 108, height: 108, borderRadius: 30, objectFit: "cover", boxShadow: "0 0 40px rgba(107,33,217,0.5)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Wordmark */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring" }}
        >
          <h1 style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>Bite</h1>
          <p style={{ fontSize: 13, color: "rgba(184,127,255,0.75)", fontWeight: 500, letterSpacing: "0.08em" }}>
            FOOD SHARING
          </p>
        </motion.div>
      </div>

      {/* Bottom loading area */}
      <div className="w-full px-10 pb-20 flex flex-col items-center gap-5">
        {/* Step text */}
        <div style={{ height: 22 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500, textAlign: "center" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {done ? "Ready!" : LOADING_STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #6b21d9, #b87fff)", width: `${Math.min(progress, 100)}%` }}
            transition={{ ease: "linear" }}
          />
        </div>

        {/* Dot indicator */}
        <div className="flex gap-2">
          {LOADING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              animate={{
                width: step === i ? 20 : 6,
                background: step === i ? "#b87fff" : "rgba(255,255,255,0.2)",
              }}
              style={{ height: 6 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
