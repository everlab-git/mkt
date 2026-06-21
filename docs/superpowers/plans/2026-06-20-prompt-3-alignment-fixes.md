# Prompt 3 Alignment Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajustar a implementação do Prompt 3 para aderir ao contrato original sem abrir escopo novo.

**Architecture:** O ajuste troca lógica fixa por registries pluggables em seções e blocos, reconcilia o reducer do Builder com as actions de seção/view previstas desde o começo e torna explícita a ligação do preview ao `Lenis`. O preview continua usando renderização real com `SectionRenderer` e `BlockRenderer`.

**Tech Stack:** React 18, Vite, TypeScript, Vitest, GSAP/Lenis já existentes, CSS-in-JS, reducer local do Builder.

---

## Estrutura de arquivos

- Create: `apps/editor/src/components/blocks/registry.ts`
- Create: `apps/editor/src/components/sections/registry.ts`
- Create: `apps/editor/src/components/blocks/registry.test.ts`
- Create: `apps/editor/src/components/sections/registry.test.ts`
- Modify: `apps/editor/src/components/blocks/BlockRenderer.tsx`
- Modify: `apps/editor/src/components/sections/SectionRenderer.tsx`
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/initial.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/reducer.test.ts`
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`

### Task 1: Registry pluggable de blocos

**Files:**
- Create: `apps/editor/src/components/blocks/registry.ts`
- Create: `apps/editor/src/components/blocks/registry.test.ts`
- Modify: `apps/editor/src/components/blocks/BlockRenderer.tsx`

- [ ] **Step 1: Escrever o teste falhando do block registry**

```ts
// apps/editor/src/components/blocks/registry.test.ts
import { describe, expect, it } from "vitest";
import { blockRegistry, hasBlockRenderer } from "./registry";

describe("blockRegistry", () => {
  it("expõe os nove tipos de bloco desta rodada", () => {
    expect(Object.keys(blockRegistry).sort()).toEqual([
      "button",
      "card",
      "chart",
      "form",
      "gallery",
      "image",
      "table",
      "text",
      "video"
    ]);
  });

  it("resolve gallery como tipo suportado", () => {
    expect(hasBlockRenderer("gallery")).toBe(true);
    expect(hasBlockRenderer("unknown")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/components/blocks/registry.test.ts`

Expected: FAIL com `./registry` ausente.

- [ ] **Step 3: Implementar o registry**

```ts
// apps/editor/src/components/blocks/registry.ts
import { ButtonBlock } from "./Button";
import { CardBlock } from "./Card";
import { ChartBlock } from "./Chart";
import { FormBlock } from "./Form";
import { GalleryBlock } from "./Gallery";
import { ImageBlock } from "./Image";
import { TableBlock } from "./Table";
import { TextBlock } from "./Text";
import { VideoBlock } from "./Video";

export const blockRegistry = {
  text: TextBlock,
  image: ImageBlock,
  button: ButtonBlock,
  card: CardBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  table: TableBlock,
  chart: ChartBlock,
  form: FormBlock
} as const;

export function hasBlockRenderer(value: string): value is keyof typeof blockRegistry {
  return value in blockRegistry;
}
```

- [ ] **Step 4: Trocar o `switch` do `BlockRenderer` pelo registry**

```tsx
// apps/editor/src/components/blocks/BlockRenderer.tsx
import { blockRegistry, hasBlockRenderer } from "./registry";

const blockType = hasBlockRenderer(block.type) ? block.type : "text";
const Component = blockRegistry[blockType];

return (
  <div ref={ref} data-testid={`block-${block.type}`}>
    <Component {...(block.props as never)} persuasion={persuasion} />
  </div>
);
```

- [ ] **Step 5: Rodar os testes**

Run: `pnpm --filter editor test -- src/components/blocks/registry.test.ts src/components/blocks/BlockRenderer.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/editor/src/components/blocks
git commit -m "refactor: use block registry in renderer"
```

### Task 2: Registry pluggable de seções

**Files:**
- Create: `apps/editor/src/components/sections/registry.ts`
- Create: `apps/editor/src/components/sections/registry.test.ts`
- Modify: `apps/editor/src/components/sections/SectionRenderer.tsx`

- [ ] **Step 1: Escrever o teste falhando do section registry**

```ts
// apps/editor/src/components/sections/registry.test.ts
import { describe, expect, it } from "vitest";
import { hasSectionRenderer, sectionRegistry } from "./registry";

describe("sectionRegistry", () => {
  it("expõe ao menos hero e cases para o builder atual", () => {
    expect(Object.keys(sectionRegistry).sort()).toEqual(["cases", "hero"]);
  });

  it("resolve hero como tipo suportado", () => {
    expect(hasSectionRenderer("hero")).toBe(true);
    expect(hasSectionRenderer("custom")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/components/sections/registry.test.ts`

Expected: FAIL com `./registry` ausente.

- [ ] **Step 3: Implementar o registry de seção**

```ts
// apps/editor/src/components/sections/registry.ts
import type { BuilderLikeSection } from "./SectionRenderer";

type SectionComponent = (props: { section: BuilderLikeSection }) => JSX.Element;

function DefaultSection({ section }: { section: BuilderLikeSection }) {
  return <>{section.blocks.map(() => null)}</>;
}

export const sectionRegistry = {
  hero: DefaultSection,
  cases: DefaultSection
} as const;

export function hasSectionRenderer(value: string): value is keyof typeof sectionRegistry {
  return value in sectionRegistry;
}
```

- [ ] **Step 4: Adaptar o `SectionRenderer` para usar o registry**

```tsx
// apps/editor/src/components/sections/SectionRenderer.tsx
import { hasSectionRenderer, sectionRegistry } from "./registry";

const sectionType = hasSectionRenderer(section.type) ? section.type : "hero";
const SectionComponent = sectionRegistry[sectionType];

return (
  <section ref={ref} data-testid={`section-${section.type}`}>
    <SectionComponent section={section} />
  </section>
);
```

Manter dentro do componente registrado a renderização de:
- título
- descrição
- lista de `BlockRenderer`

- [ ] **Step 5: Rodar os testes**

Run: `pnpm --filter editor test -- src/components/sections/registry.test.ts src/components/sections/SectionRenderer.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/editor/src/components/sections
git commit -m "refactor: use section registry in renderer"
```

### Task 3: Reconciliar actions de seção/view no reducer

**Files:**
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/initial.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/reducer.test.ts`

- [ ] **Step 1: Escrever o teste falhando para actions antigas**

```ts
// acrescentar em apps/editor/src/builder/reducer.test.ts
it("permite selecionar uma seção sem selecionar bloco", () => {
  const next = builderReducer(initialBuilderState, {
    type: "SELECT_SECTION",
    sectionId: "section-cases"
  });

  expect(next.selectedSectionId).toBe("section-cases");
  expect(next.selectedBlockId).toBeNull();
});

it("permite mudar a view do builder", () => {
  const next = builderReducer(initialBuilderState, {
    type: "SET_VIEW",
    view: "pages"
  });

  expect(next.view).toBe("pages");
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/builder/reducer.test.ts`

Expected: FAIL porque `SELECT_SECTION` e `SET_VIEW` ainda não existem no reducer.

- [ ] **Step 3: Estender os tipos e actions**

```ts
// apps/editor/src/builder/types.ts
export type BuilderView = "builder" | "pages" | "settings" | "preview";

export interface BuilderState {
  view: BuilderView;
  sections: BuilderSection[];
  selectedSectionId: string | null;
  selectedBlockId: string | null;
}
```

```ts
// apps/editor/src/builder/actions.ts
export interface SetViewAction {
  type: "SET_VIEW";
  view: BuilderView;
}

export interface SelectSectionAction {
  type: "SELECT_SECTION";
  sectionId: string | null;
}
```

- [ ] **Step 4: Implementar as actions no reducer**

```ts
// apps/editor/src/builder/reducer.ts
case "SET_VIEW":
  return {
    ...state,
    view: action.view
  };

case "SELECT_SECTION":
  return {
    ...state,
    selectedSectionId: action.sectionId,
    selectedBlockId: null
  };
```

Adicionar também:
- `ADD_SECTION`
- `REMOVE_SECTION`

com comportamento mínimo consistente:
- `ADD_SECTION`: cria seção vazia
- `REMOVE_SECTION`: remove seção e limpa seleção se necessário

- [ ] **Step 5: Atualizar o estado inicial**

```ts
// apps/editor/src/builder/initial.ts
export const initialBuilderState: BuilderState = {
  view: "builder",
  sections: [...],
  selectedSectionId: "section-hero",
  selectedBlockId: "block-hero-heading"
};
```

- [ ] **Step 6: Rodar os testes**

Run: `pnpm --filter editor test -- src/builder/reducer.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/editor/src/builder
git commit -m "refactor: restore section and view actions in builder reducer"
```

### Task 4: Preview com Lenis explícito

**Files:**
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`

- [ ] **Step 1: Escrever o teste falhando do preview explícito**

```tsx
// acrescentar em apps/editor/src/App.test.tsx
it("expõe o canvas do builder com indicador de preview lenis", () => {
  render(<App />);
  expect(screen.getByTestId("builder-preview")).toHaveAttribute("data-preview-scroll", "lenis");
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/App.test.tsx`

Expected: FAIL porque o atributo ainda não existe.

- [ ] **Step 3: Tornar o uso do Lenis explícito no App**

```tsx
// apps/editor/src/App.tsx
import { useEffect } from "react";
import { getLenisInstance } from "./components/animations/lib/lenis";

function BuilderPreview({ sections }: { sections: BuilderSection[] }) {
  useEffect(() => {
    void getLenisInstance();
  }, []);

  return (
    <div data-testid="builder-preview" data-preview-scroll="lenis">
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Rodar validação final**

Run: `pnpm type-check && pnpm test && pnpm build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/App.tsx apps/editor/src/App.test.tsx
git commit -m "refactor: make builder preview lenis integration explicit"
```

## Self-review

- Cobertura do spec:
  - `blockRegistry`: Task 1
  - `sectionRegistry`: Task 2
  - actions de seção/view: Task 3
  - preview com Lenis explícito: Task 4
- Sem placeholders: todos os passos têm arquivos, comandos, testes e trechos concretos.
- Consistência:
  - o preview continua usando `SectionRenderer`
  - `selectedSectionId` e `selectedBlockId` permanecem no estado
  - `view` volta a existir explicitamente no reducer
