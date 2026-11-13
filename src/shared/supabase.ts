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
 * - Live (default since 2026-11-13): real accounts and real meals in Supabase. Everyone who opens bite.html sees it.
 * - Demo: sample meals in Frankfurt, everything stays in this browser, made for pitches. bite.html?demo switches to it
 *   (remembered in this browser), bite.html?live switches back.
 * - bite.html?preview shows the demo once without remembering it (the app inside the landing page's laptop), so a
 *   visitor who then opens the real app still lands on live.
 */
const MODE_KEY = "bite_mode";
function readMode(): "demo" | "live" {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("preview")) return "demo";
    if (params.has("live")) localStorage.setItem(MODE_KEY, "live");
    if (params.has("demo")) localStorage.setItem(MODE_KEY, "demo");
    return localStorage.getItem(MODE_KEY) === "demo" ? "demo" : "live";
  } catch {
    return "live";
  }
}
export const MODE = readMode();
export const IS_LIVE = MODE === "live";
