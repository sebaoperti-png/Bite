import { useState } from "react";
import {
  ChevronLeft, Star, SlidersHorizontal, Heart, MapPin, Search,
  ShoppingBag, Utensils, ChefHat, X, Check, Wheat, Fish,
  Milk, Egg, Nut, Leaf, FlameKindling, Sprout, ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ANY_AREA, ANY_DAY, ANY_TIME, DEFAULT_CRITERIA, matchesCriteria, euro, type Meal, type ServiceType, type SearchCriteria } from "../data";
import { BottomNav, SheetHeader } from "./HomeScreen";
import type { NavTab } from "./DesktopTopBar";
import { Sheet } from "./Sheet";
import { useIsDesktop } from "../useIsDesktop";
import { useStore } from "../store";
import { t, tMaybe, dateLabel, dec, getLang } from "../../shared/i18n";

const SVC = {
  pickup:          { label: "Pick-up",       color: "#c05e00", bg: "#fff4e5", Icon: ShoppingBag },
  "eat-together":  { label: "Eat Together",  color: "#6b21d9", bg: "#ede8fb", Icon: Utensils },
  "cook-together": { label: "Cook Together", color: "#0a7c4e", bg: "#e5f7f0", Icon: ChefHat },
} as const;

const SERVICE_FILTERS: { id: ServiceType | "all"; label: string }[] = [
  { id: "all",           label: "All" },
  { id: "pickup",        label: "Pick-up" },
  { id: "eat-together",  label: "Eat Together" },
  { id: "cook-together", label: "Cook Together" },
];

interface FilterOption {
  id: string;
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

const DIETARY_OPTIONS: FilterOption[] = [
  { id: "Vegetarian",  label: "Vegetarian",  Icon: Leaf,          color: "#16a34a", bg: "#dcfce7" },
  { id: "Vegan",       label: "Vegan",       Icon: Sprout,        color: "#15803d", bg: "#bbf7d0" },
  { id: "Halal",       label: "Halal",       Icon: FlameKindling, color: "#b45309", bg: "#fef3c7" },
];

const ALLERGEN_OPTIONS: FilterOption[] = [
  { id: "Gluten-free",    label: "Gluten-free",    Icon: Wheat, color: "#92400e", bg: "#fef3c7" },
  { id: "Dairy-free",     label: "Dairy-free",     Icon: Milk,  color: "#1e40af", bg: "#dbeafe" },
  { id: "Egg-free",       label: "Egg-free",       Icon: Egg,   color: "#b45309", bg: "#fef9c3" },
  { id: "Nut-free",       label: "Nut-free",       Icon: Nut,   color: "#7c3aed", bg: "#ede9fe" },
  { id: "Pescatarian",    label: "Pescatarian",    Icon: Fish,  color: "#0369a1", bg: "#e0f2fe" },
];

interface ListingsScreenProps {
  criteria: SearchCriteria;
  setCriteria: (fn: (c: SearchCriteria) => SearchCriteria) => void;
  onBack: () => void;
  onSelect: (m: Meal) => void;
  onNavigate: (tab: NavTab) => void;
}

export function ListingsScreen({ criteria, setCriteria, onBack, onSelect, onNavigate }: ListingsScreenProps) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const [showFilters, setShowFilters]   = useState(false);
  const [dietary, setDietary]           = useState<Set<string>>(new Set());
  const [allergens, setAllergens]       = useState<Set<string>>(new Set());
  const [sort, setSort]                 = useState<"default" | "price" | "rating">("default");

  const set = (patch: Partial<SearchCriteria>) => setCriteria((c) => ({ ...c, ...patch }));
  const toggleSet = (s: Set<string>, id: string): Set<string> => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  };

  const activeFilterCount = dietary.size + allergens.size;

  const filtered = store.meals
    .filter((m) => matchesCriteria(m, criteria, store.seatsLeft(m)))
    .filter((m) => [...dietary, ...allergens].every((f) => m.tags.includes(f)))
    .slice()
    .sort((a, b) => sort === "price" ? a.price - b.price : sort === "rating" ? b.rating - a.rating : 0);

  // Search criteria coming from Home, shown as removable chips
  const criteriaChips: { label: string; clear: () => void }[] = [
    criteria.cuisine && { label: t(criteria.cuisine), clear: () => set({ cuisine: null }) },
    criteria.area !== ANY_AREA && { label: t(criteria.area), clear: () => set({ area: ANY_AREA }) },
    criteria.date !== ANY_DAY && { label: dateLabel(criteria.date), clear: () => set({ date: ANY_DAY }) },
    criteria.time !== ANY_TIME && { label: t(criteria.time).split(" · ")[0], clear: () => set({ time: ANY_TIME }) },
    criteria.guests > 1 && { label: t("{n}+ seats", { n: criteria.guests }), clear: () => set({ guests: 1 }) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearFilters = () => { setDietary(new Set()); setAllergens(new Set()); };
  const clearEverything = () => { clearFilters(); setCriteria(() => DEFAULT_CRITERIA); };
  const sortLabel = sort === "price" ? t("Price") : sort === "rating" ? t("Rating") : t("Sort");
  const cycleSort = () => setSort((s) => s === "default" ? "price" : s === "price" ? "rating" : "default");

  const searchBox = (
    <div className="flex items-center gap-2 px-3.5 rounded-2xl" style={{ background: isDesktop ? "#fff" : "#f5f4f9", border: "1.5px solid rgba(107,33,217,0.12)", height: isDesktop ? 46 : 40 }}>
      <Search size={16} color="#7c6fa0" />
      <input
        value={criteria.query}
        onChange={(e) => set({ query: e.target.value })}
        placeholder={t("Search dishes, cooks, neighbourhoods…")}
        aria-label={t("Search meals")}
        className="flex-1 bg-transparent outline-none min-w-0"
        style={{ fontSize: isDesktop ? 14.5 : 13.5, color: "#160a2e" }}
      />
      {criteria.query && (
        <button onClick={() => set({ query: "" })} aria-label={t("Clear search")} className="p-1"><X size={14} color="#7c6fa0" /></button>
      )}
    </div>
  );

  const chips = (criteriaChips.length > 0 || activeFilterCount > 0) && (
    <div className="flex gap-1.5 flex-wrap">
      {criteriaChips.map((c) => (
        <button key={c.label} onClick={c.clear} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "#ede8fb", fontSize: 12, fontWeight: 700, color: "#6b21d9" }}>
          {c.label} <X size={11} strokeWidth={3} />
        </button>
      ))}
      {[...dietary, ...allergens].map((id) => {
        const opt = [...DIETARY_OPTIONS, ...ALLERGEN_OPTIONS].find((o) => o.id === id)!;
        return (
          <button key={id} onClick={() => { setDietary((p) => { const n = new Set(p); n.delete(id); return n; }); setAllergens((p) => { const n = new Set(p); n.delete(id); return n; }); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: opt.bg, fontSize: 12, fontWeight: 700, color: opt.color }}>
            <opt.Icon size={11} strokeWidth={2.5} /> {t(opt.label)} <X size={11} strokeWidth={3} />
          </button>
        );
      })}
      <button onClick={clearEverything} className="px-2.5 py-1 rounded-full" style={{ background: "#fff", border: "1px solid rgba(107,33,217,0.15)", fontSize: 12, fontWeight: 700, color: "#7c6fa0" }}>{t("Clear all")}</button>
    </div>
  );

  const empty = (
    <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-3xl" style={{ background: isDesktop ? "#fff" : "transparent" }}>
      <Utensils size={36} color="#c4b8de" strokeWidth={1.2} />
      <p style={{ color: "#7c6fa0", fontWeight: 600, fontSize: 14.5, textAlign: "center" }}>{t("No meals match your search")}</p>
      <button onClick={clearEverything} className="px-4 py-2 rounded-full" style={{ background: "#ede8fb", fontSize: 13, color: "#6b21d9", fontWeight: 700 }}>{t("Show all meals")}</button>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="h-full overflow-y-auto" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
        <div className="mx-auto w-full max-w-[1240px] px-8 pt-8 pb-16 grid gap-8 grid-cols-[260px_1fr] items-start">
          <aside className="sticky top-6 rounded-3xl p-5" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>
            <div className="flex items-center justify-between">
              <p style={{ fontSize: 17, fontWeight: 800, color: "#160a2e" }}>{t("Filters")}</p>
              {activeFilterCount > 0 && <button onClick={clearFilters} style={{ fontSize: 13, color: "#e9345a", fontWeight: 700 }}>{t("Clear (")}{activeFilterCount})</button>}
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 20 }}>{t("Way to eat")}</p>
            <div className="flex flex-col gap-1 mt-2.5">
              {SERVICE_FILTERS.map((f) => {
                const on = criteria.service === f.id;
                return (
                  <button key={f.id} onClick={() => set({ service: f.id })} className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors hover:bg-[#f5f0ff]" style={{ background: on ? "#ede8fb" : undefined }}>
                    <span style={{ fontSize: 14, fontWeight: on ? 800 : 600, color: on ? "#6b21d9" : "#160a2e" }}>{t(f.label)}</span>
                    {on && <Check size={15} color="#6b21d9" strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
            <FilterSection title={t("Dietary")} options={DIETARY_OPTIONS} selected={dietary} onToggle={(id) => setDietary((p) => toggleSet(p, id))} columns={1} />
            <FilterSection title={t("Allergen-free")} subtitle={t("Only show meals free from")} options={ALLERGEN_OPTIONS} selected={allergens} onToggle={(id) => setAllergens((p) => toggleSet(p, id))} columns={1} />
          </aside>

          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p style={{ fontSize: 14, color: "#7c6fa0", fontWeight: 600 }}>{t("{area} · this week", { area: t(criteria.area) })}</p>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: "#160a2e", letterSpacing: "-0.02em" }}>
                  {filtered.length === 1 ? t("1 meal available") : t("{n} meals available", { n: filtered.length })}</h1>
              </div>
              <button onClick={cycleSort} className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-shrink-0" style={{ background: sort !== "default" ? "#ede8fb" : "#fff", border: "1.5px solid rgba(107,33,217,0.12)" }}>
                <ArrowUpDown size={15} color="#6b21d9" strokeWidth={2} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#6b21d9" }}>{sort === "default" ? t("Sort: recommended") : t("Sort: {by}", { by: getLang() === "de" ? sortLabel : sortLabel.toLowerCase() })}</span>
              </button>
            </div>
            {searchBox}
            {chips}
            {filtered.length === 0 ? empty : (
              <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {filtered.map((meal, i) => (
                  <motion.div key={meal.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }}>
                    <MealCard meal={meal} onSelect={onSelect} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ height: "max(env(safe-area-inset-top), 14px)", flexShrink: 0, background: "#fff" }} />

      {/* Header */}
      <div className="px-4 pt-2 pb-3 flex flex-col gap-2.5" style={{ background: "#ffffff" }}>
        <div className="flex items-center gap-3">
          <motion.button onClick={onBack} aria-label={t("Back")} className="p-2 rounded-xl" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.88 }}>
            <ChevronLeft size={18} color="#6b21d9" strokeWidth={2.5} />
          </motion.button>
          <div className="flex-1">
            <p style={{ fontSize: 11, color: "#7c6fa0", fontWeight: 500 }}>{t("{area} · this week", { area: t(criteria.area) })}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#160a2e" }}>{filtered.length === 1 ? t("1 meal available") : t("{n} meals available", { n: filtered.length })}</p>
          </div>
          <div className="flex gap-2">
            <motion.button className="p-2 rounded-xl flex items-center gap-1.5" style={{ background: sort !== "default" ? "#ede8fb" : "#f0ecfa", paddingInline: 10 }} whileTap={{ scale: 0.88 }} onClick={cycleSort}>
              <ArrowUpDown size={14} color="#6b21d9" strokeWidth={2} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#6b21d9" }}>{sortLabel}</span>
            </motion.button>
            <motion.button className="relative p-2 rounded-xl" style={{ background: activeFilterCount > 0 ? "#6b21d9" : "#f0ecfa" }} whileTap={{ scale: 0.88 }} onClick={() => setShowFilters(true)} aria-label={t("Filters")}>
              <SlidersHorizontal size={17} color={activeFilterCount > 0 ? "#fff" : "#6b21d9"} strokeWidth={1.8} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#e9345a", fontSize: 9, color: "#fff", fontWeight: 800 }}>{activeFilterCount}</span>
              )}
            </motion.button>
          </div>
        </div>
        {searchBox}
      </div>

      {/* Service type chips */}
      <div className="px-4 py-2.5 flex gap-2 overflow-x-auto flex-shrink-0" style={{ background: "#ffffff", borderBottom: "1px solid rgba(107,33,217,0.08)", scrollbarWidth: "none" }}>
        {SERVICE_FILTERS.map((f) => (
          <motion.button key={f.id} onClick={() => set({ service: f.id })} className="relative flex-shrink-0 px-4 py-1.5 rounded-full overflow-hidden" whileTap={{ scale: 0.92 }} style={{ border: criteria.service === f.id ? "none" : "1.5px solid rgba(107,33,217,0.15)" }}>
            {criteria.service === f.id && <motion.div layoutId="filter-bg" className="absolute inset-0" style={{ background: "#6b21d9" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
            <span className="relative z-10" style={{ fontSize: 12, fontWeight: 700, color: criteria.service === f.id ? "#fff" : "#6b21d9" }}>{t(f.label)}</span>
          </motion.button>
        ))}
      </div>

      {chips && <div className="px-4 pt-3">{chips}</div>}

      {/* Meal list */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence>
          {filtered.map((meal, i) => (
            <motion.div key={meal.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(i, 6) * 0.05, type: "spring", stiffness: 280, damping: 26 }} className="mb-3">
              <MealCard meal={meal} onSelect={onSelect} />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && empty}
        <div style={{ height: 12 }} />
      </div>

      <BottomNav active="browse" unread={store.unreadTotal} onNavigate={onNavigate} />

      <Sheet open={showFilters} onClose={() => setShowFilters(false)} mobileMaxHeight="82%">
        <SheetHeader title={activeFilterCount ? t("Filters · {n} active", { n: activeFilterCount }) : t("Filters")} onClose={() => setShowFilters(false)} />
        <div className="overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none", maxHeight: "58vh" }}>
          <FilterSection title={t("Dietary")} options={DIETARY_OPTIONS} selected={dietary} onToggle={(id) => setDietary((p) => toggleSet(p, id))} />
          <FilterSection title={t("Allergen-free")} subtitle={t("Only show meals free from")} options={ALLERGEN_OPTIONS} selected={allergens} onToggle={(id) => setAllergens((p) => toggleSet(p, id))} />
        </div>
        <div className="px-5 pt-3 flex gap-2" style={{ borderTop: "1px solid rgba(107,33,217,0.08)", paddingBottom: "max(env(safe-area-inset-bottom), 20px)" }}>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="px-4 rounded-2xl" style={{ background: "#f0ecfa", fontSize: 14, fontWeight: 700, color: "#e9345a" }}>{t("Clear")}</button>
          )}
          <motion.button onClick={() => setShowFilters(false)} className="flex-1 py-3.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }} whileTap={{ scale: 0.97 }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{filtered.length === 1 ? t("Show 1 meal") : t("Show {n} meals", { n: filtered.length })}</span>
          </motion.button>
        </div>
      </Sheet>
    </div>
  );
}

function FilterSection({ title, subtitle, options, selected, onToggle, columns = 2 }: {
  title: string;
  subtitle?: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <div className="mt-5">
      <p style={{ fontSize: 13, fontWeight: 800, color: "#160a2e", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</p>
      {subtitle && <p style={{ fontSize: 11.5, color: "#7c6fa0", marginTop: 2 }}>{subtitle}</p>}
      <div className={`grid ${columns === 1 ? "grid-cols-1" : "grid-cols-2"} gap-2 mt-3`}>
        {options.map(({ id, label, Icon, color, bg }) => {
          const active = selected.has(id);
          return (
            <motion.button key={id} onClick={() => onToggle(id)} aria-pressed={active} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl" style={{ background: active ? bg : "#f5f4f9", border: active ? `1.5px solid ${color}44` : "1.5px solid rgba(107,33,217,0.1)" }} whileTap={{ scale: 0.95 }}>
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: active ? color : "#ede8fb" }}>
                <Icon size={13} color={active ? "#fff" : "#6b21d9"} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? color : "#160a2e", flex: 1, textAlign: "left" }}>{t(label)}</span>
              {active && <Check size={14} color={color} strokeWidth={3} />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function MealCard({ meal, onSelect, compact = false }: {
  meal: Meal;
  onSelect: (m: Meal) => void;
  /** Smaller card for home grids: no tag row */
  compact?: boolean;
}) {
  const store = useStore();
  const liked = store.isLiked(meal.id);
  const left = store.seatsLeft(meal);
  const svc = SVC[meal.serviceType];
  const { Icon } = svc;

  return (
    <motion.div
      onClick={() => onSelect(meal)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(meal); } }}
      role="link"
      tabIndex={0}
      aria-label={`${tMaybe(meal.title)}, ${t("with {name}", { name: meal.host })}, ${euro(meal.price)}`}
      className="w-full h-full text-left rounded-3xl overflow-hidden block cursor-pointer"
      style={{ background: "#ffffff", boxShadow: "0 3px 20px rgba(107,33,217,0.09)" }}
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(107,33,217,0.16)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="relative" style={{ height: 160 }}>
        <img src={meal.image} alt={tMaybe(meal.title)} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(22,10,46,0.35), transparent 55%)" }} />

        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: svc.bg }}>
          <Icon size={11} color={svc.color} strokeWidth={2.5} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: svc.color }}>{t(svc.label)}</span>
        </div>
        {meal.ownedByMe && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full" style={{ background: "#0a7c4e" }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff" }}>{t("Your listing")}</span>
          </div>
        )}

        <motion.button
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.92)" }}
          onClick={(e) => { e.stopPropagation(); store.toggleLike(meal.id); }}
          whileTap={{ scale: 0.75 }}
          aria-label={liked ? t("Remove from saved") : t("Save meal")}
          aria-pressed={liked}
        >
          <motion.div animate={{ scale: liked ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.25 }}>
            <Heart size={14} fill={liked ? "#e9345a" : "none"} color={liked ? "#e9345a" : "#160a2e"} strokeWidth={2} />
          </motion.div>
        </motion.button>

        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full" style={{ background: "#6b21d9" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{euro(meal.price)}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <img src={meal.hostAvatar} alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid #ede8fb" }} />
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 15, fontWeight: 700, color: "#160a2e" }} className="truncate">{tMaybe(meal.title)}</p>
            <p className="truncate" style={{ fontSize: 11.5, color: "#7c6fa0" }}>{t("with {name}", { name: meal.host })} · {meal.time}</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#160a2e" }}>{meal.reviews ? dec(meal.rating) : t("New")}</span>
          </div>
        </div>

        {!compact && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {meal.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: "#f0ecfa", fontSize: 11, color: "#6b21d9", fontWeight: 600 }}>{t(tag)}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: "1px solid rgba(107,33,217,0.07)" }}>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={10} color="#7c6fa0" strokeWidth={2} className="flex-shrink-0" />
            <span className="truncate" style={{ fontSize: 11, color: "#7c6fa0" }}>{dateLabel(meal.date)}</span>
          </div>
          <span className="flex-shrink-0" style={{ fontSize: 11, fontWeight: left <= 1 ? 800 : 500, color: left === 0 ? "#e9345a" : left <= 1 ? "#c05e00" : "#7c6fa0" }}>
            {left === 0 ? t("Sold out") : left === 1 ? t("1 seat left") : t("{n} seats left", { n: left })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
