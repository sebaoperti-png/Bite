// Unit tests for the price rules and the receipt reader (src/app/costing.ts).
// Run: npm run test:costing   (bundles this file with esbuild and runs it in Node)
import { priceCap, suggestedPrice, exactShare, parseReceiptTotal, estimateGroceries, TOLERANCE, type CostSource } from "../src/app/costing";
import { MEALS } from "../src/app/data";

let pass = 0, fail = 0;
const check = (c: boolean, m: string) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

/* ── 1. the price rules, on every combination a host can pick ── */
const sources: CostSource[] = ["receipt", "declared", "estimate"];
let combos = 0;
for (let guests = 1; guests <= 12; guests++) {
  const people = guests + 1;
  for (let c = 1; c <= 50000; c += c < 2000 ? 1 : 37) { // €0.01 … €500
    const total = c / 100;
    for (const src of sources) {
      combos++;
      const cap = priceCap(total, people, src);
      const sug = suggestedPrice(total, people, src);
      const T = c;
      // never a profit: every guest at the cap together pay at most the groceries
      if (cap * 100 * guests > T) { check(false, `profit: €${total} ${guests} guests ${src} cap ${cap}`); continue; }
      // the cap is whole euros, ≥ 0, and never above the fair share + margin
      if (!Number.isInteger(cap) || cap < 0) { check(false, `cap not whole: ${cap}`); continue; }
      if (cap > Math.ceil((T * (1 + TOLERANCE[src])) / people / 100 - 1e-9)) { check(false, `cap above margin €${total} ${guests} ${src}`); continue; }
      // the suggestion is inside [1, cap], or 0 when the meal can only be free
      if (cap === 0 ? sug !== 0 : (sug < 1 || sug > cap)) { check(false, `suggestion ${sug} outside cap ${cap} (€${total}, ${guests})`); continue; }
      // the cap is as generous as the rules allow: one euro more would break one of them
      const next = cap + 1;
      const breaks = next * 100 * guests > T || next > Math.ceil((T * (1 + TOLERANCE[src])) / people / 100 - 1e-9);
      if (!breaks) { check(false, `cap too strict €${total} ${guests} ${src}: ${cap}`); continue; }
      pass++;
    }
  }
}
console.log(`price rules: ${combos} combinations checked`);
check(exactShare(42, 5) === 8.4 && exactShare(10, 3) === 3.33, "exact share to the cent");
check(priceCap(42, 5, "receipt") === 9 && suggestedPrice(42, 5, "receipt") === 8, "€42 for 5 people: €8.40 each, suggested €8, cap €9 (8.82 rounded up; 4 × €9 = €36 ≤ €42)");
check(priceCap(40, 10, "receipt") === 4, "€40 for 10 people: cap €4 (9 guests × €5 = €45 would be a profit)");
check(priceCap(4, 7, "estimate") === 0, "€4 for 7 people: too little, must be free");
check(priceCap(0, 4, "receipt") === 0 && suggestedPrice(0, 4, "receipt") === 0, "no groceries → free");

/* ── 2. every demo meal respects the rules ── */
for (const m of MEALS) {
  const p = m.costProof!;
  const cap = priceCap(p.total, p.people, p.kind);
  check(m.price <= cap && m.price * m.seats <= p.total + 1e-9, `demo "${m.title}": €${m.price} with cap €${cap} (groceries €${p.total}, ${p.people} people)`);
}

/* ── 3. the estimate ── */
for (const cuisine of ["Italian", "Japanese", "Unknown", ""]) for (const n of [2, 5, 13]) {
  const e = estimateGroceries({ cuisine, people: n, appetizers: true, dessert: true, drinks: true });
  const plain = estimateGroceries({ cuisine, people: n, appetizers: false, dessert: false, drinks: false });
  check(e.total > plain.total && plain.total > 0 && Math.abs(e.lines.reduce((a, l) => a + l.amount, 0) - e.total) < 1, `estimate ${cuisine || "none"} × ${n}: €${plain.total}…€${e.total}`);
}

/* ── 4. reading receipts ── */
const R: [string, string, number | null, boolean?][] = [
  ["REWE card", `REWE Markt GmbH\nHauptstr. 12\n73430 Aalen\nUID Nr.: DE812706034\n                    EUR\nSPAGHETTI          1,29 B\nTOMATEN PASSIERT   0,89 B\n2 Stk x 0,89\nTOMATEN PASSIERT   1,78 B\nPARMIGIANO        4,49 B\nBASILIKUM          1,99 B\nOLIVENOEL         6,99 B\nPFAND              0,25 A\nLEERGUT            0,75-\n------------------------\nSUMME     EUR     17,93\n========================\nGeg. EC-Cash  EUR 17,93\n\nSteuer  %   Netto  Steuer  Brutto\nA= 19,0%   -0,42  -0,08   -0,50\nB=  7,0%   17,22   1,21   18,43\nGesamtbetrag      16,80   1,13   17,93\n\n12.11.26  18:42  Bon-Nr.:4711\nMarkt:1234 Kasse:3\n`, 17.93, true],
  ["Lidl card", `LIDL\nLidl sagt Danke\nEUR\nMozzarella 0,79 x 2  1,58 A\nRucola  1,29 A\nBananen\n0,812 kg x 1,49 EUR/kg  1,21 A\nPasta Penne 0,99 A\nzu zahlen  5,07\nKartenzahlung  5,07\nGirocard\nMWST% MWST + Netto = Brutto\nA 7%  0,33  4,74  5,07\nSumme  0,33  4,74  5,07\n13.11.26 10:01 Filiale 0815`, 5.07, true],
  ["Aldi card", `ALDI SÜD\nHähnchenbrust 5,99 A\nReis 1,19 A\nKokosmilch 2x 1,09 2,18 A\nCurrypaste 1,89 A\nLimetten 0,99 A\nSumme  12,24\nKartenzahlung girocard  12,24\nMwSt-Satz MwSt Netto Umsatz\nA 7,00% 0,80 11,44 12,24\n`, 12.24, true],
  ["Edeka cash", `EDEKA Schmid\nMehl 0,79 B\nEier 10er 3,29 B\nMilch 1,19 B\nZucker 1,09 B\nButter 2,49 B\nSUMME EUR 8,85\nGegeben BAR EUR 10,00\nRückgeld BAR EUR 1,15\nMwSt 7% 0,58\n`, 8.85, true],
  ["cash only, no SUMME line", `NETTO\nBrot 1,99\nKäse 3,49\nGegeben Bar 10,00\nRückgeld 4,52\n`, 5.48, true],
  ["OCR noise", `KAUFLAND\nLachs 7,99 A\nZitrone O,59 A\nDill 1,29 A\nSUMME EUR 9,8 7\nEC-KARTE 9,87\n`, 9.87, true],
  ["subtotal before total", `PENNY\nWein 4,99 B\nKäse 2,99 A\nZwischensumme 7,98\nRabatt -1,00\nSUMME 6,98\nVISA 6,98\n`, 6.98, true],
  ["date and time are not money", `dm-drogerie markt\n12.11.26 14:32\nSumme EUR 3,45\n`, 3.45, false],
  ["nothing that names a total", `Some shop\nThing 2,00\nOther 3,00\nThank you\n`, null],
  ["empty / unreadable", `~~~ :: .. ;;\n`, null],
  ["German decimal with thousands", `Metro\nSUMME EUR 1.234,50\n`, null], // over €1000 for a home dinner: not trusted, typed by host
];
for (const [name, text, want, wantConfident] of R) {
  const r = parseReceiptTotal(text);
  check(r.total === want, `receipt "${name}": total ${r.total}, expected ${want}`);
  if (wantConfident !== undefined) check(r.confident === wantConfident, `receipt "${name}": confident ${r.confident}, expected ${wantConfident} (items sum ${r.itemsSum})`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
