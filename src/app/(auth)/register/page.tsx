"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle, signUp } from "@/lib/actions/auth";
import { GoogleMark } from "@/components/auth/GoogleMark";

function friendlyOAuthError(raw: string | null): string | null {
  if (!raw) return null;
  if (raw === "google_oauth_unavailable") return "Cadastro com Google indisponível no momento.";
  if (raw.toLowerCase().includes("provider is not enabled")) return "Login com Google não está habilitado. Use email e senha.";
  return raw;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const invite = searchParams.get("invite");

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) setError(friendlyOAuthError(urlError));
  }, [searchParams]);

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
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white py-3 text-sm font-semibold text-[#3c4043] transition hover:bg-[#f8fafd]"
      >
        <GoogleMark />
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
          : "Todo cadastro publico entra como usuario no Plano Básico. Demais areas internas exigem convite do administrador."}
      </div>

      {!invite ? (
        <div className="rounded-2xl border border-brand-500/20 bg-brand-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">
            Desconto de cadastro
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Plano Básico</h2>
              <p className="text-xs leading-5 text-brand-text-muted">
                Tipo inicial da sua conta, com feed e comentarios liberados.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-text-muted line-through">R$ 19,90</p>
              <p className="text-2xl font-semibold text-brand-400">R$ 0,00</p>
            </div>
          </div>
        </div>
      ) : null}

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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.03]" />}>
      <RegisterForm />
    </Suspense>
  );
}
