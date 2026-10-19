// HERO — headline and calls to action on the left, the "Save me a seat" sign-up card on the right
import { asset } from "../asset";
import { Course } from "../../shared/Restaurant";
import { RevealWords, Arrowed } from "../../shared/Motion";
import { t } from "../../shared/i18n";
import { LandingSeatCard } from "./LandingSeatCard";

export function LandingHero() {
  return (
    <>
      <section className="r-grid-hero hero-lit" onPointerMove={(e) => { if (e.pointerType === "touch") return; const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty("--sx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--sy", `${e.clientY - r.top}px`); }} style={{ maxWidth: "1160px", margin: "0 auto", padding: "72px 24px 40px", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "48px", alignItems: "center", position: "relative", isolation: "isolate" }}>
        <span className="hero-spot" aria-hidden />
        <div style={{ animation: "riseIn .7s both" }}>
          <div style={{ marginBottom: "14px" }}><Course n={1} name="Aperitivo" size={18}>{t("tonight's menu")}</Course></div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f0e9fb", border: "1px solid rgba(107,33,217,0.12)", padding: "7px 14px", borderRadius: "999px", marginBottom: "22px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
            {" "}
            <span style={{ fontSize: "12.5px", fontWeight: "700", color: "#6b21d9" }}>{t("Early stage · help us shape Bite")}</span>
          </div>
          {" "}
          <h1 className="r-h-62" style={{ fontSize: "62px", lineHeight: "1.02", fontWeight: "900", letterSpacing: "-0.035em", margin: "0 0 20px" }}><RevealWords step={55} delay={150}>{t("Real food,")}<br />{t("real people,")}<br />
            <span style={{ color: "#6b21d9" }}>{t("your neighbourhood.")}</span></RevealWords>
          </h1>
          {" "}
          <p style={{ fontSize: "19px", lineHeight: "1.55", color: "#4b3a6b", maxWidth: "460px", margin: "0 0 32px" }}>{t("Bite connects you with home cooks nearby. Share a home-cooked meal, split the cost of the groceries, and pay less than takeaway —")}{" "}
            <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "22px", color: "#160a2e" }}>{t("food is better shared.")}</span>
          </p>
          {" "}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            <a href="bite.html" style={{ display: "inline-flex", alignItems: "center", gap: "10px", background: "#160a2e", color: "#fff", padding: "15px 26px", borderRadius: "14px", fontWeight: "700", fontSize: "15px" }}>{t("I want to eat")}{" "}
              <span style={{ fontSize: "18px" }}>
                →
              </span>
            </a>
            {" "}
            <a href="bite.html?host" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#160a2e", padding: "15px 22px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", border: "1.5px solid rgba(22,10,46,0.14)", background: "#fff" }}>{t("I want to host")}</a>
          </div>
          {" "}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "34px" }}>
            <div style={{ display: "flex" }}>
              <img src={asset("landing/photo-1.jpg")} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2.5px solid #f3eefb", objectFit: "cover", marginRight: "-10px" }} />
              {" "}
              <img src={asset("landing/photo-2.jpg")} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2.5px solid #f3eefb", objectFit: "cover", marginRight: "-10px" }} />
              {" "}
              <img src={asset("landing/photo-3.jpg")} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2.5px solid #f3eefb", objectFit: "cover", marginRight: "-10px" }} />
              {" "}
              <img src={asset("landing/photo-4.jpg")} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2.5px solid #f3eefb", objectFit: "cover" }} />
            </div>
            {" "}
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#160a2e" }}>
                <a className="lm" href="stand.html?ref=landing" style={{ color: "#160a2e" }}><Arrowed text={t("Tell us how you eat — 60-second survey →")} /></a>
              </div>
              {" "}
              <div style={{ fontSize: "13px", color: "#7c6fa0" }}>{t("Verified home cooks · split the cost · less food waste")}</div>
            </div>
          </div>
        </div>
        {" "}
        {/* Stay-updated sign-up as a restaurant reservation card */}
        <LandingSeatCard />
      </section>
    </>
  );
}
