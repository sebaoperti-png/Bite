// Cookie-free visitor statistics (Umami or Plausible): page views and where people come from, no cookies, nothing
// stored on the device, no personal profiles, so no consent banner is needed for it (§ 25 TDDDG, Art. 6(1)(f) GDPR).
//
// OFF until you fill in ANALYTICS below, then push: every page (landing, app, legal, survey, feedback) loads the script.
// The privacy policy (legal.html#privacy, "Recipients & processors") shows the matching line automatically once it is on.
//
//   Umami Cloud, free "Hobby" plan (recommended, costs nothing): sign up at cloud.umami.is, choose the EU data region
//   when asked (it cannot be changed later), add the website "bitetable.de", copy its Website ID and the script URL, then
//     export const ANALYTICS: Analytics = { provider: "umami", websiteId: "<the Website ID>", src: "<the script URL Umami shows>" };
//   Plausible (paid, after a trial): create the site "bitetable.de" at plausible.io, then
//     export const ANALYTICS: Analytics = { provider: "plausible", domain: "bitetable.de" };
//     (if Plausible gives you a personal script like https://plausible.io/js/pa-XXXX.js, add  src: "<that URL>")
export type Analytics =
  | { provider: "plausible"; domain: string; src?: string }
  | { provider: "umami"; websiteId: string; src?: string }
  | null;

// ON since 14 Nov 2026: Umami Cloud, free Hobby plan, EU data region, website "Bite" (bitetable.de)
export const ANALYTICS: Analytics = { provider: "umami", websiteId: "dabe1f74-8809-493c-af1b-41f145ccd09c", src: "https://cloud.umami.is/script.js" };

/** adds the provider's script once; does nothing while ANALYTICS is null, on localhost, or in automated browsers */
export function startAnalytics() {
  if (!ANALYTICS || typeof document === "undefined") return;
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver) return;
  if (document.querySelector("script[data-bite-analytics]")) return;
  const s = document.createElement("script");
  s.defer = true;
  s.dataset.biteAnalytics = ANALYTICS.provider;
  if (ANALYTICS.provider === "plausible") {
    s.src = ANALYTICS.src || "https://plausible.io/js/script.js";
    s.dataset.domain = ANALYTICS.domain;
    // Plausible's newer personal scripts (…/js/pa-XXXX.js) expect this small queue + init before they load
    if (/\/pa-[\w-]+\.js$/.test(s.src)) {
      const w = window as unknown as { plausible?: ((...a: unknown[]) => void) & { q?: unknown[]; o?: unknown; init?: (o?: unknown) => void } };
      const p = w.plausible || Object.assign((...a: unknown[]) => { (p.q = p.q || []).push(a); }, {} as { q?: unknown[]; o?: unknown; init?: (o?: unknown) => void });
      p.init = p.init || ((o?: unknown) => { p.o = o || {}; });
      w.plausible = p; p.init();
    }
  } else {
    s.src = ANALYTICS.src || "https://cloud.umami.is/script.js";
    s.dataset.websiteId = ANALYTICS.websiteId;
  }
  document.head.appendChild(s);
}
