import { GoogleGenAI } from "@google/genai";
import { aiFlashcardResponseSchema, type AiFlashcardResponse } from "@/lib/validations/flashcard";

// Gemini 3.1 Flash-Lite is Google's current low-cost, low-latency model with
// a free tier (no card required) as of writing — see
// https://ai.google.dev/gemini-api/docs/pricing for current free-tier limits.
// Google retires model IDs periodically (the 2.5 family was cut off from new
// API keys mid-2026); if this model starts 404ing, check that page and swap
// the string below.
const MODEL = "gemini-3.1-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      items: {
        type: "object",
        properties: {
          front: { type: "string" },
          back: { type: "string" },
          topic: { type: "string" },
        },
        required: ["front", "back", "topic"],
      },
    },
  },
  required: ["flashcards"],
};

/**
 * Generates front/back flashcard pairs from a block of study notes using
 * Google's free-tier Gemini API. Each card is tagged with a short `topic`
 * label, reusing the same grouping convention as AI-generated quizzes.
 */
export async function generateFlashcardsFromNotes(
  notes: string,
  cardCount: number
): Promise<AiFlashcardResponse> {
  const systemInstruction = `You are Estadi's flashcard writer. You turn a student's notes into
concise, effective spaced-repetition flashcards.

Rules:
- Produce exactly ${cardCount} flashcards.
- The "front" is a short question or prompt (a term, a question, a fill-in-the-blank) —
  not a full sentence copied verbatim from the notes.
- The "back" is the concise answer — a definition, fact, or explanation, ideally one
  or two sentences. Avoid padding it with unnecessary context.
- Prefer testing understanding and recall over exact wording.
- Cover different parts of the notes; don't cluster all cards on one sub-topic.
- Assign each card a short "topic" label (2-4 words) naming the sub-topic it covers,
  e.g. "Cell membrane transport" or "Newton's third law". Reuse the same label for
  cards on the same sub-topic so they can be grouped later.
- Respond with ONLY raw JSON matching this exact shape, no markdown fences, no prose.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate flashcards from these notes:\n\n${notes.slice(0, 12000)}`,
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

  const result = aiFlashcardResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new Error(`AI response didn't match the expected flashcard shape: ${result.error.message}`);
  }

  return result.data;
}
