import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = {
  title: "Fantasyia - Universo Premium",
  description: "Plataforma de conteudo premium mobile-first para creators e assinantes.",
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen justify-center bg-black text-brand-text">
      <div className="app-shell flex flex-col md:border-x md:border-white/[0.04]">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.06] bg-black/90 px-4 py-3 backdrop-blur-md">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            Fantasy<span className="text-brand-500">ia</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? null : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-brand-text-muted transition hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-brand-400"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-white/[0.06] px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-brand-text-muted">
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/refund" className="transition hover:text-white">Refund</Link>
            <Link href="/dmca" className="transition hover:text-white">DMCA</Link>
            <Link href="/ai-disclaimer" className="transition hover:text-white">AI Disclaimer</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
