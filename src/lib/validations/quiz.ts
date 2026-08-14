import { z } from "zod";

export const generateQuizSchema = z.object({
  subject_id: z.string().uuid(),
  material_id: z.string().uuid(),
  question_count: z.number().int().min(3).max(30).default(6),
});

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;

// Shape we require back from the AI provider
export const aiQuizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  topic: z.string().min(1),
});

export const aiQuizResponseSchema = z.object({
  questions: z.array(aiQuizQuestionSchema).min(1),
});

export type AiQuizResponse = z.infer<typeof aiQuizResponseSchema>;

export const submitQuizAnswerSchema = z.object({
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_index: z.number().int().min(0).max(3),
});
