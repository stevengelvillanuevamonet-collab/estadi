"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email");

export async function sendFriendRequest(email: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email." };

  const { data: match, error: lookupError } = await supabase
    .rpc("find_user_by_email", { p_email: parsed.data })
    .maybeSingle();
  if (lookupError) return { error: lookupError.message };
  const matchedUser = match as { id: string; full_name: string | null; avatar_url: string | null } | null;
  if (!matchedUser) return { error: "No Estadi user found with that email." };
  if (matchedUser.id === user.id) return { error: "That's your own email." };

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: matchedUser.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already sent (or have) a request with this person." };
    return { error: error.message };
  }

  revalidatePath("/rewards");
  return { success: true };
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", friendshipId);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  return { success: true };
}

export async function removeFriendship(friendshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  return { success: true };
}