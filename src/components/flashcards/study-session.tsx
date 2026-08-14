"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Flame } from "lucide-react";
import type { Flashcard } from "@/lib/types/database.types";
import { reviewFlashcard } from "@/app/actions/flashcards";
import type { StreakResult } from "@/app/actions/streaks";
import { cn } from "@/lib/utils";
import { PointsPopup } from "@/components/points/points-popup";

const GRADES = [
  { grade: 1, label: "Blackout", color: "bg-rust/10 text-rust" },
  { grade: 3, label: "Hard", color: "bg-amber/20 text-amber-dark" },
  { grade: 5, label: "Easy", color: "bg-moss/15 text-moss" },
];

export function StudySession({ subjectId, cards }: { subjectId: string; cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [pointsPopup, setPointsPopup] = useState<{ key: number; amount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streakNotice, setStreakNotice] = useState<StreakResult | null>(null);

  const card = cards[index];

  async function handleGrade(grade: number) {
    if (!card || submitting) return;
    setSubmitting(true);
    const result = await reviewFlashcard(card.id, subjectId, grade);
    setSubmitting(false);
    setReviewedCount((c) => c + 1);
    const amount = result?.pointsAwarded ?? 0;
    if (amount > 0) {
      setSessionPoints((p) => p + amount);
      setPointsPopup({ key: Date.now(), amount });
      setTimeout(() => setPointsPopup(null), 900);
    }
    if (result?.streak?.isNewDay) setStreakNotice(result.streak);
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  if (cards.length === 0) {
    return (
      <div className="notebook-page animate-scale-in p-8 text-center">
        <p className="font-medium">Nothing due right now.</p>
        <p className="mt-1 text-sm text-ink/60">
          Add more flashcards or come back once today's cards are due.
        </p>
        <Link href={`/subjects/${subjectId}`} className="btn-secondary mt-4 inline-flex">
          Back to subject
        </Link>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="notebook-page animate-scale-in p-8 text-center">
        <p className="font-medium">Nice work — you reviewed {reviewedCount} cards.</p>
        {sessionPoints > 0 && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-amber-dark">
            <Sparkles size={14} /> +{sessionPoints} points earned
          </p>
        )}
        {streakNotice && (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-rust">
            <Flame size={14} />
            {streakNotice.streakSaved
              ? `Streak saver used — day ${streakNotice.currentStreak} continues`
              : `Day ${streakNotice.currentStreak} streak · +${streakNotice.bonusAwarded} bonus`}
          </p>
        )}
        <Link href={`/subjects/${subjectId}`} className="btn-primary mt-4 inline-flex">
          Back to subject
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/50">
          Card {index + 1} of {cards.length}
        </p>
        {sessionPoints > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium text-amber-dark">
            <Sparkles size={14} /> {sessionPoints}
          </span>
        )}
      </div>

      <div className="relative" style={{ perspective: 1200 }}>
        <PointsPopup popup={pointsPopup} />
        <motion.div
          key={card.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0, rotateY: flipped ? 180 : 0 }}
          transition={{ rotateY: { duration: 0.45, ease: "easeInOut" }, opacity: { duration: 0.2 }, x: { duration: 0.2 } }}
          onClick={() => setFlipped((v) => !v)}
          className="relative min-h-[220px] w-full cursor-pointer select-none"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="notebook-page absolute inset-0 flex items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-lg">{card.front}</p>
          </div>
          <div
            className="notebook-page absolute inset-0 flex items-center justify-center bg-parchment/40 p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-lg font-medium">{card.back}</p>
          </div>
        </motion.div>
      </div>

      <p className="text-center text-xs text-ink/40">Tap the card to flip it</p>

      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-3 gap-2"
          >
            {GRADES.map((g) => (
              <motion.button
                key={g.grade}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleGrade(g.grade)}
                disabled={submitting}
                className={cn("rounded-lg px-3 py-3 text-sm font-medium transition-colors", g.color)}
              >
                {g.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
