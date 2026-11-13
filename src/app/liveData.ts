import { supabase } from "../shared/supabase";
import { approximateSpot } from "./geocode";
import { labelForISO, SERVICE_FEE, type Meal, type ServiceType } from "./data";
import type { Booking, Conversation, Person, ReportInput } from "./store";

/**
 * Live mode data: meals, bookings, chats and likes from Supabase, translated into the same shapes the
 * demo uses (Meal, Booking, Conversation), so every screen works unchanged in both modes.
 * What a person may see or change is decided by the database rules (supabase/migrations), not here.
 */

/** A round avatar with the person's initial (same look as the hosting flow's) */
export function initialAvatar(name: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b21d9"/><stop offset="1" stop-color="#9b4aff"/></linearGradient></defs><rect width="160" height="160" fill="url(#g)"/><text x="80" y="104" font-family="Inter,Arial,sans-serif" font-size="72" font-weight="800" fill="#fff" text-anchor="middle">${(name.charAt(0) || "B").toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Used when a meal has no photo */
const FALLBACK_IMAGE = "app/img/1554054204-800x533.jpg";

const pad = (n: number) => String(n).padStart(2, "0");
/** "2026-11-20" in the viewer's time zone */
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export interface MealRow {
  id: string; host_id: string; title: string; description: string; service_type: ServiceType;
  price_cents: number; seats: number; starts_at: string; city: string; area: string;
  lat: number | null; lng: number | null; tags: string[]; image_url: string | null; gallery: string[];
  cost_proof: Meal["costProof"] | null; status: "draft" | "published" | "cancelled";
  host_name: string; host_photo: string | null; host_verified: boolean; host_bio: string | null;
  seats_left: number; host_rating: number | null; host_reviews: number;
}

export function mealFromRow(r: MealRow, me: string | null, address?: string): Meal & { seatsLeft: number } {
  const start = new Date(r.starts_at);
  const place = [r.area, r.city].filter(Boolean).join(", ");
  return {
    id: r.id,
    title: r.title,
    host: r.host_name || "Bite host",
    hostAvatar: r.host_photo || initialAvatar(r.host_name),
    rating: Number(r.host_rating ?? 0),
    reviews: r.host_reviews ?? 0,
    price: r.price_cents / 100,
    seats: r.seats,
    serviceType: r.service_type,
    image: r.image_url || FALLBACK_IMAGE,
    gallery: r.gallery ?? [],
    tags: r.tags ?? [],
    // the exact address only for the host and confirmed guests (the database decides who gets it)
    location: address ? `${address}, ${r.city}` : place,
    time: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    date: labelForISO(isoDay(start)),
    description: r.description,
    hostBio: r.host_bio ?? "",
    costProof: r.cost_proof ?? undefined,
    ownedByMe: !!me && r.host_id === me,
    hostId: r.host_id,
    city: r.city,
    lat: r.lat ?? undefined,
    lng: r.lng ?? undefined,
    hostVerified: r.host_verified,
    startsAt: r.starts_at,
    cancelled: r.status === "cancelled",
    seatsLeft: r.seats_left,
  };
}

/** a one-to-one relation comes back as an object or a one-item array, depending on the schema cache */
const one = <T,>(x: T | T[] | null | undefined): T | undefined => (Array.isArray(x) ? x[0] : x ?? undefined);

/** bookings with both reviews; if the database has not got the guest reviews yet (migration 0007), without them */
async function fetchBookings() {
  const full = await supabase.from("bookings").select("*, guest:profiles!bookings_guest_id_fkey(name,photo_url), review:reviews(rating,comment), guest_review:guest_reviews(rating,comment)").order("created_at", { ascending: false });
  if (!full.error) return full;
  return supabase.from("bookings").select("*, guest:profiles!bookings_guest_id_fkey(name,photo_url), review:reviews(rating,comment)").order("created_at", { ascending: false });
}

/** Everything the signed-in person needs, in one go */
export async function fetchAll(me: string) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
  const [mealsRes, addrRes, bookingsRes, convRes, likesRes, blocksRes] = await Promise.all([
    supabase.from("meal_cards").select("*").gte("starts_at", since).order("starts_at"),
    supabase.from("meal_addresses").select("meal_id,address"),
    fetchBookings(),
    supabase.from("conversations").select("*, host:profiles!conversations_host_id_fkey(name,photo_url), guest:profiles!conversations_guest_id_fkey(name,photo_url), messages(id,sender_id,body,created_at,read_at)").order("created_at", { ascending: false }),
    supabase.from("likes").select("meal_id"),
    supabase.from("blocks").select("blocked_id, person:profiles!blocks_blocked_id_fkey(name,photo_url)"),
  ]);
  const err = mealsRes.error || addrRes.error || bookingsRes.error || convRes.error || likesRes.error || blocksRes.error;
  if (err) throw err;

  const addresses = new Map((addrRes.data ?? []).map((a) => [a.meal_id as string, a.address as string]));
  const mealRows = (mealsRes.data ?? []) as MealRow[];
  const meals = mealRows.map((r) => mealFromRow(r, me, addresses.get(r.id)));
  const seatsLeft: Record<string, number> = Object.fromEntries(meals.map((m) => [m.id, m.seatsLeft]));
  const hostOf = new Map(mealRows.map((r) => [r.id, r.host_id]));

  // conversations: one per (meal, guest); shown with the other person's name and photo
  const conversations: (Conversation & { guestId: string })[] = (convRes.data ?? []).map((c: any) => {
    const other = c.host_id === me ? c.guest : c.host;
    const msgs = [...(c.messages ?? [])].sort((a: any, b: any) => a.created_at.localeCompare(b.created_at));
    return {
      id: c.id,
      name: other?.name || "Bite",
      avatar: other?.photo_url || initialAvatar(other?.name || "B"),
      mealId: c.meal_id,
      guestId: c.guest_id,
      otherId: c.host_id === me ? c.guest_id : c.host_id,
      messages: msgs.map((m: any) => ({ id: m.id, sender: m.sender_id === me ? "me" : "them", text: m.body, at: Date.parse(m.created_at) })),
      unread: msgs.filter((m: any) => m.sender_id !== me && !m.read_at).length,
    };
  });
  // newest activity first
  conversations.sort((a, b) => (b.messages[b.messages.length - 1]?.at ?? 0) - (a.messages[a.messages.length - 1]?.at ?? 0));
  const convFor = (mealId: string, guestId: string) => conversations.find((c) => c.mealId === mealId && c.guestId === guestId)?.id ?? "";

  const pending: string[] = [];
  const bookings: Booking[] = (bookingsRes.data ?? []).map((b: any) => {
    const iAmHost = hostOf.get(b.meal_id) === me && b.guest_id !== me;
    if (iAmHost && b.status === "requested") pending.push(b.id);
    return {
      id: b.id,
      mealId: b.meal_id,
      guests: b.seats,
      total: b.total_cents / 100,
      note: b.note,
      at: Date.parse(b.created_at),
      // the screens know two states; "waiting for the host" and "declined" are carried in `live`
      status: b.status === "requested" || b.status === "confirmed" ? "confirmed" : "cancelled",
      live: b.status,
      conversationId: convFor(b.meal_id, b.guest_id),
      rating: one(b.review)?.rating ?? undefined,
      comment: one(b.review)?.comment || undefined,
      guestRating: iAmHost ? one(b.guest_review)?.rating ?? undefined : undefined,
      guestComment: iAmHost ? one(b.guest_review)?.comment || undefined : undefined,
      guest: iAmHost ? { name: b.guest?.name || "Guest", avatar: b.guest?.photo_url || initialAvatar(b.guest?.name || "G"), id: b.guest_id } : undefined,
    } as Booking;
  });

  const liked = (likesRes.data ?? []).map((l) => l.meal_id as string);
  const blocked: Person[] = (blocksRes.data ?? []).map((b: any) => ({ id: b.blocked_id, name: b.person?.name || "Bite", avatar: b.person?.photo_url || initialAvatar(b.person?.name || "B") }));
  return { meals, seatsLeft, conversations, bookings, pending, liked, blocked };
}

// ---------------------------------------------------------------- writes

/** data: URL → uploaded file in Storage → public URL. Remote URLs are kept as they are. */
async function uploadPhoto(me: string, mealId: string, idx: number, src: string): Promise<string> {
  if (!src.startsWith("data:")) return src;
  const blob = await (await fetch(src)).blob();
  const path = `${me}/${mealId}-${idx}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("meal-photos").upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return supabase.storage.from("meal-photos").getPublicUrl(path).data.publicUrl;
}

/**
 * Meals saved without coordinates (the place service was down when they were published, or older meals) get
 * their town's position here, so they still show on the map and in a "near Aalen" search.
 */
export async function fillCoords<M extends Meal>(meals: M[]): Promise<Map<string, { lat: number; lng: number }>> {
  const out = new Map<string, { lat: number; lng: number }>();
  const towns = [...new Set(meals.filter((m) => m.lat == null && m.city).map((m) => m.city!))];
  const spots = await Promise.all(towns.map((c) => approximateSpot(c).catch(() => null)));
  const byTown = new Map(towns.map((c, i) => [c, spots[i]]));
  for (const m of meals) {
    const s = m.lat == null && m.city ? byTown.get(m.city) : null;
    if (s) out.set(m.id, s);
  }
  return out;
}

export interface NewMeal {
  id: string; title: string; description: string; serviceType: ServiceType; price: number; seats: number;
  dateISO: string; time: string; city: string; area: string; address: string; tags: string[];
  image?: string; gallery: string[]; costProof?: Meal["costProof"];
}

export async function publishMeal(me: string, m: NewMeal) {
  // where the meal shows on the map: the town's centre, rounded to ~1 km (never the street)
  const spot = await approximateSpot(m.city).catch(() => null);
  const photos = [m.image, ...m.gallery].filter(Boolean) as string[];
  const urls = await Promise.all(photos.map((p, i) => uploadPhoto(me, m.id, i, p)));
  const startsAt = new Date(`${m.dateISO}T${m.time || "19:00"}`).toISOString();
  const { error } = await supabase.from("meals").insert({
    id: m.id, host_id: me, title: m.title.slice(0, 80), description: m.description, service_type: m.serviceType,
    price_cents: Math.round(m.price * 100), seats: m.seats, starts_at: startsAt, city: m.city, area: m.area,
    tags: m.tags, lat: spot?.lat ?? null, lng: spot?.lng ?? null, image_url: urls[0] ?? null, gallery: urls.slice(1), cost_proof: m.costProof ?? null, status: "published",
  });
  if (error) throw error;
  const addr = await supabase.from("meal_addresses").insert({ meal_id: m.id, address: m.address });
  if (addr.error) throw addr.error;
}

export const cancelMeal = (id: string) => supabase.from("meals").update({ status: "cancelled" }).eq("id", id);
export const requestBooking = (mealId: string, seats: number, note: string) => supabase.rpc("request_booking", { p_meal: mealId, p_seats: seats, p_note: note });
export const answerBooking = (id: string, accept: boolean) => supabase.rpc("answer_booking", { p_booking: id, p_accept: accept });
export const cancelBooking = (id: string) => supabase.rpc("cancel_booking", { p_booking: id });
export const reviewBooking = (id: string, rating: number, comment = "") => supabase.rpc("review_booking", { p_booking: id, p_rating: rating, p_comment: comment });
export const reviewGuest = (id: string, rating: number, comment = "") => supabase.rpc("review_guest", { p_booking: id, p_rating: rating, p_comment: comment });

export interface HostReview { rating: number; comment: string; at: number; author: string; photo: string; meal: string }
/** the reviews on a host's page (public: first names only) */
export async function fetchHostReviews(hostId: string): Promise<HostReview[]> {
  const { data, error } = await supabase.rpc("host_review_list", { p_host: hostId });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ rating: r.rating, comment: r.comment ?? "", at: Date.parse(r.created_at), author: r.author || "Guest", photo: r.author_photo || initialAvatar(r.author || "G"), meal: r.meal_title }));
}
/** what a host sees about a guest asking for a seat */
export async function fetchGuestRating(guestId: string): Promise<{ rating: number; reviews: number } | null> {
  const { data, error } = await supabase.rpc("guest_rating", { p_guest: guestId });
  if (error) return null;
  const r = Array.isArray(data) ? data[0] : data;
  return r && r.reviews > 0 ? { rating: Number(r.rating), reviews: r.reviews } : null;
}
export const startConversation = (mealId: string) => supabase.rpc("start_conversation", { p_meal: mealId });
export const sendMessage = (me: string, conversationId: string, body: string) => supabase.from("messages").insert({ conversation_id: conversationId, sender_id: me, body });
export const markRead = (conversationId: string) => supabase.rpc("mark_read", { p_conversation: conversationId });
export const like = (me: string, mealId: string, on: boolean) =>
  on ? supabase.from("likes").insert({ user_id: me, meal_id: mealId }) : supabase.from("likes").delete().eq("user_id", me).eq("meal_id", mealId);

// ---------------------------------------------------------------- safety

export async function fileReport(me: string, r: ReportInput) {
  const reason = [r.details.trim(), r.context].filter(Boolean).join("\n\n") || r.category;
  return supabase.from("reports").insert({
    reporter_id: me, category: r.category, reason: reason.padEnd(3, ".").slice(0, 2000),
    meal_id: r.mealId ?? null, user_id: r.personId ?? null, message_id: r.messageId && !r.messageId.startsWith("tmp-") ? r.messageId : null,
  });
}
export const blockPerson = (me: string, id: string) => supabase.from("blocks").insert({ blocker_id: me, blocked_id: id });
export const unblockPerson = (me: string, id: string) => supabase.from("blocks").delete().eq("blocker_id", me).eq("blocked_id", id);
export const acceptHouseRules = () => supabase.rpc("accept_house_rules");

/** Friendly text for errors coming back from the database functions */
export function dataError(message: string | undefined, t: (s: string) => string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("photo before")) return t("Add your name and a photo first, so your host or guests know who you are.");
  if (m.includes("house rules")) return t("Please accept the house rules before you host.");
  if (m.includes("too many reports")) return t("You sent many reports today. Write to hello@bitetable.de if something is urgent.");
  if (m.includes("not enough seats")) return t("Sorry, those seats were just taken.");
  if (m.includes("already have a booking")) return t("You already asked for a seat at this table.");
  if (m.includes("already started")) return t("This meal has already started.");
  if (m.includes("not available")) return t("This meal is no longer available.");
  if (m.includes("own meal")) return t("This is your own meal.");
  if (m.includes("already answered")) return t("You already answered this request.");
  if (m.includes("attended")) return t("You can rate a meal after you attended it.");
  if (m.includes("already have") && m.includes("guests")) return t("You already have more guests than that.");
  if (m.includes("failed to fetch") || m.includes("network")) return t("No connection. Check your internet and try again.");
  return t("Something went wrong. Please try again.");
}

export const FEE = SERVICE_FEE;
