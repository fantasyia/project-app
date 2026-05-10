"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { blockCreator, submitMediaReviewAction, type MediaReviewAction } from "@/lib/actions/admin";
import { parsePostMediaAsset } from "@/lib/media/post-media";
import { Ban, Grid3X3, List, Maximize, MoreVertical, Send, X } from "lucide-react";

type Tier = "all" | "basic" | "premium" | "emerald" | "ppv";
type ViewMode = "feed" | "grid";
type StatusFilter = "all" | "visible" | "removed";
type ReviewDraft = {
  action: MediaReviewAction;
  message: string;
};

type ModerationPost = {
  id: string;
  author_id: string;
  media_url?: string | null;
  post_type?: string | null;
  access_tier: string;
  content_tier?: string | null;
  price?: string | number | null;
  content?: string | null;
  created_at?: string | null;
  moderation_status?: string | null;
  warning_count?: number;
  creator_blocked?: boolean;
  author?: {
    display_name?: string | null;
    handle?: string | null;
  } | null;
};

const tiers: Array<{ value: Tier; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "basic", label: "Basico" },
  { value: "premium", label: "Premium" },
  { value: "emerald", label: "Esmeralda" },
  { value: "ppv", label: "PPV" },
];

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "visible", label: "Visivel" },
  { value: "removed", label: "Removido" },
];

const defaultReviewDraft: ReviewDraft = {
  action: "recommendation",
  message: "",
};

const reviewActionOptions: Array<{ value: MediaReviewAction; label: string }> = [
  { value: "recommendation", label: "Recomendar" },
  { value: "warning", label: "Advertir creator" },
  { value: "removal", label: "Remover midia" },
];

const reviewActionCopy: Record<
  MediaReviewAction,
  {
    label: string;
    placeholder: string;
    button: string;
    emptyMessage: string;
    buttonClass: string;
  }
> = {
  recommendation: {
    label: "Recomendacao para o creator",
    placeholder: "Escreva uma orientacao clara para ajustar este conteudo.",
    button: "Enviar recomendacao",
    emptyMessage: "Informe a recomendacao para o creator.",
    buttonClass: "border-brand-500/20 bg-brand-500 text-black hover:bg-brand-400",
  },
  warning: {
    label: "Motivo da advertencia",
    placeholder: "Explique qual regra foi violada e o que precisa ser corrigido.",
    button: "Advertir creator",
    emptyMessage: "Informe o motivo da advertencia.",
    buttonClass: "border-yellow-500/20 bg-yellow-500/15 text-yellow-100 hover:bg-yellow-500/25",
  },
  removal: {
    label: "Motivo da remocao",
    placeholder: "Explique por que esta midia sera removida.",
    button: "Remover midia",
    emptyMessage: "Informe o motivo da remocao.",
    buttonClass: "border-red-500/20 bg-red-500/15 text-red-200 hover:bg-red-500/25",
  },
};

function getTier(post: ModerationPost): Exclude<Tier, "all"> {
  if (post.content_tier === "emerald" || post.content_tier === "premium" || post.content_tier === "ppv") {
    return post.content_tier;
  }

  const price = Number(post.price || 0);
  if (Number.isFinite(price) && price > 0) return "ppv";
  if (post.access_tier === "premium") return "premium";
  return "basic";
}

function getAccessLabel(post: ModerationPost) {
  const tier = getTier(post);
  if (tier === "basic") return "Plano Basico";
  if (tier === "premium") return "Premium";
  if (tier === "emerald") return "Esmeralda";
  return `PPV R$ ${post.price || "0"}`;
}

function getStatus(post: ModerationPost): StatusFilter {
  return post.moderation_status === "removed" ? "removed" : "visible";
}

function getStatusLabel(post: ModerationPost) {
  return getStatus(post) === "removed" ? "Removido" : "Visivel";
}

function AdminMediaPreview({ post, compact = false }: { post: ModerationPost; compact?: boolean }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const media = parsePostMediaAsset(post.media_url);
  const isVideo = post.post_type === "video" || media.isVideo;

  function requestFullscreen() {
    const frame = frameRef.current;
    if (!frame) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void frame.requestFullscreen().catch(() => {
      const video = frame.querySelector("video") as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      video?.webkitEnterFullscreen?.();
    });
  }

  return (
    <div
      ref={frameRef}
      className={`relative w-full overflow-hidden bg-brand-surface-lowest ${compact ? "aspect-square" : "aspect-[4/5]"}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      {media.mediaUrl ? (
        isVideo ? (
          <video
            src={media.mediaUrl}
            poster={media.posterUrl || undefined}
            controls
            playsInline
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={media.mediaUrl}
            alt="Midia publicada"
            fill
            unoptimized
            draggable={false}
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center p-5 text-center">
          <p className="text-xs italic text-brand-text-muted">Sem midia anexada</p>
        </div>
      )}

      <button
        type="button"
        onClick={requestFullscreen}
        disabled={!media.mediaUrl}
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur transition hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Ver midia em tela cheia"
      >
        <Maximize size={15} />
      </button>
    </div>
  );
}

export function ModerationClient({ initialPosts }: { initialPosts: ModerationPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [tier, setTier] = useState<Tier>("all");
  const [authorFilter, setAuthorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [isPending, startTransition] = useTransition();

  const filteredPosts = useMemo(() => {
    const normalizedAuthor = authorFilter.trim().toLowerCase();
    return posts.filter((post) => {
      if (tier !== "all" && getTier(post) !== tier) return false;
      if (statusFilter !== "all" && getStatus(post) !== statusFilter) return false;
      if (normalizedAuthor) {
        const source = `${post.author?.display_name || ""} ${post.author?.handle || ""}`.toLowerCase();
        if (!source.includes(normalizedAuthor)) return false;
      }
      return true;
    });
  }, [authorFilter, posts, statusFilter, tier]);

  function getReviewDraft(postId: string) {
    return reviewDrafts[postId] || defaultReviewDraft;
  }

  function updateReviewDraft(postId: string, nextDraft: Partial<ReviewDraft>) {
    setReviewDrafts((current) => ({
      ...current,
      [postId]: {
        ...defaultReviewDraft,
        ...current[postId],
        ...nextDraft,
      },
    }));
  }

  function clearReviewDraft(postId: string) {
    setReviewDrafts((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
  }

  function handleSubmitReview(post: ModerationPost) {
    const draft = getReviewDraft(post.id);
    const message = draft.message.trim();
    const copy = reviewActionCopy[draft.action];

    if (!message) {
      alert(copy.emptyMessage);
      return;
    }

    if (draft.action === "removal" && !confirm("Remover esta midia?")) return;

    startTransition(async () => {
      const result = await submitMediaReviewAction(post.id, draft.action, message);
      if (result.success) {
        if (draft.action === "warning") {
          setPosts((prev) =>
            prev.map((item) =>
              item.author_id === post.author_id
                ? { ...item, warning_count: (item.warning_count || 0) + 1 }
                : item
            )
          );
        }

        if (draft.action === "removal") {
          setPosts((prev) => prev.filter((item) => item.id !== post.id));
        }

        clearReviewDraft(post.id);
        setOpenReviewId(null);
      } else {
        alert("Erro ao enviar revisao: " + result.error);
      }
    });
  }

  function handleBlock(post: ModerationPost) {
    if (!confirm("Bloquear este creator?")) return;

    startTransition(async () => {
      const result = await blockCreator(post.author_id);
      if (result.success) {
        setPosts((prev) =>
          prev.map((item) =>
            item.author_id === post.author_id ? { ...item, creator_blocked: true } : item
          )
        );
        setOpenReviewId(null);
      } else {
        alert("Erro ao bloquear: " + result.error);
      }
    });
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-[30px] border border-dashed border-white/10 bg-black/25 px-6 py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-300">Fila limpa</p>
        <h2 className="mt-3 text-xl font-light text-white">Nenhum post recente para auditar</h2>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">Novas publicacoes aparecem aqui para revisao global.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-3 rounded-[24px] border border-white/8 bg-black/25 p-3">
        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white/[0.03] p-1">
          {tiers.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTier(item.value)}
              className={`rounded-xl px-2 py-2 text-[10px] font-semibold uppercase tracking-widest transition ${
                tier === item.value ? "bg-brand-500 text-black" : "text-brand-text-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          value={authorFilter}
          onChange={(event) => setAuthorFilter(event.target.value)}
          placeholder="Filtrar por creator"
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-brand-text-muted/60 focus:border-brand-500/40"
        />

        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {statusOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setStatusFilter(item.value)}
              className={`rounded-xl px-2 py-2 text-[10px] font-semibold uppercase tracking-widest transition ${
                statusFilter === item.value ? "bg-white text-black" : "text-brand-text-muted hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setViewMode("feed")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              viewMode === "feed" ? "bg-brand-500 text-black" : "text-brand-text-muted hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <List size={14} /> Feed
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              viewMode === "grid" ? "bg-brand-500 text-black" : "text-brand-text-muted hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <Grid3X3 size={14} /> Grade
          </button>
        </div>
      </section>

      <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 md:grid-cols-3" : "grid grid-cols-1 gap-4"}>
        {filteredPosts.map((post) => {
          const warningCount = post.warning_count || 0;
          const canBlock = warningCount >= 3 && !post.creator_blocked;
          const isReviewOpen = openReviewId === post.id;
          const compact = viewMode === "grid";
          const reviewDraft = getReviewDraft(post.id);
          const actionCopy = reviewActionCopy[reviewDraft.action];

          return (
            <article key={post.id} className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
              <div className="absolute right-3 top-3 z-20">
                <button
                  type="button"
                  onClick={() => setOpenReviewId((current) => (current === post.id ? null : post.id))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur transition hover:text-brand-300"
                  aria-label="Abrir revisao do conteudo"
                  aria-expanded={isReviewOpen}
                >
                  {isReviewOpen ? <X size={15} /> : <MoreVertical size={16} />}
                </button>
              </div>

              <AdminMediaPreview post={post} compact={compact} />

              <div className={`space-y-3 ${compact ? "p-3" : "p-4"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand-500/20 bg-brand-500/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-brand-300">
                    {getAccessLabel(post)}
                  </span>
                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest ${
                    getStatus(post) === "removed"
                      ? "border-red-500/20 bg-red-500/10 text-red-300"
                      : "border-white/10 bg-white/[0.06] text-white"
                  }`}>
                    {getStatusLabel(post)}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">@{post.author?.handle || "sem-autor"}</p>
                  <p className="mt-1 text-[11px] text-brand-text-muted">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString("pt-BR") : "Sem data"}
                  </p>
                  <p className={`mt-2 text-sm font-light leading-6 text-white ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
                    {post.content || <span className="italic opacity-50">Sem legenda</span>}
                  </p>
                </div>

                {isReviewOpen ? (
                  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.035] p-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-brand-text-muted">
                      <span>Advertencias do creator</span>
                      <span className="rounded-full bg-white/[0.06] px-2 py-1 font-semibold text-white">
                        {warningCount}
                      </span>
                    </div>
                    {post.creator_blocked ? (
                      <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        Creator bloqueado
                      </p>
                    ) : null}

                    <label className="block space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">
                        Acao de revisao
                      </span>
                      <select
                        value={reviewDraft.action}
                        onChange={(event) =>
                          updateReviewDraft(post.id, {
                            action: event.target.value as MediaReviewAction,
                            message: "",
                          })
                        }
                        className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-brand-500/50"
                      >
                        {reviewActionOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-black text-white">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-text-muted">
                        {actionCopy.label}
                      </span>
                      <textarea
                        value={reviewDraft.message}
                        onChange={(event) => updateReviewDraft(post.id, { message: event.target.value })}
                        placeholder={actionCopy.placeholder}
                        rows={4}
                        className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-brand-text-muted/50 focus:border-brand-500/40"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleSubmitReview(post)}
                      disabled={isPending}
                      className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${actionCopy.buttonClass}`}
                    >
                      <Send size={16} /> {actionCopy.button}
                    </button>

                    {canBlock ? (
                      <button
                        type="button"
                        onClick={() => handleBlock(post)}
                        disabled={isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Ban size={16} /> Banir/Bloquear creator
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
