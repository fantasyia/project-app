"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/core";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  Eye,
  FileText,
  ImageIcon,
  Italic,
  Layers,
  LayoutList,
  Link2,
  List,
  ListOrdered,
  Monitor,
  PenLine,
  Quote,
  Redo2,
  Save,
  Search,
  ShoppingCart,
  Smartphone,
  Strikethrough,
  Table2,
  Tablet,
  Underline,
  Undo2,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { RichTextEditor } from "@/components/blog/rich-text-editor";
import { createArticle, updateArticle } from "@/lib/actions/blog";
import { contentToPlainText, legacyContentToHtml } from "@/lib/blog/content";
import type { BlogArticleRecord, BlogSiloRecord } from "@/lib/blog/types";
import { getArticleStats } from "@/lib/editor/post-analysis";
import { ContentIntelligence } from "./ContentIntelligence";
import { EditorInspector } from "./EditorInspector";
import { TextSearchPanel } from "./TextSearchPanel";

type EditorDialog = "link" | "improve" | "media" | "product" | "block" | null;

export function AdvancedEditor({
  mode,
  article,
  silos,
}: {
  mode: "create" | "edit";
  article?: BlogArticleRecord | null;
  silos: BlogSiloRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDialog, setActiveDialog] = useState<EditorDialog>(null);
  const [dialogSelection, setDialogSelection] = useState("");
  const [articleEditor, setArticleEditor] = useState<Editor | null>(null);
  const [selectedArticleText, setSelectedArticleText] = useState("");
  const [title, setTitle] = useState(article?.title || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [coverPreview, setCoverPreview] = useState(article?.cover_image_url || "");
  const [editorHtml, setEditorHtml] = useState(legacyContentToHtml(article?.content));
  const [editorText, setEditorText] = useState(contentToPlainText(article?.content));
  const [selectedSiloId, setSelectedSiloId] = useState(article?.silo_id || "");
  const [siloRole, setSiloRole] = useState(article?.silo_role || "SUPPORT");
  const [siloGroup, setSiloGroup] = useState(article?.silo_group || "");
  const [keyword, setKeyword] = useState(article?.target_keyword || "");
  const [metaTitle, setMetaTitle] = useState(article?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(article?.meta_description || "");
  const [canonicalPath, setCanonicalPath] = useState(article?.canonical_path || "");
  const [schemaType, setSchemaType] = useState(article?.schema_type || "article");
  const [intent, setIntent] = useState(article?.intent || "informational");
  const [category, setCategory] = useState(article?.category || "");
  const [tags, setTags] = useState((article?.tags || []).join(", "));

  const selectedSilo = silos.find((silo) => silo.id === selectedSiloId) || null;
  const stats = useMemo(() => getArticleStats(editorHtml), [editorHtml]);
  const searchHits = searchTerm ? editorText.toLowerCase().split(searchTerm.toLowerCase()).length - 1 : 0;
  const seoChecks = [
    { label: "Keyword no titulo", ok: Boolean(keyword && title.toLowerCase().includes(keyword.toLowerCase())) },
    { label: "Meta description", ok: metaDescription.length >= 120 && metaDescription.length <= 160 },
    { label: "Outline H2/H3/H4", ok: stats.headings.length >= 2 },
    { label: "Conteudo suficiente", ok: stats.words >= 120 },
    { label: "Silo definido", ok: Boolean(selectedSiloId) },
    { label: "Cover definida", ok: Boolean(coverPreview) },
  ];

  const handleEditorReady = useCallback((nextEditor: Editor | null) => {
    setArticleEditor(nextEditor);
  }, []);

  function handleCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  }

  function readBrowserSelection(fallback = "") {
    if (typeof window === "undefined") return fallback;
    const selected = window.getSelection()?.toString().trim();
    return selected || fallback;
  }

  function syncArticleEditorState(nextEditor = articleEditor) {
    if (!nextEditor) return;
    setEditorHtml(nextEditor.getHTML());
    setEditorText(nextEditor.getText());
  }

  function getArticleSelection(fallback = "") {
    if (articleEditor) {
      const { from, to } = articleEditor.state.selection;
      const selection = articleEditor.state.doc.textBetween(from, to, " ").trim();
      if (selection) return selection;
    }

    return selectedArticleText || readBrowserSelection(fallback);
  }

  function runArticleCommand(command: (editor: Editor) => void, fallbackHtml?: string) {
    if (!articleEditor) {
      if (fallbackHtml) {
        const nextHtml = `${editorHtml}${fallbackHtml}`;
        setEditorHtml(nextHtml);
        setEditorText(contentToPlainText(nextHtml));
      }
      return;
    }

    command(articleEditor);
    syncArticleEditorState(articleEditor);
  }

  function insertSnippet(block: string) {
    runArticleCommand((editor) => {
      editor.chain().focus().insertContent(block).run();
    }, block);
  }

  function replaceSelectionWithHtml(block: string) {
    insertSnippet(block);
  }

  function wrapSelection(tagName: "u" | "s", fallbackText: string) {
    const selection = getArticleSelection(fallbackText);
    replaceSelectionWithHtml(`<${tagName}>${escapeHtml(selection)}</${tagName}>`);
  }

  function openDialog(dialog: EditorDialog, fallbackSelection = "") {
    setDialogSelection(getArticleSelection(fallbackSelection));
    setActiveDialog(dialog);
  }

  function commitEditorHtml(nextHtml: string) {
    setEditorHtml(nextHtml);
    setEditorText(contentToPlainText(nextHtml));
  }

  function replaceSelectionOrAppend(selection: string, nextBlock: string) {
    if (articleEditor) {
      articleEditor.chain().focus().insertContent(nextBlock).run();
      syncArticleEditorState(articleEditor);
      return;
    }

    const cleanedSelection = selection.trim();
    if (cleanedSelection && editorHtml.includes(cleanedSelection)) {
      commitEditorHtml(editorHtml.replace(cleanedSelection, nextBlock));
      return;
    }

    insertSnippet(nextBlock);
  }

  function handleInsertLink(payload: { anchor: string; url: string; title?: string; newTab: boolean; sponsored: boolean }) {
    const anchor = escapeHtml(payload.anchor.trim() || dialogSelection || payload.url);
    const href = escapeAttribute(payload.url.trim());
    const titleAttribute = payload.title?.trim() ? ` title="${escapeAttribute(payload.title.trim())}"` : "";
    const targetAttribute = payload.newTab ? ' target="_blank"' : "";
    const relValues = [payload.newTab ? "noopener" : "", payload.sponsored ? "sponsored" : ""].filter(Boolean).join(" ");
    const relAttribute = relValues ? ` rel="${relValues}"` : "";
    replaceSelectionOrAppend(dialogSelection || payload.anchor, `<a href="${href}"${titleAttribute}${targetAttribute}${relAttribute}>${anchor}</a>`);
    setActiveDialog(null);
  }

  function handleImproveText(payload: { original: string; improved: string; explanation: string }) {
    const improved = escapeHtml(payload.improved.trim());
    replaceSelectionOrAppend(payload.original || dialogSelection, `<p>${improved}</p>`);
    setActiveDialog(null);
  }

  function addMiniWordPressBlock() {
    insertSnippet(
      "<h2>O que realmente muda</h2><p>Explique o impacto pratico para creators, assinantes e descoberta de conteudo visual premium.</p><h3>Como aplicar no FantasyIA</h3><p>Conecte o tema com assinatura, PPV, comunidade, protecao de conteudo ou editorial de topo de funil.</p><h4>Checklist rapido</h4><ul><li>Defina a intencao do post</li><li>Conecte com um silo</li><li>Inclua um proximo passo claro</li></ul>"
    );
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    if (!title.trim()) {
      setError("Titulo obrigatorio.");
      return;
    }

    formData.set("title", title);
    formData.set("excerpt", excerpt);
    formData.set("content", editorHtml);
    formData.set("existing_cover_url", article?.cover_image_url || "");
    formData.set("silo_id", selectedSiloId);
    formData.set("silo_slug", selectedSilo?.slug || "");
    formData.set("silo_role", siloRole);
    formData.set("silo_group", siloGroup);
    formData.set("target_keyword", keyword);
    formData.set("meta_title", metaTitle || title);
    formData.set("meta_description", metaDescription || excerpt);
    formData.set("canonical_path", canonicalPath || (selectedSilo ? `/blog/s/${selectedSilo.slug}` : ""));
    formData.set("schema_type", schemaType);
    formData.set("intent", intent);
    formData.set("category", category);
    formData.set("tags", tags);

    startTransition(async () => {
      const result =
        mode === "edit" && article?.id
          ? await updateArticle(article.id, formData)
          : await createArticle(formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.push("/dashboard/blog");
      router.refresh();
    });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1f1e26] text-white">
      <EditorTopHeader
        title={title}
        slug={article?.slug}
        pending={pending}
        onSearch={() => setSearchTerm(searchTerm || title)}
        onUndo={() => runArticleCommand((editor) => editor.chain().focus().undo().run())}
        onRedo={() => runArticleCommand((editor) => editor.chain().focus().redo().run())}
        onAlign={(align) => {
          const selection = getArticleSelection("Texto alinhado");
          replaceSelectionWithHtml(`<p style="text-align:${align}">${escapeHtml(selection)}</p>`);
        }}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[464px_minmax(720px,1fr)_456px] overflow-hidden">
      <ContentIntelligence
        headings={stats.headings}
        seoChecks={seoChecks}
        selectedSiloName={selectedSilo?.name}
        searchPanel={<TextSearchPanel value={searchTerm} onChange={setSearchTerm} hitCount={Math.max(0, searchHits)} />}
        onAddTerm={(term) => setTags((current) => (current ? `${current}, ${term}` : term))}
        onOpenLinkDialog={() => openDialog("link", keyword || selectedSilo?.name || title)}
        onImproveText={() => openDialog("improve", excerpt || editorText.slice(0, 220))}
      />

      <form id="miniwordpress-editor-form" action={handleSubmit} className="flex min-h-0 min-w-0 flex-col">
        <input type="hidden" name="content" value={editorHtml} />
        <input type="hidden" name="existing_cover_url" value={article?.cover_image_url || ""} />

        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#24232c] px-3 py-2">
          <select
            onChange={(event) => {
              const value = event.target.value;
              runArticleCommand((editor) => {
                if (value === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
                if (value === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
                if (value === "h4") editor.chain().focus().toggleHeading({ level: 4 }).run();
                if (value === "paragraph") editor.chain().focus().setParagraph().run();
              });
            }}
            defaultValue="paragraph"
            className="rounded-md border border-white/15 bg-[#1d1c24] px-3 py-2 text-sm font-bold text-white"
          >
            <option value="paragraph">Paragrafo</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>
          <ToolButton icon={<Bold size={15} />} label="Negrito" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleBold().run(), "<p><strong>Texto em destaque</strong></p>")} />
          <ToolButton icon={<Italic size={15} />} label="Italico" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleItalic().run(), "<p><em>Texto enfatizado</em></p>")} />
          <ToolButton icon={<Underline size={15} />} label="Sublinhado" onClick={() => wrapSelection("u", "Texto sublinhado")} />
          <ToolButton icon={<Strikethrough size={15} />} label="Tachado" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleStrike().run(), "<p><s>Texto removido</s></p>")} />
          <ToolButton icon={<Quote size={15} />} label="Quote" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleBlockquote().run(), "<blockquote><p>Destaque uma tese, fonte ou insight.</p></blockquote>")} />
          <ToolButton icon={<List size={15} />} label="Lista" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleBulletList().run(), "<ul><li>Primeiro ponto</li><li>Segundo ponto</li></ul>")} />
          <ToolButton icon={<ListOrdered size={15} />} label="Ordenada" onClick={() => runArticleCommand((editor) => editor.chain().focus().toggleOrderedList().run(), "<ol><li>Primeiro passo</li><li>Segundo passo</li></ol>")} />
          <ToolButton icon={<Link2 size={15} />} label="Link" onClick={() => openDialog("link", keyword || title)} />
          <ToolButton icon={<Wand2 size={15} />} label="Melhorar texto" onClick={() => openDialog("improve", excerpt || editorText.slice(0, 220))} />
          <ToolButton icon={<ImageIcon size={15} />} label="Imagem" onClick={() => openDialog("media")} />
          <ToolButton icon={<Video size={15} />} label="Video" onClick={() => openDialog("media")} />
          <ToolButton icon={<Table2 size={15} />} label="Tabela" onClick={() => insertSnippet("<table><tbody><tr><td>Criterio</td><td>Analise</td></tr></tbody></table>")} />
          <button type="button" onClick={() => openDialog("block")} className="rounded-md border border-white/15 bg-[#1d1c24] px-3 py-2 text-xs font-bold text-white">
            Blocos
          </button>
          <button type="button" onClick={() => openDialog("product")} className="rounded-md bg-cyan-300 px-4 py-2 text-xs font-bold text-black">
            <span className="inline-flex items-center gap-2"><ShoppingCart size={14} /> Produto</span>
          </button>
        </div>

        <div className="editor-public-preview flex-1 overflow-y-auto bg-[#f8f5ef] p-6 text-slate-900">
          <div className="mx-auto max-w-5xl rounded-sm bg-[#f8f5ef]">
            <div className="mb-5 text-xs text-slate-500">
              Home / {selectedSilo?.name || "Sem silo"} / {title || "Novo post"}
            </div>
            <input
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Titulo do post"
              className="w-full bg-transparent text-5xl font-light leading-tight text-teal-900 outline-none placeholder:text-slate-300 md:text-7xl"
            />
            <div className="mt-5 flex items-center gap-4 text-sm text-slate-500">
              <span>Por Equipe FantasyIA</span>
              <span>{stats.words} palavras</span>
              <span>{stats.readingTime} min</span>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <label className="relative flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white/50">
                {coverPreview ? (
                  <Image src={coverPreview} alt="Cover" fill unoptimized className="object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-sm font-bold text-slate-500">
                    <ImageIcon size={30} />
                    Clique para trocar capa
                  </span>
                )}
                <input name="cover" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>

              <div className="rounded-xl border border-slate-200 bg-white/60 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Lead / introducao</p>
                <textarea
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="Lead do artigo..."
                  className="mt-3 min-h-[170px] w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                <LayoutList size={14} />
                Corpo do post
              </div>
              <RichTextEditor
                initialContent={editorHtml}
                onEditorReady={handleEditorReady}
                onSelectionChange={setSelectedArticleText}
                onChange={({ html, text }) => {
                  setEditorHtml(html);
                  setEditorText(text);
                }}
              />
            </div>
          </div>
        </div>
      </form>

      <EditorInspector
        silos={silos}
        selectedSiloId={selectedSiloId}
        onSiloChange={setSelectedSiloId}
        fields={{
          siloRole,
          setSiloRole,
          siloGroup,
          setSiloGroup,
          keyword,
          setKeyword,
          metaTitle,
          setMetaTitle,
          metaDescription,
          setMetaDescription,
          canonicalPath,
          setCanonicalPath,
          schemaType,
          setSchemaType,
          intent,
          setIntent,
          category,
          setCategory,
          tags,
          setTags,
          title,
          setTitle,
          excerpt,
          setExcerpt,
          coverPreview,
          status: article?.status,
        }}
        pending={pending}
        error={error}
        mode={mode}
      />
      </div>

      <EditorDialogLayer
        activeDialog={activeDialog}
        selection={dialogSelection}
        keyword={keyword}
        title={title}
        selectedSiloName={selectedSilo?.name}
        onClose={() => setActiveDialog(null)}
        onInsertLink={handleInsertLink}
        onImproveText={handleImproveText}
        onInsertMedia={(html) => {
          insertSnippet(html);
          setActiveDialog(null);
        }}
        onInsertProduct={(html) => {
          insertSnippet(html);
          setActiveDialog(null);
        }}
        onInsertBlock={() => {
          addMiniWordPressBlock();
          setActiveDialog(null);
        }}
      />
    </div>
  );
}

function EditorDialogLayer({
  activeDialog,
  selection,
  keyword,
  title,
  selectedSiloName,
  onClose,
  onInsertLink,
  onImproveText,
  onInsertMedia,
  onInsertProduct,
  onInsertBlock,
}: {
  activeDialog: EditorDialog;
  selection: string;
  keyword: string;
  title: string;
  selectedSiloName?: string | null;
  onClose: () => void;
  onInsertLink: (payload: { anchor: string; url: string; title?: string; newTab: boolean; sponsored: boolean }) => void;
  onImproveText: (payload: { original: string; improved: string; explanation: string }) => void;
  onInsertMedia: (html: string) => void;
  onInsertProduct: (html: string) => void;
  onInsertBlock: () => void;
}) {
  if (!activeDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      {activeDialog === "link" ? (
        <LinkDialog
          selection={selection}
          keyword={keyword}
          selectedSiloName={selectedSiloName}
          onClose={onClose}
          onInsert={onInsertLink}
        />
      ) : null}
      {activeDialog === "improve" ? (
        <ImproveTextDialog selection={selection} keyword={keyword} title={title} selectedSiloName={selectedSiloName} onClose={onClose} onApply={onImproveText} />
      ) : null}
      {activeDialog === "media" ? <MediaDialog onClose={onClose} onInsert={onInsertMedia} /> : null}
      {activeDialog === "product" ? <ProductDialog onClose={onClose} onInsert={onInsertProduct} /> : null}
      {activeDialog === "block" ? <BlockDialog onClose={onClose} onInsertBlock={onInsertBlock} /> : null}
    </div>
  );
}

function LinkDialog({
  selection,
  keyword,
  selectedSiloName,
  onClose,
  onInsert,
}: {
  selection: string;
  keyword: string;
  selectedSiloName?: string | null;
  onClose: () => void;
  onInsert: (payload: { anchor: string; url: string; title?: string; newTab: boolean; sponsored: boolean }) => void;
}) {
  const [anchor, setAnchor] = useState(selection || keyword || "");
  const [url, setUrl] = useState(selectedSiloName ? `/blog/s/${slugify(selectedSiloName)}` : "/blog");
  const [linkTitle, setLinkTitle] = useState("");
  const [newTab, setNewTab] = useState(false);
  const [sponsored, setSponsored] = useState(false);

  return (
    <DialogShell eyebrow="Links internos IA" title="Inserir link completo" onClose={onClose}>
      <div className="grid gap-3">
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Anchor
          <input value={anchor} onChange={(event) => setAnchor(event.target.value)} className="admin-input normal-case tracking-normal" />
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          URL destino
          <input value={url} onChange={(event) => setUrl(event.target.value)} className="admin-input font-mono normal-case tracking-normal" />
        </label>
        <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          Title opcional
          <input value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} className="admin-input normal-case tracking-normal" />
        </label>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-md border border-white/12 bg-[#1d1c24] p-3 text-xs text-slate-300">
            <input type="checkbox" checked={newTab} onChange={(event) => setNewTab(event.target.checked)} />
            Abrir em nova aba
          </label>
          <label className="flex items-center gap-2 rounded-md border border-white/12 bg-[#1d1c24] p-3 text-xs text-slate-300">
            <input type="checkbox" checked={sponsored} onChange={(event) => setSponsored(event.target.checked)} />
            Marcar sponsored
          </label>
        </div>
        <div className="rounded-md border border-cyan-300/20 bg-[#10262d] p-3 text-xs leading-5 text-cyan-100">
          Sugestao: use anchors naturais e priorize links para o silo {selectedSiloName || "editorial"} antes de links externos.
        </div>
        <DialogActions onClose={onClose}>
          <button
            type="button"
            onClick={() => onInsert({ anchor, url, title: linkTitle, newTab, sponsored })}
            disabled={!anchor.trim() || !url.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            <Check size={14} />
            Inserir link
          </button>
        </DialogActions>
      </div>
    </DialogShell>
  );
}

function ImproveTextDialog({
  selection,
  keyword,
  title,
  selectedSiloName,
  onClose,
  onApply,
}: {
  selection: string;
  keyword: string;
  title: string;
  selectedSiloName?: string | null;
  onClose: () => void;
  onApply: (payload: { original: string; improved: string; explanation: string }) => void;
}) {
  const [original, setOriginal] = useState(selection || title || "");
  const [mode, setMode] = useState("clareza");
  const [improved, setImproved] = useState(() => buildImprovedText(selection || title || "", keyword, selectedSiloName, "clareza"));

  function regenerate(nextMode = mode) {
    setMode(nextMode);
    setImproved(buildImprovedText(original, keyword, selectedSiloName, nextMode));
  }

  return (
    <DialogShell eyebrow="Guardiao SEO" title="Melhorar trecho selecionado" onClose={onClose} wide>
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {["clareza", "gancho", "seo", "e-e-a-t"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => regenerate(item)}
              className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${
                mode === item ? "border-cyan-300/50 bg-[#10262d] text-cyan-200" : "border-white/12 bg-[#1d1c24] text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Trecho original
            <textarea value={original} onChange={(event) => setOriginal(event.target.value)} rows={8} className="admin-input normal-case tracking-normal" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Versao melhorada
            <textarea value={improved} onChange={(event) => setImproved(event.target.value)} rows={8} className="admin-input normal-case tracking-normal" />
          </label>
        </div>
        <div className="rounded-md border border-white/12 bg-[#1d1c24] p-3 text-xs leading-5 text-slate-300">
          Mantem a intencao, adapta o trecho para FantasyIA e evita keyword forcada. Keyword: {keyword || "pendente"}.
        </div>
        <DialogActions onClose={onClose}>
          <button type="button" onClick={() => regenerate()} className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white">
            <Wand2 size={14} />
            Gerar novamente
          </button>
          <button
            type="button"
            onClick={() => onApply({ original, improved, explanation: mode })}
            disabled={!improved.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            <Check size={14} />
            Aplicar no texto
          </button>
        </DialogActions>
      </div>
    </DialogShell>
  );
}

function MediaDialog({ onClose, onInsert }: { onClose: () => void; onInsert: (html: string) => void }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [kind, setKind] = useState<"image" | "video">("image");

  return (
    <DialogShell eyebrow="Midia editorial" title="Inserir imagem ou video" onClose={onClose}>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setKind("image")} className={`rounded-md border px-3 py-2 text-xs font-bold ${kind === "image" ? "border-cyan-300/50 text-cyan-200" : "border-white/12 text-slate-300"}`}>Imagem</button>
          <button type="button" onClick={() => setKind("video")} className={`rounded-md border px-3 py-2 text-xs font-bold ${kind === "video" ? "border-cyan-300/50 text-cyan-200" : "border-white/12 text-slate-300"}`}>Video</button>
        </div>
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL da midia" className="admin-input" />
        <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Alt text ou legenda" className="admin-input" />
        <DialogActions onClose={onClose}>
          <button
            type="button"
            onClick={() => onInsert(kind === "image" ? `<figure><img src="${escapeAttribute(url)}" alt="${escapeAttribute(alt)}" /><figcaption>${escapeHtml(alt)}</figcaption></figure>` : `<p>[video: ${escapeHtml(url)}]</p>`)}
            disabled={!url.trim()}
            className="rounded-md bg-cyan-300 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            Inserir midia
          </button>
        </DialogActions>
      </div>
    </DialogShell>
  );
}

function ProductDialog({ onClose, onInsert }: { onClose: () => void; onInsert: (html: string) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [cta, setCta] = useState("Ver produto");

  return (
    <DialogShell eyebrow="Produto / afiliacao" title="Inserir bloco de produto" onClose={onClose}>
      <div className="grid gap-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do produto, creator pack ou oferta" className="admin-input" />
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL de destino" className="admin-input" />
        <input value={cta} onChange={(event) => setCta(event.target.value)} placeholder="Texto do CTA" className="admin-input" />
        <DialogActions onClose={onClose}>
          <button
            type="button"
            onClick={() => onInsert(`<aside class="product-callout"><h3>${escapeHtml(name)}</h3><p>Oferta relacionada ao conteudo visual premium do FantasyIA.</p><a href="${escapeAttribute(url)}">${escapeHtml(cta)}</a></aside>`)}
            disabled={!name.trim() || !url.trim()}
            className="rounded-md bg-cyan-300 px-4 py-2 text-xs font-bold text-black disabled:opacity-50"
          >
            Inserir produto
          </button>
        </DialogActions>
      </div>
    </DialogShell>
  );
}

function BlockDialog({ onClose, onInsertBlock }: { onClose: () => void; onInsertBlock: () => void }) {
  return (
    <DialogShell eyebrow="Blocos editoriais" title="Inserir bloco Mini WordPress" onClose={onClose}>
      <div className="grid gap-2">
        {["Brief editorial", "Checklist H2/H3/H4", "CTA premium", "FAQ rapido"].map((label) => (
          <button key={label} type="button" onClick={onInsertBlock} className="rounded-md border border-white/12 bg-[#1d1c24] px-3 py-3 text-left text-xs font-bold text-white hover:border-cyan-300/45">
            {label}
          </button>
        ))}
      </div>
    </DialogShell>
  );
}

function DialogShell({
  eyebrow,
  title,
  children,
  onClose,
  wide,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className={`max-h-[88vh] w-full overflow-y-auto rounded-lg border border-white/15 bg-[#24232c] shadow-2xl ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-white/15 p-2 text-slate-300 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DialogActions({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
      <button type="button" onClick={onClose} className="rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white">
        Cancelar
      </button>
      {children}
    </div>
  );
}

function EditorTopHeader({
  title,
  slug,
  pending,
  onSearch,
  onUndo,
  onRedo,
  onAlign,
}: {
  title: string;
  slug?: string;
  pending: boolean;
  onSearch: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAlign: (align: "left" | "center" | "right") => void;
}) {
  return (
    <header className="border-b border-white/10 bg-[#1d1c24] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[330px] items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-xs font-black text-cyan-300">
            FIA
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">FantasyIA Editor</p>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold uppercase tracking-wide text-cyan-200">Editor de Posts</h1>
              <p className="hidden text-xs text-white/45 xl:block">SEO, conteudo e publicacao num fluxo continuo.</p>
            </div>
          </div>
        </div>

        <div className="flex min-w-[170px] items-center gap-2 rounded-md border border-white/12 bg-[#24232c] px-3 py-2 text-xs text-slate-300">
          <span className="font-bold text-white">Editor</span>
          <span className="h-px flex-1 bg-white/15" />
          <span>{pending ? "Salvando..." : "Salvo agora"}</span>
        </div>

        <div className="flex items-center gap-1">
          <ToolButton icon={<Undo2 size={15} />} label="Desfazer" onClick={onUndo} />
          <ToolButton icon={<Redo2 size={15} />} label="Refazer" onClick={onRedo} />
          <ToolButton icon={<ArrowUp size={15} />} label="Mover acima" />
          <ToolButton icon={<ArrowDown size={15} />} label="Mover abaixo" />
          <ToolButton icon={<AlignLeft size={15} />} label="Alinhar esquerda" onClick={() => onAlign("left")} />
          <ToolButton icon={<AlignCenter size={15} />} label="Alinhar centro" onClick={() => onAlign("center")} />
          <ToolButton icon={<AlignRight size={15} />} label="Alinhar direita" onClick={() => onAlign("right")} />
        </div>

        <div className="flex items-center gap-2 rounded-md border border-white/12 bg-[#24232c] px-2 py-1">
          <span className="px-2 text-[10px] font-bold uppercase text-slate-400">Modos</span>
          <button type="button" title="Desktop" className="rounded px-2 py-1 text-cyan-200"><Monitor size={14} /></button>
          <button type="button" title="Tablet" className="rounded px-2 py-1 text-slate-300"><Tablet size={14} /></button>
          <button type="button" title="Mobile" className="rounded px-2 py-1 text-slate-300"><Smartphone size={14} /></button>
        </div>

        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-[#24232c] px-3 text-xs font-bold text-white hover:border-cyan-300/45"
        >
          <Search size={14} />
          Buscar
        </button>

        <button
          form="miniwordpress-editor-form"
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-300/50 bg-cyan-300 px-3 text-xs font-bold text-black shadow-[0_0_18px_rgba(103,232,249,0.22)] disabled:opacity-60"
        >
          <Save size={14} />
          Salvar
        </button>

        {slug ? (
          <Link
            href={`/blog/${slug}`}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 bg-[#24232c] px-3 text-xs font-bold text-white hover:border-cyan-300/45"
          >
            <Eye size={14} />
            Preview
          </Link>
        ) : (
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-[#24232c] px-3 text-xs font-bold text-slate-500">
            <Eye size={14} />
            Preview
          </button>
        )}

        <nav className="ml-auto mr-12 flex items-center gap-2">
          <HeaderNav href="/dashboard/blog" label="Conteudo" icon={<FileText size={14} />} />
          <HeaderNav href="/dashboard/blog/silos" label="Silos" icon={<Layers size={14} />} />
          <HeaderNav href="/dashboard/blog/create" label="Novo post" icon={<PenLine size={14} />} primary />
        </nav>
      </div>
      <p className="sr-only">{title || "Novo post"}</p>
    </header>
  );
}

function HeaderNav({
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
      className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-bold ${
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function buildImprovedText(original: string, keyword: string, selectedSiloName?: string | null, mode = "clareza") {
  const base = original.trim() || "Este trecho precisa conectar contexto, promessa editorial e proximo passo para o leitor.";
  const silo = selectedSiloName ? ` dentro do silo ${selectedSiloName}` : "";
  const keywordNote = keyword ? `, mantendo ${keyword} como referencia sem forcar a repeticao` : "";

  if (mode === "gancho") {
    return `${base} Abra com uma promessa mais clara para quem busca conteudo visual premium${silo}${keywordNote}, mostrando o que muda na decisao do leitor.`;
  }

  if (mode === "seo") {
    return `${base} Reforce a intencao de busca com linguagem natural${keywordNote} e conecte o paragrafo ao proximo topico do artigo${silo}.`;
  }

  if (mode === "e-e-a-t") {
    return `${base} Acrescente criterio editorial, fonte quando necessario e limite afirmacoes absolutas para preservar confianca e autoridade${silo}.`;
  }

  return `${base} Deixe a frase mais direta, reduza ambiguidade e mantenha um ritmo editorial util para creators, assinantes e conteudo visual premium${silo}.`;
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-white/15 bg-[#1d1c24] px-2 text-xs font-bold text-slate-300 hover:border-cyan-300/45 hover:text-white"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}
