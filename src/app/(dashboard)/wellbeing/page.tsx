import { createClient } from "@/lib/supabase/server";
import { WellbeingHub } from "@/components/mood/wellbeing-hub";

export default async function WellbeingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", user!.id)
    .order("entry_date", { ascending: false })
    .limit(60);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries?.find((e) => e.entry_date === todayStr) ?? null;

  return <WellbeingHub entries={entries ?? []} todayEntry={todayEntry} />;
}
