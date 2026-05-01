# AI Prompts and Brand Adapter

Este documento define como as IAs do Mini WordPress devem ser organizadas para funcionar em qualquer nicho sem ficar presas a CareGlow.

O Core fornece ferramentas, contratos de resposta, validacao e guardrails. A marca fornece contexto, tom, entidades, restricoes e objetivos de nicho.

## Principio

Nenhum prompt Core deve conter uma marca fixa.

Todo prompt deve ser montado a partir de:

1. Prompt Core.
2. Brand Adapter.
3. Contexto do post.
4. Contexto do silo.
5. Acao solicitada.
6. Formato JSON esperado.

## APIs atuais

### `app/api/admin/improve-fragment/route.ts`

Melhora trecho selecionado.

Status atual:

- Usa prompt com referencia CareGlow.
- Ja recebe contexto e posicao do trecho.
- Deve virar prompt adaptavel por marca.

Contrato esperado:

- Melhorar sem mudar a intencao.
- Respeitar posicao: inicio, meio, fim.
- Preservar naturalidade.
- Integrar palavras-chave sem forcar.
- Explicar motivo editorial.

### `app/api/admin/guardian-ai/route.ts`

Analisa SEO e qualidade editorial.

Status atual:

- Usa prompt do Guardiao SEO da CareGlow.
- Retorna analise, quick fixes, meta description, primeiro paragrafo, gaps LSI, secoes PNL e acoes.

Contrato esperado:

- Avaliar clareza, SEO, silo, intencao e confianca.
- Dar acoes priorizadas.
- Nao depender de jargao.
- Usar regras especificas da marca via adapter.

### `app/api/admin/entity-suggestions/route.ts`

Sugere entidades semanticas.

Contrato esperado:

- Receber palavras-chave, texto, nicho, silo e opcionalmente localizacao.
- Retornar termos, entidades, fontes e relacoes.
- Classificar tipo: sinonimo, entidade, pergunta, fonte, local, termo tecnico, produto, risco.
- Sugerir onde usar no artigo.

### `app/api/admin/internal-link-suggestions/route.ts`

Sugere links internos.

Contrato esperado:

- Procurar sinonimos do destino.
- Identificar anchors naturais.
- Priorizar hierarquia do silo.
- Permitir pequena adaptacao de frase.
- Explicar relacao semantica.
- Evitar links artificiais.

## Brand Adapter de IA

Cada marca deve ter um pacote de contexto.

Formato sugerido:

```ts
export const brandAiProfile = {
  brandName: "CareGlow",
  niche: "skincare e cuidados com a pele",
  language: "pt-BR",
  tone: [
    "claro",
    "acolhedor",
    "sem promessa medica",
    "direto",
  ],
  forbiddenClaims: [
    "cura garantida",
    "resultado medico sem fonte",
  ],
  preferredSources: [
    "fontes governamentais",
    "instituicoes medicas",
    "Wikipedia apenas como apoio geral",
  ],
  entityHints: [
    "ingredientes",
    "condicoes de pele",
    "marcas",
    "categorias de produto",
  ],
  localSeoRules: null,
};
```

Para outra marca, trocar somente esse perfil e os silos/seeds.

## Prompt Core: melhorar trecho

Estrutura recomendada:

```text
Voce e o assistente editorial do Mini WordPress.

Objetivo:
Melhorar o trecho selecionado sem alterar a intencao original.

Contexto da marca:
{{brand_profile}}

Contexto do artigo:
{{post_context}}

Posicao do trecho:
{{fragment_position}}

Trecho selecionado:
{{selected_text}}

Regras:
- Se for introducao, melhorar gancho e promessa de leitura.
- Se for meio, melhorar clareza, transicao e profundidade.
- Se for conclusao, reforcar fechamento e proximo passo.
- Integrar termos semanticos somente quando natural.
- Nao criar afirmacoes sem base.
- Nao usar tom generico de IA.

Responda em JSON:
{
  "improvedText": "...",
  "explanation": "...",
  "semanticAnchors": ["..."],
  "riskNotes": []
}
```

## Prompt Core: linkagem interna

```text
Voce e o especialista de arquitetura de silos do Mini WordPress.

Objetivo:
Encontrar oportunidades naturais de link interno para fortalecer o silo.

Contexto da marca:
{{brand_profile}}

Post atual:
{{current_post}}

Destinos possiveis:
{{target_posts}}

Regras:
- Nao use correspondencia exata quando soar forcado.
- Procure sinonimos, relacoes e perguntas equivalentes.
- Priorize anchors ja existentes no texto.
- Se nao existir anchor natural, sugira uma alteracao minima de frase.
- Explique a relacao entre origem e destino.

Responda em JSON:
{
  "suggestions": [
    {
      "targetPostId": "...",
      "anchorText": "...",
      "reason": "...",
      "confidence": 0.0,
      "suggestedAnchorModification": null
    }
  ]
}
```

## Prompt Core: Termos / LSI

```text
Voce e o assistente semantico do Mini WordPress.

Objetivo:
Converter palavras-chave brutas em sugestoes naturais para enriquecer o artigo.

Contexto da marca:
{{brand_profile}}

Palavras-chave informadas:
{{keywords}}

Endereco/localizacao opcional:
{{location}}

Trecho/artigo:
{{article_context}}

Regras:
- Crie sinonimos e relacoes semanticas.
- Sugira entidades de apoio.
- Se houver localizacao, sugira referencias locais uteis.
- Sugira fontes confiaveis quando o assunto exigir prova.
- Indique onde encaixar cada sugestao.
- Nao transformar todo termo em palavra obrigatoria.

Responda em JSON:
{
  "suggestions": [
    {
      "term": "...",
      "type": "synonym|entity|local|source|question|relation",
      "whereToUse": "intro|body|conclusion|faq|local_block|source",
      "naturalPhrase": "...",
      "reason": "..."
    }
  ]
}
```

## Governanca de prompts

Regras:

- Prompts Core ficam versionados no Mini WordPress.
- Brand prompts ficam em pasta/config da marca.
- Toda API deve aceitar `brandKey` ou resolver marca pelo projeto.
- Saidas de IA devem ser validadas por schema.
- Sempre ter fallback heuristico para nao bloquear a interface.
- Nunca aplicar mudanca automaticamente sem acao do usuario quando alterar conteudo editorial.

## Variaveis obrigatorias por marca

- `brandName`
- `domain`
- `language`
- `niche`
- `audience`
- `tone`
- `seoPolicy`
- `legalSafetyRules`
- `preferredSources`
- `silos`
- `forbiddenTopics` quando existir

## Pendencias atuais

- Remover referencias CareGlow dos prompts hardcoded.
- Criar `lib/miniwordpress/ai/prompts`.
- Criar `lib/brands/careglow/ai-profile`.
- Adicionar schemas de resposta compartilhados.
- Criar docs/skills para ajustar prompt pack por nicho.
