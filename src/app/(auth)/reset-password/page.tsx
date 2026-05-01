"use client";

import Link from "next/link";
import { useState } from "react";
import { updatePassword } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await updatePassword(formData);
    if (result?.error) setError(result.error);
    if (result?.message) setMessage(result.message);
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <h1 className="text-xl font-semibold text-white">Nova senha</h1>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">
          Defina uma senha nova para a conta autenticada pelo link de recuperacao.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
          Nova senha
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
          Confirmar senha
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          placeholder="Repita a nova senha"
          className="w-full border-0 border-b border-white/20 bg-transparent px-1 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-brand-500"
        />
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {message ? <p className="text-xs leading-5 text-brand-300">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "SALVANDO..." : "SALVAR NOVA SENHA"}
      </button>

      <p className="text-center text-sm text-brand-text-muted">
        Voltar para{" "}
        <Link href="/login" className="text-brand-500 hover:underline">
          login
        </Link>
      </p>
    </form>
  );
}
