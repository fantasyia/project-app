"use client";

import { useState } from "react";
import { useEditorContext } from "@/components/editor/EditorContext";
import { useContentGuardian } from "@/hooks/useContentGuardian";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck, ShieldAlert, Sparkles, Check, X } from "lucide-react";

export function GuardianPanel() {
    const { editor, meta, links, activeSuggestion, onApplySuggestion, onDiscardSuggestion } = useEditorContext();
    const { issues, metrics } = useContentGuardian(editor, meta, links);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiResult, setAiResult] = useState<any | null>(null);
    const [aiDiagnostics, setAiDiagnostics] = useState<any | null>(null);

    const [isExpanded, setIsExpanded] = useState(false);

    const criticalIssues = issues.filter((i) => i.level === "critical");
    const warnIssues = issues.filter((i) => i.level === "warn");

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-(--admin-positive)";
        if (score >= 70) return "text-(--admin-warning)";
        return "text-(--admin-danger)";
    };

    const runAiAssist = async () => {
        if (!editor) return;
        setAiLoading(true);
        setAiError(null);
        try {
            const res = await fetch("/api/admin/guardian-ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: meta.title,
                    metaDescription: meta.metaDescription,
                    keyword: meta.targetKeyword,
                    issues: issues.map((i) => i.message),
                    text: editor.getText(),
                }),
            });
            const data = await res.json();
            if (!res.ok || !data?.ok) {
                setAiError(data?.error || "Falha ao consultar a IA.");
                setAiResult(null);
                setAiDiagnostics(null);
            } else {
                setAiResult(data?.result ?? data);
                setAiDiagnostics(data?.diagnostics ?? null);
            }
        } catch (error: any) {
            setAiError(error?.message || "Falha ao consultar a IA.");
            setAiResult(null);
            setAiDiagnostics(null);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <section className="admin-subpane space-y-3 p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {metrics.score >= 90 ? (
                        <ShieldCheck size={18} className="text-(--admin-positive)" />
                    ) : (
                        <ShieldAlert size={18} className={metrics.score >= 70 ? "text-(--admin-warning)" : "text-(--admin-danger)"} />
                    )}
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-(--muted)">
                        <span>Guardião SEO</span>
                        <span className="admin-ai-badge">IA</span>
                    </span>
                </div>
                <span className={`text-sm font-bold ${getScoreColor(metrics.score)}`}>{metrics.score}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-(--muted-foreground)">
                <div className="flex flex-col rounded bg-(--surface) p-2 text-center border border-(--border)">
                    <span className="font-bold text-(--text)">{metrics.wordCount}</span>
                    <span>Palavras</span>
                </div>
                <div className="flex flex-col rounded bg-(--surface) p-2 text-center border border-(--border)">
                    <span className={`font-bold ${metrics.keywordDensity > 2.5 ? "text-(--admin-danger)" : "text-(--text)"}`}>
                        {metrics.keywordDensity.toFixed(1)}%
                    </span>
                    <span>Densidade</span>
                </div>
            </div>

            {issues.length > 0 ? (
                <div className="space-y-2 pt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex w-full items-center justify-between rounded-lg bg-(--surface-muted) px-2 py-1.5 text-[10px] font-bold uppercase text-(--muted) hover:bg-(--border)"
                    >
                        <span>{issues.length} {issues.length === 1 ? "Alerta Encontrado" : "Alertas Encontrados"}</span>
                        <span className="text-[12px]">{isExpanded ? "−" : "+"}</span>
                    </button>

                    {isExpanded && (
                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {criticalIssues.map((issue) => (
                                <div key={issue.id} className="flex items-start gap-2 rounded-xl border border-[color:var(--admin-danger)] bg-(--surface) p-3 text-[11px] font-semibold text-(--text)">
                                    <AlertCircle size={14} className="mt-0.5 shrink-0 text-(--admin-danger)" />
                                    <span>{issue.message}</span>
                                </div>
                            ))}
                            {warnIssues.map((issue) => (
                                <div key={issue.id} className="flex items-start gap-2 rounded-xl border border-[color:var(--admin-warning)] bg-(--surface) p-3 text-[11px] font-semibold text-(--text)">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-(--admin-warning)" />
                                    <span>{issue.message}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--admin-positive)] bg-(--surface) p-3 text-sm font-semibold text-(--admin-positive)">
                    <CheckCircle2 size={16} />
                    <span>Tudo certo com o SEO!</span>
                </div>
            )}

            {activeSuggestion && (
                <div className="admin-ai-surface mt-3 flex flex-col gap-2 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-(--admin-positive) font-semibold text-[11px] mb-1 uppercase tracking-wide">
                        <Sparkles size={14} />
                        <span>Sugestão de Melhoria (Trecho)</span>
                    </div>
                    
                    <div className="text-[11px] text-(--muted) bg-(--surface) p-2 rounded border border-(--border) italic">
                        "{activeSuggestion.explanation}"
                    </div>

                    <div className="text-[12px] text-zinc-100 bg-(--surface-muted) p-3 rounded-lg border border-(--border) max-h-40 overflow-y-auto leading-relaxed">
                        {activeSuggestion.improvedText}
                    </div>

                    <div className="flex items-center gap-2 mt-2 justify-end">
                        <button 
                            type="button"
                            onClick={onDiscardSuggestion}
                            className="px-3 py-1.5 text-[11px] font-semibold text-(--muted) hover:text-(--text) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                        >
                            Descartar
                        </button>
                        <button 
                            type="button"
                            onClick={onApplySuggestion}
                            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-(--admin-positive) hover:brightness-110 rounded-lg transition-all shadow-sm"
                        >
                            <Check size={14} />
                            Aplicar Melhoria
                        </button>
                    </div>
                </div>
            )}

            <div className="pt-2">
                <button
                    type="button"
                    onClick={runAiAssist}
                    disabled={aiLoading}
                    className="admin-ai-control inline-flex w-full disabled:opacity-60"
                >
                    <Sparkles size={14} />
                    {aiLoading ? "Analisando com IA..." : "IA: Ajustes sugeridos"}
                </button>
                {aiError ? (
                    <div className="mt-2 rounded-xl border border-[color:var(--admin-danger)] bg-(--surface) px-3 py-2 text-[11px] text-(--admin-danger)">{aiError}</div>
                ) : null}
                {aiResult ? (
                    <div className="admin-ai-surface mt-3 space-y-2 rounded-2xl border border-(--border) bg-(--surface) p-3 text-[11px] text-(--text)">
                        {aiDiagnostics ? (
                            <div className="rounded border border-(--border) bg-(--surface-muted) p-2 text-[10px] text-(--muted)">
                                <p className="font-semibold uppercase text-(--text)">Diagnóstico LSI/PNL</p>
                                <p className="mt-1">
                                    Cobertura LSI: <span className="font-semibold text-(--text)">{Math.round(aiDiagnostics?.coverage?.lsiCoverageScore ?? 0)}%</span>
                                </p>
                                <p>
                                    Estrutura PNL: <span className="font-semibold text-(--text)">{Math.round(aiDiagnostics?.structure?.coverageScore ?? 0)}%</span>
                                </p>
                                {Array.isArray(aiDiagnostics?.structure?.missingSections) && aiDiagnostics.structure.missingSections.length ? (
                                    <p>Faltando: {aiDiagnostics.structure.missingSections.slice(0, 4).join(", ")}</p>
                                ) : null}
                            </div>
                        ) : null}
                        {aiResult.analysis ? (
                            <div>
                                <p className="font-semibold uppercase text-(--muted)">Resumo</p>
                                <p className="mt-1 text-(--muted)">{aiResult.analysis}</p>
                            </div>
                        ) : null}
                        {Array.isArray(aiResult.quick_fixes) && aiResult.quick_fixes.length ? (
                            <div>
                                <p className="font-semibold uppercase text-(--muted)">Ajustes rápidos</p>
                                <ul className="mt-1 list-disc pl-4 text-(--muted)">
                                    {aiResult.quick_fixes.map((item: string, idx: number) => (
                                        <li key={idx}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                        {aiResult.suggested_meta_description ? (
                            <div>
                                <p className="font-semibold uppercase text-(--muted)">Meta description sugerida</p>
                                <p className="mt-1 text-(--muted)">{aiResult.suggested_meta_description}</p>
                            </div>
                        ) : null}
                        {aiResult.suggested_first_paragraph ? (
                            <div>
                                <p className="font-semibold uppercase text-(--muted)">Primeiro parágrafo sugerido</p>
                                <p className="mt-1 text-(--muted)">{aiResult.suggested_first_paragraph}</p>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
