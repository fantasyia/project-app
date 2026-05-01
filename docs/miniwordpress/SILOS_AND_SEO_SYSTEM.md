# Silos and SEO System

Este documento define o sistema de silos, arquitetura editorial, SEO tecnico e auditorias do Mini WordPress.

O silo e a unidade central de organizacao editorial. Cada marca pode ter silos diferentes, mas a logica de gerenciamento, auditoria e linkagem pertence ao Core.

## Objetivos

- Organizar o site em hubs claros.
- Definir posts pilar e suporte.
- Controlar linkagem interna.
- Evitar canibalizacao.
- Facilitar atualizacao de posts publicados.
- Guiar producao SEO sem depender de planilhas externas.

## Entidades principais

### Silo

Agrupa posts por tema.

Campos Core:

- `id`
- `name`
- `slug`
- `description`
- `menu_order`
- `active`
- `show_in_menu`
- metadados SEO
- configuracao de grupos editoriais

Campos Brand:

- nomes dos silos
- slugs publicos
- descricao editorial
- meta title/description
- grupos editoriais especificos do nicho

### Post do silo

Representa o papel editorial de um post dentro do hub.

Campos importantes:

- `silo_id`
- `post_id`
- `role`: pilar ou suporte
- `position`
- `primary_keyword`
- `supporting_keywords`
- `group_id`

### Links

O sistema acompanha links internos e externos.

Funcoes:

- Contar entradas e saidas.
- Detectar orfaos.
- Identificar excesso de links externos.
- Sugerir links internos.
- Registrar ocorrencias de links no texto.

## Paineis atuais

### `/admin/silos`

Listagem de silos e hubs.

Regras de layout:

- Mostrar nome e slug com alta legibilidade.
- Evitar cards grandes.
- Manter tabela densa.
- Destacar status de menu/publicacao.
- Permitir abrir painel rapidamente.

### `/admin/silos/[slug]`

Painel de inteligencia do silo.

Abas:

- Metadados.
- Visao Geral.
- Mapa de Links.
- Canibalizacao.
- SERP.

Contrato:

- Metadados e setup nao devem ocupar a tela inteira.
- Campos raros devem ficar recolhiveis.
- Mapa de links deve priorizar leitura de titulo, slug, papel e contagem.
- Canibalizacao deve mostrar pares problemáticos com acao clara.
- SERP deve ficar para comparacao e auditoria.

## Metadados de silo

Como o usuario normalmente preenche uma vez e altera pouco, o painel deve ser compacto.

Campos sempre visiveis:

- Nome.
- Slug.
- Ordem no menu.
- Ativo.
- Exibir no menu.
- Salvar.

Campos avancados/recolhiveis:

- Descricao.
- Meta title.
- Meta description.
- Hero image URL.
- Hero alt.
- Conteudo do pilar.
- Exclusao permanente.

## Grupos editoriais

Os grupos editoriais ajudam a distribuir posts dentro do silo.

Core:

- Criar, editar e ordenar grupos.
- Contar posts por grupo.
- Mostrar grupos vazios.

Brand:

- Nomes dos grupos.
- Estrategia editorial por nicho.

Exemplo CareGlow atual:

- Preco / oportunidade.
- Decisao / escolha.
- Tipos.
- Uso / como fazer.
- Marcas / produtos.
- Resultados / tempo.

## Mapa de links

O grafo deve ser funcional, nao decorativo.

Informacoes obrigatorias no node:

- Papel: pilar/suporte.
- Titulo legivel.
- Slug legivel.
- Status.
- Entradas.
- Saidas.

Regras:

- Evitar fonte da marca no grafo.
- Titulo deve usar fonte do sistema.
- Slug deve ter contraste proprio.
- Nodes devem ser compactos e legiveis.
- Zoom e pan devem funcionar.
- O usuario precisa identificar o post pelo slug rapidamente.

## Higiene de silos

Problemas detectaveis:

- Posts orfaos.
- Pilar sem links suficientes.
- Suporte sem link para pilar.
- Links para posts fora do silo sem necessidade.
- Canibalizacao de palavra-chave.
- Links externos excessivos.
- Posts com slug/titulo desalinhados.

## Canibalizacao

O painel de canibalizacao compara posts do mesmo silo ou de silos proximos.

Deve analisar:

- Similaridade de palavra-chave.
- Similaridade de titulo.
- Overlap SERP.
- Intencao de busca.
- H2/H3 concorrentes.
- Necessidade de juntar, separar ou reposicionar conteudo.

Saidas desejadas:

- Risco: high, medium, low.
- Pares afetados.
- Acao sugerida.
- Link para abrir cada SERP.
- Recomendacao editorial clara.

## SERP

SERP e ferramenta de revisao e atualizacao.

Regras:

- No editor do post, Analise SERP do Post fica na aba Revisao.
- No painel do silo, SERP compara saude geral e oportunidades.
- Nao deve ser obrigatorio durante criacao inicial.
- Deve ser usado para atualizar artigos publicados ou em revisao.

## SEO tecnico

O Core deve cuidar de:

- Slug unico.
- Meta title.
- Meta description.
- OG image.
- Alt de imagem principal.
- Schema.
- Canonical.
- Sitemap.
- Robots.
- Publicacao/despublicacao.

A marca define:

- Tom editorial.
- Oferta.
- Entidades e fontes do nicho.
- Palavras-chave iniciais.
- Avisos legais especificos.

## Checklist de implementacao em nova marca

1. Definir lista de silos.
2. Definir slugs publicos.
3. Definir grupos editoriais por silo.
4. Seedar posts ou criar backlog.
5. Validar menu publico de duas linhas.
6. Rodar auditoria de linkagem.
7. Configurar prompts por nicho.
8. Validar SERP e fontes.

## Pendencias atuais

- Remover nomes CareGlow de seeds e prompts.
- Consolidar migrations de silo.
- Separar configuracao de grupos editoriais por marca.
- Criar export/import de silos por `brandConfig`.
