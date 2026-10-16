import { useState, useEffect, useRef } from "react";
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
import { t } from "../shared/i18n";

export type { ServiceType, Meal } from "./data";
export { MEALS, dayLabel } from "./data";

export type Screen = "splash" | "onboarding" | "auth" | "cook-profile" | "start-hosting" | "home" | "listings" | "detail" | "checkout" | "chat";

const SCREEN_ORDER: Screen[] = ["splash", "onboarding", "auth", "cook-profile", "start-hosting", "home", "listings", "detail", "checkout", "chat"];

// Phone: screens slide sideways like a native app. Desktop: a quick cross-fade, like a web page.
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};
const fadeVariants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 0 },
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
  const search = (patch?: Partial<SearchCriteria>) => {
    if (patch) setCriteria((c) => ({ ...c, ...patch }));
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
    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#160a2e" }}>{t("This page is no longer available.")}</p>
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
            transition={isDesktop ? { duration: 0.18, ease: "easeOut" } : { type: "spring", stiffness: 380, damping: 34 }}
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
                <ListingsScreen criteria={criteria} setCriteria={setCriteria} onBack={() => goBack("home")} onSelect={openDetail} onNavigate={onNav} />
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

function Toast({ message }: { message: string | null }) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-[60] flex justify-center px-4" style={{ bottom: 96 }} aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl"
            style={{ background: "#160a2e", boxShadow: "0 12px 32px rgba(22,10,46,0.35)", fontFamily: "'Inter', sans-serif" }}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <CheckCircle size={16} color="#b87fff" strokeWidth={2.4} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
