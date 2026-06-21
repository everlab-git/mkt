# Prompt 6 — gestão de páginas, SEO e fluxo de criação

## Escopo

Esta rodada implementa três frentes ligadas à gestão de páginas dentro de um projeto já aberto:

1. bloco de SEO por página, com gate na publicação
2. fluxo de criação de página com três pontos de partida
3. sugestão opcional de modelo visual para páginas criadas “em branco”

## Decisão de modelagem

Vou manter os dados de SEO dentro do campo `pages.seo` que já existe no schema, em vez de criar novas colunas dedicadas.

### Motivo

- o projeto já tem `seo` como JSONB
- o prompt não exige consulta analítica pesada sobre SEO nesta fase
- isso reduz migração e mantém compatibilidade com o que já está implementado

O shape esperado dentro de `seo` passa a incluir:

- `title`
- `description`
- `ogImage`
- `canonical`

## Publicação e gate de SEO

O gate acontece apenas na mudança para `published`.

### Regra

- salvar `draft` sem SEO completo: permitido
- tentar publicar sem `title` e `description`: bloqueado
- o bloqueio precisa mostrar mensagem clara e inline

Vou tratar essa regra em dois níveis:

1. validação de negócio na API ao atualizar status
2. mensagem explícita no editor ao tentar publicar

Assim, a UI ajuda, mas a integridade não depende só do frontend.

## Criação de página

### Três caminhos

1. `Modelo`
2. `Duplicar página existente`
3. `Em branco`

### Modelo

Reaproveita apenas os modelos institucionais já usados no Prompt 5:

- institucional
- serviços
- cases
- contato

Não haverá sistema de templates customizáveis pelo usuário nesta rodada.

### Duplicação

Duplicar precisa copiar fielmente:

- `content`
- `block_types`
- `animationPreset`
- `persuasion`
- `seo`

E precisa gerar:

- novo `id`
- novo `slug`
- novo `name`

### Em branco

Cria página sem seções.

Opcionalmente, pode receber uma sugestão visual baseada no padrão mais comum do projeto.

## Sugestão de modelo visual

Essa funcionalidade só aparece no caminho `Em branco`.

### Regra

- se marcada:
  - o sistema olha páginas publicadas do projeto
  - calcula a sequência de tipos de seção mais frequente
  - oferece isso como ponto de partida editável
- se desmarcada:
  - a página nasce vazia

### Decisão de implementação

Vou implementar a sugestão como uma função simples baseada em frequência de `section.type` e ordem mais comum.

Ela não “trava” a página:

- vira só uma sugestão inicial
- o usuário ainda pode remover, trocar ou ignorar

## Backend

### API de páginas

Precisamos evoluir a API atual para suportar:

- listar páginas de um projeto
- criar página por:
  - template
  - duplicação
  - em branco
- atualizar SEO
- atualizar status

Também vamos precisar de um endpoint ou serviço para:

- sugerir a estrutura visual mais comum do projeto

## Editor

### `PagesView`

Precisa sair do estado apenas demonstrativo e passar a oferecer:

- CTA de nova página
- escolha do ponto de partida
- ação de duplicar
- status por página

### `Builder`

Ao abrir uma página:

- o editor deve expor um bloco de SEO sempre visível
- a ação de publicar precisa usar a validação de SEO

## Critério de pronto

- criar página por modelo funciona
- criar página por duplicação funciona
- criar página em branco funciona
- duplicação preserva conteúdo, animação, persuasão e SEO
- publicação sem `seo.title` ou `seo.description` é bloqueada com mensagem clara
- sugestão visual no caminho em branco é opcional e editável

## Fora de escopo

- sistema de templates customizáveis
- RD Station real
- mudanças em autenticação
- mudanças em RLS fora do necessário para usar o que já existe
