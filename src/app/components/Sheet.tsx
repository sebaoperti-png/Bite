import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useIsDesktop } from "../useIsDesktop";

/**
 * A bottom sheet on phones, a centred dialog on desktop.
 * The drag handle is drawn here, so callers only pass the content.
 */
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
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <motion.div
                role="dialog"
                aria-modal="true"
                className={`pointer-events-auto w-full max-w-[460px] rounded-3xl overflow-hidden flex flex-col ${className}`}
                style={{ background: "#fff", maxHeight: "85vh", boxShadow: "0 30px 80px rgba(22,10,46,0.35)" }}
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              >
                {children}
              </motion.div>
            </div>
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
