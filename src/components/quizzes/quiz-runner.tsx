"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Zap, RotateCcw, Flame } from "lucide-react";
import type { Quiz, QuizQuestion } from "@/lib/types/database.types";
import {
  startQuizAttempt,
  submitQuizAnswer,
  completeQuizAttempt,
  useQuizHint,
  retryQuizQuestion,
} from "@/app/actions/quizzes";
import type { StreakResult } from "@/app/actions/streaks";
import { PERK_COSTS } from "@/lib/data/streaks";
import { cn } from "@/lib/utils";
import { PointsPopup } from "@/components/points/points-popup";
import { Capybara } from "@/components/companion/capybara";
import { CompanionReaction, type ReactionTrigger } from "@/components/companion/companion-reaction";
import { getEvolutionStage, getCompanionMood, hasBirdCompanion } from "@/lib/data/companion";

export interface CompanionState {
  lifetimePoints: number;
  lastActiveDate: string | null;
  currentStreak: number;
  equippedAccessories: Record<string, string>;
}

export function QuizRunner({
  subjectId,
  quiz,
  questions,
  companion,
}: {
  subjectId: string;
  quiz: Quiz;
  questions: QuizQuestion[];
  companion: CompanionState;
}) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [pointsPopup, setPointsPopup] = useState<{ key: number; amount: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [starting, setStarting] = useState(true);
  const [streakNotice, setStreakNotice] = useState<StreakResult | null>(null);
  const [reaction, setReaction] = useState<ReactionTrigger | null>(null);

  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [usedHint, setUsedHint] = useState(false);
  const [usedRetry, setUsedRetry] = useState(false);
  const [perkPending, setPerkPending] = useState(false);
  const [perkError, setPerkError] = useState<string | null>(null);

  const stage = getEvolutionStage(companion.lifetimePoints);
  const mood = getCompanionMood(companion.lastActiveDate);
  const bird = hasBirdCompanion(companion.lifetimePoints);

  useEffect(() => {
    startQuizAttempt(quiz.id).then((res) => {
      if (res.success && res.attemptId) setAttemptId(res.attemptId);
      setStarting(false);
    });
  }, [quiz.id]);

  // Reset per-question perk state whenever we move to a new question.
  useEffect(() => {
    setHiddenOptions([]);
    setUsedHint(false);
    setUsedRetry(false);
    setPerkError(null);
  }, [index]);

  const question = questions[index];

  async function handleAnswer(optionIndex: number) {
    if (!attemptId || revealed) return;
    setSelected(optionIndex);
    setRevealed(true);
    const result = await submitQuizAnswer({
      attempt_id: attemptId,
      question_id: question.id,
      selected_index: optionIndex,
    });
    setReaction({ key: Date.now(), type: result.isCorrect ? "correct" : "incorrect" });
    if (result.isCorrect) {
      setScore((s) => s + 1);
      const amount = result.pointsAwarded ?? 0;
      if (amount > 0) {
        setSessionPoints((p) => p + amount);
        setPointsPopup({ key: Date.now(), amount });
        setTimeout(() => setPointsPopup(null), 900);
      }
    }
    if (result.streak?.isNewDay) setStreakNotice(result.streak);
  }

  async function handleHint() {
    if (usedHint || revealed || perkPending) return;
    setPerkPending(true);
    setPerkError(null);
    const result = await useQuizHint();
    setPerkPending(false);
    if (result?.error) {
      setPerkError(result.error);
      return;
    }
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correct_index);
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
    setUsedHint(true);
  }

  async function handleRetry() {
    if (!attemptId || usedRetry || perkPending) return;
    setPerkPending(true);
    setPerkError(null);
    const result = await retryQuizQuestion({ attempt_id: attemptId, question_id: question.id });
    setPerkPending(false);
    if (result?.error) {
      setPerkError(result.error);
      return;
    }
    setUsedRetry(true);
    setSelected(null);
    setRevealed(false);
  }

  async function handleNext() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setReaction(null);
      return;
    }
    if (attemptId) await completeQuizAttempt(attemptId, subjectId);
    setFinished(true);
  }

  if (starting) return <p className="text-sm text-ink/60">Starting quiz…</p>;

  if (questions.length === 0) {
    return (
      <div className="notebook-page animate-scale-in p-8 text-center">
        <p>This quiz has no questions yet.</p>
      </div>
    );
  }

  if (finished) {
    const scoreRatio = questions.length > 0 ? score / questions.length : 0;
    const finishedMood = scoreRatio >= 0.8 ? "content" : mood;
    return (
      <div className="notebook-page animate-scale-in p-8 text-center">
        <div className="mx-auto w-fit">
          <Capybara stage={stage} mood={finishedMood} equipped={companion.equippedAccessories} hasBird={bird} size={110} />
        </div>
        <h1 className="font-display text-2xl font-semibold">Quiz complete</h1>
        <p className="mt-2 font-mono text-3xl font-semibold text-rust">
          {score}/{questions.length}
        </p>
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
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/subjects/${subjectId}`} className="btn-secondary">
            Back to subject
          </Link>
          <Link href="/progress" className="btn-primary">
            See weak topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">{quiz.title}</h1>
        <div className="flex items-center gap-3 text-sm text-ink/50">
          {sessionPoints > 0 && (
            <span className="flex items-center gap-1 font-medium text-amber-dark">
              <Sparkles size={14} /> {sessionPoints}
            </span>
          )}
          <span>
            {index + 1} / {questions.length}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="notebook-page relative p-6"
        >
          <PointsPopup popup={pointsPopup} />

          <div className="absolute -top-4 left-4 z-10">
            <div className="relative">
              <Capybara
                stage={stage}
                mood={mood}
                equipped={companion.equippedAccessories}
                hasBird={bird}
                size={52}
              />
              <CompanionReaction trigger={reaction} />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 pl-16 pr-16">
            <p className="font-medium">{question.question}</p>
          </div>

          {!revealed && (
            <button
              onClick={handleHint}
              disabled={usedHint || perkPending}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 text-xs font-medium text-amber-dark transition-colors hover:bg-amber/20 disabled:opacity-40"
            >
              <Zap size={12} /> 50/50 hint ({PERK_COSTS.quizHint} pts)
            </button>
          )}

          <div className="mt-4 space-y-2">
            {question.options.map((option, i) => {
              const isCorrectOption = i === question.correct_index;
              const isSelected = i === selected;
              const isHidden = hiddenOptions.includes(i);
              if (isHidden) {
                return (
                  <div
                    key={i}
                    className="w-full rounded-lg border border-margin/30 px-4 py-3 text-left text-sm text-ink/30 line-through"
                  >
                    {option}
                  </div>
                );
              }
              return (
                <motion.button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={revealed}
                  whileTap={!revealed ? { scale: 0.98 } : undefined}
                  animate={revealed && isCorrectOption ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    !revealed && "border-margin hover:border-rust/60 hover:bg-parchment",
                    revealed && isCorrectOption && "border-moss bg-moss/10 text-moss",
                    revealed && isSelected && !isCorrectOption && "border-rust bg-rust/10 text-rust",
                    revealed && !isSelected && !isCorrectOption && "border-margin/50 opacity-60"
                  )}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {revealed && question.explanation && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-ink/70"
            >
              {question.explanation}
            </motion.p>
          )}

          {revealed && selected !== question.correct_index && !usedRetry && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleRetry}
              disabled={perkPending}
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-moss/40 bg-moss/10 px-2.5 py-1 text-xs font-medium text-moss transition-colors hover:bg-moss/20 disabled:opacity-40"
            >
              <RotateCcw size={12} /> Retry this question ({PERK_COSTS.quizRetry} pts)
            </motion.button>
          )}

          {perkError && <p className="mt-2 text-xs text-rust">{perkError}</p>}
        </motion.div>
      </AnimatePresence>

      {revealed && (
        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNext}
          className="btn-primary"
        >
          {index + 1 < questions.length ? "Next question" : "Finish quiz"}
        </motion.button>
      )}
    </div>
  );
}
