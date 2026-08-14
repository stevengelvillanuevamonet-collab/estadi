import { z } from "zod";

export const moodEntrySchema = z.object({
  mood: z.number().int().min(1).max(5),
  stress_level: z.number().int().min(0).max(100),
  note: z.string().trim().max(4000).optional().nullable(),
});

export type MoodEntryInput = z.infer<typeof moodEntrySchema>;

export const MOOD_LABELS: Record<number, string> = {
  1: "Awful",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};

export const MOOD_EMOJI: Record<number, string> = {
  1: "😞",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😄",
};
