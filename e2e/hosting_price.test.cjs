// The price step of "Start hosting" (Split the cost): Bite's estimate, scanning a real receipt photo (OCR in the
// browser), the sample receipt, typing a total, totals that are too high or too little, the cap on the stepper,
// and what guests see on the meal page. Phone and desktop, demo mode.
// Run `npx vite preview --port 4173` first (or BASE=…). OCR downloads its language data from a CDN the first time.
const { chromium } = require("playwright");
const path = require("path");
const BASE = process.env.BASE || "http://localhost:4173";
let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log("ok  ", m); } else { fail++; console.log("FAIL", m); } };
const euros = (s) => Number(String(s).replace(/[^\d,.]/g, "").replace(",", "."));

const d = new Date(Date.now() + 3 * 86400000);
const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const FORM = { serviceType: "eat-together", eventTitle: "Price night", mealName: "Price test risotto", cuisineType: "Italian", description: "A test dinner.", mainDishes: "Risotto", appetizers: "Bruschetta", desserts: "", drinksIncluded: false, dietary: [], allergens: [], allergyNotes: "", maxGuests: 4, minGuests: 1, address: "Teststraße 1", city: "Aalen", date: iso, startTime: "19:30", endTime: "22:00", groceryCost: 42, costSource: null, pricePerGuest: 6, freeEvent: false, photos: ["app/img/1554054204-800x533.jpg"], coverIdx: 0, ingredientsText: "Lamb, apricots, onions, couscous (wheat), olive oil, cinnamon, salt", declared: true };

(async () => {
  const browser = await chromium.launch();
  for (const [label, vp] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1400, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    const body = () => p.locator("body").innerText();
    const openStep = async (form = FORM) => {
      await p.goto(`${BASE}/bite.html?demo&lang=en`); await p.waitForTimeout(500);
      await p.evaluate((f) => { localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: 4, form: f })); }, form);
      await p.goto(`${BASE}/bite.html?demo&host&lang=en`); await p.getByText("Split the cost").first().waitFor();
    };
    const total = p.locator('input[type="number"]');
    const chip = async (re) => euros((await p.getByText(re).first().innerText()).split(" ").pop());
    const stepperValue = async () => euros(await p.getByRole("button", { name: "Less" }).locator("xpath=following-sibling::span[1]").innerText());
    const plusUntilStuck = async () => { const plus = p.getByRole("button", { name: "More" }); for (let i = 0; i < 40 && await plus.isEnabled(); i++) await plus.click(); };
    const next = p.getByRole("button", { name: /Continue/ });

    // ---- Bite's estimate
    await openStep();
    await p.getByText("Let Bite estimate").click();
    const est = euros((await p.getByText(/Estimated groceries/).locator("..").innerText()).split("\n").pop());
    const cap = await chip(/^Price cap/);
    const fair = await chip(/^Fair share/);
    check(est > 0 && Math.abs(fair - Math.round(est / 5 * 100) / 100) < 0.011, `${label} estimate: €${est} for 5 people, fair share €${fair}`);
    await plusUntilStuck();
    check(await stepperValue() === cap && cap * 4 <= est, `${label} estimate: the stepper stops at the cap €${cap} (4 guests × €${cap} ≤ €${est})`);
    check((await body()).includes("never pay more than the groceries"), `${label} estimate: the rule is explained`);

    // ---- a real receipt photo, read in the browser
    p.once("filechooser", (fc) => fc.setFiles(path.join(__dirname, "fixtures/receipt-34-81.jpg")));
    await p.getByText("Scan your receipt").click();
    await p.getByText(/Found €|couldn't find|Couldn't read/).first().waitFor({ timeout: 90000 });
    const t1 = await body();
    check(t1.includes("Found €34.81"), `${label} receipt photo: reads €34.81${t1.includes("Found €") ? " (read " + t1.match(/Found (€[\d.]+)/)[1] + ")" : ""}`);
    check(await total.inputValue() === "34.81" && await chip(/^Price cap/) === 8 && await stepperValue() === 7, `${label} receipt photo: suggested €7, cap €8 (34.81 ÷ 5 = 6.96)`);

    // ---- typing a different total: honest label
    await total.fill("30");
    check((await body()).includes("You changed the total, so guests will see it as stated by you."), `${label} typed total: marked as stated by the host`);
    check(await chip(/^Price cap/) === 7 && await stepperValue() === 6, `${label} typed total €30: suggested €6, cap €7`);
    await total.fill("34.81");
    check(!(await body()).includes("You changed the total"), `${label} typing the scanned total back makes it receipt-backed again`);

    // ---- too high for this menu
    await total.fill("400");
    const t2 = await body();
    check(t2.includes("much more than this menu usually costs"), `${label} €400 for a risotto for 5: warned`);
    await total.fill("401");
    await next.click(); await p.waitForTimeout(300);
    check((await body()).includes("Scan the receipt to use this total") && (await body()).includes("Split the cost"), `${label} a typed €401 cannot be used without a scan`);

    // ---- too little to split
    await total.fill("3");
    check((await body()).includes("too little to split") && !(await p.getByRole("button", { name: "More" }).count()), `${label} €3 for 5 people: no price can be set`);
    await p.getByRole("button", { name: "Make it free" }).click();
    check((await body()).includes("It's on me") && !(await body()).includes("too little to split"), `${label} "Make it free" turns it into a free meal`);
    await p.getByText("It's on me").first().click(); // back to paid

    // ---- the sample receipt (demo only)
    await openStep({ ...FORM, costSource: "declared", groceryCost: 0 });
    await p.getByRole("button", { name: "Try a sample receipt" }).click();
    await p.getByText(/Found €|couldn't find/).first().waitFor({ timeout: 90000 });
    check((await body()).includes("Found €42.25"), `${label} sample receipt: reads €42.25`);
    if (await p.getByRole("button", { name: "That's right" }).count()) {
      await next.click(); await p.waitForTimeout(300);
      check((await body()).includes("Split the cost"), `${label} a hard-to-read receipt must be confirmed before going on`);
      await p.getByRole("button", { name: "That's right" }).click();
    }
    await next.click(); await p.waitForTimeout(500);
    check(!(await body()).includes("Split the cost"), `${label} with a confirmed receipt the next step opens`);

    // ---- what guests see: a typed total is "Stated by the host"
    await p.evaluate((f) => localStorage.setItem("bite_hosting_draft", JSON.stringify({ step: 7, form: f })), { ...FORM, costSource: "declared", groceryCost: 30, pricePerGuest: 6 });
    await p.goto(`${BASE}/bite.html?demo&host&lang=en`); await p.waitForTimeout(1200);
    await p.getByRole("button", { name: /Publish event/ }).click(); await p.waitForTimeout(1200);
    if ((await body()).includes("Six promises every host makes")) {
      await p.getByText("I have read the house rules and I will follow them").click();
      await p.getByRole("button", { name: "Accept and continue" }).click(); await p.waitForTimeout(2500);
    }
    await p.getByText("Price test risotto").first().click(); await p.waitForTimeout(1200);
    const t3 = await body();
    check(t3.includes("Stated by the host") && t3.includes("€6 each"), `${label} meal page: "Stated by the host", €30 ÷ 5 = €6 each`);

    check(errs.length === 0, `${label}: no page errors ${errs.join(" | ")}`);
    await ctx.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
