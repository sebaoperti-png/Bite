// Writes a meal description for hosts from what they already filled in (runs in the browser, no API key).
// It recognises the dish from the meal name / title (tiramisu, ramen, lasagne…) and writes about that dish;
// if the dish is unknown it falls back to the cuisine. Three tones; the host can cycle through them and edit the result.
import type { ServiceType } from "./data";
import { getLang } from "../shared/i18n";

export type Tone = "cosy" | "story" | "short";
export const TONES: { id: Tone; label: string }[] = [
  { id: "cosy", label: "Warm & cosy" },
  { id: "story", label: "With a story" },
  { id: "short", label: "Short & sweet" },
];

interface Input {
  mealName: string;
  eventTitle: string;
  cuisine: string;
  serviceType: ServiceType;
  firstName: string;
}

type Kind = "dessert" | "baked" | "main" | "starter" | "brunch";

interface Dish {
  words: string[];
  touch: string; // what makes it good, written as a list of things
  kind: Kind;
  verb?: string; // how it's made ("baked", "rolled"…), default depends on kind
  place?: string; // where it comes from, used when no cuisine is picked
}

// Order matters: more specific dishes first (cheesecake before cake, pancakes before cake…)
const DISHES: Dish[] = [
  // Desserts
  { words: ["tiramisu"], kind: "dessert", place: "Italy", verb: "layered", touch: "espresso-soaked savoiardi, silky mascarpone cream and a generous dusting of cocoa" },
  { words: ["panna cotta"], kind: "dessert", place: "Italy", touch: "vanilla-scented cream, a gentle wobble and a bright berry coulis" },
  { words: ["cannoli"], kind: "dessert", place: "Sicily", touch: "crisp shells, sweet ricotta and a little candied orange" },
  { words: ["cheesecake"], kind: "dessert", verb: "baked", touch: "a buttery biscuit base, a rich, creamy filling and fresh fruit on top" },
  { words: ["pancake", "crepe", "crêpe", "pfannkuchen", "waffle"], kind: "brunch", touch: "a light batter, a hot pan and plenty of toppings to choose from" },
  { words: ["brownie"], kind: "dessert", verb: "baked", touch: "dark chocolate, a crackly top and a gooey middle" },
  { words: ["cupcake", "muffin"], kind: "baked", touch: "real butter, a soft crumb and a little too much frosting" },
  { words: ["strudel"], kind: "dessert", place: "Austria", verb: "baked", touch: "paper-thin pastry, cinnamon apples and a spoon of vanilla sauce" },
  { words: ["baklava"], kind: "dessert", place: "Turkey", verb: "baked", touch: "layers of flaky filo, crushed pistachios and honey syrup" },
  { words: ["churro"], kind: "dessert", place: "Spain", verb: "fried", touch: "crisp, cinnamon-sugar dough and a cup of thick hot chocolate for dipping" },
  { words: ["mochi"], kind: "dessert", place: "Japan", touch: "soft, chewy rice dough and sweet fillings" },
  { words: ["mousse"], kind: "dessert", touch: "good chocolate, airy cream and a light hand" },
  { words: ["gelato", "ice cream", "sorbet", "eis"], kind: "dessert", verb: "churned", touch: "real fruit, fresh cream and no shortcuts" },
  { words: ["crumble", "cobbler"], kind: "dessert", verb: "baked", touch: "seasonal fruit, a buttery crumble topping and a scoop of something cold" },
  { words: ["tart", "pie", "tarte"], kind: "dessert", verb: "baked", touch: "crisp homemade pastry and a filling that changes with the season" },
  { words: ["torte", "kuchen", "cake"], kind: "baked", touch: "real butter, free-range eggs and a soft, tender crumb" },
  { words: ["cookie", "biscuit", "kekse"], kind: "baked", touch: "brown butter, chunks of chocolate and soft, chewy middles" },
  { words: ["pudding", "dessert", "sweet", "chocolate", "schoko"], kind: "dessert", touch: "good chocolate, fresh cream and a sweet tooth's attention to detail" },

  // Breads & bakes
  { words: ["focaccia"], kind: "baked", place: "Italy", touch: "a slow overnight dough, plenty of olive oil and flaky sea salt" },
  { words: ["pizza"], kind: "main", place: "Italy", verb: "baked", touch: "a slow-proved dough, San Marzano tomatoes and the hottest oven I can manage" },
  { words: ["bread", "brot", "sourdough", "bagel", "pretzel", "brezel"], kind: "baked", touch: "a slow-fermented dough, a crackly crust and a soft, open crumb" },
  { words: ["empanada"], kind: "main", place: "Argentina", verb: "baked", touch: "flaky pastry and a well-spiced, juicy filling" },

  // Pasta, rice & noodles
  { words: ["lasagna", "lasagne"], kind: "main", place: "Italy", verb: "baked", touch: "a slow-cooked ragù, silky béchamel and fresh pasta sheets" },
  { words: ["carbonara"], kind: "main", place: "Rome", touch: "crispy guanciale, egg yolks, Pecorino and lots of black pepper — no cream" },
  { words: ["gnocchi"], kind: "main", place: "Italy", touch: "soft potato gnocchi rolled by hand and a simple, buttery sauce" },
  { words: ["ravioli", "tortellini", "agnolotti"], kind: "main", place: "Italy", verb: "made", touch: "fresh egg pasta, folded by hand, and a generous filling" },
  { words: ["ragu", "ragù", "bolognese"], kind: "main", place: "Bologna", touch: "a ragù simmered for hours, red wine and fresh pasta" },
  { words: ["pesto"], kind: "main", place: "Liguria", touch: "basil pounded with pine nuts, garlic, Parmigiano and good olive oil" },
  { words: ["pasta", "spaghetti", "tagliatelle", "penne", "linguine", "pappardelle", "orecchiette"], kind: "main", place: "Italy", touch: "pasta cooked perfectly al dente and a sauce made from scratch" },
  { words: ["risotto"], kind: "main", place: "Italy", touch: "Carnaroli rice, a homemade stock and a lot of patient stirring" },
  { words: ["paella"], kind: "main", place: "Spain", touch: "saffron rice, a crispy socarrat at the bottom and one big pan in the middle of the table" },
  { words: ["biryani"], kind: "main", place: "India", verb: "layered", touch: "fragrant basmati, saffron and slow-cooked, spiced meat or vegetables" },
  { words: ["ramen"], kind: "main", place: "Japan", touch: "a broth simmered for hours, springy noodles and a soft, jammy egg" },
  { words: ["pho", "phở"], kind: "main", place: "Vietnam", touch: "a clear, fragrant broth with star anise, rice noodles and a big plate of fresh herbs" },
  { words: ["pad thai"], kind: "main", place: "Thailand", verb: "wok-fried", touch: "rice noodles, tamarind, crunchy peanuts and a squeeze of lime" },
  { words: ["noodle", "nudel", "udon", "soba", "lo mein", "chow mein"], kind: "main", touch: "springy noodles, a hot wok and a sauce made from scratch" },
  { words: ["fried rice"], kind: "main", verb: "wok-fried", touch: "day-old rice, a screaming-hot wok and lots of spring onion" },
  { words: ["bibimbap"], kind: "main", place: "Korea", touch: "warm rice, colourful vegetables, a fried egg and a spoon of gochujang" },
  { words: ["poke", "bowl", "buddha"], kind: "main", touch: "fresh, colourful toppings, a zingy dressing and plenty of crunch" },

  // Asian classics
  { words: ["sushi", "maki", "nigiri"], kind: "main", place: "Japan", verb: "rolled", touch: "perfectly seasoned rice, very fresh fish and vegetables, and a lot of care in the details" },
  { words: ["dumpling", "gyoza", "momo", "jiaozi", "dim sum", "bao", "pierogi", "maultaschen", "knödel", "knodel"], kind: "main", verb: "made", touch: "thin wrappers folded by hand, juicy fillings and a punchy dipping sauce" },
  { words: ["curry", "masala", "korma", "vindaloo"], kind: "main", verb: "slow-cooked", touch: "freshly toasted spices, a rich, fragrant sauce and fluffy rice" },
  { words: ["dal", "dhal", "daal"], kind: "main", place: "India", verb: "slow-cooked", touch: "creamy lentils, a sizzling spiced tadka and warm flatbread" },
  { words: ["kimchi", "bulgogi"], kind: "main", place: "Korea", touch: "gochujang, sesame and lots of little side dishes" },
  { words: ["spring roll", "summer roll"], kind: "starter", verb: "rolled", touch: "crunchy vegetables, fresh herbs and a sweet-sour dip" },

  // Stews, soups & slow cooking
  { words: ["tagine"], kind: "main", place: "Morocco", verb: "slow-cooked", touch: "warm spices, preserved lemon, dried fruit and fluffy couscous" },
  { words: ["couscous"], kind: "main", place: "North Africa", touch: "fluffy couscous, roasted vegetables and warm spices" },
  { words: ["goulash", "gulasch", "stew", "eintopf", "chili", "chilli", "ragout"], kind: "main", verb: "slow-cooked", touch: "tender meat or vegetables, a deep, rich sauce and plenty of bread to mop it up" },
  { words: ["soup", "suppe", "broth", "minestrone", "gazpacho"], kind: "main", touch: "a homemade stock, seasonal vegetables and warm bread on the side" },

  // Mains
  { words: ["schnitzel"], kind: "main", place: "Austria", verb: "fried", touch: "a crisp, golden crust, a squeeze of lemon and potato salad on the side" },
  { words: ["spätzle", "spaetzle", "kasespatzle"], kind: "main", place: "Swabia", touch: "fresh egg noodles, melted mountain cheese and crispy onions" },
  { words: ["roast", "braten", "sunday"], kind: "main", verb: "slow-roasted", touch: "a slow roast, crispy potatoes and a proper gravy" },
  { words: ["steak"], kind: "main", touch: "a good cut, a hot pan, butter and thyme" },
  { words: ["burger"], kind: "main", verb: "grilled", touch: "juicy patties, brioche buns and a homemade secret sauce" },
  { words: ["bbq", "barbecue", "grill", "ribs", "pulled pork"], kind: "main", verb: "smoked", touch: "low-and-slow cooking, a sticky glaze and all the sides" },
  { words: ["taco", "burrito", "enchilada", "quesadilla", "fajita"], kind: "main", place: "Mexico", touch: "warm tortillas, a proper homemade salsa, fresh lime and coriander" },
  { words: ["kebab", "kebap", "döner", "doner", "souvlaki", "gyros", "shawarma"], kind: "main", verb: "grilled", touch: "marinated, charred meat or vegetables, warm flatbread and a garlicky yoghurt sauce" },
  { words: ["moussaka"], kind: "main", place: "Greece", verb: "baked", touch: "layers of aubergine, a spiced tomato sauce and a golden béchamel" },
  { words: ["falafel", "hummus", "mezze", "meze"], kind: "starter", touch: "creamy hummus, crispy falafel, warm pita and lots of little plates to share" },
  { words: ["tapas"], kind: "starter", place: "Spain", touch: "lots of small plates, smoked paprika and olive oil, made for sharing" },
  { words: ["salmon", "lachs", "fish", "fisch", "seafood", "prawn", "shrimp", "mussel", "cod"], kind: "main", touch: "very fresh fish, lemon, herbs and simple, careful cooking" },
  { words: ["chicken", "hähnchen", "hahnchen"], kind: "main", touch: "juicy chicken, a golden crust and plenty of herbs" },
  { words: ["shakshuka", "brunch", "breakfast", "frühstück", "fruhstuck", "eggs"], kind: "brunch", touch: "eggs cooked just right, fresh bread, good coffee and no rush" },
  { words: ["salad", "salat"], kind: "starter", verb: "tossed", touch: "crunchy seasonal vegetables, a zingy homemade dressing and toasted seeds" },
];

const CUISINE_WORDS: Record<string, { place: string; touch: string }> = {
  Italian: { place: "Italy", touch: "good olive oil, fresh herbs and recipes from an Italian home kitchen" },
  Mexican: { place: "Mexico", touch: "fresh lime, coriander and a proper homemade salsa" },
  Japanese: { place: "Japan", touch: "clean flavours, umami and a lot of care in the details" },
  Thai: { place: "Thailand", touch: "lemongrass, chilli and fresh herbs" },
  Indian: { place: "India", touch: "freshly toasted spices and slow-cooked depth" },
  French: { place: "France", touch: "butter, wine and classic bistro technique" },
  Mediterranean: { place: "the Mediterranean", touch: "sun-ripened vegetables, lemon and olive oil" },
  American: { place: "the US", touch: "big comfort flavours and generous portions" },
  Korean: { place: "Korea", touch: "gochujang, sesame and lots of little side dishes" },
  Lebanese: { place: "Lebanon", touch: "tahini, sumac and a table full of mezze" },
  Moroccan: { place: "Morocco", touch: "warm spices, dried fruit and slow-cooked tenderness" },
  Greek: { place: "Greece", touch: "oregano, feta and lemon" },
  Spanish: { place: "Spain", touch: "smoked paprika, olive oil and dishes made for sharing" },
  Chinese: { place: "China", touch: "ginger, garlic, soy and a hot wok" },
  Turkish: { place: "Turkey", touch: "charcoal, yoghurt and fresh flatbread" },
  Vietnamese: { place: "Vietnam", touch: "fresh herbs, lime and bright, fragrant flavours" },
};

const norm = (s: string) => s.toLowerCase();

/** Finds the dish the host is making, from the meal name first, then the event title. */
export function detectDish(mealName: string, eventTitle: string): Dish | null {
  for (const text of [mealName, eventTitle]) {
    const t = norm(text);
    if (!t.trim()) continue;
    // Short words must start a word ("dal", "pie"); longer ones may sit inside German compounds ("Apfelkuchen")
    const hit = DISHES.find((d) => d.words.some((w) => new RegExp(`${w.length <= 4 ? "(^|[^a-zà-ÿ])" : ""}${w}(e?s)?(?![a-zà-ÿ])`, "i").test(t)));
    if (hit) return hit;
  }
  return null;
}

const KIND_NOUN: Record<Kind, string> = { dessert: "dessert", baked: "bake", main: "dish", starter: "spread", brunch: "brunch" };
const KIND_VERB: Record<Kind, string> = { dessert: "made", baked: "baked", main: "cooked", starter: "made", brunch: "made" };

export function writeDescription(f: Input, tone: Tone): string {
  const dish = f.mealName.trim() || f.eventTitle.trim() || "a home-cooked dinner";
  const found = detectDish(f.mealName, f.eventTitle);
  const cuisine = CUISINE_WORDS[f.cuisine];
  const kind: Kind = found?.kind ?? "main";
  const sweet = kind === "dessert" || kind === "baked";
  const touch = found?.touch ?? cuisine?.touch ?? "fresh ingredients and a lot of love";
  const place = cuisine?.place ?? found?.place ?? null;
  const verb = found?.verb ?? KIND_VERB[kind];
  const noun = KIND_NOUN[kind];
  const name = f.firstName.trim();
  if (getLang() === "de") return writeGerman(f, tone, found, kind, touch, place, verb);
  const what = sweet ? "something sweet" : "good food";

  // The sentences that change with the format: sit at my table, pick up, or cook together
  const s = {
    "eat-together": {
      open: `Pull up a chair at my table for ${dish}`,
      split: `It's a small, relaxed table where everyone splits the cost of the groceries, so it's ${what} without the restaurant bill.`,
      vibe: "Small table, relaxed vibe.",
      share: "Pull up a chair and let's share the stories that go with it.",
      invite: sweet ? "Bring a sweet tooth, leave with new neighbours." : "Come hungry, leave with new neighbours.",
    },
    pickup: {
      open: `${dish}, ready to pick up ${sweet ? "fresh" : "warm"} on your way home`,
      split: `You only chip in for the groceries, so it's ${what} for less than takeaway.`,
      vibe: `Ready to pick up ${sweet ? "fresh" : "warm"} on your way home.`,
      share: "Pick up a portion and tell me how you liked it.",
      invite: sweet ? "Boxed with care — perfect for sharing (or not)." : "Packed with care, ready when you are.",
    },
    "cook-together": {
      open: `Let's make ${dish} together`,
      split: "We're a small group and split the cost of the groceries, so you learn a new recipe for the price of a home dinner.",
      vibe: "We cook it together in a small, relaxed group.",
      share: "Come and cook it with me, and I'll share all the little tricks.",
      invite: "No experience needed — you'll go home with the recipe (and leftovers).",
    },
  }[f.serviceType];

  if (tone === "short") {
    return `${dish}, ${verb} from scratch with ${touch}. ${s.vibe} ${s.invite}`;
  }
  if (tone === "story") {
    const opener = place
      ? `This is the ${noun} I make when I miss ${place}: ${dish}.`
      : `${dish} is the ${noun} my friends always ask me to make.`;
    return `${opener} ${name ? `I'm ${name}. ` : ""}I learned it at home and still make it the slow way — ${touch}. ${s.share} ${s.invite}`;
  }
  return `${s.open} — ${verb} from scratch in my kitchen with ${touch}. ${s.split} ${s.invite}`;
}

/* ── German ── */

// The same phrases in German (always readable after "mit …")
const TOUCH_DE: Record<string, string> = {
  "espresso-soaked savoiardi, silky mascarpone cream and a generous dusting of cocoa": "in Espresso getränkten Löffelbiskuits, seidiger Mascarpone-Creme und reichlich Kakao",
  "vanilla-scented cream, a gentle wobble and a bright berry coulis": "Vanillesahne, zartem Wackeln und einem fruchtigen Beerenspiegel",
  "crisp shells, sweet ricotta and a little candied orange": "knusprigen Röllchen, süßem Ricotta und etwas kandierter Orange",
  "a buttery biscuit base, a rich, creamy filling and fresh fruit on top": "einem buttrigen Keksboden, einer cremigen Füllung und frischem Obst obendrauf",
  "a light batter, a hot pan and plenty of toppings to choose from": "einem lockeren Teig, einer heißen Pfanne und vielen Toppings zur Auswahl",
  "dark chocolate, a crackly top and a gooey middle": "dunkler Schokolade, knuspriger Kruste und saftigem Kern",
  "real butter, a soft crumb and a little too much frosting": "echter Butter, lockerem Teig und ein bisschen zu viel Frosting",
  "paper-thin pastry, cinnamon apples and a spoon of vanilla sauce": "hauchdünnem Teig, Zimtäpfeln und einem Löffel Vanillesoße",
  "layers of flaky filo, crushed pistachios and honey syrup": "Schichten aus Filoteig, gehackten Pistazien und Honigsirup",
  "crisp, cinnamon-sugar dough and a cup of thick hot chocolate for dipping": "knusprigem Zimtzucker-Teig und einer Tasse dicker heißer Schokolade zum Dippen",
  "soft, chewy rice dough and sweet fillings": "weichem Reisteig und süßen Füllungen",
  "good chocolate, airy cream and a light hand": "guter Schokolade, luftiger Sahne und viel Gefühl",
  "real fruit, fresh cream and no shortcuts": "echten Früchten, frischer Sahne und ohne Abkürzungen",
  "seasonal fruit, a buttery crumble topping and a scoop of something cold": "saisonalem Obst, buttrigen Streuseln und einer Kugel Eis",
  "crisp homemade pastry and a filling that changes with the season": "knusprigem hausgemachtem Teig und einer Füllung, die mit der Saison wechselt",
  "real butter, free-range eggs and a soft, tender crumb": "echter Butter, Freilandeiern und einem saftigen, lockeren Teig",
  "brown butter, chunks of chocolate and soft, chewy middles": "brauner Butter, Schokostückchen und weichem Kern",
  "good chocolate, fresh cream and a sweet tooth's attention to detail": "guter Schokolade, frischer Sahne und viel Liebe zum Detail",
  "a slow overnight dough, plenty of olive oil and flaky sea salt": "einem über Nacht gereiften Teig, viel Olivenöl und Meersalzflocken",
  "a slow-proved dough, San Marzano tomatoes and the hottest oven I can manage": "lange gereiftem Teig, San-Marzano-Tomaten und dem heißesten Ofen, den ich hinbekomme",
  "a slow-fermented dough, a crackly crust and a soft, open crumb": "lange fermentiertem Teig, knuspriger Kruste und luftiger Krume",
  "flaky pastry and a well-spiced, juicy filling": "blättrigem Teig und einer würzigen, saftigen Füllung",
  "a slow-cooked ragù, silky béchamel and fresh pasta sheets": "einem langsam geschmorten Ragù, seidiger Béchamel und frischen Nudelplatten",
  "crispy guanciale, egg yolks, Pecorino and lots of black pepper — no cream": "knusprigem Guanciale, Eigelb, Pecorino und viel schwarzem Pfeffer – ohne Sahne",
  "soft potato gnocchi rolled by hand and a simple, buttery sauce": "handgerollten Kartoffel-Gnocchi und einer einfachen Buttersoße",
  "fresh egg pasta, folded by hand, and a generous filling": "frischem Eiernudelteig, von Hand gefaltet, und einer großzügigen Füllung",
  "a ragù simmered for hours, red wine and fresh pasta": "einem stundenlang geschmorten Ragù, Rotwein und frischer Pasta",
  "basil pounded with pine nuts, garlic, Parmigiano and good olive oil": "im Mörser zerstoßenem Basilikum, Pinienkernen, Knoblauch, Parmigiano und gutem Olivenöl",
  "pasta cooked perfectly al dente and a sauce made from scratch": "perfekt al dente gekochter Pasta und einer selbstgemachten Soße",
  "Carnaroli rice, a homemade stock and a lot of patient stirring": "Carnaroli-Reis, selbstgemachter Brühe und viel geduldigem Rühren",
  "saffron rice, a crispy socarrat at the bottom and one big pan in the middle of the table": "Safranreis, knusprigem Socarrat am Boden und einer großen Pfanne mitten auf dem Tisch",
  "fragrant basmati, saffron and slow-cooked, spiced meat or vegetables": "duftendem Basmati, Safran und langsam gegartem, gewürztem Fleisch oder Gemüse",
  "a broth simmered for hours, springy noodles and a soft, jammy egg": "einer stundenlang gekochten Brühe, bissfesten Nudeln und einem wachsweichen Ei",
  "a clear, fragrant broth with star anise, rice noodles and a big plate of fresh herbs": "klarer, duftender Brühe mit Sternanis, Reisnudeln und einem großen Teller frischer Kräuter",
  "rice noodles, tamarind, crunchy peanuts and a squeeze of lime": "Reisnudeln, Tamarinde, knackigen Erdnüssen und einem Spritzer Limette",
  "springy noodles, a hot wok and a sauce made from scratch": "bissfesten Nudeln, einem heißen Wok und einer selbstgemachten Soße",
  "day-old rice, a screaming-hot wok and lots of spring onion": "Reis vom Vortag, einem glühend heißen Wok und viel Frühlingszwiebel",
  "warm rice, colourful vegetables, a fried egg and a spoon of gochujang": "warmem Reis, buntem Gemüse, einem Spiegelei und einem Löffel Gochujang",
  "fresh, colourful toppings, a zingy dressing and plenty of crunch": "frischen, bunten Toppings, einem spritzigen Dressing und viel Crunch",
  "perfectly seasoned rice, very fresh fish and vegetables, and a lot of care in the details": "perfekt gewürztem Reis, ganz frischem Fisch und Gemüse und viel Liebe zum Detail",
  "thin wrappers folded by hand, juicy fillings and a punchy dipping sauce": "dünnem, von Hand gefaltetem Teig, saftigen Füllungen und einem kräftigen Dip",
  "freshly toasted spices, a rich, fragrant sauce and fluffy rice": "frisch gerösteten Gewürzen, einer reichhaltigen, duftenden Soße und lockerem Reis",
  "creamy lentils, a sizzling spiced tadka and warm flatbread": "cremigen Linsen, einem brutzelnden Gewürz-Tadka und warmem Fladenbrot",
  "gochujang, sesame and lots of little side dishes": "Gochujang, Sesam und vielen kleinen Beilagen",
  "crunchy vegetables, fresh herbs and a sweet-sour dip": "knackigem Gemüse, frischen Kräutern und einem süß-sauren Dip",
  "warm spices, preserved lemon, dried fruit and fluffy couscous": "warmen Gewürzen, eingelegter Zitrone, Trockenfrüchten und lockerem Couscous",
  "fluffy couscous, roasted vegetables and warm spices": "lockerem Couscous, geröstetem Gemüse und warmen Gewürzen",
  "tender meat or vegetables, a deep, rich sauce and plenty of bread to mop it up": "zartem Fleisch oder Gemüse, einer kräftigen Soße und viel Brot zum Auftunken",
  "a homemade stock, seasonal vegetables and warm bread on the side": "selbstgemachter Brühe, saisonalem Gemüse und warmem Brot dazu",
  "a crisp, golden crust, a squeeze of lemon and potato salad on the side": "knuspriger, goldener Panade, einem Spritzer Zitrone und Kartoffelsalat dazu",
  "fresh egg noodles, melted mountain cheese and crispy onions": "frischen Eierspätzle, geschmolzenem Bergkäse und Röstzwiebeln",
  "a slow roast, crispy potatoes and a proper gravy": "einem langsam gegarten Braten, knusprigen Kartoffeln und richtiger Soße",
  "a good cut, a hot pan, butter and thyme": "einem guten Stück Fleisch, einer heißen Pfanne, Butter und Thymian",
  "juicy patties, brioche buns and a homemade secret sauce": "saftigen Patties, Brioche-Buns und einer hausgemachten Geheimsoße",
  "low-and-slow cooking, a sticky glaze and all the sides": "stundenlangem Garen bei niedriger Hitze, einer klebrigen Glasur und allen Beilagen",
  "warm tortillas, a proper homemade salsa, fresh lime and coriander": "warmen Tortillas, einer richtigen hausgemachten Salsa, frischer Limette und Koriander",
  "marinated, charred meat or vegetables, warm flatbread and a garlicky yoghurt sauce": "mariniertem, gegrilltem Fleisch oder Gemüse, warmem Fladenbrot und Knoblauch-Joghurtsoße",
  "layers of aubergine, a spiced tomato sauce and a golden béchamel": "Schichten aus Aubergine, würziger Tomatensoße und goldener Béchamel",
  "creamy hummus, crispy falafel, warm pita and lots of little plates to share": "cremigem Hummus, knuspriger Falafel, warmem Pita und vielen kleinen Tellern zum Teilen",
  "lots of small plates, smoked paprika and olive oil, made for sharing": "vielen kleinen Tellern, geräuchertem Paprika und Olivenöl – gemacht zum Teilen",
  "very fresh fish, lemon, herbs and simple, careful cooking": "ganz frischem Fisch, Zitrone, Kräutern und einfacher, sorgfältiger Zubereitung",
  "juicy chicken, a golden crust and plenty of herbs": "saftigem Hähnchen, goldener Kruste und vielen Kräutern",
  "eggs cooked just right, fresh bread, good coffee and no rush": "perfekt gegarten Eiern, frischem Brot, gutem Kaffee und ganz ohne Eile",
  "crunchy seasonal vegetables, a zingy homemade dressing and toasted seeds": "knackigem Saisongemüse, einem spritzigen hausgemachten Dressing und gerösteten Kernen",
  "good olive oil, fresh herbs and recipes from an Italian home kitchen": "gutem Olivenöl, frischen Kräutern und Rezepten aus einer italienischen Familienküche",
  "fresh lime, coriander and a proper homemade salsa": "frischer Limette, Koriander und einer richtigen hausgemachten Salsa",
  "clean flavours, umami and a lot of care in the details": "klaren Aromen, Umami und viel Liebe zum Detail",
  "lemongrass, chilli and fresh herbs": "Zitronengras, Chili und frischen Kräutern",
  "freshly toasted spices and slow-cooked depth": "frisch gerösteten Gewürzen und viel Geschmack durch langsames Garen",
  "butter, wine and classic bistro technique": "Butter, Wein und klassischer Bistro-Technik",
  "sun-ripened vegetables, lemon and olive oil": "sonnengereiftem Gemüse, Zitrone und Olivenöl",
  "big comfort flavours and generous portions": "herzhaftem Soulfood und großzügigen Portionen",
  "tahini, sumac and a table full of mezze": "Tahini, Sumach und einem Tisch voller Mezze",
  "warm spices, dried fruit and slow-cooked tenderness": "warmen Gewürzen, Trockenfrüchten und langsam geschmorter Zartheit",
  "oregano, feta and lemon": "Oregano, Feta und Zitrone",
  "smoked paprika, olive oil and dishes made for sharing": "geräuchertem Paprika, Olivenöl und Gerichten zum Teilen",
  "ginger, garlic, soy and a hot wok": "Ingwer, Knoblauch, Soja und einem heißen Wok",
  "charcoal, yoghurt and fresh flatbread": "Holzkohle, Joghurt und frischem Fladenbrot",
  "fresh herbs, lime and bright, fragrant flavours": "frischen Kräutern, Limette und hellen, duftenden Aromen",
  "fresh ingredients and a lot of love": "frischen Zutaten und viel Liebe",
};

// "wenn ich … vermisse" (accusative)
const PLACE_DE: Record<string, string> = {
  Argentina: "Argentinien", Austria: "Österreich", Bologna: "Bologna", China: "China", France: "Frankreich", Greece: "Griechenland",
  India: "Indien", Italy: "Italien", Japan: "Japan", Korea: "Korea", Lebanon: "den Libanon", Liguria: "Ligurien", Mexico: "Mexiko",
  Morocco: "Marokko", "North Africa": "Nordafrika", Rome: "Rom", Sicily: "Sizilien", Spain: "Spanien", Swabia: "Schwaben",
  Thailand: "Thailand", Turkey: "die Türkei", Vietnam: "Vietnam", "the Mediterranean": "das Mittelmeer", "the US": "die USA",
};

const VERB_DE: Record<string, string> = {
  baked: "gebacken", churned: "gerührt", fried: "frittiert", grilled: "gegrillt", layered: "geschichtet", made: "zubereitet",
  rolled: "gerollt", "slow-cooked": "langsam geschmort", "slow-roasted": "langsam gebraten", smoked: "geräuchert",
  tossed: "angemacht", "wok-fried": "im Wok gebraten", cooked: "gekocht",
};

// All neuter nouns, so "das …, das ich mache" always works
const NOUN_DE: Record<Kind, string> = { dessert: "Dessert", baked: "Gebäck", main: "Gericht", starter: "Gericht", brunch: "Frühstück" };

function writeGerman(f: Input, tone: Tone, found: Dish | null, kind: Kind, touchEn: string, placeEn: string | null, verbEn: string): string {
  const dish = f.mealName.trim() || f.eventTitle.trim() || "ein hausgemachtes Abendessen";
  const sweet = kind === "dessert" || kind === "baked";
  const touch = TOUCH_DE[touchEn] ?? touchEn;
  const place = placeEn ? PLACE_DE[placeEn] ?? placeEn : null;
  const verb = VERB_DE[verbEn] ?? "zubereitet";
  const name = f.firstName.trim();
  const what = sweet ? "etwas Süßes" : "gutes Essen";
  const s = {
    "eat-together": {
      open: `Setz dich an meinen Tisch: Es gibt ${dish}`,
      split: `Eine kleine, entspannte Runde, in der sich alle die Einkaufskosten teilen – ${what} ohne Restaurantrechnung.`,
      vibe: "Kleiner Tisch, entspannte Stimmung.",
      share: "Setz dich dazu und lass uns die Geschichten dahinter teilen.",
      invite: sweet ? "Bring Lust auf Süßes mit und geh mit neuen Nachbarn nach Hause." : "Komm hungrig und geh mit neuen Nachbarn nach Hause.",
    },
    pickup: {
      open: `${dish}, ${sweet ? "frisch" : "warm"} zum Abholen auf deinem Heimweg`,
      split: `Du beteiligst dich nur am Einkauf – ${what} für weniger als beim Lieferdienst.`,
      vibe: `${sweet ? "Frisch" : "Warm"} zum Abholen auf deinem Heimweg.`,
      share: "Hol dir eine Portion und sag mir, wie es dir geschmeckt hat.",
      invite: sweet ? "Liebevoll verpackt – perfekt zum Teilen (oder auch nicht)." : "Liebevoll verpackt und fertig, wenn du es bist.",
    },
    "cook-together": {
      open: `Lass uns ${dish} zusammen machen`,
      split: "Wir sind eine kleine Gruppe und teilen die Einkaufskosten – du lernst ein neues Rezept zum Preis eines Abendessens zu Hause.",
      vibe: "Wir kochen gemeinsam in einer kleinen, entspannten Runde.",
      share: "Koch mit mir und ich verrate dir alle kleinen Tricks.",
      invite: "Keine Erfahrung nötig – du gehst mit dem Rezept (und Resten) nach Hause.",
    },
  }[f.serviceType];
  void found;

  if (tone === "short") return `${dish}, frisch ${verb} mit ${touch}. ${s.vibe} ${s.invite}`;
  if (tone === "story") {
    const opener = place
      ? `Das ist das ${NOUN_DE[kind]}, das ich mache, wenn ich ${place} vermisse: ${dish}.`
      : `${dish} ist das ${NOUN_DE[kind]}, um das mich meine Freunde immer bitten.`;
    return `${opener} ${name ? `Ich bin ${name}. ` : ""}Ich habe es zu Hause gelernt und mache es noch immer mit Zeit und Liebe – mit ${touch}. ${s.share} ${s.invite}`;
  }
  return `${s.open} – frisch ${verb} in meiner Küche, mit ${touch}. ${s.split} ${s.invite}`;
}
