# Prompt 3 — persuasão, renderização de blocos e BuilderView

## Escopo

Esta rodada implementa o Prompt 3 em `apps/editor`, em cima do schema do Prompt 1 e do motor de animação do Prompt 2. O objetivo é criar a camada de persuasão pluggable, os renderers reais de seções e blocos e um Builder mínimo que edita conteúdo real em vez de uma casca visual.

## Ordem escolhida

A implementação seguirá esta ordem:

1. `SectionRenderer` e `BlockRenderer`
2. camada de persuasão
3. extensão do estado do Builder
4. preview do canvas usando renderização real

Essa ordem evita retrabalho. O Builder passa a operar sobre componentes reais já renderizáveis, em vez de montar uma UI de edição desacoplada do output final.

## Arquitetura

Serão criadas quatro áreas principais:

- `apps/editor/src/components/sections/`
- `apps/editor/src/components/blocks/`
- `apps/editor/src/components/persuasion/`
- `apps/editor/src/builder/` ou expansão equivalente do estado atual

O padrão de implementação repete a mesma lógica do Prompt 2:

- `registry.ts` central
- hook para comportamento transversal quando necessário
- componentes consumidores simples

Isso mantém seções, blocos, persuasão e preview desacoplados.

## Renderização

`SectionRenderer.tsx` será o ponto de entrada da renderização de conteúdo normalizado. Ele escolhe um componente por tipo de seção e delega os blocos internos para `BlockRenderer.tsx`.

`BlockRenderer.tsx` aplicará, nessa ordem:

1. tema do site
2. animação do Prompt 2
3. persuasão do Prompt 3
4. componente visual do bloco

Blocos individuais ficam em:

- `Gallery.tsx`
- `Card.tsx`
- `Video.tsx`
- `Table.tsx`
- `Chart.tsx`
- `Form.tsx`
- `Text.tsx`
- `Image.tsx`
- `Button.tsx`

Para `chart`, a escolha será `recharts`.

## Camada de persuasão

Será criada em `apps/editor/src/components/persuasion/`, com:

- `registry.ts`
- `usePersuasion.ts`
- `patterns/socialProof.ts`
- `patterns/authority.ts`
- `patterns/anchoring.ts`
- `patterns/frictionReduction.ts`

Padrões desta rodada:

- `socialProof`
- `authority`
- `anchoring`
- `frictionReduction`

O padrão `urgency` não será implementado agora, mas o registry ficará preparado para receber novos padrões depois.

## Estado do Builder

O reducer será estendido com:

- `ADD_BLOCK`
- `REMOVE_BLOCK`
- `SELECT_BLOCK`
- `UPDATE_BLOCK_PROPS`
- `REORDER_BLOCKS`

As ações de seção existentes serão preservadas:

- `ADD_SECTION`
- `REMOVE_SECTION`
- `SELECT_SECTION`
- `SET_VIEW`

O estado passará a diferenciar claramente:

- `selectedSectionId`
- `selectedBlockId`

Regras:

- selecionar um bloco implica conhecer sua seção pai
- remover uma seção limpa qualquer bloco selecionado dentro dela
- o painel de propriedades alterna entre edição de seção e edição de bloco

## Preview

O canvas do Builder passará a usar os mesmos `SectionRenderer` e `BlockRenderer` do output real. Não haverá uma implementação separada de preview. O preview será a própria renderização final dentro de um canvas editável.

O canvas:

- reutiliza o `lenis` do Prompt 2
- mantém animações reais
- mantém os padrões de persuasão ativos
- respeita `prefers-reduced-motion`

Isso reduz divergência entre edição e publicação.

## Critérios de aceite mapeados

- adicionar um bloco `gallery` dentro de uma seção `cases` funciona via UI do Builder
- os quatro padrões de persuasão funcionam de forma independente
- o preview reflete o comportamento real de scroll e persuasão
- nenhuma seção, bloco ou padrão depende de hardcode visual da Kintsugi

## Limites desta rodada

- não mexer em autenticação nem RLS
- não implementar RD Station real
- não implementar i18n
- não implementar `urgency`/scarcity
- não adicionar biblioteca de UI externa

## Estratégia de teste

Os testes seguirão TDD e serão organizados em quatro níveis:

1. registry de persuasão
2. renderização de blocos e seções
3. reducer do Builder com ações de bloco
4. integração mínima do Builder

Cenários mínimos obrigatórios:

- adicionar bloco `gallery`
- selecionar bloco
- atualizar props de bloco
- ver o preview refletir a mudança
