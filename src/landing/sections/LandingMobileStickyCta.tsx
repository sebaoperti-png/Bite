// MOBILE STICKY CTA (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingMobileStickyCta() {
  return (
    <>
      <div className="mobile-cta" style={{ position: "fixed", left: "0", right: "0", bottom: "0", zIndex: "800", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(107,33,217,0.12)", boxShadow: "0 -6px 24px rgba(46,16,96,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "0" }}>
          <img src={asset("landing/logo.png")} alt="Bite" style={{ width: "34px", height: "34px", borderRadius: "9px", flexShrink: "0" }} />
          {" "}
          <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#160a2e", lineHeight: "1.25" }}>{t("Eat with your neighbours tonight")}</div>
        </div>
        {" "}
        <a href="bite.html" style={{ flexShrink: "0", background: "#6b21d9", color: "#fff", padding: "12px 20px", borderRadius: "12px", fontWeight: "800", fontSize: "14px", boxShadow: "0 8px 20px rgba(107,33,217,0.28)" }}>{t("Open app")}</a>
      </div>
    </>
  );
}
