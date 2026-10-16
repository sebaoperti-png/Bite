// Tiny translation layer shared by the landing page and the app (English source text → German).
// Usage: t("Save changes"), t("{n} guests", { n: 3 }). Missing German entries fall back to English.
// The chosen language is saved in localStorage ("bite_lang") so the landing and the app stay in sync.
import { useSyncExternalStore } from "react";
import { DE } from "./i18n-de";

export type Lang = "en" | "de";
const KEY = "bite_lang";

function detect(): Lang {
  try {
    const url = new URLSearchParams(window.location.search).get("lang");
    if (url === "de" || url === "en") { localStorage.setItem(KEY, url); return url; } // remembered, so the embedded app follows too
    const saved = localStorage.getItem(KEY);
    if (saved === "de" || saved === "en") return saved;
  } catch { /* ignore */ }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

let current: Lang = typeof window === "undefined" ? "en" : detect();
const listeners = new Set<() => void>();
if (typeof document !== "undefined") document.documentElement.lang = current;
// Keep every open Bite page in sync (e.g. the app preview inside the landing page, other tabs)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && (e.newValue === "de" || e.newValue === "en") && e.newValue !== current) {
      current = e.newValue;
      document.documentElement.lang = current;
      listeners.forEach((f) => f());
    }
  });
}

export const getLang = () => current;

export function setLang(l: Lang) {
  if (l === current) return;
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

/** Re-renders the calling component (and so the whole tree under it) when the language changes */
export function useLang(): Lang {
  return useSyncExternalStore(
    (f) => { listeners.add(f); return () => listeners.delete(f); },
    () => current,
    () => current,
  );
}

const missing = new Set<string>();
let deValues: Set<string> | null = null;
/** Text that is already German (translated twice) is not reported as missing */
const germanValues = () => (deValues ??= new Set(Object.values(DE)));
if (import.meta.env.DEV && typeof window !== "undefined") (window as unknown as { __i18nMissing: Set<string> }).__i18nMissing = missing;

export function t(text: string, vars?: Record<string, string | number>): string {
  let out = text;
  if (current === "de") {
    const de = DE[text];
    if (de !== undefined) out = de;
    else if (import.meta.env.DEV && !missing.has(text) && /[a-z]{2}/i.test(text) && !germanValues().has(text)) {
      missing.add(text);
      console.warn("[i18n] missing German:", JSON.stringify(text));
    }
  }
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

/** Translates only if a German version exists, without reporting it as missing (used for addresses and user text) */
export const tMaybe = (text: string) => (current === "de" && DE[text] !== undefined ? DE[text] : text);

/** A decimal number with the right separator ("4.9" / "4,9") */
export const dec = (n: number, digits = 1) => (current === "de" ? n.toFixed(digits).replace(".", ",") : n.toFixed(digits));

/** Locale for dates and numbers */
export const locale = () => (current === "de" ? "de-DE" : "en-GB");

const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_DE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."];

/** Meal dates are stored as English labels ("Tomorrow, 16 Oct", "Saturday, 18 Oct"); this shows them in the current language */
export function dateLabel(label: string): string {
  if (current !== "de") return label;
  const m = label.match(/^([A-Za-z]+), (\d{1,2}) ([A-Za-z]{3,4})$/);
  if (!m) return t(label);
  const day = m[1] === "Today" ? "Heute" : m[1] === "Tomorrow" ? "Morgen" : DAYS_DE[DAYS_EN.indexOf(m[1])] ?? m[1];
  const mi = MONTHS_EN.findIndex((x) => m[3].startsWith(x));
  return `${day}, ${m[2]}. ${mi >= 0 ? MONTHS_DE[mi] : m[3]}`;
}
