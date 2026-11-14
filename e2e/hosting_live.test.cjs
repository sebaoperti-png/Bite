// Needs: local PostgreSQL 16 with the migrations applied in database bite_e2e (see e2e/README.md), npx vite preview --port 4173, Playwright.
// The hosting flow's live helpers, with Supabase replaced by fakebase.cjs (real SQL and rules, local PostgreSQL):
//  - "Improve my text with AI" (the Edge Function bite-ai answers with a fixed text in tests) and Undo
//  - the postcode finds the town (OpenPLZ mocked: one town, and a postcode shared by several villages)
//  - "Let Bite estimate" from the ingredients, item by item (AI, mocked), and its fallback when the AI is off
//  - "List what you bought": the database refuses a typed total without a list and keeps the list for guests
const { chromium } = require("playwright");
const { handle, pool } = require("./fakebase.cjs");

const BASE = "http://localhost:4173";
const SB = "https://hvwcuiknfqhbrjdbcooz.supabase.co";
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log("ok  ", msg); } else { fail++; console.log("FAIL", msg); } };
const q = async (sql, p) => (await pool.query(sql, p)).rows;
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const TOWNS = { "73430": ["Aalen"], "73457": ["Essingen", "Lauterburg"] };

(async () => {
  await pool.query("delete from meals");
  await pool.query("update profiles set photo_url = $1, host_rules_at = now() where id::text like 'aaaaaaaa%'", [PHOTO]);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("bite_tour_v1", "1"); } catch {} });
  let aiOff = false;
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    if (req.url().includes("/realtime/")) return route.abort();
    const raw = req.postDataBuffer();
    const body = raw && (req.headers()["content-type"] || "").includes("json") ? JSON.parse(raw.toString()) : null;
    if (aiOff && req.url().includes("/functions/v1/")) return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "not_configured" }) });
    const res = await handle({ method: req.method(), url: req.url(), headers: req.headers(), body });
    await route.fulfill({ status: res.status, contentType: res.contentType || "application/json", body: res.body });
  });
  await ctx.route("https://openplzapi.org/**", (route) => {
    const code = new URL(route.request().url()).searchParams.get("postalCode");
    route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify((TOWNS[code] || []).map((name) => ({ postalCode: code, name }))) });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { fail++; console.log("PAGE ERROR", e.message); });
  const body = () => page.locator("body").innerText();

  await page.goto(`${BASE}/bite.html?live&login&lang=en`);
  await page.getByRole("heading", { name: "Welcome back" }).waitFor({ timeout: 10000 });
  await page.getByLabel("Email").fill("anna@test.local");
  await page.getByRole("textbox", { name: /^Password/ }).fill("local-test-only");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await page.waitForTimeout(2000);

  const d = new Date(Date.now() + 4 * 86400000);
  const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const FORM = {
    serviceType: "eat-together", eventTitle: "Tajine night", mealName: "Lamb tajine", cuisineType: "Moroccan", description: "",
    mainDishes: "Lamb tajine", appetizers: "", desserts: "", drinksIncluded: false, dietary: [], allergens: ["gluten"], allergyNotes: "",
    maxGuests: 4, minGuests: 1, address: "Brunnenstraße 25", city: "", postcode: "", date: dateISO, startTime: "19:30", endTime: "22:00",
    groceryCost: 0, costSource: null, pricePerGuest: 5, freeEvent: false, photos: [PHOTO], coverIdx: 0,
    ingredientsText: "Lamb shoulder, apricots, onions, couscous (wheat), olive oil, salt", declared: true,
  };
  const open = async (step, form) => {
    await page.evaluate(([s, f]) => localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: s, form: f })), [step, form]);
    await page.goto(`${BASE}/bite.html?host&lang=en`); await page.waitForTimeout(1500);
  };
  const next = page.getByRole("button", { name: /Continue/ });

  // ---- the description: the host's own words, polished by the AI, and Undo
  await open(0, FORM);
  const desc = page.getByPlaceholder(/Describe the experience/);
  await desc.fill("tajine like my nonna made, lots of apricots");
  await page.getByRole("button", { name: "Improve my text with AI" }).click();
  await page.waitForFunction(() => document.querySelector("textarea")?.value.startsWith("Polished: tajine like my nonna made, lots of apricots"), null, { timeout: 10000 });
  check(true, "Improve with AI: the host's own text comes back polished");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Undo" }).click();
  check(await desc.inputValue() === "tajine like my nonna made, lots of apricots", "Undo brings the host's own words back");
  await desc.fill("short");
  check(await page.getByRole("button", { name: "Improve my text with AI" }).isDisabled(), "Improve with AI needs a few words of your own first");

  // ---- where: the postcode finds the town
  await open(3, FORM);
  await page.getByRole("textbox", { name: "Postcode" }).fill("73430");
  await page.waitForTimeout(1200);
  check(await page.getByRole("textbox", { name: "Town" }).inputValue() === "Aalen", "postcode 73430 fills in the town: Aalen");
  await page.getByRole("textbox", { name: "Postcode" }).fill("73457");
  await page.waitForTimeout(1200);
  check(await page.getByRole("textbox", { name: "Town" }).inputValue() === "Essingen" && await page.getByRole("button", { name: "Lauterburg" }).count() === 1, "a postcode shared by two villages offers both");
  await page.getByRole("button", { name: "Lauterburg" }).click();
  check(await page.getByRole("textbox", { name: "Town" }).inputValue() === "Lauterburg", "tapping the other village picks it");
  await page.getByRole("textbox", { name: "Postcode" }).fill("7343");
  await next.click(); await page.waitForTimeout(300);
  check((await body()).includes("A German postcode has 5 digits"), "a 4-digit postcode is refused");
  await page.getByRole("textbox", { name: "Postcode" }).fill("99999");
  await page.waitForTimeout(1200);
  check((await body()).includes("We couldn't look up this postcode"), "an unknown postcode asks to type the town");

  // ---- cost: Bite's estimate from the ingredients, item by item
  await open(4, { ...FORM, city: "Aalen", postcode: "73430" });
  await page.getByText("Let Bite estimate").click();
  await page.getByText("Lamb shoulder").first().waitFor({ timeout: 8000 });
  const t1 = await body();
  // mock: Lamb shoulder 9.50 + 5 × 1.80 = 18.50
  check(t1.includes("€18.50") && t1.includes("couscous") && t1.includes("Estimated by AI"), "the AI prices each ingredient: €18.50 in total, item by item");
  check(t1.includes("Price cap €4"), "the price cap follows the AI estimate (18.50 for 5: guests together never pay more → €4)");
  aiOff = true;
  await open(4, { ...FORM, city: "Aalen", postcode: "73430" });
  await page.getByText("Let Bite estimate").click(); await page.waitForTimeout(1500);
  const t2 = await body();
  check(t2.includes("Main dish (Moroccan)") && t2.includes("isn't available"), "without the AI, Bite's standard estimate is used and it says why");
  aiOff = false;

  // ---- publish with a shopping list: saved for guests, refused without it
  const listForm = { ...FORM, city: "Aalen", postcode: "73430", description: "Tajine like my nonna made.", costSource: "declared", groceryCost: 24, pricePerGuest: 5,
    costLines: [{ item: "Lamb shoulder", price: 16 }, { item: "Apricots", price: 8 }] };
  await open(7, listForm);
  await page.getByRole("button", { name: /Publish event/ }).click();
  await page.waitForTimeout(4500);
  const rows = await q("select id, cost_proof, city, lat, lng from meals");
  check(rows.length === 1 && rows[0].cost_proof.kind === "declared" && rows[0].cost_proof.lines.length === 2 && rows[0].cost_proof.lines[0].item === "Lamb shoulder", "the shopping list is saved with the meal");
  check(rows.length === 1 && rows[0].city === "Aalen", "the town is saved");
  await page.goto(`${BASE}/bite.html?live&lang=en&meal=${rows[0]?.id}`);
  await page.waitForTimeout(2500);
  const det = page.getByText(/What the host bought \(2 items\)/);
  if (await det.count()) { await det.click(); await page.waitForTimeout(300); }
  check((await body()).includes("Apricots") && /€16\b/.test(await body()), "the meal page shows what the host bought");
  const c = await pool.connect();
  let sneaky = "allowed";
  try {
    await c.query("begin");
    await c.query("select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', true)");
    await c.query("set local role authenticated");
    await c.query(`insert into meals (host_id, title, service_type, price_cents, seats, starts_at, city, cost_proof, ingredients, host_declared_at)
      values (auth.uid(), 'No list', 'eat-together', 500, 4, now() + interval '2 days', 'Aalen', '{"kind":"declared","total":24,"people":5}', 'Rice, beans', now())`);
  } catch (e) { sneaky = e.message; } finally { await c.query("rollback"); c.release(); }
  check(/list what you bought/.test(sneaky), "the database refuses a typed total without a list, even from outside the app");

  await browser.close();
  await pool.end();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); process.exit(1); });
