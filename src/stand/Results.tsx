import { useEffect, useState } from "react";
import { SpinningText } from "../shared/Motion";
import { QUESTIONS, type Lang } from "./questions";
import { localResponses } from "./store";
import { FORMS_ENDPOINT } from "../shared/forms";

// Live results for a screen behind the stand, set as the kitchen pass: an order counter on a ticket, the QR as a
// reservation card, the stats on a chalkboard (a 'warming up' kitchen until there are 5 answers) and the latest
// anonymous orders on the rail. Real answers only, refreshed every 15 seconds; no email ever reaches this screen.

interface Row { at: string; who?: string; age?: string; alone?: string; join?: string; price?: string; host?: string; pains: string[]; worries: string[] }

const MIN_FOR_PERCENTAGES = 5;
const lang: Lang = new URLSearchParams(window.location.search).get("lang") === "de" ? "de" : "en";

const L = {
  en: { title: "Live from the kitchen", orders: "Orders tonight", today: "today", join: "would join a dinner at a neighbour's", maybe: "maybe", host: "would cook a dish from their culture", intl: "are internationals", alone: "eat 8+ meals a week alone", price: "What a plate is worth", pains: "What's hardest about everyday eating", worries: "What holds people back", scan: "Your turn!", scanSub: "Scan · 8 quick taps · grab a sweet", sweet: "Free sweet", warm: "The kitchen is warming up", warmSub: (k: number) => (k === 1 ? "1 more order and the results are served" : `${k} more orders and the results are served`), rail: "Latest orders", sourceLocal: "orders on this device", sourceLive: "orders arriving live", order: "Order", join_yes: "would join", join_maybe: "maybe", join_no: "not for them" },
  de: { title: "Live aus der Küche", orders: "Bestellungen heute", today: "heute", join: "würden bei Nachbar:innen mitessen", maybe: "vielleicht", host: "würden ein Gericht ihrer Kultur kochen", intl: "sind international", alone: "essen 8+ Mahlzeiten pro Woche allein", price: "Was ein Teller wert ist", pains: "Was im Essensalltag am schwierigsten ist", worries: "Was Leute zurückhält", scan: "Du bist dran!", scanSub: "Scannen · 8 Klicks · Süßes nehmen", sweet: "Süßes gratis", warm: "Die Küche heizt vor", warmSub: (k: number) => (k === 1 ? "Noch 1 Bestellung, dann werden die Ergebnisse serviert" : `Noch ${k} Bestellungen, dann werden die Ergebnisse serviert`), rail: "Letzte Bestellungen", sourceLocal: "Bestellungen auf diesem Gerät", sourceLive: "Bestellungen kommen live rein", order: "Bestellung", join_yes: "würde mitessen", join_maybe: "vielleicht", join_no: "eher nicht" },
}[lang];

const optLabel = (qid: string, id: string) => {
  const o = QUESTIONS.find((q) => q.id === qid)?.options.find((x) => x.id === id);
  return o ? o.label[lang] : id;
};

function fromLocal(): Row[] {
  return localResponses().map((r) => ({
    at: r.at, ...(r.answers as Record<string, string>),
    pains: ([] as string[]).concat(r.answers.pains ?? []),
    worries: ([] as string[]).concat(r.answers.worries ?? []),
  }));
}

export function Results() {
  // With the Google Sheet connected, show nothing until its answers arrive (this device's own answers are only a
  // fallback when the Sheet can't be reached), so the counter never flashes a local number and then jumps
  const [data, setRows] = useState<Row[] | null>(() => (FORMS_ENDPOINT ? null : fromLocal()));
  const rows = data ?? [];
  const loading = data === null;
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      if (FORMS_ENDPOINT) {
        try {
          const res = await fetch(`${FORMS_ENDPOINT}?action=stats`);
          const data = await res.json();
          if (data.ok && Array.isArray(data.rows)) { setRows(data.rows); setLive(true); setUpdated(new Date()); return; }
        } catch { /* offline: fall back to this device */ }
      }
      setRows(fromLocal()); setLive(false); setUpdated(new Date());
    };
    void load();
    const id = window.setInterval(load, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const n = rows.length;
  const today = rows.filter((r) => new Date(r.at).toDateString() === new Date().toDateString()).length;
  const pct = (k: number, of = n) => (of ? Math.round((k / of) * 100) : 0);
  const count = (pred: (r: Row) => boolean) => rows.filter(pred).length;
  const answeredJoin = count((r) => !!r.join);
  const answeredHost = count((r) => !!r.host);
  const answeredAlone = count((r) => !!r.alone);
  const enough = n >= MIN_FOR_PERCENTAGES;

  const dist = (qid: "price") => {
    const opts = QUESTIONS.find((q) => q.id === qid)!.options;
    const answered = count((r) => !!r[qid]);
    return opts.map((o) => ({ label: optLabel(qid, o.id), v: pct(count((r) => r[qid] === o.id), answered) }));
  };
  const top = (qid: "pains" | "worries", k = 5) => {
    const tally = new Map<string, number>();
    rows.forEach((r) => r[qid].forEach((x) => tally.set(x, (tally.get(x) ?? 0) + 1)));
    const answered = count((r) => r[qid].length > 0);
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id, c]) => ({ label: optLabel(qid, id), v: pct(c, answered) }));
  };

  const time = (d: Date) => d.toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  // the last orders on the kitchen rail, newest first (anonymous: no email ever reaches this screen)
  const latest = rows.map((r, i) => ({ r, no: i + 1 })).slice(-6).reverse();
  const joinWord = (j?: string) => (j === "yes" ? L.join_yes : j === "maybe" ? L.join_maybe : j === "no" ? L.join_no : "");

  return (
    <div className="pz">
      <header className="pz-head">
        <svg className="pz-word" viewBox="-2 0 664 300" role="img" aria-label="Bite">
          <defs><mask id="pz-m" maskUnits="userSpaceOnUse" x="0" y="0" width="549" height="549"><rect width="549" height="549" fill="#fff" /><path d="M190 405q72 62 144 0" fill="none" stroke="#000" strokeWidth="26" strokeLinecap="round" /><g fill="#000"><circle cx="405" cy="198" r="20" /><circle cx="434" cy="228" r="22" /><circle cx="456" cy="267" r="22" /><circle cx="469" cy="311" r="20" /></g></mask></defs>
          <g transform="translate(-60 -12) scale(0.6)"><g mask="url(#pz-m)" fill="#e9dcff"><rect x="107" y="30" width="83" height="330" rx="41.5" /><circle cx="285" cy="340" r="178" /></g></g>
          <text x="226" y="296" fontSize="330" fontWeight="900" fill="#e9dcff" fontFamily="Inter, sans-serif" letterSpacing="-14">ite</text>
        </svg>
        <h1 className="pz-title">{L.title}</h1>
        <div className="pz-live"><span className={`pz-dot ${live ? "on" : ""}`} />{live ? L.sourceLive : L.sourceLocal} · {time(updated)}</div>
      </header>

      <main className="pz-main">
        <aside className="pz-side">
          {/* the order counter as a long kitchen ticket */}
          <section className="pz-ticket">
            <span className="pz-k">{L.orders}</span>
            <div className="pz-count">{loading ? <span className="pz-loading">···</span> : <SpinningText text={String(n).padStart(3, "0")} cell="1em" />}</div>
            <span className="pz-today">{loading ? "\u00a0" : `${today} ${L.today}`}</span>
          </section>
          {/* the QR as a reservation card */}
          <section className="pz-qr">
            <span className="pz-stamp">{L.sweet}</span>
            <img src="stand/qr-stand.svg" alt="QR code to the Bite survey" />
            <b>{L.scan}</b>
            <span>{L.scanSub}</span>
          </section>
        </aside>

        <section className="pz-board">
          {enough ? (
            <>
              <div className="pz-stats">
                <Stat v={pct(count((r) => r.join === "yes"), answeredJoin)} label={L.join} sub={`+ ${pct(count((r) => r.join === "maybe"), answeredJoin)}% ${L.maybe}`} hot />
                <Stat v={pct(count((r) => !!r.who && r.who.startsWith("int-")), count((r) => !!r.who))} label={L.intl} />
                <Stat v={pct(count((r) => r.host === "often" || r.host === "sometimes"), answeredHost)} label={L.host} />
                <Stat v={pct(count((r) => r.alone === "8-14" || r.alone === "almost-all"), answeredAlone)} label={L.alone} />
              </div>
              <div className="pz-charts">
                <Bars title={L.price} items={dist("price")} />
                <Bars title={L.pains} items={top("pains", 4)} />
                <Bars title={L.worries} items={top("worries", 4)} />
              </div>
            </>
          ) : (
            <div className="pz-warm">
              <svg className="pz-pot" viewBox="0 0 240 170" aria-hidden>
                <g className="pz-steam" fill="none" stroke="#e9dcff" strokeWidth="5" strokeLinecap="round"><path d="M90 52c-10-12 10-20 0-34" /><path d="M120 46c-10-12 10-20 0-34" /><path d="M150 52c-10-12 10-20 0-34" /></g>
                <rect x="40" y="70" width="160" height="80" rx="18" fill="#6b21d9" /><rect x="30" y="62" width="180" height="16" rx="8" fill="#9b4aff" /><rect x="14" y="88" width="28" height="12" rx="6" fill="#9b4aff" /><rect x="198" y="88" width="28" height="12" rx="6" fill="#9b4aff" />
                <text x="120" y="122" textAnchor="middle" fontSize="20" fontWeight="900" letterSpacing="5" fill="#e9dcff" fontFamily="Inter, sans-serif">BITE</text>
              </svg>
              <h2>{L.warm}</h2>
              <div className="pz-plates">
                {Array.from({ length: MIN_FOR_PERCENTAGES }, (_, i) => <span key={i} className={i < n ? "on" : ""} style={{ ["--i" as string]: i }} />)}
              </div>
              <p>{L.warmSub(MIN_FOR_PERCENTAGES - n)}</p>
            </div>
          )}
        </section>
      </main>

      {/* the kitchen rail with the latest orders */}
      <footer className="pz-rail">
        <span className="pz-rail-k">{L.rail}</span>
        <div className="pz-rail-bar" aria-hidden />
        <div className="pz-slips">
          {latest.length === 0 && <div className="pz-slip ghost">{L.order} № 001</div>}
          {latest.map(({ r, no }) => (
            <div key={no} className="pz-slip">
              <div className="pz-slip-head"><span>№ {String(no).padStart(3, "0")}</span><span>{r.at ? time(new Date(r.at)) : ""}</span></div>
              {r.who && <div>{optLabel("who", r.who)}</div>}
              <div className="pz-slip-meta">{[r.age && optLabel("age", r.age), r.price && optLabel("price", r.price)].filter(Boolean).join(" · ")}</div>
              {r.join && <div className={`pz-join ${r.join}`}>{joinWord(r.join)}</div>}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function Stat({ v, label, sub, hot }: { v: number; label: string; sub?: string; hot?: boolean }) {
  return (
    <div className={`pz-stat ${hot ? "hot" : ""}`}>
      <div className="pz-stat-n"><SpinningText text={`${v}%`} cell="1em" /></div>
      <div className="pz-stat-l">{label}</div>
      {sub && <div className="pz-stat-s">{sub}</div>}
    </div>
  );
}

function Bars({ title, items }: { title: string; items: { label: string; v: number }[] }) {
  return (
    <div className="pz-chart">
      <div className="pz-chart-t">{title}</div>
      {items.map((i, k) => (
        <div key={i.label} className="pz-bar" style={{ ["--k" as string]: k }}>
          <div className="pz-bar-top"><span>{i.label}</span><b>{i.v}%</b></div>
          <div className="pz-bar-track"><span style={{ width: `${i.v}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
