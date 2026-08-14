import { GoogleGenAI } from "@google/genai";
import { aiQuizResponseSchema, type AiQuizResponse } from "@/lib/validations/quiz";

// Gemini 3.5 Flash-Lite is on Google's free tier (no card required) — see
// https://ai.google.dev/gemini-api/docs/pricing for current free-tier limits.
// Swap the model string below if Google renames/retires it later.
const MODEL = "gemini-3.5-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4,
          },
          correct_index: { type: "integer" },
          explanation: { type: "string" },
          topic: { type: "string" },
        },
        required: ["question", "options", "correct_index", "explanation", "topic"],
      },
    },
  },
  required: ["questions"],
};

/**
 * Generates multiple-choice quiz questions from a block of study notes using
 * Google's free-tier Gemini API. Each question is tagged with a short `topic`
 * label so answers can later be rolled up into per-topic accuracy for
 * weak-topic tracking.
 */
export async function generateQuizFromNotes(
  notes: string,
  questionCount: number
): Promise<AiQuizResponse> {
  const systemInstruction = `You are Estadi's quiz writer. You turn a student's notes into a
multiple-choice quiz that tests real understanding, not just recall of exact wording.

Rules:
- Produce exactly ${questionCount} questions.
- Each question has exactly 4 options with exactly one correct answer.
- Vary difficulty and cover different parts of the notes.
- Assign each question a short "topic" label (2-4 words) naming the sub-topic it
  tests, e.g. "Cell membrane transport" or "Newton's third law". Reuse the same
  label for questions on the same sub-topic so results can be grouped.
- Write a one-sentence explanation for why the correct answer is correct.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate the quiz from these notes:\n\n${notes.slice(0, 12000)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.6,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The free AI quota may be exhausted for now — try again in a minute.");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error("Couldn't parse the AI response as JSON");
  }

  const result = aiQuizResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(`AI response didn't match the expected quiz shape: ${result.error.message}`);
  }

  return result.data;
}
