"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus, Check, X } from "lucide-react";
import { sendFriendRequest, respondToFriendRequest, removeFriendship } from "@/app/actions/friends";

export interface FriendRequestRow {
  friendship_id: string;
  other_user_id: string;
  other_full_name: string;
  other_avatar_url: string | null;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
  created_at: string;
}

export function FriendsTab({ requests }: { requests: FriendRequestRow[] }) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const incoming = requests.filter((r) => r.direction === "incoming" && r.status === "pending");
  const outgoing = requests.filter((r) => r.direction === "outgoing" && r.status === "pending");
  const friends = requests.filter((r) => r.status === "accepted");

  function handleAdd(formData: FormData) {
    setError(null);
    setNotice(null);
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const result = await sendFriendRequest(email);
      if (result?.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setNotice("Friend request sent.");
    });
  }

  function handleRespond(id: string, accept: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await respondToFriendRequest(id, accept);
      if (result?.error) setError(result.error);
    });
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this friend?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeFriendship(id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        action={handleAdd}
        className="notebook-page flex flex-wrap items-end gap-3 p-5"
      >
        <div className="flex-1">
          <label className="label" htmlFor="friend-email">
            Add a friend by email
          </label>
          <input
            id="friend-email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="friend@email.com"
          />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary">
          <UserPlus size={14} /> Send request
        </button>
      </form>
      {error && <p className="text-sm text-rust">{error}</p>}
      {notice && <p className="text-sm text-moss">{notice}</p>}

      {incoming.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink/70">Requests for you</h3>
          <div className="space-y-2">
            {incoming.map((r) => (
              <div key={r.friendship_id} className="card flex items-center justify-between p-3">
                <span className="text-sm font-medium">{r.other_full_name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(r.friendship_id, true)}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/15 text-moss transition-colors hover:bg-moss/25"
                    aria-label="Accept"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => handleRespond(r.friendship_id, false)}
                    disabled={isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-rust/10 text-rust transition-colors hover:bg-rust/20"
                    aria-label="Decline"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink/70">Sent, awaiting reply</h3>
          <div className="space-y-2">
            {outgoing.map((r) => (
              <div key={r.friendship_id} className="card flex items-center justify-between p-3">
                <span className="text-sm">{r.other_full_name}</span>
                <span className="text-xs text-ink/40">Pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink/70">Friends ({friends.length})</h3>
        {friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map((r) => (
              <div key={r.friendship_id} className="card flex items-center justify-between p-3">
                <span className="text-sm font-medium">{r.other_full_name}</span>
                <button
                  onClick={() => handleRemove(r.friendship_id)}
                  disabled={isPending}
                  className="text-xs text-ink/40 hover:text-rust"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/60">
            No friends yet — add someone by email to start comparing weekly progress.
          </p>
        )}
      </section>
    </div>
  );
}
