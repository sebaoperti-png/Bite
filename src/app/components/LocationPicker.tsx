// "Where?" — a place and a radius, like Kleinanzeigen: type a city or a German postcode (or use your location),
// then choose how far around it to look ("Whole city", +2 … +50 km). The button shows how many meals match.
import { useState } from "react";
import { motion } from "motion/react";
import { MapPin, LocateFixed, Search } from "lucide-react";
import { AREAS, ANY_AREA, effectiveRadius, type SearchCriteria } from "../data";
import { RADII, CITIES, cityName, placeFromPostcode, type Place } from "../geo";
import { t, dec } from "../../shared/i18n";

export function LocationPicker({ criteria, set, countFor, onDone }: {
  criteria: SearchCriteria;
  set: (patch: Partial<SearchCriteria>) => void;
  countFor: (patch: Partial<SearchCriteria>) => number;
  onDone: () => void;
}) {
  const [text, setText] = useState(criteria.origin?.kind === "postal" ? criteria.origin.label.split(" · ")[0] : "");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const usePlace = (origin: Place) => { set({ origin, area: ANY_AREA, radius: criteria.radius || 10 }); setError(""); };
  const useCity = (area: string) => { set({ area, origin: null }); setError(""); setText(""); };

  const submit = () => {
    const q = text.trim();
    if (!q) return;
    if (/^\d{5}$/.test(q)) {
      const p = placeFromPostcode(q);
      if (p) usePlace(p); else setError(t("We don't know this postcode yet — try a city"));
      return;
    }
    const city = cityName(q);
    if (city && AREAS.includes(city)) useCity(city);
    else if (city) { const [lat, lng] = CITIES[city]; usePlace({ label: t(city), lat, lng, kind: "city" }); } // a city without demo meals: search around it
    else setError(t("Type a city (e.g. Frankfurt) or a 5-digit postcode"));
  };

  const locate = () => {
    if (!navigator.geolocation) { setError(t("Your browser can't share its location")); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); usePlace({ label: t("Your location"), lat: pos.coords.latitude, lng: pos.coords.longitude, kind: "me" }); },
      () => { setLocating(false); setError(t("Location not shared — type a city or postcode instead")); },
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  const hasCity = criteria.area !== ANY_AREA && !criteria.origin;
  const r = effectiveRadius(criteria);
  const radii = hasCity ? RADII : RADII.filter((x) => x > 0);
  const n = countFor({});

  return (
    <div className="lp-pick">
      <form className="lp-search" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Search size={16} color="#7c6fa0" />
        <input value={text} onChange={(e) => { setText(e.target.value); setError(""); }} placeholder={t("City or postcode")} aria-label={t("City or postcode")} inputMode="search" maxLength={40} />
        <button type="submit" disabled={!text.trim()}>{t("Go")}</button>
      </form>
      <button type="button" className="lp-me" onClick={locate} disabled={locating}>
        <LocateFixed size={16} /> {locating ? t("Finding you…") : t("Use my location")}
      </button>
      {error && <p className="lp-err" role="alert">{error}</p>}

      {criteria.origin && (
        <p className="lp-current"><MapPin size={14} /> {t("Around {place}", { place: criteria.origin.label })}</p>
      )}

      <p className="lp-label">{t("Cities")}</p>
      <div className="lp-chips">
        {AREAS.map((a) => {
          const on = !criteria.origin && criteria.area === a;
          return <button key={a} type="button" className={`lp-chip ${on ? "on" : ""}`} onClick={() => useCity(a)}>{t(a)}</button>;
        })}
      </div>

      {(hasCity || criteria.origin) && (
        <>
          <p className="lp-label">{t("Distance")}</p>
          <div className="lp-radii" role="radiogroup" aria-label={t("Distance")}>
            {radii.map((x) => {
              const on = r === x;
              return (
                <button key={x} type="button" role="radio" aria-checked={on} className={`lp-radius ${on ? "on" : ""}`} onClick={() => set({ radius: x })}>
                  {on && <motion.span layoutId="lp-radius-pill" className="lp-radius-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
                  <span>{x === 0 ? t("Whole city") : `+${x} km`}</span>
                </button>
              );
            })}
          </div>
          {/* a little map of the circle you're searching in */}
          <div className="lp-ring" aria-hidden>
            <span className="lp-ring-circle" style={{ ["--s" as string]: x2scale(r) }} />
            <span className="lp-ring-pin"><MapPin size={16} /></span>
          </div>
        </>
      )}

      <motion.button type="button" className="lp-done" onClick={onDone} whileTap={{ scale: 0.97 }}>
        {n === 1 ? t("Show 1 meal") : t("Show {n} meals", { n })}
      </motion.button>
    </div>
  );
}

/** radius → size of the drawn circle (0 = whole city drawn as a large soft area) */
const x2scale = (r: number) => (r === 0 ? 1 : Math.min(1, 0.28 + Math.log10(r) * 0.42));
export const fmtKm = (d: number) => (d < 10 ? `${dec(d, 1)} km` : `${Math.round(d)} km`);

/** "Frankfurt", "Frankfurt · +10 km", "60311 · Frankfurt · +10 km", "Your location · +5 km" (or `anyLabel` when nowhere is set) */
export function placeSummary(c: SearchCriteria, anyLabel: string) {
  const r = effectiveRadius(c);
  if (c.origin) return `${c.origin.label} · +${r} km`;
  if (c.area === ANY_AREA) return anyLabel;
  return r ? `${t(c.area)} · +${r} km` : t(c.area);
}
