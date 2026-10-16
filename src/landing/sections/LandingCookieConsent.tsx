// COOKIE CONSENT (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingCookieConsent({ acceptAll, hidePrefs, openPrefs, prefAnalytics, prefFunctional, prefMarketing, rejectAll, savePrefs, showCookies, showPrefs, toggleAnalytics, toggleFunctional, toggleMarketing }: any) {
  return (
    <>
      {showCookies && (
        <>
          <div style={{ position: "fixed", inset: "0", zIndex: "900", background: "rgba(9,3,15,0.5)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "560px", margin: "18px", background: "#fff", borderRadius: "22px", boxShadow: "0 30px 70px rgba(9,3,15,0.4)", overflow: "hidden" }}>
              <div style={{ padding: "26px 26px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ display: "inline-flex" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b21d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 2.5v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5L12 3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  {" "}
                  <h3 style={{ fontSize: "19px", fontWeight: "900", margin: "0", letterSpacing: "-0.02em", color: "#160a2e" }}>{t("Your privacy, your choice")}</h3>
                </div>
                {" "}
                <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#5c4a7c", margin: "0 0 6px" }}>{t("We use strictly necessary cookies to run Bite. With your consent we also use functional, analytics and marketing cookies to improve the experience. You can change this anytime under Cookie settings.")}</p>
                {" "}
                <a href="legal.html#cookies" style={{ fontSize: "13px", fontWeight: "700" }}>{t("Read our Cookie Policy →")}</a>
                {" "}
                {showPrefs && (
                  <>
                    <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "2px", border: "1px solid rgba(107,33,217,0.12)", borderRadius: "14px", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f7f3fc" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#160a2e" }}>{t("Strictly necessary")}</div>
                          <div style={{ fontSize: "12px", color: "#8a7aa8" }}>{t("Always active — sign-in, security, session.")}</div>
                        </div>
                        {" "}
                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#0a7c4e" }}>{t("ON")}</span>
                      </div>
                      {" "}
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#160a2e" }}>{t("Functional")}</div>
                          <div style={{ fontSize: "12px", color: "#8a7aa8" }}>{t("Remembers city, language, filters.")}</div>
                        </div>
                        {" "}
                        <input type="checkbox" checked={prefFunctional} onChange={toggleFunctional} style={{ width: "20px", height: "20px", accentColor: "#6b21d9" }} />
                      </label>
                      {" "}
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", borderTop: "1px solid rgba(107,33,217,0.08)" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#160a2e" }}>{t("Analytics")}</div>
                          <div style={{ fontSize: "12px", color: "#8a7aa8" }}>{t("Aggregated usage stats to improve Bite.")}</div>
                        </div>
                        {" "}
                        <input type="checkbox" checked={prefAnalytics} onChange={toggleAnalytics} style={{ width: "20px", height: "20px", accentColor: "#6b21d9" }} />
                      </label>
                      {" "}
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", borderTop: "1px solid rgba(107,33,217,0.08)" }}>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "800", color: "#160a2e" }}>{t("Marketing")}</div>
                          <div style={{ fontSize: "12px", color: "#8a7aa8" }}>{t("Measure campaigns, show relevant offers.")}</div>
                        </div>
                        {" "}
                        <input type="checkbox" checked={prefMarketing} onChange={toggleMarketing} style={{ width: "20px", height: "20px", accentColor: "#6b21d9" }} />
                      </label>
                    </div>
                  </>
                )}
              </div>
              {" "}
              <div style={{ display: "flex", gap: "10px", padding: "0 26px 24px", flexWrap: "wrap" }}>
                {showPrefs && (
                  <>
                    <button onClick={savePrefs} style={{ flex: "1", minWidth: "140px", background: "#6b21d9", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14.5px", fontWeight: "800", cursor: "pointer" }}>{t("Save my choices")}</button>
                  </>
                )}
                {" "}
                {hidePrefs && (
                  <>
                    <button onClick={openPrefs} style={{ flex: "1", minWidth: "140px", background: "#f0e9fb", color: "#6b21d9", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14.5px", fontWeight: "800", cursor: "pointer" }}>{t("Manage preferences")}</button>
                    {" "}
                    <button onClick={rejectAll} style={{ flex: "1", minWidth: "140px", background: "#fff", color: "#463861", border: "1.5px solid rgba(107,33,217,0.18)", padding: "14px", borderRadius: "12px", fontSize: "14.5px", fontWeight: "800", cursor: "pointer" }}>{t("Reject non-essential")}</button>
                  </>
                )}
                {" "}
                <button onClick={acceptAll} style={{ flex: "1", minWidth: "140px", background: "#160a2e", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14.5px", fontWeight: "800", cursor: "pointer" }}>{t("Accept all")}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
