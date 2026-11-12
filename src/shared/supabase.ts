import { createClient } from "@supabase/supabase-js";

/**
 * Connection to Bite's real backend (Supabase project "bite", Frankfurt).
 * The publishable key is meant to be public: what each visitor may read or change is enforced by the
 * row level security rules in supabase/migrations, not by hiding this key.
 * Never put the service_role key in this repository.
 */
export const SUPABASE_URL = "https://hvwcuiknfqhbrjdbcooz.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yJSohzaIiidmFJyxlosvXA_geTPocx0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/**
 * Demo or live?
 * - Demo (default for now): everything stays in this browser, made for pitches.
 * - Live: real accounts in Supabase. Switch with bite.html?live, back with bite.html?demo.
 *   The choice is remembered in this browser.
 * When the real app is complete the default flips to live.
 */
const MODE_KEY = "bite_mode";
function readMode(): "demo" | "live" {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("live")) localStorage.setItem(MODE_KEY, "live");
    if (params.has("demo")) localStorage.setItem(MODE_KEY, "demo");
    return localStorage.getItem(MODE_KEY) === "live" ? "live" : "demo";
  } catch {
    return "demo";
  }
}
export const MODE = readMode();
export const IS_LIVE = MODE === "live";
