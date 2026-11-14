import { ArrowRight } from "lucide-react";
import { t } from "../../shared/i18n";
import "../styles/about.css";

/**
 * "Wanna know more? Have a look!": a small menu card that links the app to the website (bitetable.de),
 * where the whole story is told course by course. Opens the landing page in the same window
 * (`target="_top"` so it also works when the app runs inside the landing's laptop preview);
 * `?from=app` skips the landing's logo intro for people who already know Bite.
 */
const SITE = "./?from=app";

const COURSES = [
  { n: "3", label: "How a shared table works", hash: "#how" },
  { n: "5", label: "Hosting and fair prices", hash: "#cooks" },
  { n: "6", label: "House rules: how we keep you safe", hash: "#safety" },
];

export function AboutBiteCard({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`ab-card ${compact ? "ab-compact" : ""}`} aria-labelledby="ab-title">
      <div className="ab-inner">
        <div className="ab-text">
          <p className="ab-kicker">{t("The full menu")}</p>
          <h2 id="ab-title" className="ab-title">{t("Wanna know more?")}</h2>
          <p className="ab-sub">{t("The story behind Bite, told course by course on our website.")}</p>
          <a className="ab-cta" href={SITE} target="_top">
            {t("Have a look")} <ArrowRight size={15} strokeWidth={2.6} />
          </a>
        </div>
        <nav className="ab-courses" aria-label={t("On the website")}>
          {COURSES.map((c) => (
            <a key={c.hash} className="ab-line" href={SITE + c.hash} target="_top">
              <span className="ab-line-label">{t(c.label)}</span>
              <i className="ab-dots" aria-hidden />
              <span className="ab-no">{t("No. {n}", { n: c.n })}</span>
            </a>
          ))}
          <p className="ab-site">bitetable.de</p>
        </nav>
      </div>
    </section>
  );
}
