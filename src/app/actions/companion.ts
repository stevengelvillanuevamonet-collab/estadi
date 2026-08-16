"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getAccessory } from "@/lib/data/companion";

export async function unlockAccessory(accessoryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const accessory = getAccessory(accessoryId);
  if (!accessory) return { error: "Unknown accessory." };

  const { data, error } = await supabase.rpc("unlock_accessory", {
    p_user_id: user.id,
    p_accessory: accessory.id,
    p_cost: accessory.cost,
  });

  if (error) {
    if (error.message.includes("not enough points")) {
      return { error: "Not enough points yet — keep studying!" };
    }
    if (error.message.includes("already unlocked")) {
      return { error: "You've already unlocked this." };
    }
    return { error: error.message };
  }

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  const row = Array.isArray(data) ? data[0] : data;
  return { success: true, points: row?.new_points as number | undefined };
}

export async function equipAccessory(accessoryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const accessory = getAccessory(accessoryId);
  if (!accessory) return { error: "Unknown accessory." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("unlocked_accessories, equipped_accessories")
    .eq("id", user.id)
    .single();
  if (!profile?.unlocked_accessories?.includes(accessory.id)) {
    return { error: "Unlock this before equipping it." };
  }

  const nextEquipped = { ...(profile.equipped_accessories as Record<string, string>), [accessory.slot]: accessory.id };
  const { error } = await supabase
    .from("profiles")
    .update({ equipped_accessories: nextEquipped })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unequipAccessory(slot: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("equipped_accessories")
    .eq("id", user.id)
    .single();
  const nextEquipped = { ...(profile?.equipped_accessories as Record<string, string> | undefined) };
  delete nextEquipped[slot];

  const { error } = await supabase
    .from("profiles")
    .update({ equipped_accessories: nextEquipped })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: true };
}

const nameSchema = z.string().trim().min(1, "Give your companion a name").max(24);

export async function renamePet(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in first." };

  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name." };

  const { error } = await supabase.from("profiles").update({ pet_name: parsed.data }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/rewards");
  revalidatePath("/dashboard");
  return { success: true };
}
