# Feature Spec: 02 RBAC And Roles Legados

Use este template para qualquer nova feature ou refactor relevante.

## 1. Identificacao
- Nome da feature: Estrategia de Roles e RBAC Centralizado
- Dominio:
  `plataforma-core`
- Status:
  `approved`

## 2. Problema
- O que estava faltando? O controle de acesso dependia demais de `user_metadata.role` (string unica), com risco de inconsistencias em papeis hibridos. Tambem existia a role `writer` em conflito com o nome canonico `editor`.
- Por que isso importa para o produto? Seguranca, prevencao de vazamento de dados e clareza de governanca entre areas privadas.

## 3. Usuarios Afetados
- Quem administra? Admins e toda a camada de seguranca da plataforma.

## 4. Escopo Funcional
- O que a feature faz? Centraliza RBAC via `normalizeRole`, `hasAccessTo`, `requireAuth` e `requireRole`, com transicao de `writer/blog` para `editor`.
- O que explicitamente nao faz? Nao altera tabelas de negocio principais (isso pertence a outras features de dominio/schema).

## 5. Regras De Negocio
- Quais regras do `project-plaintext-context` governam essa feature? Separacao hermetica entre as areas Publica, User, Creator, Admin, Affiliate e Blog Editorial.

## 6. Impacto Em Dados / Schema
- Enums/status: role no metadata/JWT e role em `users`.
- Observacao de transicao: alguns ambientes ainda usam enum legado `writer` no banco; o app segue canonico em `editor` com fallback de compatibilidade.

## 7. Impacto Em RBAC
- Quais roles podem acessar? `admin`, `creator`, `affiliate`, `editor`, `subscriber` (com `admin` como role hierarquica superior).
- Quais acoes sao sensiveis? Namespaces `/dashboard/admin`, `/dashboard/creator`, `/dashboard/affiliate`, `/dashboard/blog`.
- Middleware basta ou precisa validacao adicional no backend? Middleware bloqueia navegacao; Server Actions usam `requireRole` para enforcement no backend.

## 8. Impacto Em UI
- Navegacao esperada: perfis sem permissao recebem redirect para rota segura (`/dashboard/user/feed` ou `/login`, conforme contexto).

## 9. Architecture Delta
- O que mudou na arquitetura atual? Padronizacao dos guards no Next App Router e role canonica `editor` na camada de aplicacao.

## 10. Acceptance Criteria
- [x] Middlewares redirecionam perfis sem permissao.
- [x] Server Actions nao executam sem `requireRole(X)`.
- [x] Codigo remove uso funcional de role legacy `writer` no app, mantendo apenas alias/fallback de compatibilidade.

## 11. Task Breakdown
- [x] Criar arquivo `src/lib/auth/rbac.ts`
- [x] Atualizar `src/lib/supabase/middleware.ts`
- [x] Modificar Server Actions legadas de dashboard para usar guards.
- [x] Validar fluxo de redirect por role.

## 12. Skills Recomendados
- `project-plaintext-context`
- `fantasyia-sdd-delivery`
