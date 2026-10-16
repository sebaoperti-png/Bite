// How a host's contribution is set, BlaBlaCar-style: an equal share of the real grocery cost, with a cap.
//  - "receipt": the host scans the supermarket receipt (Kassenbon) and we read the total
//  - "estimate": no receipt, so we estimate the groceries from the menu and the number of people

import { t } from "../shared/i18n";

export type CostSource = "receipt" | "estimate";
export interface CostProof { kind: CostSource; total: number; people: number }

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

/** Equal share per person, rounded up to whole euros */
export const fairShare = (total: number, people: number) => Math.max(1, Math.ceil(total / Math.max(1, people)));

/**
 * The most a host may ask per guest: the fair share plus 10% for rounding and pantry basics.
 * With a receipt the cap is tighter (the cost is proven), with an estimate a bit looser.
 */
export const priceCap = (total: number, people: number, source: CostSource) =>
  Math.max(1, Math.ceil((total / Math.max(1, people)) * (source === "receipt" ? 1.05 : 1.15)));

/* ── Reading a German supermarket receipt ── */

const AMOUNT = /(\d{1,4}[.,]\d{2})(?!\d)/g;
const TOTAL_WORDS = /(summe|gesamt|total|zu\s*zahlen|zahlbetrag|betrag|endsumme|bar\b|ec[- ]?karte|kartenzahlung)/i;

/** Finds the paid total in OCR text. Prefers lines like "SUMME EUR 42,80", falls back to the largest amount. */
export function parseReceiptTotal(text: string): { total: number | null; items: number } {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const toNum = (s: string) => Number(s.replace(",", "."));
  let best: number | null = null;
  let items = 0;
  for (const line of lines) {
    const amounts = [...line.matchAll(AMOUNT)].map((m) => toNum(m[1]));
    if (!amounts.length) continue;
    if (TOTAL_WORDS.test(line)) {
      const v = Math.max(...amounts);
      if (best === null || (/summe|gesamt|total|zu\s*zahlen/i.test(line) && v >= best)) best = v;
    } else if (!/mwst|ust|netto|brutto|steuer|rückgeld|ruckgeld|gegeben|datum|uhr|\d{2}\.\d{2}\.\d{2,4}/i.test(line)) {
      items++;
    }
  }
  if (best === null) {
    const all = [...text.matchAll(AMOUNT)].map((m) => toNum(m[1])).filter((v) => v < 2000);
    best = all.length ? Math.max(...all) : null;
  }
  return { total: best, items };
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
