// "Where?" — a place and a radius, like Kleinanzeigen: type any town, village, district or postcode in Germany
// (suggestions as you type, from OpenStreetMap via geocode.ts) or use your location, then choose how far
// around it to look ("Whole city", +2 … +100 km). The button shows how many meals match.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { MapPin, LocateFixed, Search } from "lucide-react";
import { AREAS, ANY_AREA, effectiveRadius, type SearchCriteria } from "../data";
import { RADII, type Place } from "../geo";
import { searchPlaces, geocodePlace, type Suggestion } from "../geocode";
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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [looking, setLooking] = useState(false);
  const typed = useRef(false);

  // suggestions while typing (a short pause first, the previous request is cancelled)
  useEffect(() => {
    const q = text.trim();
    if (!typed.current || q.length < 2) { setSuggestions([]); return; }
    const ctrl = new AbortController();
    const id = window.setTimeout(() => {
      setLooking(true);
      searchPlaces(q, ctrl.signal).then((s) => { setSuggestions(s); setLooking(false); }).catch(() => setLooking(false));
    }, 220);
    return () => { window.clearTimeout(id); ctrl.abort(); };
  }, [text]);

  const usePlace = (origin: Place) => { set({ origin, area: ANY_AREA, radius: criteria.radius || 10 }); setError(""); };
  const useCity = (area: string) => { set({ area, origin: null }); setError(""); setText(""); typed.current = false; setSuggestions([]); };
  const pick = (s: Suggestion) => {
    usePlace({ label: s.label, lat: s.lat, lng: s.lng, kind: s.kind });
    typed.current = false; setText(s.label); setSuggestions([]);
  };

  const submit = async () => {
    const q = text.trim();
    if (!q) return;
    if (suggestions[0]) { pick(suggestions[0]); return; }
    setLooking(true);
    const s = await geocodePlace(q);
    setLooking(false);
    if (s) pick(s);
    else setError(t("We could not find this place in Germany. Try a town or a postcode."));
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
        <input value={text} onChange={(e) => { typed.current = true; setText(e.target.value); setError(""); }} placeholder={t("Any town, village or postcode in Germany")} aria-label={t("City or postcode")} inputMode="search" maxLength={60}
          role="combobox" aria-expanded={suggestions.length > 0} aria-controls="lp-suggest" aria-autocomplete="list" />
        <button type="submit" disabled={!text.trim() || looking}>{looking ? "…" : t("Go")}</button>
      </form>
      {suggestions.length > 0 && (
        <ul className="lp-suggest" id="lp-suggest" role="listbox">
          {suggestions.map((s) => (
            <li key={`${s.label}-${s.detail}`} role="option" aria-selected={false}>
              <button type="button" onClick={() => pick(s)}>
                <MapPin size={14} />
                <span><b>{s.label}</b>{s.detail && <em>{s.detail}</em>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="lp-me" onClick={locate} disabled={locating}>
        <LocateFixed size={16} /> {locating ? t("Finding you…") : t("Use my location")}
      </button>
      {error && <p className="lp-err" role="alert">{error}</p>}

      {criteria.origin && (
        <p className="lp-current"><MapPin size={14} /> {t("Around {place}", { place: criteria.origin.label })}</p>
      )}

      <p className="lp-label">{t("Popular cities")}</p>
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
