"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <button
        formAction={signInWithGoogle}
        formNoValidate
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:border-brand-500/30 hover:bg-brand-500/10"
      >
        Entrar com Google
      </button>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou entrar com email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
          Senha
        </label>
        <input
          name="password"
          type="password"
          required
          placeholder="********"
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-brand-500 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>

      {error && <p className="text-xs tracking-wide text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "ENTRANDO..." : "ENTRAR"}
      </button>

      <p className="text-center text-sm font-light text-brand-text-muted">
        Nao tem conta?{" "}
        <Link href="/register" className="text-brand-500 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
