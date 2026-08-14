import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Give your subject a name").max(80),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Pick a valid color")
    .default("#D68A2E"),
  icon: z.string().default("book"),
});

export type SubjectInput = z.infer<typeof subjectSchema>;
