import Image from "next/image";
import Link from "next/link";
import {
  Crown,
  FolderKanban,
  ImagePlus,
  LockKeyhole,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { deletePost, getMyPosts } from "@/lib/actions/posts";
import { parsePostMediaAsset } from "@/lib/media/post-media";

export const metadata = { title: "Meus Conteúdos | Fantasyia" };

type CreatorPost = Awaited<ReturnType<typeof getMyPosts>>[number];

export default async function CreatorPostsPage() {
  const posts = await getMyPosts();
  const ppvPosts = posts.filter((post) => Number.parseFloat(post.price || "0") > 0).length;
  const premiumPosts = posts.filter(
    (post) => post.access_tier === "premium" && Number.parseFloat(post.price || "0") <= 0
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-brand-400">
          <FolderKanban size={12} />
          Operação de Conteúdo
        </div>
        <h1 className="text-2xl font-semibold text-white">Catálogo Ativo</h1>
        <p className="text-sm text-brand-text-muted">
          Gerencie suas publicações, tiers de acesso e conteúdos pay-per-view.
        </p>
      </div>

      {/* Primary Action */}
      <Link
        href="/dashboard/creator/posts/create"
        className="brand-gradient-btn flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-black shadow-lg"
      >
        <Plus size={16} />
        Criar nova publicação
      </Link>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Stats Summary */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/5 bg-brand-surface-low px-4 py-3">
          <span className="text-xl font-medium text-white">{posts.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Total</span>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/5 bg-brand-surface-low px-4 py-3">
          <span className="text-xl font-medium text-brand-400">{premiumPosts}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">Membros</span>
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-xl border border-brand-500/10 bg-brand-500/5 px-4 py-3">
          <span className="text-xl font-medium text-brand-300">{ppvPosts}</span>
          <span className="text-[10px] uppercase tracking-wider text-brand-text-muted">PPV</span>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Feed do Perfil</h2>
          <Link
            href="/dashboard/creator/messages"
            className="flex items-center gap-1.5 text-xs text-brand-text-muted hover:text-white"
          >
            Ver inbox <LockKeyhole size={12} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-brand-surface-low py-10">
            <ImagePlus size={32} className="text-brand-text-muted/50 mb-3" />
            <p className="text-sm text-brand-text-muted">Nenhum conteúdo ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post: CreatorPost) => {
              const isPpv = Number.parseFloat(post.price || "0") > 0;
              const mediaAsset = parsePostMediaAsset(post.media_url);
              const isVideoPost = post.post_type === "video" || mediaAsset.isVideo;

              return (
                <article
                  key={post.id}
                  className="flex gap-4 rounded-xl border border-white/5 bg-brand-surface-low p-3 transition hover:border-white/10"
                >
                  {/* Thumbnail */}
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-surface-lowest">
                    {mediaAsset.mediaUrl ? (
                      isVideoPost ? (
                        <>
                          {mediaAsset.posterUrl ? (
                            <Image src={mediaAsset.posterUrl} alt="Miniatura de video" fill unoptimized className="object-cover" />
                          ) : (
                            <video src={mediaAsset.mediaUrl} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          )}
                          <div className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                            <Video size={10} className="inline-block" />
                          </div>
                        </>
                      ) : (
                        <Image
                          src={mediaAsset.mediaUrl}
                          alt="Thumbnail"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-text-muted/30">
                        <ImagePlus size={20} />
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between">
                        <span
                          className={`inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                            isPpv
                              ? "text-brand-400"
                              : post.access_tier === "premium"
                                ? "text-brand-text-muted"
                                : "text-white"
                          }`}
                        >
                          {isPpv ? (
                            <>
                              <Crown size={10} /> R$ {post.price}
                            </>
                          ) : post.access_tier === "premium" ? (
                            "Membros"
                          ) : (
                            "Grátis"
                          )}
                        </span>
                        
                        <form
                          action={async () => {
                            "use server";
                            await deletePost(post.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-red-400/50 hover:text-red-400"
                            title="Excluir post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-snug text-white">
                        {post.content || "Sem descrição"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-brand-text-muted">
                      <span>{new Date(post.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
                      <span>•</span>
                      <span>{post.likes?.length || 0} curtidas</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
