import { getCurrentUser } from "@/lib/actions/auth";

export const metadata = { title: "Ajustes | Afiliado Fantasyia" };

export default async function AffiliateSettingsPage() {
  const user = await getCurrentUser("affiliate");

  const items = [
    { label: "Nome", value: user?.display_name || "Nao informado" },
    { label: "E-mail", value: user?.email || "Nao informado" },
    { label: "Handle", value: user?.handle ? `@${user.handle}` : "Nao informado" },
    { label: "Perfil", value: "Afiliado" },
  ];

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Conta</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Ajustes <span className="text-brand-500">do afiliado</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Dados basicos da conta usada para links e comissoes.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-[24px] border border-white/8 bg-black/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-text-muted">{item.label}</p>
            <p className="mt-2 text-sm text-white">{item.value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
