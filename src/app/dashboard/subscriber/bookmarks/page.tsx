import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Bookmark, Image as ImageIcon } from "lucide-react";
import { getBookmarks, getBookmarkCollections } from "@/lib/actions/engagement";
import { parsePostMediaAsset } from "@/lib/media/post-media";

export const metadata = { title: "Salvos | Fantasyia" };

export default async function BookmarksPage() {
  const bookmarks = await getBookmarks();
  const collections = await getBookmarkCollections();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/user/feed"
            className="flex h-8 w-8 items-center justify-center rounded-full text-brand-text-muted transition hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-semibold text-white">Salvos</h1>
        </div>
        <span className="text-xs text-brand-text-muted">{bookmarks.length} itens</span>
      </div>

      {collections.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide">
          <button className="flex-shrink-0 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black">
            Todos
          </button>
          {collections.map((collection) => (
            <button
              key={collection}
              className="flex-shrink-0 rounded-full bg-brand-surface-low px-3.5 py-1.5 text-xs text-brand-text-muted transition hover:text-white"
            >
              {collection}
            </button>
          ))}
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <Bookmark size={32} className="mb-3 text-brand-text-muted" />
          <h2 className="text-base font-semibold text-white">Nada salvo ainda</h2>
          <p className="mt-1.5 text-sm text-brand-text-muted">
            Salve posts do feed para encontrar depois.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-0.5 p-0.5">
          {bookmarks.map((bookmark) => {
            const mediaAsset = parsePostMediaAsset(bookmark.post?.media_url || null);
            const isVideo = bookmark.post?.post_type === "video" || mediaAsset.isVideo;

            return (
              <div
                key={bookmark.id}
                className="group relative aspect-square overflow-hidden bg-brand-surface-low"
              >
                {!mediaAsset.mediaUrl ? (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon size={24} className="text-brand-text-muted" />
                  </div>
                ) : isVideo ? (
                  mediaAsset.posterUrl ? (
                    <Image
                      src={mediaAsset.posterUrl}
                      alt={bookmark.post?.content || "Conteudo salvo"}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <video
                      src={mediaAsset.mediaUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )
                ) : (
                  <Image
                    src={mediaAsset.mediaUrl}
                    alt={bookmark.post?.content || "Conteudo salvo"}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {bookmark.collection && bookmark.collection !== "default" && (
                  <div className="absolute right-2 top-2">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                      {bookmark.collection}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
