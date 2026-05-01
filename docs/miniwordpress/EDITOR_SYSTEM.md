# Editor System

Este documento define o editor de posts do Mini WordPress.

O editor e a principal estacao de trabalho do sistema. Ele mistura uma area publica da marca, onde o artigo e editado/visualizado, com paineis administrativos do Mini WordPress. Essa separacao e obrigatoria.

## Zonas do editor

### Area da marca

A area central do artigo pertence a marca.

Ela inclui:

- Fundo do artigo.
- Tipografia do artigo.
- Cores do texto publico.
- Imagens.
- Espacamento editorial publico.
- Indice/estrutura publica quando renderizada como preview.
- Componentes do artigo que o visitante final vai enxergar.

No codigo atual essa area e protegida por `.editor-public-preview`.

### Area do Mini WordPress

Tudo que controla, audita, sugere ou publica pertence ao sistema.

Inclui:

- Header do editor.
- Toolbar de formatacao.
- Bubble menus.
- Painel esquerdo de inteligencia.
- Painel direito de metadados/revisao/publicacao.
- Popups de links, midia, produto e afiliacao.
- Estados de IA.
- Busca interna no artigo.

## Arquivos principais

- `components/editor/AdvancedEditor.tsx`: orquestracao do editor.
- `components/editor/ContentIntelligence.tsx`: painel esquerdo.
- `components/editor/EditorInspector.tsx`: painel direito.
- `components/editor/TextSearchPanel.tsx`: busca no artigo.
- `components/editor/InternalLinksPanel.tsx`: sugestoes de links internos.
- `components/editor/LinkHygienePanel.tsx`: higiene de links.
- `components/editor/GuardianPanel.tsx`: guardiao SEO e melhorias.
- `components/editor/TermsPanel.tsx`: termos, LSI, entidades e apoio semantico.
- `components/editor/CareGlowBubbleMenu.tsx`: menu flutuante atual, ainda com nome legado.
- `components/editor/AdvancedLinkDialog.tsx`: popup de link.

## Ordem operacional do painel esquerdo

A ordem atual deve seguir a frequencia de uso:

1. Buscar no artigo.
2. Estrutura H2/H3/H4.
3. Links internos IA.
4. Higiene de links.
5. Guardiao SEO.
6. Termos / LSI IA.

Justificativa:

- Buscar no artigo e usado o tempo todo.
- Estrutura e usada durante a escrita.
- Links internos entram na producao e revisao semantica.
- Guardiao SEO orienta qualidade.
- Termos / LSI e SEO local entram depois, por isso ficam no fim.

## Painel direito

O painel direito deve concentrar configuracoes e etapas finais.

Abas atuais:

- Post.
- SEO / KGR.
- Revisao.
- E-E-A-T.
- Publicar.

Contrato:

- Criacao/edicao principal fica em Post e SEO / KGR.
- Revisao manual, duplicacao, schema, SERP e verificacoes pos-publicacao ficam em Revisao.
- E-E-A-T deve concentrar autoridade, fontes, autores, riscos e confiabilidade.
- Publicar deve ser enxuto e focado em status final.

## Busca no artigo

`TextSearchPanel` e uma ferramenta de alta frequencia.

Regras:

- Sempre aparecer no topo do painel esquerdo.
- Nao depender de scroll para ser encontrada.
- Mostrar quantidade de resultados.
- Permitir anterior/proxima/limpar.
- Manter popup acessivel.
- Ser compacta.

## Termos / LSI IA

`TermsPanel` e ferramenta de enriquecimento semantico, nao de escrita inicial.

Funcoes esperadas:

- Entrada para palavras-chave.
- Conversao semantica em sinonimos, relacoes e entidades.
- Sugestoes harmonicas para introduzir no artigo.
- Entrada de endereco/localidade para SEO local.
- Sugestoes de pontos de referencia, estabelecimentos, bairros, hospitais, praca, escola, restaurante e orgaos publicos quando fizer sentido.
- Sugestoes de fontes confiaveis, como Wikipedia, sites governamentais, entidades tecnicas ou institucionais.

Regras:

- Nao forcar termos artificiais.
- Sugerir adaptacao leve de frase quando o termo exato soar ruim.
- Marcar se o termo e sinonimo, entidade, fonte, local, pergunta ou relacao.
- Indicar onde usar: intro, corpo, conclusao, FAQ, bloco local, fonte externa.

## Melhoria de texto

A API de melhoria de fragmento deve considerar:

- Posicao do trecho: inicio, meio ou fim.
- Tom da marca.
- Nicho do projeto.
- Intencao do artigo.
- Retencao do leitor.
- Silo e palavra-chave principal.
- Necessidade de preservar naturalidade.

Retorno esperado:

- Texto melhorado.
- Explicacao objetiva.
- Motivo editorial.
- Termos/ancoras semanticas incorporadas.
- Alertas quando a mudanca pode alterar sentido.

## Links internos

O editor deve sugerir links internos com semantica, nao apenas correspondencia exata de palavra-chave.

Regras:

- Procurar sinonimos e expressoes relacionadas.
- Priorizar trechos naturais como ancora.
- Evitar links roboticos.
- Considerar hierarquia do silo.
- Permitir sugestao de pequena mudanca na frase para encaixar link.
- Explicar por que o link ajuda o silo.

## Nomes legados

Alguns componentes ainda carregam nomes da CareGlow, como `CareGlowBubbleMenu`. Para pacote neutro, renomear para nomes de Core:

- `CareGlowBubbleMenu` -> `EditorBubbleMenu`.
- `GuardianPanel` pode permanecer se for nome de produto, mas deve remover prompts CareGlow.
- Textos "CareGlow" no editor devem vir de `brandConfig`.

## Checklist de qualidade

- O artigo central nao recebe dark mode do admin.
- O painel esquerdo abre com busca visivel.
- Termos / LSI fica no fim.
- SERP do post esta em Revisao.
- Popups nao possuem texto invisivel.
- A toolbar e compacta.
- Os botoes importantes usam icons quando possivel.
- O editor continua editavel depois de aplicar sugestao de IA.
- A marca muda sem quebrar a interface do Mini WordPress.
