// THE PHONE LANDING (≤640px, 2026-11-14): its own layout instead of the desktop squeezed into a column.
// 1 the film first, then the promise and one big button; 2 the story as the building you walk down (LandingBuilding:
// why, price, how, for cooks, house rules, doorbells, the doormat into the app); then About us, feedback, FAQ and the
// footer (shared sections). Copy mostly reuses the desktop strings, so the German is already there.
import { HeroSpot } from "./HeroSpot";
import { LandingBuilding } from "./LandingBuilding";
import { t } from "../../shared/i18n";

export function LandingMobile() {
  return (
    <>
      <section className="mx-hero">
        <div className="mx-film"><HeroSpot /></div>
        <p className="mx-city"><i aria-hidden />{t("Starting in Aalen")}</p>
        <p className="mx-hello">{t("Hello neighbours,")}</p>
        <h1 className="mx-h1">{t("Real food, real people,")} <em>{t("your neighbourhood.")}</em></h1>
        <p className="mx-sub">{t("Too many of us eat alone, a few doors apart. On Bite a neighbour cooks, you pull up a chair and everyone splits what the groceries cost.")}</p>
        <a className="mx-btn" href="bite.html">{t("Find a table")}</a>
        <nav className="mx-links" aria-label={t("Get started")}>
          <a href="bite.html?host">{t("Become a host")}</a>
          <a href="feedback.html?ref=landing">{t("Your feedback")}</a>
          <a href="#waitlist">{t("Save me a seat")}</a>
        </nav>
        {/* the 58% from our AIM survey now sits on the 4th floor of the building, right below */}
      </section>

      <LandingBuilding />
    </>
  );
}
