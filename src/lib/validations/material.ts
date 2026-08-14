import { z } from "zod";

export const materialSchema = z.object({
  subject_id: z.string().uuid(),
  topic_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1, "Give this note a title").max(150),
  // Empty is allowed here — a file upload can supply the content instead.
  // The server action checks that *some* content ends up present.
  content: z.string().trim().max(50_000).optional().default(""),
});

export type MaterialInput = z.infer<typeof materialSchema>;
