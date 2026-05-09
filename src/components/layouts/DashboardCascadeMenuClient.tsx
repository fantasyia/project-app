"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function DashboardCascadeMenuClient({
  label,
  fallbackTriggerLabel,
  items,
  children,
}: {
  label: string;
  fallbackTriggerLabel?: string;
  items: Array<{ href: string; label: string }>;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const matchItem = (href: string) => {
    const [basePath, hash] = href.split("#");

    if (hash) {
      return pathname === basePath && typeof window !== "undefined" && window.location.hash === `#${hash}`;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const activeItem =
    items
      .filter((item) => matchItem(item.href))
      .sort((left, right) => right.href.length - left.href.length)[0] || null;
  const triggerLabel = activeItem?.label || fallbackTriggerLabel || "Menu";

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-white transition hover:border-brand-500/30 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500/70"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]">
          <Menu size={15} className="text-brand-300" strokeWidth={1.7} />
          {triggerLabel}
        </span>
        {isOpen ? (
          <X size={16} className="text-brand-text-muted" strokeWidth={1.7} />
        ) : (
          <Menu size={16} className="text-brand-text-muted" strokeWidth={1.7} />
        )}
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-3xl border border-white/10 bg-[#050706]/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a,button")) setIsOpen(false);
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
