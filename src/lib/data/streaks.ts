/**
 * Escalating daily streak bonus — the longer the streak, the bigger the
 * daily reward, which is what makes returning tomorrow feel worth more than
 * the raw points from any single quiz or flashcard.
 */
export function getStreakBonus(streakLength: number): number {
  if (streakLength >= 30) return 20;
  if (streakLength >= 14) return 12;
  if (streakLength >= 7) return 8;
  if (streakLength >= 3) return 5;
  return 2;
}

export interface StreakMilestone {
  days: number;
  label: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, label: "Bonus jumps to 5 pts/day" },
  { days: 7, label: "Bonus jumps to 8 pts/day" },
  { days: 14, label: "Bonus jumps to 12 pts/day" },
  { days: 30, label: "Bonus jumps to 20 pts/day" },
];

export function getNextMilestone(streakLength: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m.days > streakLength) ?? null;
}

/** Costs for functional (non-cosmetic) perks spent from the points balance. */
export const PERK_COSTS = {
  quizHint: 10,
  quizRetry: 15,
  streakSaver: 30,
} as const;
