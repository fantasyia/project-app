"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { forceDeletePost } from "@/lib/actions/admin";
import { Trash2 } from "lucide-react";

type ModerationPost = {
  id: string;
  media_url?: string | null;
  access_tier: string;
  price?: string | number | null;
  content?: string | null;
  author?: {
    handle?: string | null;
  } | null;
};

function getAccessLabel(post: ModerationPost) {
  const price = Number(post.price || 0);
  if (price > 0) return `PPV R$ ${post.price}`;
  if (post.access_tier === "premium") return "Assinatura";
  return "Livre";
}

export function ModerationClient({ initialPosts }: { initialPosts: ModerationPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [isPending, startTransition] = useTransition();

  function handleDelete(postId: string) {
    if (!confirm("Tem certeza que deseja remover este conteudo permanentemente do sistema?")) return;

    startTransition(async () => {
      const result = await forceDeletePost(postId);
      if (result.success) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
      } else {
        alert("Erro ao excluir: " + result.error);
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
    <div className="grid grid-cols-1 gap-4">
      {posts.map((post) => (
        <article key={post.id} className="group relative overflow-hidden rounded-[28px] border border-white/8 bg-black/30">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-brand-surface-lowest">
            {post.media_url ? (
              <Image src={post.media_url} alt="Midia publicada" fill className="object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-5 text-center">
                <p className="text-xs italic text-brand-text-muted">Sem midia anexada</p>
              </div>
            )}

            <div className="absolute left-3 top-3">
              <span className="rounded-full border border-black/20 bg-brand-500/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-black shadow-md backdrop-blur">
                {getAccessLabel(post)}
              </span>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">@{post.author?.handle || "sem-autor"}</p>
              <p className="mt-2 line-clamp-3 text-sm font-light leading-6 text-white">
                {post.content || <span className="italic opacity-50">Sem legenda</span>}
              </p>
            </div>

            <button
              onClick={() => handleDelete(post.id)}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3 text-xs font-bold uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 size={16} /> Remover
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
