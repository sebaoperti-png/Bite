// The map of meals across Germany (Listings → "Map"). MapLibre + OpenFreeMap tiles (OpenStreetMap data, free,
// no key). Loaded only when the map is opened, so the app stays light.
// Pins are approximate on purpose: a live meal is stored at its town's centre rounded to ~1 km, and every pin is
// nudged by a few hundred metres (fixed per meal), so nobody can find a host's door from the map.
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MLMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../styles/map.css";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Star } from "lucide-react";
import { euro, mealCoords, mealDistance, searchCenter, effectiveRadius, type Meal, type SearchCriteria } from "../data";
import { distanceKm, type Place } from "../geo";
import { GERMANY_BBOX } from "../geocode";
import { fmtKm } from "./LocationPicker";
import { t, tMaybe, dateLabel } from "../../shared/i18n";

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const GERMANY: [[number, number], [number, number]] = [[GERMANY_BBOX[0], GERMANY_BBOX[1]], [GERMANY_BBOX[2], GERMANY_BBOX[3]]];
const CLUSTER_PX = 46;

/** a fixed nudge per meal (up to ~350 m), so pins in the same town don't sit on top of each other */
function nudge(id: string): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const a = ((h >>> 0) % 3600) / 3600 * Math.PI * 2;
  const r = 0.0012 + (((h >>> 12) % 1000) / 1000) * 0.0020;
  return [Math.sin(a) * r, Math.cos(a) * r * 1.5];
}

/** a circle (km) as a polygon, to draw the searched area */
function circle([lat, lng]: [number, number], km: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    pts.push([lng + (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a), lat + (km / 110.57) * Math.sin(a)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [pts] } };
}

interface Point { meal: Meal; lngLat: [number, number] }

export default function MealMap({ meals, criteria, onSelect, onSearchArea, compact = false, highlight = null }: {
  meals: Meal[];
  criteria: SearchCriteria;
  onSelect?: (m: Meal) => void;
  onSearchArea?: (place: Place, radiusKm: number) => void;
  /** a small preview (the "Where?" picker): no controls, pins only show where meals are */
  compact?: boolean;
  /** a meal hovered in the list beside the map (desktop): its pin lights up */
  highlight?: string | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const me = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [moved, setMoved] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const points: Point[] = useMemo(() => meals.flatMap((meal) => {
    const c = mealCoords(meal);
    if (!c) return [];
    const [dLat, dLng] = nudge(meal.id);
    return [{ meal, lngLat: [c[1] + dLng, c[0] + dLat] as [number, number] }];
  }), [meals]);
  const unplaced = meals.length - points.length;

  const centre = searchCenter(criteria);
  const radius = effectiveRadius(criteria);

  // ---------------------------------------------------------------- the map itself
  useEffect(() => {
    if (!box.current) return;
    let m: MLMap;
    try {
      m = new maplibregl.Map({
        container: box.current, style: STYLE, bounds: GERMANY, fitBoundsOptions: { padding: 24 },
        attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, maxZoom: 15, minZoom: 4,
        interactive: !compact,
      });
    } catch {
      setFailed(true); // no WebGL: the list still works
      return;
    }
    m.touchZoomRotate.disableRotation();
    if (!compact) m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => {
      m.addSource("area", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": "#9b4aff", "fill-opacity": 0.08 } });
      m.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": "#6b21d9", "line-width": 1.6, "line-dasharray": [2, 2] } });
      setReady(true);
    });
    // "Search this area" appears only after the person moves the map themselves
    const touched = (e: { originalEvent?: unknown }) => { if (e.originalEvent) setMoved(true); };
    m.on("dragstart", touched); m.on("zoomstart", touched);
    m.on("click", () => setSelected(null));
    // tiles still loading when the map closes are cancelled on purpose: that is not an error
    m.on("error", (e) => { const err = (e as { error?: Error }).error; if (err && err.name !== "AbortError" && !/aborted/i.test(err.message)) console.warn("map:", err.message); });
    map.current = m;
    return () => {
      markers.current.forEach((k) => k.remove()); me.current?.remove(); map.current = null;
      // closing a map whose style is still loading makes MapLibre print an "AbortError": wait for it to finish first
      let gone = false;
      const kill = () => { if (!gone) { gone = true; m.remove(); } };
      if (m.isStyleLoaded()) kill();
      else { m.once("load", kill); m.once("error", kill); window.setTimeout(kill, 15000); }
    };
  }, []);

  // ---------------------------------------------------------------- frame what was searched
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const src = m.getSource("area") as maplibregl.GeoJSONSource | undefined;
    src?.setData({ type: "FeatureCollection", features: centre && radius > 0 ? [circle(centre, radius)] : [] });
    // a blue dot where the person is, when they searched around their own location
    me.current?.remove(); me.current = null;
    const o = criteria.origin;
    if (o?.kind === "me") {
      const dot = document.createElement("span");
      dot.className = "mm-me";
      dot.setAttribute("aria-label", t("Near you"));
      me.current = new maplibregl.Marker({ element: dot }).setLngLat([o.lng, o.lat]).addTo(m);
    }
    if (moved) return; // the person is exploring: don't jump around
    if (centre && radius > 0) {
      const c = circle(centre, radius).geometry.coordinates[0];
      const b = c.reduce((bb, p) => bb.extend(p as [number, number]), new maplibregl.LngLatBounds(c[0] as [number, number], c[0] as [number, number]));
      m.fitBounds(b, { padding: compact ? 14 : 40, duration: compact ? 400 : 700, maxZoom: 13 });
    } else if (points.length) {
      const b = points.reduce((bb, p) => bb.extend(p.lngLat), new maplibregl.LngLatBounds(points[0].lngLat, points[0].lngLat));
      m.fitBounds(b, { padding: 70, duration: 700, maxZoom: 12 });
    } else {
      m.fitBounds(GERMANY, { padding: 24, duration: 700 });
    }
  }, [ready, points, centre?.[0], centre?.[1], radius, criteria.origin?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- pins and groups
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const draw = () => {
      markers.current.forEach((k) => k.remove());
      markers.current = [];
      // group pins that would overlap on screen
      const groups: { pts: Point[]; x: number; y: number }[] = [];
      for (const p of points) {
        const { x, y } = m.project(p.lngLat);
        const g = groups.find((gr) => Math.hypot(gr.x - x, gr.y - y) < CLUSTER_PX);
        if (g) { g.pts.push(p); g.x = (g.x * (g.pts.length - 1) + x) / g.pts.length; g.y = (g.y * (g.pts.length - 1) + y) / g.pts.length; }
        else groups.push({ pts: [p], x, y });
      }
      for (const g of groups) {
        const el = document.createElement("button");
        el.type = "button";
        if (g.pts.length === 1) {
          const meal = g.pts[0].meal;
          el.className = `mm-pin ${selected === meal.id ? "on" : ""} ${highlight === meal.id ? "hl" : ""}`;
          el.textContent = meal.price === 0 ? t("Free") : euro(meal.price);
          el.setAttribute("aria-label", `${tMaybe(meal.title)}, ${euro(meal.price)}`);
          el.onclick = (e) => { e.stopPropagation(); if (!compact) setSelected(meal.id); };
          if (compact) el.tabIndex = -1;
          markers.current.push(new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(g.pts[0].lngLat).addTo(m));
        } else {
          el.className = "mm-group";
          el.innerHTML = `<b>${g.pts.length}</b><span>${t("meals")}</span>`;
          el.setAttribute("aria-label", t("{n} meals here, zoom in", { n: g.pts.length }));
          const b = g.pts.reduce((bb, p) => bb.extend(p.lngLat), new maplibregl.LngLatBounds(g.pts[0].lngLat, g.pts[0].lngLat));
          el.onclick = (e) => { e.stopPropagation(); if (compact) return; setSelected(null); m.fitBounds(b, { padding: 90, maxZoom: 15, duration: 600 }); };
          if (compact) el.tabIndex = -1;
          markers.current.push(new maplibregl.Marker({ element: el }).setLngLat(m.unproject([g.x, g.y])).addTo(m));
        }
      }
    };
    draw();
    m.on("moveend", draw);
    return () => { m.off("moveend", draw); };
  }, [ready, points, selected, highlight]);

  const searchHere = () => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    const b = m.getBounds();
    const half = Math.min(distanceKm([c.lat, c.lng], [b.getNorth(), c.lng]), distanceKm([c.lat, c.lng], [c.lat, b.getEast()]));
    const km = Math.max(2, Math.min(300, Math.round(half * 0.9)));
    setMoved(false);
    onSearchArea?.({ label: t("Map area"), lat: c.lat, lng: c.lng, kind: "map" }, km);
  };

  const sel = points.find((p) => p.meal.id === selected)?.meal;
  const dist = sel ? mealDistance(sel, criteria) : null;

  return (
    <div className={`mm ${compact ? "mm-compact" : ""}`}>
      <div ref={box} className="mm-canvas" role="region" aria-label={t("Map of meals")} />
      {failed && <div className="mm-fallback">{t("The map cannot be shown on this device. Use the list instead.")}</div>}
      {!ready && !failed && <div className="mm-loading">{t("Unfolding the map…")}</div>}

      <AnimatePresence>
        {moved && ready && !compact && (
          <motion.button key="here" className="mm-here" onClick={searchHere} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Search size={14} strokeWidth={2.6} /> {t("Search this area")}
          </motion.button>
        )}
      </AnimatePresence>

      {ready && points.length === 0 && (
        <div className="mm-empty">{compact ? t("No meals in this area yet") : t("No meals here yet. Zoom out or search another town.")}</div>
      )}
      {unplaced > 0 && ready && !compact && <p className="mm-note">{t("{n} meals without a place on the map are only in the list", { n: unplaced })}</p>}

      <AnimatePresence>
        {sel && (
          <motion.div key={sel.id} className="mm-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}>
            <button className="mm-card-main" onClick={() => onSelect?.(sel)}>
              <img src={sel.image} alt="" />
              <span className="mm-card-text">
                <b>{tMaybe(sel.title)}</b>
                <em>{t("with {name}", { name: sel.host })}{sel.reviews > 0 && <> · <Star size={11} fill="#f5a623" color="#f5a623" /> {sel.rating.toFixed(1)}</>}</em>
                <span>{dateLabel(sel.date)} · {sel.time}{dist != null ? ` · ${fmtKm(dist)}` : ""}</span>
                <strong>{sel.price === 0 ? t("Free") : euro(sel.price)}</strong>
              </span>
            </button>
            <button className="mm-card-x" onClick={() => setSelected(null)} aria-label={t("Close")}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
