// Supabase Edge Function "bite-ai": the hosting flow's two AI helpers, powered by Google Gemini.
//   task "polish":   the host writes a few rough lines about the meal, Gemini turns them into a warm description
//                    (same facts, nothing invented, no allergens or ingredients added).
//   task "estimate": from the ingredient list and the number of people, Gemini estimates what the shopping costs
//                    at a German supermarket, item by item. The app keeps it within sensible bounds and the price
//                    cap still applies (the database checks it).
// Only signed-in people can call it (Supabase checks the JWT) and each account has a daily allowance (ai_take).
// Secrets (Supabase dashboard → Edge Functions → Secrets): GEMINI_API_KEY (required), GEMINI_MODEL (optional).
// SUPABASE_URL and the service key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEYS) are provided by Supabase automatically.
import { createClient } from "npm:@supabase/supabase-js@2";

const ORIGINS = ["https://bitetable.de", "https://www.bitetable.de", "http://localhost:5173", "http://localhost:4173"];
const DAILY_LIMIT = 30;
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";

function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

/** the server key: the legacy service_role key, or (projects on the new API keys) the first secret key */
function serviceKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { return Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"))[0] as string; } catch { return ""; }
}

const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

async function gemini(prompt: string, schema?: unknown) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("not_configured");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: schema ? 0.2 : 0.7, maxOutputTokens: 900, ...(schema ? { responseMimeType: "application/json", responseSchema: schema } : {}) },
    }),
  });
  if (res.status === 429) throw new Error("busy");
  if (!res.ok) throw new Error(`gemini_${res.status}`);
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("empty");
  return text.trim();
}

function polishPrompt(b: Record<string, unknown>) {
  const de = b.lang === "de";
  const format = ({ "eat-together": "guests sit at the host's own table", pickup: "guests pick the food up and eat at home", "cook-together": "guests cook together with the host" } as Record<string, string>)[String(b.serviceType)] ?? "a home-cooked meal shared with neighbours";
  return [
    `You help a home cook on Bite, a platform where neighbours share home-cooked meals and split the grocery cost (no profit).`,
    `Rewrite the cook's own notes into a warm, natural description for the meal's page, in ${de ? "German (use \"du\")" : "British English"}.`,
    `Rules: keep every fact from the notes and add no new facts. Do not invent ingredients, allergens, diets, prices, places, times or stories.`,
    `Write in the first person as the cook. 2 to 4 sentences, at most 380 characters. No emoji, no hashtags, no exclamation marks in a row, no dashes used as pauses (no "—" or "–"). Plain text only.`,
    `Context (use only if it fits, never contradict the notes): meal "${clip(b.mealName, 80)}", cuisine "${clip(b.cuisine, 40)}", format: ${format}.`,
    b.ingredients ? `The ingredient list the cook gave (you may mention a few, never others): ${clip(b.ingredients, 600)}` : "",
    `The cook's notes:\n"""${clip(b.text, 1200)}"""`,
    `Answer with the description only.`,
  ].filter(Boolean).join("\n");
}

const ESTIMATE_SCHEMA = {
  type: "object",
  properties: {
    lines: { type: "array", items: { type: "object", properties: { item: { type: "string" }, amount: { type: "string" }, price: { type: "number" } }, required: ["item", "price"] } },
    note: { type: "string" },
  },
  required: ["lines"],
};

function estimatePrompt(b: Record<string, unknown>) {
  const de = b.lang === "de";
  return [
    `Estimate what the groceries for this home-cooked meal cost at a normal German supermarket (Rewe, Edeka, Lidl, Aldi) today, in euros.`,
    `The meal: "${clip(b.mealName, 80)}" (${clip(b.cuisine, 40) || "any cuisine"}), for ${Number(b.people) || 4} people in total.`,
    `The ingredient list:\n"""${clip(b.ingredients, 1200)}"""`,
    `For every ingredient give the amount needed for that many people (as text, e.g. "600 g") and the realistic price of what you would have to buy for it.`,
    `Staples a kitchen usually has (salt, pepper, a splash of oil, a pinch of spices) count only a small share, at most 0.30 € each.`,
    `Be realistic and rather a little low than high. Write item names and amounts in ${de ? "German" : "English"}. Prices are numbers with two decimals.`,
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, serviceKey());
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const uid = token ? (await admin.auth.getUser(token)).data.user?.id : undefined;
    if (!uid) return json(req, { error: "sign_in" }, 401);
    const body = await req.json().catch(() => ({}));
    if (body.task !== "polish" && body.task !== "estimate") return json(req, { error: "task" }, 400);
    if (body.task === "polish" && clip(body.text, 1200).length < 8) return json(req, { error: "too_short" }, 400);
    if (body.task === "estimate" && clip(body.ingredients, 1200).length < 3) return json(req, { error: "no_ingredients" }, 400);

    const { data: allowed, error } = await admin.rpc("ai_take", { p_user: uid, p_limit: DAILY_LIMIT });
    if (error) throw error;
    if (!allowed) return json(req, { error: "limit" }, 429);

    if (body.task === "polish") {
      const text = (await gemini(polishPrompt(body))).replace(/^["“]|["”]$/g, "").replace(/\s*[—–]\s*/g, ", ").slice(0, 400);
      return json(req, { text });
    }
    const raw = JSON.parse(await gemini(estimatePrompt(body), ESTIMATE_SCHEMA));
    const lines = (Array.isArray(raw.lines) ? raw.lines : []).slice(0, 30)
      .map((l: { item?: string; amount?: string; price?: number }) => ({ item: clip(l.item, 50), amount: clip(l.amount, 20), price: Math.round(Math.min(80, Math.max(0, Number(l.price) || 0)) * 100) / 100 }))
      .filter((l: { item: string; price: number }) => l.item && l.price > 0);
    if (!lines.length) throw new Error("empty");
    return json(req, { lines });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("bite-ai", msg);
    return json(req, { error: msg === "not_configured" || msg === "busy" ? msg : "failed" }, msg === "busy" ? 503 : 500);
  }
});
