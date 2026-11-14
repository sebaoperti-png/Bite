// Run: npx vite preview --port 4173 (in another terminal), then: node e2e/live_auth.test.cjs (needs Playwright)
// End-to-end check of live sign-up / log-in / profile saving, with Supabase mocked at the network level
// (no request leaves this machine; no real account is created).
const { chromium } = require("playwright");

(async () => {
const BASE = "http://localhost:4173";
const SB = "https://hvwcuiknfqhbrjdbcooz.supabase.co";
const USER_ID = "11111111-2222-3333-4444-555555555555";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, exp, aud: "authenticated", role: "authenticated", email: "lena@example.com" })}.sig`;
const user = { id: USER_ID, aud: "authenticated", role: "authenticated", email: "lena@example.com", user_metadata: { name: "Lena M." }, app_metadata: {}, identities: [{ id: "x" }], created_at: new Date().toISOString() };
const session = { access_token: jwt, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "r1", user };

let profileRow = { id: USER_ID, name: "Lena M.", bio: "", photo_url: null, dietary: [], city: "Aalen", postal_code: "73430", country: "Germany", notifications: true, news: false, verified: false };
const calls = [];
let pass = 0, fail = 0;
const check = (cond, msg) => { if (cond) { pass++; console.log("ok  ", msg); } else { fail++; console.log("FAIL", msg); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(() => { try { localStorage.setItem("bite_tour_v1", "1"); } catch {} });
const page = await ctx.newPage();
page.on("pageerror", (e) => { fail++; console.log("PAGE ERROR", e.message); });

await ctx.route(`${SB}/**`, async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  const body = req.postData() ? JSON.parse(req.postData()) : null;
  calls.push({ method: req.method(), path: url.pathname + url.search, body, auth: req.headers()["authorization"] ?? "" });
  const json = (status, data) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
  if (url.pathname === "/auth/v1/signup") return json(200, { ...user, email: body.email, user_metadata: body.data, identities: [{ id: "x" }] });
  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password") {
    if (body.password !== "correct-horse-9") return json(400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
    return json(200, session);
  }
  if (url.pathname === "/auth/v1/recover") return json(200, {});
  if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, body: "" });
  if (url.pathname === "/auth/v1/user") return json(200, user);
  if (url.pathname === "/rest/v1/profiles" && req.method() === "GET") return json(200, profileRow);
  if (url.pathname === "/rest/v1/profiles" && req.method() === "PATCH") { profileRow = { ...profileRow, ...body }; return route.fulfill({ status: 204, body: "" }); }
  return json(404, { msg: "not mocked: " + url.pathname });
});

const text = () => page.locator("body").innerText();

// 1. live mode, nobody signed in -> a visitor can look around; the account is asked for only to act
await page.goto(`${BASE}/bite.html?live&lang=en`);
await page.waitForTimeout(2500);
check(!(await page.getByRole("heading", { name: "Welcome back" }).count()) && (await text()).includes("cooking for you today?"), "live mode opens on Home for visitors, without a log-in wall");
await page.getByRole("button", { name: "Your profile" }).first().click();
await page.getByRole("heading", { name: "Create your account" }).waitFor({ timeout: 8000 });
check((await text()).includes("Log in to see your profile and bookings."), "opening the profile as a visitor asks for an account, saying why");
await page.goto(`${BASE}/bite.html?live&login&lang=en`);
await page.getByRole("heading", { name: "Welcome back" }).waitFor({ timeout: 10000 });
check(true, "bite.html?live&login opens the log-in screen");
check(!(await text()).includes("Continue with the demo account"), "no demo-account shortcut in live mode");
check((await text()).includes("Frankfurt"), "privacy note mentions servers in Frankfurt");

// 2. sign up -> check your inbox
await page.getByRole("tab", { name: "Sign up" }).click();
await page.getByLabel("Full name").fill("Lena Maier");
await page.getByLabel("Email").fill("Lena@Example.com ");
await page.getByRole('textbox', { name: /^Password/ }).fill("short");
await page.getByRole("button", { name: "Create account" }).click();
check((await text()).includes("At least 8 characters"), "too-short password is refused before sending");
check(!calls.some((c) => c.path.startsWith("/auth/v1/signup")), "nothing sent while the form has errors");
await page.getByRole('textbox', { name: /^Password/ }).fill("correct-horse-9");
await page.getByLabel("Keep me updated on Bite's news").check();
await page.getByRole("button", { name: "Create account" }).click();
await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
const su = calls.find((c) => c.path.startsWith("/auth/v1/signup"));
check(su.body.email === "lena@example.com", "email is trimmed and lower-cased");
check(su.body.data.name === "Lena M." && su.body.data.news === true, "name and newsletter choice are sent with the sign-up");
check(su.path.includes("redirect_to=") && decodeURIComponent(su.path).includes("bite.html?live"), "confirmation link brings people back to the live app");
await page.getByRole("button", { name: "Back to log in" }).click();

// 3. wrong password -> friendly error
await page.getByLabel("Email").fill("lena@example.com");
await page.getByRole('textbox', { name: /^Password/ }).fill("wrong-password");
await page.getByRole("button", { name: "Log in", exact: true }).last().click();
await page.getByText("Wrong email or password.").waitFor();
check(true, "wrong password shows a friendly message");

// 4. forgot password
await page.getByRole("button", { name: "Forgot password?" }).click();
await page.getByRole("heading", { name: "Check your inbox" }).waitFor();
check(calls.some((c) => c.path.startsWith("/auth/v1/recover")), "password reset email is requested");
await page.getByRole("button", { name: "Back to log in" }).click();

// 5. correct password -> home, profile loaded from the database
await page.getByLabel("Email").fill("lena@example.com");
await page.getByRole('textbox', { name: /^Password/ }).fill("correct-horse-9");
await page.getByRole("button", { name: "Log in", exact: true }).last().click();
await page.waitForFunction(() => !document.body.innerText.includes("Welcome back") || document.body.innerText.includes("Welcome back, "), null, { timeout: 10000 });
await page.waitForTimeout(1500);
check(calls.some((c) => c.method === "GET" && c.path.startsWith("/rest/v1/profiles") && c.auth.includes(jwt)), "profile is read with the user's own token (so the security rules apply)");
const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("sb-")));
check(stored.length === 1, "session kept in this browser (stays logged in after reload)");
const pw = await page.evaluate(() => JSON.stringify(localStorage).includes("correct-horse-9"));
check(!pw, "the password is never stored in the browser");
await page.screenshot({ path: "/tmp/e2e_home.png" });

// 6. reload -> still signed in, no log-in screen
await page.reload();
await page.waitForTimeout(2500);
check(!(await text()).includes("Create your account") && !(await page.getByRole("heading", { name: "Welcome back" }).count()), "after a reload the person is still logged in");
await page.screenshot({ path: "/tmp/e2e_reload.png" });

// 7. a profile change is saved to the database
await page.evaluate(() => { /* open Profile tab */ });
await page.getByRole("button", { name: "Profile" }).last().click();
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/e2e_profile.png" });
const before = calls.filter((c) => c.method === "PATCH").length;
const settings = page.getByText("Settings", { exact: true }).first();
await settings.click();
await page.waitForTimeout(600);
await page.getByRole("switch", { name: /Keep me updated/ }).click();
await page.waitForTimeout(1200);
const patch = calls.filter((c) => c.method === "PATCH").slice(before)[0];
check(patch && patch.body.news === true && patch.path.includes(`id=eq.${USER_ID}`) && patch.auth.includes(jwt), "changing a setting saves it to the person's own profile row");
check(profileRow.news === true, "the database copy now has the new value");
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// 8. log out -> back to the log-in screen, session removed
await page.getByRole("button", { name: /Log out/ }).first().click().catch(async () => {
  await settings.click(); await page.waitForTimeout(500); await page.getByRole("button", { name: /Log out/ }).first().click();
});
await page.waitForTimeout(1500);
check((await text()).includes("cooking for you today?") && (await text()).includes("Log in"), "log out returns to Home as a visitor");
const left = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("sb-")).length);
check(left === 0, "the session is removed from the browser on log out");

// 9. demo mode is untouched
await page.goto(`${BASE}/bite.html?demo&lang=en`);
await page.waitForTimeout(2000);
check((await text()).includes("Sebastiano"), "bite.html?demo still opens the demo with the demo account");
const demoCalls = calls.length;
await page.waitForTimeout(1000);
check(calls.length === demoCalls, "the demo sends nothing to the server");

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
process.exit(fail ? 1 : 0);

})().catch((e) => { console.error(e); process.exit(1); });
