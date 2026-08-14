import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    label: "01",
    title: "Notes, organized by subject",
    body: "Drop in typed notes or upload files. Everything lives under the subject it belongs to.",
  },
  {
    label: "02",
    title: "Flashcards that resurface on time",
    body: "A spaced-repetition schedule brings each card back right before you'd forget it.",
  },
  {
    label: "03",
    title: "Quizzes generated from your own notes",
    body: "Estadi reads what you wrote and builds a multiple-choice quiz to test it.",
  },
  {
    label: "04",
    title: "Weak topics, named specifically",
    body: "Every quiz answer rolls up into per-topic accuracy, so you know exactly what to restudy.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6">
        <span className="font-display text-xl font-semibold">Estadi</span>
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center animate-fade-in-up">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-rust">
          for students who'd rather study smart
        </p>
        <h1 className="text-balance font-display text-5xl font-semibold leading-tight sm:text-6xl">
          Turn your notes into the study session you actually need.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-ink/70">
          Upload your materials, Estadi organizes them, drills you with flashcards
          and AI-generated quizzes, and tells you which topics are still shaky.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">
            Create your first subject
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={f.label}
              className="notebook-page animate-fade-in-up p-6"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-mono text-xs text-rust">{f.label}</span>
              <h2 className="mt-1 font-display text-xl font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-ink/70">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
