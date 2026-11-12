// Needs: local PostgreSQL 16 with the migrations applied in database bite_e2e (see e2e/README.md), npx vite preview --port 4173, Playwright.
// Full live flow with two people in two browsers: Anna (host) publishes a dinner, Ben (guest) asks for a seat,
// Anna accepts, Ben sees the address, they chat, Anna cancels the meal, Ben reports and blocks Anna.
// Safety on the way: both must add a name and a photo first, and Anna accepts the house rules before her first table.
// Supabase is replaced by fakebase.cjs: real SQL, real security rules, local PostgreSQL. Nothing leaves this machine.
const { chromium } = require("playwright");
const { handle, pool } = require("./fakebase.cjs");

const BASE = "http://localhost:4173";
const SB = "https://hvwcuiknfqhbrjdbcooz.supabase.co";
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log("ok  ", msg); } else { fail++; console.log("FAIL", msg); } };
const q = async (sql, p) => (await pool.query(sql, p)).rows;

// a tiny real JPEG-like photo as data URL (1x1 PNG is enough to exercise the upload path)
const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function personContext(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  ctx.uploads = [];
  await ctx.route(`${SB}/**`, async (route) => {
    const req = route.request();
    if (req.url().includes("/realtime/")) return route.abort();
    let body = null;
    const raw = req.postDataBuffer();
    if (raw && (req.headers()["content-type"] || "").includes("json")) body = JSON.parse(raw.toString());
    if (req.method() === "POST" && req.url().includes("/storage/v1/object/")) ctx.uploads.push(req.url());
    const res = await handle({ method: req.method(), url: req.url(), headers: req.headers(), body });
    if (res.status >= 400) console.log(`   [${label}] ${req.method()} ${new URL(req.url()).pathname} -> ${res.status} ${String(res.body).slice(0, 160)}`);
    await route.fulfill({ status: res.status, contentType: res.contentType || "application/json", body: res.body });
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => { fail++; console.log(`PAGE ERROR [${label}]`, e.message); });
  return { ctx, page };
}

const PHOTO_FILE = { name: "me.png", mimeType: "image/png", buffer: Buffer.from(PHOTO.split(",")[1], "base64") };
/** the "Who is cooking? / Who is coming?" sheet: add a photo and continue */
async function passProfileGate(page, heading) {
  await page.getByText(heading).waitFor({ timeout: 8000 });
  await page.getByRole("dialog").locator("input[type=file]").setInputFiles(PHOTO_FILE);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Save and continue" }).click();
}

async function logIn(page, email) {
  await page.goto(`${BASE}/bite.html?live&login&lang=en`);
  await page.getByRole("heading", { name: "Welcome back" }).waitFor({ timeout: 10000 });
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: /^Password/ }).fill("local-test-only");
  await page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await page.waitForFunction(() => !document.querySelector("h1") || !document.body.innerText.includes("Log in to see your bookings"), null, { timeout: 10000 });
  await page.waitForTimeout(1200);
}

(async () => {
  await pool.query("delete from meals");
  await pool.query("delete from blocks; delete from reports; update profiles set photo_url = null, host_rules_at = null");
  const browser = await chromium.launch();
  const anna = await personContext(browser, "Anna");
  const ben = await personContext(browser, "Ben");

  // ---------------------------------------------------------------- Anna publishes
  await logIn(anna.page, "anna@test.local");
  check((await anna.page.locator("body").innerText()).includes("Anna"), "Anna is logged in and greeted by name");
  const d = new Date(Date.now() + 3 * 86400000);
  const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const form = {
    serviceType: "eat-together", eventTitle: "Tajine night", mealName: "Lamb tajine with apricots", cuisineType: "Moroccan",
    description: "Slow-cooked tajine like my grandmother makes it.", mainDishes: "Lamb tajine", appetizers: "Zaalouk", desserts: "Mint tea",
    drinksIncluded: true, dietary: [], allergens: [], allergyNotes: "", maxGuests: 4, minGuests: 1,
    address: "Brunnenstraße 25", city: "Aalen", date: dateISO, startTime: "19:30", endTime: "22:00",
    groceryCost: 28, costSource: "receipt", pricePerGuest: 5, freeEvent: false, photos: [PHOTO], coverIdx: 0,
  };
  await anna.page.evaluate((f) => localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: 7, form: f })), form);
  await anna.page.goto(`${BASE}/bite.html?host&lang=en`);
  await anna.page.getByRole("button", { name: /Publish event/ }).click();
  await passProfileGate(anna.page, "Who is cooking?");
  check(true, "before her first table Anna is asked for a photo");
  await anna.page.getByText("Six promises every host makes").waitFor({ timeout: 8000 });
  check(true, "then she sees the house rules");
  check(await anna.page.getByRole("button", { name: "Accept and continue" }).isDisabled(), "she cannot accept without ticking the box");
  await anna.page.getByText("I have read the house rules and I will follow them").click();
  await anna.page.getByRole("button", { name: "Accept and continue" }).click();
  await anna.page.waitForTimeout(4500);
  const annaProfile = (await q("select photo_url, host_rules_at from profiles where id::text like 'aaaaaaaa%'"))[0];
  check(annaProfile.photo_url && annaProfile.host_rules_at, "Anna's photo and house-rules acceptance are saved");
  const meals = await q("select m.*, a.address from meals m left join meal_addresses a on a.meal_id = m.id");
  check(meals.length === 1, "the meal is saved in the database");
  const meal = meals[0];
  check(meal && meal.title === "Lamb tajine with apricots" && meal.price_cents === 500 && meal.seats === 4 && meal.city === "Aalen", "title, price (5.00), seats and city are correct");
  check(meal && meal.address === "Brunnenstraße 25", "the street is stored separately (private)");
  const hh = meal && new Date(meal.starts_at);
  check(meal && hh.getHours() === 19 && hh.getMinutes() === 30, "the start time is 19:30 local time");
  check(anna.ctx.uploads.length === 1 && anna.ctx.uploads[0].includes("aaaaaaaa-0000-0000-0000-000000000001/"), "the photo is uploaded into Anna's own folder");
  check(meal && (meal.image_url || "").includes("/storage/v1/object/public/meal-photos/"), "the meal points to the uploaded photo, not a huge inline image");
  await anna.page.screenshot({ path: "/tmp/flow_1_published.png" });

  // ---------------------------------------------------------------- Ben looks around as a visitor, then books
  await ben.page.goto(`${BASE}/bite.html?live&lang=en`);
  await ben.page.waitForTimeout(2500);
  check(!(await ben.page.getByRole("heading", { name: "Welcome back" }).count()), "a visitor opens the live app without a log-in wall");
  await ben.page.getByRole("button", { name: "Browse" }).last().click();
  await ben.page.waitForTimeout(3500);
  const browse = await ben.page.locator("body").innerText();
  await ben.page.screenshot({ path: "/tmp/flow_ben_browse.png" });
  check(browse.includes("Lamb tajine with apricots") && !browse.includes("Thai Green Curry"), "as a visitor Ben sees Anna's real meal and no demo meals");
  await ben.page.goto(`${BASE}/bite.html?live&lang=en&meal=${meal.id}`);
  await ben.page.waitForTimeout(2000);
  const detail = await ben.page.locator("body").innerText();
  check(detail.includes("Lamb tajine with apricots"), "Ben opens the meal page");
  check(!detail.includes("Brunnenstraße"), "Ben does not see the street before he is accepted");
  check(detail.includes("New host on Bite") && !detail.includes("Verified host"), "no false 'verified' claim for a host Bite has not checked");
  await ben.page.screenshot({ path: "/tmp/flow_2_detail.png" });
  await ben.page.getByRole("button", { name: /Eat together|Book|Join|€/ }).last().click();
  await ben.page.getByText("Create a free account to ask for a seat").waitFor({ timeout: 8000 });
  check(true, "booking as a visitor asks for an account, saying why");
  await ben.page.getByRole("tab", { name: "Log in" }).click();
  await ben.page.getByLabel("Email").fill("ben@test.local");
  await ben.page.getByRole("textbox", { name: /^Password/ }).fill("local-test-only");
  await ben.page.getByRole("button", { name: "Log in", exact: true }).last().click();
  await ben.page.getByText("Confirm your booking").waitFor({ timeout: 10000 });
  check(true, "after logging in Ben lands straight on the booking he wanted");
  await ben.page.waitForTimeout(800);
  const co = await ben.page.locator("body").innerText();
  check(!co.includes("insured"), "checkout makes no insurance promise in live mode");
  await ben.page.locator("input.tick-input").check({ force: true });
  await ben.page.getByRole("button", { name: /Ask for 1 seat/ }).click();
  await passProfileGate(ben.page, "Who is coming?");
  check(true, "Ben is asked for a photo before his first request");
  await ben.page.getByRole("heading", { name: "Request sent!" }).waitFor({ timeout: 8000 });
  check(true, "Ben sees 'Request sent!'");
  await ben.page.screenshot({ path: "/tmp/flow_3_request.png" });
  const bk = await q("select * from bookings");
  check(bk.length === 1 && bk[0].status === "requested" && bk[0].total_cents === 560, "the booking is a request for 1 seat, total 5.60 (5.00 + 12%)");
  await ben.page.waitForTimeout(2500);
  check((await ben.page.locator("body").innerText()).includes("waiting for Anna"), "the chat shows the request is waiting for Anna");

  // ---------------------------------------------------------------- Anna accepts
  await anna.page.goto(`${BASE}/bite.html?live&lang=en&meal=${meal.id}`);
  await anna.page.waitForTimeout(2000);
  check(/new request/i.test(await anna.page.locator("body").innerText()), "Anna sees Ben's request on her meal");
  await anna.page.screenshot({ path: "/tmp/flow_4_request_host.png" });
  await anna.page.getByRole("button", { name: /Accept/ }).click();
  await anna.page.waitForTimeout(1500);
  check((await q("select status from bookings"))[0].status === "confirmed", "accepting confirms the booking in the database");

  // ---------------------------------------------------------------- Ben confirmed: address + chat
  await ben.page.goto(`${BASE}/bite.html?live&lang=en&meal=${meal.id}`);
  await ben.page.waitForTimeout(2000);
  const d2 = await ben.page.locator("body").innerText();
  check(d2.includes("Brunnenstraße 25"), "once accepted, Ben sees the exact address");
  await ben.page.getByRole("button", { name: /booked · Open chat/ }).click();
  await ben.page.waitForTimeout(1200);
  check((await ben.page.locator("body").innerText()).includes("Booking confirmed"), "Ben's chat shows 'Booking confirmed'");
  const input = ben.page.locator("input[type=text], input:not([type])").last();
  await input.fill("Can't wait! Shall I bring dessert?");
  await input.press("Enter");
  await ben.page.waitForTimeout(1500);
  const msgs = await q("select body, sender_id from messages order by created_at");
  check(msgs.some((m) => m.body === "Can't wait! Shall I bring dessert?" && m.sender_id.startsWith("bbbbbbbb")), "Ben's message is saved, sent as Ben");
  await ben.page.screenshot({ path: "/tmp/flow_5_chat.png" });

  await anna.page.goto(`${BASE}/bite.html?live&lang=en`);
  await anna.page.waitForTimeout(2000);
  await anna.page.getByRole("button", { name: "Messages" }).last().click();
  await anna.page.waitForTimeout(1000);
  const annaMsgs = await anna.page.locator("body").innerText();
  check(annaMsgs.includes("Ben") && annaMsgs.includes("bring dessert"), "Anna sees Ben's message in her inbox");
  await anna.page.screenshot({ path: "/tmp/flow_6_inbox.png" });

  // ---------------------------------------------------------------- Anna cancels the meal
  await anna.page.goto(`${BASE}/bite.html?live&lang=en&meal=${meal.id}`);
  await anna.page.waitForTimeout(1500);
  await anna.page.getByRole("button", { name: /Cancel this meal/ }).click();
  await anna.page.waitForTimeout(1500);
  check((await q("select status from meals"))[0].status === "cancelled", "Anna cancels the meal");
  check((await q("select status from bookings"))[0].status === "cancelled", "Ben's booking is cancelled with it");
  await ben.page.goto(`${BASE}/bite.html?live&lang=en`);
  await ben.page.waitForTimeout(2000);
  const benHome = await ben.page.locator("body").innerText();
  check(!benHome.includes("Search 1"), "the cancelled meal disappears from browsing");

  // ---------------------------------------------------------------- Ben reports and blocks Anna
  await ben.page.getByRole("button", { name: "Messages" }).last().click();
  await ben.page.waitForTimeout(800);
  await ben.page.getByText("Anna").first().click();
  await ben.page.waitForTimeout(1200);
  await ben.page.getByRole("button", { name: "Safety: report or block" }).click();
  await ben.page.getByRole("button", { name: /Report Anna/ }).click();
  await ben.page.waitForTimeout(500);
  await ben.page.getByRole("radio", { name: /Scam or fake profile/ }).click();
  await ben.page.locator("#sf-details").fill("Asked me to pay by bank transfer before the dinner.");
  await ben.page.getByRole("button", { name: "Send report" }).click();
  await ben.page.getByText("Report received").waitFor({ timeout: 8000 });
  await ben.page.screenshot({ path: "/tmp/flow_7_report.png" });
  const rep = await q("select * from reports");
  check(rep.length === 1 && rep[0].category === "scam" && rep[0].user_id.startsWith("aaaaaaaa") && rep[0].reporter_id.startsWith("bbbbbbbb") && rep[0].reason.includes("bank transfer"), "the report reaches Bite with reason, reporter and the reported person");
  await ben.page.getByRole("button", { name: "Back to Bite" }).click();
  await ben.page.waitForTimeout(400);
  await ben.page.getByRole("button", { name: "Safety: report or block" }).click();
  await ben.page.getByRole("button", { name: /Block Anna/ }).first().click();
  await ben.page.waitForTimeout(500);
  await ben.page.getByRole("button", { name: /^Block Anna$/ }).click();
  await ben.page.waitForTimeout(1500);
  check((await q("select * from blocks")).length === 1, "the block is saved");
  check((await ben.page.locator("body").innerText()).includes("You blocked Anna"), "the chat says Anna is blocked and the message box is gone");
  await ben.page.screenshot({ path: "/tmp/flow_8_blocked.png" });

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); await pool.end();
  process.exit(fail ? 1 : 0);
})().catch(async (e) => { console.error(e); process.exit(1); });
