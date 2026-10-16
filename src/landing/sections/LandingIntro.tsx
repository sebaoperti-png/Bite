// INTRO — the logo "b" gets bitten, "ite" slides in, then the curtain lifts.
// Plays once per browser session (add ?intro to the URL to replay it); click or Esc skips it.
import { useEffect, useState } from "react";
import { LogoWord } from "./LogoWord";
import { t } from "../../shared/i18n";

const KEY = "bite_intro_seen";
const TOTAL_MS = 2900;

const CRUMBS = Array.from({ length: 22 }, (_, i) => {
  const angle = -95 + (i / 21) * 170; // spray up and to the right, then fall
  const dist = 80 + ((i * 37) % 130);
  return {
    x: Math.cos((angle * Math.PI) / 180) * dist,
    y: Math.sin((angle * Math.PI) / 180) * dist,
    size: 7 + ((i * 7) % 13),
    delay: (i % 6) * 0.02,
    rot: (i * 53) % 360,
  };
});

function shouldPlay() {
  try {
    if (new URLSearchParams(window.location.search).has("intro")) return true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return !sessionStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function LandingIntro() {
  const [play] = useState(shouldPlay);
  const [phase, setPhase] = useState<"on" | "leaving" | "gone">(play ? "on" : "gone");

  useEffect(() => {
    if (!play) return;
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    document.documentElement.style.overflow = "hidden";
    const t1 = window.setTimeout(() => setPhase("leaving"), TOTAL_MS - 700);
    const t2 = window.setTimeout(() => setPhase("gone"), TOTAL_MS);
    const skip = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setPhase("leaving"); };
    window.addEventListener("keydown", skip);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.removeEventListener("keydown", skip); };
  }, [play]);

  useEffect(() => {
    if (phase === "gone") document.documentElement.style.overflow = "";
    if (phase === "leaving") {
      const t = window.setTimeout(() => setPhase("gone"), 700);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`in-overlay ${phase === "leaving" ? "leaving" : ""}`} onClick={() => setPhase("leaving")} aria-hidden="true">
      <BiteMark />
    </div>
  );
}

/** The animated word itself: the logo "b" pops in, gets bitten (crumbs fly), "ite" slides in. */
function BiteMark() {
  return (
    <div className="in-stage">
      <LogoWord id="in" top="#ffffff" bottom="#d9c2ff" className="in-word" bClass="in-b" teethClass="in-teeth" iteClass="in-ite" />
      <div className="in-crumbs">
        {CRUMBS.map((c, i) => (
          <span
            key={i}
            style={{
              width: c.size, height: c.size,
              ["--x" as string]: `${c.x}px`, ["--y" as string]: `${c.y}px`, ["--r" as string]: `${c.rot}deg`,
              animationDelay: `calc(var(--d, 0s) + ${0.78 + c.delay}s)`,
            }}
          />
        ))}
      </div>
      <div className="in-tag">{t("Food is better shared")}</div>
    </div>
  );
}

/**
 * Same animation, played when leaving the landing page for the app:
 * the curtain drops down, the B gets bitten, then the app opens.
 */
export function AppTransition() {
  return (
    <div className="in-overlay in-entering" aria-hidden="true" style={{ ["--d" as string]: "0.4s" }}>
      <BiteMark />
    </div>
  );
}

/** How long AppTransition needs before the browser should switch to the app */
export const APP_TRANSITION_MS = 3000;
