"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePenLine, FolderTree, LayoutGrid } from "lucide-react";

function resolveHeaderCopy(pathname: string) {
  if (pathname.startsWith("/dashboard/blog/editor/")) {
    return {
      title: "Editor de posts",
      subtitle: "SEO, conteudo e publicacao num fluxo continuo.",
    };
  }

  if (pathname.startsWith("/dashboard/blog/silos/") && pathname !== "/dashboard/blog/silos") {
    return {
      title: "Painel de silos",
      subtitle: "Estrutura, links internos e saude editorial do hub.",
    };
  }

  if (pathname === "/dashboard/blog/silos") {
    return {
      title: "Silos",
      subtitle: "Controle os hubs e a navegacao editorial do projeto.",
    };
  }

  if (pathname === "/dashboard/blog/create") {
    return {
      title: "Novo post",
      subtitle: "Comece pelo foco da pagina e monte a estrutura com contexto.",
    };
  }

  return {
    title: "Cockpit editorial",
    subtitle: "Operacao compacta para posts, silos e SEO tecnico.",
  };
}

function MiniWordPressHeader() {
  const pathname = usePathname();
  const copy = resolveHeaderCopy(pathname);
  const isEditorRoute = pathname.startsWith("/dashboard/blog/editor/");
  const navButtonBase = isEditorRoute
    ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] px-3 text-[11px] font-semibold shadow-[0_12px_20px_-22px_rgba(8,24,33,0.24)] transition"
    : "inline-flex h-10 items-center justify-center gap-2 rounded-[7px] px-3 text-[12px] font-semibold shadow-[0_14px_24px_-24px_rgba(8,24,33,0.24)] transition";
  const navItems = [
    {
      href: "/dashboard/blog",
      label: "Conteudo",
      icon: LayoutGrid,
      active: pathname === "/dashboard/blog",
      primary: false,
    },
    {
      href: "/dashboard/blog/silos",
      label: "Silos",
      icon: FolderTree,
      active: pathname.startsWith("/dashboard/blog/silos"),
      primary: false,
    },
    {
      href: "/dashboard/blog/create",
      label: "Novo post",
      icon: FilePenLine,
      active: pathname === "/dashboard/blog/create",
      primary: true,
    },
  ];

  return (
    <header className="admin-glass sticky top-0 z-40 border-b border-(--border-strong)">
      <div
        className={
          isEditorRoute
            ? "grid h-[56px] w-full grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-3 px-3 md:px-4"
            : "mx-auto flex h-[74px] max-w-[1800px] items-center justify-between gap-3 px-3 md:px-4"
        }
      >
        <div className="min-w-0 flex items-center gap-2.5">
          <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-(--border-strong) bg-[#2a2a30] text-sm font-black tracking-[0.03em] text-(--brand-hot) ${isEditorRoute ? "h-9 w-9 text-[12px]" : "h-11 w-11"}`}>
            FIA
          </div>

          <div className="min-w-0">
            {!isEditorRoute ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-(--muted-2)">FantasyIA editor</p>
            ) : null}
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className={`truncate font-semibold leading-none text-(--text) ${isEditorRoute ? "text-[0.92rem]" : "text-[1.05rem]"}`}>
                {copy.title}
              </h1>
              <p className="hidden truncate text-[11px] text-(--muted) xl:block">{copy.subtitle}</p>
            </div>
          </div>
        </div>

        {isEditorRoute ? (
          <div
            id="admin-editor-center-slot"
            className="admin-scrollbar flex min-w-0 items-center justify-center overflow-x-auto overflow-y-hidden"
          />
        ) : null}

        <nav className={`flex shrink-0 items-center gap-1 md:gap-1.5 ${isEditorRoute ? "justify-self-end" : ""}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={
                  item.primary
                    ? `${navButtonBase} border border-[rgba(64,209,219,0.5)] bg-[linear-gradient(180deg,#40d1db_0%,#33b8c2_100%)] font-bold text-[#0d1117]`
                    : `${navButtonBase} border border-(--border-strong) bg-transparent text-(--text) ${item.active ? "border-[rgba(64,209,219,0.5)] bg-[rgba(64,209,219,0.1)] text-(--brand-accent)" : "hover:border-[rgba(96,165,250,0.35)] hover:bg-[rgba(96,165,250,0.06)]"}`
                }
                title={item.label}
              >
                <Icon size={14} />
                <span className={isEditorRoute ? "hidden lg:inline" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function MiniWordPressFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditorRoute = pathname.startsWith("/dashboard/blog/editor/");

  return (
    <div className="admin-app flex h-screen w-screen flex-col overflow-hidden text-(--text)">
      <MiniWordPressHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isEditorRoute ? (
          <div className="h-full min-h-0 w-full">{children}</div>
        ) : (
          <div className="admin-scrollbar h-full w-full overflow-auto px-3 pb-3 md:px-4 md:pb-4">
            <div className="mx-auto min-h-full max-w-[1800px] pt-3 md:pt-4">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
