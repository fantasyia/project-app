"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  fallbackHref,
  label = "Voltar",
  className = "inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-brand-text-muted transition hover:text-brand-300",
}: {
  fallbackHref: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={goBack} className={className} aria-label={label || "Voltar"}>
      <ArrowLeft size={14} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
