// "Cooking this week" as a restaurant menu: a closed tri-fold menu that unfolds when it scrolls into view
// (or on click) and then "prints" its dishes line by line. Each panel is one way to eat — Pick-up,
// Eat together, Cook together — with a line saying what it means, the dishes soonest first (day as a small
// tag), and a link to see all of that kind. The panel matching the service picked above is highlighted.
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronRight, X, ShoppingBag, Utensils, ChefHat } from "lucide-react";
import { dayLabel, euro, type Meal, type ServiceType } from "../data";
import { t, tMaybe, dateLabel } from "../../shared/i18n";

const dayIndex = (label: string) => { for (let i = 0; i < 30; i++) if (dayLabel(i) === label) return i; return 99; };
const PER_PANEL = 4;

const PANELS: { id: ServiceType; title: string; what: string; all: string; Icon: React.ElementType }[] = [
  { id: "pickup", title: "Pick-up", what: "Collect a home-cooked dish and eat it at home", all: "See all pick-ups", Icon: ShoppingBag },
  { id: "eat-together", title: "Eat together", what: "Pull up a chair at a neighbour's table", all: "See all tables", Icon: Utensils },
  { id: "cook-together", title: "Cook together", what: "Cook side by side, then eat what you made", all: "See all cooking evenings", Icon: ChefHat },
];

/** "Today" / "Tomorrow" stay words; other days become their short weekday ("Thu") */
const dayTag = (label: string) => {
  const i = dayIndex(label);
  if (i <= 1) return dateLabel(label).split(",")[0];
  return dateLabel(label).split(",")[0].slice(0, 3);
};

export function WeekMenu({ meals, active, onSelectMeal, onSeeService }: {
  meals: Meal[];
  active?: ServiceType;
  onSelectMeal: (m: Meal) => void;
  onSeeService: (s: ServiceType) => void;
}) {
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

        {PANELS.map(({ id, title, what, all, Icon }, p) => {
          const list = meals
            .filter((m) => m.serviceType === id)
            .sort((a, b) => dayIndex(a.date) - dayIndex(b.date) || a.time.localeCompare(b.time));
          const shown = list.slice(0, PER_PANEL);
          const headRow = row++;
          return (
            <div key={id} className={`wm-panel wm-p${p} ${active === id ? "is-active" : ""}`}>
              <div className="wm-paper">
                <div className="wm-head" style={{ ["--d" as string]: `${0.85 + headRow * 0.05}s` }}>
                  <span className="wm-head-icon"><Icon size={18} strokeWidth={2} /></span>
                  <b>{t(title)}</b>
                  <p>{t(what)}</p>
                </div>
                {shown.length === 0 && <p className="wm-none">{t("Nothing on this part of the menu yet this week.")}</p>}
                {shown.map((m) => {
                  const i = row++;
                  return (
                    <button key={m.id} className="wm-dish" onClick={() => onSelectMeal(m)} style={{ ["--d" as string]: `${0.95 + i * 0.08}s` }}>
                      <span className="wm-line">
                        <b>{tMaybe(m.title)}</b>
                        <i />
                        <em>{euro(m.price)}</em>
                      </span>
                      <span className="wm-meta">
                        <span className="wm-when">{dayTag(m.date)} {m.time}</span>
                        {m.host} · {t(m.location.split(", ").pop() ?? "")}
                      </span>
                      <img className="wm-pop" src={m.image} alt="" loading="lazy" />
                    </button>
                  );
                })}
                <button className="wm-all" onClick={() => onSeeService(id)} style={{ ["--d" as string]: `${1 + (headRow + PER_PANEL) * 0.08}s` }}>
                  {t(all)} {list.length > 0 && <span className="wm-count">{list.length}</span>} <ChevronRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Phones: the same menu as one card, with the three ways to eat as tabs (and a small photo per dish, since
    there is no hover to show it) */
export function MobileWeekMenu({ meals, active, onSelectMeal, onSeeService }: {
  meals: Meal[];
  active?: ServiceType;
  onSelectMeal: (m: Meal) => void;
  onSeeService: (s: ServiceType) => void;
}) {
  const [tab, setTab] = useState<ServiceType>(active ?? "eat-together");
  useEffect(() => { if (active) setTab(active); }, [active]);
  const panel = PANELS.find((p) => p.id === tab)!;
  const list = meals.filter((m) => m.serviceType === tab).sort((a, b) => dayIndex(a.date) - dayIndex(b.date) || a.time.localeCompare(b.time));

  return (
    <div className="mwm">
      <div className="mwm-head"><span>BITE</span><b>{t("Menu of the week")}</b></div>
      <div className="mwm-tabs" role="tablist">
        {PANELS.map(({ id, title, Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {tab === id && <motion.span layoutId="mwm-pill" className="mwm-pill" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
            <span><Icon size={14} strokeWidth={2.2} /> {t(title)}</span>
          </button>
        ))}
      </div>
      <p className="mwm-what">{t(panel.what)}</p>
      <div key={tab}>
        {list.length === 0 && <p className="wm-none">{t("Nothing on this part of the menu yet this week.")}</p>}
        {list.slice(0, PER_PANEL).map((m, i) => (
          <button key={m.id} className="mwm-dish" onClick={() => onSelectMeal(m)} style={{ ["--i" as string]: i }}>
            <img src={m.image} alt="" loading="lazy" />
            <span className="mwm-body">
              <span className="wm-line"><b>{tMaybe(m.title)}</b><i /><em>{euro(m.price)}</em></span>
              <span className="wm-meta"><span className="wm-when">{dayTag(m.date)} {m.time}</span>{m.host} · {t(m.location.split(", ").pop() ?? "")}</span>
            </span>
          </button>
        ))}
      </div>
      <button className="wm-all mwm-all" onClick={() => onSeeService(tab)}>
        {t(panel.all)} {list.length > 0 && <span className="wm-count">{list.length}</span>} <ChevronRight size={15} />
      </button>
    </div>
  );
}
