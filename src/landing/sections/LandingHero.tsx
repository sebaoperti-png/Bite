// HERO: the promise on the left (as on the "Push your idea" cover), the little animated spot on the right (HeroSpot.tsx).
import { HeroSpot } from "./HeroSpot";
import { t } from "../../shared/i18n";

export function LandingHero() {
  return (
    <section className="hx">
      <div className="hx-inner">
        {/* the promise as a note in the stairwell, with tear-off strips at the bottom (like the ones on every German noticeboard) */}
        <div className="hx-note">
          <span className="hx-tape" aria-hidden />
          <p className="hx-hello">{t("Hello neighbours,")}</p>
          <h1 className="hx-title">{t("Real food, real people,")} <em>{t("your neighbourhood.")}</em></h1>
          <p className="hx-sub">{t("Too many of us eat alone, a few doors apart. On Bite a neighbour cooks, you pull up a chair and everyone splits what the groceries cost.")}</p>
          <p className="hx-sign">{t("Food is better shared.")} <span>{t("Bite, for the whole street")}</span></p>
          <nav className="hx-tabs" aria-label={t("Get started")}>
            <a href="bite.html" className="hx-tab main"><b>{t("Find a table")}</b><small>{t("see who is cooking")}</small></a>
            <a href="bite.html?host" className="hx-tab"><b>{t("Become a host")}</b><small>{t("cook for your street")}</small></a>
            <a href="stand.html?ref=landing" className="hx-tab"><b>{t("60-second survey")}</b><small>{t("tell us how you eat")}</small></a>
            <a href="#waitlist" className="hx-tab"><b>{t("Save me a seat")}</b><small>{t("news by email")}</small></a>
          </nav>
        </div>
        <div className="hx-film">
          <HeroSpot />
          {/* a real number from our own survey at AIM 2026 (Aalen) */}
          <p className="hx-stat"><b>58%</b><span>{t("eat 8 or more meals a week alone")}</span><small>{t("Bite survey, AIM 2026")}</small></p>
        </div>
      </div>
    </section>
  );
}
