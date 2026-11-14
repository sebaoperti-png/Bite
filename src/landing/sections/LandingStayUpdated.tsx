// STAY UPDATED: the 60-second survey and the "Save me a seat" sign-up (two cards, tabs swap them; #waitlist brings
// the seat card forward). Moved out of the hero on 2026-11-14 so the hero can be about people.
import { t } from "../../shared/i18n";
import { LandingSeatCard } from "./LandingSeatCard";

export function LandingStayUpdated() {
  return (
    <section className="su" id="stay">
      <div className="su-inner">
        <div className="su-copy">
          <p className="su-kicker">{t("Early days, so your say counts")}</p>
          <h2 className="r-h-46">{t("Help us set the first tables.")}</h2>
          <p>{t("Bite is just starting. Tell us how you eat in a one-minute survey, or leave your email and we will keep a seat for you when Bite opens near you.")}</p>
        </div>
        <LandingSeatCard />
      </div>
    </section>
  );
}
