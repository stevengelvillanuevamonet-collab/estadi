"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { materialSchema } from "@/lib/validations/material";
import { extractTextFromFile } from "@/lib/files/extract-text";

/**
 * Creates a note. If a file was attached, the CLIENT must have already
 * uploaded it directly to Supabase Storage (see notes-tab.tsx) and passed
 * its path here — we deliberately never accept raw file bytes in this
 * server action's FormData. Vercel enforces a hard ~4.5MB request body
 * limit on all Serverless Functions (including Server Actions) that
 * cannot be raised by any app-level config, so routing large files
 * through here would silently fail for anything much bigger than a few
 * MB. Downloading the file back from Storage for extraction, on the
 * other hand, is a normal outbound fetch from within the function and
 * isn't subject to that limit.
 */
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

  const filePathRaw = formData.get("file_path");
  const fileTypeRaw = formData.get("file_type");
  const filePath = filePathRaw ? String(filePathRaw) : null;
  const fileType = fileTypeRaw ? String(fileTypeRaw) : null;

  let content = parsed.data.content;
  let extractionWarning: string | undefined;
  let sourceType: "text" | "file" = "text";

  if (filePath) {
    // Ownership check: the path must live under this user's own folder,
    // matching the storage RLS policy — belt-and-suspenders even though
    // RLS already enforces this at the storage layer.
    if (!filePath.startsWith(`${user.id}/`)) {
      return { error: "That file doesn't belong to your account." };
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from("materials")
      .download(filePath);
    if (downloadError || !blob) {
      return { error: `Couldn't read the uploaded file: ${downloadError?.message ?? "unknown error"}` };
    }

    const bytes = Buffer.from(await blob.arrayBuffer());
    sourceType = "file";

    const extracted = await extractTextFromFile(bytes, fileType ?? "", filePath);
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
