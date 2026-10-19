// Survey answers on this device + an outbox that keeps re-sending until the Google Sheet has them.
// The stand tablet keeps working when the fair Wi-Fi drops.
import { FORMS_ENDPOINT, postForm } from "../shared/forms";

export interface SurveyEntry {
  id: string;
  at: string;
  source: string;
  device: "kiosk" | "phone";
  lang: string;
  answers: Record<string, string | string[]>;
  email?: string;
  updates?: boolean;
  interview?: boolean;
}

const ALL_KEY = "bite_stand_responses";
const OUTBOX_KEY = "bite_stand_outbox";

const read = (k: string): SurveyEntry[] => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const write = (k: string, v: SurveyEntry[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full */ } };

export const localResponses = () => read(ALL_KEY);
export const outboxSize = () => read(OUTBOX_KEY).length;

export function saveEntry(entry: SurveyEntry) {
  write(ALL_KEY, [...read(ALL_KEY), entry]);
  write(OUTBOX_KEY, [...read(OUTBOX_KEY), entry]);
  void flush();
}

let flushing = false;
/** Sends everything still waiting; returns how many are still unsent */
export async function flush(): Promise<number> {
  if (!FORMS_ENDPOINT || flushing) return outboxSize();
  flushing = true;
  try {
    for (const entry of read(OUTBOX_KEY)) {
      const ok = await postForm({ type: "survey", ...entry });
      if (!ok) break; // offline or server busy: try again later
      write(OUTBOX_KEY, read(OUTBOX_KEY).filter((e) => e.id !== entry.id));
    }
  } finally {
    flushing = false;
  }
  return outboxSize();
}

export function startAutoSync() {
  window.addEventListener("online", () => void flush());
  const t = window.setInterval(() => void flush(), 20_000);
  void flush();
  return () => window.clearInterval(t);
}

export function clearDevice() {
  write(ALL_KEY, []);
  write(OUTBOX_KEY, []);
}

export function toCsv(rows: SurveyEntry[]) {
  const cols = ["id", "at", "source", "device", "lang", "who", "age", "alone", "pains", "join", "host", "price", "worries", "email", "updates", "interview"];
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const a = r.answers;
    const val: Record<string, unknown> = {
      ...r, ...a,
      pains: ([] as string[]).concat(a.pains ?? []).join(", "),
      worries: ([] as string[]).concat(a.worries ?? []).join(", "),
      updates: r.updates ? "yes" : "",
      interview: r.interview ? "yes" : "",
    };
    return cols.map((c) => cell(val[c])).join(",");
  });
  return [cols.join(","), ...lines].join("\n");
}
