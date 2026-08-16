"use client";

import { useState, useTransition } from "react";
import { Lock, Check } from "lucide-react";
import { Capybara } from "@/components/companion/capybara";
import { ACCESSORIES, getEvolutionStage, getCompanionMood, hasBirdCompanion } from "@/lib/data/companion";
import { unlockAccessory, equipAccessory, unequipAccessory } from "@/app/actions/companion";
import { cn } from "@/lib/utils";

export function CompanionTab({
  points,
  lifetimePoints,
  lastActiveDate,
  unlockedAccessories,
  equippedAccessories,
}: {
  points: number;
  lifetimePoints: number;
  lastActiveDate: string | null;
  unlockedAccessories: string[];
  equippedAccessories: Record<string, string>;
}) {
  const [unlocked, setUnlocked] = useState(new Set(unlockedAccessories));
  const [equipped, setEquipped] = useState(equippedAccessories);
  const [pointsLeft, setPointsLeft] = useState(points);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stage = getEvolutionStage(lifetimePoints);
  const mood = getCompanionMood(lastActiveDate);
  const bird = hasBirdCompanion(lifetimePoints);

  function handleUnlock(id: string, cost: number) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await unlockAccessory(id);
      setPendingId(null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setUnlocked((prev) => new Set(prev).add(id));
      setPointsLeft((p) => p - cost);
    });
  }

  function handleToggleEquip(id: string, slot: string) {
    setError(null);
    const isEquipped = equipped[slot] === id;
    const previous = equipped;
    setEquipped((prev) => {
      const next = { ...prev };
      if (isEquipped) delete next[slot];
      else next[slot] = id;
      return next;
    });
    startTransition(async () => {
      const result = isEquipped ? await unequipAccessory(slot) : await equipAccessory(id);
      if (result?.error) {
        setEquipped(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="notebook-page flex flex-col items-center gap-3 p-6 text-center">
        <Capybara stage={stage} mood={mood} equipped={equipped} hasBird={bird} size={140} />
        <p className="text-sm text-ink/60">
          Evolves as your lifetime points grow, and never demotes when you spend.
          {!bird && " The bird companion can't be bought — only earned at Scholar Emeritus."}
        </p>
      </div>

      {error && <p className="text-sm text-rust">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {ACCESSORIES.map((a) => {
          const isUnlocked = unlocked.has(a.id);
          const isEquipped = equipped[a.slot] === a.id;
          const canAfford = pointsLeft >= a.cost;
          return (
            <div key={a.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-ink/40">{a.tier}</p>
                  <h3 className="font-medium">{a.name}</h3>
                </div>
                {isEquipped && <Check size={15} className="text-moss" />}
              </div>
              <p className="mt-1 text-sm text-ink/60">{a.description}</p>
              <div className="mt-3">
                {isUnlocked ? (
                  <button
                    onClick={() => handleToggleEquip(a.id, a.slot)}
                    disabled={isPending}
                    className={cn("btn-secondary text-xs", isEquipped && "opacity-70")}
                  >
                    {isEquipped ? "Unequip" : "Equip"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnlock(a.id, a.cost)}
                    disabled={!canAfford || isPending}
                    className="btn-primary text-xs disabled:cursor-not-allowed"
                  >
                    {pendingId === a.id ? (
                      "Unlocking…"
                    ) : (
                      <>
                        <Lock size={12} /> Unlock for {a.cost} pts
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
