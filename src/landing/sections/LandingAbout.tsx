// ABOUT US: the three founders as three snapshots taped to the page (like the ones in "Pull up a chair"). Each card carries a name,
// a role and one line (shown once all three have one). Photos replace the initials as soon as they are in public/landing/team/ (FOUNDERS[].photo).
import { asset } from "../asset";
import { t } from "../../shared/i18n";

interface Founder { name: string; role: string; line: string; photo?: string }

// Fill in roles, lines and photos when the founders send them (photo: "landing/team/<name>.jpg", square, about 400 px).
const FOUNDERS: Founder[] = [
  { name: "Sebastiano", role: "Co-founder", line: "Italian in Germany. Builds the product and believes every city's best meals are cooked in its homes.", photo: "landing/team/sebastiano.jpg" },
  { name: "Axelle", role: "Co-founder", line: "", photo: "landing/team/axelle.jpg" },
  { name: "Chadha", role: "Co-founder", line: "" },
];

const TONES = ["#efe6ff", "#ffe9dc", "#e3f4ea"];

function Polaroid({ f, i, lines }: { f: Founder; i: number; lines: boolean }) {
  return (
    <li className={`ab3-pol ab3-p${i}`}>
      <span className="ab3-photo" style={{ background: TONES[i % TONES.length] }}>
        {f.photo ? <img src={asset(f.photo)} alt={f.name} loading="lazy" /> : <i aria-hidden>{f.name.charAt(0)}</i>}
      </span>
      <b>{f.name}</b>
      <em>{t(f.role)}</em>
      {lines && <span>{t(f.line)}</span>}
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
        <ol className="ab3-pols">
          {FOUNDERS.map((f, i) => <Polaroid key={f.name} f={f} i={i} lines={FOUNDERS.every((x) => x.line)} />)}
        </ol>
      </div>
    </section>
  );
}
