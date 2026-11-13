// Distances for the "place + radius" search (like Kleinanzeigen: "Frankfurt + 10 km"). Demo-grade geography:
// approximate coordinates for the demo neighbourhoods, city centres, and German postcodes by their first two
// digits (a postcode area, so a "60311" search starts from the middle of the 60xxx area, not the exact street).

export interface Place { label: string; lat: number; lng: number; kind: "city" | "postal" | "me" | "map" }

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
  Aalen: [48.8376, 10.093], Ulm: [48.4011, 9.9876], Augsburg: [48.3705, 10.8978], Regensburg: [49.0134, 12.1016], Würzburg: [49.7913, 9.9534], Ingolstadt: [48.7665, 11.4258],
  Göttingen: [51.5413, 9.9158], Gießen: [50.5841, 8.6784], Jena: [50.9271, 11.5892], Potsdam: [52.3906, 13.0645], Halle: [51.4825, 11.9697], Magdeburg: [52.1205, 11.6276],
  Chemnitz: [50.8278, 12.9214], Lübeck: [53.8655, 10.6866], Oldenburg: [53.1435, 8.2146], Osnabrück: [52.2799, 8.0472], Bielefeld: [52.0302, 8.5325], Saarbrücken: [49.2402, 6.9969],
  Trier: [49.7499, 6.6371], Konstanz: [47.6779, 9.1732], Tübingen: [48.5216, 9.0576], Heilbronn: [49.1427, 9.2109], "Schwäbisch Gmünd": [48.7999, 9.7977], Ellwangen: [48.9616, 10.1309],
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
  // every other postcode region (first two digits), so a postcode always finds its area even offline
  "02": ["Bautzen", 51.18, 14.42], "03": ["Cottbus", 51.76, 14.33], "15": ["Frankfurt (Oder)", 52.34, 14.55], "16": ["Eberswalde", 52.83, 13.82], "17": ["Neubrandenburg", 53.56, 13.26], "25": ["Itzehoe", 53.92, 9.52], "27": ["Verden", 52.92, 9.23], "29": ["Celle", 52.62, 10.08], "31": ["Hildesheim", 52.15, 9.95], "32": ["Herford", 52.11, 8.67], "41": ["Mönchengladbach", 51.19, 6.44], "42": ["Wuppertal", 51.26, 7.15], "46": ["Oberhausen", 51.47, 6.85], "49": ["Osnabrück", 52.28, 8.05], "54": ["Trier", 49.75, 6.64], "56": ["Koblenz", 50.36, 7.59], "57": ["Siegen", 50.87, 8.02], "58": ["Hagen", 51.36, 7.47], "59": ["Hamm", 51.68, 7.82], "67": ["Kaiserslautern", 49.44, 7.77], "73": ["Ostwürttemberg", 48.8, 9.9], "74": ["Heilbronn", 49.14, 9.22], "75": ["Pforzheim", 48.89, 8.7], "77": ["Offenburg", 48.47, 7.94], "78": ["Villingen-Schwenningen", 48.06, 8.46], "82": ["Starnberg", 48.0, 11.34], "83": ["Rosenheim", 47.86, 12.12], "84": ["Landshut", 48.54, 12.15], "87": ["Kempten", 47.73, 10.31], "88": ["Ravensburg", 47.78, 9.61], "91": ["Erlangen", 49.6, 11.0], "92": ["Amberg", 49.44, 11.86], "94": ["Passau", 48.57, 13.43], "95": ["Bayreuth", 49.95, 11.58], "96": ["Bamberg", 49.89, 10.89], "98": ["Suhl", 50.61, 10.69],
};

export const RADII = [0, 2, 5, 10, 20, 50, 100];

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

// a closer look where the two-digit regions are wide (Ostalb: Aalen, Ellwangen, Schwäbisch Gmünd, Heidenheim)
const PLZ3: Record<string, [string, number, number]> = {
  "730": ["Göppingen", 48.70, 9.65], "734": ["Aalen", 48.84, 10.09], "735": ["Schwäbisch Gmünd", 48.80, 9.80],
  "736": ["Schorndorf", 48.80, 9.53], "737": ["Esslingen", 48.74, 9.31], "895": ["Heidenheim", 48.68, 10.15],
};
/** A German postcode → the middle of its postcode area */
export function placeFromPostcode(code: string): Place | null {
  const m = code.trim().match(/^((\d{2})\d)\d{2}$/);
  if (!m) return null;
  const hit = PLZ3[m[1]] ?? PLZ2[m[2]];
  if (!hit) return null;
  const [town, lat, lng] = hit;
  return { label: `${code.trim()} · ${town}`, lat, lng, kind: "postal" };
}
