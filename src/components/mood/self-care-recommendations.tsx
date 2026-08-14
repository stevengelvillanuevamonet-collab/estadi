import { recommendSelfCare } from "@/lib/data/self-care";

export function SelfCareRecommendations({
  mood,
  stressLevel,
}: {
  mood: number;
  stressLevel: number;
}) {
  const activities = recommendSelfCare(mood, stressLevel);

  return (
    <div className="space-y-3">
      {activities.map((a) => (
        <div key={a.id} className="card flex items-start justify-between gap-4 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-rust">{a.category}</p>
            <h3 className="mt-0.5 font-medium">{a.title}</h3>
            <p className="mt-1 text-sm text-ink/70">{a.description}</p>
          </div>
          <span className="shrink-0 font-mono text-xs text-ink/50">{a.minutes} min</span>
        </div>
      ))}
    </div>
  );
}
