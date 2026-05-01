"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  DollarSign,
  Globe,
  ImagePlus,
  LockKeyhole,
  Sparkles,
  UploadCloud,
  Video,
} from "lucide-react";
import { createPost } from "@/lib/actions/posts";

type MonetizationMode = "free" | "premium" | "ppv";

const TABS: Array<{
  value: MonetizationMode;
  label: string;
  icon: ReactNode;
  description: string;
  note: string;
}> = [
  {
    value: "free",
    label: "Gratis",
    icon: <Globe size={16} />,
    description: "Post aberto para descoberta e aquecimento do feed.",
    note: "Use para teaser, alcance e retencao.",
  },
  {
    value: "premium",
    label: "Assinatura",
    icon: <Crown size={16} />,
    description: "Conteudo exclusivo para assinantes ativos.",
    note: "Ideal para entrega recorrente e bastidores.",
  },
  {
    value: "ppv",
    label: "PPV",
    icon: <DollarSign size={16} />,
    description: "Unlock individual do post, mesmo para assinantes.",
    note: "A assinatura nao libera esse item automaticamente.",
  },
];

export function CreatePostComposer() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video">("image");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [thumbnailFileName, setThumbnailFileName] = useState("");
  const [caption, setCaption] = useState("");
  const [accessTier, setAccessTier] = useState<MonetizationMode>("free");
  const [ppvPrice, setPpvPrice] = useState("");
  const [postType, setPostType] = useState<"image" | "video">("image");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [previewUrl, thumbnailPreviewUrl]);

  const activeTab = TABS.find((tab) => tab.value === accessTier) ?? TABS[0];
  const checks = [
    { label: "Midia selecionada", ok: Boolean(previewUrl) },
    { label: "Legenda escrita", ok: caption.trim().length >= 10 },
    { label: "Monetizacao definida", ok: Boolean(accessTier) },
    { label: "Preco PPV valido", ok: accessTier !== "ppv" || Number(ppvPrice) > 0 },
  ];

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);

    if (file.type.startsWith("video/")) {
      setPreviewType("video");
      setPostType("video");
      return;
    }

    setPreviewType("image");
    setPostType("image");
    if (thumbnailPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreviewUrl);
    setThumbnailPreviewUrl(null);
    setThumbnailFileName("");
  }

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("A miniatura precisa ser uma imagem (JPG, PNG ou WEBP).");
      return;
    }

    if (thumbnailPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
    }

    setError(null);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setThumbnailFileName(file.name);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    const media = formData.get("media");
    if (!(media instanceof File) || media.size === 0) return setError("Selecione uma midia para publicar.");
    if (!caption.trim()) return setError("Adicione uma legenda antes de publicar.");
    if (accessTier === "ppv" && Number(ppvPrice) <= 0) return setError("Defina um preco valido para o PPV.");

    formData.set("postType", postType);
    formData.set("accessTier", accessTier);

    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) return setError(result.error);
      router.push("/dashboard/creator/posts");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5 pb-4">
      <section className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
        <Link
          href="/dashboard/creator/posts"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted hover:text-brand-500"
        >
          <ArrowLeft size={14} />
          Voltar aos posts
        </Link>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">
          <Sparkles size={12} />
          Creator composer
        </p>

        <h1 className="mt-4 text-4xl font-thin tracking-[-0.05em] text-white">
          Publique com <span className="text-brand-500">cara de app</span>
        </h1>
        <p className="mt-3 text-sm font-light leading-relaxed text-brand-text-base">
          Upload real para Storage, preview nativo e monetizacao por abas entre Gratis, Assinatura e PPV.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Metric label="Midia" value={previewType === "video" ? "Video" : "Imagem"} />
          <Metric label="Monetizacao" value={activeTab.label} />
        </div>
      </section>

      <form action={handleSubmit} className="space-y-5">
        <section className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-400">
              <UploadCloud size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">Upload real</p>
              <h2 className="text-2xl font-thin tracking-[-0.03em] text-white">Selecione a midia do post</h2>
            </div>
          </div>

          <label className="group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[30px] border border-dashed border-white/12 bg-[radial-gradient(circle_at_top,rgba(0,168,107,0.14),rgba(14,14,14,0.96)_58%)] hover:border-brand-500/40">
            {previewUrl ? (
              previewType === "video" ? (
                <video src={previewUrl} controls className="h-full w-full bg-black object-contain" />
              ) : (
                <Image src={previewUrl} alt="Preview da midia" fill unoptimized className="object-cover" />
              )
            ) : (
              <div className="space-y-4 px-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-brand-500/20 bg-brand-500/10 text-brand-400">
                  <ImagePlus size={28} />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-light text-white">Toque para enviar foto ou video</p>
                  <p className="text-sm font-light leading-relaxed text-brand-text-base">
                    O arquivo sobe para o bucket `post-media` quando voce publicar.
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-brand-text-muted">JPG, PNG, WEBP, MP4, WEBM</p>
              </div>
            )}
            <input name="media" type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-brand-text-base">
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
              Arquivo: {selectedFileName || "Nenhum selecionado"}
            </span>
            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-2">
              Tipo detectado: {postType === "video" ? "Video" : "Imagem"}
            </span>
          </div>

          {postType === "video" ? (
            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Miniatura (opcional)</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-brand-text-base">
                Defina uma capa personalizada para aparecer no feed e nas grades.
              </p>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/12 bg-black/25 px-4 py-3 hover:border-brand-500/30">
                <ImagePlus size={18} className="text-brand-300" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">
                    {thumbnailFileName || "Selecionar imagem de miniatura"}
                  </p>
                  <p className="text-[11px] text-brand-text-muted">JPG, PNG ou WEBP</p>
                </div>
                <input
                  type="file"
                  name="thumbnail_file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </label>

              {thumbnailPreviewUrl ? (
                <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-brand-surface-low">
                  <Image src={thumbnailPreviewUrl} alt="Preview da miniatura" fill unoptimized className="object-cover" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-400">
              {postType === "video" ? <Video size={18} /> : <ImagePlus size={18} />}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">Legenda</p>
              <h2 className="text-2xl font-thin tracking-[-0.03em] text-white">Contexto da publicacao</h2>
            </div>
          </div>

          <textarea
            name="content"
            rows={6}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Descreva o conteudo, provoque curiosidade e alinhe a expectativa de quem vai consumir."
            className="w-full rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-light leading-relaxed text-white outline-none placeholder:text-white/20 focus:border-brand-500/50"
          />
        </section>

        <section className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand-500/20 bg-brand-500/10 text-brand-400">
              <LockKeyhole size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">Monetizacao</p>
              <h2 className="text-2xl font-thin tracking-[-0.03em] text-white">Abas de acesso</h2>
            </div>
          </div>

          <div className="space-y-3">
            {TABS.map((tab) => {
              const active = accessTier === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setAccessTier(tab.value)}
                  className={`w-full rounded-[24px] border p-4 text-left ${
                    active
                      ? "border-brand-500/30 bg-brand-500/10 shadow-[0_16px_40px_rgba(0,168,107,0.14)]"
                      : "border-white/8 bg-white/[0.03] hover:border-brand-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-brand-500 text-black" : "bg-white/8 text-brand-text-base"}`}>
                      {tab.icon}
                    </div>
                    {active ? <CheckCircle2 size={18} className="text-brand-400" /> : null}
                  </div>
                  <h3 className="mt-4 text-lg font-light text-white">{tab.label}</h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-brand-text-base">{tab.description}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted">{tab.note}</p>
                </button>
              );
            })}
          </div>

          <input type="hidden" name="accessTier" value={accessTier} />
          <input type="hidden" name="postType" value={postType} />

          {accessTier === "ppv" ? (
            <div className="mt-5 rounded-[24px] border border-brand-500/20 bg-brand-500/10 p-4">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-400">Preco de unlock (BRL)</span>
                <input
                  type="number"
                  name="ppvPrice"
                  min="1"
                  step="0.01"
                  value={ppvPrice}
                  onChange={(event) => setPpvPrice(event.target.value)}
                  placeholder="29.90"
                  className="w-full rounded-2xl border border-brand-500/30 bg-black/20 px-4 py-3 text-lg font-light text-white outline-none placeholder:text-white/20 focus:border-brand-400"
                />
              </label>
              <p className="mt-3 text-sm font-light leading-relaxed text-brand-text-base">
                Esse conteudo fica travado mesmo para assinantes. O unlock acontece pelo fluxo PPV.
              </p>
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
          <Panel eyebrow="Resumo da postagem" title="O que sobe para o app">
            <div className="space-y-3">
              <Row label="Audience" value={activeTab.label} />
              <Row label="Bucket" value="post-media" />
              <Row label="Formato" value={postType === "video" ? "Video" : "Imagem"} />
              <Row label="Legenda" value={caption.trim() ? `${caption.trim().length} caracteres` : "Pendente"} />
            </div>
          </Panel>

          <Panel eyebrow="Publish checks" title="Pronto para subir?">
            <div className="space-y-3">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center justify-between rounded-[20px] border px-4 py-3 ${
                    check.ok ? "border-brand-500/20 bg-brand-500/10" : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <span className="text-sm text-white">{check.label}</span>
                  {check.ok ? (
                    <CheckCircle2 size={18} className="text-brand-400" />
                  ) : (
                    <AlertCircle size={18} className="text-brand-text-muted" />
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {error ? (
          <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-black hover:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Publicando..." : "Publicar conteudo"}
        </button>
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-text-muted">{label}</p>
      <p className="mt-2 text-xl font-thin tracking-tight text-white">{value}</p>
    </div>
  );
}

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/6 bg-brand-surface-lowest/80 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-400">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-thin tracking-[-0.03em] text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
      <span className="text-brand-text-muted">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
