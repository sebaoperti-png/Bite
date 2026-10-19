// A NOTE FROM THE KITCHEN — the founder's words as a handwritten-feeling note taped to the page: the quote appears
// word by word, the signature gets underlined by hand and a round seal with the Bite "b" turns slowly beside it.
import { useEffect, useRef, useState } from "react";
import { asset } from "../asset";
import { RevealWords } from "../../shared/Motion";
import { t } from "../../shared/i18n";

export function LandingTestimonial() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const ring = `${t("home cooked")} · ${t("shared fairly")} · `;

  return (
    <section className="fn">
      <div ref={ref} className={`fn-card ${inView ? "in" : ""}`}>
        <span className="fn-tape" aria-hidden />
        <div className="fn-top"><i aria-hidden /><span>{t("A note from the kitchen")}</span><i aria-hidden /></div>
        <svg className="fn-quotes" viewBox="0 0 60 44" aria-hidden><path d="M4 40c0-14 4-26 18-34l3 4c-7 5-10 11-10 16h9v14zM34 40c0-14 4-26 18-34l3 4c-7 5-10 11-10 16h9v14z" /></svg>
        <p className="fn-quote"><RevealWords step={35}>{t("The best meals I've ever had were cooked in someone's home. Bite is about making that possible for everyone — and sharing the cost fairly.")}</RevealWords></p>
        <div className="fn-sign">
          <span className="fn-seal" aria-hidden>
            <svg viewBox="0 0 100 100">
              <defs><path id="fn-ring" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" /></defs>
              <text><textPath href="#fn-ring" textLength="236" lengthAdjust="spacingAndGlyphs">{ring}</textPath></text>
            </svg>
            <img src={asset("landing/logo.png")} alt="" />
          </span>
          <div>
            <b className="fn-name">
              {t("Sebastiano Operti")}
              <svg viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden><path d="M2 9C40 3 90 2 130 6s50 4 66-2" pathLength="1" /></svg>
            </b>
            <span className="fn-role">{t("Founder, Bite")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
