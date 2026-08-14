"use client";

import { useRef, useState, useTransition } from "react";
import { createSubject } from "@/app/actions/subjects";

const SWATCHES = ["#D68A2E", "#4B6B53", "#B5533C", "#3A5AA0", "#8A5FB0"];

export function NewSubjectForm() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(SWATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary">
        + New subject
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await createSubject(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          formRef.current?.reset();
          setOpen(false);
        });
      }}
      className="card flex flex-wrap items-center gap-2 p-2"
    >
      <input
        name="name"
        placeholder="Subject name"
        required
        autoFocus
        className="input w-full sm:w-40"
      />
      <input type="hidden" name="color" value={color} />
      <div className="flex gap-1">
        {SWATCHES.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            className="h-6 w-6 rounded-full ring-offset-2"
            style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none" }}
            aria-label={`Choose color ${c}`}
          />
        ))}
      </div>
      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Adding…" : "Add"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50">
        Cancel
      </button>
      {error && <p className="text-sm text-rust">{error}</p>}
    </form>
  );
}
