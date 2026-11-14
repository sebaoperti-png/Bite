// Home, set like the entrance of a small restaurant: the people cooking tonight first (Bite is about who you eat
// with), then the kitchen's chalkboard inviting you to cook. Used by the phone and the desktop home.
import { ChefHat, ChevronRight } from "lucide-react";
import { dayLabel, type Meal } from "../data";
import { t, tMaybe, dateLabel } from "../../shared/i18n";
import { ChefScene } from "./ChefScene";

const dayIndex = (label: string) => { for (let i = 0; i < 30; i++) if (dayLabel(i) === label) return i; return 99; };

/** one meal per host, the soonest first */
function cooksFrom(meals: Meal[], max: number) {
  const seen = new Set<string>();
  return [...meals]
    .sort((a, b) => dayIndex(a.date) - dayIndex(b.date) || a.time.localeCompare(b.time))
    .filter((m) => { const k = m.hostId || m.host; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, max);
}

function Face({ m, size }: { m: Meal; size: number }) {
  return m.hostAvatar
    ? <img src={m.hostAvatar} alt="" width={size} height={size} className="nc-face" loading="lazy" />
    : <span className="nc-face nc-initial" style={{ width: size, height: size, fontSize: size * 0.48 }}>{m.host.charAt(0)}</span>;
}

/** "Your neighbours in the kitchen": who is cooking, what, and when. Tapping one opens their meal. */
export function NeighbourCooks({ meals, onSelectMeal, onHost, layout }: { meals: Meal[]; onSelectMeal: (m: Meal) => void; onHost: () => void; layout: "column" | "row" }) {
  const cooks = cooksFrom(meals, layout === "column" ? 4 : 8);
  return (
    <section className={`nc nc-${layout}`} aria-labelledby={`nc-title-${layout}`}>
      <header className="nc-head">
        <h2 id={`nc-title-${layout}`}>{t("Your neighbours in the kitchen")}</h2>
        <p>{cooks.length ? t("Real people cooking near you. Pull up a chair.") : t("Nobody is cooking yet. The first table could be yours.")}</p>
      </header>
      {cooks.length ? (
        <ul className="nc-list">
          {cooks.map((m, i) => (
            <li key={m.id} style={{ ["--i" as string]: i }}>
              <button type="button" className="nc-card" onClick={() => onSelectMeal(m)}>
                <Face m={m} size={layout === "column" ? 52 : 58} />
                <span className="nc-text">
                  <b>{m.host.split(" ")[0]}</b>
                  <span className="nc-dish">{t("is cooking {dish}", { dish: tMaybe(m.title) })}</span>
                  <span className="nc-when">{dateLabel(m.date)}, {m.time}</span>
                </span>
                {layout === "column" && <ChevronRight size={16} className="nc-go" />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <button type="button" className="nc-empty" onClick={onHost}><ChefHat size={16} /> {t("Host the first table")}</button>
      )}
    </section>
  );
}

/** The kitchen's chalkboard: an invitation to cook, written in chalk */
export function HostChalkboard({ onHost, compact }: { onHost: () => void; compact?: boolean }) {
  return (
    <section className={`hc ${compact ? "hc-compact" : ""}`}>
      <div className="hc-board">
        <div className="hc-copy">
          <p className="hc-kicker">{t("From the kitchen")}</p>
          <h2 className="chalk-text">{t("Cooking anyway? Set a longer table.")}</h2>
          <p className="hc-body">{t("Cook a little more, invite a few neighbours, and split what the groceries cost. You meet people and eat for less.")}</p>
          <button type="button" className="hc-btn" onClick={onHost}><ChefHat size={16} strokeWidth={2.4} /> {t("Start hosting")}</button>
        </div>
        {!compact && <div className="hc-art" aria-hidden><ChefScene /></div>}
      </div>
    </section>
  );
}
