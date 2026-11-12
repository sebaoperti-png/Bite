import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MEALS, withFee, type Meal } from "./data";
import { t, tMaybe, locale } from "../shared/i18n";
import { IS_LIVE, supabase } from "../shared/supabase";
import { BiteLoader } from "../shared/Restaurant";
import { accountFromUser, liveSignOut, loadProfile, profileFromRow, saveProfile } from "./liveAuth";
import * as L from "./liveData";

/**
 * Demo data layer for the app. Everything a visitor does (bookings, chats, published listings,
 * saved meals, profile edits) is kept in this browser's localStorage, so the demo behaves like a
 * real product across reloads. "Reset demo data" in Profile → Settings puts everything back.
 */

// bumped when the seed messages change, so old saved demos start fresh.
// Live mode keeps its own key so the demo's made-up bookings and chats never mix with a real account.
const STORAGE_KEY = IS_LIVE ? "bite_live_v1" : "bite_demo_v4";

export interface ChatMessage { id: string; sender: "me" | "them"; text: string; at: number }
export interface Conversation { id: string; name: string; avatar: string; mealId?: string; messages: ChatMessage[]; unread: number }
export interface Booking {
  id: string; mealId: string; guests: number; total: number; note: string; at: number;
  status: "confirmed" | "cancelled"; conversationId: string; rating?: number;
  /** Set when someone else booked one of *your* listings */
  guest?: { name: string; avatar: string };
  /** Live mode: the real state in the database ("requested" = waiting for the host) */
  live?: "requested" | "confirmed" | "declined" | "cancelled";
}
export interface Profile { name: string; bio: string; /** square photo as a data URL, chosen in the browser */ photo?: string; dietary: string[]; neighbourhood: string; country?: string; city?: string; postalCode?: string; notifications: boolean; news?: boolean }
export interface Account { name: string; email: string }

interface Data {
  published: Meal[];
  liked: string[];
  bookings: Booking[];
  conversations: Conversation[];
  profile: Profile;
  /** Demo sign-in: nothing leaves the browser, the password is never stored */
  account: Account | null;
  /** Guest bookings on your listings that wait for you to accept them ("you choose who sits at your table") */
  pending?: string[];
}

const ago = (min: number) => Date.now() - min * 60_000;
const uid = () => Math.random().toString(36).slice(2, 10);

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "c-maria", name: "Maria K.", mealId: "1", unread: 2,
    avatar: "app/img/1556911073-160x160.jpg",
    messages: [
      { id: "m1", sender: "me", text: "Hi Maria! Is the green curry very spicy?", at: ago(70) },
      { id: "m2", sender: "them", text: "Medium! I can make yours milder, just tell me.", at: ago(62) },
      { id: "m3", sender: "them", text: "Hi! So excited you're joining", at: ago(60) },
    ],
  },
  {
    id: "c-amina", name: "Amina S.", mealId: "3", unread: 0,
    avatar: "app/img/1556911220-160x160.jpg",
    messages: [
      { id: "m1", sender: "me", text: "Should I bring anything for the tagine night?", at: ago(60 * 26) },
      { id: "m2", sender: "them", text: "Just bring yourself and an appetite!", at: ago(60 * 25) },
    ],
  },
  {
    id: "c-yuki", name: "Yuki T.", mealId: "7", unread: 1,
    avatar: "app/img/1534528741775-160x160.jpg",
    messages: [
      { id: "m1", sender: "them", text: "Your poke bowl will be ready at 12:30", at: ago(60 * 50) },
    ],
  },
];

export const DEMO_ACCOUNT: Account = { name: "Sebastiano O.", email: "sebastiano@bite.demo" };

const SEED: Data = {
  published: [],
  liked: [],
  bookings: [],
  conversations: SEED_CONVERSATIONS,
  profile: {
    name: "Sebastiano O.",
    bio: "Founder of Bite. Italian in Germany — I believe the best meals in any city are cooked in its homes, and shared with the neighbours next door.",
    dietary: ["Vegetarian"],
    neighbourhood: "Germany",
    country: "Germany",
    city: "",
    postalCode: "",
    notifications: true,
  },
  // The demo opens already signed in; "Log out" in Profile shows the log-in / sign-up screen
  account: DEMO_ACCOUNT,
};


/** Live mode starts empty: no demo chats, no demo account. The real account arrives from Supabase. */
const LIVE_SEED: Data = {
  ...SEED,
  conversations: [],
  account: null,
  profile: { name: "", bio: "", dietary: [], neighbourhood: "Germany", country: "Germany", city: "", postalCode: "", notifications: true, news: false },
};

/** "Sebastiano Operti" → "Sebastiano O." */
export function shortName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

/** Picks a believable host answer for the guest's message */
// Replies are stored in English and translated when shown (ChatScreen renders t(message.text)); German messages are understood too
function replyFor(text: string, fallbackIdx: number) {
  const t = text.toLowerCase();
  if (/(wine|beer|drink|bring|wein|bier|getränk|mitbring)/.test(t)) return "Of course! A bottle of wine is always welcome — I'll have glasses ready.";
  if (/(vegetarian|vegetarisch|vegetarier|vegan|allerg|gluten|nut|nuss|lactose|laktose|dairy|halal)/.test(t)) return "Thanks for telling me! I'll prepare yours accordingly and keep everything separate.";
  if (/(time|when|late|early|uhr|zeit|wann|spät|früh|\d{1,2}[:.]\d{2})/.test(t)) return "That time works perfectly — just message me if you're running late.";
  if (/(where|address|ring|bell|floor|parking|wo |adresse|klingel|stock|parken)/.test(t)) return "I'll send the exact doorbell name the day before. It's 2 minutes from the U-Bahn.";
  if (/(thank|danke|grazie|great|perfect|see you|bis dann|super|perfekt)/.test(t)) return "See you soon!";
  if (/(friend|freund|begleitung|plus one|\+1|extra seat)/.test(t)) return "Happy to have them! Just add a seat on the booking so they're covered too.";
  return HOST_REPLIES[fallbackIdx % HOST_REPLIES.length];
}

const HOST_REPLIES = [
  "Sounds great! See you then.",
  "Perfect, I'll make sure everything is ready for you.",
  "Of course — just let me know if anything changes.",
  "Lovely! I'll send you the exact doorbell name the day before.",
  "Great question — yes, that's totally fine",
];

/** Demo neighbours who book the listings you publish */
const DEMO_GUESTS = [
  { name: "Clara S.", avatar: "app/img/1529626455594-160x160.jpg", seats: 2, delay: 6000, hello: (title: string) => t("Hi! We'd love to join {title} with 2 seats — so excited. Is it OK if my partner is vegetarian?", { title: t(title) }) },
  { name: "Ben K.", avatar: "app/img/1507003211169-160x160.jpg", seats: 1, delay: 15000, hello: (title: string) => t("Hey, booked a seat for {title}! Can I bring dessert?", { title: t(title) }) },
];

function load(): Data {
  // bite.html?reset → start the demo from scratch (handy right before a presentation)
  try {
    if (new URLSearchParams(window.location.search).has("reset")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("bite_hosting_draft");
      return IS_LIVE ? LIVE_SEED : SEED;
    }
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // in live mode the account and profile always come from Supabase, never from the browser
    if (raw) return IS_LIVE ? { ...LIVE_SEED, ...JSON.parse(raw), account: null, profile: LIVE_SEED.profile } : { ...SEED, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return IS_LIVE ? LIVE_SEED : SEED;
}

interface Store extends Data {
  meals: Meal[];
  mealById: (id: string) => Meal | undefined;
  seatsLeft: (meal: Meal) => number;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;
  /** Demo: confirmed at once. Live: a request the host accepts or declines (Booking.live === "requested"). */
  book: (meal: Meal, guests: number, note: string) => Promise<Booking>;
  cancelBooking: (id: string) => void;
  /** Accept or decline a guest's request to join one of your listings */
  answerRequest: (bookingId: string, accept: boolean) => void;
  rateBooking: (id: string, stars: number) => void;
  publish: (meal: Omit<Meal, "id">) => Meal;
  unpublish: (id: string) => void;
  openConversation: (meal: Meal) => Promise<string>;
  /** live mode: data is being loaded the first time */
  loading: boolean;
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
  markAllRead: () => void;
  typing: Record<string, boolean>;
  unreadTotal: number;
  updateProfile: (p: Partial<Profile>) => void;
  reset: () => void;
  signIn: (account: Account) => void;
  signOut: () => void;
  /** true when this browser is connected to the real backend (bite.html?live) */
  live: boolean;
  /** live mode: the person opened the password-reset link and must choose a new password */
  recovering: boolean;
  doneRecovering: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  // live mode: wait until Supabase has told us whether someone is signed in, so the app opens on the right screen
  const [ready, setReady] = useState(!IS_LIVE);
  const [recovering, setRecovering] = useState(false);
  const userId = useRef<string | null>(null);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const [me, setMe] = useState<string | null>(null);
  type LiveState = Awaited<ReturnType<typeof L.fetchAll>>;
  const EMPTY_LIVE: LiveState = { meals: [], seatsLeft: {}, conversations: [], bookings: [], pending: [], liked: [] };
  const [live, setLive] = useState<LiveState>(EMPTY_LIVE);
  const [liveLoading, setLiveLoading] = useState(IS_LIVE);
  // meals published from this device that are still uploading (shown at once, replaced by the real row)
  const [optimistic, setOptimistic] = useState<Meal[]>([]);
  const refreshTimer = useRef<number>();

  const refresh = useCallback(async () => {
    if (!IS_LIVE) return;
    const uid = userId.current;
    try {
      if (!uid) {
        // visitors who are not signed in can still browse the published meals
        const { data: rows } = await supabase.from("meal_cards").select("*").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at");
        const meals = ((rows ?? []) as L.MealRow[]).map((r) => L.mealFromRow(r, null));
        setLive({ ...EMPTY_LIVE, meals, seatsLeft: Object.fromEntries(meals.map((m) => [m.id, m.seatsLeft])) });
      } else {
        setLive(await L.fetchAll(uid));
      }
    } catch {
      // keep what we have; the next change or reload tries again
    } finally {
      setLiveLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  refreshRef.current = refresh;
  const refreshSoon = useCallback(() => {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => void refresh(), 250);
  }, [refresh]);

  // live: reload whenever the signed-in person changes, and listen for new messages and booking changes
  useEffect(() => {
    if (!IS_LIVE) return;
    void refresh();
    if (!me) return;
    const channel = supabase.channel(`bite-${me}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, refreshSoon)
      .subscribe();
    // also refresh when the person comes back to the app
    const onFocus = () => refreshSoon();
    window.addEventListener("focus", onFocus);
    return () => { void supabase.removeChannel(channel); window.removeEventListener("focus", onFocus); };
  }, [me, refresh, refreshSoon]);

  useEffect(() => {
    if (!IS_LIVE) return;
    let cancelled = false;
    const apply = async (user: import("@supabase/supabase-js").User | null) => {
      if (!user) {
        userId.current = null;
        setMe(null);
        if (!cancelled) setData((d) => ({ ...d, account: null, profile: LIVE_SEED.profile }));
        return;
      }
      userId.current = user.id;
      setMe(user.id);
      const row = await loadProfile(user.id);
      if (cancelled) return;
      const account = accountFromUser(user, row);
      setData((d) => ({ ...d, account, profile: profileFromRow(row, account.name) }));
    };
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await apply(session?.user ?? null);
      // load meals, bookings and chats before the first screen, so links like bite.html?meal=… open directly
      await refreshRef.current();
      if (!cancelled) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // run outside the auth callback (Supabase recommends not awaiting other calls inside it)
        window.setTimeout(() => { void apply(session?.user ?? null); }, 0);
      }
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();
  const replyCount = useRef(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
  }, [data]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const meals = useMemo(() => [...data.published, ...MEALS], [data.published]);
  const mealById = useCallback((id: string) => meals.find((m) => m.id === id), [meals]);

  const seatsLeft = useCallback((meal: Meal) => {
    const taken = data.bookings.filter((b) => b.mealId === meal.id && b.status === "confirmed").reduce((n, b) => n + b.guests, 0);
    return Math.max(0, meal.seats - taken);
  }, [data.bookings]);

  const pushMessage = (conversationId: string, msg: ChatMessage, unread = false) =>
    setData((d) => ({
      ...d,
      conversations: d.conversations.map((c) => c.id === conversationId ? { ...c, messages: [...c.messages, msg], unread: unread ? c.unread + 1 : c.unread } : c),
    }));

  // The host "answers" a moment later, so the chat feels alive during a demo
  const hostReply = (conversationId: string, text: string, delay = 2000) => {
    window.setTimeout(() => setTyping((t) => ({ ...t, [conversationId]: true })), 700);
    window.setTimeout(() => {
      setTyping((t) => ({ ...t, [conversationId]: false }));
      pushMessage(conversationId, { id: uid(), sender: "them", text, at: Date.now() }, true);
    }, delay);
  };

  const openConversation = (meal: Meal) => {
    const existing = data.conversations.find((c) => c.name === meal.host);
    if (existing) return existing.id;
    const conv: Conversation = { id: `c-${uid()}`, name: meal.host, avatar: meal.hostAvatar, mealId: meal.id, messages: [], unread: 0 };
    setData((d) => d.conversations.some((c) => c.name === meal.host) ? d : { ...d, conversations: [conv, ...d.conversations] });
    return conv.id;
  };

  const store: Store = {
    ...data,
    meals,
    mealById,
    seatsLeft,
    isLiked: (id) => data.liked.includes(id),
    toggleLike: (id) => {
      const on = !data.liked.includes(id);
      setData((d) => ({ ...d, liked: on ? [...d.liked, id] : d.liked.filter((x) => x !== id) }));
      showToast(on ? t("Saved to your favourites") : t("Removed from favourites"));
    },
    book: (meal, guests, note) => {
      const existing = data.conversations.find((c) => c.name === meal.host);
      const conversationId = existing?.id ?? `c-${uid()}`;
      const total = Math.round(withFee(meal.price) * guests * 100) / 100;
      const booking: Booking = { id: `b-${uid()}`, mealId: meal.id, guests, total, note, at: Date.now(), status: "confirmed", conversationId };
      const intro: ChatMessage = {
        id: uid(), sender: "me", at: Date.now(),
        text: note.trim() || (guests > 1
          ? t("Hi {name}! I just booked {n} seats for {title}. Looking forward to it!", { name: meal.host.split(" ")[0], n: guests, title: tMaybe(meal.title) })
          : t("Hi {name}! I just booked a seat for {title}. Looking forward to it!", { name: meal.host.split(" ")[0], title: tMaybe(meal.title) })),
      };
      setData((d) => {
        const conversations = existing
          ? d.conversations.map((c) => c.id === conversationId ? { ...c, mealId: meal.id, messages: [...c.messages, intro] } : c)
          : [{ id: conversationId, name: meal.host, avatar: meal.hostAvatar, mealId: meal.id, messages: [intro], unread: 0 }, ...d.conversations];
        return { ...d, bookings: [booking, ...d.bookings], conversations };
      });
      hostReply(conversationId, t("Hi! So happy you're joining for {title} Any allergies I should know about? The address is {address}.", { title: tMaybe(meal.title), address: meal.location }), 2400);
      return Promise.resolve(booking);
    },
    answerRequest: (bookingId, accept) => {
      const b = data.bookings.find((x) => x.id === bookingId);
      setData((d) => ({
        ...d,
        pending: (d.pending ?? []).filter((x) => x !== bookingId),
        bookings: accept ? d.bookings : d.bookings.map((x) => (x.id === bookingId ? { ...x, status: "cancelled" } : x)),
      }));
      if (b?.guest) showToast(accept ? t("You said yes to {name} — say hi in the chat", { name: b.guest.name.split(" ")[0] }) : t("Request declined — {name} gets a full refund", { name: b.guest.name.split(" ")[0] }));
    },
    cancelBooking: (id) => {
      setData((d) => ({ ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, status: "cancelled" } : b) }));
      showToast(t("Booking cancelled — full refund on its way"));
    },
    rateBooking: (id, stars) => {
      setData((d) => ({ ...d, bookings: d.bookings.map((b) => b.id === id ? { ...b, rating: stars } : b) }));
      showToast(t("Thanks! You rated this meal {n}★", { n: stars }));
    },
    publish: (m) => {
      const meal: Meal = { ...m, id: `p-${uid()}` };
      setData((d) => ({ ...d, published: [meal, ...d.published] }));
      // A couple of neighbours book the new listing a few seconds later, so the host side comes alive
      let seatsLeft = meal.seats;
      DEMO_GUESTS.forEach((g, gi) => {
        if (g.seats > seatsLeft) return;
        seatsLeft -= g.seats;
        window.setTimeout(() => {
          setData((d) => {
            if (!d.published.some((p) => p.id === meal.id)) return d; // unpublished meanwhile
            const conversationId = `c-${uid()}`;
            const booking: Booking = { id: `b-${uid()}`, mealId: meal.id, guests: g.seats, total: Math.round(withFee(meal.price) * g.seats * 100) / 100, note: "", at: Date.now(), status: "confirmed", conversationId, guest: { name: g.name, avatar: g.avatar } };
            const conv: Conversation = { id: conversationId, name: g.name, avatar: g.avatar, mealId: meal.id, unread: 1, messages: [{ id: uid(), sender: "them", text: g.hello(meal.title), at: Date.now() }] };
            // the first neighbour asks to join: the host decides
            return { ...d, bookings: [booking, ...d.bookings], conversations: [conv, ...d.conversations], pending: gi === 0 ? [...(d.pending ?? []), booking.id] : d.pending };
          });
          showToast(gi === 0 ? t("{name} would like to join {title}", { name: g.name, title: tMaybe(meal.title) }) : g.seats > 1 ? t("{name} booked {n} seats for {title}", { name: g.name, n: g.seats, title: tMaybe(meal.title) }) : t("{name} booked 1 seat for {title}", { name: g.name, title: tMaybe(meal.title) }));
        }, g.delay);
      });
      return meal;
    },
    unpublish: (id) => {
      setData((d) => ({ ...d, published: d.published.filter((m) => m.id !== id) }));
      showToast(t("Listing unpublished"));
    },
    openConversation: (meal) => Promise.resolve(openConversation(meal)),
    loading: false,
    sendMessage: (conversationId, text) => {
      pushMessage(conversationId, { id: uid(), sender: "me", text, at: Date.now() });
      hostReply(conversationId, replyFor(text, replyCount.current++));
    },
    markRead: (conversationId) => {
      if (!data.conversations.find((c) => c.id === conversationId)?.unread) return;
      setData((d) => ({ ...d, conversations: d.conversations.map((c) => c.id === conversationId ? { ...c, unread: 0 } : c) }));
    },
    markAllRead: () => {
      setData((d) => ({ ...d, conversations: d.conversations.map((c) => ({ ...c, unread: 0 })) }));
      showToast(t("All caught up"));
    },
    typing,
    unreadTotal: data.conversations.reduce((n, c) => n + c.unread, 0),
    updateProfile: (p) => {
      setData((d) => ({ ...d, profile: { ...d.profile, ...p }, account: d.account && p.name ? { ...d.account, name: p.name } : d.account }));
      if (IS_LIVE && userId.current) {
        void saveProfile(userId.current, p).then(({ error }) => {
          if (error) showToast(t("Could not save your profile. Check your connection and try again."));
        });
      }
    },
    reset: () => {
      // live mode: only clears what is still kept in this browser; the real account and profile stay
      setData((d) => IS_LIVE
        ? { ...LIVE_SEED, account: d.account, profile: d.profile }
        : { ...SEED, account: d.account, profile: { ...SEED.profile, name: d.account?.name ?? SEED.profile.name } });
      try { localStorage.removeItem("bite_hosting_draft"); } catch { /* ignore */ }
      showToast(t("Demo data reset"));
    },
    signIn: (account) => {
      setData((d) => ({ ...d, account, profile: { ...d.profile, name: account.name } }));
    },
    signOut: () => {
      if (IS_LIVE) void liveSignOut();
      setData((d) => ({ ...d, account: null }));
    },
    live: IS_LIVE,
    recovering,
    doneRecovering: () => setRecovering(false),
    toast,
    showToast,
  };

  if (IS_LIVE) {
    const uid = me;
    const fail = (e: { message?: string } | null | undefined) => { showToast(L.dataError(e?.message, t)); };
    const allMeals = [...optimistic.filter((o) => !live.meals.some((m) => m.id === o.id)), ...live.meals];
    // what visitors browse: upcoming and not cancelled (own meals stay visible to the host)
    const browsable = allMeals.filter((m) => !m.cancelled && (m.ownedByMe || !m.startsAt || Date.parse(m.startsAt) > Date.now() - 60 * 60 * 1000));
    Object.assign(store, {
      meals: browsable,
      published: allMeals.filter((m) => m.ownedByMe && !m.cancelled),
      mealById: (id: string) => allMeals.find((m) => m.id === id),
      seatsLeft: (m: Meal) => live.seatsLeft[m.id] ?? m.seats,
      liked: live.liked,
      isLiked: (id: string) => live.liked.includes(id),
      toggleLike: (id: string) => {
        if (!uid) { showToast(t("Log in to save meals")); return; }
        const on = !live.liked.includes(id);
        setLive((l) => ({ ...l, liked: on ? [...l.liked, id] : l.liked.filter((x) => x !== id) }));
        showToast(on ? t("Saved to your favourites") : t("Removed from favourites"));
        void L.like(uid, id, on).then(({ error }) => { if (error) { fail(error); refreshSoon(); } });
      },
      bookings: live.bookings,
      pending: live.pending,
      conversations: live.conversations,
      unreadTotal: live.conversations.reduce((n, c) => n + c.unread, 0),
      loading: liveLoading,
      book: async (meal: Meal, guests: number, note: string) => {
        const { data: id, error } = await L.requestBooking(meal.id, guests, note.trim());
        if (error) throw new Error(L.dataError(error.message, t));
        const fresh = await L.fetchAll(uid!);
        setLive(fresh);
        const b = fresh.bookings.find((x) => x.id === id);
        if (!b) throw new Error(t("Something went wrong. Please try again."));
        return b;
      },
      answerRequest: (bookingId: string, accept: boolean) => {
        const b = live.bookings.find((x) => x.id === bookingId);
        setLive((l) => ({ ...l, pending: l.pending.filter((x) => x !== bookingId) }));
        void L.answerBooking(bookingId, accept).then(({ error }) => {
          if (error) fail(error);
          else if (b?.guest) showToast(accept ? t("You said yes to {name} — say hi in the chat", { name: b.guest.name.split(" ")[0] }) : t("Request declined. {name} will not be charged.", { name: b.guest.name.split(" ")[0] }));
          refreshSoon();
        });
      },
      cancelBooking: (id: string) => {
        void L.cancelBooking(id).then(({ error }) => {
          if (error) fail(error); else showToast(t("Booking cancelled"));
          refreshSoon();
        });
      },
      rateBooking: (id: string, stars: number) => {
        setLive((l) => ({ ...l, bookings: l.bookings.map((b) => (b.id === id ? { ...b, rating: stars } : b)) }));
        void L.reviewBooking(id, stars).then(({ error }) => {
          if (error) { fail(error); refreshSoon(); } else showToast(t("Thanks! You rated this meal {n}★", { n: stars }));
        });
      },
      publish: (m: Omit<Meal, "id">) => {
        const id = crypto.randomUUID();
        const meal: Meal = { ...m, id, ownedByMe: true, location: [m.street, m.city].filter(Boolean).join(", ") || m.location };
        setOptimistic((o) => [meal, ...o]);
        void L.publishMeal(uid!, {
          id, title: m.title, description: m.description, serviceType: m.serviceType, price: m.price, seats: m.seats,
          dateISO: m.dateISO ?? new Date().toISOString().slice(0, 10), time: m.time, city: m.city ?? "", area: "",
          address: m.street ?? m.location, tags: m.tags, image: m.image, gallery: m.gallery ?? [], costProof: m.costProof,
        }).then(() => {
          void refresh().then(() => setOptimistic((o) => o.filter((x) => x.id !== id)));
        }).catch((e) => {
          setOptimistic((o) => o.filter((x) => x.id !== id));
          showToast(t("Your meal could not be published: {reason}", { reason: L.dataError(e?.message, t) }));
        });
        return meal;
      },
      unpublish: (id: string) => {
        void L.cancelMeal(id).then(({ error }) => {
          if (error) fail(error); else showToast(t("Meal cancelled. Your guests have been told."));
          refreshSoon();
        });
      },
      openConversation: async (meal: Meal) => {
        if (!uid) throw new Error(t("Log in to message the host"));
        const { data, error } = await L.startConversation(meal.id);
        if (error) throw new Error(L.dataError(error.message, t));
        await refresh();
        return data as string;
      },
      sendMessage: (conversationId: string, text: string) => {
        const msg: ChatMessage = { id: `tmp-${uid}-${Date.now()}`, sender: "me", text, at: Date.now() };
        setLive((l) => ({ ...l, conversations: l.conversations.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, msg] } : c)) }));
        void L.sendMessage(uid!, conversationId, text).then(({ error }) => { if (error) fail(error); refreshSoon(); });
      },
      markRead: (conversationId: string) => {
        if (!live.conversations.find((c) => c.id === conversationId)?.unread) return;
        setLive((l) => ({ ...l, conversations: l.conversations.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c)) }));
        void L.markRead(conversationId);
      },
      markAllRead: () => {
        live.conversations.filter((c) => c.unread).forEach((c) => void L.markRead(c.id));
        setLive((l) => ({ ...l, conversations: l.conversations.map((c) => ({ ...c, unread: 0 })) }));
        showToast(t("All caught up"));
      },
    } satisfies Partial<Store>);
  }

  if (!ready) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "#160a2e" }}>
        <BiteLoader size={64} dark label={t("Loading…")} />
      </div>
    );
  }

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/**
 * Where a booking stands, in words (live mode knows "waiting for the host" and "declined";
 * the demo only knows confirmed / cancelled and keeps its original wording).
 */
export function bookingStatusText(b: Booking, price: string): { text: string; tone: "ok" | "wait" | "off" } {
  switch (b.live) {
    case "requested": return { text: t("Waiting for the host · {price}", { price }), tone: "wait" };
    case "confirmed": return { text: t("Confirmed · {price}", { price }), tone: "ok" };
    case "declined": return { text: t("Declined by the host · nothing to pay"), tone: "off" };
    case "cancelled": return { text: t("Cancelled · nothing to pay"), tone: "off" };
    default: return b.status === "cancelled"
      ? { text: t("Cancelled · refunded"), tone: "off" }
      : { text: t("Confirmed · {price} paid", { price }), tone: "ok" };
  }
}

/** Short time label for chat lists: "14:38", t("Yesterday"), "Mon" */
export function timeLabel(at: number) {
  const d = new Date(at);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days === 0) return d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return t("Yesterday");
  if (days < 7) return d.toLocaleDateString(locale(), { weekday: "short" });
  return d.toLocaleDateString(locale(), { day: "numeric", month: "short" });
}

/** Copy text to the clipboard (with a fallback for older browsers) */
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}
