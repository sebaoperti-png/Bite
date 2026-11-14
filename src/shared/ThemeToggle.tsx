// Light / dark switch for the website (landing and legal page). Same choice as the app (localStorage "bite_theme",
// src/app/theme.ts): until someone taps it, the site follows the phone or computer. Dark on the website is the
// "inverted contrast" look (like a dark-reader extension): the page is inverted and hue-rotated, photos, the film
// and the app preview are turned back (site-dark.css).
import { useEffect, useState } from "react";
import { setThemeChoice, useThemeSync } from "../app/theme";
import { t } from "./i18n";
import "./site-dark.css";

const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";

export function ThemeToggle({ className = "", label = false }: { className?: string; label?: boolean }) {
  useThemeSync();
  const [dark, setDark] = useState(isDark);
  useEffect(() => { const on = () => setDark(isDark()); window.addEventListener("bite:theme", on); return () => window.removeEventListener("bite:theme", on); }, []);
  const flip = () => { setThemeChoice(dark ? "light" : "dark"); setDark(!dark); };
  const name = dark ? t("Switch to light mode") : t("Switch to dark mode");
  return (
    <button type="button" className={`th-tg ${className}`} onClick={flip} aria-label={name} title={name} aria-pressed={dark}>
      {dark ? (
        <svg viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden><path d="M20 14.6A8 8 0 0 1 9.4 4a8 8 0 1 0 10.6 10.6z" /></svg>
      )}
      {label && <span>{dark ? t("Light mode") : t("Dark mode")}</span>}
    </button>
  );
}
