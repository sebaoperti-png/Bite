// Profile → "Your reviews" (what guests wrote about you as a host, what hosts wrote about you as a guest, with your
// averages) and "People you follow" (unfollow from here). Live data comes from the database; the demo shows its
// own sample reviews.
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star, UserMinus } from "lucide-react";
import { useStore } from "../store";
import { fetchHostReviews, fetchMyGuestReviews, type HostReview } from "../liveData";
import { Stars } from "./ReviewSheet";
import { t, tMaybe, dec, locale } from "../../shared/i18n";
import "../styles/review.css";

const DEMO_HOST: HostReview[] = [
  { rating: 5, comment: "The risotto was perfect and the table felt like family.", at: Date.now() - 9 * 86400000, author: "Lena", photo: "", meal: "Risotto ai funghi" },
  { rating: 5, comment: "Generous portions, lovely company.", at: Date.now() - 30 * 86400000, author: "Tom", photo: "", meal: "Pasta night" },
];
const DEMO_GUEST: HostReview[] = [{ rating: 5, comment: "On time, friendly, brought dessert.", at: Date.now() - 12 * 86400000, author: "Maria", photo: "", meal: "Thai green curry" }];

const avg = (xs: HostReview[]) => (xs.length ? Math.round((xs.reduce((n, r) => n + r.rating, 0) / xs.length) * 10) / 10 : 0);

/** loads both lists once (live) */
export function useMyReviews(open = true) {
  const store = useStore();
  const [host, setHost] = useState<HostReview[] | null>(store.live ? null : DEMO_HOST);
  const [guest, setGuest] = useState<HostReview[] | null>(store.live ? null : DEMO_GUEST);
  useEffect(() => {
    if (!store.live || !open || !store.myId) return;
    let alive = true;
    fetchHostReviews(store.myId).then((r) => alive && setHost(r)).catch(() => alive && setHost([]));
    fetchMyGuestReviews().then((r) => alive && setGuest(r));
    return () => { alive = false; };
  }, [store.live, store.myId, open, store.bookings.length]);
  return { host, guest, hostAvg: avg(host ?? []), guestAvg: avg(guest ?? []) };
}

export function MyReviews() {
  const [tab, setTab] = useState<"host" | "guest">("host");
  const { host, guest, hostAvg, guestAvg } = useMyReviews();
  const list = tab === "host" ? host : guest;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {([["host", t("As a host"), hostAvg, host], ["guest", t("As a guest"), guestAvg, guest]] as const).map(([id, label, a, xs]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className="rounded-2xl p-3 text-left" aria-pressed={tab === id}
            style={{ background: tab === id ? "#160a2e" : "#fff", border: "1.5px solid rgba(107,33,217,0.12)" }}>
            <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: tab === id ? "rgba(255,255,255,0.7)" : "#7c6fa0", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
            <span className="flex items-center gap-1.5 mt-1" style={{ fontSize: 24, fontWeight: 900, color: tab === id ? "#fff" : "#160a2e" }}>
              <Star size={18} fill="#f59e0b" color="#f59e0b" />{xs && xs.length ? dec(a) : "–"}
            </span>
            <span style={{ fontSize: 12, color: tab === id ? "rgba(255,255,255,0.7)" : "#7c6fa0" }}>{!xs ? t("Loading…") : xs.length === 1 ? t("1 review") : t("{n} reviews", { n: xs.length })}</span>
          </button>
        ))}
      </div>
      {!list ? null : list.length === 0 ? (
        <p style={{ fontSize: 14, color: "#7c6fa0", textAlign: "center", padding: "18px 8px" }}>
          {tab === "host" ? t("No reviews as a host yet. They appear after your first dinner.") : t("No reviews as a guest yet. Hosts can rate you after the dinner.")}
        </p>
      ) : (
        <div className="rv-list">
          {list.map((r, i) => (
            <motion.div key={i} className="rv-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
              <div className="rv-item-head">
                {r.photo ? <img src={r.photo} alt="" /> : <span className="rv-initial">{r.author[0]}</span>}
                <b>{r.author}</b><span className="ml-auto"><Stars value={r.rating} /></span>
              </div>
              {r.comment && <p>{tMaybe(r.comment)}</p>}
              <small>{tMaybe(r.meal)} · {new Date(r.at).toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" })}</small>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FollowingList({ onBrowse }: { onBrowse: () => void }) {
  const store = useStore();
  if (store.following.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "18px 8px" }}>
        <p style={{ fontSize: 14, color: "#7c6fa0", lineHeight: 1.5 }}>{t("Enjoyed a dinner? Tap “Follow” on the host's meal page and their new tables show up first for you.")}</p>
        <button onClick={onBrowse} className="mt-3 px-4 py-2 rounded-full" style={{ background: "#ede8fb", color: "#6b21d9", fontWeight: 700, fontSize: 13.5 }}>{t("Find a table")}</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {store.following.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(107,33,217,0.06)" }}>
          <img src={p.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
          <span className="flex-1 min-w-0 truncate" style={{ fontSize: 14.5, fontWeight: 700, color: "#160a2e" }}>{p.name}</span>
          <button onClick={() => store.unfollow(p.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: "#f0ecfa", color: "#6b21d9", fontSize: 12.5, fontWeight: 700 }} aria-label={t("Unfollow {name}", { name: p.name })}>
            <UserMinus size={14} /> {t("Unfollow")}
          </button>
        </div>
      ))}
    </div>
  );
}
