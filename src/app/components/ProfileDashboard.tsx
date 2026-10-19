// The profile page, set like a restaurant table: a "Reserved for" place card with a trust sticker, the next
// meal as a reservation ticket, the Bite Passport (cuisine stamps), badges, "Your tab so far" as a receipt
// and the account options as a short menu. Demo numbers start from a believable history and grow with
// what the user does in the demo (booking a meal, publishing one, guests joining).
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pencil, Share2, ChefHat, ArrowRight, ChevronRight, Lock, Utensils, Star, Leaf, Globe2, Check, Camera } from "lucide-react";
import { dayLabel, euro, type Meal } from "../data";
import { useStore } from "../store";
import { useIsDesktop } from "../useIsDesktop";
import { localPlace } from "../location";
import { usePhotoPicker } from "./Avatar";
import { t, tMaybe, dateLabel, dec, getLang } from "../../shared/i18n";

export interface ProfileRow { Icon: React.ElementType; label: string; sub: string; onClick: () => void }

// Cuisines in the passport (tags used by the demo meals) with a stamp colour and emoji each
const STAMPS = [
  { c: "Italian", e: "IT", col: "#e0457b" }, { c: "Thai", e: "TH", col: "#0a9c62" }, { c: "Indian", e: "IN", col: "#e07b1a" },
  { c: "Japanese", e: "JP", col: "#d6336c" }, { c: "Korean", e: "KR", col: "#6b21d9" }, { c: "Moroccan", e: "MA", col: "#b5531d" },
  { c: "Lebanese", e: "LB", col: "#2f8f5b" }, { c: "Spanish", e: "ES", col: "#c2410c" }, { c: "Chinese", e: "CN", col: "#c81e1e" },
  { c: "Turkish", e: "TR", col: "#1d6fb5" }, { c: "French", e: "FR", col: "#3b5bdb" }, { c: "Mexican", e: "MX", col: "#a16207" },
];
// What the founder's demo account has already tried before the demo starts
const TRIED_BEFORE = ["Italian", "Thai", "Indian", "Japanese", "Lebanese"];
const GLOBETROTTER = 8;

/** Counts up to a number when it first appears */
function useCountUp(target: number, ms = 1300) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(a + (target - a) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/** One line of the "tab" receipt: label, dotted leader, a number that counts up */
function TabLine({ value, decimals = 0, prefix = "", suffix = "", label, sub, i }: { value: number; decimals?: number; prefix?: string; suffix?: string; label: string; sub: string; i: number }) {
  const v = useCountUp(value);
  return (
    <div className="pd-tab-line" style={{ ["--i" as string]: i }}>
      <span><b>{label}</b><em>{sub}</em></span>
      <i />
      <strong>{prefix}{decimals ? dec(v, decimals) : Math.round(v).toLocaleString(getLang() === "de" ? "de-DE" : "en-GB")}{suffix}</strong>
    </div>
  );
}

const TONES: Record<string, [string, string, string]> = {
  gold: ["#fff4c9", "#f2b43a", "#b97a10"], rose: ["#ffe1ec", "#f06d9b", "#b8306a"], mint: ["#dbfbe9", "#34c785", "#0f7a4f"],
  violet: ["#efe2ff", "#a46bff", "#5b1cc4"], sky: ["#dcefff", "#4aa3f0", "#1c5fa8"],
};

/** A medal drawn in SVG: ribbons, a metal disc with a rim, the icon embossed, and a light sweep. Grey and locked until earned. */
function Medal({ Icon, tone, on, delay }: { Icon: React.ElementType; tone: string; on: boolean; delay: number }) {
  const [hi, mid, lo] = on ? TONES[tone] : ["#f1eef6", "#d6d0e2", "#a99fbd"];
  const id = `md-${tone}-${on ? 1 : 0}`;
  return (
    <motion.span className={`pd-medal ${on ? "on" : ""}`} initial={on ? { scale: 0.3, rotate: -25 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ delay, type: "spring", stiffness: 260, damping: 13 }}>
      <svg viewBox="0 0 64 76" width="58" height="69" aria-hidden>
        <defs>
          <linearGradient id={`${id}-m`} x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stopColor={hi} /><stop offset="0.5" stopColor={mid} /><stop offset="1" stopColor={lo} /></linearGradient>
          <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={on ? "#6b21d9" : "#cfc7de"} /><stop offset="1" stopColor={on ? "#ff3d7f" : "#e3dded"} /></linearGradient>
          <clipPath id={`${id}-c`}><circle cx="32" cy="30" r="24" /></clipPath>
        </defs>
        <path d="M20 46l-6 26 9-5 6 7 5-26z" fill={`url(#${id}-r)`} opacity={on ? 1 : 0.7} />
        <path d="M44 46l6 26-9-5-6 7-5-26z" fill={`url(#${id}-r)`} opacity={on ? 0.85 : 0.6} />
        <circle cx="32" cy="30" r="26" fill={lo} />
        <circle cx="32" cy="30" r="24" fill={`url(#${id}-m)`} />
        <circle cx="32" cy="30" r="18.5" fill="none" stroke={hi} strokeOpacity="0.8" strokeWidth="1.5" strokeDasharray="2 2.6" />
        {on && <g clipPath={`url(#${id}-c)`}><rect className="pd-medal-shine" x="-30" y="0" width="16" height="64" fill="#fff" opacity="0.55" transform="rotate(25 32 30)" /></g>}
      </svg>
      <span className="pd-medal-icon" style={{ color: on ? lo : "#a99fbd" }}>{on ? <Icon size={20} strokeWidth={2.4} /> : <Lock size={17} strokeWidth={2.4} />}</span>
    </motion.span>
  );
}

/** The trust sticker, like the certificate stuck on a restaurant window: ticks light up to the score
    while "verified neighbour" turns around the edge */
function TrustSticker({ score }: { score: number }) {
  const ticks = 48;
  const [lit, setLit] = useState(0);
  const target = Math.round((score / 100) * ticks);
  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => { i += 1; setLit(i); if (i >= target) window.clearInterval(id); }, 28);
    return () => window.clearInterval(id);
  }, [target]);
  const shown = target ? Math.round((lit / target) * score) : score;
  const ringText = `${t("BITE")} · ${t("VERIFIED NEIGHBOUR")} · ${t("BITE")} · ${t("VERIFIED NEIGHBOUR")} · `;
  return (
    <div className="pd-sticker">
      <div className="pd-seal">
        <svg viewBox="0 0 160 160" aria-hidden>
          <defs>
            <path id="pd-seal-text" d="M80 80 m-66 0 a66 66 0 1 1 132 0 a66 66 0 1 1 -132 0" />
            <radialGradient id="pd-seal-core" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#3b1a78" /><stop offset="1" stopColor="#160a2e" /></radialGradient>
          </defs>
          <circle cx="80" cy="80" r="78" fill="#160a2e" />
          <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(227,199,122,0.45)" strokeWidth="1" strokeDasharray="2 3" />
          <g className="pd-seal-spin">
            <text fontSize="9" fontWeight="800" fill="#e3c77a"><textPath href="#pd-seal-text" textLength="408" lengthAdjust="spacing">{ringText}</textPath></text>
          </g>
          {Array.from({ length: ticks }, (_, i) => {
            const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
            const on = i < lit;
            return <line key={i} x1={80 + Math.cos(a) * 46} y1={80 + Math.sin(a) * 46} x2={80 + Math.cos(a) * 54} y2={80 + Math.sin(a) * 54}
              stroke={on ? `hsl(${272 - (i / ticks) * 30}, 90%, ${68 + (i / ticks) * 8}%)` : "rgba(255,255,255,0.12)"} strokeWidth="3" strokeLinecap="round" />;
          })}
          <circle cx="80" cy="80" r="40" fill="url(#pd-seal-core)" />
        </svg>
        <div className="pd-seal-num"><b>{Math.min(score, shown)}<small>%</small></b><span>{t("Trust score")}</span></div>
      </div>
      <ul className="pd-sticker-checks">
        {[t("ID verified"), t("Email & phone"), t("{n}★ from 38 reviews", { n: dec(4.9) })].map((label, i) => (
          <motion.li key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.2 }}>
            <Check size={11} strokeWidth={3.5} /> {label}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** On the plate, a disc that turns like a plate being spun: your photo on one side, your initial on the other
    (no photo yet: the other side invites you to add one). Click it, or the camera, to choose a photo. */
function PlateAvatar({ letter, photo, onPick }: { letter: string; photo?: string; onPick: () => void }) {
  return (
    <div className="pd-plate">
      <svg viewBox="0 0 200 140" aria-hidden>
        <path className="pd-fork" d="M22 26v30M15 26v16a7 7 0 0 0 14 0V26M22 56v60" />
        <path className="pd-knife" d="M178 26c-8 0-11 20-11 34h11v56" />
        <circle cx="100" cy="70" r="62" fill="#fff" />
        <circle cx="100" cy="70" r="62" fill="none" stroke="rgba(107,33,217,0.14)" strokeWidth="2" />
        <circle cx="100" cy="70" r="46" fill="none" stroke="rgba(107,33,217,0.1)" strokeWidth="2" />
      </svg>
      <button type="button" className={`pd-disc ${photo ? "has-photo" : ""}`} onClick={onPick} aria-label={photo ? t("Change profile photo") : t("Add a profile photo")}>
        {/* key: a new photo restarts the spin, so it lands on the photo side first */}
        <span className="pd-disc-inner" key={photo ? photo.length : 0}>
          <span className="pd-face front">{photo ? <img src={photo} alt="" /> : letter}</span>
          <span className="pd-face back">{photo ? letter : <><Camera size={20} strokeWidth={2} /><em>{t("Add photo")}</em></>}</span>
        </span>
      </button>
      <button type="button" className="pd-cam" onClick={onPick} aria-label={photo ? t("Change profile photo") : t("Add a profile photo")}><Camera size={15} strokeWidth={2.4} /></button>
    </div>
  );
}

/** Days from today for a stored meal date label ("Tomorrow, 17 Oct" → 1) */
const daysUntil = (label: string) => {
  for (let i = 0; i < 30; i++) if (dayLabel(i) === label) return i;
  return null;
};

export function ProfileDashboard({ rows, onEdit, onShare, onStartHosting, onBrowse, onSelectMeal }: {
  rows: ProfileRow[];
  onEdit: () => void;
  onShare: () => void;
  onStartHosting: () => void;
  onBrowse: () => void;
  onSelectMeal: (m: Meal) => void;
}) {
  const isDesktop = useIsDesktop();
  const store = useStore();
  const { profile } = store;
  const picker = usePhotoPicker();

  /* ── Demo numbers: a believable history + what happened in this demo ── */
  const myBookings = store.bookings.filter((b) => !b.guest && b.status === "confirmed");
  const guestsAtMyTables = store.bookings.filter((b) => b.guest && b.status === "confirmed");
  const bookedMeals = myBookings.map((b) => store.mealById(b.mealId)).filter(Boolean) as Meal[];
  const mealsShared = 12 + myBookings.length + store.published.length;
  const neighbours = 31 + myBookings.reduce((n, b) => n + 3 + b.guests, 0) + guestsAtMyTables.reduce((n, b) => n + b.guests, 0);
  const saved = 148 + myBookings.reduce((n, b) => n + Math.max(0, 25 * b.guests - b.total), 0);
  const kgSaved = 9.7 + myBookings.reduce((n, b) => n + 0.4 * b.guests, 0) + guestsAtMyTables.reduce((n, b) => n + 0.5 * b.guests, 0) + store.published.length * 0.6;

  const tried = new Set(TRIED_BEFORE);
  bookedMeals.forEach((m) => m.tags.forEach((tag) => STAMPS.some((s) => s.c === tag) && tried.add(tag)));
  const stampsLeft = Math.max(0, GLOBETROTTER - tried.size);

  const badges = [
    { id: "first", Icon: Utensils, tone: "gold", name: "First table", how: "Book your first meal", on: true },
    { id: "guest", Icon: Star, tone: "rose", name: "Great guest", how: "Get a 5★ review from a host", on: true },
    { id: "waste", Icon: Leaf, tone: "mint", name: "Zero waste", how: "Save 10 kg of food", on: kgSaved >= 10 },
    { id: "host", Icon: ChefHat, tone: "violet", name: "Super host", how: "Host your first table", on: store.published.length > 0 },
    { id: "globe", Icon: Globe2, tone: "sky", name: "Globetrotter", how: "Collect 8 passport stamps", on: tried.size >= GLOBETROTTER },
  ];

  const next = myBookings
    .map((b) => ({ b, m: store.mealById(b.mealId), d: (() => { const m = store.mealById(b.mealId); return m ? daysUntil(m.date) : null; })() }))
    .filter((x) => x.m)
    .sort((a, b) => (a.d ?? 99) - (b.d ?? 99))[0];

  const [passOpen, setPassOpen] = useState(false);
  const trust = 96;

  return (
    <div className={`pd ${isDesktop ? "pd-desk" : ""}`}>
      {/* ── Place card: "Reserved for" ── */}
      <section className="pd-placecard">
        <PlateAvatar letter={profile.name.charAt(0)} photo={profile.photo} onPick={picker.open} />
        {picker.input}
        <div className="pd-pc-body">
          <span className="pd-pc-eyebrow">{t("Reserved for")}</span>
          <h1>{profile.name}</h1>
          <p className="pd-pc-meta"><b>{t("Founder")}</b> · {t("{place} · member since 2026", { place: localPlace(profile.neighbourhood) })}</p>
          <p className="pd-pc-bio">{profile.bio ? tMaybe(profile.bio) : t("Tell neighbours a little about yourself.")}</p>
          <div className="pd-actions">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onStartHosting} className="pd-btn primary"><ChefHat size={14} /> {t("Start hosting")}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onEdit} className="pd-btn"><Pencil size={14} /> {t("Edit profile")}</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onShare} className="pd-btn"><Share2 size={14} /> {t("Share profile")}</motion.button>
          </div>
        </div>
        <TrustSticker score={trust} />
      </section>

      <div className="pd-grid">
        {/* ── Bite Passport: a closed booklet that opens in 3D (sideways on desktop, upwards on phones) ── */}
        <section className="pd-card pd-passport">
          <div className="pd-card-head">
            <div>
              <h2>{t("Bite Passport")}</h2>
              <p>{t("{n} of {total} cuisines stamped", { n: tried.size, total: STAMPS.length })}</p>
            </div>
            {passOpen && <button className="pp-close" onClick={() => setPassOpen(false)}>{t("Close passport")}</button>}
          </div>

          <div className={`pp ${passOpen ? "open" : ""}`}>
            <div className="pp-book">
              {/* Right / lower page: the stamps */}
              <div className="pp-page pp-visas">
                <span className="pp-page-title">{t("Visas")}</span>
                <div className="pd-stamps" key={passOpen ? "open" : "closed"}>
                  {STAMPS.map((s, i) => {
                    const on = tried.has(s.c);
                    return (
                      <motion.div key={s.c} className={`pd-stamp ${on ? "on" : ""}`} style={{ ["--c" as string]: s.col, rotate: on ? `${((i * 37) % 17) - 8}deg` : "0deg" }}
                        initial={on && passOpen ? { scale: 2.2, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.75 + i * 0.09, type: "spring", stiffness: 420, damping: 16 }}>
                        <span className="pd-stamp-e">{on ? s.e : "?"}</span>
                        <span className="pd-stamp-n">{t(s.c)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* The cover: outside = passport cover, inside = the identity page */}
              <button className="pp-cover" onClick={() => setPassOpen(true)} aria-label={t("Open passport")} disabled={passOpen}>
                <span className="pp-front">
                  <span className="pp-emblem">
                    <svg viewBox="0 0 549 549" width="64" height="64" aria-hidden>
                      <rect x="107" y="30" width="83" height="330" rx="41.5" fill="#e3c77a" />
                      <circle cx="285" cy="340" r="178" fill="#e3c77a" />
                      <path d="M190 405q72 62 144 0" fill="none" stroke="#2a1553" strokeWidth="26" strokeLinecap="round" />
                    </svg>
                  </span>
                  <b>BITE</b>
                  <span className="pp-front-sub">{t("PASSPORT")}</span>
                  <span className="pp-front-small">{t("Neighbourhood food club")}</span>
                  <span className="pp-tap">{t("Tap to open")}</span>
                </span>
                <span className="pp-back">
                  <span className="pp-page-title">{t("Holder")}</span>
                  <span className="pp-id">
                    <span className="pp-photo">{profile.photo ? <img src={profile.photo} alt="" /> : profile.name.charAt(0)}</span>
                    <span className="pp-fields">
                      <span><em>{t("Name")}</em><b>{profile.name}</b></span>
                      <span><em>{t("Lives in")}</em><b>{localPlace(profile.neighbourhood)}</b></span>
                      <span><em>{t("Member since")}</em><b>2026</b></span>
                      <span><em>{t("Passport no.")}</em><b>BT-2026-0001</b></span>
                    </span>
                  </span>
                  <span className="pp-sign">{profile.name.split(" ")[0]}</span>
                  <span className="pp-mrz">P&lt;BITE&lt;{profile.name.toUpperCase().replace(/[^A-Z]+/g, "<")}&lt;&lt;&lt;&lt;&lt;&lt;<br />BT20260001&lt;{String(tried.size).padStart(2, "0")}STAMPS&lt;&lt;{mealsShared}TABLES&lt;&lt;&lt;</span>
                </span>
              </button>
            </div>
          </div>

          <div className="pd-unlock">
            {stampsLeft > 0
              ? <><b><Globe2 size={15} /> {stampsLeft === 1 ? t("1 more stamp to unlock Globetrotter") : t("{n} more stamps to unlock Globetrotter", { n: stampsLeft })}</b>
                  <button onClick={onBrowse}>{t("Find a new cuisine")} <ArrowRight size={13} /></button></>
              : <b><Globe2 size={15} /> {t("Globetrotter unlocked!")}</b>}
          </div>
        </section>

        <div className="pd-col">
          {/* ── Next meal, as a reservation ticket ── */}
          <section className="pd-card pd-next">
            <h2>{t("Your next meal")}</h2>
            {next?.m ? (
              <button className="pd-ticket" onClick={() => onSelectMeal(next.m!)}>
                <span className="pd-ticket-stub">
                  <em>{next.d === 0 ? t("Today!") : next.d === 1 ? t("in 1 day") : next.d != null ? t("in {n} days", { n: next.d }) : t("Coming up")}</em>
                  <b>{next.m.time}</b>
                </span>
                <span className="pd-ticket-body">
                  <small>{t("Reservation")}</small>
                  <b>{tMaybe(next.m.title)}</b>
                  <span>{t("with {name}", { name: next.m.host })} · {dateLabel(next.m.date)}</span>
                </span>
                <span className="pd-ticket-price">{euro(next.b.total)}</span>
              </button>
            ) : (
              <div className="pd-ticket empty">
                <span className="pd-ticket-stub"><em>{t("Reservation")}</em><b>—</b></span>
                <span className="pd-ticket-body">
                  <span>{t("No table booked yet. A neighbour is cooking tonight.")}</span>
                  <button onClick={onBrowse}>{t("Find a table")} <ArrowRight size={14} /></button>
                </span>
              </div>
            )}
          </section>

          {/* ── Badges ── */}
          <section className="pd-card pd-badges">
            <h2>{t("Badges")}</h2>
            <div className="pd-badge-row">
              {badges.map((b, i) => (
                <motion.div key={b.id} className={`pd-badge ${b.on ? "on" : ""}`} title={t(b.how)}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}>
                  <Medal Icon={b.Icon} tone={b.tone} on={b.on} delay={0.3 + i * 0.1} />
                  <b>{t(b.name)}</b>
                  <em>{b.on ? t("Unlocked") : t(b.how)}</em>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Your tab so far + the account options as a short menu ── */}
      <div className="pd-grid pd-grid-bottom">
        <section className="pd-tab">
          <div className="pd-tab-head">
            <b>BITE</b>
            <span>{t("Your tab so far")}</span>
          </div>
          <TabLine i={0} value={Math.round(saved)} prefix={getLang() === "de" ? "" : "€"} suffix={getLang() === "de" ? " €" : ""} label={t("saved")} sub={t("vs. eating out")} />
          <TabLine i={1} value={neighbours} label={t("neighbours met")} sub={t("at {n} shared tables", { n: mealsShared })} />
          <TabLine i={2} value={mealsShared} label={t("meals shared")} sub={t("cooked at home, not in a factory")} />
          <TabLine i={3} value={kgSaved} decimals={1} suffix=" kg" label={t("food saved")} sub={t("from going to waste")} />
          <p className="pd-tab-foot"><i /> {t("Updates live as you book and host")}</p>
        </section>

        <section className="pd-card pd-menu">
          <h2>{t("Account")}</h2>
          {rows.map(({ Icon, label, sub, onClick }) => (
            <button key={label} onClick={onClick} className="pd-menu-line">
              <Icon size={16} strokeWidth={2} />
              <span><b>{label}</b><em>{sub}</em></span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}
