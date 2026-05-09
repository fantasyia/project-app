"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";

export function PrivilegedRoleMenuClient({
  align,
  children,
}: {
  align: "down" | "up";
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-brand-text-muted transition hover:border-brand-500/30 hover:text-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500/70"
        aria-label="Navegar como"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Menu size={16} strokeWidth={1.7} />
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/95 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
            align === "up" ? "bottom-11" : "top-11"
          }`}
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
