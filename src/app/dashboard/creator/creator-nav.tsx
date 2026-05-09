"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  Bell,
  MessageSquareText,
  ImagePlus,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Settings,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";

type CreatorNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number }>;
};

const navItems: CreatorNavItem[] = [
  { href: "/dashboard/creator/studio", label: "Painel", icon: LayoutDashboard },
  { href: "/dashboard/creator/posts", label: "Conteudos", icon: ImagePlus },
  { href: "/dashboard/creator/comments", label: "Comentarios", icon: MessageSquareText },
  { href: "/dashboard/creator/followers", label: "Seguidores", icon: Users },
  { href: "/dashboard/creator/plans", label: "Planos", icon: Tag },
  { href: "/dashboard/creator/messages", label: "Mensagens", icon: MessageCircle },
  { href: "/dashboard/creator/notifications", label: "Alertas", icon: Bell },
  { href: "/dashboard/creator/profile", label: "Perfil", icon: User },
  { href: "/dashboard/creator/settings", label: "Config", icon: Settings },
];

export function CreatorNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const activeItem =
    navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ||
    navItems[0];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
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
    <nav ref={navRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-white"
      >
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em]">
          <ActiveIcon size={14} className="text-brand-300" />
          {activeItem.label}
        </span>
        {isOpen ? <X size={16} className="text-brand-text-muted" /> : <Menu size={16} className="text-brand-text-muted" />}
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-black/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between border-b border-white/[0.04] px-4 py-3 text-sm transition last:border-b-0 ${
                  isActive
                    ? "bg-brand-500/10 text-brand-300"
                    : "text-brand-text-base hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon size={16} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}
