// "Before your dinner": the host's short checklist on their own listing. Ticks draw themselves (transitions.dev
// checkbox check, styles .tick-* in src/shared/motion.css); the state is kept per listing in this browser.
import { useEffect, useState } from "react";
import { type Meal } from "../data";
import { t } from "../../shared/i18n";

export function PrepChecklist({ meal }: { meal: Meal }) {
  const key = `bite_prep_${meal.id}`;
  const items = [
    { id: "groceries", label: t("Groceries bought — keep the receipt") },
    { id: "allergies", label: t("Allergies checked with your guests") },
    { id: "table", label: t("Table set for {n}", { n: meal.seats + 1 }) },
    { id: "address", label: t("Address sent to guests in the chat"), auto: true },
  ];
  const [done, setDone] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(done)); } catch { /* ignore */ } }, [key, done]);
  const count = items.filter((i) => i.auto || done.includes(i.id)).length;

  return (
    <section className="prep">
      <div className="prep-head">
        <b>{t("Before your dinner")}</b>
        <span>{count}/{items.length}</span>
      </div>
      <div className="prep-bar"><span style={{ width: `${(count / items.length) * 100}%` }} /></div>
      {items.map((it) => {
        const on = !!it.auto || done.includes(it.id);
        return (
          <label key={it.id} className={`prep-item ${on ? "on" : ""}`}>
            <input type="checkbox" className="tick-input" checked={on} disabled={it.auto} onChange={(e) => setDone((d) => (e.target.checked ? [...d, it.id] : d.filter((x) => x !== it.id)))} />
            <span className="tick-box" aria-hidden><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg></span>
            <span>{it.label}{it.auto && <em> · {t("automatic")}</em>}</span>
          </label>
        );
      })}
    </section>
  );
}
