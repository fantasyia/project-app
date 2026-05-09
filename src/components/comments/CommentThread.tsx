"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Ban, Check, ChevronDown, Heart, MoreHorizontal, Pencil, Reply, ShieldAlert, Smile, Trash2, X } from "lucide-react";
import {
  addComment,
  banUserFromCreatorComments,
  editComment,
  getCommentsForPost,
  removeComment,
  toggleCommentLike,
  type PostCommentView,
} from "@/lib/actions/posts";

const emojiOptions = [
  "\u{1F49A}",
  "\u{1F525}",
  "\u{1F60D}",
  "\u{1F44F}",
  "\u{2728}",
  "\u{1F602}",
  "\u{1F64C}",
  "\u{1F970}",
];

type CommentThreadProps = {
  postId: string;
  emptyLabel?: string;
  allowModeration?: boolean;
  composerPlaceholder?: string;
  onCountChange?: (delta: number) => void;
};

export function CommentThread({
  postId,
  emptyLabel = "Seja o primeiro comentario.",
  allowModeration = false,
  composerPlaceholder = "Adicionar comentario...",
  onCountChange,
}: CommentThreadProps) {
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [comments, setComments] = useState<PostCommentView[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<PostCommentView | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedReplyIds, setExpandedReplyIds] = useState<Set<string>>(new Set());
  const [replyingToRootId, setReplyingToRootId] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    refreshComments();
    // The component is mounted only when the thread should be visible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  function refreshComments() {
    startTransition(async () => {
      try {
        const nextComments = await getCommentsForPost(postId);
        setComments(nextComments);
        setLoaded(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro inesperado.";
        setFeedback(`Nao foi possivel carregar os comentarios agora. ${message}`);
        setLoaded(true);
      }
    });
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setCommentText((current) => `${current}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? commentText.length;
    const end = textarea.selectionEnd ?? commentText.length;
    const nextText = `${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`;
    setCommentText(nextText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
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
      const replyParentId = replyingTo ? replyingToRootId || replyingTo.id : null;
      const result = await addComment(postId, normalizedComment, replyParentId);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      setCommentText("");
      setReplyingTo(null);
      setReplyingToRootId(null);
      setEmojiOpen(false);
      onCountChange?.(1);
      if (replyParentId) {
        setExpandedReplyIds((current) => new Set(current).add(replyParentId));
      }
      await reloadAfterAction();
      setFeedback(replyingTo ? "Resposta publicada na conversa." : "Comentario enviado.");
    });
  }

  function handleLike(comment: PostCommentView) {
    setFeedback(null);
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id);
      if (!result?.success) {
        setFeedback(result?.error || "Nao foi possivel curtir este comentario agora.");
        return;
      }

      const updateComment = (currentComment: PostCommentView): PostCommentView =>
        currentComment.id === comment.id
          ? {
              ...currentComment,
              likedByMe: result.liked,
              likesCount: Math.max(0, currentComment.likesCount + (result.liked ? 1 : -1)),
            }
          : { ...currentComment, replies: currentComment.replies.map(updateComment) };

      setComments((currentComments) => currentComments.map(updateComment));
    });
  }

  function startReply(comment: PostCommentView, rootId?: string) {
    setFeedback(null);
    setOpenMenuId(null);
    setReplyingTo(comment);
    setReplyingToRootId(rootId || comment.id);
    setExpandedReplyIds((current) => new Set(current).add(rootId || comment.id));
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function startEdit(comment: PostCommentView) {
    setFeedback(null);
    setOpenMenuId(null);
    setEditingCommentId(comment.id);
    setEditingText(comment.content);
    requestAnimationFrame(() => editTextareaRef.current?.focus());
  }

  function cancelEdit() {
    setEditingCommentId(null);
    setEditingText("");
  }

  function handleEditComment() {
    const commentId = editingCommentId;
    const normalizedText = editingText.trim();
    if (!commentId || !normalizedText) return;

    setFeedback(null);
    startTransition(async () => {
      const result = await editComment(commentId, normalizedText);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      cancelEdit();
      await reloadAfterAction();
      setFeedback("Comentario editado.");
    });
  }

  function handleRemove(comment: PostCommentView) {
    setFeedback(null);
    setOpenMenuId(null);
    startTransition(async () => {
      const result = await removeComment(comment.id);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      onCountChange?.(-1);
      await reloadAfterAction();
      setFeedback("Comentario removido.");
    });
  }

  function handleBan(comment: PostCommentView) {
    setFeedback(null);
    setOpenMenuId(null);
    startTransition(async () => {
      const result = await banUserFromCreatorComments(comment.id);
      if (result?.error) {
        setFeedback(result.error);
        return;
      }

      await reloadAfterAction();
      setFeedback("Usuario bloqueado para comentarios deste creator.");
    });
  }

  async function reloadAfterAction() {
    const nextComments = await getCommentsForPost(postId);
    setComments(nextComments);
    setLoaded(true);
  }

  function flattenReplies(replyList: PostCommentView[]): PostCommentView[] {
    return replyList.flatMap((reply) => [reply, ...flattenReplies(reply.replies)]);
  }

  function toggleReplies(commentId: string) {
    setExpandedReplyIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  function renderComment(comment: PostCommentView, depth = 0, rootId = comment.id) {
    const removed = Boolean(comment.deletedAt || comment.moderationStatus === "removed");
    const isEditing = editingCommentId === comment.id;
    const menuOpen = openMenuId === comment.id;
    const hasMenuActions = comment.canEdit || comment.canRemove || (allowModeration && comment.canBan);
    const flatReplies = depth === 0 ? flattenReplies(comment.replies) : [];
    const repliesExpanded = expandedReplyIds.has(comment.id);

    return (
      <div key={comment.id} className={depth > 0 ? "ml-5 border-l border-white/8 pl-3 sm:ml-7" : ""}>
        <div className="flex gap-2 py-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-300">
            {comment.author?.displayName?.[0]?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  {hasMenuActions ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId((current) => (current === comment.id ? null : comment.id))}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-brand-text-muted transition hover:bg-white/[0.05] hover:text-white"
                        aria-label="Opcoes do comentario"
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen ? (
                        <div className="absolute left-0 top-7 z-20 min-w-36 rounded-2xl border border-white/10 bg-[#050706] p-1 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
                          {comment.canEdit ? (
                            <button
                              type="button"
                              onClick={() => startEdit(comment)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-brand-text-base transition hover:bg-white/[0.05] hover:text-white"
                            >
                              <Pencil size={12} />
                              Editar
                            </button>
                          ) : null}
                          {comment.canRemove ? (
                            <button
                              type="button"
                              onClick={() => handleRemove(comment)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                            >
                              <Trash2 size={12} />
                              Remover
                            </button>
                          ) : null}
                          {allowModeration && comment.canBan ? (
                            <button
                              type="button"
                              onClick={() => handleBan(comment)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-amber-300 transition hover:bg-amber-500/10 hover:text-amber-200"
                            >
                              {comment.isBannedFromCreator ? <ShieldAlert size={12} /> : <Ban size={12} />}
                              {comment.isBannedFromCreator ? "Banido" : "Banir usuario"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <p className="truncate text-xs font-semibold text-white">
                    {comment.author?.displayName || "Usuario"}
                  </p>
                  {comment.editedAt && !isEditing ? (
                    <span className="shrink-0 text-[10px] text-brand-text-muted">editado</span>
                  ) : null}
                </div>

                {isEditing ? (
                  <div className="mt-2 flex items-center gap-2">
                    <textarea
                      ref={editTextareaRef}
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          handleEditComment();
                        }
                      }}
                      rows={1}
                      className="min-h-10 min-w-0 flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/40"
                    />
                    <button
                      type="button"
                      disabled={pending || !editingText.trim()}
                      onClick={handleEditComment}
                      className="rounded-lg bg-brand-500 p-2 text-black disabled:opacity-40"
                      aria-label="Salvar comentario"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-white/10 p-2 text-brand-text-muted"
                      aria-label="Cancelar edicao"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p className={`mt-0.5 text-sm leading-5 ${removed ? "italic text-brand-text-muted" : "text-white"}`}>
                    {comment.content}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={pending || removed}
                onClick={() => handleLike(comment)}
                className={`flex flex-col items-center gap-0.5 text-[10px] transition disabled:opacity-40 ${
                  comment.likedByMe ? "text-red-400" : "text-brand-text-muted hover:text-red-300"
                }`}
                aria-label={comment.likedByMe ? "Remover curtida" : "Curtir comentario"}
              >
                <Heart size={15} className={comment.likedByMe ? "fill-current" : ""} />
                {comment.likesCount > 0 ? comment.likesCount : ""}
              </button>
            </div>

            {!removed ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-brand-text-muted">
                <button
                  type="button"
                  onClick={() => startReply(comment, depth === 0 ? comment.id : rootId)}
                  className="inline-flex items-center gap-1 transition hover:text-white"
                >
                  <Reply size={12} />
                  Responder
                </button>
              </div>
            ) : null}
            {depth === 0 && flatReplies.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleReplies(comment.id)}
                className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium text-brand-text-muted transition hover:text-white"
                aria-expanded={repliesExpanded}
              >
                <span className="h-px w-7 bg-white/20" />
                <ChevronDown
                  size={13}
                  className={`transition-transform ${repliesExpanded ? "rotate-180" : ""}`}
                />
                {repliesExpanded
                  ? "Ocultar respostas"
                  : `Ver respostas (${flatReplies.length})`}
              </button>
            ) : null}
          </div>
        </div>
        {depth === 0 && flatReplies.length > 0 && repliesExpanded ? (
          <div className="space-y-1">{flatReplies.map((reply) => renderComment(reply, 1, comment.id))}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-3">
      {replyingTo ? (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-brand-500/15 bg-brand-500/10 px-3 py-2 text-xs text-brand-text-base">
          <span>Respondendo {replyingTo.author?.displayName || "comentario"}</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-brand-text-muted">
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
        <textarea
          ref={textareaRef}
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleAddComment();
            }
          }}
          placeholder={replyingTo ? "Responder comentario..." : composerPlaceholder}
          rows={2}
          className="min-h-10 w-full resize-none bg-transparent text-sm leading-5 text-white outline-none placeholder:text-brand-text-muted/50"
        />

        {emojiOpen ? (
          <div className="mb-2 mt-1 flex flex-wrap gap-1.5">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-base transition hover:bg-white/[0.1]"
                aria-label={`Inserir emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setEmojiOpen((current) => !current)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              emojiOpen ? "bg-brand-500/15 text-brand-300" : "text-brand-text-muted hover:bg-white/[0.05] hover:text-white"
            }`}
            aria-label="Abrir emojis"
            aria-expanded={emojiOpen}
          >
            <Smile size={16} />
          </button>
          <button
            type="button"
            disabled={pending || !commentText.trim()}
            onClick={handleAddComment}
            className="text-sm font-semibold text-brand-500 transition-colors hover:text-brand-400 disabled:opacity-40"
          >
            Publicar
          </button>
        </div>
      </div>

      <div className="mt-3 divide-y divide-white/6">
        {pending && !loaded ? (
          <p className="py-4 text-center text-xs text-brand-text-muted">Carregando comentarios...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <p className="py-4 text-center text-xs text-brand-text-muted">{emptyLabel}</p>
        )}
      </div>

      {feedback ? <p className="mt-2 text-xs text-brand-text-muted">{feedback}</p> : null}
    </div>
  );
}
