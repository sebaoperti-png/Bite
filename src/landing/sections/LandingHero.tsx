// HERO: the promise on the left (as on the "Push your idea" cover), the little animated spot on the right (HeroSpot.tsx).
import { HeroSpot } from "./HeroSpot";
import { t } from "../../shared/i18n";

export function LandingHero() {
  return (
    <section className="hx">
      <div className="hx-inner">
        <div className="hx-copy">
          <h1 className="hx-title">{t("Real food,")}<br />{t("real people,")}<br /><span>{t("your neighbourhood.")}</span></h1>
          <p className="hx-sub">{t("Too many people eat alone, a few doors away from each other. On Bite a neighbour cooks, you pull up a chair and everyone splits what the groceries cost.")} <em>{t("Food is better shared.")}</em></p>
          <div className="hx-ctas">
            <a href="bite.html" className="hx-btn primary">{t("Find a table")}</a>
            <a href="bite.html?host" className="hx-btn">{t("Become a host")}</a>
          </div>
          <p className="hx-small">
            <a className="lm" href="stand.html?ref=landing"><span className="lm-text">{t("Tell us how you eat in 60 seconds")}</span></a>
            <span aria-hidden className="hx-sep" />
            <a className="lm" href="#waitlist"><span className="lm-text">{t("Save me a seat")}</span></a>
          </p>
        </div>
        <HeroSpot />
      </div>
    </section>
  );
}
