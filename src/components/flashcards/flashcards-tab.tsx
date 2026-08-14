"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Flashcard, Material, Topic } from "@/lib/types/database.types";
import { createFlashcard, deleteFlashcard, generateFlashcards } from "@/app/actions/flashcards";

export function FlashcardsTab({
  subjectId,
  topics,
  materials,
  flashcards,
}: {
  subjectId: string;
  topics: Topic[];
  materials: Material[];
  flashcards: Flashcard[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [genMaterialId, setGenMaterialId] = useState(materials[0]?.id ?? "");
  const [cardCount, setCardCount] = useState(8);
  const [genError, setGenError] = useState<string | null>(null);
  const [genNotice, setGenNotice] = useState<string | null>(null);
  const [genPending, startGenTransition] = useTransition();

  const dueCount = flashcards.filter((f) => new Date(f.due_at) <= new Date()).length;

  function handleGenerate() {
    if (!genMaterialId) {
      setGenError("Add a note first — flashcards are generated from your notes.");
      return;
    }
    setGenError(null);
    setGenNotice(null);
    startGenTransition(async () => {
      const result = await generateFlashcards({
        subject_id: subjectId,
        material_id: genMaterialId,
        card_count: cardCount,
      });
      if (result?.error) {
        setGenError(result.error);
        return;
      }
      setGenNotice(`Added ${result.count} flashcards.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {materials.length > 0 && (
        <div className="notebook-page space-y-3 p-5">
          <p className="text-sm font-medium">Generate flashcards from your notes</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="label" htmlFor="gen-material">
                Note
              </label>
              <select
                id="gen-material"
                className="input"
                value={genMaterialId}
                onChange={(e) => setGenMaterialId(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="gen-count">
                Cards
              </label>
              <input
                id="gen-count"
                type="number"
                min={3}
                max={20}
                className="input w-20"
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
              />
            </div>
            <button onClick={handleGenerate} disabled={genPending} className="btn-primary">
              {genPending ? "Generating…" : "Generate flashcards"}
            </button>
          </div>
          {genError && <p className="text-sm text-rust">{genError}</p>}
          {genNotice && <p className="text-sm text-moss">{genNotice}</p>}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!open && (
          <button onClick={() => setOpen(true)} className="btn-secondary">
            + Add flashcard
          </button>
        )}
        <span className="text-sm text-ink/60">
          {dueCount} of {flashcards.length} due for review
        </span>
      </div>

      {open && (
        <form
          ref={formRef}
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await createFlashcard(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              formRef.current?.reset();
              setOpen(false);
            });
          }}
          className="notebook-page space-y-3 p-5"
        >
          <input type="hidden" name="subject_id" value={subjectId} />
          <div>
            <label className="label" htmlFor="front">
              Front (question / prompt)
            </label>
            <textarea id="front" name="front" required rows={2} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="back">
              Back (answer)
            </label>
            <textarea id="back" name="back" required rows={2} className="input" />
          </div>
          {topics.length > 0 && (
            <div>
              <label className="label" htmlFor="topic_id">
                Topic (optional)
              </label>
              <select id="topic_id" name="topic_id" className="input">
                <option value="">No topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {materials.length > 0 && (
            <div>
              <label className="label" htmlFor="material_id">
                Linked note (optional)
              </label>
              <select id="material_id" name="material_id" className="input">
                <option value="">None</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Saving…" : "Save flashcard"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {flashcards.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {flashcards.map((f) => (
            <FlashcardCard key={f.id} card={f} subjectId={subjectId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/60">No flashcards yet. Add one above.</p>
      )}
    </div>
  );
}

function FlashcardCard({ card, subjectId }: { card: Flashcard; subjectId: string }) {
  const [isPending, startTransition] = useTransition();
  const isDue = new Date(card.due_at) <= new Date();

  return (
    <div className="card p-4">
      <p className="text-sm font-medium">{card.front}</p>
      <p className="mt-1 text-sm text-ink/60">{card.back}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-xs ${isDue ? "text-rust" : "text-moss"}`}>
          {isDue ? "Due now" : `Due ${new Date(card.due_at).toLocaleDateString()}`}
        </span>
        <button
          onClick={() => {
            if (!confirm("Delete this flashcard?")) return;
            startTransition(async () => {
              await deleteFlashcard(card.id, subjectId);
            });
          }}
          disabled={isPending}
          className="text-xs text-ink/40 hover:text-rust"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
