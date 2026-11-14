// Light / dark / follow the phone. The first paint is set by the inline script in bite.html; this keeps it in sync.
import { useEffect, useState } from "react";

export type ThemeChoice = "auto" | "light" | "dark";
const KEY = "bite_theme";
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

export const getThemeChoice = (): ThemeChoice => {
  try { const v = localStorage.getItem(KEY); return v === "light" || v === "dark" ? v : "auto"; } catch { return "auto"; }
};
const apply = (c: ThemeChoice) => {
  const dark = c === "dark" || (c === "auto" && mq().matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#110a1d" : "#0d0620");
  window.dispatchEvent(new Event("bite:theme"));
};
export const setThemeChoice = (c: ThemeChoice) => {
  try { c === "auto" ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, c); } catch { /* ignore */ }
  apply(c);
};
/** call once (App): follows the phone's setting live while the choice is "auto" */
export function useThemeSync() {
  useEffect(() => {
    const m = mq();
    const on = () => { if (getThemeChoice() === "auto") apply("auto"); };
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
}
export function useThemeChoice(): [ThemeChoice, (c: ThemeChoice) => void] {
  const [c, setC] = useState<ThemeChoice>(getThemeChoice);
  useEffect(() => { const on = () => setC(getThemeChoice()); window.addEventListener("bite:theme", on); return () => window.removeEventListener("bite:theme", on); }, []);
  return [c, (v) => { setThemeChoice(v); setC(v); }];
}
