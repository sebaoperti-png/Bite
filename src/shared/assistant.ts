// "Ask Bite" — a small assistant that runs entirely in the browser (no API key, works offline).
// It answers common questions about Bite and finds demo meals that match what people ask for.
// The UI only calls `answer()`, so a real language model can be plugged in later behind the same function.
import { MEALS, AREAS, ANY_AREA, dayLabel, withFee, euro, type Meal } from "../app/data";
import { t } from "./i18n";

export interface AssistantReply {
  text: string;
  meals?: Meal[];
  chips?: string[];
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const FAQ: { test: (q: string) => boolean; reply: () => AssistantReply }[] = [
  {
    test: (q) => has(q, "safe", "sicher", "trust", "vertrau", "verif", "stranger", "fremd", "danger", "gefahr"),
    reply: () => ({
      text: t("Safety comes first. Every host is verified in 4 steps — ID check, a quick video call, a sample meal and references. Payments stay in the app (no cash), you can read reviews before booking, and one trust violation means immediate suspension."),
      chips: [t("How does cost sharing work?"), t("How do I become a host?")],
    }),
  },
  {
    test: (q) => has(q, "cost shar", "split", "how much", "price", "pay", "fee", "expensive", "cost", "preis", "kost", "teil", "zahl", "gebühr", "gebuhr", "wie viel", "teuer"),
    reply: () => ({
      text: t("Bite works like BlaBlaCar, but for dinner: the host shares what the groceries really cost. Everyone at the table — host included — pays an equal share, plus a 12% Bite service fee. Hosts can scan their supermarket receipt to show the real cost, and there's a price cap so nobody can make a profit. A typical plate is around €6."),
      chips: [t("Find me something cheap"), t("Is it safe?")],
    }),
  },
  {
    test: (q) => has(q, "host", "cook for", "become", "publish", "my own", "gastgeb", "selbst koch", "anbiet", "einstell"),
    reply: () => ({
      text: t("Hosting takes about 2 minutes: describe your dish (our assistant can write it for you), pick a date and how many seats, and scan your grocery receipt so guests see the real cost. Your guests chip in, so your own dinner gets cheaper too."),
      chips: [t("Open the hosting demo"), t("How does cost sharing work?")],
    }),
  },
  {
    test: (q) => has(q, "cancel", "refund", "storn", "absag", "erstatt", "zurück", "zuruck"),
    reply: () => ({ text: t("If a host cancels, you get a full refund automatically. If you cancel more than 24 hours before the meal, you're refunded in full too.") }),
  },
  {
    test: (q) => has(q, "allerg", "intoler", "unverträg", "unvertrag"),
    reply: () => ({
      text: t("Every meal lists its dietary info and allergens, you can filter by them, and you can message the host before booking. Tell me what to avoid — e.g. “gluten-free dinner” — and I'll look for meals."),
    }),
  },
  {
    test: (q) => has(q, "what is bite", "what's bite", "who are you", "was ist", "wer bist", "about bite", "how does bite", "how it work", "how does it work", "wie funktioniert"),
    reply: () => ({
      text: t("Bite connects you with home cooks in your neighbourhood. Pick up a meal, sit down at someone's table, or cook together — and split the cost of the groceries. Real food, real people, for less than takeaway."),
      chips: [t("Something warm and vegan"), t("Is it safe?"), t("How do I become a host?")],
    }),
  },
  {
    test: (q) => has(q, "where", "city", "cities", "launch", "available", "wo ", "stadt", "städte", "stadte", "verfügbar", "verfugbar"),
    reply: () => ({
      text: t("Bite is at an early stage — we're gathering feedback before launching. The demo shows meals in Berlin, Hamburg, Munich, Cologne, Frankfurt and Leipzig. Leave your email at the bottom of the page and we'll keep you posted."),
      chips: [t("Dinner in Berlin"), t("Lunch in Munich")],
    }),
  },
  {
    test: (q) => has(q, "hello", "hi ", "hey", "hallo", "ciao", "servus", "moin", "guten tag") || q.trim() === "hi",
    reply: () => ({
      text: t("Good evening! I'm your maître d' at Bite. Tell me what you feel like eating — or ask me anything about how Bite works."),
      chips: [t("Something warm and vegan"), t("Cheap dinner tonight"), t("Is it safe?")],
    }),
  },
];

/* ── Meal search ── */

const DIETS: Record<string, string[]> = {
  Vegan: ["vegan"],
  Vegetarian: ["vegetarian", "veggie", "vegetarisch", "no meat", "meatless", "ohne fleisch", "fleischlos"],
  "Gluten-free": ["gluten"],
  "Dairy-free": ["dairy", "lactose", "laktose", "milchfrei"],
  Halal: ["halal"],
  Pescatarian: ["fish", "pescatarian", "seafood", "fisch", "meeresfr"],
  "Nut-free": ["nut", "nuss"],
};
// Cuisine words in English and German (accents are stripped before matching)
const CUISINES: Record<string, string[]> = {
  thai: ["thai"], italian: ["italian", "italien"], korean: ["korean", "korea"], indian: ["indian", "indisch"],
  japanese: ["japanese", "japan"], lebanese: ["lebanese", "libanes"], moroccan: ["moroccan", "marokkan"],
  spanish: ["spanish", "spanisch"], chinese: ["chinese", "chinesisch"], turkish: ["turkish", "turkisch"],
  french: ["french", "franzosisch"], breakfast: ["breakfast", "fruhstuck"], dessert: ["dessert", "nachtisch", "kuchen"],
};
// German city names that differ from the English ones
const CITY_ALIASES: Record<string, string[]> = { Munich: ["munich", "munchen"], Cologne: ["cologne", "koln"] };
const WARM = ["curry", "ramen", "tagine", "dal", "soup", "stew", "risotto", "ragu", "ragù", "broth"];

export function findMeals(query: string, meals: Meal[] = MEALS): { meals: Meal[]; understood: string[] } {
  const q = norm(query);
  const understood: string[] = [];
  let pool = meals.slice();

  const city = AREAS.find((a) => a !== ANY_AREA && (CITY_ALIASES[a] ?? [norm(a)]).some((w) => q.includes(w)));
  if (city) { pool = pool.filter((m) => m.location.endsWith(city)); understood.push(t("in {city}", { city: t(city) })); }

  for (const [tag, words] of Object.entries(DIETS)) {
    if (words.some((w) => q.includes(w))) { pool = pool.filter((m) => m.tags.includes(tag)); understood.push(t(tag).toLowerCase()); }
  }

  const cuisine = Object.keys(CUISINES).find((c) => CUISINES[c].some((w) => q.includes(w)));
  if (cuisine) { pool = pool.filter((m) => m.tags.some((tag) => norm(tag) === cuisine) || norm(m.title).includes(cuisine)); understood.push(t(cuisine[0].toUpperCase() + cuisine.slice(1))); }

  if (has(q, "pick-up", "pickup", "pick up", "take away", "to go", "abholen", "mitnehmen")) { pool = pool.filter((m) => m.serviceType === "pickup"); understood.push(t("pick-up")); }
  else if (has(q, "cook together", "learn", "workshop", "class", "kochkurs", "zusammen kochen", "lernen")) { pool = pool.filter((m) => m.serviceType === "cook-together"); understood.push(t("cook together")); }

  if (has(q, "tonight", "today", "heute")) { const d = dayLabel(0); const today = pool.filter((m) => m.date === d); if (today.length) { pool = today; understood.push(t("today")); } }
  else if (has(q, "tomorrow", "morgen")) { pool = pool.filter((m) => m.date === dayLabel(1)); understood.push(t("tomorrow")); }

  const hour = (m: Meal) => Number(m.time.split(":")[0]);
  if (has(q, "breakfast", "brunch", "fruhstuck")) { pool = pool.filter((m) => hour(m) < 12); understood.push(t("brunch")); }
  else if (has(q, "lunch", "mittag")) { pool = pool.filter((m) => hour(m) >= 11 && hour(m) <= 15); understood.push(t("lunch")); }
  else if (has(q, "dinner", "abend", "evening", "tonight")) { pool = pool.filter((m) => hour(m) >= 17); understood.push(t("dinner")); }

  const cap = q.match(/(?:under|below|less than|max|unter|bis)\s*€?\s*(\d+)/);
  if (cap) { pool = pool.filter((m) => m.price <= Number(cap[1])); understood.push(t("under €{n}", { n: cap[1] })); }
  if (has(q, "cheap", "budget", "affordable", "gunstig", "billig", "preiswert")) { pool = pool.slice().sort((a, b) => a.price - b.price); understood.push(t("budget-friendly")); }

  if (has(q, "warm", "cosy", "cozy", "comfort", "cold", "hot", "spicy", "scharf", "kalt", "gemutlich")) {
    const warm = pool.filter((m) => WARM.some((w) => norm(m.title + " " + m.description).includes(w)));
    if (warm.length) { pool = warm; understood.push(t("warm & cosy")); }
  }

  if (!understood.length) {
    // Free words: match against titles, descriptions and tags
    const words = q.split(/\W+/).filter((w) => w.length > 3);
    const scored = meals
      .map((m) => ({ m, s: words.filter((w) => norm([m.title, m.description, ...m.tags].join(" ")).includes(w)).length }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return { meals: scored.slice(0, 3).map((x) => x.m), understood };
  }
  return { meals: pool.slice(0, 3), understood };
}

const looksLikeFood = (q: string) =>
  has(q, "eat", "food", "meal", "dinner", "lunch", "brunch", "breakfast", "hungry", "something", "find", "recommend", "suggest", "craving", "cheap", "vegan", "vegetarian", "tonight", "tomorrow",
    "essen", "hunger", "etwas", "abend", "mittag", "fruhstuck", "gunstig", "billig", "vegetarisch", "heute", "morgen", "empfehl", "such", "lust auf") ||
  Object.values(CUISINES).some((ws) => ws.some((w) => q.includes(w))) || AREAS.some((a) => a !== ANY_AREA && (CITY_ALIASES[a] ?? [norm(a)]).some((w) => q.includes(w)));

export function answer(input: string): AssistantReply {
  const q = norm(input) + " ";

  if (has(q, "open the hosting demo", "start hosting", "hosting-demo", "gastgeber-demo")) return { text: t("Great — click the button below to open the hosting demo in the app."), chips: [] };

  if (looksLikeFood(q) && !has(q, "sicher", "safe")) {
    const { meals, understood } = findMeals(input);
    if (meals.length) {
      const what = understood.length ? ` (${understood.join(", ")})` : "";
      const cheapest = Math.min(...meals.map((m) => withFee(m.price)));
      return {
        text: meals.length === 1
          ? t("Here is a meal that could fit{what}. Prices are per plate, from {price} including the Bite fee. Tap one to open it in the app.", { what, price: euro(cheapest) })
          : t("Here are {n} meals that could fit{what}. Prices are per plate, from {price} including the Bite fee. Tap one to open it in the app.", { n: meals.length, what, price: euro(cheapest) }),
        meals,
        chips: [t("Something else?"), t("How does cost sharing work?")],
      };
    }
    return {
      text: t("I couldn't find a demo meal that matches all of that. Try fewer filters — for example a city, a cuisine or “vegan”."),
      chips: [t("Dinner in Berlin"), t("Something warm and vegan"), t("Cheap lunch")],
    };
  }

  const faq = FAQ.find((f) => f.test(q));
  if (faq) return faq.reply();

  if (has(q, "something else", "etwas anderes")) return { text: t("Sure — tell me a city, a cuisine, a diet or a time of day. For example: “Italian dinner in Munich” or “vegan lunch tomorrow”.") };

  return {
    text: t("I'm still new on the job. I can find meals for you (try “vegan dinner in Berlin”) and answer questions about costs, safety, hosting or cancellations."),
    chips: [t("Something warm and vegan"), t("How does cost sharing work?"), t("Is it safe?")],
  };
}

/** First message in the chat (a function so it follows the current language) */
export const greeting = (): AssistantReply => ({
  text: t("Welcome to Bite! I'm your maître d'. Looking for a table tonight, or curious how Bite works?"),
  chips: [t("Something warm and vegan"), t("Cheap dinner in Berlin"), t("How does cost sharing work?"), t("Is it safe?")],
});
