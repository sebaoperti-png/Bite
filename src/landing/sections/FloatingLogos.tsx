// The page background: small Bite logos floating slowly behind everything, like crumbs on the tablecloth.
// The mouse pushes them away when it passes near (springy, then they drift on). One canvas, fixed behind the page,
// paused when the tab is hidden; still with reduced motion; fewer logos on small screens.
import { useEffect, useRef } from "react";

interface Crumb { x: number; y: number; vx: number; vy: number; dx: number; dy: number; s: number; a: number; r: number; vr: number }

export function FloatingLogos() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // the logo's "b" alone (stem, round belly, smile and bite cut out), drawn once into a small sprite
    const img = document.createElement("canvas");
    img.width = img.height = 256;
    const g = img.getContext("2d")!;
    g.scale(256 / 549, 256 / 549);
    g.fillStyle = "#7c3aed";
    g.beginPath(); g.roundRect(107, 30, 83, 330, 41.5); g.fill();
    g.beginPath(); g.arc(285, 340, 178, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = "destination-out";
    g.lineWidth = 26; g.lineCap = "round";
    g.beginPath(); g.moveTo(190, 405); g.quadraticCurveTo(262, 467, 334, 405); g.stroke();
    for (const [x, y, r] of [[405, 198, 20], [434, 228, 22], [456, 267, 22], [469, 311, 20]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    let w = 0, h = 0, dpr = 1, raf = 0;
    let crumbs: Crumb[] = [];
    const mouse = { x: -9999, y: -9999 };
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const seed = () => {
      const n = w < 700 ? 6 : w < 1200 ? 10 : 13;
      crumbs = Array.from({ length: n }, () => {
        const dx = rand(-0.18, 0.18), dy = rand(-0.14, 0.14);
        return { x: rand(0, w), y: rand(0, h), vx: dx, vy: dy, dx, dy, s: rand(26, w < 700 ? 44 : 62), a: rand(0.07, 0.14), r: rand(-0.5, 0.5), vr: rand(-0.002, 0.002) };
      });
    };
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr; cv.style.width = `${w}px`; cv.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!crumbs.length) seed();
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const c of crumbs) {
        ctx.save(); ctx.globalAlpha = c.a; ctx.translate(c.x, c.y); ctx.rotate(c.r);
        ctx.drawImage(img, -c.s / 2, -c.s / 2, c.s, c.s); ctx.restore();
      }
    };
    const step = () => {
      const R = 170;
      for (const c of crumbs) {
        const ddx = c.x - mouse.x, ddy = c.y - mouse.y, d = Math.hypot(ddx, ddy);
        if (d < R && d > 0.1) { const f = ((R - d) / R) * 1.6; c.vx += (ddx / d) * f; c.vy += (ddy / d) * f; c.vr += (ddx > 0 ? 1 : -1) * 0.002 * f; }
        // ease back to the slow drift
        c.vx += (c.dx - c.vx) * 0.04; c.vy += (c.dy - c.vy) * 0.04; c.vr *= 0.96;
        c.x += c.vx; c.y += c.vy; c.r += c.vr;
        const m = c.s;
        if (c.x < -m) c.x = w + m; else if (c.x > w + m) c.x = -m;
        if (c.y < -m) c.y = h + m; else if (c.y > h + m) c.y = -m;
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(step); };
    resize();
    draw();
    if (!reduce) raf = requestAnimationFrame(step);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove); document.removeEventListener("pointerleave", onLeave); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  return <canvas ref={ref} className="fl-canvas" aria-hidden />;
}
