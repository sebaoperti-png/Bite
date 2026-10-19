// Small motion pieces shared by the app, adapted from the transitions.dev skill (.claude/skills/transitions-dev):
// LikeHeart (23 like button), SpinningText (26 spinning counter) and SuccessCheck (10 success check).
// Styles in src/shared/motion.css (imported by the app and the landing).
import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

/** A heart that fills and pops, with a small spray of particles when it becomes "liked" */
export function LikeHeart({ liked, size = 15 }: { liked: boolean; size?: number }) {
  const [burst, setBurst] = useState(0);
  const prev = useRef(liked);
  useEffect(() => {
    if (liked && !prev.current) setBurst((b) => b + 1);
    prev.current = liked;
  }, [liked]);
  return (
    <span className="t-like" data-liked={liked}>
      <span className="t-like-icon"><Heart size={size} fill={liked ? "#e9345a" : "none"} color={liked ? "#e9345a" : "#160a2e"} strokeWidth={2} /></span>
      {burst > 0 && (
        <span className="t-like-particles is-on" key={burst} aria-hidden>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
            const d = 14 + Math.random() * 10;
            return <i key={i} style={{ ["--px" as string]: `${Math.cos(a) * d}px`, ["--py" as string]: `${Math.sin(a) * d}px`, ["--psize" as string]: 0.8 + Math.random() * 0.8, ["--pdelay" as string]: `${Math.random() * 60}ms` }} />;
          })}
        </span>
      )}
    </span>
  );
}

/** Text whose digits roll like an odometer whenever it changes (other characters stay put) */
export function SpinningText({ text, cell = 26 }: { text: string; cell?: number | string }) {
  const [round, setRound] = useState(0);
  const prev = useRef(text);
  useEffect(() => {
    if (text !== prev.current) { setRound((r) => r + 1); prev.current = text; }
  }, [text]);
  const chars = text.split("");
  return (
    <span className="t-reel" style={{ ["--reel-cell" as string]: typeof cell === "number" ? `${cell}px` : cell }} aria-label={text}>
      {chars.map((c, i) => {
        const fromRight = chars.length - i;
        if (!/\d/.test(c)) return <span key={`s${fromRight}`} className="t-reel-static" aria-hidden>{c === " " ? "\u00a0" : c}</span>; // a lone space would collapse in the flex row
        return <Reel key={`d${fromRight}`} digit={+c} round={round} col={fromRight} />;
      })}
    </span>
  );
}

function Reel({ digit, round, col }: { digit: number; round: number; col: number }) {
  // Three bands of 0-9: rest in the middle band, spin one full turn into the last band, then snap back silently
  const [pos, setPos] = useState(10 + digit);
  const [anim, setAnim] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setAnim(true);
    setPos(20 + digit);
    const id = window.setTimeout(() => { setAnim(false); setPos(10 + digit); }, 1000 + col * 70);
    return () => window.clearTimeout(id);
  }, [round, digit]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="t-reel-col" aria-hidden>
      <span className={`t-reel-strip ${anim ? "spinning" : ""}`} style={{ transform: `translateY(calc(var(--reel-cell) * ${-pos}))`, transitionDelay: `${(4 - Math.min(col, 4)) * 70}ms` }}>
        {Array.from({ length: 30 }, (_, i) => <span key={i} className="t-reel-digit">{i % 10}</span>)}
      </span>
    </span>
  );
}

/** A check that fades, rotates upright, bobs and draws itself */
export function SuccessCheck({ size = 72 }: { size?: number }) {
  const [state, setState] = useState<"out" | "in">("out");
  useEffect(() => { const id = requestAnimationFrame(() => setState("in")); return () => cancelAnimationFrame(id); }, []);
  return (
    <span className="t-success-check" data-state={state} aria-hidden>
      <svg viewBox="0 0 48 48" width={size} height={size} fill="none">
        <circle cx="24" cy="24" r="22" fill="#0a9c62" />
        <path d="M14 24.5l7 7 13-14" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** A surface that tilts in 3D toward the mouse with a soft glare (transitions.dev 19 card tilt).
    On touch screens (no hover) it plays a 3D "wave" with the glare sweeping across instead: once when it scrolls
    into view, and again on every tap — so phones get the same moment without blocking the page scroll. */
export function Tilt({ children, max = 7, className = "", style }: { children: React.ReactNode; max?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const touch = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
  const [waving, setWaving] = useState(false);

  useEffect(() => {
    if (!touch || !ref.current) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { playWave(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [touch]);

  // restart the CSS wave: off for a frame, then on again (the card itself is never re-created, it may hold a form)
  function playWave() {
    setWaving(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setWaving(true)));
  }

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || !ref.current || !card.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const el = ref.current;
    el.style.setProperty("--tilt-rx", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--tilt-ry", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--tilt-gx", `${x * 100}%`);
    el.style.setProperty("--tilt-gy", `${y * 100}%`);
    el.classList.add("is-hover");
    card.current.classList.add("is-tilting");
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-rx", "0deg");
    el.style.setProperty("--tilt-ry", "0deg");
    el.classList.remove("is-hover");
    card.current?.classList.remove("is-tilting");
  };
  return (
    <div ref={ref} className={`t-tilt ${className} ${waving ? "t-wave" : ""}`} style={{ ...style, ["--tilt-max" as string]: `${max * 1.4}deg` }}
      onPointerMove={move} onPointerLeave={leave}
      onPointerDown={(e) => { if (e.pointerType === "touch" && !(e.target as HTMLElement).closest("input, textarea, select, button, a, label")) playWave(); }}>
      <div ref={card} className="t-tilt-card">
        {children}
        <div className="t-tilt-glare" aria-hidden />
      </div>
    </div>
  );
}

/** Heading text that reveals word by word (blur → sharp, small rise) once it scrolls into view.
    Strings are split into words; elements such as <br/> or a coloured <span> stay whole and take their turn. */
export function RevealWords({ children, step = 45, delay = 0 }: { children: React.ReactNode; step?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  let i = 0;
  const parts: React.ReactNode[] = [];
  const walk = (node: React.ReactNode) => {
    if (node == null || node === false) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node === "string" || typeof node === "number") {
      String(node).split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { parts.push(w); return; }
        parts.push(<span key={`w${i}`} className="rw-w" style={{ ["--i" as string]: i++ }}>{w}</span>);
      });
      return;
    }
    if (typeof node === "object" && "type" in (node as React.ReactElement) && (node as React.ReactElement).type === "br") { parts.push(<br key={`b${i++}`} />); return; }
    parts.push(<span key={`e${i}`} className="rw-w" style={{ ["--i" as string]: i++ }}>{node}</span>);
  };
  walk(children);
  return <span ref={ref} className={`rw ${inView ? "in" : ""}`} style={{ ["--rw-step" as string]: `${step}ms`, ["--rw-delay" as string]: `${delay}ms` }}>{parts}</span>;
}

/** A text link's trailing arrow, split out so it can slide on hover (transitions.dev 24 learn-more hover).
    Use on an <a className="lm">: <a className="lm"><Arrowed text={t("Read more →")} /></a> */
export function Arrowed({ text }: { text: string }) {
  const m = text.match(/^(.*?)\s*→\s*$/);
  if (!m) return <>{text}</>;
  return <><span className="lm-text">{m[1]}</span> <span className="lm-arrow" aria-hidden>→</span></>;
}

/** Text that streams in word by word when `play` is true (transitions.dev 30 streaming text); static otherwise */
export function StreamText({ text, play, speed = 42 }: { text: string; play: boolean; speed?: number }) {
  const words = text.split(" ");
  const [n, setN] = useState(play ? 0 : words.length);
  useEffect(() => {
    if (!play) { setN(words.length); return; }
    setN(0);
    let i = 0;
    const id = window.setInterval(() => { i += 1; setN(i); if (i >= words.length) window.clearInterval(id); }, speed);
    return () => window.clearInterval(id);
  }, [text, play]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className={`st-word ${i < n ? "in" : ""}`}>{w}{i < words.length - 1 ? " " : ""}</span>
      ))}
    </>
  );
}
