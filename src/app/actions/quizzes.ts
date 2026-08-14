"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateQuizSchema, submitQuizAnswerSchema } from "@/lib/validations/quiz";
import { generateQuizFromNotes } from "@/lib/ai/quiz-generator";
import { recordDailyActivity, type StreakResult } from "@/app/actions/streaks";
import { PERK_COSTS } from "@/lib/data/streaks";

export async function generateQuiz(input: {
  subject_id: string;
  material_id: string;
  question_count?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = generateQuizSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("title, content")
    .eq("id", parsed.data.material_id)
    .single();
  if (materialError || !material) return { error: "Couldn't find that note." };
  if (!material.content || material.content.trim().length < 40) {
    return { error: "Add a bit more content to this note before generating a quiz from it." };
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      subject_id: parsed.data.subject_id,
      material_id: parsed.data.material_id,
      user_id: user.id,
      title: `Quiz: ${material.title}`,
      status: "generating",
    })
    .select()
    .single();
  if (quizError || !quiz) return { error: quizError?.message ?? "Couldn't create the quiz." };

  try {
    const ai = await generateQuizFromNotes(material.content, parsed.data.question_count);

    // Resolve/create topics referenced by the generated questions.
    const topicNames = Array.from(new Set(ai.questions.map((q) => q.topic)));
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

    const rows = ai.questions.map((q) => ({
      quiz_id: quiz.id,
      topic_id: topicIdByName.get(q.topic) ?? null,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
    }));

    const { error: insertError } = await supabase.from("quiz_questions").insert(rows);
    if (insertError) throw new Error(insertError.message);

    await supabase.from("quizzes").update({ status: "ready" }).eq("id", quiz.id);
  } catch (err) {
    await supabase.from("quizzes").update({ status: "failed" }).eq("id", quiz.id);
    return { error: err instanceof Error ? err.message : "Quiz generation failed." };
  }

  revalidatePath(`/subjects/${parsed.data.subject_id}`);
  return { success: true, quizId: quiz.id as string };
}

export async function startQuizAttempt(quizId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { count } = await supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId);

  const { data: attempt, error } = await supabase
    .from("quiz_attempts")
    .insert({ quiz_id: quizId, user_id: user.id, total: count ?? 0 })
    .select()
    .single();
  if (error || !attempt) return { error: error?.message ?? "Couldn't start the quiz." };

  return { success: true, attemptId: attempt.id as string };
}

const POINTS_PER_CORRECT_ANSWER = 10;

export async function submitQuizAnswer(input: {
  attempt_id: string;
  question_id: string;
  selected_index: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = submitQuizAnswerSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid answer." };

  const { data: question, error: questionError } = await supabase
    .from("quiz_questions")
    .select("correct_index, topic_id")
    .eq("id", parsed.data.question_id)
    .single();
  if (questionError || !question) return { error: "Question not found." };

  const isCorrect = question.correct_index === parsed.data.selected_index;

  const { error } = await supabase.from("quiz_answers").insert({
    attempt_id: parsed.data.attempt_id,
    question_id: parsed.data.question_id,
    topic_id: question.topic_id,
    selected_index: parsed.data.selected_index,
    is_correct: isCorrect,
  });
  if (error) return { error: error.message };

  let pointsAwarded = 0;
  let totalPoints: number | null = null;
  if (isCorrect) {
    const { data: newTotal, error: pointsError } = await supabase.rpc("increment_points", {
      p_user_id: user.id,
      p_amount: POINTS_PER_CORRECT_ANSWER,
      p_reason: "quiz_correct_answer",
    });
    if (!pointsError) {
      pointsAwarded = POINTS_PER_CORRECT_ANSWER;
      totalPoints = newTotal as number;
    }
  }

  const streak: StreakResult | null = await recordDailyActivity(user.id);

  return {
    success: true,
    isCorrect,
    correctIndex: question.correct_index,
    pointsAwarded,
    totalPoints,
    streak,
  };
}

/**
 * Spends points to retry a quiz question after answering it wrong — clears
 * the previous (incorrect) answer row for this attempt so a fresh submit
 * can be recorded, without double-counting the question in scoring or
 * weak-topic tracking.
 */
export async function retryQuizQuestion(input: { attempt_id: string; question_id: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error: spendError } = await supabase.rpc("spend_points", {
    p_user_id: user.id,
    p_amount: PERK_COSTS.quizRetry,
    p_reason: "quiz_retry",
  });
  if (spendError) {
    if (spendError.message.includes("not enough points")) {
      return { error: "Not enough points for a retry yet." };
    }
    return { error: spendError.message };
  }

  const { error: deleteError } = await supabase
    .from("quiz_answers")
    .delete()
    .eq("attempt_id", input.attempt_id)
    .eq("question_id", input.question_id);
  if (deleteError) return { error: deleteError.message };

  return { success: true };
}

/** Spends points to reveal a 50/50 hint on the current quiz question. */
export async function useQuizHint() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { error } = await supabase.rpc("spend_points", {
    p_user_id: user.id,
    p_amount: PERK_COSTS.quizHint,
    p_reason: "quiz_hint",
  });
  if (error) {
    if (error.message.includes("not enough points")) {
      return { error: "Not enough points for a hint yet." };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function completeQuizAttempt(attemptId: string, subjectId: string) {
  const supabase = await createClient();

  const { count: correctCount } = await supabase
    .from("quiz_answers")
    .select("id", { count: "exact", head: true })
    .eq("attempt_id", attemptId)
    .eq("is_correct", true);

  const { error } = await supabase
    .from("quiz_attempts")
    .update({ score: correctCount ?? 0, completed_at: new Date().toISOString() })
    .eq("id", attemptId);
  if (error) return { error: error.message };

  revalidatePath("/progress");
  revalidatePath(`/subjects/${subjectId}`);
  return { success: true, score: correctCount ?? 0 };
}
