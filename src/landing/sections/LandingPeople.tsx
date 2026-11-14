// PULL UP A CHAIR: right under the hero, the human side first. Bite is about who you eat with; the price comes after.
// Two snapshots taped to the page (real kitchens, real people) beside three plain promises. No invented testimonials.
import { asset } from "../asset";
import { t } from "../../shared/i18n";

const POINTS = [
  { title: "Meet the people next door", text: "The neighbour you nod to on the stairs turns out to make the best dumplings in town. Bite gives you a reason to knock.", icon: "door" },
  { title: "Food made by a person, not a chain", text: "Family recipes, Sunday dishes, the thing someone learned from their grandmother. Cooked in a real kitchen, served at a real table.", icon: "pot" },
  { title: "Nobody has to eat alone", text: "New in town, studying far from home, or just tired of cooking for one: there is a seat for you, a few streets away.", icon: "chairs" },
] as const;

function Icon({ kind }: { kind: (typeof POINTS)[number]["icon"] }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className="pc-ico">
      {kind === "door" && <><rect x="10" y="5" width="20" height="31" rx="2" /><circle cx="25" cy="21" r="1.6" className="pc-dot" /><path d="M6 36h28" /></>}
      {kind === "pot" && <><path d="M8 18h24v9a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" /><path d="M5 18h30" /><path d="M15 14a5 5 0 0 1 10 0" /><path className="pc-steam" d="M16 9c-1.5-2 1.5-3 0-5M24 9c-1.5-2 1.5-3 0-5" /></>}
      {kind === "chairs" && <><path d="M9 8v24M9 21h9v11M9 15h9" /><path d="M31 8v24M31 21h-9v11M31 15h-9" /></>}
    </svg>
  );
}

export function LandingPeople() {
  return (
    <section id="people" className="pc">
      <div className="pc-inner">
        <div className="pc-photos" aria-hidden>
          <figure className="pc-snap pc-snap-a">
            <img src={asset("landing/photo-5.jpg")} alt="" loading="lazy" />
            <figcaption>{t("Sunday, someone's kitchen")}</figcaption>
          </figure>
          <figure className="pc-snap pc-snap-b">
            <img src={asset("app/img/1556909114-1200x420.jpg")} alt="" loading="lazy" />
            <figcaption>{t("Two cooks, one pot")}</figcaption>
          </figure>
        </div>
        <div className="pc-copy">
          <p className="pc-kicker">{t("Before we talk about money")}</p>
          <h2 className="r-h-46">{t("Dinner is better with people around the table.")}</h2>
          <p className="pc-lead">{t("Bite started with a simple feeling: the best meals happen in someone's home, with people you didn't know an hour ago. We want more of those evenings, in every neighbourhood.")}</p>
          <ul className="pc-points">
            {POINTS.map((p) => (
              <li key={p.title}>
                <Icon kind={p.icon} />
                <div><b>{t(p.title)}</b><span>{t(p.text)}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
