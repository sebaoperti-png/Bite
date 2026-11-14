// The table waiting for you, seen from above at night: candlelight, three neighbours' places already set and one
// empty chair whose place card shows the name you are typing. Used beside (desktop) or above (phone) the
// reservation book on the log-in / sign-up screen.
import { t } from "../../shared/i18n";

export function AuthScene({ name, mode }: { name: string; mode: "signup" | "login" | "plain" }) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const card = first ? (first.length > 11 ? `${first.slice(0, 10)}…` : first) : mode === "login" ? t("Reserved") : t("Your seat");
  // the places around the table: three set, the fourth (bottom) is yours
  const places = [
    { a: -90, who: "A" }, { a: 0, who: "M" }, { a: 180, who: "L" },
  ];
  return (
    <svg className="au-table" viewBox="0 0 400 400" role="img" aria-label={t("A table for neighbours, with a free seat for you")}>
      <defs>
        <radialGradient id="au-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity=".55" />
          <stop offset=".45" stopColor="#f2a65a" stopOpacity=".18" />
          <stop offset="1" stopColor="#f2a65a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="au-cloth" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#efe2cc" />
        </radialGradient>
        <pattern id="au-weave" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 3.5h7M3.5 0v7" stroke="rgba(107,33,217,0.05)" strokeWidth="1" /></pattern>
      </defs>
      {/* chairs */}
      {[...places.map((p) => p.a), 90].map((a) => {
        const r = (a * Math.PI) / 180;
        const x = 200 + Math.cos(r) * 162, y = 200 + Math.sin(r) * 162;
        const mine = a === 90;
        return <rect key={a} className={mine ? "au-chair mine" : "au-chair"} x={x - 34} y={y - 22} width="68" height="44" rx="16" transform={`rotate(${a + 90} ${x} ${y})`} />;
      })}
      {/* the table */}
      <circle cx="200" cy="208" r="132" fill="rgba(0,0,0,0.35)" />
      <circle cx="200" cy="200" r="132" fill="url(#au-cloth)" />
      <circle cx="200" cy="200" r="132" fill="url(#au-weave)" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="1.5" strokeDasharray="2 6" />
      {/* the neighbours' places: plate, glass, a little food */}
      {places.map((p) => {
        const r = (p.a * Math.PI) / 180;
        const x = 200 + Math.cos(r) * 84, y = 200 + Math.sin(r) * 84;
        const gx = 200 + Math.cos(r - 0.55) * 98, gy = 200 + Math.sin(r - 0.55) * 98;
        return (
          <g key={p.a}>
            <circle cx={x} cy={y} r="26" fill="#fff" stroke="rgba(46,16,96,0.1)" strokeWidth="1.5" />
            <circle cx={x} cy={y} r="17" fill="none" stroke="rgba(107,33,217,0.12)" strokeWidth="2" />
            <circle cx={x - 5} cy={y - 3} r="6" fill="#e9a23b" opacity=".85" />
            <circle cx={x + 6} cy={y + 4} r="4.5" fill="#6aa84f" opacity=".8" />
            <circle cx={gx} cy={gy} r="8" fill="rgba(214,200,245,0.7)" stroke="rgba(107,33,217,0.25)" strokeWidth="1.2" />
          </g>
        );
      })}
      {/* your place: an empty plate, cutlery, and the place card with your name */}
      <g className="au-mine">
        <circle cx="200" cy="284" r="27" fill="#fff" stroke="#b87fff" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M160 268v32M156 268v9a4 4 0 0 0 8 0v-9" fill="none" stroke="#8f84a8" strokeWidth="3" strokeLinecap="round" />
        <path d="M240 268c-5 0-7 10-7 17h7v15" fill="none" stroke="#8f84a8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <g className="au-card">
          <path d="M150 322h100l4 26H146z" fill="#fffdf7" stroke="rgba(107,33,217,0.3)" strokeWidth="1.2" />
          <text x="200" y="341" textAnchor="middle" fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="17" fill="#3b1a78">{card}</text>
        </g>
      </g>
      {/* the candle and its light */}
      <circle className="au-glow" cx="200" cy="196" r="120" fill="url(#au-glow)" />
      <circle cx="200" cy="200" r="11" fill="#f4ecdc" stroke="rgba(46,16,96,0.15)" />
      <circle cx="200" cy="200" r="5" fill="#fff6d6" />
      <path className="au-flame" d="M200 184c4 5 5 9 0 14-5-5-4-9 0-14z" fill="#ffb347" />
    </svg>
  );
}
