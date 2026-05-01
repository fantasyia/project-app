"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useRef, useState, useTransition } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { updateSubscriberProfile } from "@/lib/actions/auth";

type SubscriberProfileFormProps = {
  user: {
    display_name: string | null;
    handle: string | null;
    bio: string | null;
    avatar_url: string | null;
    email: string | null;
  };
};

export function SubscriberProfileEditForm({ user }: SubscriberProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateSubscriberProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.push("/dashboard/user/account");
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(URL.createObjectURL(file));
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/10 bg-brand-surface-high">
          {avatarPreview ? (
            <Image src={avatarPreview} alt={user.display_name || "Avatar"} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-3xl font-bold text-brand-300">
              {user.display_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full brand-gradient text-black shadow-md">
            <Camera size={14} />
            <input
              type="file"
              name="avatar_file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <p className="text-xs text-brand-text-muted">Toque para trocar avatar</p>
        <input
          type="hidden"
          name="avatar_url"
          value={avatarPreview && !avatarPreview.startsWith("blob:") ? avatarPreview : ""}
          readOnly
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-xs font-medium text-brand-text-muted">
          Nome exibido
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={user.display_name || ""}
          placeholder="Seu nome no app"
          className="rounded-xl border border-white/10 bg-brand-surface-low px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/50 focus:border-brand-500/40 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="handle" className="text-xs font-medium text-brand-text-muted">
          Handle publico
        </label>
        <div className="flex items-center gap-0 rounded-xl border border-white/10 bg-brand-surface-low focus-within:border-brand-500/40 focus-within:ring-1 focus-within:ring-brand-500/20">
          <span className="pl-4 text-sm text-brand-text-muted">@</span>
          <input
            id="handle"
            name="handle"
            type="text"
            defaultValue={user.handle || ""}
            placeholder="seu_handle"
            className="flex-1 bg-transparent px-1.5 py-3 text-sm text-white placeholder:text-brand-text-muted/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-xs font-medium text-brand-text-muted">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={user.bio || ""}
          placeholder="Conte um pouco sobre voce"
          className="resize-none rounded-xl border border-white/10 bg-brand-surface-low px-4 py-3 text-sm text-white placeholder:text-brand-text-muted/50 focus:border-brand-500/40 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-brand-text-muted">Email</label>
        <div className="rounded-xl border border-white/[0.06] bg-brand-surface-lowest px-4 py-3 text-sm text-brand-text-muted">
          {user.email || "Nao informado"}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      ) : null}
      {saved ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-400">
          <Check size={14} /> Perfil atualizado.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="brand-gradient-btn flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-black transition disabled:opacity-60"
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
        {isPending ? "Salvando..." : "Salvar alteracoes"}
      </button>
    </form>
  );
}
