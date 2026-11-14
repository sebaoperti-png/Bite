// Live mode with no meals at all: instead of an empty menu, a table set for four that nobody has sat at yet,
// on a menu card, with the two useful things to do: be told when the first table opens near you ("Notify me",
// the landing's Save me a seat form in a sheet) or open it yourself ("Host the first table").
import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, ChefHat } from "lucide-react";
import { t } from "../../shared/i18n";
import { SeatForm } from "../../shared/SeatForm";
import { Sheet } from "./Sheet";
import "../styles/notables.css";

export function NoTables({ onHost, compact = false }: { onHost?: () => void; compact?: boolean }) {
  const [notify, setNotify] = useState(false);
  return (
    <section className={`nt ${compact ? "nt-compact" : ""}`} aria-labelledby="nt-title">
      <span className="nt-eyebrow">{t("Tonight's tables")}</span>
      <EmptyTable />
      <h2 id="nt-title" className="nt-title">{t("No tables near you, yet.")}</h2>
      <p className="nt-sub">{t("Bite has just opened its kitchen. We'll tell you when a neighbour sets the first table near you, or you set it yourself.")}</p>
      <div className="nt-actions">
        <button type="button" className="nt-btn nt-notify" onClick={() => setNotify(true)}><Bell size={16} strokeWidth={2.4} />{t("Notify me")}</button>
        {onHost
          ? <button type="button" className="nt-btn nt-host" onClick={onHost}><ChefHat size={16} strokeWidth={2.4} />{t("Host the first table")}</button>
          : <a className="nt-btn nt-host" href="bite.html?host"><ChefHat size={16} strokeWidth={2.4} />{t("Host the first table")}</a>}
      </div>

      {/* the card sits inside the scrolling page, so the sheet goes to a full-screen layer of its own */}
      {createPortal(<div className="nt-layer" style={{ pointerEvents: notify ? "auto" : "none" }}>
      <Sheet open={notify} onClose={() => setNotify(false)} mobileMaxHeight="92%">
        <div className="nt-sheet">
          <div className="rs-head"><span>{t("Reservation")}</span><span className="rs-no">{t("first table")}</span></div>
          <SeatForm
            source="app-no-tables"
            title="We'll save you a seat."
            intro="Leave your email and we'll write as soon as a neighbour opens a table near you. No spam, just the first invitation."
            cityHint="e.g. Aalen"
            links={false}
          />
        </div>
      </Sheet>
      </div>, document.body)}
    </section>
  );
}

/** a round table from above: four place settings with empty plates, four chairs pulled out, a candle in the middle */
function EmptyTable() {
  const seats = [0, 1, 2, 3].map((i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2 + Math.PI / 4;
    return { a, deg: (a * 180) / Math.PI + 90 };
  });
  return (
    <svg className="nt-table" viewBox="0 0 220 220" aria-hidden>
      {seats.map(({ a, deg }, i) => (
        <rect key={`c${i}`} className="nt-chair" x={110 + Math.cos(a) * 96 - 20} y={110 + Math.sin(a) * 96 - 14} width="40" height="28" rx="10" transform={`rotate(${deg} ${110 + Math.cos(a) * 96} ${110 + Math.sin(a) * 96})`} style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
      <circle cx="110" cy="114" r="74" className="nt-shadow" />
      <circle cx="110" cy="110" r="74" className="nt-cloth" />
      <circle cx="110" cy="110" r="66" className="nt-cloth-edge" />
      {seats.map(({ a, deg }, i) => {
        const x = 110 + Math.cos(a) * 44, y = 110 + Math.sin(a) * 44;
        return (
          <g key={`p${i}`} transform={`rotate(${deg} ${x} ${y})`}>
            <circle cx={x} cy={y} r="15" className="nt-plate" />
            <circle cx={x} cy={y} r="10" className="nt-rim" />
            <path d={`M${x - 21} ${y - 9}v18M${x + 21} ${y - 9}v18`} className="nt-cutlery" />
          </g>
        );
      })}
      <circle cx="110" cy="110" r="9" className="nt-candle" />
      <path d="M110 96c-4 5-4 9 0 11c4-2 4-6 0-11z" className="nt-flame" />
    </svg>
  );
}
