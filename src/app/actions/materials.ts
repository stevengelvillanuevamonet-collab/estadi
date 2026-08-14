"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { materialSchema } from "@/lib/validations/material";
import { extractTextFromFile } from "@/lib/files/extract-text";

export async function createMaterial(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const topicIdRaw = formData.get("topic_id");
  const parsed = materialSchema.safeParse({
    subject_id: formData.get("subject_id"),
    topic_id: topicIdRaw ? String(topicIdRaw) : null,
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const file = formData.get("file") as File | null;
  let filePath: string | null = null;
  let fileType: string | null = null;
  let sourceType: "text" | "file" = "text";
  let content = parsed.data.content;
  let extractionWarning: string | undefined;

  if (file && file.size > 0) {
    const path = `${user.id}/${parsed.data.subject_id}/${Date.now()}-${file.name}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(path, bytes, { contentType: file.type || undefined });
    if (uploadError) return { error: `File upload failed: ${uploadError.message}` };

    filePath = path;
    fileType = file.type;
    sourceType = "file";

    const extracted = await extractTextFromFile(bytes, file.type, file.name);
    extractionWarning = extracted.warning;
    if (extracted.text) {
      // Typed notes (if any) come first, extracted text follows.
      content = content ? `${content}\n\n${extracted.text}` : extracted.text;
    }
  }

  if (!content) {
    // Don't leave an orphaned file in storage if we're rejecting the note.
    if (filePath) await supabase.storage.from("materials").remove([filePath]);
    return {
      error:
        extractionWarning ??
        "Add some notes or upload a file Estadi can read (PDF, DOCX, or TXT) — this note has no content yet.",
    };
  }

  const { error } = await supabase.from("materials").insert({
    subject_id: parsed.data.subject_id,
    topic_id: parsed.data.topic_id,
    title: parsed.data.title,
    content,
    user_id: user.id,
    file_path: filePath,
    file_type: fileType,
    source_type: sourceType,
  });

  if (error) return { error: error.message };

  revalidatePath(`/subjects/${parsed.data.subject_id}`);
  return { success: true, warning: extractionWarning };
}

export async function deleteMaterial(materialId: string, subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", materialId);
  if (error) return { error: error.message };

  revalidatePath(`/subjects/${subjectId}`);
  return { success: true };
}

export async function getMaterialDownloadUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("materials")
    .createSignedUrl(filePath, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
