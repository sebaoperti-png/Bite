// HELP / CUSTOMER SERVICE (converted from the original design; edit freely)
import { asset } from "../asset";
import { t } from "../../shared/i18n";

export function LandingHelpCustomerService() {
  return (
    <>
      <section className="r-pad-96" id="help" style={{ maxWidth: "1160px", margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: "52px" }}>
          <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "22px", color: "#6b21d9" }}>{t("customer service")}</span>
          {" "}
          <h2 className="r-h-44" style={{ fontSize: "44px", fontWeight: "900", letterSpacing: "-0.03em", margin: "8px 0 0" }}>
            {t("We're here, before & after every meal")}
          </h2>
        </div>
        {" "}
        <div className="r-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "18px", marginBottom: "48px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "26px", boxShadow: "0 4px 20px rgba(46,16,96,0.06)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f0e9fb", border: "1px solid rgba(107,33,217,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b21d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V5z" />
              </svg>
            </div>
            {" "}
            <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 6px" }}>{t("In-app chat")}</h3>
            {" "}
            <p style={{ fontSize: "13.5px", color: "#5c4a7c", lineHeight: "1.5", margin: "0" }}>{t("Talk to a real person from the Bite team, right inside the app.")}</p>
          </div>
          {" "}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "26px", boxShadow: "0 4px 20px rgba(46,16,96,0.06)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f0e9fb", border: "1px solid rgba(107,33,217,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b21d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
            </div>
            {" "}
            <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 6px" }}>{t("Email us")}</h3>
            {" "}
            <p style={{ fontSize: "13.5px", color: "#5c4a7c", lineHeight: "1.5", margin: "0" }}>
              <a href="mailto:sebaoperti@gmail.com">{t("sebaoperti@gmail.com")}</a>
              {" "}{t("— we answer within 24h.")}</p>
          </div>
          {" "}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "26px", boxShadow: "0 4px 20px rgba(46,16,96,0.06)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f0e9fb", border: "1px solid rgba(107,33,217,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b21d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
                <path d="M4 19a2 2 0 0 1 2-2h13" />
              </svg>
            </div>
            {" "}
            <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 6px" }}>{t("Help Center")}</h3>
            {" "}
            <p style={{ fontSize: "13.5px", color: "#5c4a7c", lineHeight: "1.5", margin: "0" }}>
              {t("Guides on booking, hosting, refunds & cost sharing.")}
            </p>
          </div>
          {" "}
          <div style={{ background: "#160a2e", borderRadius: "20px", padding: "26px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
                <line x1="6.3" y1="6.3" x2="9.7" y2="9.7" />
                <line x1="14.3" y1="14.3" x2="17.7" y2="17.7" />
                <line x1="14.3" y1="9.7" x2="17.7" y2="6.3" />
                <line x1="6.3" y1="17.7" x2="9.7" y2="14.3" />
              </svg>
            </div>
            {" "}
            <h3 style={{ fontSize: "17px", fontWeight: "800", margin: "0 0 6px", color: "#fff" }}>{t("Safety line")}</h3>
            {" "}
            <p style={{ fontSize: "13.5px", color: "#a897c8", lineHeight: "1.5", margin: "0" }}>{t("Urgent concern during a meal? Reach our team instantly.")}</p>
          </div>
        </div>
        {" "}
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "22px", fontWeight: "800", textAlign: "center", margin: "0 0 22px" }}>{t("Frequently asked")}</h3>
          {" "}
          <details style={{ background: "#fff", borderRadius: "14px", padding: "18px 22px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(46,16,96,0.05)" }}>
            <summary style={{ fontSize: "15.5px", fontWeight: "700", cursor: "pointer", listStyle: "none" }}>{t("How do I get a refund if a meal is cancelled?")}</summary>
            {" "}
            <p style={{ fontSize: "14.5px", color: "#5c4a7c", lineHeight: "1.6", margin: "12px 0 0" }}>{t("If a host cancels, you're refunded in full automatically. If you cancel more than 24h ahead, you get a full refund; within 24h, the service fee may apply.")}</p>
          </details>
          {" "}
          <details style={{ background: "#fff", borderRadius: "14px", padding: "18px 22px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(46,16,96,0.05)" }}>
            <summary style={{ fontSize: "15.5px", fontWeight: "700", cursor: "pointer", listStyle: "none" }}>{t("How are hosts checked before they can cook?")}</summary>
            {" "}
            <p style={{ fontSize: "14.5px", color: "#5c4a7c", lineHeight: "1.6", margin: "12px 0 0" }}>{t("Every host completes ID verification, a video call, a sample-meal tasting and reference checks before their first listing goes live.")}</p>
          </details>
          {" "}
          <details style={{ background: "#fff", borderRadius: "14px", padding: "18px 22px", marginBottom: "10px", boxShadow: "0 2px 12px rgba(46,16,96,0.05)" }}>
            <summary style={{ fontSize: "15.5px", fontWeight: "700", cursor: "pointer", listStyle: "none" }}>{t("I have a food allergy — is that handled?")}</summary>
            {" "}
            <p style={{ fontSize: "14.5px", color: "#5c4a7c", lineHeight: "1.6", margin: "12px 0 0" }}>{t("Every listing declares allergens and dietary tags, and you can filter by them. You can also message the host before booking to confirm.")}</p>
          </details>
          {" "}
          <details style={{ background: "#fff", borderRadius: "14px", padding: "18px 22px", boxShadow: "0 2px 12px rgba(46,16,96,0.05)" }}>
            <summary style={{ fontSize: "15.5px", fontWeight: "700", cursor: "pointer", listStyle: "none" }}>{t("How does cost sharing work?")}</summary>
            {" "}
            <p style={{ fontSize: "14.5px", color: "#5c4a7c", lineHeight: "1.6", margin: "12px 0 0" }}>{t("The host sets a contribution per guest based on what the ingredients cost — an equal share, not a restaurant price. Guests pay it in-app plus a 12% Bite service fee; the host gets the full contribution back, and the host's own dinner gets cheaper too. No cash changes hands.")}</p>
          </details>
        </div>
      </section>
    </>
  );
}
