import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useIsDesktop } from "../useIsDesktop";

/**
 * A bottom sheet on phones, a centred dialog on desktop.
 * The drag handle is drawn here, so callers only pass the content.
 * On desktop the dialog grows out of the point that was clicked and shrinks back into it
 * (transitions.dev "menu dropdown", origin-aware).
 */
const lastPointer = { x: -1, y: -1 };
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { lastPointer.x = e.clientX; lastPointer.y = e.clientY; }, true);
}

function DesktopDialog({ children, className }: { children: ReactNode; className: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  useLayoutEffect(() => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r || lastPointer.x < 0) return;
    const dx = lastPointer.x - (r.left + r.width / 2);
    const dy = lastPointer.y - (r.top + r.height / 2);
    setOrigin(`calc(50% + ${Math.round(dx)}px) calc(50% + ${Math.round(dy)}px)`);
  }, []);
  return (
    <div ref={wrap} className="absolute inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
      <motion.div
        role="dialog"
        aria-modal="true"
        className={`pointer-events-auto w-full max-w-[460px] rounded-3xl overflow-hidden flex flex-col ${className}`}
        style={{ background: "#fff", maxHeight: "85vh", boxShadow: "0 30px 80px rgba(22,10,46,0.35)", transformOrigin: origin }}
        initial={{ opacity: 0, scale: 0.82, filter: "blur(3px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
        exit={{ opacity: 0, scale: 0.9, filter: "blur(2px)", transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
export function Sheet({ open, onClose, children, className = "", mobileMaxHeight = "70%" }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  mobileMaxHeight?: string;
}) {
  const isDesktop = useIsDesktop();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: "rgba(22,10,46,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {isDesktop ? (
            <DesktopDialog className={className}>{children}</DesktopDialog>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              className={`absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden ${className}`}
              style={{ background: "#fff", maxHeight: mobileMaxHeight }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "#e0d8f5" }} />
              </div>
              {children}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
