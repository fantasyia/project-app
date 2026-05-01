"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithGoogle, signUp } from "@/lib/actions/auth";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const invite =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("invite") : null;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {invite ? <input type="hidden" name="invite" value={invite} /> : null}

      <button
        formAction={signInWithGoogle}
        formNoValidate
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white transition hover:border-brand-500/30 hover:bg-brand-500/10"
      >
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-brand-text-muted">
        <span className="h-px flex-1 bg-white/10" />
        ou criar com email
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-xs leading-5 text-brand-text-muted">
        {invite
          ? "Convite administrativo detectado. O tipo de conta sera aplicado automaticamente."
          : "Todo cadastro publico entra como usuario consumidor. Demais areas internas exigem convite do administrador."}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
          Nome Completo
        </label>
        <input
          name="displayName"
          type="text"
          required
          placeholder="Seu nome"
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
        />
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
          minLength={6}
          placeholder="Minimo 6 caracteres"
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
          Data de Nascimento
        </label>
        <input
          name="birthDate"
          type="date"
          required
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors [color-scheme:dark] focus:border-brand-500"
        />
      </div>

      {error && <p className="text-xs tracking-wide text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "CADASTRANDO..." : "CRIAR CONTA"}
      </button>

      <p className="text-center text-sm font-light text-brand-text-muted">
        Ja tem conta?{" "}
        <Link href="/login" className="text-brand-500 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
