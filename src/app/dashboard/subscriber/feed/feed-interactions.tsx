"use client";

import { useState, useTransition } from "react";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { addComment, toggleFavorite, toggleLike } from "@/lib/actions/posts";

export function FeedInteractions({
  postId,
  likesCount,
  commentsCount,
  creatorHandle,
  creatorName,
}: {
  postId: string;
  likesCount: number;
  commentsCount: number;
  creatorHandle?: string | null;
  creatorName?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [liveLikesCount, setLiveLikesCount] = useState(likesCount);
  const [liveCommentsCount, setLiveCommentsCount] = useState(commentsCount);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleToggleLike() {
    setFeedback(null);
    startTransition(async () => {
      const result = await toggleLike(postId);
      if (!result?.success) return;

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
      setFeedback(result?.favorited ? "Post salvo." : "Post removido dos salvos.");
    });
  }

  function handleAddComment() {
    const normalizedComment = commentText.trim();
    if (!normalizedComment) {
      setFeedback("Escreva um comentario antes de enviar.");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const result = await addComment(postId, normalizedComment);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      setCommentText("");
      setLiveCommentsCount((previousCount) => previousCount + 1);
      setFeedback("Comentario enviado.");
    });
  }

  async function handleShare() {
    if (!creatorHandle) {
      setFeedback("Nao foi possivel gerar o link de compartilhamento.");
      return;
    }

    const profileUrl = `${window.location.origin}/${creatorHandle}`;
    const shareTitle = creatorName ? `Perfil de ${creatorName}` : "Perfil do creator";

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: "Veja esse creator na Fantasyia.",
          url: profileUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(profileUrl);
      setFeedback("Link copiado.");
    } catch {
      setFeedback("Nao foi possivel compartilhar agora.");
    }
  }

  return (
    <div className="px-4 pb-3 pt-2">
      {/* Action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            disabled={pending}
            onClick={handleToggleLike}
            className="flex items-center gap-1.5 text-white transition-colors hover:text-red-400 disabled:opacity-60"
          >
            <Heart size={22} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setIsCommentOpen((currentValue) => !currentValue);
            }}
            className="flex items-center gap-1.5 text-white transition-colors hover:text-brand-400"
          >
            <MessageCircle size={22} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={() => { void handleShare(); }}
            className="text-white transition-colors hover:text-brand-400"
          >
            <Send size={20} strokeWidth={1.5} className="rotate-[20deg]" />
          </button>
        </div>

        <button
          disabled={pending}
          onClick={handleToggleFavorite}
          className="text-white transition-colors hover:text-brand-400 disabled:opacity-60"
        >
          <Bookmark size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* Counts */}
      <div className="mt-2 flex items-center gap-3 text-sm">
        {liveLikesCount > 0 && (
          <span className="font-semibold text-white">{liveLikesCount.toLocaleString("pt-BR")} curtidas</span>
        )}
        {liveCommentsCount > 0 && (
          <button
            type="button"
            onClick={() => setIsCommentOpen(true)}
            className="text-brand-text-muted"
          >
            Ver {liveCommentsCount} comentário{liveCommentsCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Comment input */}
      {isCommentOpen && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleAddComment()}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-brand-text-muted/50"
          />
          <button
            type="button"
            disabled={pending || !commentText.trim()}
            onClick={handleAddComment}
            className="text-sm font-semibold text-brand-500 transition-colors hover:text-brand-400 disabled:opacity-40"
          >
            Publicar
          </button>
        </div>
      )}

      {feedback && (
        <p className="mt-2 text-xs text-brand-text-muted">{feedback}</p>
      )}
    </div>
  );
}
