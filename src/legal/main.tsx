import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import { LegalPage } from "./sections/LegalPage";
import "../shared/fonts.css";
import "./legal.css";

// Smooth-scroll to the section in the URL (#terms, #privacy, ...) and briefly highlight it.
function Legal() {
  useEffect(() => {
    const goto = (smooth: boolean) => {
      const id = (location.hash || "").slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
      el.style.transition = "background .25s";
      el.style.background = "rgba(155,74,255,0.06)";
      el.style.borderRadius = "14px";
      setTimeout(() => { el.style.background = "transparent"; }, 1100);
    };
    const t = setTimeout(() => goto(true), 120);
    const onHash = () => goto(true);
    window.addEventListener("hashchange", onHash);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", onHash); };
  }, []);
  return <LegalPage />;
}

createRoot(document.getElementById("root")!).render(<Legal />);
