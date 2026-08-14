"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Subject, Topic, Material, Flashcard, Quiz } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";
import { NotesTab } from "@/components/subjects/notes-tab";
import { FlashcardsTab } from "@/components/flashcards/flashcards-tab";
import { QuizzesTab } from "@/components/quizzes/quizzes-tab";

type QuizWithCount = Quiz & { quiz_questions: { count: number }[] };

const TABS = ["Notes", "Flashcards", "Quizzes"] as const;

export function SubjectHub({
  subject,
  topics,
  materials,
  flashcards,
  quizzes,
}: {
  subject: Subject;
  topics: Topic[];
  materials: Material[];
  flashcards: Flashcard[];
  quizzes: QuizWithCount[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Notes");

  return (
    <div className="mx-auto max-w-4xl animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{subject.name}</h1>
        </div>
        <Link href={`/subjects/${subject.id}/flashcards/study`} className="btn-primary">
          Study flashcards
        </Link>
      </div>

      <div className="flex gap-1 border-b border-margin/50">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "text-ink" : "text-ink/50 hover:text-ink/80"
            )}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="subject-tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-rust"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "Notes" && (
            <NotesTab subjectId={subject.id} topics={topics} materials={materials} />
          )}
          {tab === "Flashcards" && (
            <FlashcardsTab
              subjectId={subject.id}
              topics={topics}
              materials={materials}
              flashcards={flashcards}
            />
          )}
          {tab === "Quizzes" && (
            <QuizzesTab subjectId={subject.id} materials={materials} quizzes={quizzes} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
