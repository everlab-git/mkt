# Prompt 7 — internacionalização (i18n)

## Escopo

Esta rodada reabre o schema de conteúdo e transforma o produto de monolíngue em multilíngue, com:

1. idiomas habilitados por site
2. conteúdo traduzível por locale em cada bloco
3. slug por locale
4. tradução assistida por IA como ação explícita
5. publicação avaliada por locale

## Abordagem escolhida

Vou fazer a migração de forma aditiva, sem quebrar o conteúdo atual.

### Princípio

- estrutura do bloco continua em `props`
- campos traduzíveis vão para `i18n`
- `pages.slug` vira objeto por locale
- `seo` passa a ser multilíngue no mesmo `jsonb`

Isso preserva compatibilidade com o que já existe e evita uma ruptura completa de schema.

## Modelagem

### `sites.languages`

Adicionar em `sites`:

```json
{
  "default": "pt-BR",
  "enabled": ["pt-BR"]
}
```

Todo site nasce com só o locale padrão.

### `pages.slug`

Deixa de ser string única e vira objeto:

```json
{
  "pt-BR": "servicos",
  "en": "services"
}
```

A migração para páginas antigas será:

- pegar o slug atual
- salvar esse valor sob o locale padrão do site

### `content`

Cada bloco passa a separar:

- estrutural:
  - `type`
  - `animationPreset`
  - `persuasion`
  - layout e props não textuais
- traduzível:
  - `content`
  - `alt`
  - labels
  - headers textuais
  - textos livres de tabela

Novo shape:

```json
{
  "id": "uuid",
  "type": "text",
  "props": { "as": "h1" },
  "i18n": {
    "pt-BR": { "content": "Olá", "ai_generated": false },
    "en": { "content": "Hello", "ai_generated": true }
  }
}
```

### `seo`

O `seo` continua em JSONB, mas passa a armazenar valores por locale:

```json
{
  "title": {
    "pt-BR": "Serviços",
    "en": "Services"
  },
  "description": {
    "pt-BR": "Descrição",
    "en": "Description"
  },
  "ogImage": {
    "pt-BR": "https://...",
    "en": "https://..."
  },
  "canonical": {
    "pt-BR": "/servicos",
    "en": "/services"
  }
}
```

## Tradução com IA

Não haverá tradução automática ao habilitar idioma.

### Regra

- habilitar locale novo: só adiciona locale ao site
- traduzir com IA: ação explícita

Essa ação pode ocorrer:

- por página
- em lote no site

Na primeira implementação, minha recomendação é:

- suportar tradução por página primeiro
- deixar o lote como extensão do mesmo serviço

Tudo traduzido por IA entra com:

- `ai_generated: true`

Ao editar manualmente:

- `ai_generated` vira `false`

## Publicação por locale

O status da página continua único (`draft`/`published`), mas a disponibilidade do locale depende de completude daquele locale.

### Regra

Um locale só fica disponível se:

- a página estiver `published`
- o locale tiver conteúdo mínimo
- `seo.title` e `seo.description` daquele locale estiverem preenchidos

Isso permite:

- publicar `pt-BR`
- deixar `en` incompleto sem bloquear o site inteiro

## Slug, `lang` e `hreflang`

### Unicidade

A API deve validar:

- para cada locale
- o slug daquele locale é único dentro do site

### Renderização

Cada página servida deve expor:

- `lang` do HTML conforme o locale atual
- `hreflang` para os locais completos disponíveis

Nesta fase, como ainda não existe a camada pública final completa, vamos preparar:

- geração dos dados
- persistência correta
- disponibilidade no preview/admin

## Editor

### Settings

A aba `Idiomas` deixa de ser só placeholder e passa a:

- mostrar locale padrão
- listar locales habilitados
- permitir adicionar locale explicitamente

### Pages / Builder

Ao editar página:

- existe seletor de locale ativo
- o builder edita o locale ativo
- ao trocar locale, muda somente o conteúdo traduzível
- estrutura da página permanece

### SEO

O bloco de SEO passa a refletir o locale ativo.

### Publish

A UI mostra claramente:

- locale completo
- locale incompleto
- locale publicado/disponível

## API

Precisaremos evoluir:

- leitura/escrita de páginas
- criação de página
- atualização de SEO
- mudança de status
- endpoints de tradução com IA

Além disso, entram helpers de migração/normalização:

- migrar slug string → objeto por locale
- migrar props textuais → `i18n`
- avaliar completude por locale

## Critério de pronto

- site novo nasce só com locale padrão
- habilitar idioma novo não traduz automaticamente
- tradução com IA exige ação explícita
- blocos passam a separar estrutura e tradução
- slug antigo migra sem quebrar páginas existentes
- publicação considera completude por locale
- locale incompleto não derruba locale completo já publicado

## Fora de escopo

- tradução automática sem ação do usuário
- mudança em autenticação ou RLS
- biblioteca nova de UI
- RD Station
