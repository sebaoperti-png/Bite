import { motion } from "motion/react";
import { LogoWord } from "../../landing/sections/LogoWord";

/**
 * Opening screen of the real app (live mode) while Supabase answers.
 * Same night-purple as the log-in screen, so nothing jumps: the bite wordmark breathes in, the teeth
 * take a bite, a thin light runs under it, then the whole screen fades into the app (see store.tsx).
 * It only appears if loading takes longer than a blink.
 */
export function BootScreen() {
  return (
    <motion.div
      className="boot fixed inset-0 z-[100] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.18, duration: 0.35 } }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)", transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
      role="status"
      aria-label="Bite"
    >
      <style>{`
        .boot { background: radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,33,217,0.55) 0%, transparent 70%), linear-gradient(180deg, #1c0e3a 0%, #0e0620 100%); }
        .boot-glow { position: absolute; width: 340px; height: 340px; border-radius: 50%; background: radial-gradient(circle, rgba(155,74,255,0.35), transparent 65%); animation: bootGlow 2.4s ease-in-out infinite; }
        .boot-word { width: min(62vw, 260px); height: auto; position: relative; animation: bootIn .7s cubic-bezier(.22,1,.36,1) both; }
        .boot-teeth { transform-origin: 72% 45%; animation: bootChomp 1.6s cubic-bezier(.5,0,.2,1) .5s infinite; }
        .boot-line { position: relative; margin-top: 26px; width: 120px; height: 2px; border-radius: 2px; background: rgba(255,255,255,0.12); overflow: hidden; }
        .boot-line::after { content: ""; position: absolute; inset: 0; width: 40%; border-radius: 2px; background: linear-gradient(90deg, transparent, #b87fff, transparent); animation: bootRun 1.2s ease-in-out infinite; }
        @keyframes bootIn { from { opacity: 0; transform: translateY(10px) scale(.94); } to { opacity: 1; transform: none; } }
        @keyframes bootGlow { 0%,100% { transform: scale(.9); opacity: .7; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes bootChomp { 0%,55%,100% { transform: scale(1); } 65% { transform: scale(1.25); } 75% { transform: scale(.92); } }
        @keyframes bootRun { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
        @media (prefers-reduced-motion: reduce) { .boot-glow, .boot-word, .boot-teeth, .boot-line::after { animation: none; } }
      `}</style>
      <span className="boot-glow" aria-hidden />
      <LogoWord id="boot" top="#ffffff" bottom="#d9c2ff" className="boot-word" teethClass="boot-teeth" />
      <span className="boot-line" aria-hidden />
    </motion.div>
  );
}
