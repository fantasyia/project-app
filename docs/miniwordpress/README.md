# Mini WordPress

Esta pasta e a fonte canonica para transformar o sistema atual em um produto reutilizavel.

O objetivo e separar claramente:

- **Core**: o Mini WordPress em si.
- **Brand Adapter**: configuracoes, identidade e prompt pack de cada marca.
- **Frontend Template**: estruturas publicas reaproveitaveis, como menu de 2 linhas, indice do post e rodape.
- **Legacy / CareGlow**: tudo que veio da implementacao atual e ainda precisa ser isolado antes de virar template neutro.

## Documentos

- `PRD.md`: visao de produto, escopo, regras de separacao e roadmap.
- `REPOSITORY_AUDIT.md`: raio-x inicial do repositorio atual, com classificacao Core / Brand / Template / Legacy.
- `ARCHITECTURE.md`: arquitetura tecnica e decisoes iniciais.
- `REPOSITORY_MAP.md`: mapa operacional de pastas e donos.
- `IMPLEMENTATION_CHECKLIST.md`: checklist para instalar/adaptar o Mini WordPress em outro projeto.
- `DATABASE_SCHEMA.md`: schema esperado, tabelas obrigatorias e pendencias de migrations/seeds.
- `SUPABASE_CLONE_PLAYBOOK.md`: fluxo especializado para clonar Supabase do Mini WordPress.
- `CONTENTOR_CLOUDFLARED.md`: guia de Contentor, WordPress adapter e tunnel local.
- `FRONTEND_TEMPLATE.md`: contrato do frontend reutilizavel, incluindo menu de 2 linhas.
- `BRAND_ADAPTER_GUIDE.md`: guia para adaptar marca, nicho, prompts, silos e seeds.
- `ADMIN_UI_SYSTEM.md`: contrato visual e operacional do admin dark mode, denso e independente da marca.
- `EDITOR_SYSTEM.md`: zonas do editor, ordem dos paineis, busca, Termos/LSI, revisao e IA.
- `SILOS_AND_SEO_SYSTEM.md`: sistema de silos, mapa de links, canibalizacao, SERP e SEO tecnico.
- `AI_PROMPTS_AND_BRAND_ADAPTER.md`: prompts Core, adaptacao por marca/nicho e contratos JSON das IAs.
- `TAILWIND4_SYSTEM.md`: regras de Tailwind 4, tokens, hardening dark mode e separacao admin/brand/template.
- `AGENTS_SKILLS_PLAN.md`: plano dos skills necessarios para agentes implementarem o Mini WordPress.
- `EXPORT_PACKAGE_GUIDE.md`: guia para gerar ZIP/repositorio neutro e aplicar em projetos novos ou existentes.
- `MIGRATIONS_AUDIT.md`: auditoria das migrations canonicas, SQL legado e plano de consolidacao.
- `IMPLEMENTATION_MODES.md`: guia operacional dos dois modos: projeto novo e projeto existente.
- `LOCAL_ZIP_GUIDE.md`: guia para gerar ZIP local incluindo `.env.local` e `cloudflared.exe`.

## Ordem recomendada de leitura

Para entender o produto:

1. `PRD.md`
2. `ARCHITECTURE.md`
3. `REPOSITORY_AUDIT.md`
4. `REPOSITORY_MAP.md`

Para implementar em outro projeto:

1. `IMPLEMENTATION_CHECKLIST.md`
2. `BRAND_ADAPTER_GUIDE.md`
3. `DATABASE_SCHEMA.md`
4. `SUPABASE_CLONE_PLAYBOOK.md`
5. `EXPORT_PACKAGE_GUIDE.md`

Para trabalhar em uma area especifica:

- Admin: `ADMIN_UI_SYSTEM.md` e `TAILWIND4_SYSTEM.md`
- Editor: `EDITOR_SYSTEM.md`
- Silos/SEO: `SILOS_AND_SEO_SYSTEM.md`
- IA/prompts: `AI_PROMPTS_AND_BRAND_ADAPTER.md`
- Frontend publico: `FRONTEND_TEMPLATE.md`
- Contentor: `CONTENTOR_CLOUDFLARED.md`
- Agentes: `AGENTS_SKILLS_PLAN.md`
- Migrations: `MIGRATIONS_AUDIT.md`
- Modos de instalacao: `IMPLEMENTATION_MODES.md`
- ZIP local: `LOCAL_ZIP_GUIDE.md`

## Regra de trabalho

Antes de exportar ZIP, criar skills ou reaplicar em outra marca, atualizar estes documentos. O repositorio atual ainda mistura CareGlow com Core em varios pontos; esta pasta existe para impedir que essa mistura vire padrao nos proximos projetos.
