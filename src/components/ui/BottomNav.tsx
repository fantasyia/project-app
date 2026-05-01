"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GalleryVerticalEnd, Search, MessageCircle, Newspaper, User } from "lucide-react";

const navItems = [
  { name: "Feed", href: "/dashboard/user/feed", icon: GalleryVerticalEnd },
  { name: "Buscar", href: "/dashboard/user/search", icon: Search },
  { name: "Direct", href: "/dashboard/user/messages", icon: MessageCircle, isCenter: true },
  { name: "Blog", href: "/blog", icon: Newspaper },
  { name: "Perfil", href: "/dashboard/user/account", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-white/[0.06] bg-black/95 backdrop-blur-sm">
      <div className="mx-auto grid w-full grid-cols-5 md:max-w-md">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/blog" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href + "-center"}
                href={item.href}
                className="flex flex-col items-center justify-center py-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-black shadow-[0_0_16px_rgba(0,168,107,0.3)]">
                  <Icon size={22} strokeWidth={2} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                isActive ? "text-white" : "text-brand-text-muted"
              }`}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? "text-white" : ""}
              />
              <span className="text-[9px] font-medium tracking-wide">
                {item.name}
              </span>
              {isActive && (
                <div className="mt-0.5 h-1 w-1 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
