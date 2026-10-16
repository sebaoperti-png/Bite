// BECOME A HOST (converted from the original design; edit freely)
import { useEffect, useRef, useState } from "react";
import { t } from "../../shared/i18n";

export function LandingBecomeAHost() {
  return (
    <>
      <section className="r-pad-96 dk-into-dark" id="become-host" style={{ padding: "380px 24px 110px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: "28px", color: "#b87fff" }}>{t("share your table")}</span>
            {" "}
            <h2 className="r-h-46" style={{ fontSize: "76px", fontWeight: "900", letterSpacing: "-0.035em", margin: "10px 0 0", color: "#fff", lineHeight: "1.02" }}>{t("Cook for more,")}<br />
              <span style={{ color: "#b87fff" }}>{t("spend less.")}</span>
            </h2>
            {" "}
            <p style={{ fontSize: "21px", color: "#c4b4e2", maxWidth: "760px", margin: "24px auto 0", lineHeight: "1.55" }}>{t("Cooking for six costs barely more than cooking for two. Open your table in four steps — your guests chip in for the groceries.")}</p>
          </div>
          {" "}
          {/* host steps: each one lights up in turn */}
          <HostSteps />
          {" "}
          <div style={{ textAlign: "center" }}>
            <a href="bite.html?host" style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "#fff", color: "#160a2e", padding: "20px 38px", borderRadius: "16px", fontWeight: "800", fontSize: "18px" }}>{t("Start hosting →")}</a>
            {" "}

          </div>
        </div>
      </section>
    </>
  );
}

const STEPS = [
  { title: "Get verified", text: "A quick ID check, a short video call and a sample meal — so guests know who's cooking." },
  { title: "List your meal", text: "Add your menu, date and seats in 2 minutes. Our assistant can write the description for you." },
  { title: "Welcome guests", text: "Chat with guests before the day and confirm who joins — it's always your table, your rules." },
  { title: "Split the bill", text: "Scan your receipt and everyone pays an equal share in the app. No cash, no awkward maths." },
];
const STEP_MS = 2200;

function HostSteps() {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { setVisible(e.isIntersecting); if (e.isIntersecting) setActive(0); }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || hover || reduceMotion) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, visible, hover, reduceMotion]);

  return (
    <div ref={ref} className="hs-row" onMouseLeave={() => setHover(false)}>
      <div className="hs-line" aria-hidden><span style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }} /></div>
      {STEPS.map((s, i) => (
        <div
          key={s.title}
          className={`hs-step ${i === active ? "on" : ""} ${i < active ? "done" : ""}`}
          onMouseEnter={() => { setHover(true); setActive(i); }}
        >
          <div className="hs-num">{i + 1}</div>
          <div className="hs-title">{t(s.title)}</div>
          <div className="hs-text">{t(s.text)}</div>
        </div>
      ))}
    </div>
  );
}
