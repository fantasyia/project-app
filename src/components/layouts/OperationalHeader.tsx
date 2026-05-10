import type { ReactNode } from "react";
import { FantasyIALogo } from "@/components/ui/FantasyIALogo";

type OperationalHeaderProps = {
  homeHref: string;
  title: string;
  actions: ReactNode;
};

export function OperationalHeader({ homeHref, title, actions }: OperationalHeaderProps) {
  return (
    <div className="relative flex min-h-14 items-center justify-between px-4 py-3">
      <FantasyIALogo href={homeHref} />
      <p className="pointer-events-none absolute left-1/2 top-1/2 max-w-[34%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[11px] font-bold uppercase tracking-[0.24em] text-white/90">
        {title}
      </p>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}
