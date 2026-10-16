// TESTIMONIAL (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingTestimonial() {
  return (
    <>
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>
            “
          </div>
          {" "}
          <p style={{ fontSize: "28px", lineHeight: "1.4", fontWeight: "600", letterSpacing: "-0.01em", color: "#160a2e", margin: "0 0 28px" }}>{t("The best meals I've ever had were cooked in someone's home. Bite is about making that possible for everyone — and sharing the cost fairly.")}</p>
          {" "}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
            <img src={asset("landing/logo.png")} alt="" style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover" }} />
            {" "}
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "15px", fontWeight: "800" }}>{t("Sebastiano Operti")}</div>
              <div style={{ fontSize: "13px", color: "#7c6fa0" }}>{t("Founder, Bite")}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
