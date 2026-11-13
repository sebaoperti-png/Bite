// The description writer: recognises dishes however they are typed, describes a menu by its main course, never
// promises meat to vegetarians or animal products to vegans, and uses the host's own ingredients once they exist.
// Run: npm run test:writer
import { writeDescription, detectDish, ingredientTouch } from "../src/app/descriptionWriter";
import { setLang } from "../src/shared/i18n";
let pass = 0, fail = 0;
const check = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };
const base = { eventTitle: "", cuisine: "", serviceType: "eat-together" as const, firstName: "Ana" };
const kind = (n: string) => detectDish(n, "")?.kind;

check(kind("Tiramisù") === "dessert", "accents: Tiramisù");
check(kind("Crème brûlée") === "dessert", "accents: Crème brûlée");
check(kind("Flammkuchen") === "main", "Flammkuchen is not a cake");
check(kind("Apfelkuchen") === "baked", "Apfelkuchen is a cake");
check(kind("Cheesecake") === "dessert" && kind("Pancakes") === "brunch", "specific before generic");
check(detectDish("Antipasto, lasagne e tiramisù", "")?.words[0] === "lasagna", "a menu is described by its main course");
check(kind("Kaiserschmarrn") === "dessert" && kind("Pastel de nata") === "dessert", "more desserts");
for (const n of ["Ceviche", "Jollof rice", "Borscht", "Rinderrouladen", "Parmigiana", "Ratatouille", "Peking duck", "Tteokbokki"]) check(!!detectDish(n, ""), `knows ${n}`);

const MEAT = /guanciale|ragù|beef|veal|chicken|fish|bacon|patties/i, ANIMAL = /egg|cheese|cream|butter|mascarpone|pecorino|feta|béchamel/i;
for (const tone of ["cosy", "story", "short"] as const) {
  check(!MEAT.test(writeDescription({ ...base, mealName: "Lasagne vegetariane" }, tone)), `vegetarian lasagne has no meat (${tone})`);
  const v = writeDescription({ ...base, mealName: "Carbonara", diet: ["vegan"] }, tone);
  check(!MEAT.test(v) && !ANIMAL.test(v), `vegan carbonara has no animal products (${tone})`);
  check(!ANIMAL.test(writeDescription({ ...base, mealName: "Greek salad", cuisine: "Greek", diet: ["vegan"] }, tone)), `vegan Greek has no feta (${tone})`);
}
const own = writeDescription({ ...base, mealName: "Lasagne", ingredients: "Pasta sheets, 500 g lentils, tomato passata, béchamel (oat milk, flour), salt" }, "cosy");
check(own.includes("pasta sheets, lentils, tomato passata and béchamel") && !/ragù/.test(own), "uses the host's own ingredients instead of invented ones");
check(ingredientTouch("salt, pepper") === "salt and pepper", "only basics: still lists them");
check(ingredientTouch("") === null && ingredientTouch(undefined) === null, "no list, no ingredients");
(globalThis as any).document ??= { documentElement: {} }; (globalThis as any).localStorage ??= { setItem() {}, getItem: () => null };
setLang("de");
const de = writeDescription({ ...base, mealName: "Lasagne", ingredients: "Nudelplatten, Linsen, Tomaten, Salz" }, "short");
check(de.includes("Nudelplatten, Linsen und Tomaten"), "German keeps the nouns and says 'und'");
check(!/[a-z]+ed from scratch/.test(writeDescription({ ...base, mealName: "Ceviche" }, "cosy")), "German text has no English phrases");
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
