// CHEF'S TABLE · FOR COOKS — opens with the kitchen animation and the pitch, then the sous-chef to try right here. The visitor picks what they're cooking and how many
// guests come; the sous-chef then does its three jobs in front of them, with the same logic the app uses:
// writes the description (descriptionWriter), reads the grocery receipt, and sets the fair price per plate
// (costing: equal share of the real cost, capped). Kitchen paper throughout: order pad, receipt, menu card.
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { Course } from "../../shared/Restaurant";
import { RevealWords, StreamText } from "../../shared/Motion";
import { writeDescription } from "../../app/descriptionWriter";
import { fairShare, priceCap } from "../../app/costing";
import { asset } from "../asset";
import { CookingScene } from "./CookingScene";
import { t, getLang } from "../../shared/i18n";

// Demo dishes with a typical German supermarket basket (cost per person)
const DISHES: { name: string; cuisine: string; img: string; items: [string, number][] }[] = [
  { name: "Tagliatelle al Ragù", cuisine: "Italian", img: "app/img/1551183053-800x533.jpg",
    items: [["Fresh eggs", 0.45], ["Flour 00", 0.25], ["Minced beef", 1.6], ["Tomatoes & passata", 0.55], ["Carrot, celery, onion", 0.3], ["Parmesan", 0.7]] },
  { name: "Shoyu Ramen", cuisine: "Japanese", img: "app/img/1569718212165-800x533.jpg",
    items: [["Pork belly", 1.9], ["Ramen noodles", 0.6], ["Eggs", 0.3], ["Soy sauce & miso", 0.5], ["Spring onion & nori", 0.4]] },
  { name: "Thai Green Curry", cuisine: "Thai", img: "app/img/1554054204-800x533.jpg",
    items: [["Chicken thighs", 1.7], ["Jasmine rice", 0.35], ["Coconut milk", 0.45], ["Green curry paste", 0.3], ["Thai basil & lime", 0.35]] },
  { name: "Raspberry Cream Cake", cuisine: "", img: "app/img/1565958011703-800x533.jpg",
    items: [["Raspberries", 0.9], ["Cream", 0.45], ["Butter", 0.35], ["Flour & sugar", 0.2], ["Eggs", 0.25]] },
];

const JOBS = [
  { k: "Writes your description", v: "from the dish, the cuisine and your style", orb: "weaving" },
  { k: "Reads your receipt", v: "and turns the grocery total into a fair share", orb: "searching" },
  { k: "Keeps the price honest", v: "never more than the real cost per plate", orb: "solving" },
] as const;

// Drawn tools for the three stations: notepad & pen, the receipt, the price stamp
const STATION = [
  <><rect x="9" y="7" width="18" height="26" rx="2" /><path d="M13 14h10M13 19h10M13 24h6" /><path d="M29 30l5-14 2.5 1-5 14-3 2z" /></>,
  <><path d="M11 5h18v28l-3-2-3 2-3-2-3 2-3-2-3 2z" /><path d="M15 12h10M15 17h8M15 23h10" /></>,
  <><path d="M16 6h8v8l4 5H12l4-5z" /><rect x="9" y="19" width="22" height="6" rx="2" /><path d="M9 31h22" strokeDasharray="2 3" /></>,
];

export function LandingSousChef() {
  const [dish, setDish] = useState(0);
  const [guests, setGuests] = useState(5);
  const [phase, setPhase] = useState(0); // 0 waiting · 1 writing · 2 reading the receipt · 3 pricing · 4 done
  const [runId, setRunId] = useState(0);
  const started = useRef(false);
  const stage = useRef<HTMLDivElement>(null);
  const de = getLang() === "de";
  const money = (n: number, cents = true) => {
    const v = cents ? n.toFixed(2) : String(n);
    return de ? `${v.replace(".", ",")} €` : `€${v}`;
  };

  const d = DISHES[dish];
  const people = guests + 1;
  const lines = d.items.map(([label, per]) => ({ label, amount: Math.round(per * people * 100) / 100 }));
  const total = Math.round(lines.reduce((n, l) => n + l.amount, 0) * 100) / 100;
  const share = fairShare(total, people);
  const cap = priceCap(total, people, "receipt");
  const description = writeDescription({ mealName: t(d.name), eventTitle: "", cuisine: d.cuisine, serviceType: "eat-together", firstName: "Sebastiano" }, "cosy");

  // The sous-chef's run: write → read → price
  useEffect(() => {
    if (!runId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setPhase(4); return; }
    setPhase(1);
    const ids = [window.setTimeout(() => setPhase(2), 1900), window.setTimeout(() => setPhase(3), 3700), window.setTimeout(() => setPhase(4), 4600)];
    return () => ids.forEach(window.clearTimeout);
  }, [runId]);

  // First run when the section comes into view; afterwards every change of order runs it again
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started.current) { started.current = true; setRunId((r) => r + 1); io.disconnect(); } }, { rootMargin: "0px 0px -40% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const order = (fn: () => void) => { fn(); started.current = true; setRunId((r) => r + 1); };

  const jobState = (i: number) => (phase === 4 || phase > i + 1 ? "done" : phase === i + 1 ? "now" : "");

  return (
    <>
    <section className="sc-sous" id="cooks">
      {/* chapter opening: the kitchen animation (shop → cook → share → split) beside the pitch to cooks */}
      <div className="sx-intro">
        <CookingScene />
        <div className="sc-sous-head">
          <Course n={5} name={t("Chef's table")}>{t("for cooks")}</Course>
          <h2 className="r-h-44"><RevealWords>{t("You cook. The sous-chef does the paperwork.")}</RevealWords></h2>
          <p>{t("Already cooking every night? Cook a little extra and open your table. Guests chip in for the ingredients, so a proper home-cooked dinner costs everyone less — you included.")}</p>
        </div>
      </div>
    </section>

    {/* the sous-chef to try: its own section, so it starts only once the visitor has scrolled to it */}
    <section className="sc-sous sx-try-section" id="sous-chef">
      <div ref={stage} className="sx-try-head">
        <span className="sx-try-eyebrow">{t("your AI kitchen assistant")}</span>
        <h3>{t("Try the sous-chef")}</h3>
        <p className="sx-try">{t("Try it: pick a dish and watch the sous-chef write the listing, read the receipt and set a fair price.")}</p>
      </div>

      {/* the sous-chef's three stations on a kitchen counter; its hat slides to the one it is working at */}
      <div className="sx-counter" style={{ ["--at" as string]: Math.min(2, Math.max(0, phase - 1)) }}>
        <span className="sx-board" aria-hidden />
        <span className={`sx-hat ${phase >= 1 && phase < 4 ? "busy" : ""} ${phase === 4 ? "done" : ""}`} aria-hidden>
          <svg viewBox="0 0 48 44"><path d="M12 28c-7 0-9-10-2-12 0-8 11-10 15-4 4-6 15-4 15 4 7 2 5 12-2 12v8H12z" /><path d="M12 31h26" /></svg>
          <i /><i /><i />
        </span>
        <ol className="sx-jobs">
          {JOBS.map((j, i) => (
            <li key={j.k} className={`sx-job ${jobState(i)}`}>
              <span className="sx-station" aria-hidden>
                <svg viewBox="0 0 40 40">{STATION[i]}</svg>
                {jobState(i) === "now" && <span className="sx-orb"><ThinkingOrb state={j.orb} size={20} theme="light" /></span>}
                <svg className="sx-tick" viewBox="0 0 28 24"><path d="M3 13c3 2 5 5 7 8 4-8 9-14 16-19" pathLength={1} /></svg>
              </span>
              <b>{t(j.k)}</b>
              <em>{t(j.v)}</em>
            </li>
          ))}
        </ol>
      </div>

      <div className="sx-stage">
        {/* 1 · the host's order: what and for how many */}
        <div className="sx-pad">
          <div className="sx-pad-head"><span>{t("Your order")}</span><b>{t("What are you cooking?")}</b></div>
          <div className="sx-dishes" role="radiogroup" aria-label={t("What are you cooking?")}>
            {DISHES.map((x, i) => (
              <button key={x.name} type="button" role="radio" aria-checked={dish === i} className={dish === i ? "on" : ""} onClick={() => order(() => setDish(i))}>
                <img src={asset(x.img)} alt="" loading="lazy" />
                <span>{t(x.name)}</span>
              </button>
            ))}
          </div>
          <div className="sx-guests">
            <span>{t("Guests")}</span>
            <div className="sx-step">
              <button type="button" aria-label={t("Fewer guests")} disabled={guests <= 2} onClick={() => order(() => setGuests((g) => g - 1))}>−</button>
              <b>{guests}</b>
              <button type="button" aria-label={t("More guests")} disabled={guests >= 10} onClick={() => order(() => setGuests((g) => g + 1))}>+</button>
            </div>
            <em>{t("+ you = {n} plates", { n: people })}</em>
          </div>

          {/* 2 · the grocery receipt the sous-chef reads */}
          <div className={`sx-receipt ${phase >= 2 ? "read" : ""} ${phase === 2 ? "scanning" : ""}`} key={`r${runId}`}>
            <div className="sx-r-head">{t("Supermarket receipt")}</div>
            {lines.map((l, i) => (
              <div key={l.label} className="sx-r-row" style={{ ["--i" as string]: i }}><span>{t(l.label)}</span><i /><b>{money(l.amount)}</b></div>
            ))}
            <div className="sx-r-row sx-r-total"><span>{t("Total")}</span><i /><b>{money(total)}</b></div>
            <span className="sx-scan" aria-hidden />
          </div>
        </div>

        {/* 3 · the listing the sous-chef writes, on a menu card */}
        <div className="sx-card">
          <div className="sx-photo"><img key={d.img} src={asset(d.img)} alt="" /></div>
          <div className="sx-card-body">
            <div className="sx-card-top"><span>{t("Eat together")}</span><i aria-hidden /><span>{t("Draft")}</span></div>
            <h3>{t(d.name)}</h3>
            <p className="sx-desc" aria-live="polite">
              {phase >= 1 ? <StreamText key={`d${runId}`} text={description} play={phase === 1} speed={38} /> : <span className="sx-wait">{t("The sous-chef is reading your order…")}</span>}
            </p>
            <div className={`sx-math ${phase >= 3 ? "on" : ""}`}>
              <span>{money(total)} {t("groceries")} ÷ {people} {t("plates")}</span>
              <b className="sx-price">{money(share, false)} <small>{t("per plate")}</small></b>
              <em>{t("Capped at {cap} — never more than the real cost", { cap: money(cap, false) })}</em>
            </div>
            <a className={`sx-publish ${phase === 4 ? "on" : ""}`} href="bite.html?host">{t("Publish it in the app →")}</a>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
