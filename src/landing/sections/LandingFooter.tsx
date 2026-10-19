// FOOTER (converted from the original design; edit freely)
import { useEffect, useRef, useState } from "react";
import { asset } from "../asset";
import { LogoWord } from "./LogoWord";
import { Course } from "../../shared/Restaurant";
import { t } from "../../shared/i18n";

const CRUMBS = Array.from({ length: 16 }, (_, i) => {
  const angle = -100 + (i / 15) * 170;
  const dist = 60 + ((i * 37) % 110);
  return { x: Math.cos((angle * Math.PI) / 180) * dist, y: Math.sin((angle * Math.PI) / 180) * dist, size: 6 + ((i * 7) % 11), delay: (i % 5) * 0.03 };
});

/** Big "bite" at the bottom, drawn with the logo's "b": it starts whole and gets bitten (with crumbs) each time it scrolls into view */
function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [bitten, setBitten] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBitten(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`ft-word ${bitten ? "bitten" : ""}`} aria-hidden>
      <LogoWord id="ft" top="#8a5fb6" bottom="#1b0e35" bClass="ft-b" teethClass="ft-teeth" />
      <div className="ft-crumbs">
        {CRUMBS.map((c, i) => (
          <span key={i} style={{ width: c.size, height: c.size, ["--x" as string]: `${c.x}px`, ["--y" as string]: `${c.y}px`, ["--r" as string]: `${i * 53}deg`, animationDelay: `${0.32 + c.delay}s` }} />
        ))}
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <>
      <footer className="ft-fade" style={{ padding: "230px 24px 0", overflow: "hidden", position: "relative", isolation: "isolate", ["--dust-top" as string]: "260px", ["--dust-bottom" as string]: "0px" }}>
        <div className="chalk-dust" aria-hidden />
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          {/* Closing statement, sitting in the fade so the footer starts with something to read */}
          <div className="ft-hero">
            <Course n={8} name={t("Coffee & the bill")} light size={28}>{t("food is better shared")}</Course>
            <h2 className="ft-title">{t("See you at the table.")}</h2>
            <p className="ft-sub">{t("Bite is a young startup building a new way to eat with your neighbours. Try the demo, tell us what you think, or just say hi.")}</p>
            <div className="ft-ctas">
              <a href="bite.html" className="ft-btn primary">{t("Open the demo app →")}</a>
              <a href="stand.html?ref=footer" className="ft-btn">{t("Take the 60-second survey")}</a>
              <a href="mailto:sebaoperti@gmail.com" className="ft-btn">{t("Write to Sebastiano")}</a>
            </div>
          </div>
          <div className="r-grid-footer" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "40px", paddingBottom: "44px", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                <img src={asset("landing/logo.png")} alt="Bite" style={{ width: "44px", height: "44px", borderRadius: "12px", display: "block" }} />
                {" "}
                <span style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "-0.04em", color: "#ffffff" }}>
                  Bite
                </span>
              </div>
              {" "}
              <p style={{ fontSize: "16px", color: "#a897c8", lineHeight: "1.6", margin: "0 0 18px", maxWidth: "320px" }}>{t("Real food, real people, your neighbourhood. Home cooking shared safely across your city.")}</p>
              {" "}
              <div style={{ fontSize: "16px", color: "#fff", fontWeight: 700 }}>{t("Sebastiano Operti")}</div>
              <div style={{ fontSize: "13px", color: "#a897c8", margin: "2px 0 8px" }}>{t("Founder")}</div>
              <a href="mailto:sebaoperti@gmail.com" style={{ fontSize: "16px", color: "#b87fff", fontWeight: 700 }}>{t("sebaoperti@gmail.com")}</a>
            </div>
            {" "}
            <div>
              <h4 className="ft-h4">{t("PRODUCT")}</h4>
              {" "}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <a href="#how" style={{ fontSize: "16px", color: "#a897c8" }}>{t("How it works")}</a>
                {" "}
                <a href="#services" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Ways to eat")}</a>
                {" "}
                <a href="#cooks" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Become a host")}</a>
                {" "}
                <a href="#waitlist" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Stay updated")}</a>
              </div>
            </div>
            {" "}
            <div>
              <h4 className="ft-h4">{t("SUPPORT")}</h4>
              {" "}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <a href="#help" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Help Center")}</a>
                {" "}
                <a href="mailto:sebaoperti@gmail.com" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Contact us")}</a>
                {" "}
                <a href="#safety" style={{ fontSize: "16px", color: "#a897c8" }}>
                  {t("Trust & Safety")}
                </a>
                {" "}
                <a href="#help" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Report an issue")}</a>
              </div>
            </div>
            {" "}
            <div>
              <h4 className="ft-h4">{t("LEGAL")}</h4>
              {" "}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <a href="legal.html#terms" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Terms of Service")}</a>
                {" "}
                <a href="legal.html#privacy" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Privacy Policy")}</a>
                {" "}
                <a href="legal.html#cookies" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Cookie Policy")}</a>
                {" "}
                <a href="legal.html#community" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Community Guidelines")}</a>
                {" "}
                <a href="legal.html#gdpr" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Your data (GDPR)")}</a>
                {" "}
                <a href="legal.html#impressum" style={{ fontSize: "16px", color: "#a897c8" }}>{t("Impressum")}</a>
              </div>
            </div>
          </div>
          {" "}
          {/* the bill: a receipt torn off at the bottom of the dinner */}
          <div className="ft-bill">
            <div className="ft-bill-row">
              <span>{t("TABLE 01 · SERVICE INCLUDED")}</span>
              <b>{t("Thank you for visiting")}</b>
              <span>{t("© 2026 Bite · Germany")}</span>
            </div>
            <div className="ft-bill-links">
              <a href="#" data-cookie-settings="1">{t("Cookie settings")}</a>
              <a href="legal.html#accessibility">{t("Accessibility")}</a>
              <a href="legal.html#slavery">{t("Modern Slavery Statement")}</a>
            </div>
            <div className="ft-bill-total"><span>{t("Total")}</span><i /><b>{t("a seat at the table")}</b></div>
          </div>
        </div>
        <FooterWordmark />
      </footer>
    </>
  );
}
