import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardCascadeMenuClient } from "@/components/layouts/DashboardCascadeMenuClient";

type DashboardMenuItem = {
  href: string;
  icon: ReactNode;
  label: string;
};

type DashboardCascadeMenuProps = {
  label: string;
  items: DashboardMenuItem[];
  triggerLabel?: string;
};

export function DashboardCascadeMenu({
  label,
  items,
  triggerLabel = "Menu",
}: DashboardCascadeMenuProps) {
  return (
    <DashboardCascadeMenuClient label={label} fallbackTriggerLabel={triggerLabel} items={items.map(({ href, label }) => ({ href, label }))}>
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-300">
        Menu
      </p>

      <nav className="grid gap-1" aria-label={label}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-brand-text-base transition hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500/60"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-brand-300">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </DashboardCascadeMenuClient>
  );
}
