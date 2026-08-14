"use client";

import { useRef, useState, useTransition } from "react";
import type { Material, Topic } from "@/lib/types/database.types";
import { createMaterial, deleteMaterial, getMaterialDownloadUrl } from "@/app/actions/materials";
import { formatDate } from "@/lib/utils";

export function NotesTab({
  subjectId,
  topics,
  materials,
}: {
  subjectId: string;
  topics: Topic[];
  materials: Material[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {!open ? (
        <button
          onClick={() => {
            setWarning(null);
            setOpen(true);
          }}
          className="btn-secondary"
        >
          + Add note
        </button>
      ) : (
        <form
          ref={formRef}
          action={(formData) => {
            setError(null);
            setWarning(null);
            startTransition(async () => {
              const result = await createMaterial(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              formRef.current?.reset();
              setOpen(false);
              if (result?.warning) setWarning(result.warning);
            });
          }}
          className="notebook-page space-y-3 p-5"
        >
          <input type="hidden" name="subject_id" value={subjectId} />
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input id="title" name="title" required className="input" placeholder="Chapter 4: Cell biology" />
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
          <div>
            <label className="label" htmlFor="content">
              Notes (optional if you attach a file below)
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              className="input font-mono text-sm"
              placeholder="Paste or type your notes here — this is what quizzes and flashcards get generated from."
            />
          </div>
          <div>
            <label className="label" htmlFor="file">
              Attach a file (optional)
            </label>
            <input id="file" name="file" type="file" accept=".pdf,.docx,.txt,.md" className="input" />
            <p className="mt-1 text-xs text-ink/50">
              PDF, DOCX, TXT, or MD — Estadi reads the text automatically and adds it to this
              note's content.
            </p>
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? "Saving…" : "Save note"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {warning && (
        <div className="card border-amber/40 bg-amber/10 p-3 text-sm text-amber-dark">
          {warning}
        </div>
      )}

      {materials.length > 0 ? (
        <div className="space-y-3">
          {materials.map((m) => (
            <NoteCard key={m.id} material={m} subjectId={subjectId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/60">No notes yet. Add your first one above.</p>
      )}
    </div>
  );
}

function NoteCard({ material, subjectId }: { material: Material; subjectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleDownload() {
    if (!material.file_path) return;
    const result = await getMaterialDownloadUrl(material.file_path);
    if (result.url) window.open(result.url, "_blank");
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button onClick={() => setExpanded((v) => !v)} className="text-left">
            <h3 className="font-medium">{material.title}</h3>
          </button>
          <p className="text-xs text-ink/50">{formatDate(material.created_at)}</p>
          {expanded && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/80">{material.content}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {material.file_path && (
            <button onClick={handleDownload} className="text-sm text-rust underline underline-offset-2">
              File
            </button>
          )}
          <button
            onClick={() => {
              if (!confirm("Delete this note?")) return;
              startTransition(async () => {
                await deleteMaterial(material.id, subjectId);
              });
            }}
            disabled={isPending}
            className="text-sm text-ink/40 hover:text-rust"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
