// ABOUT US: the three founders as place cards around one round table, seen from above. Each card carries a name,
// a role and one line (shown once all three have one). Photos replace the initials as soon as they are in public/landing/team/ (FOUNDERS[].photo).
import { asset } from "../asset";
import { t } from "../../shared/i18n";

interface Founder { name: string; role: string; line: string; photo?: string }

// Fill in roles, lines and photos when the founders send them (photo: "landing/team/<name>.jpg", square, about 400 px).
const FOUNDERS: Founder[] = [
  { name: "Sebastiano", role: "Co-founder", line: "Italian in Germany. Builds the product and believes every city's best meals are cooked in its homes." },
  { name: "Axelle", role: "Co-founder", line: "" },
  { name: "Chadha", role: "Co-founder", line: "" },
];

function Seat({ f, i, lines }: { f: Founder; i: number; lines: boolean }) {
  return (
    <li className={`ab3-seat ab3-s${i}`}>
      <span className="ab3-plate" aria-hidden>
        {f.photo ? <img src={asset(f.photo)} alt="" /> : <i>{f.name.charAt(0)}</i>}
      </span>
      <span className="ab3-card">
        <b>{f.name}</b>
        <em>{t(f.role)}</em>
        {lines && <span>{t(f.line)}</span>}
      </span>
    </li>
  );
}

export function LandingAbout() {
  return (
    <section id="about" className="ab3">
      <div className="ab3-inner">
        <div className="ab3-copy">
          <p className="ab3-kicker">{t("About us")}</p>
          <h2 className="r-h-46">{t("Three of us, one table.")}</h2>
          <p>{t("Bite is made by three founders who share one belief: the best meals are cooked at home and eaten together. We want everyone to have a table like that, shared with neighbours and paid for fairly.")}</p>
          <p>{t("We are early and building in the open. If you have an idea, a worry or a recipe, write to us.")}</p>
          <a className="lm ab3-mail" href="mailto:hello@bitetable.de"><span className="lm-text">hello@bitetable.de</span></a>
        </div>
        <div className="ab3-table-wrap">
          <svg className="ab3-table" viewBox="0 0 300 300" aria-hidden>
            <circle cx="150" cy="150" r="118" className="ab3-cloth" />
            <circle cx="150" cy="150" r="118" className="ab3-cloth-edge" />
            <circle cx="150" cy="160" r="30" className="ab3-bowl" />
            <circle cx="150" cy="160" r="19" className="ab3-bowl-in" />
            <circle cx="143" cy="156" r="4" className="ab3-food" /><circle cx="156" cy="163" r="3.5" className="ab3-food b" /><circle cx="152" cy="153" r="2.6" className="ab3-food c" />
            <path d="M140 118c-3-5 3-7 0-12M150 116c-3-5 3-7 0-12M160 118c-3-5 3-7 0-12" className="ab3-steam" />
          </svg>
          <ol className="ab3-seats">
            {FOUNDERS.map((f, i) => <Seat key={f.name} f={f} i={i} lines={FOUNDERS.every((x) => x.line)} />)}
          </ol>
        </div>
      </div>
    </section>
  );
}
