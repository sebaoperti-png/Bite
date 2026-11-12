import type { User } from "@supabase/supabase-js";
import { supabase } from "../shared/supabase";
import { t, getLang } from "../shared/i18n";
import type { Account, Profile } from "./store";

/**
 * Real accounts (live mode). Sign-up and log-in with email + password through Supabase Auth.
 * The password goes straight to Supabase over HTTPS and is never stored by Bite.
 * The store listens to Supabase's auth events, so after any of these calls the app updates by itself.
 */

/** Where the confirmation and password-reset emails send people back to */
const backToApp = () => `${window.location.origin}${window.location.pathname}?live`;

/** Supabase's English error messages, turned into friendly, translated ones */
export function authError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return t("Wrong email or password.");
  if (m.includes("email not confirmed")) return t("Please confirm your email first: we sent you a link.");
  if (m.includes("already registered") || m.includes("already been registered")) return t("There is already an account with this email. Log in instead.");
  if (m.includes("password") && (m.includes("at least") || m.includes("weak") || m.includes("short"))) return t("Choose a stronger password (at least 8 characters, letters and numbers).");
  if (m.includes("rate limit") || m.includes("too many")) return t("Too many attempts. Please wait a few minutes and try again.");
  if (m.includes("failed to fetch") || m.includes("network")) return t("No connection. Check your internet and try again.");
  return t("Something went wrong. Please try again.");
}

export type AuthResult = { ok: boolean; error?: string; needsConfirmation?: boolean };

export async function liveSignUp(name: string, email: string, password: string, news: boolean): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // `lang` picks the language of Bite's emails (supabase/email-templates)
    options: { data: { name, news, lang: getLang() }, emailRedirectTo: backToApp() },
  });
  if (error) return { ok: false, error: authError(error.message) };
  // Supabase answers "ok" with an empty identities list when the email is already taken (so nobody can
  // find out which emails have accounts); tell the person gently to log in instead.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: t("There is already an account with this email. Log in instead.") };
  }
  return { ok: true, needsConfirmation: !data.session };
}

export async function liveSignIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: authError(error.message) };
  // keep the email language in step with the language the person uses the app in
  if (data.user && data.user.user_metadata?.lang !== getLang()) void supabase.auth.updateUser({ data: { lang: getLang() } });
  return { ok: true };
}

export async function liveResetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: backToApp() });
  return error ? { ok: false, error: authError(error.message) } : { ok: true };
}

export async function liveSetNewPassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, error: authError(error.message) } : { ok: true };
}

export async function liveSignOut() {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------- profile <-> database

interface ProfileRow {
  id: string; name: string; bio: string; photo_url: string | null; dietary: string[];
  city: string; postal_code: string; country: string; notifications: boolean; news: boolean; host_rules_at: string | null;
}

export function accountFromUser(user: User, row?: Partial<ProfileRow> | null): Account {
  return { name: row?.name || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "", email: user.email ?? "" };
}

export function profileFromRow(row: Partial<ProfileRow> | null, fallbackName: string): Profile {
  const city = row?.city ?? "";
  const country = row?.country || "Germany";
  return {
    name: row?.name || fallbackName,
    bio: row?.bio ?? "",
    photo: row?.photo_url ?? undefined,
    dietary: row?.dietary ?? [],
    neighbourhood: city ? `${city}, ${country}` : country,
    country,
    city,
    postalCode: row?.postal_code ?? "",
    notifications: row?.notifications ?? true,
    news: row?.news ?? false,
    hostRulesAt: row?.host_rules_at ?? undefined,
  };
}

export async function loadProfile(userId: string): Promise<Partial<ProfileRow> | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Partial<ProfileRow> | null;
}

/** Save the parts of the profile the person changed */
export async function saveProfile(userId: string, p: Partial<Profile>) {
  const row: Partial<ProfileRow> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.bio !== undefined) row.bio = p.bio;
  if ("photo" in p) row.photo_url = p.photo ?? null;
  if (p.dietary !== undefined) row.dietary = p.dietary;
  if (p.city !== undefined) row.city = p.city;
  if (p.postalCode !== undefined) row.postal_code = p.postalCode;
  if (p.country !== undefined) row.country = p.country;
  if (p.notifications !== undefined) row.notifications = p.notifications;
  if (p.news !== undefined) row.news = p.news;
  if (Object.keys(row).length === 0) return { error: null };
  return supabase.from("profiles").update(row).eq("id", userId);
}
