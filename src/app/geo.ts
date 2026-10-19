// Distances for the "place + radius" search (like Kleinanzeigen: "Frankfurt + 10 km"). Demo-grade geography:
// approximate coordinates for the demo neighbourhoods, city centres, and German postcodes by their first two
// digits (a postcode area, so a "60311" search starts from the middle of the 60xxx area, not the exact street).

export interface Place { label: string; lat: number; lng: number; kind: "city" | "postal" | "me" }

/** Demo meals' neighbourhoods ("Neighbourhood, City") */
const NEIGHBOURHOODS: Record<string, [number, number]> = {
  "Kreuzberg, Berlin": [52.4986, 13.4033], "Prenzlauer Berg, Berlin": [52.5397, 13.4245], "Neukölln, Berlin": [52.4811, 13.4354], "Charlottenburg, Berlin": [52.5163, 13.3041],
  "Maxvorstadt, Munich": [48.15, 11.57], "Schwabing, Munich": [48.165, 11.585], "Glockenbachviertel, Munich": [48.131, 11.57],
  "Ehrenfeld, Cologne": [50.9497, 6.917], "Südstadt, Cologne": [50.923, 6.958], "Sülz, Cologne": [50.922, 6.92],
  "Sternschanze, Hamburg": [53.563, 9.965], "Altona, Hamburg": [53.55, 9.935], "Ottensen, Hamburg": [53.554, 9.923],
  "Bahnhofsviertel, Frankfurt": [50.107, 8.668], "Nordend, Frankfurt": [50.127, 8.69], "Bornheim, Frankfurt": [50.129, 8.711],
  "Südvorstadt, Leipzig": [51.322, 12.374], "Plagwitz, Leipzig": [51.33, 12.335], "Zentrum-West, Leipzig": [51.342, 12.364],
};

/** City centres (the demo cities + other large German cities people may type) */
export const CITIES: Record<string, [number, number]> = {
  Berlin: [52.52, 13.405], Hamburg: [53.5511, 9.9937], Munich: [48.1374, 11.5755], Cologne: [50.9375, 6.9603], Frankfurt: [50.1109, 8.6821], Leipzig: [51.3397, 12.3731],
  Stuttgart: [48.7758, 9.1829], Düsseldorf: [51.2277, 6.7735], Dortmund: [51.5136, 7.4653], Essen: [51.4556, 7.0116], Bremen: [53.0793, 8.8017], Dresden: [51.0504, 13.7373],
  Hanover: [52.3759, 9.732], Nuremberg: [49.4521, 11.0767], Bonn: [50.7374, 7.0982], Mainz: [49.9929, 8.2473], Wiesbaden: [50.0782, 8.2398], Darmstadt: [49.8728, 8.6512],
  Offenbach: [50.0956, 8.7761], Heidelberg: [49.3988, 8.6724], Mannheim: [49.4875, 8.466], Karlsruhe: [49.0069, 8.4037], Freiburg: [47.999, 7.8421], Münster: [51.9607, 7.6261],
  Aachen: [50.7753, 6.0839], Kiel: [54.3233, 10.1228], Rostock: [54.0924, 12.0991], Erfurt: [50.9848, 11.0299], Fulda: [50.5558, 9.6808], Kassel: [51.3127, 9.4797],
};
/** German spellings people may type */
const CITY_ALIASES: Record<string, string> = { münchen: "Munich", muenchen: "Munich", köln: "Cologne", koeln: "Cologne", hannover: "Hanover", nürnberg: "Nuremberg", nuernberg: "Nuremberg", "frankfurt am main": "Frankfurt" };

/** Postcode areas (first two digits) → approximate centre and the main town of the area */
const PLZ2: Record<string, [string, number, number]> = {
  "01": ["Dresden", 51.05, 13.74], "04": ["Leipzig", 51.34, 12.37], "06": ["Halle", 51.48, 11.97], "07": ["Jena", 50.93, 11.59], "08": ["Zwickau", 50.72, 12.49], "09": ["Chemnitz", 50.83, 12.92],
  "10": ["Berlin", 52.52, 13.405], "11": ["Berlin", 52.52, 13.405], "12": ["Berlin", 52.47, 13.43], "13": ["Berlin", 52.56, 13.33], "14": ["Potsdam", 52.4, 13.06],
  "18": ["Rostock", 54.09, 12.1], "19": ["Schwerin", 53.63, 11.41], "20": ["Hamburg", 53.55, 9.99], "21": ["Hamburg", 53.48, 10.0], "22": ["Hamburg", 53.58, 9.97],
  "23": ["Lübeck", 53.87, 10.69], "24": ["Kiel", 54.32, 10.12], "26": ["Oldenburg", 53.14, 8.21], "28": ["Bremen", 53.08, 8.8], "30": ["Hanover", 52.38, 9.73],
  "33": ["Bielefeld", 52.02, 8.53], "34": ["Kassel", 51.31, 9.48], "35": ["Gießen", 50.58, 8.68], "36": ["Fulda", 50.56, 9.68], "37": ["Göttingen", 51.54, 9.92],
  "38": ["Brunswick", 52.27, 10.52], "39": ["Magdeburg", 52.13, 11.63], "40": ["Düsseldorf", 51.23, 6.77], "44": ["Dortmund", 51.51, 7.47], "45": ["Essen", 51.46, 7.01],
  "47": ["Duisburg", 51.43, 6.76], "48": ["Münster", 51.96, 7.63], "50": ["Cologne", 50.94, 6.96], "51": ["Cologne", 50.95, 7.03], "52": ["Aachen", 50.78, 6.08],
  "53": ["Bonn", 50.74, 7.1], "55": ["Mainz", 49.99, 8.25], "60": ["Frankfurt", 50.11, 8.68], "61": ["Bad Homburg", 50.23, 8.62], "63": ["Offenbach", 50.1, 8.78],
  "64": ["Darmstadt", 49.87, 8.65], "65": ["Wiesbaden", 50.08, 8.24], "66": ["Saarbrücken", 49.24, 6.99], "68": ["Mannheim", 49.49, 8.47], "69": ["Heidelberg", 49.4, 8.67],
  "70": ["Stuttgart", 48.78, 9.18], "71": ["Ludwigsburg", 48.9, 9.19], "72": ["Tübingen", 48.52, 9.06], "76": ["Karlsruhe", 49.01, 8.4], "79": ["Freiburg", 48.0, 7.84],
  "80": ["Munich", 48.14, 11.58], "81": ["Munich", 48.12, 11.6], "85": ["Ingolstadt", 48.77, 11.42], "86": ["Augsburg", 48.37, 10.9], "89": ["Ulm", 48.4, 9.99],
  "90": ["Nuremberg", 49.45, 11.08], "93": ["Regensburg", 49.01, 12.1], "97": ["Würzburg", 49.79, 9.95], "99": ["Erfurt", 50.98, 11.03],
};

export const RADII = [0, 2, 5, 10, 20, 50];

export function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Where a meal is: its neighbourhood if we know it, otherwise its city's centre */
export function coordsOf(location: string): [number, number] | null {
  const parts = location.split(", ").map((p) => p.trim());
  const last2 = parts.slice(-2).join(", ");
  if (NEIGHBOURHOODS[last2]) return NEIGHBOURHOODS[last2];
  const city = cityName(parts[parts.length - 1] ?? "");
  return city ? CITIES[city] : null;
}

/** "münchen" → "Munich", "frankfurt" → "Frankfurt", unknown → null */
export function cityName(input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  if (CITY_ALIASES[q]) return CITY_ALIASES[q];
  return Object.keys(CITIES).find((c) => c.toLowerCase() === q) ?? null;
}

/** A German postcode → the middle of its postcode area */
export function placeFromPostcode(code: string): Place | null {
  const m = code.trim().match(/^(\d{2})\d{3}$/);
  if (!m || !PLZ2[m[1]]) return null;
  const [town, lat, lng] = PLZ2[m[1]];
  return { label: `${code.trim()} · ${town}`, lat, lng, kind: "postal" };
}
