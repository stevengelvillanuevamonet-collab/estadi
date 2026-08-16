import { RANKS } from "@/lib/data/rewards";

export type AccessorySlot = "face" | "head" | "neck" | "seat" | "outfit";

export interface Accessory {
  id: string;
  slot: AccessorySlot;
  name: string;
  description: string;
  cost: number;
  tier: "common" | "uncommon" | "rare";
}

export const ACCESSORIES: Accessory[] = [
  {
    id: "reading_glasses",
    slot: "face",
    name: "Reading glasses",
    description: "For serious study sessions.",
    cost: 250,
    tier: "common",
  },
  {
    id: "scarf",
    slot: "neck",
    name: "Cozy scarf",
    description: "Warm and a little smug about it.",
    cost: 300,
    tier: "common",
  },
  {
    id: "graduation_cap",
    slot: "head",
    name: "Graduation cap",
    description: "Premature, but confident.",
    cost: 550,
    tier: "uncommon",
  },
  {
    id: "book_throne",
    slot: "seat",
    name: "Book-stack throne",
    description: "A permanent, well-earned seat.",
    cost: 650,
    tier: "uncommon",
  },
  {
    id: "seasonal_outfit",
    slot: "outfit",
    name: "Seasonal outfit",
    description: "A rotating special look.",
    cost: 1000,
    tier: "rare",
  },
];

export function getAccessory(id: string): Accessory | undefined {
  return ACCESSORIES.find((a) => a.id === id);
}

/** Evolution stage index (0-7), directly tied to the existing rank ladder. */
export function getEvolutionStage(lifetimePoints: number): number {
  let stage = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (lifetimePoints >= RANKS[i].threshold) stage = i;
  }
  return stage;
}

/** Only true at the top rank — earned, never purchasable at any price. */
export function hasBirdCompanion(lifetimePoints: number): boolean {
  return getEvolutionStage(lifetimePoints) === RANKS.length - 1;
}

export type CompanionMood = "content" | "resting" | "watchful" | "fresh_start";

/**
 * Deliberately has no "sad" or guilt state. A capybara is unbothered — the
 * mood range only spans calm-to-content, never distressed, regardless of
 * how long it's been.
 */
export function getCompanionMood(lastActiveDate: string | null): CompanionMood {
  if (!lastActiveDate) return "fresh_start";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastActiveDate + "T00:00:00");
  const daysSince = Math.round((today.getTime() - last.getTime()) / 86_400_000);

  if (daysSince <= 0) return "content";
  if (daysSince === 1) return "resting";
  return "watchful";
}

export const MOOD_LINES: Record<CompanionMood, (streak: number) => string> = {
  content: (streak) => (streak > 0 ? `Dozing happily. Day ${streak} streak.` : "Dozing happily."),
  resting: () => "Just chilling. No rush.",
  watchful: () => "Perked up — it's been a couple days.",
  fresh_start: () => "Settling in. Ready whenever you are.",
};
