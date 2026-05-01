import { BadgePercent, SlidersHorizontal, Tags } from "lucide-react";
import { InviteLinkGenerator } from "./invite-link-generator";

export const metadata = { title: "Ajustes | Admin Fantasyia" };

export default function AdminSettingsPage() {
  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Control center</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Ajustes <span className="text-brand-500">globais</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Espaco de configuracao para taxas, categorias, campanhas e limites operacionais.
        </p>
      </div>

      <div className="grid gap-3">
        <InviteLinkGenerator />
        {[
          { icon: <SlidersHorizontal size={18} />, title: "Limites", text: "Parametros operacionais e antifraude." },
          { icon: <Tags size={18} />, title: "Categorias", text: "Taxonomia global para creators, busca e conteudo." },
          { icon: <BadgePercent size={18} />, title: "Campanhas", text: "Cupons e descontos ficam separados como feature financeira futura." },
        ].map((item) => (
          <div key={item.title} className="rounded-[28px] border border-white/8 bg-black/30 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">{item.icon}</div>
            <h2 className="mt-5 text-lg font-light text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-text-muted">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
