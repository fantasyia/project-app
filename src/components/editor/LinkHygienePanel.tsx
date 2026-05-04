"use client";

import { useEditorContext } from "@/components/editor/EditorContext";
import { Shield, MapPinned, AlertCircle, ChevronDown, ChevronUp, Maximize2, Minimize2, Unlink2 } from "lucide-react";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";

export function LinkHygienePanel() {
    const { links, editor, docText, postId } = useEditorContext();
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isListExpanded, setIsListExpanded] = useState(true);
    const [isPanelExpanded, setIsPanelExpanded] = useState(false);
    const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
    const [auditItems, setAuditItems] = useState<any[]>([]);
    const linkRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const lastScrolledLinkRef = useRef<string | null>(null);
    const shouldIgnoreNextScrollRef = useRef(false);
    const savedScrollPositionRef = useRef<number>(0);
    const savedListScrollPositionRef = useRef<number>(0);
    const listScrollRef = useRef<HTMLDivElement | null>(null);
    const activeEditorLinkRef = useRef<HTMLElement | null>(null);

    // Estado para rastrear qual link está selecionado (atualizado pelo useEffect)
    const [currentSelectedLink, setCurrentSelectedLink] = useState<any>(null);

    const parseRelTokens = (rel?: string | null) =>
        (rel ?? "")
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean);

    const serializeRelTokens = (tokens: string[]) => (tokens.length ? tokens.join(" ") : null);

    const normalizeText = (value: string) =>
        value
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const normalizeHref = (href: string) => {
        if (!href) return "";
        try {
            const url = new URL(href, "http://local");
            return url.pathname.replace(/\/+$/g, "");
        } catch {
            return href.split(/[?#]/)[0].replace(/\/+$/g, "");
        }
    };

    const getLinkIdentity = (href: string) => {
        if (!href) {
            return {
                slug: "(sem link)",
                host: "",
                path: "",
                compactPath: "",
            };
        }

        try {
            const url = new URL(href, "http://local");
            const host = url.hostname === "local" ? "" : url.hostname.replace(/^www\./, "");
            const path = url.pathname.replace(/\/+$/g, "") || "/";
            const segments = path.split("/").filter(Boolean);
            const slug = segments.at(-1) || host || "home";
            const compactPath = host ? `${host}${path}` : path;
            return { slug, host, path, compactPath };
        } catch {
            const path = href.split(/[?#]/)[0].replace(/\/+$/g, "") || href;
            const segments = path.split("/").filter(Boolean);
            const slug = segments.at(-1) || path || "(sem link)";
            return {
                slug,
                host: "",
                path,
                compactPath: path,
            };
        }
    };

    const clearEditorLinkMarker = useCallback(() => {
        if (!activeEditorLinkRef.current) return;
        activeEditorLinkRef.current.removeAttribute("data-link-jump-active");
        activeEditorLinkRef.current = null;
    }, []);

    const markEditorLink = useCallback((from: number, to: number) => {
        if (!editor) return;
        clearEditorLinkMarker();

        const positions = [from, Math.max(from, to - 1)];
        for (const pos of positions) {
            try {
                const { node } = editor.view.domAtPos(pos);
                const base = node instanceof HTMLElement ? node : node.parentElement;
                const target = base?.closest("a, [data-link-type], [data-cta-url], [data-url]") as HTMLElement | null;
                if (!target) continue;
                target.setAttribute("data-link-jump-active", "true");
                activeEditorLinkRef.current = target;
                return;
            } catch {
                continue;
            }
        }
    }, [clearEditorLinkMarker, editor]);

    const updateLink = (from: number, to: number, newAttrs: Record<string, any>) => {
        if (!editor) return;

        // Salva posição de scroll do container pai ANTES do update
        const scrollContainer = document.getElementById("intelligence-scroll-container");
        savedScrollPositionRef.current = scrollContainer?.scrollTop || 0;
        savedListScrollPositionRef.current = listScrollRef.current?.scrollTop || 0;

        // console.log('Saving scroll position:', savedScrollTop);

        // Flag para ignorar próximo scroll
        shouldIgnoreNextScrollRef.current = true;

        // 1. Seleciona o link alvo
        editor.chain().setTextSelection({ from, to }).run();

        // 2. Obtém os atributos atuais do link selecionado para garantir merge correto
        const currentAttrs = editor.getAttributes("link");

        // 3. Mescla com os novos atributos e garante que href exista
        const href = currentAttrs.href as string || ""; // Garante string
        const finalAttrs = { ...currentAttrs, ...newAttrs, href }; // href explícito para satisfazer tipagem

        // 4. Aplica a atualização mantendo o foco
        editor.chain().focus().extendMarkRange("link").setLink(finalAttrs).run();

        // reset handled after links refresh
    };

    // Função para restaurar scroll
    const restoreScroll = () => {
        const container = document.getElementById("intelligence-scroll-container");
        if (container) container.scrollTop = savedScrollPositionRef.current;
        if (listScrollRef.current) listScrollRef.current.scrollTop = savedListScrollPositionRef.current;
    };

    const toggleAttribute = (link: any, attr: string, value: string | null) => {
        if (attr === "rel") {
            const currentRel = parseRelTokens(link.rel);
            const targetVal = value || "";
            let newRel = [];
            if (currentRel.includes(targetVal)) {
                newRel = currentRel.filter((r: string) => r !== targetVal);
            } else {
                newRel = [...currentRel, targetVal];
            }

            const updatedAttrs: Record<string, any> = { rel: serializeRelTokens(newRel) };
            updateLink(link.from, link.to, updatedAttrs);
        }
        else if (attr === "target") {
            const newValue = link.target === "_blank" ? null : "_blank";
            const currentRel = parseRelTokens(link.rel);
            const cleanedRel = currentRel.filter((r: string) => r !== "noopener" && r !== "noreferrer");
            const nextRel = newValue ? [...cleanedRel, "noopener", "noreferrer"] : cleanedRel;
            updateLink(link.from, link.to, { target: newValue, rel: serializeRelTokens(nextRel) });
        }
        else if (attr === "data-entity-type") {
            // Para about e mention - cada um é independente agora
            const currentRel = parseRelTokens(link.rel);
            const targetValue = value || "";

            const hasAbout = currentRel.includes("about");
            const hasMention = currentRel.includes("mention");

            let nextHasAbout = hasAbout;
            let nextHasMention = hasMention;

            if (targetValue === "about") {
                nextHasAbout = !hasAbout;
            } else if (targetValue === "mention") {
                nextHasMention = !hasMention;
            }

            const baseRel = currentRel.filter((r: string) => r !== "about" && r !== "mention");
            if (nextHasAbout) baseRel.push("about");
            if (nextHasMention) baseRel.push("mention");

            let nextEntity: "about" | "mention" | null = null;
            if (nextHasAbout && !nextHasMention) {
                nextEntity = "about";
            } else if (nextHasMention && !nextHasAbout) {
                nextEntity = "mention";
            } else if (nextHasAbout && nextHasMention) {
                nextEntity = targetValue === "mention" ? "mention" : "about";
            }

            updateLink(link.from, link.to, {
                rel: serializeRelTokens(baseRel),
                "data-entity": nextEntity,
                "data-entity-type": nextEntity,
                "data-link-type": nextEntity,
            });
        }
    };

    const removeLink = (link: any) => {
        if (!editor) return;

        const linkId = String(link?.id ?? "");
        const from = Number(link?.from ?? 0);
        const to = Number(link?.to ?? 0);
        if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return;

        const isMentionNode = linkId.endsWith("-mention");
        const isCtaNode = linkId.endsWith("-cta");
        const isProductNode = linkId.endsWith("-product");
        const willDeleteBlock = isMentionNode || isCtaNode || isProductNode;

        const confirmed = window.confirm(
            willDeleteBlock
                ? "Esse bloco de link será removido do conteúdo. Deseja continuar?"
                : "Remover este link e manter o texto visivel?"
        );
        if (!confirmed) return;

        const scrollContainer = document.getElementById("intelligence-scroll-container");
        savedScrollPositionRef.current = scrollContainer?.scrollTop || 0;
        savedListScrollPositionRef.current = listScrollRef.current?.scrollTop || 0;
        shouldIgnoreNextScrollRef.current = true;

        if (isMentionNode) {
            const replacementText = String(link?.text ?? "").trim();
            if (replacementText) {
                editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, replacementText).run();
            } else {
                editor.chain().focus().deleteRange({ from, to }).run();
            }
            return;
        }

        if (isCtaNode || isProductNode) {
            editor.chain().focus().deleteRange({ from, to }).run();
            return;
        }

        editor
            .chain()
            .focus()
            .setTextSelection({ from, to })
            .extendMarkRange("link")
            .unsetLink()
            .run();
    };

    useEffect(() => {
        if (!postId) return;
        let cancelled = false;
        fetch(`/api/admin/link-audits?postId=${postId}`)
            .then((res) => res.json())
            .then((data) => {
                if (cancelled) return;
                setAuditItems(Array.isArray(data?.items) ? data.items : []);
            })
            .catch(() => {
                if (!cancelled) setAuditItems([]);
            });

        return () => {
            cancelled = true;
        };
    }, [postId]);

    useEffect(() => () => clearEditorLinkMarker(), [clearEditorLinkMarker]);

    const auditMap = useMemo(() => {
        const map = new Map<string, { label: string; score?: number }>();
        const rank: Record<string, number> = { WEAK: 3, OK: 2, STRONG: 1 };
        auditItems.forEach((item) => {
            if (!item?.audit?.label) return;
            const key = `${normalizeText(item.anchor_text || "")}||${normalizeHref(item.href_normalized || "")}`;
            const existing = map.get(key);
            const nextRank = rank[item.audit.label] ?? 0;
            const existingRank = existing ? rank[existing.label] ?? 0 : 0;
            if (!existing || nextRank > existingRank) {
                map.set(key, { label: item.audit.label, score: item.audit.score });
            }
        });
        return map;
    }, [auditItems]);

    const jumpToLink = (from: number, to: number, linkId: string) => {
        if (!editor) return;

        setSelectedLinkId(linkId);
        // Marca como último link com scroll
        lastScrolledLinkRef.current = linkId;

        editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
        requestAnimationFrame(() => markEditorLink(from, to));
    };

    // Sincroniza o link selecionado:
    // 1. Quando a lista de links muda (atualização de atributos, texto, etc)
    // 2. Quando a seleção do usuário muda (clique, setas, etc)

    // Função pura para buscar o link na lista atual baseada na seleção atual
    const findCurrentLink = useCallback(() => {
        if (!editor) return null;
        const { from, to } = editor.state.selection;
        return links.find(link => from >= link.from && to <= link.to) || null;
    }, [editor, links]);

    useEffect(() => {
        if (!shouldIgnoreNextScrollRef.current) return;
        const handle = requestAnimationFrame(() => {
            restoreScroll();
            shouldIgnoreNextScrollRef.current = false;
        });
        return () => cancelAnimationFrame(handle);
    }, [links]);

    // Efeito para quando a seleção muda (ex: mover cursor)
    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const link = findCurrentLink();
            setSelectedLinkId(link?.id ?? null);
            // Só atualiza se realmente mudou o link (ou se ficou null)
            // Para evitar re-renders desnecessários, mas garantindo que pegue mudanças de POSIÇÃO
            // Comparar IDs é bom.
            setCurrentSelectedLink((prev: any) => {
                if (prev?.id === link?.id) return prev; // Mantém o objeto anterior se for o mesmo link (evita flicker?)
                // Mas espere! Se os atributos mudaram, o ID (que contem o href) pode ter mudado, ou não.
                // Se o ID for baseado em posição+href, e só o target mudou, o ID é o mesmo.
                // Se retornarmos 'prev', perdemos a atualização dos atributos novos que estão em 'link'.
                // REVERTER: Sempre atualizar se o ID for o mesmo mas o conteúdo for diferente?
                // Simplesmente setar o novo 'link' que vem da prop atualizada é o mais seguro.
                return link;
            });

            if (link) {
                requestAnimationFrame(() => markEditorLink(link.from, link.to));
            } else {
                clearEditorLinkMarker();
            }

            // Ignora scroll se estiver atualizando atributos
            if (shouldIgnoreNextScrollRef.current) {
                return;
            }

            // Só faz scroll se for um link DIFERENTE do último
            if (link?.id && link.id !== lastScrolledLinkRef.current) {
                lastScrolledLinkRef.current = link.id;

                // Scroll suave do painel para o link selecionado
                setTimeout(() => {
                    const linkElement = linkRefs.current.get(link.id);
                    if (linkElement) {
                        linkElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 100);
            }
        };

        // Roda imediatamente sempre que 'links' mudar
        handleSelectionUpdate();

        // Roda quando a seleção ou qualquer transação ocorrer (mudança de atributos)
        editor.on("selectionUpdate", handleSelectionUpdate);
        editor.on("transaction", handleSelectionUpdate);

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate);
            editor.off("transaction", handleSelectionUpdate);
        };
    }, [clearEditorLinkMarker, editor, findCurrentLink, markEditorLink]);

    // Link Metrics
    const metrics = useMemo(() => {
        const total = links.length;
        const internal = links.filter(l => ["internal", "mention", "about"].includes(l.type));
        const external = links.filter(l => l.type === "external" || l.type === "affiliate");
        const amazon = external.filter(l => l.href.includes("amazon") || l.href.includes("amzn"));
        const amazonWithoutSponsored = amazon.filter(l => !(l.rel || "").includes("sponsored"));
        const withBlank = links.filter(l => l.target === "_blank");
        const withNofollow = links.filter(l => (l.rel || "").includes("nofollow"));
        const withSponsored = links.filter(l => (l.rel || "").includes("sponsored"));

        // Position distribution (based on character position in text)
        const textLength = docText.length;
        const first20Percent = links.filter(l => l.from < textLength * 0.2);
        const middle60Percent = links.filter(l => l.from >= textLength * 0.2 && l.from < textLength * 0.8);
        const last20Percent = links.filter(l => l.from >= textLength * 0.8);

        // Anchor text analysis
        const anchorTexts = links.map(l => l.text.toLowerCase().trim());
        const uniqueAnchors = new Set(anchorTexts);
        const repeatedAnchors = anchorTexts.filter((text, index) =>
            anchorTexts.indexOf(text) !== index && text.length > 0
        );

        return {
            total,
            internal: internal.length,
            external: external.length,
            amazon: amazon.length,
            amazonWithoutSponsored: amazonWithoutSponsored.length,
            withBlank: withBlank.length,
            withNofollow: withNofollow.length,
            withSponsored: withSponsored.length,
            first20Percent: first20Percent.length,
            middle60Percent: middle60Percent.length,
            last20Percent: last20Percent.length,
            uniqueAnchors: uniqueAnchors.size,
            repeatedAnchors: repeatedAnchors.length
        };
    }, [links, docText]);

    const getLinkPosition = (from: number) => {
        const textLength = docText.length;
        const percent = (from / textLength) * 100;
        if (percent < 20) return { label: "Início", color: "bg-(--brand-primary)" };
        if (percent < 80) return { label: "Meio", color: "bg-(--brand-accent)" };
        return { label: "Fim", color: "bg-(--brand-hot)" };
    };

    const LinkRow = ({ link }: { link: any }) => {
        const isExternal = link.type === "external" || link.type === "affiliate";
        const isAmazon = link.href.includes("amazon") || link.href.includes("amzn");
        const isAffiliate = link.type === "affiliate";
        const isInternal = link.type === "internal";
        const isEntity = link.type === "about" || link.type === "mention";
        const isLocked = isInternal || isAffiliate || isAmazon;
        const hasIssue = isAmazon && !(link.rel || "").includes("sponsored");
        const position = getLinkPosition(link.from);
        const identity = getLinkIdentity(link.href || "");
        const auditKey = `${normalizeText(link.text || "")}||${normalizeHref(link.href || "")}`;
        const auditInfo = auditMap.get(auditKey);
        const auditLabel = auditInfo?.label;
        const auditBorder =
            auditLabel === "WEAK"
                ? "border-[color:var(--admin-danger)] ring-1 ring-[color:var(--admin-danger-soft)]"
                : auditLabel === "OK"
                    ? "border-[color:var(--admin-warning)] ring-1 ring-[color:var(--admin-warning-soft)]"
                    : auditLabel === "STRONG"
                        ? "border-[color:var(--admin-positive)]"
                        : "";

        // Verifica se este link está selecionado
        const typeLabel = isAmazon ? "AMZ" : isAffiliate ? "AFF" : isInternal ? "INT" : isEntity ? "ENT" : "EXT";
        const typeTone = isAmazon
            ? "border-[color:var(--admin-amazon)] bg-(--admin-amazon-soft) text-(--admin-amazon)"
            : isAffiliate
                ? "border-(--brand-accent) bg-(--surface) text-(--brand-accent)"
                : isInternal
                    ? "border-(--brand-hot) bg-(--surface) text-(--brand-hot)"
                    : isEntity
                        ? "border-(--brand-primary) bg-(--surface) text-(--brand-accent)"
                        : "border-(--border) bg-(--surface) text-(--muted)";
        const auditTone = auditLabel === "WEAK"
            ? "border border-[color:var(--admin-danger)] bg-(--surface) text-(--admin-danger)"
            : auditLabel === "OK"
                ? "border border-[color:var(--admin-warning)] bg-(--surface) text-(--admin-warning)"
                : "border border-[color:var(--admin-positive)] bg-(--surface) text-(--admin-positive)";
        const actionBase = "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors";
        const isSelected = selectedLinkId === link.id || currentSelectedLink?.id === link.id;

        return (
            <div
                ref={(el) => {
                    if (el) linkRefs.current.set(link.id, el);
                    else linkRefs.current.delete(link.id);
                }}
                className={`cursor-pointer rounded-xl border px-2.5 py-2 transition-all ${isSelected
                    ? "border-(--brand-hot) bg-(--surface) shadow-sm ring-2 ring-[color:var(--brand-primary)]"
                    : hasIssue
                        ? "border-[color:var(--admin-warning)] bg-(--surface) ring-1 ring-[color:var(--admin-warning-soft)]"
                        : auditBorder
                            ? `${auditBorder} bg-(--surface)`
                            : "border-(--border) bg-(--surface) hover:border-(--brand-primary)"
                    }`}
                onClick={() => jumpToLink(link.from, link.to, link.id)}
                title="Clique para ir ao trecho exato no editor"
            >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 overflow-hidden">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate font-mono text-[12px] font-semibold text-(--brand-hot)" title={identity.slug}>
                                {identity.slug}
                            </span>
                            {hasIssue ? <AlertCircle size={12} className="shrink-0 text-(--admin-danger)" /> : null}
                        </div>
                        <p className="truncate text-[13px] font-medium text-(--text)" title={link.text || "Link sem texto"}>
                            {link.text || "Link sem texto"}
                        </p>
                        <p className="truncate text-[10.5px] text-(--muted-2)" title={identity.compactPath || link.href}>
                            {identity.compactPath || link.href}
                        </p>
                    </div>
                    <div className="flex items-start gap-1.5">
                        <div className={`mt-0.5 h-9 w-1 rounded-full ${position.color}`} title={`Posição: ${position.label}`} />

                        {auditLabel && (
                            <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${auditTone}`}
                                title={`Auditoria: ${auditLabel}${typeof auditInfo?.score === "number" ? ` (${auditInfo.score})` : ""}`}
                            >
                                {auditLabel}
                            </span>
                        )}

                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${typeTone}`}>
                            {typeLabel}
                        </span>
                    </div>
                </div>

                {isSelected ? (!isLocked ? (
                    <div className="mt-1 flex flex-wrap gap-1 border-t border-(--border) pt-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleAttribute(link, "target", "_blank"); }}
                            className={`${actionBase} ${link.target === "_blank"
                                ? "border-[color:var(--admin-positive)] bg-(--admin-positive-soft) text-(--admin-positive)"
                                : "border-(--border) bg-(--surface-muted) text-(--muted)"
                                }`}
                        >
                            _blank
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleAttribute(link, "rel", "nofollow"); }}
                            className={`${actionBase} ${(link.rel || "").includes("nofollow")
                                ? "border-[color:var(--admin-positive)] bg-(--admin-positive-soft) text-(--admin-positive)"
                                : "border-(--border) bg-(--surface-muted) text-(--muted)"
                                }`}
                        >
                            nofollow
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleAttribute(link, "rel", "sponsored"); }}
                            className={`${actionBase} ${(link.rel || "").includes("sponsored")
                                ? "border-[color:var(--admin-warning)] bg-(--admin-warning-soft) text-(--admin-warning)"
                                : "border-(--border) bg-(--surface-muted) text-(--muted)"
                                }`}
                        >
                            sponsored
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAttribute(link, "data-entity-type", "about"); }}
                            className={`${actionBase} ${(link.rel || "").includes("about")
                                ? "border-(--brand-accent) bg-(--surface) text-(--brand-accent)"
                                : "border-(--border) bg-(--surface-muted) text-(--muted)"
                                }`}
                        >
                            about
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAttribute(link, "data-entity-type", "mention"); }}
                            className={`${actionBase} ${(link.rel || "").includes("mention")
                                ? "border-(--brand-primary) bg-(--surface) text-(--brand-hot)"
                                : "border-(--border) bg-(--surface-muted) text-(--muted)"
                                }`}
                        >
                            mention
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeLink(link);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-[color:var(--admin-danger)] bg-(--admin-danger-soft) px-2 py-1 text-[10px] font-semibold text-(--admin-danger) transition-colors hover:bg-(--surface)"
                            title="Remover link"
                        >
                            <Unlink2 size={12} />
                            remover
                        </button>
                    </div>
                ) : (
                    <div className="mt-1 flex items-center justify-between gap-2 border-t border-(--border) pt-1">
                        <div className="text-[10px] text-(--muted-2)">
                            {isInternal && "Interno: sem _blank, nofollow, sponsored, about ou mention."}
                            {!isInternal && (isAmazon || isAffiliate) && "Affiliate/Amazon: atributos fixos (_blank, nofollow, sponsored)."}
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeLink(link);
                            }}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[color:var(--admin-danger)] bg-(--admin-danger-soft) px-2 py-1 text-[10px] font-semibold text-(--admin-danger) transition-colors hover:bg-(--surface)"
                            title="Remover link"
                        >
                            <Unlink2 size={12} />
                            remover
                        </button>
                    </div>
                )) : null}
            </div>
        );
    };

    return (
        <section className={`admin-subpane space-y-2 p-2.5 transition-all ${isPanelExpanded ? "col-span-2" : ""}`}>
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-(--text)">
                <span className="flex items-center gap-2">
                    <Shield size={15} />
                    Links do artigo
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-(--brand-hot)">
                        {links.length} LINKS
                    </span>
                    <button
                        onClick={() => setIsPanelExpanded(!isPanelExpanded)}
                        className="p-1 rounded hover:bg-(--surface) transition-colors"
                        title={isPanelExpanded ? "Minimizar" : "Expandir"}
                    >
                        {isPanelExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* LINK MAP */}
            <div className="admin-subpane p-2.5">
                <button
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    className="mb-1.5 flex w-full items-center justify-between text-xs font-bold text-(--text)"
                >
                    <span className="flex items-center gap-2">
                        <MapPinned size={16} />
                        Mapa de Links
                    </span>
                    {isMapExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isMapExpanded && (
                    <div className="space-y-3">
                        {/* Metrics Grid */}
                        <div className={`grid ${isPanelExpanded ? "grid-cols-4" : "grid-cols-2"} gap-3`}>
                            <div className="rounded-lg border border-(--border) bg-(--surface) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--muted)">Total:</div>
                                <div className="text-2xl font-bold text-(--text)">{metrics.total}</div>
                            </div>
                            <div className="rounded-lg border border-(--border) bg-(--surface) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--muted)">Únicos (âncora):</div>
                                <div className="text-2xl font-bold text-(--text)">{metrics.uniqueAnchors}</div>
                            </div>
                            <div className="rounded-lg border border-[color:var(--admin-positive)] bg-(--admin-positive-soft) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--admin-positive)">Internos:</div>
                                <div className="text-2xl font-bold text-(--admin-positive)">
                                    {metrics.internal} <span className="text-sm">({metrics.total > 0 ? Math.round((metrics.internal / metrics.total) * 100) : 0}%)</span>
                                </div>
                            </div>
                            <div className="rounded-lg border border-(--brand-accent) bg-(--surface) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--brand-accent)">Externos:</div>
                                <div className="text-2xl font-bold text-(--brand-accent)">
                                    {metrics.external} <span className="text-sm">({metrics.total > 0 ? Math.round((metrics.external / metrics.total) * 100) : 0}%)</span>
                                </div>
                            </div>
                        </div>

                        {/* Amazon & Attributes */}
                        <div className={`grid ${isPanelExpanded ? "grid-cols-4" : "grid-cols-2"} gap-3`}>
                            <div className="rounded-lg border border-[color:var(--admin-amazon)] bg-(--admin-amazon-soft) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--admin-amazon)">Amazon:</div>
                                <div className="text-2xl font-bold text-(--admin-amazon)">{metrics.amazon}</div>
                            </div>
                            <div className={`rounded-lg border-2 bg-(--surface) p-3 ${metrics.amazonWithoutSponsored > 0 ? "border-[color:var(--admin-danger)]" : "border-(--border)"}`}>
                                <div className={`mb-1 text-xs font-semibold ${metrics.amazonWithoutSponsored > 0 ? "text-(--admin-danger)" : "text-(--muted)"}`}>
                                    AMZ sem sponsored:
                                </div>
                                <div className={`text-2xl font-bold ${metrics.amazonWithoutSponsored > 0 ? "text-(--admin-danger)" : "text-(--text)"}`}>
                                    {metrics.amazonWithoutSponsored}
                                </div>
                            </div>
                            <div className="rounded-lg border border-(--brand-hot) bg-(--surface) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--brand-hot)">_blank:</div>
                                <div className="text-2xl font-bold text-(--brand-hot)">{metrics.withBlank}</div>
                            </div>
                            <div className="rounded-lg border border-[color:var(--admin-warning)] bg-(--surface) p-3">
                                <div className="mb-1 text-xs font-semibold text-(--admin-warning)">nofollow:</div>
                                <div className="text-2xl font-bold text-(--admin-warning)">{metrics.withNofollow}</div>
                            </div>
                        </div>

                        {/* Distribution */}
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-(--text)">Distribuição:</div>
                            <div className="flex gap-1 h-8">
                                <div className="flex items-center justify-center rounded bg-(--brand-primary) text-xs font-bold text-(--ink)" style={{ width: "20%" }}>
                                    Início ({metrics.first20Percent})
                                </div>
                                <div className="flex items-center justify-center rounded bg-(--brand-accent) text-xs font-bold text-white" style={{ width: "60%" }}>
                                    Meio ({metrics.middle60Percent})
                                </div>
                                <div className="flex items-center justify-center rounded bg-(--brand-hot) text-xs font-bold text-white" style={{ width: "20%" }}>
                                    Fim ({metrics.last20Percent})
                                </div>
                            </div>
                        </div>

                        {/* Warnings */}
                        {metrics.repeatedAnchors > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--admin-warning)] bg-(--admin-warning-soft) p-3">
                                <AlertCircle size={18} className="shrink-0 text-(--admin-warning)" />
                                <span className="text-sm font-semibold text-(--admin-warning)">
                                    {metrics.repeatedAnchors} âncoras repetidas (varie o texto)
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LINKS LIST */}
            <div>
                <button
                    onClick={() => setIsListExpanded(!isListExpanded)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-(--text) mb-2"
                >
                    <span>Links ({links.length})</span>
                    {isListExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isListExpanded && (
                    <div ref={listScrollRef} className="admin-scrollbar max-h-[600px] space-y-1 overflow-y-auto pr-1">
                        {links.length === 0 && (
                            <p className="text-sm text-(--muted-2) text-center py-4">Nenhum link no documento.</p>
                        )}
                        {links.map((link) => (
                            <LinkRow key={link.id} link={link} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
