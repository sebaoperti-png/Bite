// Read-only check of the published site (https://bitetable.de): every page opens without errors, every
// image and file loads, internal links lead somewhere, the landing's sections exist, the live app opens for
// visitors with its map and place search. Nothing is written anywhere (no sign-up, no survey answer).
const { chromium } = require("playwright");
const SITE = process.env.SITE || "https://bitetable.de";
let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log("ok  ", m); } else { fail++; console.log("FAIL", m); } };

(async () => {
  const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  for (const [label, vp] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1400, height: 900 }]]) {
    const ctx = await browser.newContext({ viewport: vp, geolocation: { latitude: 48.8376, longitude: 10.093 }, permissions: ["geolocation"] }); await ctx.addInitScript(() => { try { localStorage.setItem("bite_tour_v1", "1"); } catch {} });
    const problems = [];
    ctx.on("response", (r) => { if (r.url().startsWith(SITE) && r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
    for (const path of ["/", "/bite.html?live&lang=en", "/bite.html?demo&lang=de", "/legal.html", "/stand.html"]) {
      const p = await ctx.newPage();
      const errs = [];
      p.on("pageerror", (e) => errs.push(e.message));
      await p.goto(SITE + path, { waitUntil: "networkidle", timeout: 45000 });
      await p.waitForTimeout(2500);
      const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:")).map((i) => i.src));
      const over = await p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      check(errs.length === 0 && broken.length === 0 && over <= 1, `${label} ${path}: opens cleanly${errs.length ? " errors: " + errs.join(" | ") : ""}${broken.length ? " broken images: " + broken.join(", ") : ""}${over > 1 ? ` ${over}px too wide` : ""}`);
      if (path === "/") {
        const ids = ["how", "services", "cooks", "sous-chef", "safety", "help", "waitlist"];
        const missing = await p.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), ids);
        check(missing.length === 0, `${label} landing: all sections are there${missing.length ? " missing: " + missing.join(", ") : ""}`);
        const links = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")));
        const internal = [...new Set(links.filter((h) => h && !h.startsWith("#") && !/^(https?:|mailto:|tel:|javascript:)/.test(h)))];
        const hashes = [...new Set(links.filter((h) => h && h.startsWith("#") && h.length > 1).map((h) => h.slice(1)))];
        const deadHash = await p.evaluate((hs) => hs.filter((h) => !document.getElementById(h)), hashes);
        check(deadHash.length === 0, `${label} landing: every in-page link has its section${deadHash.length ? " dead: " + deadHash.join(", ") : ""}`);
        for (const h of internal) {
          const res = await ctx.request.get(new URL(h, SITE + "/").toString());
          check(res.status() < 400, `${label} landing link ${h} → ${res.status()}`);
        }
        const mails = links.filter((h) => h && h.startsWith("mailto:"));
        check(mails.length > 0 && mails.every((m) => m.includes("hello@bitetable.de")), `${label} landing: contact links go to hello@bitetable.de (${mails.length})`);
      }
      if (path.startsWith("/bite.html?live")) {
        const t = await p.locator("body").innerText();
        check(t.includes("cooking for you today?") && !t.includes("Welcome back"), `${label} live app: visitors see Home, no log-in wall`);
        await p.evaluate(() => sessionStorage.setItem("bite_view", "map"));
        await p.getByRole("button", { name: "Browse" }).last().click();
        await p.waitForTimeout(8000);
        check(await p.locator(".mm canvas").count() === 1 && !(await p.locator(".mm-fallback").count()), `${label} live app: the map is drawn`);
        await p.getByRole("tab", { name: "List" }).click();
        await p.goto(SITE + "/bite.html?live&lang=en", { waitUntil: "networkidle" });
        await p.waitForTimeout(1500);
        if (label === "phone") await p.getByText("All cities").first().click(); else await p.locator(".dh-resa-pick", { hasText: /any city/ }).first().click();
        await p.getByRole("combobox").fill("Aalen");
        await p.locator(".lp-suggest button").first().waitFor({ timeout: 10000 });
        check((await p.locator(".lp-suggest button").first().innerText()).includes("Aalen"), `${label} live app: typing "Aalen" suggests Aalen`);
        await p.locator(".lp-me").click();
        await p.locator(".lp-map .mm canvas").waitFor({ timeout: 15000 }).catch(() => {});
        await p.waitForTimeout(3000);
        check(await p.locator(".lp-map .mm canvas").count() === 1 && await p.locator(".lp-map .mm-me").count() === 1 && (await p.locator(".lp-pick").innerText()).includes("Near you"),
          `${label} live app: "Use my location" shows a real map with you on it`);
      }
      await p.close();
    }
    check(problems.length === 0, `${label}: no missing files on the server${problems.length ? " → " + problems.slice(0, 6).join(" | ") : ""}`);
    await ctx.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
