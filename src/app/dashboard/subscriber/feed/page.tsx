import Image from "next/image";
import Link from "next/link";
import { Crown, Lock, Search } from "lucide-react";
import { getFeed } from "@/lib/actions/subscriber";
import { getActiveStories } from "@/lib/actions/engagement";
import { StoriesBar } from "@/components/shared/StoriesBar";
import { parsePostMediaAsset } from "@/lib/media/post-media";
import { FeedInteractions } from "./feed-interactions";

export const metadata = { title: "Feed | Fantasyia" };

type FeedItem = Awaited<ReturnType<typeof getFeed>>[number];

export default async function FeedPage() {
  const feedItems = await getFeed();
  const stories = await getActiveStories();

  return (
    <div className="flex w-full flex-col">
      {/* Stories */}
      <StoriesBar stories={stories} />
      <div className="h-px bg-white/[0.06]" />

      {/* Timeline */}
      {feedItems.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand-surface-low">
            <Search size={28} className="text-brand-text-muted" />
          </div>
          <h2 className="text-lg font-semibold text-white">Seu feed está vazio</h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-text-muted">
            Siga creators para ver seus posts aqui.
          </p>
          <Link
            href="/dashboard/user/search"
            className="mt-6 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-400"
          >
            Explorar creators
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {feedItems.map((item: FeedItem) => {
            const { post, author, likesCount, commentsCount } = item;
            const creatorName = author?.displayName || "Creator";
            const unlockedMediaAsset = parsePostMediaAsset(post.mediaUrl);
            const previewMediaAsset = parsePostMediaAsset(post.previewMediaUrl || post.mediaUrl);
            const isVideoPost =
              post.postType === "video" || unlockedMediaAsset.isVideo || previewMediaAsset.isVideo;
            const hasMediaPreview = Boolean(
              previewMediaAsset.posterUrl || previewMediaAsset.mediaUrl
            );

            return (
              <article key={post.id} className="timeline-separator">
                {/* Post Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Link
                    href={author?.handle ? `/${author.handle}` : "/dashboard/user/search"}
                    className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-brand-surface-high"
                  >
                    {author?.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={creatorName}
                        width={36}
                        height={36}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-xs font-bold text-brand-500">
                        {creatorName[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={author?.handle ? `/${author.handle}` : "/dashboard/user/search"}
                      className="text-sm font-semibold text-white hover:underline"
                    >
                      {creatorName}
                    </Link>
                    {author?.handle && (
                      <p className="text-xs text-brand-text-muted">@{author.handle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.isPpv && (
                      <span className="rounded bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                        PPV
                      </span>
                    )}
                    {!post.isPpv && post.isLocked && (
                      <Lock size={14} className="text-brand-text-muted" />
                    )}
                  </div>
                </div>

                {/* Media */}
                {post.isLocked ? (
                  <div className="relative flex aspect-[4/5] items-center justify-center bg-brand-surface-lowest">
                    {hasMediaPreview ? (
                      isVideoPost && previewMediaAsset.mediaUrl ? (
                        <video
                          src={previewMediaAsset.mediaUrl}
                          poster={previewMediaAsset.posterUrl || undefined}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
                        />
                      ) : (
                        <Image
                          src={previewMediaAsset.posterUrl || previewMediaAsset.mediaUrl || ""}
                          alt="Preview bloqueado"
                          fill
                          unoptimized
                          className="scale-105 object-cover blur-md"
                        />
                      )
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-surface-lowest via-black/80 to-black" />
                    <div className="z-10 flex flex-col items-center px-8 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                        {post.isPpv ? (
                          <Crown size={24} className="text-brand-400" />
                        ) : (
                          <Lock size={24} className="text-brand-text-muted" />
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        {post.isPpv ? "Conteúdo PPV" : "Conteúdo exclusivo"}
                      </h3>
                      <p className="mt-1.5 text-sm text-brand-text-muted">
                        {post.isPpv
                          ? `Desbloqueie por R$ ${post.price}`
                          : `Assine ${creatorName} para acessar`}
                      </p>
                      <Link
                        href={
                          post.isPpv
                            ? `/checkout/ppv/${post.id}`
                            : author?.handle
                              ? `/${author.handle}`
                              : "/dashboard/user/search"
                        }
                        className="mt-4 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-400"
                      >
                        {post.isPpv ? "Desbloquear" : "Ver planos"}
                      </Link>
                    </div>
                  </div>
                ) : unlockedMediaAsset.mediaUrl ? (
                  <div className="relative aspect-[4/5] bg-brand-surface-lowest">
                    {isVideoPost ? (
                      <video
                        src={unlockedMediaAsset.mediaUrl}
                        poster={unlockedMediaAsset.posterUrl || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={unlockedMediaAsset.mediaUrl}
                        alt={`Post de ${creatorName}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    )}
                  </div>
                ) : null}

                {/* Interactions */}
                <FeedInteractions
                  postId={post.id}
                  likesCount={likesCount}
                  commentsCount={commentsCount}
                  creatorHandle={author?.handle}
                  creatorName={creatorName}
                />

                {/* Caption */}
                {post.content && (
                  <div className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-white">
                      <Link
                        href={author?.handle ? `/${author.handle}` : "#"}
                        className="mr-1.5 font-semibold hover:underline"
                      >
                        {creatorName}
                      </Link>
                      {post.isLocked ? (
                        <span className="pointer-events-none select-none italic text-brand-text-muted/50 blur-[2px]">
                          {post.content}
                        </span>
                      ) : (
                        post.content
                      )}
                    </p>
                    <p className="mt-1.5 text-[11px] text-brand-text-muted">
                      {new Date(post.createdAt).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
