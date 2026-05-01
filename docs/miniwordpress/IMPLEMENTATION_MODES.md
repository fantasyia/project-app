# Mini WordPress Implementation Modes

Este documento define os dois modos oficiais de aplicar o Mini WordPress.

## Modo 1: Projeto novo

Use quando o projeto ainda nao tem site/app rodando ou quando o blog sera a base principal.

### Ideia

O Mini WordPress vira a fundacao do projeto.

Voce instala o produto, cria o Brand Adapter da marca e depois ajusta frontend, silos, IA e Supabase.

### Passos

1. Copiar `miniwordpress-product` para uma nova pasta de projeto.
2. Renomear `package.json`.
3. Atualizar `.env.local` com Supabase e variaveis da marca.
4. Criar ou ajustar Brand Adapter.
5. Rodar migrations Core.
6. Rodar seed da marca.
7. Rodar `npm.cmd install`.
8. Rodar `npm.cmd run dev`.
9. Validar `/admin`.
10. Validar `/admin/silos`.
11. Validar editor.
12. Validar frontend publico.
13. Adaptar IA/prompts ao nicho.
14. Validar build.

### O que pode ser sobrescrito

Em projeto novo, o Mini WordPress pode controlar:

- Estrutura Next.js.
- Rotas publicas do blog.
- `/admin`.
- APIs admin.
- Supabase schema.
- Frontend template.
- Sistema de estilos base.

### O que a marca deve preencher

- Nome.
- Logo.
- Dominio.
- Cores.
- Fontes publicas.
- Silos.
- Autores.
- Prompts do nicho.
- Disclaimers.
- Fontes preferidas.
- Conteudos iniciais.

### Validacao minima

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run supabase:verify
```

## Modo 2: Projeto existente

Use quando o projeto ja esta rodando, como Lindisse, Adalba Pro, Bebe na Rota ou FantasyIA.

### Ideia

O Mini WordPress entra como modulo. Ele nao pode atropelar o app/site atual.

Primeiro se faz um raio-x do repo alvo, depois se injeta o Core em etapas.

### Passos

1. Abrir o repo alvo.
2. Usar `$miniwordpress-repo-map`.
3. Mapear rotas existentes.
4. Mapear Tailwind/CSS global.
5. Mapear Supabase ou banco existente.
6. Definir se `/admin` esta livre.
7. Copiar Core administrativo.
8. Copiar APIs admin necessarias.
9. Copiar componentes editor/silos.
10. Integrar migrations sem apagar tabelas existentes.
11. Criar Brand Adapter da marca.
12. Integrar frontend template apenas onde autorizado.
13. Adaptar prompts IA.
14. Validar build.
15. Testar rotas existentes para garantir que nada quebrou.

### O que nao pode ser sobrescrito

- Home atual, salvo se o usuario pedir.
- Layout global do app principal.
- Auth existente.
- Rotas comerciais do projeto.
- Tabelas existentes sem migration segura.
- Estilos globais da marca.
- Deploy/config de producao.

### Como integrar sem atropelar

Preferir:

- `/admin` como ilha do Mini WordPress.
- `.admin-app` para CSS admin.
- `.editor-public-preview` para preview da marca.
- `lib/brands/<brand>` para configuracao de marca.
- `components/site-template` para estruturas publicas reaproveitaveis.

Evitar:

- Colar `app/globals.css` inteiro por cima do projeto.
- Trocar `layout.tsx` global sem comparar.
- Rodar SQL de seed CareGlow.
- Hardcodar CareGlow em prompts ou frontend.

### Validacao minima

```powershell
npm.cmd run build
npm.cmd run supabase:verify
```

Depois abrir:

- Rotas principais existentes.
- `/admin`
- `/admin/silos`
- `/admin/editor`
- Um post publico.
- Um silo publico.

## Escolha rapida

Use projeto novo quando:

- O site ainda nao existe.
- O blog sera a base.
- Pode aceitar a estrutura do Mini WordPress.

Use projeto existente quando:

- O site/app ja tem layout e rotas.
- Ja existe marca ativa.
- O Mini WordPress deve entrar sem quebrar nada.

## Skills por modo

Projeto novo:

1. `$miniwordpress-export-package`
2. `$miniwordpress-supabase`
3. `$miniwordpress-ai-prompts`
4. `$miniwordpress-frontend-template`
5. `$miniwordpress-admin-ui`

Projeto existente:

1. `$miniwordpress-repo-map`
2. `$miniwordpress-export-package`
3. `$miniwordpress-admin-ui`
4. `$miniwordpress-supabase`
5. `$miniwordpress-frontend-template`
6. `$miniwordpress-ai-prompts`
