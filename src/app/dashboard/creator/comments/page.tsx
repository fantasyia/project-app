import Image from "next/image";
import { MessageCircle, ShieldCheck, Video } from "lucide-react";
import { getCreatorCommentInbox } from "@/lib/actions/posts";
import { parsePostMediaAsset } from "@/lib/media/post-media";
import { CommentModeration } from "@/app/dashboard/creator/posts/comment-moderation";

export const metadata = { title: "Comentarios | Fantasyia" };

export default async function CreatorCommentsPage() {
  const inbox = await getCreatorCommentInbox();
  const totalThreads = inbox.reduce((sum, item) => sum + item.comments.length, 0);

  return (
    <div className="space-y-5 pb-20">
      <section className="rounded-[28px] border border-brand-500/20 bg-brand-500/10 p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-brand-300">
          <ShieldCheck size={13} />
          Comentarios
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-white">Gestao de comentarios</h1>
        <p className="mt-2 text-sm leading-6 text-brand-text-base">
          Responda, remova ou bloqueie comentarios dos seus posts em um fluxo unico.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">Posts com conversa</p>
          <p className="mt-2 text-2xl font-light text-white">{inbox.length}</p>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-300">Threads abertas</p>
          <p className="mt-2 text-2xl font-light text-white">{totalThreads}</p>
        </div>
      </div>

      {inbox.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-brand-text-muted">
            <MessageCircle size={22} />
          </div>
          <h2 className="mt-4 text-base text-white">Sem comentarios para moderar</h2>
          <p className="mt-2 text-sm leading-6 text-brand-text-muted">
            Quando users comentarem nos seus posts, eles aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inbox.map(({ post }) => {
            const mediaAsset = parsePostMediaAsset(post.media_url || null);
            const isVideo = post.post_type === "video" || mediaAsset.isVideo;

            return (
              <article key={post.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-3">
                <div className="flex gap-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-brand-surface-lowest">
                    {mediaAsset.mediaUrl ? (
                      isVideo ? (
                        mediaAsset.posterUrl ? (
                          <Image src={mediaAsset.posterUrl} alt="Post com comentarios" fill unoptimized className="object-cover" />
                        ) : (
                          <video src={mediaAsset.mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        )
                      ) : (
                        <Image src={mediaAsset.mediaUrl} alt="Post com comentarios" fill unoptimized className="object-cover" />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-text-muted">
                        <MessageCircle size={18} />
                      </div>
                    )}
                    {isVideo ? (
                      <span className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white">
                        <Video size={10} />
                      </span>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm leading-5 text-white">{post.content || "Post sem legenda"}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-brand-text-muted">
                      {new Date(post.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <CommentModeration postId={post.id} initialCount={(post.comments || []).length} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
