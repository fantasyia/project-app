"use client";

import { useState, useTransition } from "react";
import { createArticle } from "@/lib/actions/blog";
import { Plus } from "lucide-react";

export function WriterNewArticle() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createArticle(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="bg-brand-500 text-black flex items-center gap-2 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] hover:scale-[0.98] transition-transform">
        <Plus size={16} strokeWidth={2.5} />
        NOVO ARTIGO
      </button>

      {open && (
        <form action={handleSubmit} className="mt-6 bg-brand-surface-lowest border border-white/5 p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Título</label>
            <input name="title" type="text" required placeholder="Título do artigo" className="w-full bg-transparent border-0 border-b border-white/20 focus:border-brand-500 text-white py-3 px-1 outline-none text-sm placeholder:text-white/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Resumo</label>
            <input name="excerpt" type="text" placeholder="Resumo curto" className="w-full bg-transparent border-0 border-b border-white/20 focus:border-brand-500 text-white py-3 px-1 outline-none text-sm placeholder:text-white/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Conteúdo</label>
            <textarea name="content" rows={8} required placeholder="Escreva seu artigo..." className="w-full bg-transparent border border-white/10 focus:border-brand-500 text-white py-3 px-4 outline-none text-sm placeholder:text-white/20 resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Imagem de Capa</label>
            <input name="cover" type="file" accept="image/*" className="w-full text-sm text-brand-text-muted file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:bg-brand-500 file:text-black file:uppercase file:tracking-widest file:cursor-pointer" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={pending} className="w-full bg-brand-500 text-black py-4 font-bold text-[11px] tracking-[0.2em] uppercase hover:scale-[0.98] transition-transform disabled:opacity-50">
            {pending ? "SALVANDO..." : "SALVAR COMO RASCUNHO"}
          </button>
        </form>
      )}
    </div>
  );
}
