"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { flashcardSchema, reviewGradeSchema, generateFlashcardsSchema } from "@/lib/validations/flashcard";
import { scheduleReview } from "@/lib/utils";
import { generateFlashcardsFromNotes } from "@/lib/ai/flashcard-generator";
import { recordDailyActivity, type StreakResult } from "@/app/actions/streaks";

export async function createFlashcard(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const topicIdRaw = formData.get("topic_id");
  const materialIdRaw = formData.get("material_id");
  const parsed = flashcardSchema.safeParse({
    subject_id: formData.get("subject_id"),
    material_id: materialIdRaw ? String(materialIdRaw) : null,
    topic_id: topicIdRaw ? String(topicIdRaw) : null,
    front: formData.get("front"),
    back: formData.get("back"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid flashcard." };
  }

  const { error } = await supabase
    .from("flashcards")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath(`/subjects/${parsed.data.subject_id}`);
  return { success: true };
}

export async function deleteFlashcard(flashcardId: string, subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("flashcards").delete().eq("id", flashcardId);
  if (error) return { error: error.message };

  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}

/**
 * Generates a batch of flashcards from a note's content using the free
 * Gemini API, creating/resolving a topic per card the same way AI quiz
 * generation does, so they feed into the same weak-topic tracking.
 */
export async function generateFlashcards(input: {
  subject_id: string;
  material_id: string;
  card_count?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = generateFlashcardsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("content")
    .eq("id", parsed.data.material_id)
    .single();
  if (materialError || !material) return { error: "Couldn't find that note." };
  if (!material.content || material.content.trim().length < 40) {
    return { error: "Add a bit more content to this note before generating flashcards from it." };
  }

  let generated;
  try {
    generated = await generateFlashcardsFromNotes(material.content, parsed.data.card_count);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Flashcard generation failed." };
  }

  const topicNames = Array.from(new Set(generated.flashcards.map((c) => c.topic)));
  const topicIdByName = new Map<string, string>();
  for (const name of topicNames) {
    const { data: topic } = await supabase
      .from("topics")
      .upsert(
        { subject_id: parsed.data.subject_id, user_id: user.id, name },
        { onConflict: "subject_id,name", ignoreDuplicates: false }
      )
      .select("id, name")
      .single();
    if (topic) topicIdByName.set(topic.name, topic.id);
  }

  const rows = generated.flashcards.map((c) => ({
    subject_id: parsed.data.subject_id,
    material_id: parsed.data.material_id,
    topic_id: topicIdByName.get(c.topic) ?? null,
    user_id: user.id,
    front: c.front,
    back: c.back,
  }));

  const { error: insertError } = await supabase.from("flashcards").insert(rows);
  if (insertError) return { error: insertError.message };

  revalidatePath(`/subjects/${parsed.data.subject_id}`);
  return { success: true, count: rows.length };
}

/**
 * Points awarded per review grade — rewards honest recall over just
 * clicking through cards. Blackout earns nothing since nothing was recalled.
 */
function pointsForGrade(grade: number): number {
  if (grade >= 5) return 6;
  if (grade >= 3) return 3;
  return 0;
}

/**
 * Records the outcome of reviewing a flashcard and reschedules its next
 * due date using a simplified SM-2 algorithm.
 */
export async function reviewFlashcard(flashcardId: string, subjectId: string, grade: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const gradeCheck = reviewGradeSchema.safeParse(grade);
  if (!gradeCheck.success) return { error: "Grade must be between 0 and 5." };

  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select("ease_factor, interval_days, repetitions")
    .eq("id", flashcardId)
    .single();
  if (fetchError || !card) return { error: fetchError?.message ?? "Flashcard not found." };

  const next = scheduleReview({
    grade: gradeCheck.data,
    easeFactor: card.ease_factor,
    intervalDays: card.interval_days,
    repetitions: card.repetitions,
  });

  const { error } = await supabase
    .from("flashcards")
    .update({
      ease_factor: next.easeFactor,
      interval_days: next.intervalDays,
      repetitions: next.repetitions,
      due_at: next.dueAt,
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("id", flashcardId);

  if (error) return { error: error.message };

  let pointsAwarded = 0;
  const amount = pointsForGrade(gradeCheck.data);
  if (amount > 0) {
    const { error: pointsError } = await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: amount,
      p_reason: "flashcard_review",
    });
    if (!pointsError) pointsAwarded = amount;
  }

  const streak: StreakResult | null = await recordDailyActivity(user.id);

  revalidatePath(`/subjects/${subjectId}/flashcards/study`);
  return { success: true, next, pointsAwarded, streak };
}
