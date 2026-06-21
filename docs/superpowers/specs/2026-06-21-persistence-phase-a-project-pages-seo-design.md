# Fase A — persistência real de projeto, páginas e SEO

## Escopo

Esta fase fecha o loop entre o editor e a API já construída para:

- carregar projeto real
- carregar páginas reais
- criar página via API
- atualizar SEO via API
- publicar página via API
- expor um caminho público de teste por slug do projeto, como `/nomedonovoprojeto`

Sem incluir ainda:

- persistência completa do conteúdo multilíngue
- tradução real por IA
- refino grande de UX

## Objetivo

Trocar o estado local “demo” do shell administrativo por um fluxo híbrido e seguro:

- dados de projeto/páginas/SEO vêm da API
- o builder continua editável localmente
- ações-chave persistem no backend
- o projeto criado passa a ter uma URL pública simples para teste manual

Isso fecha o ciclo mais importante sem forçar ainda a sincronização total de todos os campos do builder.

## Abordagem escolhida

Vou seguir por uma camada de integração pequena no editor, em vez de espalhar `fetch` por várias views.

### Estrutura

- `apps/editor/src/data/api.ts`
  - funções de chamada HTTP

- `apps/editor/src/data/project-store.ts`
  - normalização do payload vindo da API para o shape do editor

- `apps/editor/src/data/project-store.test.ts`
  - cobre a conversão entre API e estado local

O `App.tsx` passa a:

- carregar projetos/páginas ao iniciar
- manter estado de carregamento/erro
- despachar ações locais com base em respostas da API

## Fluxos cobertos

### Carregamento inicial

1. carregar lista de projetos
2. escolher projeto ativo
3. carregar páginas do projeto ativo
4. hidratar o estado atual do editor

### Criar página

1. `CreatePageModal` monta payload
2. editor chama `POST /api/projects/:siteId/pages`
3. resposta da API vira nova página do estado

### Atualizar SEO

1. edição do bloco SEO continua no shell atual
2. save de SEO chama `POST /api/projects/:siteId/pages/:pageId/seo`
3. resposta atualiza a página ativa

### Publicar página

1. botão de publicar continua com validação local
2. passando no gate local, chama `POST /api/projects/:siteId/pages/:pageId/status`
3. status retornado atualiza o estado

### Teste público do projeto

1. ao criar projeto, o `slug` do projeto passa a ser o identificador principal da URL pública
2. o sistema expõe uma rota pública simples no formato `/<project-slug>`
3. essa rota resolve o projeto, encontra a página principal publicada e renderiza um preview navegável para teste

Nesta fase, a meta não é um frontend público completo com todas as variações de navegação. A meta é garantir uma URL estável e testável por projeto, suficiente para validar o site fora do shell administrativo.

## O que fica local por enquanto

Para manter a fase enxuta, ainda ficam locais:

- edição completa de blocos/seções
- persistência de conteúdo inteiro do builder
- persistência multilíngue por locale

Isso é intencional. O valor desta fase é fechar o ciclo principal de administração sem misturar todos os tipos de persistência de uma vez.

## Normalização de dados

O backend hoje responde páginas com:

- `slug`
- `status`
- `content`
- `seo`
- `block_types`

O editor precisa transformar isso no shape atual de `BuilderPage`.

Vou introduzir normalizadores para:

- `project -> ProjectSummary`
- `page api -> BuilderPage`
- `seo api -> BuilderPageSeo`
- `content api -> BuilderSection[]`

Também entra uma regra simples de resolução pública:

- `site.slug` identifica o projeto na URL
- a página publicada de menor `order_idx` funciona como landing page padrão do projeto

## Critério de pronto

- editor carrega projetos reais da API
- editor carrega páginas reais do projeto ativo
- criar página funciona via API
- salvar SEO funciona via API
- publicar página funciona via API
- existe uma URL pública de teste por projeto no formato `/<project-slug>`
- mensagens de erro seguem claras no shell
- `type-check`, `test` e `build` continuam verdes

## Fora de escopo

- salvar blocos/seções completos no backend
- autosave
- cache sofisticado
- sincronização em tempo real
- tradução real por IA
- persistência i18n completa de conteúdo
