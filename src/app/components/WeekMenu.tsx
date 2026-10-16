// "Cooking this week" as a restaurant menu: a closed tri-fold menu that unfolds when it scrolls into view
// (or on click) and then "prints" its dishes line by line, grouped by day. Hovering a dish shows a polaroid.
import { useEffect, useRef, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { dayLabel, euro, type Meal } from "../data";
import { t, tMaybe, dateLabel } from "../../shared/i18n";

const dayIndex = (label: string) => { for (let i = 0; i < 30; i++) if (dayLabel(i) === label) return i; return 99; };

const SERVICE: Record<string, string> = { pickup: "Pick-up", "eat-together": "Eat Together", "cook-together": "Cook Together" };

export function WeekMenu({ meals, onSelectMeal, onSeeAll }: { meals: Meal[]; onSelectMeal: (m: Meal) => void; onSeeAll: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Unfolds by itself once you scroll to it
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { window.setTimeout(() => setOpen(true), 350); io.disconnect(); } }, { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sort by day and time, then split across the three panels of the menu
  const sorted = meals.slice().sort((a, b) => dayIndex(a.date) - dayIndex(b.date) || a.time.localeCompare(b.time));
  const per = Math.ceil(sorted.length / 3);
  const panels = [sorted.slice(0, per), sorted.slice(per, per * 2), sorted.slice(per * 2)];
  let row = 0; // running index for the "printing" delay

  return (
    <div ref={ref} className={`wm ${open ? "open" : ""}`}>
      <div className="wm-stage">
        <button className="wm-close" onClick={() => setOpen(false)}><X size={13} strokeWidth={2.8} /> {t("Close menu")}</button>
        {/* the closed cover sits on the middle panel */}
        <button className="wm-cover" onClick={() => setOpen(true)} aria-label={t("Open the menu")} disabled={open}>
          <span className="wm-cover-inner">
            <span className="wm-cover-top">BITE</span>
            <span className="wm-cover-rule" />
            <b>{t("Menu")}</b>
            <span className="wm-cover-sub">{t("Cooking this week")}</span>
            <span className="wm-cover-rule" />
            <span className="wm-cover-tap">{t("Tap to open")}</span>
          </span>
        </button>

        {panels.map((list, p) => {
          let lastDay = "";
          return (
            <div key={p} className={`wm-panel wm-p${p}`}>
              <div className="wm-paper">
                {p === 0 && <div className="wm-head"><span>BITE</span><b>{t("Menu of the week")}</b></div>}
                {p === 1 && <div className="wm-head"><span>{t("Home-cooked")}</span><b>{t("Neighbours' kitchens")}</b></div>}
                {p === 2 && <div className="wm-head"><span>{t("Prices per plate")}</span><b>{t("Split fairly")}</b></div>}
                {list.map((m) => {
                  const newDay = m.date !== lastDay;
                  lastDay = m.date;
                  const i = row++;
                  return (
                    <div key={m.id}>
                      {newDay && <div className="wm-day" style={{ ["--d" as string]: `${0.9 + i * 0.12}s` }}>{dateLabel(m.date).split(",")[0]}<i /></div>}
                      <button className="wm-dish" onClick={() => onSelectMeal(m)} style={{ ["--d" as string]: `${0.95 + i * 0.12}s` }}>
                        <span className="wm-line">
                          <b>{tMaybe(m.title)}</b>
                          <i />
                          <em>{euro(m.price)}</em>
                        </span>
                        <span className="wm-meta">{m.host} · {m.time} · {t(m.location.split(", ").pop() ?? "")} · {t(SERVICE[m.serviceType])}</span>
                        <img className="wm-pop" src={m.image} alt="" loading="lazy" />
                      </button>
                    </div>
                  );
                })}
                {p === 2 && (
                  <button className="wm-all" onClick={onSeeAll} style={{ ["--d" as string]: `${1 + meals.length * 0.12}s` }}>
                    {t("See the full menu")} <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
