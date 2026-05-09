"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { CommentThread } from "@/components/comments/CommentThread";
import { toggleFavorite, toggleLike } from "@/lib/actions/posts";

export function FeedInteractions({
  postId,
  likesCount,
  commentsCount,
  creatorId,
  creatorName,
  initiallyLiked = false,
  initiallyFavorited = false,
}: {
  postId: string;
  likesCount: number;
  commentsCount: number;
  creatorId?: string | null;
  creatorHandle?: string | null;
  creatorName?: string | null;
  initiallyLiked?: boolean;
  initiallyFavorited?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [liveLikesCount, setLiveLikesCount] = useState(likesCount);
  const [liveCommentsCount, setLiveCommentsCount] = useState(commentsCount);
  const [isLiked, setIsLiked] = useState(initiallyLiked);
  const [isFavorited, setIsFavorited] = useState(initiallyFavorited);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleToggleLike() {
    setFeedback(null);
    startTransition(async () => {
      const result = await toggleLike(postId);
      if (!result?.success) {
        if (result?.error) setFeedback(result.error);
        return;
      }

      setIsLiked(result.liked);
      setLiveLikesCount((previousCount) =>
        Math.max(0, previousCount + (result.liked ? 1 : -1))
      );
    });
  }

  function handleToggleFavorite() {
    setFeedback(null);
    startTransition(async () => {
      const result = await toggleFavorite(postId);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      setIsFavorited(Boolean(result?.favorited));
      setFeedback(result?.favorited ? "Post salvo." : "Post removido dos salvos.");
    });
  }

  return (
    <div className="px-4 pb-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={pending}
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
              isLiked ? "text-red-400" : "text-white hover:text-red-400"
            }`}
            aria-label={isLiked ? "Remover curtida" : "Curtir"}
          >
            <Heart size={22} strokeWidth={1.5} className={isLiked ? "fill-current" : ""} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setIsCommentOpen((current) => !current);
            }}
            className={`flex items-center gap-1.5 transition-colors ${
              isCommentOpen ? "text-brand-400" : "text-white hover:text-brand-400"
            }`}
            aria-label={isCommentOpen ? "Fechar comentarios" : "Abrir comentarios"}
          >
            <MessageCircle size={22} strokeWidth={1.5} className={isCommentOpen ? "fill-current" : ""} />
          </button>

          {creatorId ? (
            <Link
              href={`/dashboard/user/messages?with=${creatorId}`}
              className="text-white transition-colors hover:text-brand-400"
              aria-label={`Enviar direct para ${creatorName || "creator"}`}
            >
              <Send size={20} strokeWidth={1.5} className="rotate-[20deg]" />
            </Link>
          ) : (
            <button type="button" disabled className="text-white/30" aria-label="Direct indisponivel">
              <Send size={20} strokeWidth={1.5} className="rotate-[20deg]" />
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={handleToggleFavorite}
          className={`transition-colors disabled:opacity-60 ${
            isFavorited ? "text-brand-400" : "text-white hover:text-brand-400"
          }`}
          aria-label={isFavorited ? "Remover dos salvos" : "Salvar"}
        >
          <Bookmark size={22} strokeWidth={1.5} className={isFavorited ? "fill-current" : ""} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm">
        {liveLikesCount > 0 ? (
          <span className="font-semibold text-white">{liveLikesCount.toLocaleString("pt-BR")} curtidas</span>
        ) : null}
        <button
          type="button"
          onClick={() => setIsCommentOpen(true)}
          className="text-brand-text-muted"
        >
          {liveCommentsCount > 0
            ? `Ver ${liveCommentsCount} comentario${liveCommentsCount > 1 ? "s" : ""}`
            : "Ver comentarios"}
        </button>
      </div>

      {isCommentOpen ? (
        <div className="mt-3">
          <CommentThread
            postId={postId}
            onCountChange={(delta) => setLiveCommentsCount((current) => Math.max(0, current + delta))}
          />
        </div>
      ) : null}

      {feedback ? <p className="mt-2 text-xs text-brand-text-muted">{feedback}</p> : null}
    </div>
  );
}
