// The feedback desk: the kitchen pass screen (stand.html?screen) turned into the team's control desk for the
// "Rate Bite" answers (feedback.html). Team only: the Apps Script returns the rows only with the desk key
// (stored in this browser after the first entry, or passed once as stand.html?screen#k=…). Never shows emails.
// Shows: how many ratings, the usability score (SUS 0-100) and stars, who would really use Bite, the weakest
// SUS statements (what to fix first), what people tried, where the answers came from, and the latest comments.
import { useEffect, useMemo, useState } from "react";
import { SpinningText } from "../shared/Motion";
import { FORMS_ENDPOINT } from "../shared/forms";

interface Fb { at: string; lang: string; source: string; device: string; stars: number | ""; tried: string[]; sus: (number | "")[]; score: number | ""; liked: string; confused: string; use: string; interview: boolean }

const KEY = "bite_desk_key";
const lang = new URLSearchParams(location.search).get("lang") === "de" ? "de" : "en";
const L = {
  en: { title: "Feedback desk", ratings: "Ratings", today: "today", live: "live from the sheet", key: "Desk key", keyLead: "Team only. Paste the key Sebastiano shared.", open: "Open the desk", wrong: "That key doesn't open the desk.",
    sus: "usability score", stars: "average stars", use: "would really use it", interview: "said yes to an interview", maybe: "maybe", full: "answered all ten statements",
    weak: "Fix first: the weakest statements", tried: "What people tried", sources: "Where the answers came from", comments: "Latest comments",
    all: "All sources", period: { all: "All time", "7": "Last 7 days", "1": "Today" }, liked: "Liked", confused: "Confused", none: "No ratings yet. Share bitetable.de/feedback.html?tried&ref=test1",
    survey: "Survey screen", grade: (s: number) => (s >= 80 ? "excellent" : s >= 68 ? "good" : s >= 51 ? "okay" : "poor"), out: "/100" },
  de: { title: "Feedback-Pult", ratings: "Bewertungen", today: "heute", live: "live aus der Tabelle", key: "Pult-Schlüssel", keyLead: "Nur fürs Team. Füg den Schlüssel ein, den Sebastiano geteilt hat.", open: "Pult öffnen", wrong: "Mit diesem Schlüssel öffnet sich das Pult nicht.",
    sus: "Usability-Wert", stars: "Sterne im Schnitt", use: "würden es wirklich nutzen", interview: "haben einem Interview zugestimmt", maybe: "vielleicht", full: "haben alle zehn Aussagen beantwortet",
    weak: "Zuerst verbessern: die schwächsten Aussagen", tried: "Was ausprobiert wurde", sources: "Woher die Antworten kamen", comments: "Neueste Kommentare",
    all: "Alle Quellen", period: { all: "Gesamt", "7": "Letzte 7 Tage", "1": "Heute" }, liked: "Gefallen", confused: "Verwirrt", none: "Noch keine Bewertungen. Teile bitetable.de/feedback.html?tried&ref=test1",
    survey: "Umfrage-Bildschirm", grade: (s: number) => (s >= 80 ? "ausgezeichnet" : s >= 68 ? "gut" : s >= 51 ? "okay" : "schwach"), out: "/100" },
}[lang];

const SUS_SHORT = {
  en: ["Would use it often", "Not too complex", "Easy to use", "No help needed", "Parts fit together", "Consistent", "Quick to learn", "Not cumbersome", "Felt confident", "Little to learn first"],
  de: ["Würde es oft nutzen", "Nicht zu komplex", "Einfach zu benutzen", "Keine Hilfe nötig", "Teile passen zusammen", "Einheitlich", "Schnell zu lernen", "Nicht umständlich", "Fühlte mich sicher", "Wenig vorab zu lernen"],
}[lang];
const TRIED: Record<string, string> = { browse: "Looked for meals", meal: "Opened a meal", book: "Asked for a seat", host: "Started hosting", chat: "Chatted", ask: "Asked Bite", profile: "Set up profile" };

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (k: number, of: number) => (of ? Math.round((k / of) * 100) : 0);

export function FeedbackDesk() {
  const [key, setKey] = useState(() => {
    const fromHash = new URLSearchParams(location.hash.slice(1)).get("k");
    if (fromHash) { try { localStorage.setItem(KEY, fromHash); } catch { /* ignore */ } history.replaceState(null, "", location.pathname + location.search); return fromHash; }
    try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
  });
  const [draft, setDraft] = useState("");
  const [rows, setRows] = useState<Fb[] | null>(null);
  const [bad, setBad] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  const [source, setSource] = useState("all");
  const [period, setPeriod] = useState<"all" | "7" | "1">("all");

  useEffect(() => {
    if (!key) return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch(`${FORMS_ENDPOINT}?action=feedback&k=${encodeURIComponent(key)}`);
        const d = await res.json();
        if (stop) return;
        if (d.ok && Array.isArray(d.rows)) { setRows(d.rows); setBad(false); setUpdated(new Date()); }
        else if (d.error === "key") { setBad(true); setKey(""); try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
      } catch { /* offline: keep the last numbers */ }
    };
    void load();
    const id = window.setInterval(load, 30_000);
    return () => { stop = true; window.clearInterval(id); };
  }, [key]);

  const real = useMemo(() => (rows ?? []).filter((r) => !/^claude-test/.test(r.source)), [rows]);
  const sources = useMemo(() => [...new Set(real.map((r) => r.source || "direct"))].sort(), [real]);
  const list = useMemo(() => {
    const since = period === "all" ? 0 : period === "1" ? new Date().setHours(0, 0, 0, 0) : Date.now() - 7 * 864e5;
    return real.filter((r) => (source === "all" || (r.source || "direct") === source) && new Date(r.at).getTime() >= since);
  }, [real, source, period]);

  if (!key) {
    return (
      <div className="pz fd-gate">
        <form className="fd-keycard" onSubmit={(e) => { e.preventDefault(); const k = draft.trim(); if (!k) return; try { localStorage.setItem(KEY, k); } catch { /* ignore */ } setRows(null); setKey(k); }}>
          <h1>{L.title}</h1>
          <p>{L.keyLead}</p>
          <label><span>{L.key}</span><input value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" spellCheck={false} /></label>
          {bad && <p className="fd-bad" role="alert">{L.wrong}</p>}
          <button type="submit">{L.open}</button>
          <a href="stand.html?screen&survey">{L.survey}</a>
        </form>
      </div>
    );
  }

  const n = list.length;
  const today = real.filter((r) => new Date(r.at).toDateString() === new Date().toDateString()).length;
  const scores = list.map((r) => Number(r.score)).filter((x) => !Number.isNaN(x) && r0(x));
  const sus = Math.round(avg(scores));
  const stars = avg(list.map((r) => Number(r.stars)).filter((x) => x >= 1));
  const usedAns = list.filter((r) => r.use);
  const yes = pct(usedAns.filter((r) => r.use === "yes").length, usedAns.length);
  const maybe = pct(usedAns.filter((r) => r.use === "maybe").length, usedAns.length);
  const interviews = list.filter((r) => r.interview).length;
  // each SUS line as "how positive" 0-100 (odd lines: agreeing is good, even lines: disagreeing is good)
  const items = SUS_SHORT.map((label, i) => {
    const vals = list.map((r) => Number(r.sus[i])).filter((x) => x >= 1 && x <= 5).map((x) => (i % 2 === 0 ? x - 1 : 5 - x) * 25);
    return { label, v: Math.round(avg(vals)), has: vals.length > 0 };
  }).filter((x) => x.has).sort((a, b) => a.v - b.v).slice(0, 5);
  const triedCounts = Object.entries(TRIED).map(([k, label]) => ({ label, v: pct(list.filter((r) => r.tried.includes(k)).length, n) })).sort((a, b) => b.v - a.v).slice(0, 5);
  const srcCounts = sources.map((s) => ({ label: s, v: pct(list.filter((r) => (r.source || "direct") === s).length, n) })).sort((a, b) => b.v - a.v).slice(0, 5);
  const comments = list.filter((r) => r.liked || r.confused).slice(-8).reverse();
  const time = (d: Date) => d.toLocaleString(lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="pz fd">
      <header className="pz-head">
        <h1 className="pz-title">{L.title}</h1>
        <div className="fd-filters">
          <select value={source} onChange={(e) => setSource(e.target.value)} aria-label={L.sources}>
            <option value="all">{L.all}</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value as "all" | "7" | "1")} aria-label="Period">
            {(["all", "7", "1"] as const).map((p) => <option key={p} value={p}>{L.period[p]}</option>)}
          </select>
          <a className="fd-switch" href="stand.html?screen&survey">{L.survey}</a>
        </div>
        <div className="pz-live"><span className={`pz-dot ${rows ? "on" : ""}`} />{L.live} · {updated.toLocaleTimeString(lang === "de" ? "de-DE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
      </header>

      <main className="pz-main">
        <aside className="pz-side">
          <section className="pz-ticket">
            <span className="pz-k">{L.ratings}</span>
            <div className="pz-count">{rows === null ? <span className="pz-loading">···</span> : <SpinningText text={String(n).padStart(3, "0")} cell="1em" />}</div>
            <span className="pz-today">{rows === null ? " " : `${today} ${L.today}`}</span>
          </section>
          <section className="pz-qr fd-score">
            <span className="fd-score-n">{n ? sus : "–"}<small>{L.out}</small></span>
            <b>{L.sus}</b>
            {n > 0 && <span className={`fd-grade g-${L.grade(sus)}`}>{L.grade(sus)}</span>}
          </section>
        </aside>

        <section className="pz-board">
          {n === 0 ? (
            <div className="pz-warm"><h2>{L.none}</h2></div>
          ) : (
            <>
              <div className="pz-stats">
                <Stat v={stars.toFixed(1)} label={L.stars} />
                <Stat v={`${yes}%`} label={L.use} sub={`+ ${maybe}% ${L.maybe}`} hot />
                <Stat v={String(interviews)} label={L.interview} />
                <Stat v={String(scores.length)} label={L.full} />
              </div>
              <div className="pz-charts">
                <Bars title={L.weak} items={items} unit="" />
                <Bars title={L.tried} items={triedCounts} />
                <Bars title={L.sources} items={srcCounts} />
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="pz-rail">
        <span className="pz-rail-k">{L.comments}</span>
        <div className="pz-rail-bar" aria-hidden />
        <div className="pz-slips">
          {comments.length === 0 && <div className="pz-slip ghost">–</div>}
          {comments.map((r, i) => (
            <div key={i} className="pz-slip fd-slip">
              <div className="pz-slip-head"><span>{"★".repeat(Number(r.stars) || 0)}</span><span>{r.at ? time(new Date(r.at)) : ""}</span></div>
              {r.liked && <p><em className="ok">{L.liked}</em> {r.liked}</p>}
              {r.confused && <p><em className="no">{L.confused}</em> {r.confused}</p>}
              <div className="pz-slip-meta">{r.source || "direct"}, {r.device}</div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

const r0 = (x: number) => x >= 0 && x <= 100;

function Stat({ v, label, sub, hot }: { v: string; label: string; sub?: string; hot?: boolean }) {
  return (
    <div className={`pz-stat ${hot ? "hot" : ""}`}>
      <div className="pz-stat-n"><SpinningText text={v} cell="1em" /></div>
      <div className="pz-stat-l">{label}</div>
      {sub && <div className="pz-stat-s">{sub}</div>}
    </div>
  );
}

function Bars({ title, items, unit = "%" }: { title: string; items: { label: string; v: number }[]; unit?: string }) {
  return (
    <div className="pz-chart">
      <div className="pz-chart-t">{title}</div>
      {items.map((i, k) => (
        <div key={i.label} className="pz-bar" style={{ ["--k" as string]: k }} title={`${i.label}: ${i.v}${unit || "/100"}`}>
          <div className="pz-bar-top"><span>{i.label}</span><b>{i.v}{unit}</b></div>
          <div className="pz-bar-track"><span style={{ width: `${i.v}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
