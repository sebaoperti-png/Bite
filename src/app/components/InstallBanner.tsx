// "No app store app yet": on phones, a small card on the app home that explains Bite can live on the home screen
// as a web app (manifest: public/bite.webmanifest, display standalone). Android/Chrome: one tap opens the browser's
// own install prompt (beforeinstallprompt). iPhone/iPad: Safari has no prompt, so we show the two steps (Share,
// then "Add to Home Screen"). Hidden when Bite already runs from the home screen, on desktop, or once closed.
import { useEffect, useState } from "react";
import { t } from "../../shared/i18n";

const KEY = "bite_install_banner";
type Prompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: Prompt | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as Prompt; });
}

const standalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [steps, setSteps] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    let closed = false;
    try { closed = localStorage.getItem(KEY) === "closed"; } catch { /* private mode */ }
    if (closed || standalone() || !window.matchMedia("(pointer: coarse)").matches) return;
    setShow(true);
    setCanPrompt(!!deferred);
    const onPrompt = () => setCanPrompt(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => close();
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { try { localStorage.setItem(KEY, "closed"); } catch { /* ignore */ } setShow(false); };
  const add = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      if (outcome === "accepted") close(); else setCanPrompt(false);
      return;
    }
    setSteps((s) => !s);
  };

  if (!show) return null;
  const ios = isIOS();
  return (
    <section className="ib" aria-labelledby="ib-title">
      <button type="button" className="ib-x" onClick={close} aria-label={t("Close")}>
        <svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div className="ib-row">
        <span className="ib-icon" aria-hidden><img src="bite-icon-192.png" alt="" /></span>
        <div>
          <h2 id="ib-title">{t("Keep Bite on your home screen")}</h2>
          <p>{t("There is no app in the stores yet. Add this page and Bite opens full screen, like an app.")}</p>
        </div>
      </div>
      <button type="button" className="ib-add" onClick={add} aria-expanded={canPrompt ? undefined : steps}>
        {canPrompt ? t("Add to home screen") : steps ? t("Hide the steps") : t("Show me how")}
      </button>
      {steps && !canPrompt && (
        <ol className="ib-steps">
          {ios ? (
            <>
              <li>{t("Tap the Share button")} <svg viewBox="0 0 24 24" aria-hidden><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg> {t("at the bottom of Safari (or next to the address bar).")}</li>
              <li>{t("Scroll down and tap \"Add to Home Screen\", then \"Add\".")}</li>
            </>
          ) : (
            <>
              <li>{t("Open the browser menu")} <b aria-hidden>⋮</b> {t("at the top right.")}</li>
              <li>{t("Tap \"Add to Home screen\" or \"Install app\".")}</li>
            </>
          )}
        </ol>
      )}
    </section>
  );
}
