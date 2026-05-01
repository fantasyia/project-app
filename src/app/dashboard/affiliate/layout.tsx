import Link from "next/link";
import { Coins, LayoutDashboard, Link as LinkIcon, LogOut, Settings, Users } from "lucide-react";
import { RoleSwitcher } from "@/components/auth/RoleSwitcher";

const affiliateLinks = [
  { href: "/dashboard/affiliate/overview", icon: <LayoutDashboard size={17} strokeWidth={1.6} />, label: "Geral" },
  { href: "/dashboard/affiliate/links", icon: <LinkIcon size={17} strokeWidth={1.6} />, label: "Links" },
  { href: "/dashboard/affiliate/commissions", icon: <Coins size={17} strokeWidth={1.6} />, label: "Comissoes" },
  { href: "/dashboard/affiliate/promoted", icon: <Users size={17} strokeWidth={1.6} />, label: "Promovidos" },
  { href: "/dashboard/affiliate/settings", icon: <Settings size={17} strokeWidth={1.6} />, label: "Ajustes" },
];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,168,107,0.12),transparent_34%),linear-gradient(180deg,#070908_0%,#030303_100%)] text-brand-text">
      <div className="mx-auto min-h-screen w-full max-w-md border-x border-white/8 bg-black/30 shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-black/75 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard/affiliate/overview" className="text-lg font-thin uppercase tracking-[0.2em] text-white">
              Fantasy<span className="text-brand-500">ia</span>
            </Link>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <form
                action={async () => {
                  "use server";
                  const { signOut } = await import("@/lib/actions/auth");
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300"
                  aria-label="Sair"
                >
                  <LogOut size={16} strokeWidth={1.7} />
                </button>
              </form>
            </div>
          </div>

          <div className="px-4 pb-3">
            <div className="rounded-3xl border border-brand-500/20 bg-brand-500/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-300">Affiliate Portal</p>
              <p className="mt-2 text-xs leading-5 text-brand-text-base">
                Gestao mobile de links, cliques, conversoes e comissoes.
              </p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {affiliateLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted transition hover:border-brand-500/30 hover:text-brand-300"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
