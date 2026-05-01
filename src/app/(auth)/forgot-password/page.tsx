"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await requestPasswordReset(formData);
    if (result?.error) setError(result.error);
    if (result?.message) setMessage(result.message);
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <h1 className="text-xl font-semibold text-white">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-brand-text-muted">
          Informe o email da conta. Enviaremos um link seguro para criar uma nova senha.
        </p>
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

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      {message ? <p className="text-xs leading-5 text-brand-300">{message}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-500 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-transform hover:scale-[0.98] disabled:opacity-50"
      >
        {loading ? "ENVIANDO..." : "ENVIAR LINK"}
      </button>

      <p className="text-center text-sm text-brand-text-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-brand-500 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
