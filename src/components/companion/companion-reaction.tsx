"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface ReactionTrigger {
  key: number;
  type: "correct" | "incorrect";
}

const SPARK_COLORS = ["#F0B865", "#7C5CC9", "#2E9C8F", "#D9735A"];

/**
 * A transient overlay on top of the Capybara — a burst of sparkles for a
 * correct answer, or a single soft encouraging pulse for a wrong one.
 * Deliberately never shows anything sad/disappointed: a wrong answer still
 * gets a warm reaction, just a calmer one.
 */
export function CompanionReaction({ trigger }: { trigger: ReactionTrigger | null }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {trigger?.type === "correct" &&
          Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <motion.span
                key={`${trigger.key}-${i}`}
                className="absolute left-1/2 top-1/3 h-2 w-2 rounded-full"
                style={{ backgroundColor: SPARK_COLORS[i % SPARK_COLORS.length] }}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: 0,
                  x: Math.cos(angle) * 44,
                  y: Math.sin(angle) * 44 - 24,
                  scale: 1,
                }}
                transition={{ duration: 0.75, ease: "easeOut" }}
              />
            );
          })}
        {trigger?.type === "incorrect" && (
          <motion.span
            key={trigger.key}
            className="absolute left-1/2 top-1/3 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber/50"
            initial={{ opacity: 0.6, scale: 0.4 }}
            animate={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
