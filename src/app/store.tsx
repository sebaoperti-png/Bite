import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MEALS, withFee, type Meal } from "./data";
import { t, tMaybe, locale } from "../shared/i18n";

/**
 * Demo data layer for the app. Everything a visitor does (bookings, chats, published listings,
 * saved meals, profile edits) is kept in this browser's localStorage, so the demo behaves like a
 * real product across reloads. "Reset demo data" in Profile → Settings puts everything back.
 */

const STORAGE_KEY = "bite_demo_v4"; // bumped when the seed messages change, so old saved demos start fresh

export interface ChatMessage { id: string; sender: "me" | "them"; text: string; at: number }
export interface Conversation { id: string; name: string; avatar: string; mealId?: string; messages: ChatMessage[]; unread: number }
export interface Booking {
  id: string; mealId: string; guests: number; total: number; note: string; at: number;
  status: "confirmed" | "cancelled"; conversationId: string; rating?: number;
  /** Set when someone else booked one of *your* listings */
  guest?: { name: string; avatar: string };
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
      return SEED;
    }
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...SEED, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return SEED;
}

interface Store extends Data {
  meals: Meal[];
  mealById: (id: string) => Meal | undefined;
  seatsLeft: (meal: Meal) => number;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;
  book: (meal: Meal, guests: number, note: string) => Booking;
  cancelBooking: (id: string) => void;
  /** Accept or decline a guest's request to join one of your listings */
  answerRequest: (bookingId: string, accept: boolean) => void;
  rateBooking: (id: string, stars: number) => void;
  publish: (meal: Omit<Meal, "id">) => Meal;
  unpublish: (id: string) => void;
  openConversation: (meal: Meal) => string;
  sendMessage: (conversationId: string, text: string) => void;
  markRead: (conversationId: string) => void;
  markAllRead: () => void;
  typing: Record<string, boolean>;
  unreadTotal: number;
  updateProfile: (p: Partial<Profile>) => void;
  reset: () => void;
  signIn: (account: Account) => void;
  signOut: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
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
      return booking;
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
    openConversation,
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
    updateProfile: (p) => setData((d) => ({ ...d, profile: { ...d.profile, ...p } })),
    reset: () => {
      setData((d) => ({ ...SEED, account: d.account, profile: { ...SEED.profile, name: d.account?.name ?? SEED.profile.name } }));
      try { localStorage.removeItem("bite_hosting_draft"); } catch { /* ignore */ }
      showToast(t("Demo data reset"));
    },
    signIn: (account) => {
      setData((d) => ({ ...d, account, profile: { ...d.profile, name: account.name } }));
    },
    signOut: () => {
      setData((d) => ({ ...d, account: null }));
    },
    toast,
    showToast,
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
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
