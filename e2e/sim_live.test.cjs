// Simulations of the real app with four people at once (Anna hosts; Ben, Cara and Dan are guests), on fakebase:
// real SQL and Bite's real security rules on a local PostgreSQL (bite_e2e), nothing leaves the machine.
// Covers what can go wrong when several people act at the same time: the last seat, a host saying no, a guest
// cancelling, a visitor who logs in halfway, blocking, meals without coordinates, and hosting in a village.
// Needs: npx vite preview --port 4173, the bite_e2e database (e2e/README.md), npm install pg.
const { chromium } = require("playwright");
const { handle, pool } = require("./fakebase.cjs");

const BASE = "http://localhost:4173";
const SB = "https://hvwcuiknfqhbrjdbcooz.supabase.co";
const A = "aaaaaaaa-0000-0000-0000-000000000001", B = "bbbbbbbb-0000-0000-0000-000000000001";
const C = "cccccccc-0000-0000-0000-000000000001", D = "dddddddd-0000-0000-0000-000000000001";
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log("ok  ", msg); } else { fail++; console.log("FAIL", msg); } };
const q = async (sql, p) => (await pool.query(sql, p)).rows;
const step = async (name, fn) => { try { await fn(); } catch (e) { fail++; console.log("FAIL", name, "→", e.message.split("\n")[0]); } };
const text = async (page) => (await page.locator("body").innerText()).replace(/\s+/g, " ");

async function person(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(() => { try { localStorage.setItem("bite_tour_v1", "1"); } catch {} });
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    if (req.url().includes("/realtime/")) return route.abort();
    let body = null;
    const raw = req.postDataBuffer();
    if (raw && (req.headers()["content-type"] || "").includes("json")) body = JSON.parse(raw.toString());
    const res = await handle({ method: req.method(), url: req.url(), headers: req.headers(), body });
    await route.fulfill({ status: res.status, contentType: res.contentType || "application/json", body: res.body });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { fail++; console.log(`PAGE ERROR [${label}]`, e.message); });
  return page;
}
async function logIn(page, email) {
  await page.goto(`${BASE}/bite.html?live&login&lang=en`);
  await page.getByRole("heading", { name: "Welcome back" }).waitFor({ timeout: 10000 });
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: /^Password/ }).fill("local-test-only");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await page.waitForTimeout(2200);
}
async function newMeal(title, seats, opts = {}) {
  const r = await q(`insert into meals (host_id, title, description, service_type, price_cents, seats, starts_at, city, area, lat, lng, status)
     values ($1, $2, 'A simulated dinner', 'eat-together', 600, $3, now() + interval '2 days', $4, '', $5, $6, 'published') returning id`,
    [A, title, seats, opts.city || "Aalen", opts.lat === undefined ? 48.84 : opts.lat, opts.lng === undefined ? 10.09 : opts.lng]);
  await q("insert into meal_addresses values ($1, 'Brunnenstraße 25')", [r[0].id]);
  return r[0].id;
}
const openCheckout = async (page, id) => {
  await page.goto(`${BASE}/bite.html?live&lang=en&meal=${id}`);
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: /Eat together|Book|Join|€/ }).last().click();
  await page.waitForTimeout(800);
};
const setGuests = async (page, n) => { for (let i = 1; i < n; i++) await page.getByRole("button", { name: "More guests" }).click(); };
const submit = async (page) => {
  await page.locator("input.tick-input").check({ force: true });
  await page.getByRole("button", { name: /Ask for \d+ seats?/ }).click();
  await page.waitForTimeout(2000);
};

(async () => {
  // ---------------------------------------------------------------- a clean table
  await q("insert into auth.users (id, email, raw_user_meta_data) values ($1,'cara@test.local','{\"name\":\"Cara G.\"}'), ($2,'dan@test.local','{\"name\":\"Dan S.\"}') on conflict do nothing", [C, D]);
  await q("delete from blocks; delete from reports; delete from messages; delete from conversations; delete from bookings; delete from meals");
  await q("update profiles set photo_url = $1", [PHOTO]);
  await q("update profiles set host_rules_at = now() where id = $1", [A]);
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const anna = await person(browser, "Anna"), ben = await person(browser, "Ben"), cara = await person(browser, "Cara"), dan = await person(browser, "Dan");
  await logIn(anna, "anna@test.local"); await logIn(ben, "ben@test.local"); await logIn(cara, "cara@test.local");

  // ---------------------------------------------------------------- 1. the last seats, two people at once
  console.log("\n=== the last seats ===");
  const m1 = await newMeal("Two-seat pasta night", 2);
  await step("last seats", async () => {
    await openCheckout(ben, m1); await openCheckout(cara, m1);         // both are on the checkout at the same time
    await setGuests(ben, 2); await submit(ben);
    check((await text(ben)).includes("Request sent!"), "Ben asks for both seats first");
    await submit(cara);
    const t = await text(cara);
    check(t.includes("Sorry, those seats were just taken") && !t.includes("Request sent!"), "Cara, a second later, is told the seats were just taken (no double booking)");
    const rows = await q("select guest_id, seats from bookings where meal_id = $1", [m1]);
    check(rows.length === 1 && rows[0].seats === 2, "the database holds exactly one booking for the two seats");
  });

  // ---------------------------------------------------------------- 2. the host says no, the seats come back
  console.log("\n=== the host declines ===");
  await step("decline", async () => {
    await anna.goto(`${BASE}/bite.html?live&lang=en&meal=${m1}`); await anna.waitForTimeout(1800);
    await anna.getByRole("button", { name: "Decline" }).click(); await anna.waitForTimeout(1500);
    check((await q("select status from bookings where meal_id = $1", [m1]))[0].status === "declined", "Anna declines Ben's request");
    await ben.goto(`${BASE}/bite.html?live&lang=en`); await ben.waitForTimeout(1500);
    await ben.getByRole("button", { name: /Messages/ }).last().click(); await ben.waitForTimeout(800);
    await ben.getByText("Anna").first().click(); await ben.waitForTimeout(1500);
    check(/declined/i.test(await text(ben)), "Ben's chat says the request was declined");
    await openCheckout(cara, m1); await submit(cara);
    check((await text(cara)).includes("Request sent!"), "the seats are free again: Cara can ask now");
    await anna.goto(`${BASE}/bite.html?live&lang=en&meal=${m1}`); await anna.waitForTimeout(1800);
    await anna.getByRole("button", { name: /Accept/ }).click(); await anna.waitForTimeout(1500);
    check((await q("select status from bookings where guest_id = $1", [C]))[0].status === "confirmed", "Anna accepts Cara");
  });

  // ---------------------------------------------------------------- 3. a guest cancels
  console.log("\n=== a guest cancels ===");
  await step("cancel", async () => {
    await cara.goto(`${BASE}/bite.html?live&lang=en`); await cara.waitForTimeout(1500);
    await cara.getByRole("button", { name: /^Profile$/ }).last().click(); await cara.waitForTimeout(1000);
    await cara.getByRole("button", { name: /My bookings/ }).first().click(); await cara.waitForTimeout(800);
    await cara.getByRole("button", { name: "Cancel booking" }).first().click();
    await cara.getByRole("button", { name: /Confirm ca/ }).first().click(); await cara.waitForTimeout(1800);
    check((await q("select status from bookings where guest_id = $1", [C]))[0].status === "cancelled", "Cara cancels; the booking is cancelled in the database");
    const left = (await q("select seats_left($1) as n", [m1]))[0].n;
    check(left === 2, `both seats are free again (${left})`);
  });

  // ---------------------------------------------------------------- 4. a visitor writes to the host, logging in halfway
  console.log("\n=== a visitor logs in halfway ===");
  const m2 = await newMeal("Sunday soup", 6);
  await step("visitor message", async () => {
    await dan.goto(`${BASE}/bite.html?live&lang=en&meal=${m2}`); await dan.waitForTimeout(2000);
    check((await text(dan)).includes("Sunday soup"), "Dan, without an account, opens the meal page");
    await dan.getByRole("button", { name: /^Message$/ }).click();
    await dan.getByText("Create a free account to message the host.").waitFor({ timeout: 6000 });
    await dan.getByRole("tab", { name: "Log in" }).click();
    await dan.getByLabel("Email").fill("dan@test.local");
    await dan.getByRole("textbox", { name: /^Password/ }).fill("local-test-only");
    await dan.getByRole("button", { name: "Log in", exact: true }).last().click();
    await dan.getByRole("textbox", { name: /Message Anna/ }).waitFor({ timeout: 10000 });
    check(true, "after logging in, Dan lands in the chat with Anna");
    await dan.getByRole("textbox", { name: /Message Anna/ }).fill("Is the soup vegan?");
    await dan.keyboard.press("Enter"); await dan.waitForTimeout(1500);
    check((await q("select count(*)::int as n from messages where sender_id = $1 and body = 'Is the soup vegan?'", [D]))[0].n === 1, "Dan's question is saved, sent as Dan");
  });

  // ---------------------------------------------------------------- 5. the host blocks a guest
  console.log("\n=== the host blocks a guest ===");
  await step("block", async () => {
    await openCheckout(dan, m2); await submit(dan);
    check((await q("select status from bookings where guest_id = $1", [D]))[0]?.status === "requested", "Dan asks for a seat");
    await anna.goto(`${BASE}/bite.html?live&lang=en`); await anna.waitForTimeout(1500);
    await anna.getByRole("button", { name: /Messages/ }).last().click(); await anna.waitForTimeout(800);
    await anna.getByText("Dan").first().click(); await anna.waitForTimeout(1200);
    await anna.getByRole("button", { name: "Safety: report or block" }).click();
    await anna.getByRole("button", { name: /Block Dan/ }).first().click(); await anna.waitForTimeout(400);
    await anna.getByRole("button", { name: /^Block Dan$/ }).click(); await anna.waitForTimeout(1800);
    check((await text(anna)).includes("You blocked Dan"), "Anna blocks Dan from the chat");
    check((await q("select status from bookings where guest_id = $1", [D]))[0].status === "cancelled", "Dan's open request is cancelled automatically");
    await dan.goto(`${BASE}/bite.html?live&lang=en`); await dan.waitForTimeout(2000);
    await dan.getByRole("button", { name: "Browse" }).last().click(); await dan.waitForTimeout(2500);
    const t = await text(dan);
    check(!t.includes("Sunday soup") && !t.includes("Two-seat pasta night"), "Dan no longer sees any of Anna's meals");
    const tried = await q("select count(*)::int as n from messages where sender_id = $1", [D]);
    await dan.goto(`${BASE}/bite.html?live&lang=en`); await dan.waitForTimeout(1500);
    await dan.getByRole("button", { name: /Messages/ }).last().click(); await dan.waitForTimeout(800);
    await dan.getByText("Anna").first().click(); await dan.waitForTimeout(1200);
    const box = dan.getByRole("textbox", { name: /Message Anna/ });
    if (await box.count()) { await box.fill("Hello?"); await dan.keyboard.press("Enter"); await dan.waitForTimeout(1500); }
    const after = await q("select count(*)::int as n from messages where sender_id = $1", [D]);
    check(after[0].n === tried[0].n, "a message from Dan to Anna does not get through");
  });

  // ---------------------------------------------------------------- 6. a meal saved without coordinates
  console.log("\n=== a meal without coordinates ===");
  await step("no coordinates", async () => {
    await newMeal("Ulm dumplings", 4, { city: "Ulm", lat: null, lng: null });
    await ben.goto(`${BASE}/bite.html?live&lang=en`); await ben.waitForTimeout(2500);
    await ben.getByText("All cities").first().click();
    await ben.getByRole("combobox").fill("Ulm");
    await ben.locator(".lp-suggest button", { hasText: /^Ulm/ }).first().click({ timeout: 10000 });
    await ben.locator(".lp-done").click(); await ben.waitForTimeout(500);
    await ben.getByRole("button", { name: /^Search/ }).first().click(); await ben.waitForTimeout(3000);
    const t = await text(ben);
    check(t.includes("Ulm dumplings") && /1 meal available/.test(t), "a meal stored without coordinates is still found near Ulm (the town is looked up)");
    check(!t.includes("Sunday soup"), "and the Aalen meals (about 65 km away) are not in an Ulm +10 km search");
  });

  // ---------------------------------------------------------------- 7. hosting in a village, for the second time
  console.log("\n=== hosting in a village ===");
  await step("village", async () => {
    const d = new Date(Date.now() + 4 * 86400000);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const form = { serviceType: "eat-together", eventTitle: "Village night", mealName: "Hüttlingen Käsespätzle", cuisineType: "German", description: "Spätzle like at home.", mainDishes: "Käsespätzle", appetizers: "", desserts: "", drinksIncluded: true, dietary: [], allergens: [], allergyNotes: "", maxGuests: 5, minGuests: 1, address: "Hauptstraße 3", city: "Hüttlingen", date: iso, startTime: "18:30", endTime: "21:00", groceryCost: 20, costSource: "receipt", pricePerGuest: 4, freeEvent: false, photos: [PHOTO], coverIdx: 0, ingredientsText: "Lamb, apricots, onions, couscous (wheat), olive oil, cinnamon, salt", declared: true };
    await anna.evaluate((f) => localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: 7, form: f })), form);
    await anna.goto(`${BASE}/bite.html?live&host&lang=en`); await anna.waitForTimeout(1500);
    await anna.getByRole("button", { name: /Publish event/ }).click();
    await anna.waitForTimeout(5000);
    check(!(await text(anna)).includes("Six promises every host makes"), "a host who already accepted the house rules is not asked again");
    const row = (await q("select lat, lng, city from meals where title = 'Hüttlingen Käsespätzle'"))[0];
    check(row && Math.abs(row.lat - 48.89) < 0.05 && Math.abs(row.lng - 10.10) < 0.06, `the village meal is placed at Hüttlingen (${row && row.lat}, ${row && row.lng})`);
    await ben.goto(`${BASE}/bite.html?live&lang=en`); await ben.waitForTimeout(2500);
    await ben.getByText("All cities").first().click();
    await ben.getByRole("combobox").fill("Aalen");
    await ben.locator(".lp-suggest button", { hasText: /^Aalen/ }).first().click({ timeout: 10000 });
    await ben.locator(".lp-done").click(); await ben.waitForTimeout(500);
    await ben.getByRole("button", { name: /^Search/ }).first().click(); await ben.waitForTimeout(3000);
    const t = await text(ben);
    check(t.includes("Hüttlingen Käsespätzle") && t.includes("Sunday soup"), "an 'Aalen +10 km' search shows the Aalen meals and the one in Hüttlingen (about 6 km away)");
    await ben.getByRole("tab", { name: "Map" }).click();
    await ben.locator(".mm-pin, .mm-group").first().waitFor({ timeout: 20000 });
    check((await ben.locator(".mm-pin, .mm-group").count()) >= 1, "they are on the map");
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); await pool.end();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); process.exit(1); });
