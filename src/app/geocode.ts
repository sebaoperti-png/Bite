// Any place in Germany → coordinates, for the "where?" search and the map.
// Uses Photon (photon.komoot.io, OpenStreetMap data, no key, CORS open). Only place names, postcodes and
// districts are asked for (osm_tag=place), never a person's address. Falls back to the built-in table in geo.ts
// when offline.
import type { Place } from "./geo";
import { CITIES, cityName, placeFromPostcode } from "./geo";

const API = "https://photon.komoot.io/api/";
/** Germany's bounding box (west, south, east, north) */
export const GERMANY_BBOX: [number, number, number, number] = [5.87, 47.27, 15.04, 55.06];

export interface Suggestion extends Place { detail: string }

const cache = new Map<string, Suggestion[]>();

const PLACE_RANK: Record<string, number> = { city: 0, town: 1, postcode: 2, village: 3, borough: 4, suburb: 5, quarter: 6, hamlet: 7 };

/** Places in Germany that match what the person typed (cities, towns, villages, districts, postcodes) */
export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const key = query.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;
  const url = `${API}?q=${encodeURIComponent(query)}&limit=12&lang=de&osm_tag=place&bbox=${GERMANY_BBOX.join(",")}`;
  // a slow or unreachable place search must not leave the person waiting: after 4 s the offline tables answer
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  const timer = window.setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json() as { features: { properties: Record<string, string>; geometry: { coordinates: [number, number] } }[] };
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const f of data.features) {
      const p = f.properties;
      if (p.countrycode !== "DE") continue;
      const kind = p.osm_value;
      if (!(kind in PLACE_RANK)) continue;
      const isPostcode = kind === "postcode";
      const name = isPostcode ? `${p.name} · ${p.city || p.county || ""}`.replace(/ · $/, "") : p.name;
      const detail = [isPostcode ? null : p.city && p.city !== p.name ? p.city : null, p.county, p.state].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2).join(", ");
      const id = `${name}|${detail}`;
      if (seen.has(id)) continue;
      seen.add(id);
      const [lng, lat] = f.geometry.coordinates;
      out.push({ label: name, detail, lat, lng, kind: isPostcode ? "postal" : "city" });
    }
    // what people usually mean first: cities and towns, then postcodes, villages, districts
    const rank = (s: Suggestion) => (s.kind === "postal" ? 2 : 0) + (s.label.toLowerCase() === key ? -5 : 0);
    out.sort((a, b) => rank(a) - rank(b));
    const top = out.slice(0, 6);
    cache.set(key, top);
    return top;
  } catch (e) {
    if (signal?.aborted) throw e; // the person typed on: this search is no longer wanted
    return offline(query);
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** The best single match (used when someone presses Go without picking a suggestion) */
export async function geocodePlace(q: string): Promise<Suggestion | null> {
  const list = await searchPlaces(q).catch(() => offline(q));
  return list[0] ?? offline(q)[0] ?? null;
}

function offline(q: string): Suggestion[] {
  if (/^\d{5}$/.test(q.trim())) {
    const p = placeFromPostcode(q);
    return p ? [{ ...p, detail: "" }] : [];
  }
  const c = cityName(q);
  return c ? [{ label: c, detail: "", lat: CITIES[c][0], lng: CITIES[c][1], kind: "city" }] : [];
}

/** Coordinates for a new meal, rounded to ~1 km so the map never points at the host's door */
// (only the town is looked up: the street never leaves the app for this)
export async function approximateSpot(city: string, postcode = ""): Promise<{ lat: number; lng: number } | null> {
  if (!city.trim() && !postcode.trim()) return null;
  // with the postcode the spot is the right part of town (or the right village), not just the town's centre
  const place = (postcode.trim() ? (await geocodePlace(`${postcode.trim()} ${city.trim()}`).catch(() => null)) ?? placeFromPostcode(postcode) : null)
    ?? await geocodePlace(city);
  if (!place) return null;
  const round = (x: number) => Math.round(x * 100) / 100;
  return { lat: round(place.lat), lng: round(place.lng) };
}
