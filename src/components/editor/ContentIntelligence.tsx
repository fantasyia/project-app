import { FileText } from "lucide-react";
import type { ArticleHeading } from "@/lib/miniwordpress/article-analysis";
import { GuardianPanel } from "./GuardianPanel";
import { InternalLinksPanel } from "./InternalLinksPanel";
import { LinkHygienePanel } from "./LinkHygienePanel";
import { TermsPanel } from "./TermsPanel";

export function ContentIntelligence({
  headings,
  seoChecks,
  selectedSiloName,
  searchPanel,
  onAddTerm,
  onOpenLinkDialog,
  onImproveText,
}: {
  headings: ArticleHeading[];
  seoChecks: Array<{ label: string; ok: boolean }>;
  selectedSiloName?: string | null;
  searchPanel: React.ReactNode;
  onAddTerm?: (term: string) => void;
  onOpenLinkDialog?: () => void;
  onImproveText?: () => void;
}) {
  return (
    <aside className="h-full overflow-y-auto border-r border-white/10 bg-[#24232c] p-2">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">Inteligencia</div>
      <div className="space-y-2">
        {searchPanel}

        <Panel icon={<FileText size={14} />} title="Estrutura (H2/H3/H4)">
          {headings.length === 0 ? (
            <p className="text-xs leading-5 text-slate-400">Sem heading detectado. Use H2/H3/H4 no editor.</p>
          ) : (
            <div className="space-y-2">
              {headings.map((heading) => (
                <div key={heading.id} className="rounded-md border border-white/10 bg-[#1d1c24] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-cyan-300">H{heading.level}</p>
                  <p className="mt-1 text-xs leading-5 text-white">{heading.text}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <InternalLinksPanel selectedSiloName={selectedSiloName} onOpenLinkDialog={onOpenLinkDialog} />
        <LinkHygienePanel hasSilo={Boolean(selectedSiloName)} />
        <GuardianPanel seoChecks={seoChecks} onImproveText={onImproveText} />
        <TermsPanel onAddTerm={onAddTerm} />
      </div>
    </aside>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-white/15 bg-[#2a2933] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-300">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}
