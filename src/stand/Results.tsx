import { useEffect, useState } from "react";
import { SpinningText } from "../shared/Motion";
import { QUESTIONS, type Lang } from "./questions";
import { localResponses } from "./store";
import { FORMS_ENDPOINT } from "../shared/forms";

// Live results for a screen behind the stand: real answers only, refreshed every 15 seconds.

interface Row { at: string; who?: string; format?: string; alone?: string; join?: string; price?: string; host?: string; cuisines: string[]; worries: string[] }

const MIN_FOR_PERCENTAGES = 5;
const lang: Lang = new URLSearchParams(window.location.search).get("lang") === "de" ? "de" : "en";

const L = {
  en: { title: "Live at the Bite stand", people: "people answered", today: "today", join: "would join a dinner at a neighbour's", maybe: "maybe", host: "would cook for others", intl: "are internationals", alone: "eat 8+ meals a week alone", price: "What people would pay per plate", format: "What people would use most", cuisines: "Most wanted cuisines", worries: "What holds people back", scan: "Your turn!", scanSub: "Scan, answer 8 quick questions —", sweet: "and grab a sweet", few: "Be one of the first to answer — results appear here live.", sourceLocal: "answers on this device", sourceLive: "live from all devices" },
  de: { title: "Live am Bite-Stand", people: "Personen haben geantwortet", today: "heute", join: "würden bei Nachbar:innen mitessen", maybe: "vielleicht", host: "würden für andere kochen", intl: "sind international", alone: "essen 8+ Mahlzeiten pro Woche allein", price: "Was man pro Teller zahlen würde", format: "Was am meisten genutzt würde", cuisines: "Beliebteste Küchen", worries: "Was Leute zurückhält", scan: "Du bist dran!", scanSub: "Scannen, 8 kurze Fragen —", sweet: "und Süßes mitnehmen", few: "Sei eine:r der Ersten — die Ergebnisse erscheinen hier live.", sourceLocal: "Antworten auf diesem Gerät", sourceLive: "live von allen Geräten" },
}[lang];

const optLabel = (qid: string, id: string) => {
  const o = QUESTIONS.find((q) => q.id === qid)?.options.find((x) => x.id === id);
  return o ? `${o.emoji ? o.emoji + " " : ""}${o.label[lang]}` : id;
};

function fromLocal(): Row[] {
  return localResponses().map((r) => ({
    at: r.at, ...(r.answers as Record<string, string>),
    cuisines: ([] as string[]).concat(r.answers.cuisines ?? []),
    worries: ([] as string[]).concat(r.answers.worries ?? []),
  }));
}

export function Results() {
  const [rows, setRows] = useState<Row[]>(fromLocal);
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

  const dist = (qid: "price" | "format") => {
    const opts = QUESTIONS.find((q) => q.id === qid)!.options;
    const answered = count((r) => !!r[qid]);
    return opts.map((o) => ({ label: optLabel(qid, o.id), v: pct(count((r) => r[qid] === o.id), answered) }));
  };
  const top = (qid: "cuisines" | "worries", k = 5) => {
    const tally = new Map<string, number>();
    rows.forEach((r) => r[qid].forEach((x) => tally.set(x, (tally.get(x) ?? 0) + 1)));
    const answered = count((r) => r[qid].length > 0);
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id, c]) => ({ label: optLabel(qid, id), v: pct(c, answered) }));
  };

  return (
    <div className="rs-page">
      <header className="rs-head">
        <div className="rs-brand"><img src="landing/logo.png" alt="" /><span>Bite</span></div>
        <div className="rs-title">{L.title}</div>
        <div className="rs-meta"><span className="rs-dot" />{live ? L.sourceLive : L.sourceLocal} · {updated.toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
      </header>

      <div className="rs-grid">
        <section className="rs-tile rs-big">
          <div className="rs-num"><SpinningText text={String(n)} cell="1em" /></div>
          <div className="rs-lbl">{L.people}</div>
          <div className="rs-sub">{today} {L.today}</div>
        </section>

        {enough ? (
          <>
            <section className="rs-tile rs-accent">
              <div className="rs-num"><SpinningText text={`${pct(count((r) => r.join === "yes"), answeredJoin)}%`} cell="1em" /></div>
              <div className="rs-lbl">{L.join}</div>
              <div className="rs-sub">+ {pct(count((r) => r.join === "maybe"), answeredJoin)}% {L.maybe}</div>
            </section>
            <section className="rs-tile">
              <div className="rs-num"><SpinningText text={`${pct(count((r) => r.host === "often" || r.host === "sometimes"), answeredHost)}%`} cell="1em" /></div>
              <div className="rs-lbl">{L.host}</div>
            </section>
            <section className="rs-tile">
              <div className="rs-num"><SpinningText text={`${pct(count((r) => !!r.who && r.who.startsWith("intl")), count((r) => !!r.who))}%`} cell="1em" /></div>
              <div className="rs-lbl">{L.intl}</div>
            </section>
            <section className="rs-tile">
              <div className="rs-num"><SpinningText text={`${pct(count((r) => r.alone === "8-14" || r.alone === "almost-all"), answeredAlone)}%`} cell="1em" /></div>
              <div className="rs-lbl">{L.alone}</div>
            </section>
            <Bars title={L.format} items={dist("format")} />
            <Bars title={L.price} items={dist("price")} />
            <Bars title={L.cuisines} items={top("cuisines")} />
            <Bars title={L.worries} items={top("worries", 4)} />
          </>
        ) : (
          <section className="rs-tile rs-wide rs-few">{L.few}</section>
        )}

        <section className="rs-tile rs-qr">
          <img src="stand/qr-stand.svg" alt="QR code to the Bite survey" />
          <div>
            <div className="rs-scan">{L.scan}</div>
            <div className="rs-lbl">{L.scanSub}<br />{L.sweet}</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Bars({ title, items }: { title: string; items: { label: string; v: number }[] }) {
  return (
    <section className="rs-tile rs-bars">
      <div className="rs-bars-title">{title}</div>
      {items.map((i) => (
        <div key={i.label} className="rs-bar">
          <div className="rs-bar-top"><span>{i.label}</span><b>{i.v}%</b></div>
          <div className="rs-bar-track"><span style={{ width: `${i.v}%` }} /></div>
        </div>
      ))}
    </section>
  );
}
