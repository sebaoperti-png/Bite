import { getLang, t } from "../shared/i18n";
import { CITIES, coordsOf, distanceKm, type Place } from "./geo";
// Demo content: the meals shown in the app and the date helper they use.

export type ServiceType = "pickup" | "eat-together" | "cook-together";

export interface Meal {
  id: string;
  title: string;
  host: string;
  hostAvatar: string;
  rating: number;
  reviews: number;
  price: number;
  seats: number;
  serviceType: ServiceType;
  image: string;
  tags: string[];
  location: string;
  time: string;
  date: string;
  description: string;
  hostBio: string;
  ingredients?: string[];
  /** Extra dish photos shown after the cover on the meal page */
  gallery?: string[];
  /** How the contribution was set: from the host's receipt or Bite's estimate */
  costProof?: { kind: "receipt" | "estimate"; total: number; people: number };
  /** Listings published from this browser through "Start hosting" */
  ownedByMe?: boolean;
}

/** "Today", "Tomorrow" or e.g. "Saturday, 17 Oct": the demo always shows meals in the coming days. */
export function dayLabel(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const dayMonth = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (offset === 0) return `Today, ${dayMonth}`;
  if (offset === 1) return `Tomorrow, ${dayMonth}`;
  return `${d.toLocaleDateString("en-GB", { weekday: "long" })}, ${dayMonth}`;
}

export const MEALS: Meal[] = [
  {
    id: "1",
    title: "Thai Green Curry",
    host: "Maria K.",
    hostAvatar: "app/img/1556911073-160x160.jpg",
    rating: 4.9,
    reviews: 38,
    price: 5,
    seats: 2,
    serviceType: "eat-together",
    image: "app/img/1554054204-800x533.jpg",
    tags: ["Vegetarian", "Vegan", "Gluten-free", "Thai"],
    location: "Oranienstr. 12, Kreuzberg, Berlin",
    time: "19:30",
    date: dayLabel(1),
    description: "Authentic Thai green curry made with fresh coconut milk, lemongrass and garden vegetables. Served with jasmine rice and fresh lime. I learned this recipe from a cooking class in Chiang Mai.",
    hostBio: "Graphic designer by day, Thai food obsessive by night. Grew up in Berlin but spent a year in Bangkok — cooking is how I stay connected to that time.",
  },
  {
    id: "2",
    title: "Homemade Pasta al Pesto",
    host: "Lorenzo B.",
    hostAvatar: "app/img/1556911073b-160x160.jpg",
    rating: 4.7,
    reviews: 22,
    price: 4,
    seats: 4,
    serviceType: "pickup",
    image: "app/img/1481931098730-800x533.jpg",
    tags: ["Italian", "Vegetarian", "Dairy-free"],
    location: "Türkenstr. 5, Maxvorstadt, Munich",
    time: "12:00",
    date: dayLabel(2),
    description: "Fresh handmade tagliatelle with classic Genovese pesto — basil, pine nuts, Parmesan, extra-virgin olive oil. Made from scratch every morning.",
    hostBio: "Born in Genova, living in Munich for 6 years. I make pasta every weekend — my nonna taught me the dough by feel, not by recipe.",
  },
  {
    id: "3",
    title: "Moroccan Lamb Tagine",
    host: "Amina S.",
    hostAvatar: "app/img/1556911220-160x160.jpg",
    rating: 5.0,
    reviews: 14,
    price: 6,
    seats: 3,
    serviceType: "cook-together",
    image: "app/img/1661083098412-800x533.jpg",
    tags: ["Halal", "Gluten-free", "Nut-free", "Moroccan"],
    location: "Venloer Str. 8, Ehrenfeld, Cologne",
    time: "18:00",
    date: dayLabel(3),
    description: "Join me to cook a slow-braised lamb tagine with preserved lemon, olives and ras el hanout. We'll make the couscous together and share the meal at the end.",
    hostBio: "Architecture student from Marrakech. I host cook-togethers as a way to share culture — food is the easiest door into someone's world.",
    ingredients: ["Lamb shoulder (provided)", "Preserved lemons", "Olives", "Ras el hanout", "Saffron", "Couscous", "Fresh herbs"],
  },
  {
    id: "4",
    title: "Korean Bibimbap Bowl",
    host: "Soo-Yeon P.",
    hostAvatar: "app/img/1544005313-160x160.jpg",
    rating: 4.8,
    reviews: 31,
    price: 5,
    seats: 3,
    serviceType: "pickup",
    image: "app/img/1590301157890-800x533.jpg",
    tags: ["Korean", "Gluten-free", "Dairy-free"],
    location: "Kastanienallee 22, Prenzlauer Berg, Berlin",
    time: "13:00",
    date: dayLabel(1),
    description: "Classic bibimbap with seasoned vegetables, gochujang sauce, a fried egg on top and warm steamed rice. Packed hot, ready to pick up in compostable bowls.",
    hostBio: "Software engineer and weekend cook. I grew up eating my mum's Korean food every day — now I make it for my neighbours. It makes me feel at home.",
  },
  {
    id: "5",
    title: "Spanish Tortilla & Tapas",
    host: "Carlos M.",
    hostAvatar: "app/img/1500648767791-160x160.jpg",
    rating: 4.6,
    reviews: 19,
    price: 4,
    seats: 5,
    serviceType: "eat-together",
    image: "app/img/1534080564583-800x533.jpg",
    tags: ["Spanish", "Vegetarian", "Gluten-free"],
    location: "Schanzenstr. 3, Sternschanze, Hamburg",
    time: "20:00",
    date: dayLabel(2),
    description: "A relaxed tapas evening — classic potato tortilla, marinated olives, pan con tomate and patatas bravas. Bring your appetite and we'll share the table.",
    hostBio: "Teacher from Seville, been in Hamburg 3 years. I host tapas nights to fight homesickness — turns out it works better when strangers come too.",
  },
  {
    id: "6",
    title: "Indian Dal & Roti",
    host: "Priya N.",
    hostAvatar: "app/img/1494790108377-160x160.jpg",
    rating: 4.9,
    reviews: 27,
    price: 3,
    seats: 4,
    serviceType: "pickup",
    image: "app/img/1546833998-800x533.jpg",
    tags: ["Indian", "Vegan", "Vegetarian", "Gluten-free", "Nut-free"],
    location: "Münchener Str. 9, Bahnhofsviertel, Frankfurt",
    time: "18:30",
    date: dayLabel(3),
    description: "Slow-cooked yellow dal tadka with cumin, turmeric and fresh coriander, served with soft whole-wheat roti. Comfort food at its finest — my grandmother's recipe.",
    hostBio: "Nurse, mum of two, originally from Pune. Dal and roti is the meal I make when someone needs comfort — I've been told it works every time.",
  },
  {
    id: "7",
    title: "Salmon Poke Bowl & Miso",
    host: "Yuki T.",
    hostAvatar: "app/img/1534528741775-160x160.jpg",
    rating: 4.8,
    reviews: 11,
    price: 4,
    seats: 2,
    serviceType: "pickup",
    image: "app/img/1546069901-800x533.jpg",
    tags: ["Japanese", "Dairy-free", "Pescatarian"],
    location: "Große Bergstr. 88, Altona, Hamburg",
    time: "12:30",
    date: dayLabel(1),
    description: "Marinated salmon, sushi rice, edamame, cucumber and avocado with a sesame-ponzu dressing, plus a cup of warm miso soup. A light, fresh Japanese-style lunch.",
    hostBio: "PhD student in biochemistry, from Osaka. Poke bowls are my lunch ritual — I prep for the whole floor and the neighbours have noticed.",
  },
  {
    id: "8",
    title: "Lebanese Mezze Spread",
    host: "Layla H.",
    hostAvatar: "app/img/1438761681033-160x160.jpg",
    rating: 5.0,
    reviews: 9,
    price: 5,
    seats: 6,
    serviceType: "cook-together",
    image: "app/img/1541014741259-800x533.jpg",
    tags: ["Lebanese", "Vegetarian", "Vegan", "Halal", "Gluten-free"],
    location: "Karl-Liebknecht-Str. 14, Südvorstadt, Leipzig",
    time: "17:00",
    date: dayLabel(3),
    description: "We'll cook together and build a full mezze table — hummus, baba ganoush, tabbouleh, falafel and warm flatbreads. No experience needed, just enthusiasm!",
    hostBio: "Interior designer from Beirut, living in Leipzig. Food for me is never solo — the mezze tradition is about gathering. I want to bring that here.",
    ingredients: ["Chickpeas", "Aubergines", "Fresh parsley", "Bulgur wheat", "Falafel mix", "Tahini", "Flatbread dough"],
  },
  {
    id: "9",
    title: "Risotto alla Milanese",
    host: "Giulia R.",
    hostAvatar: "app/img/1488426862026-160x160.jpg",
    rating: 4.9,
    reviews: 27,
    price: 6,
    seats: 4,
    serviceType: "eat-together",
    image: "app/img/1476124369491-800x533.jpg",
    tags: ["Italian", "Vegetarian", "Gluten-free"],
    location: "Leopoldstr. 21, Schwabing, Munich",
    time: "19:30",
    date: dayLabel(0),
    description: "Saffron risotto stirred the slow way, finished with butter and aged parmigiano. A small table, a glass of something nice and good conversation.",
    hostBio: "Milanese in Munich for six years. Risotto is my comfort food — and it's always better shared.",
  },
  {
    id: "10",
    title: "Sunday Brunch: French Toast & Berries",
    host: "Jonas W.",
    hostAvatar: "app/img/1539571696357-160x160.jpg",
    rating: 4.8,
    reviews: 19,
    price: 5,
    seats: 6,
    serviceType: "eat-together",
    image: "app/img/1484723091739-800x533.jpg",
    tags: ["Vegetarian", "Breakfast"],
    location: "Karl-Heine-Str. 47, Plagwitz, Leipzig",
    time: "09:30",
    date: dayLabel(4),
    description: "Brioche French toast, fresh berries, maple syrup and proper filter coffee. Slow Sunday morning at a long table on our balcony.",
    hostBio: "Student in Leipzig and brunch evangelist. My flatmates and I host a table every Sunday.",
  },
  {
    id: "11",
    title: "Homemade Gyoza Workshop",
    host: "Aiko N.",
    hostAvatar: "app/img/1580489944761-160x160.jpg",
    rating: 5.0,
    reviews: 14,
    price: 7,
    seats: 6,
    serviceType: "cook-together",
    image: "app/img/1496116218417-800x533.jpg",
    tags: ["Japanese", "Dairy-free"],
    location: "Oeder Weg 64, Nordend, Frankfurt",
    time: "18:00",
    date: dayLabel(2),
    description: "We'll make the filling, fold gyoza together (it's easier than it looks!) and pan-fry them crispy. You'll take the technique — and leftovers — home.",
    hostBio: "From Osaka, working in Frankfurt's finance district. Folding gyoza with friends is my favourite way to unwind.",
    ingredients: ["Gyoza wrappers", "Pork & cabbage filling", "Vegetable filling", "Ginger & garlic", "Dipping sauce"],
  },
  {
    id: "12",
    title: "Vegan Buddha Bowl",
    host: "Lena F.",
    hostAvatar: "app/img/1517841905240-160x160.jpg",
    rating: 4.7,
    reviews: 22,
    price: 4,
    seats: 5,
    serviceType: "pickup",
    image: "app/img/1512621776951-800x533.jpg",
    tags: ["Vegan", "Vegetarian", "Gluten-free", "Nut-free"],
    location: "Weserstr. 120, Neukölln, Berlin",
    time: "12:30",
    date: dayLabel(0),
    description: "Roasted chickpeas, avocado, red cabbage, quinoa and a tahini-lemon dressing. A colourful lunch to pick up on your way back to the office.",
    hostBio: "Nutritionist and meal-prep enthusiast. I cook big batches anyway — happy to share.",
  },
  {
    id: "13",
    title: "Neapolitan Pizza Night",
    host: "Marco D.",
    hostAvatar: "app/img/1506794778202-160x160.jpg",
    rating: 4.9,
    reviews: 31,
    price: 6,
    seats: 6,
    serviceType: "cook-together",
    image: "app/img/1513104890138-800x533.jpg",
    tags: ["Italian", "Vegetarian"],
    location: "Severinstr. 32, Südstadt, Cologne",
    time: "19:00",
    date: dayLabel(5),
    description: "Stretch your own dough, top it your way and bake it in my pizza oven on the terrace. Dough has been resting for 48 hours.",
    hostBio: "Born in Naples. I built a pizza oven on my terrace and it would be a crime not to share it.",
    ingredients: ["48h pizza dough", "San Marzano tomatoes", "Fior di latte", "Fresh basil", "Olive oil"],
  },
  {
    id: "14",
    title: "Tagliatelle al Ragù",
    host: "Paola M.",
    hostAvatar: "app/img/1554151228-160x160.jpg",
    rating: 5.0,
    reviews: 44,
    price: 6,
    seats: 4,
    serviceType: "eat-together",
    image: "app/img/1551183053-800x533.jpg",
    tags: ["Italian"],
    location: "Saalburgstr. 15, Bornheim, Frankfurt",
    time: "19:00",
    date: dayLabel(3),
    description: "Hand-cut egg tagliatelle with a Bolognese ragù that simmers for four hours. Exactly like my nonna makes it on Sundays.",
    hostBio: "From Bologna. My kitchen smells like ragù every Thursday — come and eat it with us.",
  },
  {
    id: "15",
    title: "Dim Sum Sunday",
    host: "Wei L.",
    hostAvatar: "app/img/1547425260-160x160.jpg",
    rating: 4.8,
    reviews: 17,
    price: 7,
    seats: 5,
    serviceType: "cook-together",
    image: "app/img/1563245372-800x533.jpg",
    tags: ["Chinese", "Dairy-free"],
    location: "Ottenser Hauptstr. 9, Ottensen, Hamburg",
    time: "11:30",
    date: dayLabel(4),
    description: "Steam baskets of har gow and siu mai together, with jasmine tea. A Cantonese Sunday tradition, in my living room.",
    hostBio: "Grew up in Guangzhou eating dim sum every weekend. Missing it is why I started hosting.",
    ingredients: ["Prawns", "Pork mince", "Wheat starch wrappers", "Shiitake", "Bamboo steamers"],
  },
  {
    id: "16",
    title: "Raspberry Cream Cake",
    host: "Sophie H.",
    hostAvatar: "app/img/1531123897727-160x160.jpg",
    rating: 4.9,
    reviews: 25,
    price: 4,
    seats: 8,
    serviceType: "pickup",
    image: "app/img/1565958011703-800x533.jpg",
    tags: ["Vegetarian", "Dessert"],
    location: "Reichenbachstr. 16, Glockenbachviertel, Munich",
    time: "16:00",
    date: dayLabel(1),
    description: "Light sponge, mascarpone cream and fresh raspberries. A slice (or two) to pick up for the afternoon coffee.",
    hostBio: "Weekend baker. My oven is always on, and my office can't eat it all.",
  },
  {
    id: "17",
    title: "Shoyu Ramen Late Night",
    host: "Kenji S.",
    hostAvatar: "app/img/1527980965255-160x160.jpg",
    rating: 4.9,
    reviews: 36,
    price: 7,
    seats: 4,
    serviceType: "eat-together",
    image: "app/img/1569718212165-800x533.jpg",
    tags: ["Japanese", "Dairy-free"],
    location: "Kantstr. 61, Charlottenburg, Berlin",
    time: "20:45",
    date: dayLabel(2),
    description: "Twelve-hour chicken broth, soy tare, marinated eggs and springy noodles. A cosy late bowl after work.",
    hostBio: "Ramen nerd from Tokyo. I make broth on Sundays and invite the neighbours on Wednesdays.",
  },
  {
    id: "18",
    title: "Kerala Fish Curry",
    host: "Anjali R.",
    hostAvatar: "app/img/1524504388940-160x160.jpg",
    rating: 4.8,
    reviews: 12,
    price: 6,
    seats: 4,
    serviceType: "eat-together",
    image: "app/img/1574484284002-800x533.jpg",
    tags: ["Indian", "Pescatarian", "Gluten-free"],
    location: "Zülpicher Str. 3, Sülz, Cologne",
    time: "19:30",
    date: dayLabel(5),
    description: "Fish simmered in coconut milk, tamarind and curry leaves, with red rice. The flavour of my grandmother's kitchen in Kochi.",
    hostBio: "Engineer in Cologne, originally from Kerala. Cooking South Indian food keeps me close to home.",
  },
  {
    id: "19",
    title: "Steak Frites & Salad",
    host: "Thomas B.",
    hostAvatar: "app/img/1599566150163-160x160.jpg",
    rating: 4.7,
    reviews: 21,
    price: 8,
    seats: 4,
    serviceType: "eat-together",
    image: "app/img/1600891964092-800x533.jpg",
    tags: ["French", "Gluten-free"],
    location: "Gottschedstr. 50, Zentrum-West, Leipzig",
    time: "20:00",
    date: dayLabel(6),
    description: "Pan-seared steak, hand-cut fries twice-fried and a sharp green salad. Simple, generous, bistro-style.",
    hostBio: "I spent a year in Lyon and came back obsessed with bistro cooking. Bring a bottle of red.",
  },
  {
    id: "20",
    title: "Turkish Grill Platter",
    host: "Emre K.",
    hostAvatar: "app/img/1472099645785-160x160.jpg",
    rating: 4.9,
    reviews: 29,
    price: 7,
    seats: 6,
    serviceType: "eat-together",
    image: "app/img/1555939594-800x533.jpg",
    tags: ["Turkish", "Halal", "Gluten-free"],
    location: "Sonnenallee 88, Neukölln, Berlin",
    time: "19:00",
    date: dayLabel(6),
    description: "Adana kebab, chicken şiş and grilled vegetables from the balcony grill, with bulgur and ezme. A real family-style table.",
    hostBio: "Grill master of my family. In summer the whole street knows when I light the grill.",
  },
];

// Every demo meal shows how its price was set: most from the host's receipt, some from Bite's estimate
MEALS.forEach((m, i) => {
  const people = m.seats + 1;
  const total = Math.round((m.price * people - (0.2 + (i % 5) * 0.31)) * 100) / 100;
  m.costProof = { kind: i % 3 === 2 ? "estimate" : "receipt", total, people };
});

/** Same labels as dayLabel() for a yyyy-mm-dd date picked in a form */
export function labelForISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const offset = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (offset >= 0 && offset <= 6) return dayLabel(offset);
  return `${target.toLocaleDateString("en-GB", { weekday: "long" })}, ${target.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

/* ── Money ── */

/** Bite's service fee, paid by the guest on top of the contribution (the host keeps 100% of the cost share) */
export const SERVICE_FEE = 0.12;
const round2 = (n: number) => Math.round(n * 100) / 100;
export const feeFor = (contribution: number) => round2(contribution * SERVICE_FEE);
export const withFee = (contribution: number) => round2(contribution * (1 + SERVICE_FEE));
/** €6 or €6.72 */
/** Prices: "€6" / "€6.72" (German: "€6,72") */
/** €4 / €4.48 in English, 4 € / 4,48 € in German (non-breaking space, so the sign never wraps alone) */
export const euro = (n: number) => {
  const de = getLang() === "de";
  const v = Number.isInteger(n) ? String(n) : de ? n.toFixed(2).replace(".", ",") : n.toFixed(2);
  return de ? `${v}\u00a0€` : `€${v}`;
};

/* ── Search ── */

export const ANY_AREA = "All cities";
export const ANY_DAY = "Any day";
export const ANY_TIME = "Any time";

export const AREAS = [ANY_AREA, "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Leipzig"];
export const TIMES = [ANY_TIME, "Breakfast · before 10:00", "Lunch · 11:00–15:00", "Dinner · after 18:00", "Late · after 20:30"];
export const CUISINE_TAGS = ["Italian", "Japanese", "Indian", "Thai", "Turkish", "Chinese", "Korean", "Lebanese", "Vegan", "Breakfast"];

export interface SearchCriteria {
  service: ServiceType | "all";
  area: string;
  date: string;
  time: string;
  guests: number;
  cuisine: string | null;
  query: string;
  /** km around the place (0 = the whole city) — like Kleinanzeigen's "Umkreis" */
  radius: number;
  /** a postcode or "my location" to search around, instead of a city */
  origin: Place | null;
}

export const DEFAULT_CRITERIA: SearchCriteria = { service: "all", area: ANY_AREA, date: ANY_DAY, time: ANY_TIME, guests: 1, cuisine: null, query: "", radius: 0, origin: null };

/** The point the search measures from (a postcode / my location, or the chosen city's centre), if any */
export function searchCenter(c: SearchCriteria): [number, number] | null {
  if (c.origin) return [c.origin.lat, c.origin.lng];
  return c.area !== ANY_AREA ? CITIES[c.area] ?? null : null;
}
/** How far a meal is from the search point, in km (null when there is no point or we don't know where the meal is) */
export function mealDistance(meal: Meal, c: SearchCriteria): number | null {
  const centre = searchCenter(c);
  const at = coordsOf(meal.location);
  return centre && at ? distanceKm(centre, at) : null;
}
/** The radius actually used: a postcode or "my location" always has one (10 km unless chosen) */
export const effectiveRadius = (c: SearchCriteria) => (c.origin ? c.radius || 10 : c.radius);

function inTimeSlot(time: string, slot: string) {
  if (slot === ANY_TIME) return true;
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + (m || 0);
  if (slot.startsWith("Breakfast")) return t < 10 * 60;
  if (slot.startsWith("Lunch")) return t >= 11 * 60 && t <= 15 * 60;
  if (slot.startsWith("Dinner")) return t >= 18 * 60;
  if (slot.startsWith("Late")) return t >= 20 * 60 + 30;
  return true;
}

export function matchesCriteria(meal: Meal, c: SearchCriteria, seatsLeft: number) {
  if (c.service !== "all" && meal.serviceType !== c.service) return false;
  const r = effectiveRadius(c);
  if (r > 0) {
    const d = mealDistance(meal, c);
    if (d === null || d > r) return false;
  } else if (c.area !== ANY_AREA && !meal.location.toLowerCase().includes(c.area.toLowerCase())) return false;
  if (c.date !== ANY_DAY && meal.date !== c.date) return false;
  if (!inTimeSlot(meal.time, c.time)) return false;
  if (seatsLeft < c.guests) return false;
  if (c.cuisine && !meal.tags.some((t) => t.toLowerCase() === c.cuisine!.toLowerCase())) return false;
  const q = c.query.trim().toLowerCase();
  // Search both the original text and what is shown in the current language
  const fields = [meal.title, meal.host, meal.description, meal.location, ...meal.tags];
  if (q && ![...fields, ...fields.map((f) => t(f))].some((f) => f.toLowerCase().includes(q))) return false;
  return true;
}
