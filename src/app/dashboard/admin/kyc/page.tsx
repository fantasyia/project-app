import { getPendingKycCreators } from "@/lib/actions/admin";
import { KycClient } from "./kyc-client";

export const metadata = { title: "KYC | Admin Fantasyia" };

export default async function AdminKycPage() {
  const pendingCreators = await getPendingKycCreators();

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Trust desk</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Validacao <span className="text-brand-500">KYC</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          {pendingCreators.length} creators aguardando verificacao de identidade.
        </p>
      </div>

      <KycClient initialPending={pendingCreators} />
    </div>
  );
}
