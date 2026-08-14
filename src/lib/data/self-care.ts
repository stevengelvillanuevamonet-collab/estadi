export interface SelfCareActivity {
  id: string;
  title: string;
  category: string;
  description: string;
  minutes: number;
  /** Recommended when stress is at or above this level (0-100). */
  minStress: number;
  /** Recommended when mood is at or below this level (1-5). */
  maxMood: number;
}

export const SELF_CARE_LIBRARY: SelfCareActivity[] = [
  {
    id: "box-breathing",
    title: "Box breathing",
    category: "Breathing",
    description: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat for a few minutes to bring your heart rate down before you go back to studying.",
    minutes: 5,
    minStress: 50,
    maxMood: 5,
  },
  {
    id: "study-break-walk",
    title: "Step away for a walk",
    category: "Movement",
    description: "Leave your desk and walk for a few minutes, ideally outside. Physical distance from your notes helps reset focus.",
    minutes: 10,
    minStress: 40,
    maxMood: 5,
  },
  {
    id: "brain-dump",
    title: "Brain dump journaling",
    category: "Journaling",
    description: "Write down everything on your mind for 5 minutes without editing yourself. Getting it out of your head onto paper is often enough to quiet it.",
    minutes: 5,
    minStress: 0,
    maxMood: 2,
  },
  {
    id: "body-scan",
    title: "Body scan relaxation",
    category: "Mindfulness",
    description: "Sit or lie down and slowly bring attention to each part of your body, noticing and releasing tension as you go.",
    minutes: 8,
    minStress: 60,
    maxMood: 5,
  },
  {
    id: "gratitude-three",
    title: "Three good things",
    category: "Journaling",
    description: "Write down three things that went okay today, even small ones. A short, specific list works better than a vague one.",
    minutes: 3,
    minStress: 0,
    maxMood: 3,
  },
  {
    id: "pomodoro-reset",
    title: "Pomodoro reset",
    category: "Study habits",
    description: "Switch to 25-minute focused study blocks with 5-minute breaks. Shorter, structured sessions reduce the sense of an endless task.",
    minutes: 25,
    minStress: 30,
    maxMood: 5,
  },
  {
    id: "talk-to-someone",
    title: "Talk to someone",
    category: "Connection",
    description: "Message or call a friend, family member, or classmate — not necessarily about what's stressing you, just to connect.",
    minutes: 10,
    minStress: 55,
    maxMood: 2,
  },
  {
    id: "stretch-break",
    title: "5-minute stretch",
    category: "Movement",
    description: "A short stretch sequence for your neck, shoulders, and back undoes a lot of the tension that builds up from sitting and studying.",
    minutes: 5,
    minStress: 0,
    maxMood: 5,
  },
];

/**
 * Picks the most relevant self-care activities for a given mood/stress reading.
 * Higher stress and lower mood surface more intensive/targeted activities first;
 * a light default (stretch break) always appears so the list is never empty.
 */
export function recommendSelfCare(mood: number, stressLevel: number, limit = 3): SelfCareActivity[] {
  const scored = SELF_CARE_LIBRARY.map((activity) => {
    const stressMatch = stressLevel >= activity.minStress;
    const moodMatch = mood <= activity.maxMood;
    let score = 0;
    if (stressMatch) score += stressLevel - activity.minStress;
    if (moodMatch) score += (activity.maxMood - mood + 1) * 10;
    if (!stressMatch && !moodMatch) score = -1;
    return { activity, score };
  });

  const ranked = scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.activity);

  if (ranked.length === 0) {
    return SELF_CARE_LIBRARY.filter((a) => a.minStress === 0).slice(0, limit);
  }

  return ranked.slice(0, limit);
}
