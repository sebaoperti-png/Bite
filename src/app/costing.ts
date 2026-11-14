// How a host's contribution is set, BlaBlaCar-style: an equal share of the real grocery cost, with a cap.
//  - "receipt": the host scans the supermarket receipt (Kassenbon) and we read the total
//  - "declared": the host typed the total themselves (no scan, or changed what the scan found)
//  - "estimate": no receipt, so we estimate the groceries from the menu and the number of people

import { t } from "../shared/i18n";

export type CostSource = "receipt" | "declared" | "estimate";
export interface CostLine { item: string; price: number | null; amount?: string }
export interface CostProof { kind: CostSource; total: number; people: number; lines?: { item: string; price: number; amount?: string }[] }

/** the sum of a shopping list, to the cent (lines without a price count 0) */
export const linesTotal = (lines: CostLine[]) => Math.round(lines.reduce((n, l) => n + Math.round((l.price ?? 0) * 100), 0)) / 100;
/** what is wrong with a typed shopping list, or "" (the database checks the same: at least two named, priced items) */
export function listProblem(lines: CostLine[]): string {
  const used = lines.filter((l) => l.item.trim() || l.price);
  if (used.length < 2) return t("List at least two things you bought, each with its price");
  if (used.some((l) => l.item.trim().length < 2)) return t("Every item in the list needs a name");
  if (used.some((l) => !l.price || l.price <= 0)) return t("Every item in the list needs a price");
  if (used.some((l) => (l.price ?? 0) > 500)) return t("One item costs more than 500 €. Check the prices.");
  if (used.length > 40) return t("At most 40 items in the list");
  return "";
}
/** the host's ingredient list as the first rows of a shopping list (names only, the host adds the prices) */
export function linesFromIngredients(text: string): CostLine[] {
  const names = text.replace(/\(.*?\)/g, "").split(/[,;\n•·]+/).map((x) => x.replace(/^[-*\d.\s]+/, "").replace(/\s+/g, " ").trim())
    .filter((x) => x.length > 1 && x.length <= 60 && !/^(salt|salz|sale|pepper|pfeffer|pepe|water|wasser|acqua)$/i.test(x));
  return [...new Set(names)].slice(0, 20).map((item) => ({ item, price: null }));
}
/** an AI estimate is used only when it is not far from Bite's own estimate (40% to double); otherwise Bite's stands.
 *  It prices only what the recipe uses, so it is often below the rule of thumb, which counts whole portions. */
export const plausibleEstimate = (aiTotal: number, ruleTotal: number) => aiTotal >= ruleTotal * 0.4 && aiTotal <= ruleTotal * 2;

/** Typical cost of ingredients per portion in Germany, by cuisine (main dish only) */
const MAIN_PER_PORTION: Record<string, number> = {
  Italian: 3.6, Mexican: 3.4, Japanese: 4.8, Thai: 3.5, Indian: 3.0, French: 5.2, Mediterranean: 3.6, American: 4.6,
  Korean: 4.0, Lebanese: 3.2, Moroccan: 4.2, Greek: 3.6, Spanish: 3.8, Chinese: 3.6, Turkish: 4.4, Vietnamese: 3.7,
};

export interface EstimateInput {
  cuisine: string;
  people: number; // host + guests
  appetizers: boolean;
  dessert: boolean;
  drinks: boolean;
}

export function estimateGroceries(i: EstimateInput) {
  const main = MAIN_PER_PORTION[i.cuisine] ?? 3.8;
  const lines = [
    { label: i.cuisine ? t("Main dish ({cuisine})", { cuisine: t(i.cuisine) }) : t("Main dish"), perPortion: main },
    ...(i.appetizers ? [{ label: t("Starters"), perPortion: 1.2 }] : []),
    ...(i.dessert ? [{ label: t("Dessert"), perPortion: 1.0 }] : []),
    ...(i.drinks ? [{ label: t("Drinks"), perPortion: 1.5 }] : []),
    { label: t("Basics (oil, spices, bread)"), perPortion: 0.4 },
  ];
  const total = Math.round(lines.reduce((n, l) => n + l.perPortion * i.people, 0));
  return { total, lines: lines.map((l) => ({ ...l, amount: Math.round(l.perPortion * i.people * 100) / 100 })) };
}

/* ── The price rules ──
 * Everything is worked out in cents, so rounding can never let the guests pay more than the groceries cost.
 * people = host + guests (the host pays their own share too).
 *  1. fair share   = groceries ÷ people (exact, to the cent)
 *  2. price cap    = the fair share + a small margin for rounding (5% with a receipt, 15% with Bite's estimate),
 *                    in whole euros, and never so high that the guests together pay more than the groceries.
 *  3. suggested    = the fair share rounded to whole euros, never above the cap.
 * If the groceries are too little to ask even €1 per guest without a profit, the cap is 0: the meal must be free.
 * The same rules run in the database (migration 0006), so they can't be skipped. */

/** how far above the fair share a host may go: tighter with a receipt (proven), looser with an estimate */
export const TOLERANCE: Record<CostSource, number> = { receipt: 0.05, declared: 0.05, estimate: 0.15 };

const cents = (euros: number) => Math.round(euros * 100);

/** the exact fair share per person, in euros with cents */
export const exactShare = (total: number, people: number) => Math.round(cents(total) / Math.max(1, people)) / 100;

/** the most a host may ask per guest, in whole euros (0 = too little to split: make it free) */
export function priceCap(total: number, people: number, source: CostSource) {
  const T = cents(total);
  const p = Math.max(2, Math.round(people));
  const guests = p - 1;
  if (T <= 0) return 0;
  const withMargin = Math.ceil((T * (1 + TOLERANCE[source])) / p / 100 - 1e-9); // whole euros
  const noProfit = Math.floor(T / guests / 100 + 1e-9);                          // guests together ≤ groceries
  return Math.max(0, Math.min(withMargin, noProfit));
}

/** the price Bite suggests: the fair share in whole euros (at least €1), never above the cap */
export function suggestedPrice(total: number, people: number, source: CostSource) {
  const cap = priceCap(total, people, source);
  if (cap < 1) return 0;
  return Math.min(cap, Math.max(1, Math.round(exactShare(total, people))));
}

/** kept for older callers: the suggested price with a receipt */
export const fairShare = (total: number, people: number) => suggestedPrice(total, people, "receipt");

/** a grocery total that is far above what this menu usually costs (likely a typo or not the dinner's shopping) */
export const looksTooHigh = (total: number, estimateTotal: number) => estimateTotal > 0 && total > estimateTotal * 2.5;

/* ── Reading a German supermarket receipt ──
 * Works on the text Tesseract reads from a Kassenbon (Rewe, Edeka, Lidl, Aldi, Kaufland, Penny, Netto, dm…).
 * The rule is "better no number than a wrong one": if the total is not clearly there we return null and the host
 * types it (and guests then see "stated by the host", not "receipt-backed").
 *  1. a line that names the total: "SUMME", "zu zahlen", "Gesamt", "Total", "Endsumme", "Zahlbetrag"
 *     (never "Zwischensumme"/"Subtotal", never tax lines)
 *  2. otherwise the card payment ("EC-Karte", "girocard", "Kartenzahlung", "Visa"…), which equals the total
 *  3. otherwise cash: "Gegeben" minus "Rückgeld"
 * The items on the receipt are added up as a cross-check: `confident` is true when two independent signs agree. */

// an amount like 42,80 · 42.80 · 42, 80 · -0,50 · 0,50- (not part of a date like 12.11.26 or a time)
const AMOUNT = /(?<![\d.,:/])(-\s?)?(\d{1,4})\s?[.,]\s?(\d{2})(?![\d])(?![.,:/]\d)(\s?-(?!\d))?/g;
const TOTAL_LINE = /(?<!zwischen|sub|teil)(summe|zu\s*zahlen|gesamtbetrag|gesamt|endsumme|zahlbetrag|total)(?!\s*(netto|mwst|ust))/i;
const CARD_LINE = /(ec[\s-]?karte|ec[\s-]?cash|girocard|kartenzahlung|karte\b|visa|mastercard|maestro|v\s?pay|kreditkarte|debit|contactless|kontaktlos|apple\s?pay|google\s?pay)/i;
const GIVEN_LINE = /(gegeben|geg\.|bar\b|barzahlung)/i;
const CHANGE_LINE = /(r(ü|u|ue)ckgeld|zur(ü|u|ue)ck)/i;
const SUBTOTAL_LINE = /(zwischensumme|subtotal|teilsumme)/i;
const SKIP_LINE = /(mwst|ust\b|ust\.|netto|brutto|steuer|%|datum|uhr|kasse\b|bon[\s-]?nr|beleg|terminal|trace|tse|signatur|seriennr|st\.?nr|ust-?id|punkte|payback|coupon|rabattmarke|kundenkarte|zwischensumme|subtotal|anzahl\s+artikel)/i;

// on a line that names a payment, OCR sometimes reads the comma as a colon ("13:57")
const AMOUNT_LOOSE = /(?<![\d.,:/])(-\s?)?(\d{1,4})\s?[.,:]\s?(\d{2})(?![\d])(?![.,:/]\d)(\s?-(?!\d))?/g;

function amountsIn(line: string, loose = false) {
  if (loose && /(uhr|zeit|datum|time)/i.test(line)) loose = false;
  return [...line.matchAll(loose ? AMOUNT_LOOSE : AMOUNT)].map((m) => {
    const v = Number(`${m[2]}.${m[3]}`);
    return m[1] || m[4] ? -v : v;
  });
}

/** fixes the usual OCR slips inside numbers: O→0, l/I→1, S→5 next to digits, "€" glued to the amount */
function cleanOcr(text: string) {
  return text
    .replace(/(?<=\d[.,]?)[Oo](?=\d|\b)/g, "0").replace(/(?<=\d)[lI](?=[\d.,])/g, "1")
    .replace(/(?<=[\d.,])[Oo]/g, "0")
    .replace(/(?<![\w])[Oo](?=[.,]\d{2}(?!\d))/g, "0")
    .replace(/[€]/g, " ")
    .replace(/[ \t]+/g, " ");
}

export interface ReceiptRead { total: number | null; items: number; confident: boolean; itemsSum: number | null }

export function parseReceiptTotal(raw: string): ReceiptRead {
  const lines = cleanOcr(raw).split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const totals: number[] = [], cards: number[] = [], given: number[] = [], change: number[] = [], subtotals: number[] = [];
  let itemsSum = 0, items = 0, seenTotal = false;
  for (const line of lines) {
    const money = TOTAL_LINE.test(line) || SUBTOTAL_LINE.test(line) || CHANGE_LINE.test(line) || CARD_LINE.test(line) || GIVEN_LINE.test(line);
    const am = amountsIn(line, money);
    if (!am.length) { if (TOTAL_LINE.test(line) && !SUBTOTAL_LINE.test(line)) seenTotal = true; continue; }
    const last = Math.abs(am[am.length - 1]);
    if (SUBTOTAL_LINE.test(line)) { subtotals.push(last); continue; }
    if (TOTAL_LINE.test(line) && !/(mwst|ust|netto|steuer)/i.test(line)) { totals.push(last); seenTotal = true; continue; }
    if (CHANGE_LINE.test(line)) { change.push(last); continue; }
    if (CARD_LINE.test(line) && !SKIP_LINE.test(line)) { cards.push(last); continue; }
    if (GIVEN_LINE.test(line) && !SKIP_LINE.test(line)) { given.push(last); continue; }
    if (SKIP_LINE.test(line) || seenTotal) continue; // after the total come payment and tax lines, not items
    if (am.length === 1 && /(\bstk\b|\d\s*[x×*]\s*\d|[x×*]\s*\d|\/\s*kg|eur\s*\/|kg\b)/i.test(line)) continue; // "2 Stk x 1,29": a unit price, the item total is on its own line
    // an item line: its price is the last amount ("2 x 1,29  2,58" → 2,58); a refund like "Leergut 0,75-" counts negative
    const v = am[am.length - 1];
    if (Math.abs(v) < 500) { itemsSum += v; items++; }
  }
  const round = (v: number) => Math.round(v * 100) / 100;
  const sum = items ? round(itemsSum) : null;
  const plausible = (v: number) => v > 0 && v < 1000;
  const cash = given.length && change.length ? round(Math.max(...given) - Math.max(...change)) : null;

  // Every independent sign proposes a value; the value with the most support wins.
  // Priority on a tie: the total line, then the card payment, then cash, then the subtotal; the items alone never decide.
  type Vote = { v: number; from: string; rank: number };
  const votes: Vote[] = [
    ...[...new Set(totals)].map((v) => ({ v, from: "total", rank: 4 })),
    ...[...new Set(cards)].map((v) => ({ v, from: "card", rank: 3 })),
    ...(cash != null ? [{ v: cash, from: "cash", rank: 2 }] : []),
    ...[...new Set(subtotals)].map((v) => ({ v, from: "subtotal", rank: 1 })),
  ].filter((x) => plausible(x.v));
  const near = (a: number, b: number | null) => b != null && Math.abs(a - b) < 0.015;
  const support = (v: number) => new Set(votes.filter((x) => near(x.v, v)).map((x) => x.from)).size + (near(v, sum) ? 1 : 0);
  let total: number | null = null, best = 0, bestRank = 0;
  for (const x of votes) {
    if (x.from === "subtotal" && votes.some((y) => y.from !== "subtotal")) continue; // a subtotal only confirms, never decides alone
    const sc = support(x.v);
    if (sc > best || (sc === best && x.rank > bestRank)) { total = x.v; best = sc; bestRank = x.rank; }
  }
  // a subtotal alone (no total, card or cash line readable) is not enough to trust
  if (total != null && bestRank === 1 && best < 2) total = null;
  return { total, items, confident: total != null && best >= 2, itemsSum: sum };
}

/** Runs OCR on a receipt photo in the browser (Tesseract, German). Needs an internet connection the first time. */
export async function readReceipt(image: File | string, onProgress: (p: number) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("deu", 1, {
    logger: (m: { status: string; progress: number }) => { if (m.status === "recognizing text") onProgress(m.progress); },
  });
  try {
    const { data } = await worker.recognize(image);
    return { text: data.text, ...parseReceiptTotal(data.text) };
  } finally {
    await worker.terminate();
  }
}
