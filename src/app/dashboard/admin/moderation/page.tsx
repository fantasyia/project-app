import { getGlobalFeedAudit } from "@/lib/actions/admin";
import { ModerationClient } from "./moderation-client";

export const metadata = { title: "Moderacao | Admin Fantasyia" };

export default async function AdminModerationPage() {
  const posts = await getGlobalFeedAudit();

  return (
    <div className="w-full space-y-6 px-4 py-5 pb-24">
      <div className="rounded-[32px] border border-white/8 bg-white/[0.035] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-brand-300">Content risk</p>
        <h1 className="mt-3 text-4xl font-thin tracking-[-0.05em] text-white">
          Moderacao <span className="text-brand-500">de midia</span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">
          Ponto de checagem global para posts livres, premium e PPV.
        </p>
      </div>

      <ModerationClient initialPosts={posts} />
    </div>
  );
}
