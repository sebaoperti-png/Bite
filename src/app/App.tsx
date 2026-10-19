import { useState, useEffect, useRef } from "react";
import { EmptyPlate } from "../shared/Restaurant";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle } from "lucide-react";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { HomeScreen, type HomeTab } from "./components/HomeScreen";
import { ListingsScreen } from "./components/ListingsScreen";
import { DetailScreen } from "./components/DetailScreen";
import { CheckoutScreen } from "./components/CheckoutScreen";
import { ChatScreen } from "./components/ChatScreen";
import { CookProfileScreen } from "./components/CookProfileScreen";
import { AuthScreen, type AuthMode } from "./components/AuthScreen";
import { StartHostingFlow } from "./components/StartHostingFlow";
import { DesktopTopBar, type NavTab } from "./components/DesktopTopBar";
import { useIsDesktop } from "./useIsDesktop";
import { StoreProvider, useStore } from "./store";
import { DEFAULT_CRITERIA, type Meal, type SearchCriteria } from "./data";
import { useLang } from "../shared/i18n";
import { t, locale } from "../shared/i18n";

export type { ServiceType, Meal } from "./data";
export { MEALS, dayLabel } from "./data";

export type Screen = "splash" | "onboarding" | "auth" | "cook-profile" | "start-hosting" | "home" | "listings" | "detail" | "checkout" | "chat";

const SCREEN_ORDER: Screen[] = ["splash", "onboarding", "auth", "cook-profile", "start-hosting", "home", "listings", "detail", "checkout", "chat"];

// Phones: native-style push (transitions.dev "page side-by-side"): the new page slides in over the old one,
// which moves back only a third of the way and dims. Going back plays it in reverse.
const EASE = [0.22, 1, 0.36, 1] as const;
const slideVariants = {
  enter: (dir: number) => (dir > 0 ? { x: "100%", opacity: 1, zIndex: 2, filter: "brightness(1)" } : { x: "-30%", opacity: 1, zIndex: 1, filter: "brightness(0.92)" }),
  // no filter left behind: it would trap the fixed bottom sheets inside the page
  center: { x: 0, opacity: 1, filter: "brightness(1)", transitionEnd: { filter: "none", transform: "none" } },
  exit: (dir: number) => (dir > 0 ? { x: "-30%", zIndex: 1, filter: "brightness(0.92)" } : { x: "100%", zIndex: 2, filter: "brightness(1)" }),
};
// Desktop: a short fade with a hint of blur and lift
const fadeVariants = {
  enter: { opacity: 0, y: 8, filter: "blur(3px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } },
  exit: { opacity: 0, y: 0, filter: "blur(2px)" },
};

// Focused flows without the desktop top bar
const BARE_SCREENS: Screen[] = ["splash", "onboarding", "auth"];


/** Everything needed to rebuild a screen when the browser's back/forward buttons are used */
type Route = { screen: Screen; mealId?: string; conversationId?: string; bookingId?: string; authMode?: AuthMode; role?: "cook" | "eat" };
type HistoryState = Route & { idx: number };

export default function App() {
  const lang = useLang(); // re-render the whole app when the language changes
  useEffect(() => { document.title = t("Bite · Real food, real people"); }, [lang]);
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}

function AppInner() {
  const isDesktop = useIsDesktop();
  const store = useStore();
  // No splash or welcome screen: the app opens straight on Home (or on log-in after a log-out)
  // bite.html?host opens the hosting flow straight away (used by the landing page's "I want to host" button)
  const [route, setRoute] = useState<Route>(() => {
    if (!store.account) return { screen: "auth", authMode: "login" };
    const params = new URLSearchParams(window.location.search);
    if (params.has("host")) return { screen: "start-hosting" };
    // bite.html?meal=<id> opens that meal (links from the landing page assistant)
    const mealId = params.get("meal");
    if (mealId && store.mealById(mealId)) return { screen: "detail", mealId };
    return { screen: "home" };
  });
  const [prevScreen, setPrevScreen] = useState<Screen>(route.screen);
  const [criteria, setCriteria] = useState<SearchCriteria>(DEFAULT_CRITERIA);
  const [homeTab, setHomeTab] = useState<HomeTab>("home");
  const screen = route.screen;

  // Mirror of the history entries the app created, so in-app back buttons can use
  // history.back() and the phone/browser back button stays in sync.
  const stack = useRef<Screen[]>([route.screen]);
  const idx = useRef(0);

  const direction = SCREEN_ORDER.indexOf(screen) >= SCREEN_ORDER.indexOf(prevScreen) ? 1 : -1;

  const show = (r: Route) => {
    setRoute((cur) => { setPrevScreen(cur.screen); return r; });
  };

  useEffect(() => {
    // Drop one-off parameters (?reset, ?host) from the address bar, keep ?embed for the landing preview
    const params = new URLSearchParams(window.location.search);
    params.delete("reset"); params.delete("host"); params.delete("meal");
    const qs = params.toString();
    window.history.replaceState({ ...route, idx: 0 } satisfies HistoryState, "", window.location.pathname + (qs ? `?${qs}` : ""));
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistoryState | null;
      if (!st) return;
      idx.current = st.idx ?? 0;
      stack.current[idx.current] = st.screen;
      const { idx: _i, ...r } = st;
      show(r);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (r: Route | Screen, replace = false) => {
    const next: Route = typeof r === "string" ? { screen: r } : r;
    if (replace) {
      stack.current[idx.current] = next.screen;
    } else {
      idx.current += 1;
      stack.current = stack.current.slice(0, idx.current);
      stack.current.push(next.screen);
    }
    const st: HistoryState = { ...next, idx: idx.current };
    if (replace) window.history.replaceState(st, ""); else window.history.pushState(st, "");
    show(next);
  };

  /** Back to `target`: pops history when it is the previous entry, otherwise replaces the current one. */
  const goBack = (target: Screen) => {
    if (idx.current > 0 && stack.current[idx.current - 1] === target) window.history.back();
    else navigate(target, true);
  };

  const openDetail = (meal: Meal) => navigate({ screen: "detail", mealId: meal.id });
  const openChat = (conversationId: string, bookingId?: string, replace = false) => navigate({ screen: "chat", conversationId, bookingId }, replace);
  // When a search was just started (the listings screen shows its "kitchen check" if it opens right after)
  const [searchedAt, setSearchedAt] = useState(0);
  const search = (patch?: Partial<SearchCriteria>) => {
    if (patch) setCriteria((c) => ({ ...c, ...patch }));
    setSearchedAt(Date.now());
    if (screen !== "listings") navigate("listings");
  };

  const onNav = (tab: NavTab) => {
    if (tab === "browse") { if (screen !== "listings") navigate("listings"); return; }
    setHomeTab(tab);
    if (screen !== "home") navigate("home");
  };


  // Keep the page scrolled to the top on each new screen (desktop pages scroll inside)
  useEffect(() => { window.scrollTo(0, 0); }, [route]);

  const meal = route.mealId ? store.mealById(route.mealId) : undefined;
  const activeNav: NavTab | null = screen === "home" ? homeTab : screen === "listings" ? "browse" : screen === "chat" ? "messages" : null;
  const showTopBar = isDesktop && !BARE_SCREENS.includes(screen);
  // Long forms stay readable on desktop: a centred column on a full-width page
  const narrow = isDesktop && (screen === "cook-profile" || screen === "start-hosting");
  const dark = screen === "splash" || screen === "onboarding" || screen === "auth";

  const missing = (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
      <EmptyPlate size={110} />
      <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 34, lineHeight: 1.05, color: "#160a2e" }}>{t("This dish is off the menu.")}</p>
      <p style={{ fontSize: 14, color: "#7c6fa0", maxWidth: 300 }}>{t("This page is no longer available.")} {t("The kitchen has plenty of other tables tonight.")}</p>
      <button onClick={() => navigate("home", true)} className="px-4 py-2 rounded-xl" style={{ background: "#6b21d9", color: "#fff", fontWeight: 700, fontSize: 14 }}>{t("Back to home")}</button>
    </div>
  );

  return (
    <div className="bite-shell">
      {showTopBar && (
        <DesktopTopBar
          active={activeNav}
          unread={store.unreadTotal}
          name={store.profile.name}
          onNavigate={onNav}
          onStartHosting={() => navigate("start-hosting")}
        />
      )}
      <div className="relative flex-1 min-h-0 overflow-hidden" style={{ background: dark ? "#0d0620" : "#f5f4f9" }}>
        <AnimatePresence initial={false} custom={direction} mode={isDesktop ? "wait" : "popLayout"}>
          <motion.div
            key={`${screen}-${route.mealId ?? ""}-${route.conversationId ?? ""}`}
            custom={direction}
            variants={isDesktop ? fadeVariants : slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={isDesktop ? { duration: 0.25, ease: EASE } : { duration: 0.36, ease: EASE }}
            className="absolute inset-0"
          >
            <div className={narrow ? "relative h-full mx-auto w-full max-w-[760px]" : "relative h-full"} style={narrow ? { boxShadow: "0 0 0 1px rgba(107,33,217,0.06)" } : undefined}>
              {screen === "onboarding" && (
                <OnboardingScreen
                  onCook={() => store.account ? navigate("cook-profile", true) : navigate({ screen: "auth", authMode: "signup", role: "cook" })}
                  onEat={() => store.account ? navigate("home", true) : navigate({ screen: "auth", authMode: "signup", role: "eat" })}
                  onSignIn={() => navigate({ screen: "auth", authMode: "login" })}
                />
              )}
              {screen === "auth" && (
                <AuthScreen
                  initialMode={route.authMode ?? "signup"}
                  onBack={store.account ? () => goBack("home") : undefined}
                  onDone={() => {
                    // The sign-up screen is not a place to come back to: start a fresh history
                    const next: Screen = route.role === "cook" ? "cook-profile" : "home";
                    stack.current = [next]; idx.current = 0;
                    setHomeTab("home");
                    window.history.replaceState({ screen: next, idx: 0 } satisfies HistoryState, "");
                    show({ screen: next });
                  }}
                />
              )}
              {screen === "cook-profile" && <CookProfileScreen onBack={() => goBack("home")} onContinue={() => navigate("start-hosting")} />}
              {screen === "start-hosting" && (
                <StartHostingFlow
                  onBack={() => goBack(prevScreen === "cook-profile" ? "cook-profile" : "home")}
                  onPublished={(m) => {
                    setHomeTab("home");
                    // Replace the form in history: back from the new listing goes home, not into the form again
                    stack.current = ["home"]; idx.current = 0;
                    window.history.replaceState({ screen: "home", idx: 0 } satisfies HistoryState, "");
                    navigate({ screen: "detail", mealId: m.id });
                  }}
                />
              )}
              {screen === "home" && (
                <HomeScreen
                  tab={homeTab}
                  onNavigate={onNav}
                  criteria={criteria}
                  setCriteria={setCriteria}
                  onSearch={search}
                  onSelectMeal={openDetail}
                  onOpenChat={(id) => openChat(id)}
                  onStartHosting={() => navigate("start-hosting")}
                  onSignOut={() => {
                    store.signOut();
                    setHomeTab("home");
                    stack.current = ["auth"]; idx.current = 0;
                    window.history.replaceState({ screen: "auth", authMode: "login", idx: 0 } satisfies HistoryState, "");
                    show({ screen: "auth", authMode: "login" });
                  }}
                />
              )}
              {screen === "listings" && (
                <ListingsScreen criteria={criteria} setCriteria={setCriteria} onBack={() => goBack("home")} onSelect={openDetail} onNavigate={onNav} searchedAt={searchedAt} />
              )}
              {screen === "detail" && (meal ? (
                <DetailScreen
                  meal={meal}
                  onBack={() => goBack(prevScreen === "home" ? "home" : "listings")}
                  onBook={() => navigate({ screen: "checkout", mealId: meal.id })}
                  onMessage={() => openChat(store.openConversation(meal))}
                  onOpenChat={(id) => openChat(id)}
                  onUnpublished={() => navigate("home", true)}
                />
              ) : missing)}
              {screen === "checkout" && (meal ? (
                <CheckoutScreen
                  meal={meal}
                  onBack={() => goBack("detail")}
                  onBooked={(b) => openChat(b.conversationId, b.id, true)}
                />
              ) : missing)}
              {screen === "chat" && (route.conversationId ? (
                <ChatScreen
                  conversationId={route.conversationId}
                  bookingId={route.bookingId}
                  onBack={() => {
                    if (idx.current > 0) window.history.back();
                    else { setHomeTab("messages"); navigate("home", true); }
                  }}
                  onOpenMeal={(m) => openDetail(m)}
                />
              ) : missing)}
            </div>
          </motion.div>
        </AnimatePresence>
        <Toast message={store.toast} />
      </div>
    </div>
  );
}

/** Notifications as kitchen tickets: the ticket drops onto the rail, swings, and is torn away */
function Toast({ message }: { message: string | null }) {
  const time = new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="tk-zone" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div key="rail" className="tk-rail" initial={{ opacity: 0, scaleX: 0.6 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, transition: { delay: 0.2 } }} transition={{ duration: 0.25 }} />
        )}
      </AnimatePresence>
      <AnimatePresence mode="popLayout">
        {message && (
          <motion.div
            key={message}
            className="tk"
            style={{ transformOrigin: "50% 0" }}
            initial={{ y: -46, rotate: -7, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 11 } }}
            exit={{ y: -30, rotate: 5, opacity: 0, transition: { duration: 0.35, ease: EASE } }}
          >
            <span className="tk-clip" aria-hidden />
            <span className="tk-head"><b>BITE</b><span>{time}</span></span>
            <span className="tk-msg"><CheckCircle size={15} color="#0a9c62" strokeWidth={2.6} />{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
