# Mini WordPress Implementation Checklist

Status: draft inicial  
Uso: checklist para instalar ou adaptar o Mini WordPress em outro projeto.

## 1. Antes de comecar

- [ ] Identificar se o destino e projeto novo ou projeto existente.
- [ ] Definir marca, dominio e nicho.
- [ ] Definir se o blog sera a home, uma secao do site ou subdominio.
- [ ] Definir se existe app/site principal que nao pode ser afetado.
- [ ] Definir silos iniciais.
- [ ] Definir tom editorial e regras de IA.
- [ ] Confirmar acesso Supabase.
- [ ] Confirmar acesso a variaveis de ambiente.
- [ ] Confirmar se Contentor sera usado.

## 2. Classificacao do projeto destino

### Projeto novo

- [ ] Usar pacote neutro quando existir.
- [ ] Aplicar Core completo.
- [ ] Aplicar Frontend Template.
- [ ] Criar Brand Adapter.
- [ ] Criar Supabase novo.
- [ ] Rodar migrations/clone.
- [ ] Rodar seed core.
- [ ] Rodar seed da marca.

### Projeto existente

- [ ] Mapear rotas existentes.
- [ ] Confirmar onde `/admin` pode entrar.
- [ ] Confirmar se rotas publicas dinamicas conflitam.
- [ ] Preservar app/site principal.
- [ ] Integrar Core sem sobrescrever estilos globais do projeto.
- [ ] Adaptar Frontend Template apenas onde autorizado.

## 3. Brand Adapter

- [ ] `BRAND_NAME`
- [ ] `BRAND_DOMAIN`
- [ ] `BRAND_URL`
- [ ] `BRAND_DESCRIPTION`
- [ ] `BRAND_TAGLINE`
- [ ] `BRAND_CONTACT_EMAIL`
- [ ] `BRAND_LOGO`
- [ ] Cores publicas.
- [ ] Fontes publicas.
- [ ] Disclaimer afiliado.
- [ ] Autores/colaboradores.
- [ ] Prompts por nicho.
- [ ] Lista inicial de silos.
- [ ] Seeds iniciais.

## 4. Core admin

- [ ] `/admin` funcionando.
- [ ] Login/admin auth funcionando.
- [ ] Header admin com nome/logo da marca via adapter/env.
- [ ] Admin dark mode isolado em `.admin-app`.
- [ ] `.editor-public-preview` nao afetado por overrides do admin.
- [ ] Painel de conteudos denso.
- [ ] Painel de silos denso.
- [ ] Slugs legiveis.
- [ ] Campos raros recolhidos.

## 5. Editor

- [ ] Editor Tiptap abre post existente.
- [ ] Editor cria post novo.
- [ ] Toolbar funciona.
- [ ] Upload/midia funciona.
- [ ] Buscar no Artigo no topo.
- [ ] Estrutura H2/H3/H4 visivel.
- [ ] Links internos IA funcionando.
- [ ] Link Hygiene funcionando.
- [ ] Guardian SEO funcionando.
- [ ] Termos / LSI IA no final.
- [ ] Revisao contem Analise SERP do Post.
- [ ] Aplicar melhoria de trecho injeta texto no editor.

## 6. SEO e Silos

- [ ] Silo listagem funciona.
- [ ] Silo detail funciona.
- [ ] Metadados de silo salvam.
- [ ] Grupos editoriais salvam.
- [ ] Mapa de links renderiza.
- [ ] Slugs aparecem claros.
- [ ] Canibalizacao lista riscos.
- [ ] SERP roda quando configurado.
- [ ] Silo health indica orfaos e pendencias.

## 7. Frontend Template

- [ ] Header publico usa logo da marca.
- [ ] Busca publica funciona.
- [ ] Menu de 2 linhas aparece na home desktop.
- [ ] `Inicio` ocupa duas linhas na esquerda.
- [ ] Silos aparecem no centro em duas linhas.
- [ ] `Sobre` e `Contato` ficam no final/direita.
- [ ] Mobile preserva acesso aos silos.
- [ ] Pagina de silo carrega.
- [ ] Pagina de post carrega.
- [ ] Indice/table of contents funciona.
- [ ] Footer usa dados da marca.

## 8. Supabase

- [ ] Confirmar CLI Supabase instalado.
- [ ] Confirmar login Supabase.
- [ ] Criar projeto Supabase destino.
- [ ] Obter project ref.
- [ ] Obter db password.
- [ ] Obter anon key.
- [ ] Obter service role key.
- [ ] Rodar clone/migrations.
- [ ] Atualizar `.env.local`.
- [ ] Rodar seed.
- [ ] Rodar verify.

Comando atual documentado:

```bash
pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

Windows fallback a documentar/testar:

```powershell
corepack pnpm supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

ou, se scripts forem ajustados para npm:

```powershell
npm.cmd run supabase:clone -- --project-ref <PROJECT_REF> --db-password "<DB_PASSWORD>" --anon-key "<ANON_KEY>" --service-role-key "<SERVICE_ROLE_KEY>"
```

## 9. Contentor

- [ ] Confirmar se Contentor publicara no ambiente local ou producao.
- [ ] Se local, iniciar Next dev.
- [ ] Se local externo, iniciar `cloudflared.exe`.
- [ ] Criar application password.
- [ ] Configurar Contentor com `/wp-json/wp/v2`.
- [ ] Testar `/wp-json/wp/v2/users/me`.
- [ ] Testar import de post como draft.
- [ ] Testar upload de media.

## 10. IA e prompts

- [ ] Configurar provider IA.
- [ ] Configurar variaveis de ambiente.
- [ ] Definir prompt base do nicho.
- [ ] Definir regras de tom da marca.
- [ ] Definir entidades confiaveis.
- [ ] Definir fontes proibidas/permitidas.
- [ ] Testar melhorar trecho.
- [ ] Testar linkagem interna.
- [ ] Testar LSI/entidades.
- [ ] Testar Guardian SEO.

## 11. Validacao tecnica

- [ ] Instalar dependencias.
- [ ] Rodar build.
- [ ] Rodar verificacao Supabase.
- [ ] Rodar testes criticos se existirem.
- [ ] Navegar `/admin`.
- [ ] Navegar `/admin/silos`.
- [ ] Navegar `/admin/editor/new`.
- [ ] Navegar home publica.
- [ ] Navegar silo publico.
- [ ] Navegar post publico.

## 12. Criterio de pronto

Uma implementacao esta pronta quando:

- [ ] Core funciona sem nome hardcoded da marca antiga.
- [ ] Brand Adapter carrega dados da marca destino.
- [ ] Admin nao quebra o estilo publico.
- [ ] Frontend Template preserva menu 2 linhas.
- [ ] Banco esta validado.
- [ ] Contentor esta documentado/configurado quando aplicavel.
- [ ] Prompts do nicho estao registrados.
- [ ] Um agente novo consegue continuar sem perguntar contexto basico.
