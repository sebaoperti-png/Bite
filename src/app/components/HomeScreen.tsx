import { useState } from "react";
import { COUNTRIES, countryByName, postalError, placeLabel, localPlace } from "../location";
import {
  MapPin, Calendar, Clock, Users, Search, ChevronRight, ShoppingBag, Utensils, ChefHat, Home, MessageCircle, User, X, Check,
  Star, Bell, BadgeCheck, Globe, Shield, CheckCircle, Camera, Settings, CreditCard, UserPlus, BookOpen, Heart, LogOut,
  RotateCcw, FileText, LifeBuoy, Leaf, Plus, Minus, Trash2, Eye, Sparkles, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import logoImg from "../logo.png";
import { dayLabel, AREAS, TIMES, CUISINE_TAGS, ANY_DAY, ANY_AREA, ANY_TIME, matchesCriteria, type Meal, type ServiceType, type SearchCriteria, euro } from "../data";
import { useIsDesktop } from "../useIsDesktop";
import { useStore, timeLabel, copyText, type Booking } from "../store";
import type { NavTab } from "./DesktopTopBar";
import { MealCard } from "./ListingsScreen";
import { Sheet } from "./Sheet";
import { t, tMaybe, dateLabel, dec, getLang } from "../../shared/i18n";
import { LangSwitch } from "../../shared/LangSwitch";
import { ProfileDashboard } from "./ProfileDashboard";
import { WeekMenu } from "./WeekMenu";
import { ChefScene } from "./ChefScene";

export type HomeTab = Exclude<NavTab, "browse">;

const SERVICE_TABS = [
  { id: "pickup" as ServiceType, label: "Pick-up", Icon: ShoppingBag, desc: "Order & collect" },
  { id: "eat-together" as ServiceType, label: "Eat Together", Icon: Utensils, desc: "Join someone's table" },
  { id: "cook-together" as ServiceType, label: "Cook Together", Icon: ChefHat, desc: "Cook & share" },
];

const DATES = [ANY_DAY, ...Array.from({ length: 7 }, (_, i) => dayLabel(i))];
const DIETARY_PREFS = ["Vegetarian", "Vegan", "Halal", "Pescatarian", "Gluten-free", "Dairy-free", "Nut-free"];
const APP_URL = "https://sebaoperti-png.github.io/Bite/";

type Picker = "area" | "date" | "time" | "guests";
type ProfileSheet = "bookings" | "saved" | "listings" | "dietary" | "payment" | "settings" | "edit" | null;

interface HomeScreenProps {
  tab: HomeTab;
  onNavigate: (tab: NavTab) => void;
  criteria: SearchCriteria;
  setCriteria: (fn: (c: SearchCriteria) => SearchCriteria) => void;
  onSearch: (patch?: Partial<SearchCriteria>) => void;
  onSelectMeal: (meal: Meal) => void;
  onOpenChat: (conversationId: string) => void;
  onStartHosting: () => void;
  onSignOut: () => void;
}

export function HomeScreen({ tab, onNavigate, criteria, setCriteria, onSearch, onSelectMeal, onOpenChat, onStartHosting, onSignOut }: HomeScreenProps) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const [searching, setSearching] = useState(false);
  const [openPicker, setOpenPicker] = useState<Picker | null>(null);
  const activeService: ServiceType = criteria.service === "all" ? "eat-together" : criteria.service;

  const set = (patch: Partial<SearchCriteria>) => setCriteria((c) => ({ ...c, ...patch }));

  const searchFields = [
    { id: "area" as Picker,   icon: MapPin,   label: t("Location"), value: t(criteria.area) },
    { id: "date" as Picker,   icon: Calendar, label: t("Date"),     value: dateLabel(criteria.date) },
    { id: "time" as Picker,   icon: Clock,    label: t("Time"),     value: t(criteria.time) },
    { id: "guests" as Picker, icon: Users,    label: t("Guests"),   value: criteria.guests === 1 ? t("1 guest") : t("{n} guests", { n: criteria.guests }) },
  ];

  const handleSearch = () => {
    setSearching(true);
    setTimeout(() => { setSearching(false); onSearch({ service: activeService }); }, 450);
  };

  const nearby = store.meals.filter((m) => store.seatsLeft(m) > 0).slice(0, 12);
  const resultCount = store.meals.filter((m) => matchesCriteria(m, { ...criteria, service: activeService }, store.seatsLeft(m))).length;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#f5f4f9", fontFamily: "'Inter', sans-serif" }}>
      {!isDesktop && <div style={{ height: "max(env(safe-area-inset-top), 14px)", flexShrink: 0 }} />}

      <AnimatePresence mode="wait">
        {tab === "home" && (
          <motion.div key="home-view" className="flex flex-col flex-1 min-h-0 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {isDesktop ? (
              <DesktopHome
                name={store.profile.name}
                activeTab={activeService}
                setActiveTab={(s) => set({ service: s })}
                searchFields={searchFields}
                criteria={criteria}
                openPicker={setOpenPicker}
                searching={searching}
                resultCount={resultCount}
                onSearchClick={handleSearch}
                onTag={(tag) => onSearch({ cuisine: tag, service: "all" })}
                meals={nearby}
                onSelectMeal={onSelectMeal}
                onSeeAll={() => onSearch({ service: "all" })}
                onStartHosting={onStartHosting}
              />
            ) : (
              <>
                {/* Header */}
                <div className="px-5 pt-3 pb-1 flex items-center justify-between flex-shrink-0">
                  <motion.img src={logoImg} alt="Bite" style={{ height: 36, width: 36, borderRadius: 10, objectFit: "cover" }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} />
                  <div className="flex items-center gap-2">
                  <LangSwitch size="sm" />
                  <motion.button onClick={() => onNavigate("profile")} aria-label={t("Your profile")} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "#ede8fb" }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }} whileTap={{ scale: 0.94 }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#6b21d9" }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{store.profile.name.charAt(0)}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "#6b21d9", fontWeight: 600 }}>{store.profile.name.split(" ")[0]}</span>
                  </motion.button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {/* Start Hosting CTA */}
                  <motion.div className="mx-4 mt-4 rounded-2xl overflow-hidden" style={{ position: "relative" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: "spring", stiffness: 300 }}>
                    <div style={{ background: "linear-gradient(135deg, #160a2e 0%, #3b1278 55%, #6b21d9 100%)", padding: "16px 18px" }}>
                      <div style={{ position: "absolute", top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: "rgba(184,127,255,0.18)", pointerEvents: "none" }} />
                      <div style={{ position: "absolute", bottom: -8, right: 48, width: 44, height: 44, borderRadius: "50%", background: "rgba(184,127,255,0.12)", pointerEvents: "none" }} />
                      <div className="flex items-center justify-between" style={{ position: "relative", zIndex: 1 }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div style={{ width: 26, height: 26, background: "rgba(184,127,255,0.28)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <ChefHat size={13} color="#b87fff" strokeWidth={2.2} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#b87fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("Share your table")}</span>
                          </div>
                          <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.35, marginBottom: 12 }}>{t("Cook once, share the table,")}<br />{t("split the grocery bill")}</p>
                          <motion.button onClick={onStartHosting} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl" style={{ background: "#b87fff" }} whileTap={{ scale: 0.92 }}>
                            <ChefHat size={13} color="#fff" strokeWidth={2.5} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{t("Start Hosting")}</span>
                          </motion.button>
                        </div>
                        <div aria-hidden style={{ fontSize: 46, lineHeight: 1, marginLeft: 10, flexShrink: 0, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>🍽️</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div className="px-5 pt-5 pb-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#160a2e", lineHeight: 1.25 }}>{t("What do you feel like")}<br />
                      <span style={{ color: "#6b21d9" }}>{t("eating today?")}</span>
                    </h1>
                  </motion.div>

                  {/* Service tabs */}
                  <div className="px-5 pb-3">
                    <div className="flex gap-2" role="tablist" aria-label={t("Way to eat")}>
                      {SERVICE_TABS.map(({ id, label, Icon }, i) => (
                        <motion.button key={id} role="tab" aria-selected={activeService === id} onClick={() => set({ service: id })} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl relative overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07, type: "spring" }} whileTap={{ scale: 0.95 }} style={{ background: activeService === id ? "#6b21d9" : "#ffffff", border: activeService === id ? "none" : "1.5px solid rgba(107,33,217,0.13)" }}>
                          {activeService === id && <motion.div layoutId="tab-glow" className="absolute inset-0" style={{ background: "linear-gradient(135deg, #7c30e8, #9b4aff)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                          <Icon size={15} className="relative z-10" color={activeService === id ? "#ffffff" : "#6b21d9"} strokeWidth={activeService === id ? 2.5 : 1.8} />
                          <span className="relative z-10" style={{ fontSize: 9.5, fontWeight: 700, color: activeService === id ? "#fff" : "#7c6fa0", textAlign: "center", lineHeight: 1.2 }}>{t(label)}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Search fields — 2×2 grid */}
                  <div className="px-5 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      {searchFields.map(({ id, icon: Icon, label, value }, i) => (
                        <motion.button key={id} onClick={() => setOpenPicker(id)} className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left min-w-0" style={{ background: "#ffffff", border: "1.5px solid rgba(107,33,217,0.1)" }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 + i * 0.05 }} whileTap={{ scale: 0.97 }}>
                          <Icon size={13} color="#6b21d9" strokeWidth={1.8} className="flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span style={{ fontSize: 8.5, color: "#7c6fa0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
                            <span style={{ fontSize: 12, color: "#160a2e", fontWeight: 600, marginTop: 0.5 }} className="truncate">{value}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <motion.button onClick={handleSearch} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }} whileTap={{ scale: 0.97 }}>
                      <AnimatePresence mode="wait">
                        {searching ? (
                          <motion.div key="loading" className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {[0, 1, 2].map((i) => (
                              <motion.div key={i} className="w-2 h-2 rounded-full bg-white" animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div key="label" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Search size={15} color="#fff" strokeWidth={2.5} />
                            <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{resultCount === 1 ? t("Search 1 meal") : t("Search {n} meals", { n: resultCount })}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>

                  {/* Quick tags */}
                  <motion.div className="px-5 pt-3 pb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.58 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#7c6fa0", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("Popular near you")}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                      {CUISINE_TAGS.map((tag, i) => (
                        <motion.button key={tag} onClick={() => onSearch({ cuisine: tag, service: "all" })} className="flex-shrink-0 px-3 py-1.5 rounded-full" style={{ background: "#ffffff", border: "1.5px solid rgba(107,33,217,0.13)", fontSize: 11.5, color: "#6b21d9", fontWeight: 600 }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.62 + i * 0.04, type: "spring" }} whileTap={{ scale: 0.9 }}>
                          {t(tag)}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Meals near you */}
                  <div className="px-5 pt-3 pb-6">
                    <div className="flex items-center justify-between mb-2.5">
                      <p style={{ fontSize: 15, fontWeight: 800, color: "#160a2e" }}>{t("Cooking near you")}</p>
                      <button onClick={() => onSearch({ service: "all" })} className="flex items-center gap-0.5" style={{ fontSize: 12, fontWeight: 700, color: "#6b21d9" }}>{t("See all")}{" "}<ChevronRight size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {nearby.slice(0, 4).map((m) => <MealCard key={m.id} meal={m} onSelect={onSelectMeal} compact />)}
                    </div>
                  </div>
                </div>

                <BottomNav active="home" unread={store.unreadTotal} onNavigate={onNavigate} />
              </>
            )}
          </motion.div>
        )}

        {tab === "messages" && (
          <motion.div key="messages-view" className="flex flex-col flex-1 min-h-0 overflow-hidden" initial={{ opacity: 0, x: isDesktop ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 30 }}>
            <MessagesView onOpenChat={onOpenChat} onBrowse={() => onNavigate("browse")} />
            {!isDesktop && <BottomNav active="messages" unread={store.unreadTotal} onNavigate={onNavigate} />}
          </motion.div>
        )}

        {tab === "profile" && (
          <motion.div key="profile-view" className="flex flex-col flex-1 min-h-0 overflow-hidden" initial={{ opacity: 0, x: isDesktop ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 30 }}>
            <ProfileView onSelectMeal={onSelectMeal} onOpenChat={onOpenChat} onStartHosting={onStartHosting} onBrowse={() => onNavigate("browse")} onSignOut={onSignOut} />
            {!isDesktop && <BottomNav active="profile" unread={store.unreadTotal} onNavigate={onNavigate} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search pickers: bottom sheet on phone, dialog on desktop */}
      <Sheet open={!!openPicker} onClose={() => setOpenPicker(null)}>
        <SheetHeader
          title={openPicker === "area" ? t("Choose city") : openPicker === "date" ? t("Choose date") : openPicker === "time" ? t("Choose time") : t("Number of guests")}
          onClose={() => setOpenPicker(null)}
        />
        <div className="overflow-y-auto pb-10 md:pb-4" style={{ scrollbarWidth: "none", maxHeight: "55vh" }}>
          {openPicker === "area" && AREAS.map((a, i) => (
            <PickerRow key={a} label={a} active={criteria.area === a} index={i} onSelect={() => { set({ area: a }); setOpenPicker(null); }} />
          ))}
          {openPicker === "date" && DATES.map((d, i) => (
            <PickerRow key={d} label={d} active={criteria.date === d} index={i} onSelect={() => { set({ date: d }); setOpenPicker(null); }} />
          ))}
          {openPicker === "time" && TIMES.map((tm, i) => (
            <PickerRow key={tm} label={tm} active={criteria.time === tm} index={i} onSelect={() => { set({ time: tm }); setOpenPicker(null); }} />
          ))}
          {openPicker === "guests" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <p style={{ fontSize: 48, fontWeight: 800, color: "#160a2e" }} aria-live="polite">{criteria.guests}</p>
              <div className="flex items-center gap-6">
                <motion.button aria-label={t("Fewer guests")} disabled={criteria.guests <= 1} onClick={() => set({ guests: Math.max(1, criteria.guests - 1) })} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#ede8fb", border: "2px solid #6b21d9", opacity: criteria.guests <= 1 ? 0.4 : 1 }} whileTap={{ scale: 0.88 }}>
                  <Minus size={22} color="#6b21d9" />
                </motion.button>
                <motion.button aria-label={t("More guests")} disabled={criteria.guests >= 8} onClick={() => set({ guests: Math.min(8, criteria.guests + 1) })} className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#6b21d9", opacity: criteria.guests >= 8 ? 0.4 : 1 }} whileTap={{ scale: 0.88 }}>
                  <Plus size={22} color="#fff" />
                </motion.button>
              </div>
              <motion.button onClick={() => setOpenPicker(null)} className="px-10 py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }} whileTap={{ scale: 0.96 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{t("Confirm")}</span>
              </motion.button>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}

/* ───────────────────────── Desktop home ───────────────────────── */

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? t("Good morning") : h < 18 ? t("Good afternoon") : t("Good evening");
}

/** "A table for 1 guest in any city, any day, any time." — split into text and clickable parts */
function reservationParts(c: SearchCriteria): (string | { id: Picker; value: string })[] {
  const lower = (x: string) => (getLang() === "de" ? x : x.charAt(0).toLowerCase() + x.slice(1));
  const values: Record<string, { id: Picker; value: string }> = {
    guests: { id: "guests", value: c.guests === 1 ? t("1 guest") : t("{n} guests", { n: c.guests }) },
    area: { id: "area", value: c.area === ANY_AREA ? t("any city") : t(c.area) },
    date: { id: "date", value: c.date === ANY_DAY ? t("any day") : dateLabel(c.date) },
    time: { id: "time", value: c.time === ANY_TIME ? t("any time") : lower(t(c.time)) },
  };
  return t("A table for {guests} in {area}, {date}, {time}.").split(/(\{\w+\})/).filter(Boolean)
    .map((p) => { const m = p.match(/^\{(\w+)\}$/); return m && values[m[1]] ? values[m[1]] : p; });
}

/** Small line drawings for the three ways to eat (the steam moves on hover / when selected) */
function ServiceDoodle({ kind }: { kind: ServiceType }) {
  const steam = <g className="dh-steam" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M11 6c-1-1.2 1-2 0-3.4" /><path d="M15 6c-1-1.2 1-2 0-3.4" /></g>;
  return (
    <svg viewBox="0 0 26 26" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {kind === "pickup" && <>{steam}<path d="M6.5 10.5h13l-1.2 11.5H7.7z" /><path d="M10 10.5V9a3 3 0 0 1 6 0v1.5" /><path d="M10.5 15.5h5" /></>}
      {kind === "eat-together" && <>{steam}<ellipse cx="13" cy="17" rx="8.5" ry="4" /><ellipse cx="13" cy="16.4" rx="4.6" ry="2" /><path d="M2.5 10v4M3.8 10v4M2.5 14h1.3M3.2 14v8" /><path d="M23 10c-1.6 0-1.8 3.2-1.8 4.5h1.8V22" /></>}
      {kind === "cook-together" && <>{steam}<path d="M6 12h14v6.5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" /><path d="M4 12h18" /><path d="M9.5 9.2a4 4 0 0 1 7 0" /><path d="M3.5 14.5H6M20 14.5h2.5" /></>}
    </svg>
  );
}

function DesktopHome({ name, activeTab, setActiveTab, searchFields, criteria, openPicker, searching, resultCount, onSearchClick, onTag, meals, onSelectMeal, onSeeAll, onStartHosting }: {
  name: string;
  activeTab: ServiceType;
  setActiveTab: (t: ServiceType) => void;
  searchFields: { id: Picker; icon: React.ElementType; label: string; value: string }[];
  criteria: SearchCriteria;
  openPicker: (id: Picker) => void;
  searching: boolean;
  resultCount: number;
  onSearchClick: () => void;
  onTag: (tag: string) => void;
  meals: Meal[];
  onSelectMeal: (m: Meal) => void;
  onSeeAll: () => void;
  onStartHosting: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1240px] px-8 pt-10 pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] items-stretch">
          {/* Search panel */}
          <motion.section className="rounded-[28px] p-8 lg:p-10" style={{ background: "#ffffff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#9b4aff" }}>{greeting()}, {name.split(" ")[0]}</p>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: "#160a2e", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: 6 }}>{t("What do you feel like")}{" "}<span className="dh-serif">{t("eating today?")}</span>
            </h1>

            <div className="flex flex-wrap gap-2.5 mt-7" role="tablist" aria-label={t("Way to eat")}>
              {SERVICE_TABS.map(({ id, label, Icon, desc }) => {
                const on = activeTab === id;
                return (
                  <button key={id} role="tab" aria-selected={on} onClick={() => setActiveTab(id)} className="flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl transition-colors" style={{ background: on ? "linear-gradient(135deg, #7c30e8, #9b4aff)" : "#f7f4fd", border: on ? "1.5px solid transparent" : "1.5px solid rgba(107,33,217,0.1)" }}>
                    <span className={`dh-doodle ${on ? "on" : ""}`} style={{ background: on ? "rgba(255,255,255,0.16)" : "#ede8fb", color: on ? "#fff" : "#6b21d9" }}>
                      <ServiceDoodle kind={id} />
                    </span>
                    <span className="text-left">
                      <span className="block" style={{ fontSize: 14.5, fontWeight: 800, color: on ? "#fff" : "#160a2e" }}>{t(label)}</span>
                      <span className="block" style={{ fontSize: 12, color: on ? "rgba(255,255,255,0.8)" : "#7c6fa0" }}>{t(desc)}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* The search as a reservation sentence: every bold part opens its picker */}
            <div className="dh-resa">
              <p className="dh-resa-text">
                {reservationParts(criteria).map((part, i) =>
                  typeof part === "string" ? <span key={i}>{part}</span> : (
                    <button key={i} className="dh-resa-pick" onClick={() => openPicker(part.id)}>{part.value}<ChevronDown size={16} strokeWidth={2.6} /></button>
                  ),
                )}
              </p>
              <motion.button onClick={onSearchClick} className="dh-resa-go" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <span className="flex items-center gap-2">
                  <Search size={17} color="#fff" strokeWidth={2.5} />
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{searching ? t("Searching…") : t("Find my table")}</span>
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 600 }}>{resultCount === 1 ? t("1 meal") : t("{n} meals", { n: resultCount })}</span>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-5">
              <span className="dh-specials-label">{t("Today's specials")}</span>
              {CUISINE_TAGS.map((tag) => (
                <button key={tag} onClick={() => onTag(tag)} className="dh-special">
                  {t(tag)}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Host CTA */}
          <motion.section className="relative rounded-[28px] overflow-hidden p-8 flex flex-col" style={{ background: "linear-gradient(150deg, #160a2e 0%, #3b1278 55%, #6b21d9 100%)" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(184,127,255,0.16)" }} />
            <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(184,127,255,0.1)" }} />
            <div className="relative flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,127,255,0.28)" }}>
                <ChefHat size={16} color="#d6b8ff" strokeWidth={2.2} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#d6b8ff", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("Share your table")}</span>
            </div>
            <p className="relative" style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.02em", marginTop: 18 }}>{t("Cook once, share the table, split the bill.")}</p>
            <p className="relative" style={{ fontSize: 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55, marginTop: 10 }}>{t("Cooking for six costs barely more than for two. Guests chip in for the groceries — everyone eats better for less.")}</p>
            <div className="relative flex-1 flex items-center justify-center py-4"><ChefScene /></div>
            <div className="relative pt-2">
              <button onClick={onStartHosting} className="flex items-center gap-2 px-5 py-3 rounded-xl transition-transform hover:-translate-y-px" style={{ background: "#fff" }}>
                <ChefHat size={16} color="#6b21d9" strokeWidth={2.4} />
                <span style={{ fontSize: 14.5, fontWeight: 800, color: "#160a2e" }}>{t("Start hosting")}</span>
                <ChevronRight size={16} color="#160a2e" strokeWidth={2.4} />
              </button>
            </div>
          </motion.section>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#160a2e", letterSpacing: "-0.02em" }}>{t("Cooking this week")}</h2>
              <p style={{ fontSize: 14.5, color: "#7c6fa0", marginTop: 2 }}>{t("Home-cooked meals from verified neighbours across Germany")}</p>
            </div>
            <button onClick={onSeeAll} className="flex items-center gap-1 px-4 py-2 rounded-xl hover:bg-[#ede8fb] transition-colors">
              <span style={{ fontSize: 14, fontWeight: 700, color: "#6b21d9" }}>{t("See all")}</span>
              <ChevronRight size={16} color="#6b21d9" strokeWidth={2.4} />
            </button>
          </div>
          <WeekMenu meals={meals} onSelectMeal={onSelectMeal} onSeeAll={onSeeAll} />
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── Messages ───────────────────────── */

function MessagesView({ onOpenChat, onBrowse }: { onOpenChat: (id: string) => void; onBrowse: () => void }) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const convs = [...store.conversations].sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? 0) - (a.messages[a.messages.length - 1]?.at ?? 0));

  const list = (
    <>
      <div className="px-5 pt-4 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(107,33,217,0.08)", background: "#fff" }}>
        <h1 style={{ fontSize: isDesktop ? 26 : 22, fontWeight: 800, color: "#160a2e" }}>{t("Messages")}</h1>
        <button onClick={store.markAllRead} className="relative p-1.5 rounded-lg hover:bg-[#f5f0ff]" aria-label={store.unreadTotal ? t("{n} unread — mark all as read", { n: store.unreadTotal }) : t("No unread messages")}>
          <Bell size={20} color="#6b21d9" strokeWidth={1.8} />
          {store.unreadTotal > 0 && (
            <div className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#e9345a" }}>
              <span style={{ fontSize: 8, color: "#fff", fontWeight: 800 }}>{store.unreadTotal}</span>
            </div>
          )}
        </button>
      </div>
      {convs.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16" style={{ background: "#fff" }}>
          <MessageCircle size={34} color="#c4b8de" strokeWidth={1.4} />
          <p style={{ fontSize: 14, color: "#7c6fa0", fontWeight: 600 }}>{t("No conversations yet")}</p>
          <button onClick={onBrowse} className="px-4 py-2 rounded-full" style={{ background: "#ede8fb", fontSize: 13, color: "#6b21d9", fontWeight: 700 }}>{t("Find a meal")}</button>
        </div>
      )}
      {convs.map((conv, i) => {
        const last = conv.messages[conv.messages.length - 1];
        const meal = conv.mealId ? store.mealById(conv.mealId) : undefined;
        return (
          <motion.button key={conv.id} onClick={() => onOpenChat(conv.id)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#faf8fd]" style={{ borderBottom: "1px solid rgba(107,33,217,0.05)", background: "#fff" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ background: "#f5f4f9" }}>
            <div className="relative flex-shrink-0">
              <img src={conv.avatar} alt="" className="w-12 h-12 rounded-full object-cover" style={{ border: conv.unread ? "2.5px solid #6b21d9" : "2px solid #ede8fb" }} />
              {conv.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#6b21d9" }}>
                  <span style={{ fontSize: 9, color: "#fff", fontWeight: 800 }}>{conv.unread}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate" style={{ fontSize: 14, fontWeight: conv.unread ? 800 : 600, color: "#160a2e" }}>
                  {conv.name}{meal && <span style={{ fontWeight: 500, color: "#7c6fa0" }}> · {tMaybe(meal.title)}</span>}
                </p>
                <p className="flex-shrink-0" style={{ fontSize: 11, color: conv.unread ? "#6b21d9" : "#7c6fa0", fontWeight: conv.unread ? 700 : 400 }}>{last ? timeLabel(last.at) : ""}</p>
              </div>
              <p style={{ fontSize: 12.5, color: conv.unread ? "#160a2e" : "#7c6fa0", fontWeight: conv.unread ? 600 : 400, marginTop: 2 }} className="truncate">
                {store.typing[conv.id] ? t("typing…") : last ? `${last.sender === "me" ? t("You:") + " " : ""}${tMaybe(last.text)}` : t("Say hello 👋")}
              </p>
            </div>
          </motion.button>
        );
      })}
    </>
  );

  if (!isDesktop) return <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none", background: "#fff" }}>{list}</div>;
  return (
    <div className="flex-1 min-h-0 overflow-y-auto py-10 px-8">
      <div className="mx-auto w-full max-w-[760px] rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 4px 24px rgba(46,16,96,0.06)" }}>{list}</div>
    </div>
  );
}

/* ───────────────────────── Profile ───────────────────────── */

function ProfileView({ onSelectMeal, onOpenChat, onStartHosting, onBrowse, onSignOut }: { onSelectMeal: (m: Meal) => void; onOpenChat: (id: string) => void; onStartHosting: () => void; onBrowse: () => void; onSignOut: () => void }) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const [sheet, setSheet] = useState<ProfileSheet>(null);
  const { profile } = store;
  const mine = store.bookings.filter((b) => !b.guest);
  const upcoming = mine.filter((b) => b.status === "confirmed");
  const myListings = store.published;
  const saved = store.liked.map((id) => store.mealById(id)).filter(Boolean) as Meal[];

  const invite = async () => {
    const ok = await copyText(`${t("Join me on Bite — share home-cooked meals with your neighbours:")} ${APP_URL}`);
    if (ok) { store.showToast(t("Invite link copied — share it with a friend")); return; }
    if (navigator.share) { try { await navigator.share({ title: "Bite", text: t("Join me on Bite"), url: APP_URL }); return; } catch { /* cancelled */ } }
    window.prompt(t("Copy your invite link:"), APP_URL);
  };

  const rows: { Icon: React.ElementType; label: string; sub: string; onClick: () => void }[] = [
    { Icon: BookOpen,   label: t("My bookings"),         sub: upcoming.length ? (upcoming.length > 1 ? t("{n} upcoming meals", { n: upcoming.length }) : t("1 upcoming meal")) : t("No upcoming meals"), onClick: () => setSheet("bookings") },
    { Icon: Heart,      label: t("Saved meals"),         sub: saved.length ? t("{n} saved", { n: saved.length }) : t("Tap ♥ on a meal to save it"), onClick: () => setSheet("saved") },
    { Icon: ChefHat,    label: t("My listings"),         sub: myListings.length ? t("{n} live", { n: myListings.length }) : t("Host your first meal"), onClick: () => setSheet("listings") },
    { Icon: Leaf,       label: t("Dietary preferences"), sub: profile.dietary.length ? profile.dietary.map((d) => t(d)).join(" · ") : t("None set"), onClick: () => setSheet("dietary") },
    { Icon: CreditCard, label: t("Payment methods"),     sub: t("Visa ···· 4242 (demo)"), onClick: () => setSheet("payment") },
    { Icon: UserPlus,   label: t("Invite friends"),      sub: t("Bring your neighbours to the table"), onClick: invite },
    { Icon: Settings,   label: t("Settings"),            sub: t("Notifications, language, Bite news, demo data"), onClick: () => setSheet("settings") },
  ];

  const shareProfile = async () => {
    const ok = await copyText(`${t("{name} hosts home-cooked meals on Bite:", { name: profile.name })} ${APP_URL}`);
    store.showToast(ok ? t("Profile link copied") : t("Link: sebaoperti-png.github.io/Bite"));
  };

  return (
    <div className={`flex-1 overflow-y-auto ${isDesktop ? "py-8 px-8" : ""}`} style={{ scrollbarWidth: "none", background: "#f5f4f9" }}>
      <ProfileDashboard rows={rows} onEdit={() => setSheet("edit")} onShare={shareProfile} onStartHosting={onStartHosting} onBrowse={onBrowse} onSelectMeal={onSelectMeal} />
      {!isDesktop && <div style={{ height: 24 }} />}

      <ProfileSheets sheet={sheet} close={() => setSheet(null)} onSelectMeal={onSelectMeal} onOpenChat={onOpenChat} onStartHosting={onStartHosting} onBrowse={onBrowse} onSignOut={onSignOut} saved={saved} />
    </div>
  );
}

function ProfileSheets({ sheet, close, onSelectMeal, onOpenChat, onStartHosting, onBrowse, onSignOut, saved }: {
  onSignOut: () => void;
  sheet: ProfileSheet;
  close: () => void;
  onSelectMeal: (m: Meal) => void;
  onOpenChat: (id: string) => void;
  onStartHosting: () => void;
  onBrowse: () => void;
  saved: Meal[];
}) {
  const store = useStore();
  const [draft, setDraft] = useState(store.profile);
  const postalErr = postalError(draft.country ?? "Germany", draft.postalCode ?? "");
  const [lastSheet, setLastSheet] = useState<ProfileSheet>(null);
  if (sheet !== lastSheet) { setLastSheet(sheet); if (sheet === "edit") setDraft(store.profile); }
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const titles: Record<Exclude<ProfileSheet, null>, string> = {
    bookings: "My bookings", saved: "Saved meals", listings: "My listings", dietary: "Dietary preferences",
    payment: "Payment methods", settings: "Settings", edit: "Edit profile",
  };

  const go = (fn: () => void) => { close(); fn(); };

  return (
    <Sheet open={!!sheet} onClose={() => { close(); setConfirmReset(false); setConfirmCancel(null); }} mobileMaxHeight="86%">
      {sheet && <SheetHeader title={t(titles[sheet])} onClose={close} />}
      <div className="overflow-y-auto px-5 pb-8 pt-3 md:pb-5" style={{ scrollbarWidth: "none", maxHeight: "68vh" }}>
        {sheet === "bookings" && (
          store.bookings.filter((b) => !b.guest).length === 0 ? (
            <Empty icon={BookOpen} text="No bookings yet" action="Find a meal" onAction={() => go(onBrowse)} />
          ) : (
            <div className="flex flex-col gap-3">
              {store.bookings.filter((b) => !b.guest).map((b) => <BookingRow key={b.id} b={b} confirmCancel={confirmCancel} setConfirmCancel={setConfirmCancel} onOpen={(m) => go(() => onSelectMeal(m))} onChat={() => go(() => onOpenChat(b.conversationId))} />)}
            </div>
          )
        )}

        {sheet === "saved" && (
          saved.length === 0 ? <Empty icon={Heart} text="Nothing saved yet — tap ♥ on any meal" action="Browse meals" onAction={() => go(onBrowse)} /> : (
            <div className="flex flex-col gap-2">
              {saved.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-2xl" style={{ background: "#f7f4fd" }}>
                  <button onClick={() => go(() => onSelectMeal(m))} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <img src={m.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate" style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{tMaybe(m.title)}</span>
                      <span className="block" style={{ fontSize: 12, color: "#7c6fa0" }}>{m.host} · {dateLabel(m.date)} · {euro(m.price)}</span>
                    </span>
                  </button>
                  <button onClick={() => store.toggleLike(m.id)} className="p-2" aria-label={t("Remove from saved")}><Heart size={16} fill="#e9345a" color="#e9345a" /></button>
                </div>
              ))}
            </div>
          )
        )}

        {sheet === "listings" && (
          <div className="flex flex-col gap-3">
            {store.published.length === 0 && <Empty icon={ChefHat} text="You haven't published a meal yet" />}
            {store.published.map((m) => {
              const booked = m.seats - store.seatsLeft(m);
              return (
                <div key={m.id} className="p-3 rounded-2xl" style={{ background: "#f7f4fd" }}>
                  <div className="flex items-center gap-3">
                    <img src={m.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate" style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{tMaybe(m.title)}</p>
                      <p style={{ fontSize: 12, color: "#7c6fa0" }}>{dateLabel(m.date)} · {m.time} · {euro(m.price)}</p>
                      <p style={{ fontSize: 12, color: "#0a7c4e", fontWeight: 700 }}>{t("Live · {booked}/{seats} seats booked", { booked, seats: m.seats })}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => go(() => onSelectMeal(m))} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: "#fff", fontSize: 13, fontWeight: 700, color: "#6b21d9" }}><Eye size={14} />{" "}{t("View")}</button>
                    <button onClick={() => store.unpublish(m.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: "#fff", fontSize: 13, fontWeight: 700, color: "#e9345a" }}><Trash2 size={14} />{" "}{t("Unpublish")}</button>
                  </div>
                </div>
              );
            })}
            <button onClick={() => go(onStartHosting)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)" }}>
              <Plus size={16} color="#fff" strokeWidth={2.5} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{t("Create a new listing")}</span>
            </button>
          </div>
        )}

        {sheet === "dietary" && (
          <>
            <p style={{ fontSize: 13, color: "#7c6fa0", marginBottom: 12 }}>{t("We'll share these with your host every time you book.")}</p>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_PREFS.map((d) => {
                const on = store.profile.dietary.includes(d);
                return (
                  <button key={d} aria-pressed={on} onClick={() => store.updateProfile({ dietary: on ? store.profile.dietary.filter((x) => x !== d) : [...store.profile.dietary, d] })} className="flex items-center justify-between px-3.5 py-3 rounded-2xl" style={{ background: on ? "#ede8fb" : "#f5f4f9", border: `1.5px solid ${on ? "#6b21d9" : "rgba(107,33,217,0.1)"}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: on ? "#6b21d9" : "#160a2e" }}>{t(d)}</span>
                    {on && <Check size={15} color="#6b21d9" strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {sheet === "payment" && (
          <>
            <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #160a2e, #3b1278)", color: "#fff" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, opacity: 0.7 }}>{t("Default card")}</span>
                <span style={{ fontSize: 16, fontWeight: 900, fontStyle: "italic" }}>{t("VISA")}</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.12em", marginTop: 22 }}>···· ···· ···· 4242</p>
              <div className="flex justify-between mt-3" style={{ fontSize: 12, opacity: 0.75 }}>
                <span>{store.profile.name}</span><span>12/29</span>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl" style={{ background: "#f7f4fd" }}>
              <Shield size={15} color="#6b21d9" className="flex-shrink-0 mt-0.5" />
              <p style={{ fontSize: 12.5, color: "#4a3a6e", lineHeight: 1.5 }}>{t("Payments will be processed by Stripe. This is a demo: no card is stored and nothing is ever charged.")}</p>
            </div>
          </>
        )}

        {sheet === "settings" && (
          <div className="flex flex-col gap-2">
            <button onClick={() => store.updateProfile({ notifications: !store.profile.notifications })} className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "#f7f4fd" }} role="switch" aria-checked={store.profile.notifications}>
              <span className="flex items-center gap-3"><Bell size={16} color="#6b21d9" /><span style={{ fontSize: 14, fontWeight: 600, color: "#160a2e" }}>{t("Booking & message notifications")}</span></span>
              <span className="relative rounded-full transition-colors flex-shrink-0" style={{ width: 40, height: 24, background: store.profile.notifications ? "#6b21d9" : "#d8ccf5" }}>
                <span className="absolute top-1 rounded-full bg-white transition-all" style={{ width: 16, height: 16, left: store.profile.notifications ? 20 : 4 }} />
              </span>
            </button>
            <button onClick={() => { store.updateProfile({ news: !store.profile.news }); store.showToast(store.profile.news ? t("You won't get Bite news emails") : t("We'll keep you updated on Bite's news")); }} className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "#f7f4fd" }} role="switch" aria-checked={!!store.profile.news}>
              <span className="flex items-center gap-3"><Sparkles size={16} color="#6b21d9" /><span style={{ fontSize: 14, fontWeight: 600, color: "#160a2e" }}>{t("Keep me updated on Bite's news")}</span></span>
              <span className="relative rounded-full transition-colors flex-shrink-0" style={{ width: 40, height: 24, background: store.profile.news ? "#6b21d9" : "#d8ccf5" }}>
                <span className="absolute top-1 rounded-full bg-white transition-all" style={{ width: 16, height: 16, left: store.profile.news ? 20 : 4 }} />
              </span>
            </button>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "#f7f4fd" }}>
              <span className="flex items-center gap-3"><Globe size={16} color="#6b21d9" /><span style={{ fontSize: 14, fontWeight: 600, color: "#160a2e" }}>{t("Language")}</span></span>
              <LangSwitch size="sm" />
            </div>
            <SettingsLink Icon={FileText} label={t("Terms & privacy")} onClick={() => window.open("legal.html", "_blank", "noopener")} />
            <SettingsLink Icon={LifeBuoy} label={t("Help & support")} onClick={() => window.open("./#help", "_blank", "noopener")} />
            <div className="mt-2 p-4 rounded-2xl" style={{ background: "#fff4f6", border: "1px solid rgba(233,52,90,0.15)" }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: "#160a2e" }}>{t("Demo data")}</p>
              <p style={{ fontSize: 12.5, color: "#7c6fa0", marginTop: 2 }}>{t("Clear bookings, chats, saved meals and published listings made in this browser.")}</p>
              {confirmReset ? (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { store.reset(); setConfirmReset(false); close(); }} className="flex-1 py-2.5 rounded-xl" style={{ background: "#e9345a", color: "#fff", fontSize: 13, fontWeight: 800 }}>{t("Yes, reset")}</button>
                  <button onClick={() => setConfirmReset(false)} className="flex-1 py-2.5 rounded-xl" style={{ background: "#fff", color: "#160a2e", fontSize: 13, fontWeight: 700 }}>{t("Keep")}</button>
                </div>
              ) : (
                <button onClick={() => setConfirmReset(true)} className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#fff", color: "#e9345a", fontSize: 13, fontWeight: 700 }}>
                  <RotateCcw size={14} />{" "}{t("Reset demo data")}</button>
              )}
            </div>
            <button
              onClick={() => go(onSignOut)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl mt-1" style={{ background: "#f7f4fd" }}
            >
              <LogOut size={16} color="#7c6fa0" /><span style={{ fontSize: 14, fontWeight: 600, color: "#4a3a6e" }}>{t("Log out")}{store.account ? ` (${store.account.email})` : ""}</span>
            </button>
          </div>
        )}

        {sheet === "edit" && (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.name.trim() || postalErr) return;
              const country = draft.country ?? "Germany";
              const city = (draft.city ?? "").trim();
              store.updateProfile({
                name: draft.name.trim(), bio: draft.bio.trim(),
                country, city, postalCode: (draft.postalCode ?? "").trim().toUpperCase(),
                neighbourhood: placeLabel(city, country),
              });
              store.showToast(t("Profile updated"));
              close();
            }}
          >
            <Field label={t("Name")}><input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={inputStyle} maxLength={40} /></Field>
            <Field label={t("Country")}>
              <select value={draft.country ?? "Germany"} onChange={(e) => setDraft({ ...draft, country: e.target.value, postalCode: "" })} style={inputStyle}>
                {COUNTRIES.map((c) => <option key={c.name} value={c.name}>{t(c.name)}</option>)}
              </select>
            </Field>
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <Field label={t("City")}>
                  <input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} list="profile-cities" placeholder={t("e.g. {city}", { city: countryByName(draft.country ?? "Germany").cities[0] })} style={inputStyle} maxLength={40} />
                  <datalist id="profile-cities">
                    {countryByName(draft.country ?? "Germany").cities.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>
              </div>
              <div style={{ width: 140 }}>
                <Field label={t("Postal code")}>
                  <input value={draft.postalCode ?? ""} onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })} placeholder={countryByName(draft.country ?? "Germany").example} style={{ ...inputStyle, ...(postalErr ? { borderColor: "#e9345a" } : {}) }} maxLength={10} autoComplete="postal-code" inputMode="text" />
                </Field>
              </div>
            </div>
            {postalErr && <p style={{ fontSize: 12, color: "#e9345a", fontWeight: 600, marginTop: -4 }}>{postalErr}</p>}
            <Field label={t("About me")}><textarea rows={4} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} style={{ ...inputStyle, resize: "none" }} maxLength={300} /></Field>
            <button type="submit" className="py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, #6b21d9, #9b4aff)", color: "#fff", fontWeight: 800, fontSize: 15 }}>{t("Save changes")}</button>
          </form>
        )}
      </div>
    </Sheet>
  );
}

function BookingRow({ b, confirmCancel, setConfirmCancel, onOpen, onChat }: { b: Booking; confirmCancel: string | null; setConfirmCancel: (id: string | null) => void; onOpen: (m: Meal) => void; onChat: () => void }) {
  const store = useStore();
  const m = store.mealById(b.mealId);
  if (!m) return null;
  const cancelled = b.status === "cancelled";
  return (
    <div className="p-3 rounded-2xl" style={{ background: "#f7f4fd", opacity: cancelled ? 0.6 : 1 }}>
      <button onClick={() => onOpen(m)} className="flex items-center gap-3 w-full text-left">
        <img src={m.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block truncate" style={{ fontSize: 14, fontWeight: 700, color: "#160a2e" }}>{tMaybe(m.title)}</span>
          <span className="block" style={{ fontSize: 12, color: "#7c6fa0" }}>{dateLabel(m.date)} · {m.time} · {b.guests === 1 ? t("1 guest") : t("{n} guests", { n: b.guests })}</span>
          <span className="block" style={{ fontSize: 12, fontWeight: 700, color: cancelled ? "#e9345a" : "#0a7c4e" }}>{cancelled ? t("Cancelled · refunded") : t("Confirmed · {price} paid", { price: euro(b.total) })}</span>
        </span>
      </button>
      {!cancelled && (
        <div className="flex gap-2 mt-3">
          <button onClick={onChat} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl" style={{ background: "#fff", fontSize: 13, fontWeight: 700, color: "#6b21d9" }}><MessageCircle size={14} />{" "}{t("Message host")}</button>
          {confirmCancel === b.id ? (
            <button onClick={() => { store.cancelBooking(b.id); setConfirmCancel(null); }} className="flex-1 py-2 rounded-xl" style={{ background: "#e9345a", fontSize: 13, fontWeight: 800, color: "#fff" }}>{t("Confirm cancel")}</button>
          ) : (
            <button onClick={() => setConfirmCancel(b.id)} className="flex-1 py-2 rounded-xl" style={{ background: "#fff", fontSize: 13, fontWeight: 700, color: "#e9345a" }}>{t("Cancel booking")}</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Small shared bits ───────────────────────── */

const inputStyle: React.CSSProperties = {
  background: "#f5f4f9", border: "1.5px solid rgba(107,33,217,0.13)", borderRadius: 14, padding: "11px 14px",
  fontSize: 14, color: "#160a2e", width: "100%", outline: "none", fontFamily: "inherit",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ fontSize: 12, fontWeight: 700, color: "#7c6fa0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}

function SettingsLink({ Icon, label, value, onClick }: { Icon: React.ElementType; label: string; value?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: "#f7f4fd" }}>
      <span className="flex items-center gap-3"><Icon size={16} color="#6b21d9" /><span style={{ fontSize: 14, fontWeight: 600, color: "#160a2e" }}>{label}</span></span>
      <span className="flex items-center gap-1" style={{ fontSize: 13, color: "#7c6fa0" }}>{value}<ChevronRight size={14} color="#c4b8de" /></span>
    </button>
  );
}

function Empty({ icon: Icon, text, action, onAction }: { icon: React.ElementType; text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <Icon size={32} color="#c4b8de" strokeWidth={1.4} />
      <p style={{ fontSize: 14, color: "#7c6fa0", fontWeight: 600, textAlign: "center" }}>{t(text)}</p>
      {action && <button onClick={onAction} className="px-4 py-2 rounded-full" style={{ background: "#ede8fb", fontSize: 13, color: "#6b21d9", fontWeight: 700 }}>{t(action)}</button>}
    </div>
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="px-5 py-3 md:py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid rgba(107,33,217,0.08)" }}>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#160a2e" }}>{title}</p>
      <motion.button onClick={onClose} aria-label={t("Close")} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: "#f0ecfa" }} whileTap={{ scale: 0.88 }}>
        <X size={15} color="#6b21d9" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}

function PickerRow({ label, active, index, onSelect }: { label: string; active: boolean; index: number; onSelect: () => void }) {
  return (
    <motion.button onClick={onSelect} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#faf8fd]" style={{ borderBottom: "1px solid rgba(107,33,217,0.05)", background: active ? "#f5f0ff" : "#fff" }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? "#6b21d9" : "#160a2e" }}>{dateLabel(label)}</span>
      {active && <Check size={16} color="#6b21d9" strokeWidth={2.5} />}
    </motion.button>
  );
}

export function BottomNav({ active, unread = 0, onNavigate }: { active: NavTab; unread?: number; onNavigate?: (tab: NavTab) => void }) {
  const items: { id: NavTab; label: string; Icon: React.ElementType }[] = [
    { id: "home",     label: "Home",     Icon: Home },
    { id: "browse",   label: "Browse",   Icon: Search },
    { id: "messages", label: "Messages", Icon: MessageCircle },
    { id: "profile",  label: "Profile",  Icon: User },
  ];

  return (
    <nav className="flex items-center justify-around px-2 pt-3 flex-shrink-0" style={{ background: "#ffffff", borderTop: "1px solid rgba(107,33,217,0.08)", paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }} aria-label={t("Main")}>
      {items.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <motion.button key={id} className="relative flex flex-col items-center gap-1 px-3" whileTap={{ scale: 0.82 }} onClick={() => onNavigate?.(id)} aria-current={isActive ? "page" : undefined}>
            <motion.div className="flex items-center justify-center w-8 h-8 rounded-xl" animate={{ background: isActive ? "#ede8fb" : "rgba(0,0,0,0)" }} transition={{ type: "spring", stiffness: 400 }}>
              <Icon size={17} color={isActive ? "#6b21d9" : "#a99cc8"} strokeWidth={isActive ? 2.5 : 1.8} />
            </motion.div>
            {id === "messages" && unread > 0 && (
              <span className="absolute top-0 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#e9345a", fontSize: 8.5, fontWeight: 800, color: "#fff" }}>{unread}</span>
            )}
            <span style={{ fontSize: 9.5, fontWeight: 700, color: isActive ? "#6b21d9" : "#a99cc8" }}>{t(label)}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
