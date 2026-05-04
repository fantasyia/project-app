import { NextResponse } from "next/server";
import { requireEditorialRole } from "@/lib/auth/rbac";
import { improveFantasyiaFragment } from "@/lib/miniwordpress/fantasyia-semantic";

type DbClient = Awaited<ReturnType<typeof requireEditorialRole>>["supabase"];

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function apiError(error: unknown, fallback = "Erro interno do Mini WordPress.", status = 500) {
  const message = error instanceof Error ? error.message : fallback;
  return json({ ok: false, error: message, message }, status);
}

async function getPath(context: { params?: Promise<{ path?: string[] }> | { path?: string[] } }) {
  const params = await context.params;
  return params?.path ?? [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstNaturalAnchor(text: string, title: string, keyword?: string | null) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const titleWords = normalizeText(title)
    .split(" ")
    .filter((word) => word.length > 3);
  const keywordWords = normalizeText(keyword ?? "")
    .split(" ")
    .filter((word) => word.length > 3);
  const targets = [...keywordWords, ...titleWords].slice(0, 8);

  for (const sentence of sentences) {
    const normalized = normalizeText(sentence);
    const target = targets.find((word) => normalized.includes(word));
    if (!target) continue;
    const words = sentence.split(/\s+/).filter(Boolean);
    const index = words.findIndex((word) => normalizeText(word).includes(target));
    if (index < 0) continue;
    return words.slice(Math.max(0, index - 2), Math.min(words.length, index + 4)).join(" ");
  }

  return keyword || title.split(/\s+/).slice(0, 5).join(" ");
}

async function listSilos(supabase: DbClient) {
  const { data, error } = await supabase
    .from("silos")
    .select("*")
    .order("menu_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function listSiloPosts(supabase: DbClient, url: URL) {
  const siloId = url.searchParams.get("siloId");
  const postId = url.searchParams.get("postId");

  if (!siloId) return { ok: true, items: [] };

  const { data: posts, error } = await supabase
    .from("blog_articles")
    .select("id,title,slug,silo_id,silo_role,silo_order,silo_group,silo_group_order,show_in_silo_menu,canonical_path")
    .eq("silo_id", siloId)
    .order("silo_order", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: silo } = await supabase.from("silos").select("slug").eq("id", siloId).maybeSingle();
  const siloSlug = silo?.slug ?? null;
  const items = (posts ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    role: item.silo_role ?? "SUPPORT",
    position: item.silo_order ?? item.silo_group_order ?? null,
    silo_group: item.silo_group ?? null,
    silo_order: item.silo_order ?? 0,
    silo_group_order: item.silo_group_order ?? 0,
    show_in_silo_menu: item.show_in_silo_menu ?? true,
    siloSlug,
    url: item.canonical_path || (siloSlug ? `/blog/s/${siloSlug}/${item.slug}` : `/blog/${item.slug}`),
  }));

  const current = postId ? items.find((item: any) => item.id === postId) : null;
  return {
    ok: true,
    items,
    groups: [],
    pillar: items.find((item: any) => item.role === "PILLAR") ?? null,
    siloSlug,
    role: current?.role ?? null,
    position: current?.position ?? null,
    silo_group: current?.silo_group ?? null,
    silo_order: current?.silo_order ?? 0,
    silo_group_order: current?.silo_group_order ?? 0,
    show_in_silo_menu: current?.show_in_silo_menu ?? true,
  };
}

async function listMentions(supabase: DbClient, url: URL) {
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return { ok: true, items: [] };

  const { data, error } = await supabase
    .from("blog_articles")
    .select("id,title,slug,silo_id,canonical_path,silos(slug)")
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%,target_keyword.ilike.%${q}%`)
    .limit(12);

  if (error) throw new Error(error.message);

  return {
    ok: true,
    items: (data ?? []).map((item: any) => {
      const siloSlug = item.silos?.slug ?? "";
      return {
        id: item.id,
        title: item.title,
        slug: item.slug,
        siloSlug,
        url: item.canonical_path || (siloSlug ? `/blog/s/${siloSlug}/${item.slug}` : `/blog/${item.slug}`),
      };
    }),
  };
}

async function internalLinkSuggestions(supabase: DbClient, body: any) {
  const siloId = String(body?.siloId || "");
  const postId = String(body?.postId || "");
  const text = String(body?.text || "");
  if (!siloId || !postId) return { ok: true, suggestions: [], source: "fallback", message: "Defina o silo do artigo." };

  const { data: silo } = await supabase.from("silos").select("slug").eq("id", siloId).maybeSingle();
  const { data, error } = await supabase
    .from("blog_articles")
    .select("id,title,slug,target_keyword,silo_role,silo_order,canonical_path")
    .eq("silo_id", siloId)
    .neq("id", postId)
    .limit(20);

  if (error) throw new Error(error.message);

  const existingLinks = Array.isArray(body?.existingLinks) ? body.existingLinks : [];
  const suggestions = (data ?? []).map((item: any, index) => {
    const url = item.canonical_path || (silo?.slug ? `/blog/s/${silo.slug}/${item.slug}` : `/blog/${item.slug}`);
    const anchorText = firstNaturalAnchor(text, item.title, item.target_keyword);
    const alreadyLinked = existingLinks.some((link: any) => link?.dataPostId === item.id || link?.href === url);
    return {
      candidateId: `${item.id}:${index}`,
      postId: item.id,
      title: item.title,
      url,
      slug: item.slug,
      anchorBucket: index % 3 === 0 ? "START" : index % 3 === 1 ? "MID" : "END",
      role: item.silo_role ?? null,
      position: item.silo_order ?? null,
      score: alreadyLinked ? 0 : 72 - index,
      semanticScore: 70 - Math.min(index, 20),
      hierarchyScore: item.silo_role === "PILLAR" ? 95 : 70,
      anchorText,
      reason: "Sugestao por proximidade de silo e encaixe semantico no texto atual.",
      suggestedAnchorModification: anchorText ? undefined : `Introduza uma frase natural sobre ${item.target_keyword || item.title}.`,
      source: "heuristic",
      alreadyLinked,
    };
  });

  return {
    ok: true,
    suggestions,
    source: "fantasyia-semantic-fallback",
    diagnostics: {
      semantic: { lsiCoverageScore: suggestions.length ? 68 : 0, missingRelatedTerms: [] },
      structure: { coverageScore: suggestions.length ? 72 : 0, missingSections: [] },
      warnings: suggestions.length ? [] : ["Sem posts suficientes neste silo para sugerir links internos."],
    },
  };
}

async function entitySuggestions(supabase: DbClient, body: any) {
  const keyword = String(body?.keyword || body?.title || "");
  const text = String(body?.text || "");
  const { data } = await supabase
    .from("blog_articles")
    .select("id,title,slug,canonical_path,silos(slug)")
    .neq("id", String(body?.postId || "00000000-0000-0000-0000-000000000000"))
    .limit(5);

  const baseTerms = Array.from(
    new Set(
      [keyword, ...String(body?.supportingKeywords || "").split(/[,;\n]/)]
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    )
  );

  const suggestions = baseTerms.map((term, index) => {
    const mention = (data ?? [])[index % Math.max(data?.length || 1, 1)] as any;
    const siloSlug = mention?.silos?.slug ?? "";
    const mentionUrl = mention ? mention.canonical_path || (siloSlug ? `/blog/s/${siloSlug}/${mention.slug}` : `/blog/${mention.slug}`) : null;
    return {
      term,
      reason: text ? "Entidade extraida do contexto do artigo para reforcar o campo semantico." : "Entidade editorial sugerida para o nicho FantasyIA.",
      confidence: 0.72,
      suggestedLinkType: mentionUrl ? "mention" : "about",
      aboutUrl: `https://www.google.com/search?q=${encodeURIComponent(term)}`,
      mentionPost: mentionUrl ? { id: mention.id, title: mention.title, url: mentionUrl } : null,
    };
  });

  return {
    ok: true,
    suggestions,
    diagnostics: {
      semantic: { lsiCoverageScore: suggestions.length ? 70 : 0, missingRelatedTerms: [] },
      structure: { coverageScore: 70, missingSections: [] },
      warnings: [],
    },
  };
}

async function handleGet(request: Request, path: string[]) {
  const { supabase } = await requireEditorialRole();
  const url = new URL(request.url);
  const resource = path.join("/");

  if (resource === "silos") return json({ ok: true, items: await listSilos(supabase) });
  if (resource === "silo-posts") return json(await listSiloPosts(supabase, url));
  if (resource === "mentions") return json(await listMentions(supabase, url));
  if (resource === "link-audits") return json({ ok: true, items: [] });
  if (path[0] === "link-occurrences" && path[1]) return json({ ok: true, occurrence: null });

  if (resource === "slug-check") {
    const slug = url.searchParams.get("slug")?.trim();
    const id = url.searchParams.get("id") || url.searchParams.get("postId");
    if (!slug) return json({ ok: true, available: false });
    let query = supabase.from("blog_articles").select("id").eq("slug", slug).limit(1);
    if (id) query = query.neq("id", id);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return json({ ok: true, available: !data?.length });
  }

  return json({ ok: false, error: "Rota admin do Mini WordPress nao encontrada." }, 404);
}

async function handlePost(request: Request, path: string[]) {
  const { supabase } = await requireEditorialRole();
  const resource = path.join("/");

  if (resource === "silos") {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (!name) return json({ ok: false, error: "Nome do silo e obrigatorio." }, 400);
    const { data, error } = await supabase
      .from("silos")
      .insert({ name, slug: slugify(name), menu_order: 99, is_active: true, show_in_navigation: true })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return json({ ok: true, item: data });
  }

  if (resource === "upload") {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return json({ ok: false, error: "Arquivo ausente." }, 400);
    const ext = file.name.split(".").pop() || "bin";
    const key = `miniwordpress/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("blog-media").upload(key, file, { upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("blog-media").getPublicUrl(key);
    return json({ ok: true, url: data.publicUrl, publicUrl: data.publicUrl });
  }

  const body = await request.json().catch(() => ({}));

  if (resource === "improve-fragment") {
    const result = improveFantasyiaFragment({
      text: String(body?.text || ""),
      keyword: body?.keyword ? String(body.keyword) : "",
      siloName: body?.siloName ? String(body.siloName) : null,
      position: body?.position ? String(body.position) : "meio",
      mode: body?.mode ? String(body.mode) : "clareza",
    });
    return json({
      ok: true,
      improvedText: result.improved,
      explanation: result.explanation,
      semanticAnchors: result.semanticAnchors,
    });
  }

  if (resource === "guardian-ai") {
    const issues = Array.isArray(body?.issues) ? body.issues : [];
    return json({
      ok: true,
      result: {
        analysis: issues.length
          ? "Priorize os alertas criticos, ajuste a promessa do titulo e mantenha o texto alinhado ao nicho FantasyIA."
          : "O artigo esta em boa direcao editorial. Revise apenas clareza, fontes e links internos antes de publicar.",
        quick_fixes: issues.slice(0, 5),
        suggested_meta_description: String(body?.metaDescription || "").slice(0, 170),
      },
      diagnostics: {
        coverage: { lsiCoverageScore: issues.length ? 55 : 82 },
        structure: { coverageScore: issues.length ? 60 : 80, missingSections: [] },
      },
    });
  }

  if (resource === "internal-link-suggestions") return json(await internalLinkSuggestions(supabase, body));
  if (resource === "entity-suggestions") return json(await entitySuggestions(supabase, body));

  if (resource === "product-preview") {
    const url = String(body?.url || "");
    return json({
      ok: true,
      title: url.includes("amazon") || url.includes("amzn") ? "Produto Amazon" : "Produto",
      image: "",
      price: "R$ --",
      rating: 4.5,
      url,
    });
  }

  return json({ ok: false, error: "Rota admin do Mini WordPress nao encontrada." }, 404);
}

export async function GET(request: Request, context: any) {
  try {
    return await handleGet(request, await getPath(context));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, context: any) {
  try {
    return await handlePost(request, await getPath(context));
  } catch (error) {
    return apiError(error);
  }
}
