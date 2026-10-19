// Phones, Home: a round "+" above the bottom bar that morphs into a small menu of the three ways to host
// (transitions.dev "plus to menu morph"). Picking one opens the hosting flow with that type already chosen.
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Utensils, ChefHat, ShoppingBag } from "lucide-react";
import { t } from "../../shared/i18n";

const EASE = [0.22, 1, 0.36, 1] as const;
const ITEMS = [
  { id: "eat-together", label: "Host a dinner", sub: "Neighbours at your table", Icon: Utensils },
  { id: "cook-together", label: "Cook together", sub: "A class in your kitchen", Icon: ChefHat },
  { id: "pickup", label: "Offer a pick-up", sub: "Extra portions to take home", Icon: ShoppingBag },
];

export function PlusMenu({ onHost }: { onHost: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (id: string) => {
    try { sessionStorage.setItem("bite_host_service", id); } catch { /* ignore */ }
    setOpen(false);
    onHost();
  };

  return (
    <>
      <AnimatePresence>{open && <motion.div className="pm-scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
      <motion.div
        className="pm"
        layout
        initial={false}
        animate={{ borderRadius: open ? 24 : 999 }}
        transition={{ duration: 0.38, ease: EASE }}
        style={{ width: open ? 250 : 56, height: open ? "auto" : 56 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div key="menu" className="pm-menu" initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)", transition: { delay: 0.12, duration: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <p className="pm-title">{t("Open your kitchen")}</p>
              {ITEMS.map(({ id, label, sub, Icon }, i) => (
                <motion.button key={id} className="pm-item" onClick={() => pick(id)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.16 + i * 0.05 } }}>
                  <span className="pm-icon"><Icon size={16} strokeWidth={2.2} /></span>
                  <span><b>{t(label)}</b><em>{t(sub)}</em></span>
                </motion.button>
              ))}
              <button className="pm-close" onClick={() => setOpen(false)} aria-label={t("Close")}><Plus size={18} style={{ rotate: "45deg" }} /></button>
            </motion.div>
          ) : (
            <motion.button key="plus" className="pm-plus" onClick={() => setOpen(true)} aria-label={t("Start hosting")} aria-expanded={false} initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Plus size={24} strokeWidth={2.6} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
