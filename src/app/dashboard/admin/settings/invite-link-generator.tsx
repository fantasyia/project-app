"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, Mail, MessageCircle } from "lucide-react";
import { generateRoleInviteLink } from "@/lib/actions/auth";

const roleOptions = [
  { value: "creator", label: "Creator Studio" },
  { value: "affiliate", label: "Afiliado" },
  { value: "editor", label: "Blog" },
  { value: "subscriber", label: "User" },
];

export function InviteLinkGenerator() {
  const [isPending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const shareMessage = inviteUrl
    ? `Voce recebeu um convite para criar sua conta no Fantasyia: ${inviteUrl}`
    : "";
  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
    : "";
  const mailtoUrl = inviteUrl
    ? `mailto:?subject=${encodeURIComponent("Convite Fantasyia")}&body=${encodeURIComponent(shareMessage)}`
    : "";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await generateRoleInviteLink(formData);
      if (result?.error) {
        setError(result.error);
        setInviteUrl("");
        return;
      }
      setInviteUrl(result.inviteUrl || "");
    });
  }

  return (
    <div id="convites" className="scroll-mt-28 rounded-[28px] border border-brand-500/15 bg-brand-500/[0.06] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
        <Link2 size={18} />
      </div>
      <h2 className="mt-5 text-lg font-light text-white">Convites por area</h2>
      <p className="mt-2 text-sm leading-6 text-brand-text-muted">
        Gere um link unico para Creator, Afiliado, Blog ou User. A opcao Admin nao fica disponivel por link publico.
      </p>

      <form action={handleSubmit} className="mt-5 space-y-3">
        <select
          name="role"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-brand-500/40"
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value} className="bg-black">
              {role.label}
            </option>
          ))}
        </select>

        <input
          name="note"
          placeholder="Nick/nota para identificar o convite"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-brand-text-muted/50 focus:border-brand-500/40"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-bold text-black transition hover:bg-brand-400 disabled:opacity-60"
        >
          {isPending ? "Gerando..." : "Gerar link"}
        </button>
      </form>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      {inviteUrl ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/40 p-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">Link gerado</p>
          <p className="mt-2 break-all text-xs leading-5 text-brand-text-base">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(inviteUrl)}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white"
          >
            <Copy size={13} />
            Copiar
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-300"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
            <a
              href={mailtoUrl}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white"
            >
              <Mail size={13} />
              Email
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
