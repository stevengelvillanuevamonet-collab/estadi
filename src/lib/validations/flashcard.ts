import { z } from "zod";

export const flashcardSchema = z.object({
  subject_id: z.string().uuid(),
  material_id: z.string().uuid().nullable().optional(),
  topic_id: z.string().uuid().nullable().optional(),
  front: z.string().trim().min(1, "The front needs a prompt").max(1000),
  back: z.string().trim().min(1, "The back needs an answer").max(1000),
});

export type FlashcardInput = z.infer<typeof flashcardSchema>;

// 0 = "Blackout", 5 = "Perfect recall" — a simplified SM-2 grading scale
export const reviewGradeSchema = z.number().int().min(0).max(5);

export const generateFlashcardsSchema = z.object({
  subject_id: z.string().uuid(),
  material_id: z.string().uuid(),
  card_count: z.number().int().min(3).max(20).default(8),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

export const aiFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  topic: z.string().min(1),
});

export const aiFlashcardResponseSchema = z.object({
  flashcards: z.array(aiFlashcardSchema).min(1),
});

export type AiFlashcardResponse = z.infer<typeof aiFlashcardResponseSchema>;
