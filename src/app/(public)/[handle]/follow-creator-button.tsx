"use client";

import { useState, useTransition } from "react";
import { Check, UserPlus } from "lucide-react";
import { followUser } from "@/lib/actions/social";

export function FollowCreatorButton({
  creatorId,
  initialFollowing,
}: {
  creatorId: string;
  initialFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await followUser(creatorId);
          if (result?.success) setIsFollowing(Boolean(result.following));
        });
      }}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
        isFollowing
          ? "border border-brand-500/30 bg-brand-500/10 text-brand-300"
          : "bg-white text-black hover:bg-brand-text-base"
      }`}
    >
      {isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
      {isFollowing ? "Seguindo" : "Seguir"}
    </button>
  );
}
