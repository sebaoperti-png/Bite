// NAV — sticky header, read like the index of a menu: each link carries its course number, and a little fork
// travels along the bottom edge as you scroll through the dinner. Under 820px the links move into a menu button.
import { useEffect, useRef, useState } from "react";
import { asset } from "../asset";
import { t } from "../../shared/i18n";
import { LangSwitch } from "../../shared/LangSwitch";

const LINKS = [
  { href: "#savings", label: "Why Bite", n: 2 },
  { href: "#how", label: "How it works", n: 3 },
  { href: "#cooks", label: "For cooks", n: 5 },
  { href: "#safety", label: "Safety", n: 6 },
  { href: "#help", label: "Help", n: 7 },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // How far through the page we are, written straight to a CSS variable (no re-render on scroll)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        barRef.current?.style.setProperty("--p", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Close the menu with Escape or when the screen gets wide again
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const mq = window.matchMedia("(min-width: 821px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => { window.removeEventListener("keydown", onKey); mq.removeEventListener("change", onMq); };
  }, []);

  return (
    <header style={{ position: "sticky", top: "0", zIndex: "100", backdropFilter: "blur(14px)", background: "rgba(243,238,251,0.86)", borderBottom: "1px solid rgba(107,33,217,0.08)" }}>
      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <a href="#" aria-label={t("Bite home")} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={asset("landing/logo.png")} alt="" style={{ width: "38px", height: "38px", borderRadius: "10px", display: "block", boxShadow: "0 6px 16px rgba(107,33,217,0.28)" }} />
          <span style={{ fontSize: "23px", fontWeight: "900", letterSpacing: "-0.04em", color: "#160a2e" }}>Bite</span>
        </a>

        <nav aria-label={t("Main")} style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {LINKS.map((l) => (
            <a key={l.href} className={`r-navlink nv-link ${l.href === "#help" ? "r-nav-extra" : ""}`} href={l.href} style={{ fontSize: "14.5px", fontWeight: "600", color: "#4b3a6b" }}><sup className="nv-no">{l.n}</sup>{t(l.label)}</a>
          ))}
          <a className="r-navlink r-nav-extra" href="#waitlist" style={{ fontSize: "14.5px", fontWeight: "700", color: "#6b21d9" }}>{t("Stay updated")}</a>
          <LangSwitch />
          <a href="bite.html" className="r-navlink" style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "#6b21d9", color: "#fff", fontSize: "14px", fontWeight: "700", padding: "11px 20px", borderRadius: "999px", boxShadow: "0 8px 20px rgba(107,33,217,0.28)" }}>{t("Open the app")}</a>
          <button
            className="r-menubtn"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("Close menu") : t("Open menu")}
            style={{ width: "42px", height: "42px", borderRadius: "12px", border: "1.5px solid rgba(107,33,217,0.15)", background: "#fff", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#160a2e" strokeWidth="2.2" strokeLinecap="round">
              {open ? (<><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>) : (<><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>)}
            </svg>
          </button>
        </nav>
      </div>

      {/* the fork that travels through the dinner */}
      <div ref={barRef} className="nv-progress" aria-hidden>
        <span className="nv-progress-fill" />
        <svg className="nv-fork" viewBox="0 0 24 24"><path d="M7 2v7a3 3 0 0 0 6 0V2M10 2v20M17 2c-2 0-3 4-3 7h3v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>

      {open && (
        <div id="mobile-menu" style={{ borderTop: "1px solid rgba(107,33,217,0.08)", background: "#f3eefb", padding: "8px 24px 20px" }}>
          <span className="nv-menu-title">{t("Tonight's menu")}</span>
          {[...LINKS, { href: "#waitlist", label: "Stay updated", n: 0 }].map((l) => (
            <a key={l.href} className="nv-menu-line" href={l.href} onClick={() => setOpen(false)}>
              <span>{t(l.label)}</span><i />{l.n ? <em>No. {l.n}</em> : <em>{t("in the hero")}</em>}
            </a>
          ))}
          <a href="bite.html?host" onClick={() => setOpen(false)} style={{ display: "block", marginTop: "16px", textAlign: "center", padding: "14px", borderRadius: "14px", border: "1.5px solid rgba(22,10,46,0.14)", fontWeight: 800, color: "#160a2e" }}>{t("I want to host")}</a>
        </div>
      )}
    </header>
  );
}
