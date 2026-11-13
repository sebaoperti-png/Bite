// AT YOUR SERVICE — the ways to reach us as order tickets clipped to the kitchen rail (the safety line is the
// priority ticket with a service bell), and the FAQ as a menu card: "Questions from the table".
import { useState } from "react";
import { Course } from "../../shared/Restaurant";
import { RevealWords } from "../../shared/Motion";
import { t } from "../../shared/i18n";

const TICKETS: { kind: string; title: string; text: React.ReactNode; foot: string; icon: React.ReactNode; dark?: boolean }[] = [
  {
    kind: "In the app", title: "Report or block", foot: "From any meal or chat",
    text: "Something feels wrong? Report it or block the person in one tap. We read every report.",
    icon: <path d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V5z" />,
  },
  {
    kind: "Email", title: "Email us", foot: "Usually within a day",
    text: <><a href="mailto:hello@bitetable.de">hello<wbr />@bitetable.de</a> {t("— we usually answer within a day.")}</>,
    icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  },
  {
    kind: "Guides", title: "Questions from the table", foot: "Booking · hosting · costs",
    text: "Answers on booking, hosting and cost sharing, just below.",
    icon: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
  },
  {
    kind: "Urgent", title: "In an emergency", foot: "Police 110 · Emergency 112", dark: true,
    text: "Feel unsafe during a meal? Leave, call 110 or 112 first, then tell us and report the host in the app.",
    icon: <><path d="M4 17h16M5.5 17a6.5 6.5 0 0 1 13 0" /><path d="M12 8.5V7M10.5 7h3" /><path d="M3 20h18" /></>,
  },
];

const FAQ = [
  { q: "What happens if a meal is cancelled?", a: "Right now nothing is paid in advance: you pay your share to the host at the table, so a cancellation costs you nothing. Please cancel as early as you can, so the host or the other guests can plan." },
  { q: "How are hosts checked before they can cook?", a: "Today every host needs a real name and a profile photo and must accept Bite's house rules (hygiene, allergens, fair prices, respect). Hosts choose who joins, and anyone can be reported or blocked. ID checks and reviews are coming next." },
  { q: "I have a food allergy — is that handled?", a: "Every listing declares allergens and dietary tags, and you can filter by them. You can also message the host before booking to confirm." },
  { q: "How does cost sharing work?", a: "The host sets a contribution per guest based on what the ingredients cost — an equal share, not a restaurant price. A price cap makes sure nobody profits. For now you pay your share at the table and Bite charges no fee; payments in the app will come later." },
];

export function LandingHelpCustomerService() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="r-pad-96" id="help" style={{ maxWidth: "1160px", margin: "0 auto", padding: "96px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <Course n={7} name={t("At your service")}>{t("customer service")}</Course>
        <h2 className="r-h-44" style={{ fontSize: "44px", fontWeight: "900", letterSpacing: "-0.03em", margin: "8px 0 0" }}>
          <RevealWords>{t("We're here, before & after every meal")}</RevealWords>
        </h2>
      </div>

      {/* the kitchen rail with four order tickets */}
      <div className="rl">
        <span className="rl-bar" aria-hidden />
        {TICKETS.map((k, i) => (
          <div key={k.title} className={`rl-ticket ${k.dark ? "dark" : ""}`} style={{ ["--i" as string]: i }}>
            <span className="rl-clip" aria-hidden />
            <div className="rl-head"><span>{t("Ticket")} 0{i + 1}</span><span>{t(k.kind)}</span></div>
            <span className={`rl-icon ${k.dark ? "ring" : ""}`} aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{k.icon}</svg>
            </span>
            <h3>{t(k.title)}</h3>
            <p>{typeof k.text === "string" ? t(k.text) : k.text}</p>
            <div className="rl-foot">{t(k.foot)}</div>
            {k.dark && <span className="rl-stamp">{t("Priority")}</span>}
          </div>
        ))}
      </div>

      {/* FAQ as a menu card */}
      <div className="fq">
        <div className="fq-top"><span>{t("Frequently asked")}</span></div>
        <h3 className="fq-title">{t("Questions from the table")}</h3>
        {FAQ.map((f, i) => (
          <div key={f.q} className={`fq-item ${open === i ? "open" : ""}`}>
            <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
              <span className="fq-n">Q{i + 1}</span>
              <span className="fq-q">{t(f.q)}</span>
              <i className="fq-dots" aria-hidden />
              <span className="fq-plus" aria-hidden />
            </button>
            <div className="fq-a"><div><p>{t(f.a)}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}
