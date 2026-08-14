"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { subjectSchema } from "@/lib/validations/subject";

export async function createSubject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || "#D68A2E",
    icon: formData.get("icon") || "book",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid subject." };
  }

  const { error } = await supabase
    .from("subjects")
    .insert({ ...parsed.data, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/subjects");
  return { success: true };
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/subjects");
  return { success: true };
}

export async function createTopic(subjectId: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Topic name can't be empty." };

  const { data, error } = await supabase
    .from("topics")
    .upsert(
      { subject_id: subjectId, user_id: user.id, name: trimmed },
      { onConflict: "subject_id,name", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/subjects/${subjectId}`);
  return { success: true, topic: data };
}
