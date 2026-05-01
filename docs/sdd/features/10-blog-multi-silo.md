# Feature Spec: Blog Multi-Silo CMS

## 1. Identificacao
- Nome da feature: Blog Multi-Silo (editor dashboard + rotas publicas)
- Dominio:
  `blog-editorial` / `public`
- Status:
  `done`

> Update 2026-04-21: o CMS editorial e as rotas publicas do blog foram concluídos na Fase 2, com role canonica `editor` no app.

## 2. Escopo Entregue
- CMS real em `/dashboard/blog`.
- Editor rico em `/dashboard/blog/create` com guardiao SEO, outline e blocos dinamicos.
- Fluxo real de edicao em `/dashboard/blog/[articleId]/edit`.
- Rotas publicas `/blog`, `/blog/[slug]` e hubs `/blog/s/[silo]`.
- Revalidacao de cache nas rotas editoriais/publicas.

## 3. Regras De Negocio
- Somente artigos publicados aparecem no blog publico.
- Acesso editorial protegido por role `editor` (com alias legado para compatibilidade).

## 4. Acceptance Criteria
- [x] CMS conectado a dados reais.
- [x] Criacao e edicao de artigo funcionando.
- [x] Rotas publicas de listagem e detalhe ativas.
- [x] SEO/meta base por artigo/hub.

## 5. Backlog Futuro (Nao Bloqueia Fase 2)
- [ ] Evolucao de taxonomia editorial avancada e automacoes SEO adicionais.
