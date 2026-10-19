import { useEffect, useRef, useState } from "react";
import { Wallet, Users, Leaf } from "lucide-react";
import { Course } from "../../shared/Restaurant";
import { t, getLang } from "../../shared/i18n";
import { SpinningText, RevealWords } from "../../shared/Motion";

// SAVINGS — the core idea right under the hero: a real home-cooked dinner costs less when it's shared

const BENEFITS = [
  { t: "Split the cost", Icon: Wallet, d: "Guests chip in for the ingredients — no restaurant mark-up, and the host eats for less too." },
  { t: "Meet your neighbours", Icon: Users, d: "Small tables of up to six people who live a few streets away." },
  { t: "Less food waste", Icon: Leaf, d: "Cooking once for many uses whole ingredients instead of half-empty packs." },
];

export function LandingSavings() {
  const gridRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [priced, setPriced] = useState(false);
  // "€0" / "€00" until the bubbles are on screen, then the reels roll to the real prices
  const price = (n: number) => { const v = priced ? String(n) : "0".repeat(String(n).length); return getLang() === "de" ? `${v} €` : `€${v}`; };
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { window.setTimeout(() => setPriced(true), 250); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="r-pad-96" id="savings" style={{ maxWidth: "1160px", margin: "0 auto", padding: "88px 24px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <Course n={2} name={t("Starter")}>{t("why Bite")}</Course>
        <h2 className="r-h-44" style={{ fontSize: "44px", fontWeight: 900, letterSpacing: "-0.03em", margin: "8px 0 0" }}><RevealWords>{t("Same dinner. A fraction of the price.")}</RevealWords></h2>
        <p style={{ fontSize: "17px", color: "#4b3a6b", maxWidth: "600px", margin: "16px auto 0", lineHeight: 1.6 }}>{t("What one dinner costs you, per plate. A neighbour is already cooking tonight — pull up a chair and split the cost of the groceries.")}</p>
      </div>
      {/* Price comparison: Bite in the middle, the alternatives floating around it */}
      <div ref={stageRef} className={`sv-stage ${priced ? "priced" : ""}`} aria-label={t("Price per dinner: takeaway about 15 euros, Bite about 6 euros, restaurant about 25 euros")}>
        <div className="sv-bubble sv-side sv-left">
          <span className="sv-label">{t("Takeaway")}</span>
          <span className="sv-price"><SpinningText text={price(15)} cell="1.08em" /></span>
          <span className="sv-note">{t("+ delivery,")}<br />{t("eaten alone")}</span>
        </div>
        <span className="sv-vs sv-vs-left" aria-hidden>{t("vs")}</span>
        <div className="sv-bubble sv-bite">
          <span className="sv-glow" aria-hidden />
          <span className="sv-label">Bite</span>
          <span className="sv-price"><SpinningText text={price(6)} cell="1.08em" /></span>
          <span className="sv-note">{t("home-cooked,")}<br />{t("shared at a neighbour's table")}</span>
          <span className="sv-save">{t("up to 60% less")}</span>
        </div>
        <span className="sv-vs sv-vs-right" aria-hidden>{t("vs")}</span>
        <div className="sv-bubble sv-side sv-right">
          <span className="sv-label">{t("Restaurant")}</span>
          <span className="sv-price"><SpinningText text={price(25)} cell="1.08em" /></span>
          <span className="sv-note">{t("before drinks")}<br />{t("and tip")}</span>
        </div>
      </div>
      {/* The three reasons, written on a spiral notepad: the page drops in, then each note gets its tick */}
      <div ref={gridRef} className={`np ${shown ? "in" : ""}`}>
        <div className="np-rings" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} />)}</div>
        <div className="np-page">
          <span className="np-title">{t("Why it works")}</span>
          <div className="np-notes">
            {BENEFITS.map((x, i) => (
              <div key={x.t} className="np-note" style={{ ["--i" as string]: i }}>
                <div className="np-top">
                  <span className="np-num">{i + 1}.</span>
                  <span className="np-icon" aria-hidden><x.Icon size={18} strokeWidth={2} /></span>
                  <svg className="np-tick" viewBox="0 0 32 32" aria-hidden><path d="M5 17l7 7L27 7" pathLength={1} /></svg>
                </div>
                <h3 className="np-head"><span>{t(x.t)}</span></h3>
                <p className="np-text">{t(x.d)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p style={{ textAlign: "center", fontSize: "12.5px", color: "#9b8bbb", margin: "28px 0 0" }}>{t("Typical prices per dinner in a German city, for comparison. On Bite, hosts set an equal share of what the ingredients cost.")}</p>
    </section>
  );
}
