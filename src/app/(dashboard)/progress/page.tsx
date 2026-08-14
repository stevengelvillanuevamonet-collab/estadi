import { createClient } from "@/lib/supabase/server";
import type { TopicMastery } from "@/lib/types/database.types";
import { TopicMasteryChart } from "@/components/progress/topic-mastery-chart";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("id, score, total, completed_at")
    .eq("user_id", user!.id)
    .not("completed_at", "is", null);

  const { data: answers } = await supabase
    .from("quiz_answers")
    .select("is_correct, topic_id, topics(id, name, subject_id)")
    .not("topic_id", "is", null);

  const masteryByTopic = new Map<string, TopicMastery>();
  for (const a of (answers ?? []) as unknown as Array<{
    is_correct: boolean;
    topic_id: string | null;
    topics: { id: string; name: string; subject_id: string } | null;
  }>) {
    const topic = a.topics;
    if (!topic) continue;
    const existing = masteryByTopic.get(topic.id) ?? {
      topic_id: topic.id,
      topic_name: topic.name,
      subject_id: topic.subject_id,
      correct: 0,
      total: 0,
      accuracy: 0,
    };
    existing.total += 1;
    if (a.is_correct) existing.correct += 1;
    masteryByTopic.set(topic.id, existing);
  }

  const mastery = Array.from(masteryByTopic.values())
    .map((m) => ({ ...m, accuracy: Math.round((m.correct / m.total) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakTopics = mastery.filter((m) => m.total >= 2 && m.accuracy < 70).slice(0, 5);

  const totalAttempts = attempts?.length ?? 0;
  const avgScore = totalAttempts
    ? Math.round(
        ((attempts ?? []).reduce((sum, a) => sum + (a.total ? a.score / a.total : 0), 0) /
          totalAttempts) *
          100
      )
    : null;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in-up space-y-8">
      <h1 className="font-display text-3xl font-semibold">Your progress</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="label">Quizzes completed</p>
          <p className="mt-1 font-mono text-3xl font-semibold">{totalAttempts}</p>
        </div>
        <div className="card p-5">
          <p className="label">Average score</p>
          <p className="mt-1 font-mono text-3xl font-semibold">
            {avgScore !== null ? `${avgScore}%` : "—"}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold">Weak topics</h2>
        {weakTopics.length > 0 ? (
          <div className="space-y-2">
            {weakTopics.map((t) => (
              <div key={t.topic_id} className="card flex items-center justify-between p-4">
                <span className="font-medium">{t.topic_name}</span>
                <span className="font-mono text-sm text-rust">
                  {t.accuracy}% ({t.correct}/{t.total})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/60">
            Take a few quizzes and Estadi will flag topics under 70% accuracy here.
          </p>
        )}
      </section>

      {mastery.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">All topics</h2>
          <TopicMasteryChart data={mastery} />
        </section>
      )}
    </div>
  );
}
