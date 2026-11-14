// Simulations of the demo (no server): every main path on a phone and on a desktop, then a German sweep.
// Run the built app first (npx vite preview --port 4173). For the German sweep also run the dev server
// (npx vite --port 5173): only the dev build lists missing translations (window.__i18nMissing).
// Each check prints ok/FAIL; page errors, failed requests and pages wider than the screen are failures too.
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:4173";
const DEV = process.env.DEV || "http://localhost:5173";
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log("ok  ", msg); } else { fail++; console.log("FAIL", msg); } };

async function open(browser, vp, url) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.problems = [];
  page.on("pageerror", (e) => page.problems.push("page error: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/tiles\.openfreemap|photon\.komoot|Failed to load resource/.test(m.text())) page.problems.push("console: " + m.text().slice(0, 160)); });
  // a third-party map tile or place lookup that drops is retried by the map itself; anything else counts
  page.on("requestfailed", (r) => { const u = r.url(); if (!/openfreemap|komoot|fonts\.g/.test(u)) page.problems.push("request failed: " + u.slice(0, 120)); });
  page.on("response", (r) => { const u = r.url(); if (u.startsWith(BASE) && r.status() >= 400) page.problems.push(`${r.status()} ${u}`); });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  return page;
}
const body = (p) => p.locator("body").innerText().then((t) => t.replace(/\s+/g, " "));
const noOverflow = async (p, where) => {
  const over = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
  check(over <= 1, `${where}: nothing sticks out sideways${over > 1 ? ` (${over}px too wide)` : ""}`);
};
async function step(name, fn) {
  try { await fn(); } catch (e) { fail++; console.log("FAIL", name, "→", e.message.split("\n")[0]); }
}
const nav = async (p, desk, name) => {
  const b = p.getByRole("button", { name: new RegExp(`^(\\d+ )?${name}( \\d+)?$`) });
  await (desk ? b.first() : b.last()).click();
  await p.waitForTimeout(900);
};

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });

  const ONLY = process.env.ONLY || "phone,desktop,de"; // run parts separately on small machines
  for (const [label, vp, desk] of [["phone", { width: 390, height: 844 }, false], ["desktop", { width: 1400, height: 900 }, true]].filter(([l]) => ONLY.includes(l))) {
    console.log(`\n=== demo on a ${label} ===`);
    const p = await open(browser, vp, `${BASE}/bite.html?demo&reset&lang=en`);

    await step(`${label}: tabs`, async () => {
      check((await body(p)).includes("cooking for you today?"), `${label}: Home opens`);
      await noOverflow(p, `${label} Home`);
      for (const tab of ["Browse", "Messages", "Profile", "Home"]) {
        await nav(p, desk, tab);
        await noOverflow(p, `${label} ${tab}`);
      }
      check((await body(p)).includes("Wanna know more?"), `${label}: the "Wanna know more?" card links the app to the site`);
      const href = await p.locator(".ab-cta").getAttribute("href");
      check(href === "./?from=app", `${label}: the card points to the website (${href})`);
    });

    await step(`${label}: place search`, async () => {
      const search = async (typed, pick) => {
        await nav(p, desk, "Home");
        if (desk) await p.locator(".dh-resa-pick", { hasText: /any city|·|km/ }).first().click();
        else await p.getByText(/All cities|· \+\d+ km/).first().click();
        await p.waitForTimeout(500);
        await p.getByRole("combobox").fill(typed);
        await p.locator(".lp-suggest button", { hasText: pick }).first().click({ timeout: 10000 });
        await p.locator(".lp-done").click();
        await p.waitForTimeout(500);
        await (desk ? p.locator(".dh-resa-go") : p.getByRole("button", { name: /^Search/ }).first()).click();
        await p.waitForTimeout(2600);
        return body(p);
      };
      let t = await search("Hamburg", "Hamburg");
      const n = Number((t.match(/(\d+) meals? available/) || [])[1]);
      check(n > 0 && /\d(\.\d)? km/.test(t), `${label}: "Hamburg" finds ${n} meals, with distances`);
      t = await search("Aalen", "Aalen");
      check(/0 meals available/.test(t) && t.includes("No meals match your search"), `${label}: "Aalen" (no demo meals there) shows a clear empty state`);
      t = await search("10115", "10115");
      check(Number((t.match(/(\d+) meals? available/) || [])[1]) > 0, `${label}: a Berlin postcode (10115) finds Berlin meals`);
      await p.getByRole("button", { name: "Clear all" }).first().click();
      await p.waitForTimeout(800);
      check(/20 meals available/.test(await body(p)), `${label}: "Clear all" brings back all 20 meals`);
    });

    await step(`${label}: map`, async () => {
      await p.getByRole("tab", { name: "Map" }).click();
      await p.locator(".mm-group").first().waitFor({ timeout: 20000 });
      const groups = await p.locator(".mm-group").count();
      check(groups >= 5, `${label}: the map of Germany shows the meals grouped by city (${groups} groups)`);
      await p.locator(".mm-group").first().click();
      await p.waitForTimeout(2500);
      const pins = await p.locator(".mm-pin").count();
      check(pins >= 1, `${label}: tapping a group zooms in to single price pins (${pins})`);
      await p.locator(".mm-pin").first().click();
      await p.locator(".mm-card").waitFor({ timeout: 5000 });
      check(true, `${label}: tapping a pin shows the meal card`);
      await noOverflow(p, `${label} map`);
      await p.locator(".mm-card-main").click();
      await p.waitForTimeout(1500);
      check((await body(p)).includes("Something not right? Report or block"), `${label}: the card opens the meal page`);
      await p.goBack(); await p.waitForTimeout(1200);
      await p.getByRole("tab", { name: "List" }).click();
    });

    await step(`${label}: report and block`, async () => {
      await p.goto(`${BASE}/bite.html?demo&lang=en&meal=1`); await p.waitForTimeout(1500);
      const host = ((await body(p)).match(/with ([A-Z][a-z]+ [A-Z]\.)/) || [])[1] || "Maria K.";
      await p.getByText("Something not right? Report or block").click();
      await p.getByRole("button", { name: /Report this meal/ }).click();
      await p.waitForTimeout(400);
      check(await p.getByRole("button", { name: "Send report" }).isDisabled(), `${label}: a report needs a reason first`);
      await p.getByRole("radio", { name: /Something else/ }).click();
      check(await p.getByRole("button", { name: "Send report" }).isDisabled(), `${label}: "Something else" needs a few words`);
      await p.locator("#sf-details").fill("Testing the report flow");
      await p.getByRole("button", { name: "Send report" }).click();
      await p.getByText("Report received").waitFor({ timeout: 5000 });
      check(true, `${label}: the report is received`);
      await p.getByRole("button", { name: "Back to Bite" }).click();
      await p.waitForTimeout(500);
      await p.getByText("Something not right? Report or block").click();
      await p.getByRole("button", { name: /^Block / }).first().click();
      await p.waitForTimeout(500);
      await p.getByRole("button", { name: /^Block [A-Z]/ }).last().click();
      await p.waitForTimeout(1500);
      await nav(p, desk, "Browse");
      check(!(await body(p)).includes(host), `${label}: after blocking, ${host}'s meals are gone from the list`);
      await nav(p, desk, "Profile");
      await p.getByRole("button", { name: /Settings/ }).first().click();
      await p.waitForTimeout(600);
      check((await body(p)).includes(host), `${label}: ${host} is listed under Blocked people`);
      await p.getByRole("button", { name: "Unblock" }).first().click();
      await p.waitForTimeout(600);
      await p.keyboard.press("Escape").catch(() => {});
      await p.goto(`${BASE}/bite.html?demo&lang=en`); await p.waitForTimeout(1200);
      await nav(p, desk, "Browse");
      check((await body(p)).includes(host), `${label}: after unblocking, ${host}'s meals are back`);
    });

    await step(`${label}: book and chat`, async () => {
      await p.goto(`${BASE}/bite.html?demo&lang=en&meal=3`); await p.waitForTimeout(1500);
      await p.getByRole("button", { name: /€/ }).last().click(); await p.waitForTimeout(600);
      await p.getByRole("button", { name: /Confirm & pay/ }).click();
      check((await body(p)).includes("Please accept the booking terms"), `${label}: booking without accepting the terms is stopped`);
      await p.locator("input.tick-input").check({ force: true });
      await p.getByRole("button", { name: /Confirm & pay/ }).click();
      await p.getByRole("heading", { name: "Your table is booked!" }).waitFor({ timeout: 6000 });
      await p.waitForTimeout(2800);
      check((await body(p)).includes("Booking confirmed"), `${label}: booked, the chat opens with the confirmation`);
      const box = p.getByRole("textbox", { name: /Message/ });
      await box.fill("Can I bring a dessert?");
      await box.press("Enter");
      await p.waitForTimeout(4500);
      check((await body(p)).includes("Can I bring a dessert?"), `${label}: my message is in the chat`);
      await p.getByRole("button", { name: "Safety: report or block" }).click();
      await p.getByRole("button", { name: /^Report [A-Z]/ }).click();
      await p.getByRole("radio", { name: /Harassment/ }).click();
      await p.getByRole("button", { name: "Send report" }).click();
      await p.getByText("Report received").waitFor({ timeout: 5000 });
      check(true, `${label}: a person can be reported from the chat`);
      await p.getByRole("button", { name: "Back to Bite" }).click();
      await noOverflow(p, `${label} chat`);
    });

    await step(`${label}: hosting with the house rules`, async () => {
      const d = new Date(Date.now() + 3 * 86400000);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const form = { serviceType: "eat-together", eventTitle: "Sim night", mealName: "Simulation risotto", cuisineType: "Italian", description: "A test dinner.", mainDishes: "Risotto", appetizers: "", desserts: "", drinksIncluded: true, dietary: [], allergens: [], allergyNotes: "", maxGuests: 4, minGuests: 1, address: "Teststraße 1", city: "Aalen", date: iso, startTime: "19:30", endTime: "22:00", groceryCost: 20, costSource: "receipt", receiptRead: 20, pricePerGuest: 4, freeEvent: false, photos: ["app/img/1554054204-800x533.jpg"], coverIdx: 0, ingredientsText: "Lamb, apricots, onions, couscous (wheat), olive oil, cinnamon, salt", declared: true };
      const publish = async () => {
        await p.evaluate((f) => localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: 7, form: f })), form);
        await p.goto(`${BASE}/bite.html?demo&host&lang=en`); await p.waitForTimeout(1500);
        await p.getByRole("button", { name: /Publish event/ }).click();
        await p.waitForTimeout(1200);
      };
      await publish();
      check((await body(p)).includes("Six promises every host makes"), `${label}: the first table asks for the house rules`);
      await p.getByText("I have read the house rules and I will follow them").click();
      await p.getByRole("button", { name: "Accept and continue" }).click();
      await p.waitForTimeout(2500);
      check((await body(p)).includes("Simulation risotto"), `${label}: after accepting, the meal is published`);
      await publish();
      await p.waitForTimeout(1500);
      check(!(await body(p)).includes("Six promises every host makes") && (await body(p)).includes("Simulation risotto"), `${label}: the second table does not ask again`);
    });

    check(p.problems.length === 0, `${label}: no errors, no broken files${p.problems.length ? " → " + p.problems.slice(0, 5).join(" | ") : ""}`);
    await p.context().close();
  }

  // ---------------------------------------------------------------- German sweep (dev build lists missing texts)
  if (ONLY.includes("de")) console.log("\n=== German sweep (phone and desktop) ===");
  if (ONLY.includes("de")) for (const [label, vp, desk] of [["phone", { width: 390, height: 844 }, false], ["desktop", { width: 1400, height: 900 }, true]]) {
    let p;
    try { p = await open(browser, vp, `${DEV}/bite.html?demo&reset&lang=de`); } catch { console.log("skip  German sweep: dev server not running on", DEV); break; }
    p.problems = p.problems.filter((x) => !x.includes("[vite]"));
    for (const tab of ["Entdecken", "Nachrichten", "Profil", "Start"]) {
      await nav(p, desk, tab).catch(() => {});
      await noOverflow(p, `DE ${label} ${tab}`);
    }
    await p.goto(`${DEV}/bite.html?demo&lang=de&meal=2`); await p.waitForTimeout(1500);
    await p.getByText(/Stimmt etwas nicht/).click().catch(() => {});
    await p.waitForTimeout(500);
    await p.getByRole("button", { name: /Dieses Gericht melden/ }).click().catch(() => {});
    await p.waitForTimeout(500);
    await noOverflow(p, `DE ${label} report`);
    await p.goto(`${DEV}/bite.html?demo&lang=de`); await p.waitForTimeout(1200);
    await nav(p, desk, "Entdecken").catch(() => {});
    await p.getByRole("tab", { name: "Karte" }).click().catch(() => {});
    await p.waitForTimeout(4000);
    await noOverflow(p, `DE ${label} map`);
    const missing = await p.evaluate(() => [...(window.__i18nMissing || [])]);
    const real = missing.filter((m) => /[a-z]{3}/i.test(m) && !/^https?:|@|^\d/.test(m));
    check(real.length === 0, `DE ${label}: every text shown is translated${real.length ? " → missing: " + real.slice(0, 12).join(" | ") : ""}`);
    check(p.problems.length === 0, `DE ${label}: no errors${p.problems.length ? " → " + p.problems.slice(0, 4).join(" | ") : ""}`);
    await p.context().close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
