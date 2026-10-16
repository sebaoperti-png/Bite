// EN | DE switch, used in the landing nav and in the app
import { setLang, useLang, type Lang } from "./i18n";

export function LangSwitch({ dark = false, size = "md" }: { dark?: boolean; size?: "sm" | "md" }) {
  const lang = useLang();
  const pad = size === "sm" ? "5px 9px" : "7px 11px";
  const opt = (l: Lang, label: string) => {
    const on = lang === l;
    return (
      <button
        key={l}
        type="button"
        onClick={() => setLang(l)}
        aria-pressed={on}
        lang={l}
        style={{
          padding: pad, borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit",
          fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 800, letterSpacing: "0.04em",
          background: on ? (dark ? "#fff" : "#6b21d9") : "transparent",
          color: on ? (dark ? "#160a2e" : "#fff") : dark ? "rgba(255,255,255,0.75)" : "#6b5a8e",
          transition: "background .2s, color .2s",
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label={lang === "de" ? "Sprache" : "Language"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 2, padding: 3, borderRadius: 999, flexShrink: 0,
        background: dark ? "rgba(255,255,255,0.1)" : "#fff",
        border: dark ? "1px solid rgba(255,255,255,0.18)" : "1.5px solid rgba(107,33,217,0.15)",
      }}
    >
      {opt("en", "EN")}
      {opt("de", "DE")}
    </div>
  );
}
