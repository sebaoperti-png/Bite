// FOR COOKS (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingForCooks() {
  return (
    <>
      <section className="r-grid-halves r-pad-96" id="cooks" style={{ maxWidth: "1160px", margin: "0 auto", padding: "96px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "56px", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <img src={asset("landing/photo-5.jpg")} alt={t("A host cooking at home")} style={{ width: "100%", borderRadius: "28px", objectFit: "cover", boxShadow: "0 30px 60px rgba(46,16,96,0.18)" }} />
          {" "}
          <div className="r-badge" style={{ position: "absolute", bottom: "24px", right: "-24px", background: "#fff", padding: "18px 22px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(46,16,96,0.18)" }}>
            <div style={{ fontSize: "13px", color: "#7c6fa0", fontWeight: "600" }}>{t("Groceries for 7: €42")}</div>
            {" "}
            <div style={{ fontSize: "30px", fontWeight: "900", color: "#0a7c4e", letterSpacing: "-0.02em" }}>{t("€6 each")}</div>
          </div>
        </div>
        {" "}
        <div>
          <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "22px", color: "#6b21d9" }}>{t("for cooks")}</span>
          {" "}
          <h2 className="r-h-44" style={{ fontSize: "44px", fontWeight: "900", letterSpacing: "-0.03em", margin: "8px 0 18px", lineHeight: "1.05" }}>{t("Cook once. Share the table. Split the bill.")}</h2>
          {" "}
          <p style={{ fontSize: "17px", lineHeight: "1.6", color: "#4b3a6b", margin: "0 0 26px" }}>{t("Already cooking every night? Cook a little extra and open your table. Guests chip in for the ingredients, so a proper home-cooked dinner costs everyone")}{" "}
            <strong>{t("less")}</strong>
            {" "}{t("— you included. Bite handles bookings, payments and chat.")}</p>
          {" "}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e9fbf1", color: "#0a7c4e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px" }}>
                ✓
              </span>
              <span style={{ fontSize: "15.5px", color: "#160a2e" }}>{t("Publish a meal in under 2 minutes")}</span>
            </div>
            {" "}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e9fbf1", color: "#0a7c4e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px" }}>
                ✓
              </span>
              <span style={{ fontSize: "15.5px", color: "#160a2e" }}>{t("Guests cover their share of the groceries")}</span>
            </div>
            {" "}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#e9fbf1", color: "#0a7c4e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px" }}>
                ✓
              </span>
              <span style={{ fontSize: "15.5px", color: "#160a2e" }}>{t("You choose who sits at your table")}</span>
            </div>
          </div>
          {" "}
          <a href="bite.html" style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "#6b21d9", color: "#fff", padding: "15px 26px", borderRadius: "14px", fontWeight: "700", fontSize: "15px", boxShadow: "0 12px 28px rgba(107,33,217,0.28)" }}>{t("Start hosting →")}</a>
        </div>
      </section>
    </>
  );
}
