// The demo (default mode) must keep working exactly as before: book a meal, get the confirmation and the chat.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  let errors = 0; p.on("pageerror", (e) => { errors++; console.log("PAGE ERROR", e.message); });
  let net = 0; ctx.on("request", (r) => { if (r.url().includes("supabase.co")) net++; });
  await p.goto("http://localhost:4173/bite.html?demo&reset&lang=en&meal=1"); await p.waitForTimeout(1500);
  await p.getByRole("button", { name: /€/ }).last().click(); await p.waitForTimeout(600);
  await p.locator("input.tick-input").check({ force: true });
  await p.getByRole("button", { name: /Confirm & pay/ }).click();
  await p.getByRole("heading", { name: "Your table is booked!" }).waitFor({ timeout: 6000 });
  await p.waitForTimeout(2600);
  const txt = await p.locator("body").innerText();
  const ok = txt.includes("Booking confirmed") && errors === 0 && net === 0;
  console.log(ok ? "ok   demo booking works as before, no server calls" : "FAIL demo", { errors, net });
  await b.close(); process.exit(ok ? 0 : 1);
})();
