import Link from "next/link";
import { FileText, Layers, PenLine } from "lucide-react";

export function MiniWordPressHeader({
  eyebrow = "FantasyIA Editor",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="border-b border-white/10 bg-[#1d1c24] px-5 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-xs font-bold text-cyan-300">
            FIA
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">{eyebrow}</p>
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-orange-300 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            <p className="text-xs text-white/55">{description}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 pr-12">
          <AdminNav href="/dashboard/blog" label="Conteudo" icon={<FileText size={14} />} />
          <AdminNav href="/dashboard/blog/silos" label="Silos" icon={<Layers size={14} />} />
          <AdminNav href="/dashboard/blog/create" label="Novo post" icon={<PenLine size={14} />} primary />
        </nav>
      </div>
    </header>
  );
}

function AdminNav({
  href,
  label,
  icon,
  primary,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-bold ${
        primary
          ? "border-cyan-300/40 bg-cyan-300 text-black shadow-[0_0_18px_rgba(103,232,249,0.28)]"
          : "border-white/15 bg-white/[0.03] text-white hover:border-cyan-300/45"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
