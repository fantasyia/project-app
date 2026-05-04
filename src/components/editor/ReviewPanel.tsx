"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, FileCheck2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEditorContext } from "@/components/editor/EditorContext";
import type { EditorMeta } from "@/components/editor/types";

type CopyRiskLevel = "low" | "medium" | "high";
type InternalScanScope = "silo" | "site";

type ExternalCopyMatch = {
  queryExcerpt: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceSnippet: string;
  similarityScore: number;
  overlapTokens: number;
  riskLevel: CopyRiskLevel;
};

type ExternalCopyAnalysis = {
  uniquenessScore: number;
  riskLevel: CopyRiskLevel;
  checkedChunks: number;
  suspectChunks: number;
  highRiskChunks: number;
  summary: string;
  matches: ExternalCopyMatch[];
};

type InternalDuplicateMatch = {
  sourcePostId: string;
  sourceTitle: string;
  sourceSlug: string;
  sourceExcerpt: string;
  chunkText: string;
  overlapTokens: number;
  similarityScore: number;
  riskLevel: CopyRiskLevel;
};

type InternalDuplicateAnalysis = {
  uniquenessScore: number;
  riskLevel: CopyRiskLevel;
  totalWords: number;
  checkedChunks: number;
  suspectChunks: number;
  highRiskChunks: number;
  comparedPosts: number;
  summary: string;
  matches: InternalDuplicateMatch[];
};

type SchemaReview = {
  schemaType: EditorMeta["schemaType"];
  score: number;
  ready: boolean;
  blockers: string[];
  warnings: string[];
  notes: string[];
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}

function buildContentSignature(text: string, meta: EditorMeta) {
  const normalized = normalizeText(text);
  return [
    normalized.split(/\s+/).filter(Boolean).length,
    normalized.length,
    hashString(normalized.slice(0, 3000)),
    normalizeText(meta.title),
    normalizeText(meta.targetKeyword),
    meta.schemaType,
  ].join(":");
}

function scoreTone(score: number) {
  if (score >= 80) return "text-(--admin-positive)";
  if (score >= 60) return "text-(--admin-warning)";
  return "text-(--admin-danger)";
}

function badgeTone(level: CopyRiskLevel) {
  if (level === "high") return "border-[rgba(143,91,73,0.16)] bg-(--admin-danger-soft) text-(--admin-danger)";
  if (level === "medium") return "border-[rgba(138,105,64,0.18)] bg-(--admin-warning-soft) text-(--admin-warning)";
  return "border-[rgba(41,94,82,0.18)] bg-(--admin-positive-soft) text-(--admin-positive)";
}

function detectFaqContent(text: string, html: string) {
  return (
    /data-type=["']faq-block["']/i.test(html) ||
    /\b(perguntas frequentes|faq|duvidas frequentes|dúvidas frequentes)\b/i.test(text)
  );
}

function buildSchemaReview(meta: EditorMeta, text: string, html: string): SchemaReview {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];
  let score = 100;

  const hasFaqInContent = detectFaqContent(text, html);
  const schemaType = meta.schemaType ?? "article";

  if (schemaType === "review") {
    if (!Array.isArray(meta.amazonProducts) || meta.amazonProducts.length === 0) {
      blockers.push("Schema Review exige pelo menos 1 produto vinculado.");
      score -= 35;
    } else {
      notes.push(`${meta.amazonProducts.length} produto(s) vinculado(s) ao review.`);
    }
  }

  if (schemaType === "howto") {
    if (!Array.isArray(meta.howto) || meta.howto.length === 0) {
      blockers.push("Schema HowTo exige passos preenchidos.");
      score -= 35;
    } else {
      notes.push(`${meta.howto.length} passo(s) configurado(s) no HowTo.`);
    }
  }

  if (schemaType === "faq") {
    if (!Array.isArray(meta.faq) || meta.faq.length === 0) {
      if (hasFaqInContent) {
        warnings.push("FAQ detectado no texto, mas sem perguntas estruturadas no schema.");
        score -= 12;
      } else {
        blockers.push("Schema FAQ exige perguntas e respostas estruturadas.");
        score -= 35;
      }
    } else {
      notes.push(`${meta.faq.length} pergunta(s) configurada(s) no FAQ.`);
    }
  }

  if (schemaType === "article" && hasFaqInContent) {
    warnings.push("FAQ detectado no conteúdo. Avalie trocar o schema para FAQ.");
    score -= 8;
  }

  if (schemaType !== "article" && (!meta.sources || meta.sources.length === 0)) {
    warnings.push("Adicione fontes para sustentar o schema e a revisão editorial.");
    score -= 8;
  }

  if (!meta.metaDescription?.trim()) {
    warnings.push("Meta description vazia. Revise antes de publicar.");
    score -= 6;
  }

  return {
    schemaType,
    score: Math.max(0, score),
    ready: blockers.length === 0,
    blockers,
    warnings,
    notes,
  };
}

function StatCard({
  label,
  value,
  tone,
  helper,
}: {
  label: string;
  value: string;
  tone: string;
  helper: string;
}) {
  return (
    <div className="admin-subpane p-3">
      <div className="text-[10px] font-semibold uppercase text-(--muted)">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-[10px] text-(--muted)">{helper}</div>
    </div>
  );
}

function ResultPlaceholder({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgba(58,88,95,0.95)] bg-[rgba(68,68,68,0.94)] px-3 py-2.5 text-[11px] font-medium leading-relaxed text-[rgba(207,219,225,0.92)]">
      {text}
    </div>
  );
}

export function ReviewPanel() {
  const { editor, docText, docHtml, meta, postId } = useEditorContext();
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalAnalysis, setExternalAnalysis] = useState<ExternalCopyAnalysis | null>(null);
  const [externalSignature, setExternalSignature] = useState<string | null>(null);

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalAnalysis, setInternalAnalysis] = useState<InternalDuplicateAnalysis | null>(null);
  const [internalSignature, setInternalSignature] = useState<string | null>(null);
  const [internalScope, setInternalScope] = useState<InternalScanScope>("silo");
  const [internalScopeAtScan, setInternalScopeAtScan] = useState<InternalScanScope>("silo");

  const currentText = useMemo(() => (docText || editor?.getText() || "").trim(), [docText, editor]);
  const currentWordCount = useMemo(
    () => currentText.split(/\s+/).filter(Boolean).length,
    [currentText]
  );
  const currentSignature = useMemo(() => buildContentSignature(currentText, meta), [currentText, meta]);
  const schemaReview = useMemo(() => buildSchemaReview(meta, currentText, docHtml), [meta, currentText, docHtml]);

  const externalStale = Boolean(externalAnalysis && externalSignature && externalSignature !== currentSignature);
  const internalStale = Boolean(
    internalAnalysis &&
      internalSignature &&
      (internalSignature !== currentSignature || internalScopeAtScan !== internalScope)
  );

  const runExternalScan = async () => {
    if (currentWordCount < 80) {
      setExternalError("Escreva pelo menos 80 palavras para estimar unicidade externa.");
      setExternalAnalysis(null);
      return;
    }

    setExternalLoading(true);
    setExternalError(null);
    try {
      const response = await fetch("/api/seo/plagiarism", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentText,
          maxQueries: 6,
          num: 5,
          hl: "pt-BR",
          gl: "BR",
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.ok) {
        setExternalError(json?.message || json?.error || "Falha ao escanear a web.");
        setExternalAnalysis(null);
        return;
      }

      setExternalAnalysis(json.analysis as ExternalCopyAnalysis);
      setExternalSignature(currentSignature);
    } catch (error: any) {
      setExternalError(error?.message || "Falha ao escanear a web.");
      setExternalAnalysis(null);
    } finally {
      setExternalLoading(false);
    }
  };

  const runInternalScan = async () => {
    if (currentWordCount < 80) {
      setInternalError("Escreva pelo menos 80 palavras para revisar duplicacao interna.");
      setInternalAnalysis(null);
      return;
    }

    if (internalScope === "silo" && !meta.siloId) {
      setInternalError("Selecione um silo para comparar com o silo atual.");
      setInternalAnalysis(null);
      return;
    }

    setInternalLoading(true);
    setInternalError(null);
    try {
      const response = await fetch("/api/seo/internal-duplication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          siloId: meta.siloId || undefined,
          text: currentText,
          targetKeyword: meta.targetKeyword,
          maxMatches: 8,
          scope: internalScope,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json?.ok) {
        setInternalError(json?.message || json?.error || "Falha ao revisar duplicacao interna.");
        setInternalAnalysis(null);
        return;
      }

      setInternalAnalysis(json.analysis as InternalDuplicateAnalysis);
      setInternalSignature(currentSignature);
      setInternalScopeAtScan(internalScope);
    } catch (error: any) {
      setInternalError(error?.message || "Falha ao revisar duplicacao interna.");
      setInternalAnalysis(null);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="admin-subpane p-3 text-[11px] text-(--muted)">
        <div className="font-semibold uppercase text-(--text)">Revisão manual</div>
        <p className="mt-1">
          As verificacoes abaixo não rodam no autosave. Rode apenas quando quiser conferir o texto antes de publicar.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Web / SERP"
          value={externalAnalysis ? `${externalAnalysis.uniquenessScore}%` : "Pendente"}
          tone={externalAnalysis ? scoreTone(externalAnalysis.uniquenessScore) : "text-(--muted-2)"}
          helper="Plagio externo"
        />
        <StatCard
          label="Interno"
          value={internalAnalysis ? `${internalAnalysis.uniquenessScore}%` : "Pendente"}
          tone={internalAnalysis ? scoreTone(internalAnalysis.uniquenessScore) : "text-(--muted-2)"}
          helper={internalScope === "site" ? "Site inteiro" : "Silo atual"}
        />
        <StatCard
          label="Schema"
          value={`${schemaReview.score}%`}
          tone={scoreTone(schemaReview.score)}
          helper={schemaReview.ready ? "Pronto" : "Ajustar"}
        />
      </div>

      <section className="admin-subpane space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase text-(--muted)">Plagio Externo</div>
            <div className="text-[10px] text-(--muted)">Usa busca web/SERP para estimar unicidade.</div>
          </div>
          {externalAnalysis ? (
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${badgeTone(externalAnalysis.riskLevel)}`}>
              {externalAnalysis.riskLevel}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={runExternalScan}
          disabled={externalLoading}
          className="admin-button-primary flex w-full disabled:opacity-50"
        >
          <Search size={14} />
          {externalLoading ? "Escaneando web..." : "Escanear web"}
        </button>

        {externalStale ? (
          <div className="rounded-xl border border-[rgba(138,105,64,0.18)] bg-(--admin-warning-soft) p-2 text-[10px] text-(--admin-warning)">
            O texto mudou desde o ultimo scan externo. Revise novamente antes de publicar.
          </div>
        ) : null}

        {externalError ? (
          <div className="rounded-xl border border-[rgba(143,91,73,0.16)] bg-(--admin-danger-soft) p-2 text-[11px] text-(--admin-danger)">{externalError}</div>
        ) : null}

        {!externalAnalysis && !externalError ? (
          <ResultPlaceholder text="Rode o scan manual para gerar uma pontuacao estimada de unicidade externa." />
        ) : null}

        {externalAnalysis ? (
          <div className="space-y-3 rounded-2xl border border-(--border) bg-(--surface) p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase text-(--muted)">Pontuacao estimada</div>
                <div className={`text-xl font-bold ${scoreTone(externalAnalysis.uniquenessScore)}`}>
                  {externalAnalysis.uniquenessScore}%
                </div>
              </div>
              <div className="text-right text-[10px] text-(--muted)">
                <div>Trechos: {externalAnalysis.checkedChunks}</div>
                <div>Suspeitos: {externalAnalysis.suspectChunks}</div>
                <div>Alto risco: {externalAnalysis.highRiskChunks}</div>
              </div>
            </div>

            <p className="text-[11px] text-(--muted)">{externalAnalysis.summary}</p>

            {externalAnalysis.matches.length > 0 ? (
              <div className="space-y-2">
                {externalAnalysis.matches.slice(0, 3).map((match, index) => (
                  <div key={`${match.sourceUrl}-${index}`} className="rounded-2xl border border-(--border) bg-(--surface-muted) p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${badgeTone(match.riskLevel)}`}>
                        {(match.similarityScore * 100).toFixed(0)}%
                      </span>
                      <span className="truncate text-[10px] text-(--muted)">{match.sourceDomain}</span>
                    </div>
                    <a
                      href={match.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 truncate text-[11px] font-medium text-(--brand-hot) hover:underline"
                      title={match.sourceTitle}
                    >
                      {match.sourceTitle}
                      <ExternalLink size={10} />
                    </a>
                    <div className="mt-1 text-[10px] text-(--muted)">
                      Trecho consultado: <span className="text-(--text)">{match.queryExcerpt}</span>
                    </div>
                    {match.sourceSnippet ? (
                      <p className="mt-1 line-clamp-2 text-[10px] text-(--text)">{match.sourceSnippet}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(41,94,82,0.18)] bg-(--admin-positive-soft) p-2 text-[11px] text-(--admin-positive)">
                <ShieldCheck size={12} />
                Nenhum indicio forte encontrado nos trechos externos avaliados.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="admin-subpane space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase text-(--muted)">Duplicacao Interna</div>
            <div className="text-[10px] text-(--muted)">Serve para detectar canibalizacao e repeticao de texto.</div>
          </div>
          {internalAnalysis ? (
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${badgeTone(internalAnalysis.riskLevel)}`}>
              {internalAnalysis.riskLevel}
            </span>
          ) : null}
        </div>

        <div className="flex gap-2">
          {(["silo", "site"] as InternalScanScope[]).map((scope) => (
            <button
              key={scope}
              type="button"
              onClick={() => setInternalScope(scope)}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase ${
                internalScope === scope
                  ? "border-[rgba(64,209,219,0.62)] bg-(--surface) text-(--brand-accent)"
                  : "border-(--border) bg-(--surface-muted) text-(--text)"
              }`}
            >
              {scope === "silo" ? "Silo atual" : "Site inteiro"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={runInternalScan}
          disabled={internalLoading}
          className="admin-button-primary flex w-full disabled:opacity-50"
        >
          <Search size={14} />
          {internalLoading ? "Escaneando duplicacao..." : "Escanear duplicacao interna"}
        </button>

        {internalStale ? (
          <div className="rounded-xl border border-[rgba(138,105,64,0.18)] bg-(--admin-warning-soft) p-2 text-[10px] text-(--admin-warning)">
            O texto mudou desde a ultima revisão interna. Atualize o scan antes de publicar.
          </div>
        ) : null}

        {internalError ? (
          <div className="rounded-xl border border-[rgba(143,91,73,0.16)] bg-(--admin-danger-soft) p-2 text-[11px] text-(--admin-danger)">{internalError}</div>
        ) : null}

        {!internalAnalysis && !internalError ? (
          <ResultPlaceholder text="Rode o scan interno para comparar com o silo atual ou com o site inteiro." />
        ) : null}

        {internalAnalysis ? (
          <div className="space-y-3 rounded-2xl border border-(--border) bg-(--surface) p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase text-(--muted)">Pontuacao interna</div>
                <div className={`text-xl font-bold ${scoreTone(internalAnalysis.uniquenessScore)}`}>
                  {internalAnalysis.uniquenessScore}%
                </div>
              </div>
              <div className="text-right text-[10px] text-(--muted)">
                <div>Comparados: {internalAnalysis.comparedPosts}</div>
                <div>Trechos: {internalAnalysis.checkedChunks}</div>
                <div>Suspeitos: {internalAnalysis.suspectChunks}</div>
              </div>
            </div>

            <p className="text-[11px] text-(--muted)">{internalAnalysis.summary}</p>

            {internalAnalysis.matches.length > 0 ? (
              <div className="space-y-2">
                {internalAnalysis.matches.slice(0, 3).map((match, index) => (
                  <div key={`${match.sourcePostId}-${index}`} className="rounded-2xl border border-(--border) bg-(--surface-muted) p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${badgeTone(match.riskLevel)}`}>
                        {(match.similarityScore * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-(--muted)">tokens em comum: {match.overlapTokens}</span>
                    </div>
                    <a
                      href={`/admin/editor/${match.sourcePostId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 truncate text-[11px] font-medium text-(--brand-hot) hover:underline"
                      title={match.sourceTitle}
                    >
                      {match.sourceTitle}
                      <ExternalLink size={10} />
                    </a>
                    <div className="mt-1 text-[10px] text-(--muted)">/{match.sourceSlug}</div>
                    <p className="mt-2 line-clamp-2 text-[10px] text-(--text)">
                      Atual: {match.chunkText}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-(--muted)">
                      Similar: {match.sourceExcerpt}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(41,94,82,0.18)] bg-(--admin-positive-soft) p-2 text-[11px] text-(--admin-positive)">
                <ShieldCheck size={12} />
                Nenhum indicio forte de duplicacao interna nos trechos analisados.
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="admin-subpane space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-(--muted)">
            <FileCheck2 size={14} />
            Schema
          </div>
          <span className={`text-[11px] font-bold ${scoreTone(schemaReview.score)}`}>{schemaReview.score}/100</span>
        </div>

        <div className="rounded-2xl border border-(--border) bg-(--surface) p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-(--text)">Tipo configurado</div>
              <div className="text-[10px] uppercase text-(--muted)">{schemaReview.schemaType}</div>
            </div>
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${
                schemaReview.ready
                  ? "border-[rgba(41,94,82,0.18)] bg-(--admin-positive-soft) text-(--admin-positive)"
                  : "border-[rgba(143,91,73,0.16)] bg-(--admin-danger-soft) text-(--admin-danger)"
              }`}
            >
              {schemaReview.ready ? "ok" : "ajustar"}
            </span>
          </div>

          {schemaReview.blockers.length > 0 ? (
            <div className="mt-3 space-y-1">
              {schemaReview.blockers.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[10px] text-(--admin-danger)">
                  <ShieldAlert size={11} className="mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}

          {schemaReview.warnings.length > 0 ? (
            <div className="mt-3 space-y-1">
              {schemaReview.warnings.map((item) => (
                <div key={item} className="flex items-start gap-2 text-[10px] text-(--admin-warning)">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}

          {schemaReview.notes.length > 0 ? (
            <div className="mt-3 space-y-1">
              {schemaReview.notes.map((item) => (
                <div key={item} className="text-[10px] text-(--muted)">
                  {item}
                </div>
              ))}
            </div>
          ) : null}

          {schemaReview.blockers.length === 0 && schemaReview.warnings.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(41,94,82,0.18)] bg-(--admin-positive-soft) p-2 text-[11px] text-(--admin-positive)">
              <ShieldCheck size={12} />
              Schema pronto para publicação.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
