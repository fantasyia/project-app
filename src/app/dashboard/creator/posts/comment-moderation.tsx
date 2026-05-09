"use client";

import { useState } from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { CommentThread } from "@/components/comments/CommentThread";

export function CommentModeration({
  postId,
  initialCount,
}: {
  postId: string;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  return (
    <div className="mt-3 border-t border-white/6 pt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 text-xs text-brand-text-muted transition hover:text-white"
      >
        <MessageCircle size={14} />
        Moderar comentarios ({count})
      </button>

      {open ? (
        <div className="mt-3">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-brand-300">
            <ShieldCheck size={12} />
            Creator mod
          </div>
          <CommentThread
            postId={postId}
            allowModeration
            emptyLabel="Sem comentarios neste post."
            composerPlaceholder="Resposta do creator..."
            onCountChange={(delta) => setCount((current) => Math.max(0, current + delta))}
          />
        </div>
      ) : null}
    </div>
  );
}
