# Prompt 2 — motor de animação, reduced motion e performance

## Escopo

Esta rodada implementa o Prompt 2 em `apps/editor`, usando dependências reais `gsap` e `lenis`, sem mexer em autenticação, RLS, i18n ou biblioteca de UI externa. O objetivo é criar uma camada de animação extensível para seções/blocos futuros, já compatível com o schema do Prompt 1 e pronta para ser consumida pelo Prompt 3.

## Abordagem escolhida

Vamos usar uma camada própria sobre GSAP/ScrollTrigger/Lenis, em vez de importar essas libs diretamente nos componentes. Isso reduz acoplamento, facilita fallback para `prefers-reduced-motion` e mantém um ponto central para performance, lazy-loading e cleanup.

## Estrutura

Serão criados:

- `apps/editor/src/components/animations/registry.ts`
- `apps/editor/src/components/animations/useScrollAnimation.ts`
- `apps/editor/src/components/animations/presets/reveal.ts`
- `apps/editor/src/components/animations/presets/parallax.ts`
- `apps/editor/src/components/animations/presets/pinScrub.ts`
- `apps/editor/src/components/animations/presets/splitText.ts`
- `apps/editor/src/components/animations/presets/marquee.ts`
- `apps/editor/src/components/animations/lib/lenis.ts`
- `apps/editor/src/components/animations/lib/reducedMotion.ts`

O `registry.ts` expõe um mapa `presetName -> apply(element, options, ctx) => cleanup`. O `useScrollAnimation.ts` vira a única porta de entrada para aplicar presets. Componentes futuros só passam `ref`, `presetName` e `options`.

## Contrato de animação

Cada preset recebe:

- `element: HTMLElement`
- `options: Record<string, unknown>`
- `ctx: { lenis, reducedMotion, loadGsap }`

E sempre retorna:

- `() => void`

Esse contrato permite trocar ou adicionar preset sem alterar componentes. O comentário no `registry.ts` vai deixar explícito como registrar um novo preset no futuro.

## Reduced motion

O comportamento com `prefers-reduced-motion: reduce` é obrigatório:

- nenhum conteúdo fica oculto esperando animação
- transforms e opacidades temporárias são desativados
- `pinScrub` não prende o scroll
- o conteúdo já nasce visível no fluxo normal

Essa decisão vive no hook e em utilitários centrais, não espalhada por preset.

## Performance

- `gsap` e `ScrollTrigger` serão carregados via `import()` dinâmico
- páginas sem preset animado não devem puxar GSAP no carregamento inicial
- `lenis` será singleton global
- os triggers serão registrados de forma lazy, próximos da viewport, para evitar custo inicial desnecessário
- a página demo do editor será usada para validar engine e Lighthouse

## Página de demonstração

O `App.tsx` atual será evoluído de “prova de tema” para uma tela demo com:

- duas variações visuais de tema preservadas
- pelo menos três seções animadas
- uso explícito de presets diferentes
- conteúdo suficiente para scroll real

Isso serve como ambiente de validação manual do Prompt 2 antes de existir Builder/Preview completos.

## CI e Lighthouse

O workflow `ci.yml` ganhará uma etapa de Lighthouse CI com thresholds:

- `performance >= 0.85`

O alvo será uma build local do editor servida no job. O gate entra no pipeline atual, junto de type-check, test e build.

## Testes

Antes da implementação, serão escritos testes para:

- resolução de preset pelo registry
- fallback estático em `reduced motion`
- singleton de Lenis
- comportamento seguro de presets quando GSAP não deve ser carregado

Além disso:

- `pnpm type-check`
- `pnpm test`
- `pnpm build`

## Limites desta rodada

- não vamos criar presets além dos cinco pedidos
- não vamos acoplar animação ao schema completo de blocos ainda
- não vamos implementar o preview avançado do Builder nesta rodada; só a base reutilizável e uma página demo coerente

## Critérios de aceite

- os cinco presets existem e têm fallback estático
- GSAP não entra no carregamento inicial quando não há preset animado
- `prefers-reduced-motion` não esconde nem trava conteúdo
- `lenis` existe como singleton
- o pipeline inclui Lighthouse com gate mínimo de performance
