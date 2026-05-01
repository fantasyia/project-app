import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  ChevronRight,
  CreditCard,
  History,
  LogOut,
  Settings,
} from "lucide-react";
import { getCurrentUser, signOut } from "@/lib/actions/auth";

export const metadata = { title: "Minha Conta | Fantasyia" };

export default async function AccountPage() {
  const user = await getCurrentUser("subscriber");
  const joinedLabel = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      })
    : "agora";

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center px-6 pb-6 pt-8">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-brand-surface-high">
          {user?.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt="Perfil"
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-2xl font-semibold text-brand-400">
              {user?.display_name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
        <h1 className="mt-3 text-xl font-semibold text-white">
          {user?.display_name || "Usuario"}
        </h1>
        <p className="mt-0.5 text-sm text-brand-text-muted">
          @{user?.handle || "sem-handle"}
        </p>
        <p className="mt-1 text-xs text-brand-text-muted">
          Membro desde {joinedLabel}
        </p>
        <Link
          href="/dashboard/user/account/edit"
          className="mt-4 rounded-lg border border-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/5"
        >
          Editar perfil
        </Link>
      </div>

      <div className="h-px bg-white/[0.06]" />

      <nav className="flex flex-col">
        {[
          {
            href: "/dashboard/user/purchases",
            label: "Compras",
            description: "Historico de unlocks e pagamentos",
            icon: History,
          },
          {
            href: "/dashboard/user/bookmarks",
            label: "Salvos",
            description: "Conteudos favoritados",
            icon: Bookmark,
          },
          {
            href: "/dashboard/user/notifications",
            label: "Notificacoes",
            description: "Alertas e atualizacoes",
            icon: Bell,
          },
          {
            href: "/pricing",
            label: "Planos",
            description: "Assinaturas disponiveis",
            icon: CreditCard,
          },
          {
            href: "/dashboard/user/account",
            label: "Configuracoes",
            description: "Conta, privacidade e seguranca",
            icon: Settings,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="flex items-center gap-3.5 border-b border-white/[0.04] px-4 py-3.5 transition hover:bg-white/[0.02]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface-low">
                <Icon size={18} className="text-brand-text-muted" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-white">{item.label}</span>
                <p className="text-xs text-brand-text-muted">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-brand-text-muted" />
            </Link>
          );
        })}

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3.5 px-4 py-3.5 transition hover:bg-red-900/10"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10">
              <LogOut size={18} className="text-red-400" strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium text-red-400">Sair da conta</span>
              <p className="text-xs text-red-400/60">Encerrar sessao</p>
            </div>
          </button>
        </form>
      </nav>
    </div>
  );
}
