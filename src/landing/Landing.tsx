import { useEffect, useState } from "react";
import { LandingNav } from "./sections/LandingNav";
import { LandingIntro, AppTransition, APP_TRANSITION_MS } from "./sections/LandingIntro";
import { LandingAssistant } from "./sections/LandingAssistant";
import { LandingHero } from "./sections/LandingHero";
import { LandingLogoMarquee } from "./sections/LandingLogoMarquee";
import { LandingHowItWorks } from "./sections/LandingHowItWorks";
import { LandingServices } from "./sections/LandingServices";
import { LandingForCooks } from "./sections/LandingForCooks";
import { LandingSafety } from "./sections/LandingSafety";
import { LandingHelpCustomerService } from "./sections/LandingHelpCustomerService";
import { LandingTestimonial } from "./sections/LandingTestimonial";
import { LandingBecomeAHost } from "./sections/LandingBecomeAHost";
import { LandingSavings } from "./sections/LandingSavings";
import { LandingFooter } from "./sections/LandingFooter";
import { LandingCookieConsent } from "./sections/LandingCookieConsent";
import { useLang, t } from "../shared/i18n";
import { LandingMobileStickyCta } from "./sections/LandingMobileStickyCta";

const CONSENT_KEY = "bite_cookie_consent";
type Consent = { functional: boolean; analytics: boolean; marketing: boolean };

/**
 * The Bite landing page. Each block of the page lives in its own file in ./sections,
 * in the same order as below: to change a block, edit its file; to move or remove one, edit this list.
 */
export function Landing() {
  const lang = useLang(); // re-render the whole page when the language changes
  useEffect(() => { document.title = t("Bite — Real food, real people, your neighbourhood"); }, [lang]);
  const [showCookies, setShowCookies] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefFunctional, setPrefFunctional] = useState(false);
  const [prefAnalytics, setPrefAnalytics] = useState(false);
  const [prefMarketing, setPrefMarketing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); } catch { /* ignore */ }
    if (!saved) setShowCookies(true);

    // "Cookie settings" link in the footer reopens the banner with the preferences open
    const onSettings = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("[data-cookie-settings]");
      if (!a) return;
      e.preventDefault();
      setShowCookies(true);
      setShowPrefs(true);
    };
    // Any link to the app plays the "bite" animation first, then opens the app
    const onOpenApp = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="bite.html"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      const href = a.getAttribute("href")!;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) { window.location.href = href; return; }
      setLeaving(true);
      setTimeout(() => { window.location.href = href; }, APP_TRANSITION_MS);
    };
    // Coming back with the back button: remove the fade
    const onPageShow = () => setLeaving(false);
    document.addEventListener("click", onSettings);
    document.addEventListener("click", onOpenApp);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onSettings);
      document.removeEventListener("click", onOpenApp);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const persist = (c: Consent) => {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...c, ts: Date.now() })); } catch { /* ignore */ }
    setShowCookies(false);
    setShowPrefs(false);
  };

  const cookieProps = {
    showCookies,
    showPrefs,
    hidePrefs: !showPrefs,
    prefFunctional,
    prefAnalytics,
    prefMarketing,
    openPrefs: () => setShowPrefs(true),
    toggleFunctional: () => setPrefFunctional((v) => !v),
    toggleAnalytics: () => setPrefAnalytics((v) => !v),
    toggleMarketing: () => setPrefMarketing((v) => !v),
    acceptAll: () => persist({ functional: true, analytics: true, marketing: true }),
    rejectAll: () => persist({ functional: false, analytics: false, marketing: false }),
    savePrefs: () => persist({ functional: prefFunctional, analytics: prefAnalytics, marketing: prefMarketing }),
  };

  return (
    <div style={{ overflowX: "clip" }}>
      <LandingIntro />
      <LandingNav />
      <LandingHero />
      <LandingLogoMarquee />
      <LandingSavings />
      <LandingHowItWorks />
      <LandingServices />
      <LandingForCooks />
      <LandingBecomeAHost />
      <LandingSafety />
      <LandingTestimonial />
      <LandingHelpCustomerService />
      <LandingFooter />
      <LandingCookieConsent {...cookieProps} />
      <LandingMobileStickyCta />
      <LandingAssistant />

      {/* Bite animation played while jumping into the app */}
      {leaving && <AppTransition />}
    </div>
  );
}
