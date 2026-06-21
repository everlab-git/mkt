# Prompt 3 — ajustes de aderência

## Objetivo

Fechar a diferença entre o Prompt 3 original e a implementação atual, sem abrir escopo novo. Esta rodada não adiciona features novas de produto; ela só alinha a implementação com o contrato já aprovado.

## Escopo

Três correções:

1. substituir o `switch` de `BlockRenderer` por um `blockRegistry`
2. introduzir `sectionRegistry` em `SectionRenderer`
3. reconciliar o reducer atual com as actions de seção/view já previstas (`ADD_SECTION`, `REMOVE_SECTION`, `SELECT_SECTION`, `SET_VIEW`) e explicitar o preview com `Lenis`

## Fora de escopo

- nova UI de propriedades
- novas seções ou blocos
- novos padrões de persuasão
- mudanças de autenticação
- qualquer item do Prompt 4 em diante

## Arquitetura

`BlockRenderer` e `SectionRenderer` passam a seguir o mesmo padrão pluggable já usado em animação e persuasão. O estado do Builder volta a comportar explicitamente ações de seção/view, em vez de ficar focado só nos blocos. O preview permanece usando renderização real, mas o uso do `Lenis` no canvas será tornado explícito na composição.

## Critério de pronto

- `BlockRenderer` usa `blockRegistry`
- `SectionRenderer` usa `sectionRegistry`
- reducer suporta actions antigas e novas
- preview continua funcional e com ligação explícita ao `Lenis`
- `type-check`, `test` e `build` continuam verdes
