# QA Visual Real (Playwright) - 2026-04-20

## Escopo
- Validacao em navegador real das areas publicas e privadas.
- Execucao em 2 perfis:
  - `chromium-desktop`
  - `chromium-mobile` (Pixel 7)
- Servidor de teste sobe automaticamente com `next dev` em `127.0.0.1:3000`.
- Para liberar fluxo privado no ambiente local de QA, `ADMIN_DISABLE_AUTH=1` e aplicado no `playwright.config.ts`.

## Rotas Cobertas
- Publicas:
  - `/`
  - `/pricing`
  - `/blog`
- Privadas:
  - `/dashboard/user/feed`
  - `/dashboard/creator/studio`
  - `/dashboard/affiliate/overview`
  - `/dashboard/admin/overview`
  - `/dashboard/blog`

## Resultado
- Execucao: `npm run qa:visual`
- Resultado final: `16 passed`
- Evidencias salvas em:
  - `test-results/*/*.png`
  - `playwright-report/index.html`

## Comandos
```bash
npm run qa:visual
npm run qa:visual:headed
npm run qa:visual:report
```

## Observacoes
- O log do Next exibiu aviso de `middleware` deprecado para `proxy`; nao bloqueou a execucao.
- O log do dev server exibiu aviso de `allowedDevOrigins` para `127.0.0.1`; nao bloqueou a execucao.
