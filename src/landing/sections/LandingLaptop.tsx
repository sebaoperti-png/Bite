// MAIN COURSE · HOW IT WORKS — three steps read like a menu, then the real app as the demonstration: a laptop that opens as you scroll (Aceternity "macbook scroll" idea, built by hand) and shows the
// actual demo app, live, inside its screen. The app loads only when the section gets close, and becomes clickable
// once the lid is fully open. On phones it is a phone instead: it rises and straightens up as you scroll, with the
// app's phone layout inside, and it can be used once it stands upright.
import { useEffect, useRef, useState } from "react";
import { RevealWords, Arrowed } from "../../shared/Motion";
import { Course } from "../../shared/Restaurant";
import { t, getLang } from "../../shared/i18n";

const STEPS = [
  { title: "Browse tonight's menus", text: "See what neighbours are cooking near you — filter by cuisine, diet or allergens." },
  { title: "Book your seat or pick-up", text: "Reserve in seconds, chat with your host and pay securely in the app." },
  { title: "Sit down & enjoy", text: "Eat something made with care, meet the person who made it — then rate your meal." },
];

const APP_W = 1280;
const APP_H = 800;
const PHONE_W = 390;
const PHONE_H = 844;
const STATUS = 34; // px of status bar above the app inside the drawn phone

export function LandingLaptop() {
  const wrap = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [open, setOpen] = useState(0); // 0 closed … 1 open
  const [scale, setScale] = useState(0.6);
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const on = () => setPhone(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Load the app when the section is near; open the lid with the scroll
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLoad(true); io.disconnect(); } }, { rootMargin: "700px 0px" });
    io.observe(el);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // starts opening when the laptop's top enters the bottom of the screen, fully open at about a third from the top
        const p = (vh - r.top) / (vh * 0.75);
        setOpen(Math.max(0, Math.min(1, p)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Fit the 1280×800 app into whatever size the laptop screen has
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / (phone ? PHONE_W : APP_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone]);

  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lid = reduced ? 0 : (1 - open) * -86; // degrees: -86 lying almost flat, 0 upright
  const live = open > 0.97;

  return (
    <section className="lp-section" id="how">
      <div className="lp-head">
        <Course n={3} name={t("Main course")}>{t("how it works")}</Course>
        <h2 className="r-h-44"><RevealWords>{t("Three taps to a real meal")}</RevealWords></h2>
        <p>{t("No mock-ups: the demo below is the same app you can open on your phone. Browse tonight's tables, book a seat or start hosting.")}</p>
      </div>

      {/* the three steps as lines of a menu, read left to right; the real app below is the demonstration */}
      <ol className={`lp-steps ${open > 0.02 || reduced ? "in" : ""}`}>
        {STEPS.map((s, i) => (
          <li key={s.title} style={{ ["--i" as string]: i }}>
            <span className="lp-step-n">{["i", "ii", "iii"][i]}.</span>
            <b>{t(s.title)}</b>
            <em>{t(s.text)}</em>
          </li>
        ))}
      </ol>

      {phone ? (
        <div ref={wrap} className="lp-phone" style={{ ["--p" as string]: reduced ? 1 : open }}>
          <div className="lp-phone-body">
            <span className="lp-phone-island" aria-hidden />
            <div ref={screen} className={`lp-phone-screen ${live ? "live" : ""}`}>
              {/* a status bar, so the app starts below the camera island like on a real phone */}
              <span className="lp-status" aria-hidden><b>19:30</b><i /></span>
              {load && (
                <iframe title={t("The Bite demo app")} src={`bite.html?lang=${getLang()}`} loading="lazy" tabIndex={live ? 0 : -1}
                  style={{ width: PHONE_W, height: PHONE_H - Math.round(STATUS / scale), transform: `scale(${scale})`, top: STATUS }} />
              )}
            </div>
          </div>
          <span className="lp-phone-shadow" aria-hidden />
        </div>
      ) : (
      <div ref={wrap} className="lp-laptop" style={{ ["--lid" as string]: `${lid}deg` }}>
        <div className="lp-lid">
          <div className="lp-bezel">
            <span className="lp-cam" aria-hidden />
            <div ref={screen} className={`lp-screen ${live ? "live" : ""}`}>
              {load && (
                <iframe
                  title={t("The Bite demo app")}
                  src={`bite.html?lang=${getLang()}`}
                  loading="lazy"
                  tabIndex={live ? 0 : -1}
                  style={{ width: APP_W, height: APP_H, transform: `scale(${scale})` }}
                />
              )}
              <span className="lp-glare" aria-hidden style={{ opacity: 0.5 - open * 0.35 }} />
            </div>
          </div>
        </div>
        <div className="lp-base"><span className="lp-notch" /></div>
      </div>
      )}

      <p className="lp-foot">
        <a className="lm" href="bite.html"><Arrowed text={t("Open it full screen →")} /></a>
      </p>
    </section>
  );
}
