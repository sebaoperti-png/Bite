// LOGO MARQUEE (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingLogoMarquee() {
  return (
    <>
      <div style={{ marginTop: "56px", padding: "22px 0", borderTop: "1px solid rgba(107,33,217,0.07)", borderBottom: "1px solid rgba(107,33,217,0.07)", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div aria-hidden="true" style={{ display: "inline-flex", gap: "56px", paddingRight: "56px", alignItems: "center", animation: "marquee 24s linear infinite", fontSize: "15px", fontWeight: "700", color: "#b6a8d0" }}>
          <span>{t("Home cooking")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Real ingredients")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Meet your neighbours")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Split the cost")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Less food waste")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("No commercial kitchens")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Home cooking")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Real ingredients")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Meet your neighbours")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Split the cost")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("Less food waste")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
          <span>{t("No commercial kitchens")}</span>
          <span style={{ opacity: "0.4" }}>
            ·
          </span>
        </div>
      </div>
    </>
  );
}
