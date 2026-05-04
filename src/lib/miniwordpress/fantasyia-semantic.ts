export type SemanticSuggestion = {
  phrase: string;
  relation: string;
  reason: string;
};

const fantasyiaSemanticMap: Record<string, SemanticSuggestion[]> = {
  "arte ia": [
    {
      phrase: "conteudo visual gerado com IA",
      relation: "sinonimo natural",
      reason: "Funciona em introducoes e explicacoes sem repetir a keyword de forma mecanica.",
    },
    {
      phrase: "workflow criativo com inteligencia artificial",
      relation: "relacao de processo",
      reason: "Ajuda a conectar ferramenta, producao e resultado visual.",
    },
  ],
  creator: [
    {
      phrase: "criadores que monetizam conteudo visual",
      relation: "publico-alvo",
      reason: "Traz o contexto de negocio do FantasyIA para o trecho.",
    },
    {
      phrase: "perfil de creator premium",
      relation: "entidade editorial",
      reason: "Serve para falar de posicionamento, assinatura e oferta privada.",
    },
  ],
  assinatura: [
    {
      phrase: "acesso recorrente por assinatura",
      relation: "modelo de receita",
      reason: "Mais claro para SEO e para leitores comparando formas de monetizacao.",
    },
    {
      phrase: "beneficio continuo para assinantes",
      relation: "retencao",
      reason: "Ajuda a conectar valor percebido e recorrencia.",
    },
  ],
  ppv: [
    {
      phrase: "venda avulsa de conteudo premium",
      relation: "sinonimo explicativo",
      reason: "Traduz PPV sem perder a intencao comercial.",
    },
    {
      phrase: "desbloqueio pontual de uma publicacao",
      relation: "mecanica de produto",
      reason: "Bom para trechos que explicam jornada de compra.",
    },
  ],
  "conteudo premium": [
    {
      phrase: "material exclusivo para assinantes",
      relation: "sinonimo comercial",
      reason: "Mantem o sentido de exclusividade sem ficar generico.",
    },
    {
      phrase: "experiencia visual privada",
      relation: "posicionamento de marca",
      reason: "Aproxima o texto do nicho FantasyIA.",
    },
  ],
  comunidade: [
    {
      phrase: "relacionamento continuo com a audiencia",
      relation: "retencao",
      reason: "Serve para explicar comunidade sem depender de jargao.",
    },
    {
      phrase: "base de fas e assinantes",
      relation: "entidade de negocio",
      reason: "Conecta descoberta, recorrencia e monetizacao.",
    },
  ],
};

const genericRelations = [
  "intencao de busca",
  "prova editorial",
  "decisao do leitor",
  "contexto do silo",
  "proximo passo natural",
];

export function splitKeywordInput(input: string) {
  return input
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildSemanticKeywordSuggestions(input: string, context = ""): SemanticSuggestion[] {
  const keywords = splitKeywordInput(input);
  if (keywords.length === 0) return [];

  return keywords.flatMap((keyword) => {
    const normalized = normalizeKeyword(keyword);
    const mapped = fantasyiaSemanticMap[normalized];
    if (mapped) return mapped;

    const contextHint = context ? `Use quando o trecho falar de ${context}.` : "Use quando encaixar no fluxo do paragrafo.";
    return [
      {
        phrase: keyword,
        relation: "keyword base",
        reason: "Termo mantido para referencia semantica principal.",
      },
      {
        phrase: `${keyword} no contexto de conteudo visual premium`,
        relation: genericRelations[0],
        reason: contextHint,
      },
      {
        phrase: `como ${keyword} muda a decisao do creator`,
        relation: genericRelations[2],
        reason: "Transforma a keyword em uma frase mais natural para H2, H3 ou paragrafo de transicao.",
      },
    ];
  });
}

export function improveFantasyiaFragment({
  text,
  keyword,
  siloName,
  position,
  mode,
}: {
  text: string;
  keyword?: string;
  siloName?: string | null;
  position?: string;
  mode?: string;
}) {
  const original = text.trim() || "Este trecho precisa explicar a ideia principal com mais contexto para o leitor.";
  const positionHint = buildPositionHint(position);
  const keywordHint = keyword?.trim() ? ` A referencia semantica principal e "${keyword.trim()}", sem repeticao forcada.` : "";
  const siloHint = siloName ? ` Conecte naturalmente com o silo "${siloName}".` : "";
  const modeHint = buildModeHint(mode);

  return {
    improved: `${original} ${positionHint}${modeHint}${keywordHint}${siloHint}`.replace(/\s+/g, " ").trim(),
    explanation: `Reforcei clareza, contexto FantasyIA e encaixe semantico para ${position || "meio do artigo"}.`,
    semanticAnchors: buildSemanticKeywordSuggestions(keyword || "", siloName || "").slice(0, 4).map((item) => item.phrase),
  };
}

function normalizeKeyword(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildPositionHint(position?: string) {
  if (position === "inicio" || position === "gancho") {
    return "Abra com uma promessa clara e mostre rapidamente por que isso importa para creators, assinantes ou descoberta visual.";
  }

  if (position === "fim" || position === "conclusao") {
    return "Feche a ideia com uma conclusao util e aponte o proximo passo sem parecer chamada comercial forcada.";
  }

  return "No meio do artigo, mantenha transicao suave, criterio editorial e relacao direta com a duvida do leitor.";
}

function buildModeHint(mode?: string) {
  if (mode === "seo") return " Integre entidades, sinonimos e intencao de busca com linguagem natural.";
  if (mode === "e-e-a-t") return " Evite afirmacoes absolutas e acrescente criterio editorial verificavel quando necessario.";
  if (mode === "gancho") return " Transforme a primeira frase em um hook especifico e menos generico.";
  return " Corte ambiguidades e preserve um tom profissional, direto e discreto.";
}
