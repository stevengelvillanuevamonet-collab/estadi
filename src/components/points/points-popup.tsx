"use client";

import { AnimatePresence, motion } from "framer-motion";

export function PointsPopup({ popup }: { popup: { key: number; amount: number } | null }) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10">
      <AnimatePresence>
        {popup && (
          <motion.span
            key={popup.key}
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: 1, y: -18, scale: 1 }}
            exit={{ opacity: 0, y: -34 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="rounded-full bg-amber px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
          >
            +{popup.amount} pts
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
