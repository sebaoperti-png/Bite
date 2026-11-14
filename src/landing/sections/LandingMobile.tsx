// THE PHONE LANDING (≤640px, 2026-11-14): its own layout instead of the desktop squeezed into a column.
// 1 the film first, then the promise and one big button; 2 the story as swipeable menu cards (why, price, how,
// for cooks, safety) with dots; 3 the real app as one still phone; then About us, feedback, FAQ and the footer
// (those are the shared sections). Copy reuses the desktop strings, so the German is already there.
import { useEffect, useRef, useState } from "react";
import { HeroSpot } from "./HeroSpot";
import { asset } from "../asset";
import { t, getLang } from "../../shared/i18n";

const euro = (n: number) => (getLang() === "de" ? `${n} €` : `€${n}`);

function Card({ id, kicker, title, children, dark }: { id?: string; kicker: string; title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <article id={id} className={`mx-card ${dark ? "dark" : ""}`}>
      <span className="mx-kicker">{kicker}</span>
      <h3 className="mx-title">{title}</h3>
      {children}
    </article>
  );
}

function Story() {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const N = 5;
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const on = () => {
      const w = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
      setAt(Math.max(0, Math.min(N - 1, Math.round(el.scrollLeft / (w + 12)))));
    };
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const go = (i: number) => {
    const el = track.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: "smooth" });
  };

  return (
    <section className="mx-story" aria-roledescription="carousel" aria-label={t("How Bite works")}>
      <div className="mx-track" ref={track}>
        <Card id="people" kicker={t("Why Bite")} title={t("Dinner is better with people around the table.")}>
          <ul className="mx-list">
            <li><b>{t("Meet the people next door")}</b><span>{t("The neighbour you nod to on the stairs turns out to make the best dumplings in town. Bite gives you a reason to knock.")}</span></li>
            <li><b>{t("Food made by a person, not a chain")}</b><span>{t("Family recipes, Sunday dishes, the thing someone learned from their grandmother. Cooked in a real kitchen, served at a real table.")}</span></li>
            <li><b>{t("Nobody has to eat alone")}</b><span>{t("New in town, studying far from home, or just tired of cooking for one: there is a seat for you, a few streets away.")}</span></li>
          </ul>
        </Card>

        <Card id="savings" kicker={t("The price")} title={t("Same dinner. A fraction of the price.")} dark>
          <div className="mx-prices" role="img" aria-label={t("Price per dinner: takeaway about 15 euros, Bite about 6 euros, restaurant about 25 euros")}>
            <div className="mx-price"><small>{t("Takeaway")}</small><s>{euro(15)}</s></div>
            <div className="mx-price bite"><small>Bite</small><b>{euro(6)}</b><em>{t("up to 60% less")}</em></div>
            <div className="mx-price"><small>{t("Restaurant")}</small><s>{euro(25)}</s></div>
          </div>
          <p className="mx-p">{t("What one dinner costs you, per plate. A neighbour is already cooking tonight, pull up a chair and split the cost of the groceries.")}</p>
          <p className="mx-fine">{t("Typical prices per dinner in a German city, for comparison. On Bite, hosts set an equal share of what the ingredients cost.")}</p>
        </Card>

        <Card id="services" kicker={t("How it works")} title={t("Three taps to a real meal")}>
          <ol className="mx-steps">
            <li><b>{t("Browse tonight's menus")}</b><span>{t("See what neighbours are cooking near you, filter by cuisine, diet or allergens.")}</span></li>
            <li><b>{t("Book your seat or pick-up")}</b><span>{t("Reserve in seconds, chat with your host and pay your share at the table.")}</span></li>
            <li><b>{t("Sit down & enjoy")}</b><span>{t("Eat something made with care, meet the person who made it, then rate your meal.")}</span></li>
          </ol>
        </Card>

        <Card id="cooks" kicker={t("For cooks")} title={t("Cook for more, spend less.")} dark>
          <p className="mx-p">{t("Cooking for six costs barely more than cooking for two. Open your table in four steps, your guests chip in for the groceries.")}</p>
          <ol className="mx-steps small">
            <li><b>{t("Show who's cooking")}</b></li>
            <li><b>{t("List your meal")}</b></li>
            <li><b>{t("Welcome guests")}</b></li>
            <li><b>{t("Split the bill")}</b></li>
          </ol>
          <a className="mx-btn light" href="bite.html?host">{t("Start hosting")}</a>
        </Card>

        <Card id="safety" kicker={t("House rules")} title={t("Safety isn't a feature. It's the product.")}>
          <ul className="mx-checks">
            <li className="ok">{t("Reviews after every dinner, both ways")}</li>
            <li className="ok">{t("Report or block anyone in one tap")}</li>
            <li className="ok">{t("A price cap: nobody makes a profit")}</li>
            <li className="ok">{t("Help by email: hello@bitetable.de")}</li>
            <li className="soon">{t("ID checks for hosts")} <i>({t("coming")})</i></li>
            <li className="soon">{t("Payments in the app")} <i>({t("coming")})</i></li>
          </ul>
        </Card>
      </div>
      <div className="mx-dots">
        {Array.from({ length: N }, (_, i) => (
          <button key={i} type="button" className={i === at ? "on" : ""} aria-label={t("Card {n} of {total}", { n: i + 1, total: N })} aria-current={i === at} onClick={() => go(i)} />
        ))}
      </div>
    </section>
  );
}

export function LandingMobile() {
  return (
    <>
      <section className="mx-hero">
        <div className="mx-film"><HeroSpot /></div>
        <p className="mx-hello">{t("Hello neighbours,")}</p>
        <h1 className="mx-h1">{t("Real food, real people,")} <em>{t("your neighbourhood.")}</em></h1>
        <p className="mx-sub">{t("Too many of us eat alone, a few doors apart. On Bite a neighbour cooks, you pull up a chair and everyone splits what the groceries cost.")}</p>
        <a className="mx-btn" href="bite.html">{t("Find a table")}</a>
        <nav className="mx-links" aria-label={t("Get started")}>
          <a href="bite.html?host">{t("Become a host")}</a>
          <a href="feedback.html?ref=landing">{t("Your feedback")}</a>
          <a href="#waitlist">{t("Save me a seat")}</a>
        </nav>
        <p className="mx-stat"><b>58%</b> {t("eat 8 or more meals a week alone")} <small>{t("Bite survey, AIM 2026")}</small></p>
      </section>

      <Story />

      <section className="mx-app" id="how">
        <div className="mx-phone"><img src={asset("landing/app-phone.jpg")} alt={t("The Bite app with sample meals")} loading="lazy" width={585} height={1266} /></div>
        <p className="mx-p center">{t("The real app, in your browser. No download needed.")}</p>
        <a className="mx-btn" href="bite.html">{t("Open the app")}</a>
      </section>
    </>
  );
}
