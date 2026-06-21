# Prompt 3 Builder Persuasion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a camada de persuasão, os renderers reais de seções e blocos e um Builder mínimo com preview real e edição de blocos.

**Architecture:** O trabalho segue a ordem renderers → persuasão → estado do Builder → preview. `SectionRenderer` e `BlockRenderer` viram a espinha dorsal do output real; o Builder passa a usar esses mesmos renderers no canvas, enquanto a persuasão entra como uma camada pluggable no mesmo estilo do registry de animações.

**Tech Stack:** React 18, Vite, TypeScript, Vitest, GSAP/Lenis já existentes, Recharts para `chart`, CSS-in-JS com tema do Prompt 1.

---

## Estrutura de arquivos

- Create: `apps/editor/src/components/persuasion/registry.ts`
- Create: `apps/editor/src/components/persuasion/usePersuasion.ts`
- Create: `apps/editor/src/components/persuasion/patterns/socialProof.ts`
- Create: `apps/editor/src/components/persuasion/patterns/authority.ts`
- Create: `apps/editor/src/components/persuasion/patterns/anchoring.ts`
- Create: `apps/editor/src/components/persuasion/patterns/frictionReduction.ts`
- Create: `apps/editor/src/components/persuasion/registry.test.ts`
- Create: `apps/editor/src/components/blocks/BlockRenderer.tsx`
- Create: `apps/editor/src/components/blocks/Text.tsx`
- Create: `apps/editor/src/components/blocks/Image.tsx`
- Create: `apps/editor/src/components/blocks/Button.tsx`
- Create: `apps/editor/src/components/blocks/Card.tsx`
- Create: `apps/editor/src/components/blocks/Gallery.tsx`
- Create: `apps/editor/src/components/blocks/Video.tsx`
- Create: `apps/editor/src/components/blocks/Table.tsx`
- Create: `apps/editor/src/components/blocks/Chart.tsx`
- Create: `apps/editor/src/components/blocks/Form.tsx`
- Create: `apps/editor/src/components/blocks/BlockRenderer.test.tsx`
- Create: `apps/editor/src/components/sections/SectionRenderer.tsx`
- Create: `apps/editor/src/components/sections/SectionRenderer.test.tsx`
- Create: `apps/editor/src/builder/types.ts`
- Create: `apps/editor/src/builder/actions.ts`
- Create: `apps/editor/src/builder/initial.ts`
- Create: `apps/editor/src/builder/reducer.ts`
- Create: `apps/editor/src/builder/reducer.test.ts`
- Modify: `apps/editor/package.json`
- Modify: `apps/editor/src/App.tsx`

### Task 1: Dependências de renderização e testes da camada de persuasão

**Files:**
- Modify: `apps/editor/package.json`
- Create: `apps/editor/src/components/persuasion/registry.test.ts`

- [ ] **Step 1: Escrever o teste falhando do registry de persuasão**

```ts
// apps/editor/src/components/persuasion/registry.test.ts
import { describe, expect, it } from "vitest";
import { hasPersuasionPattern, persuasionRegistry } from "./registry";

describe("persuasionRegistry", () => {
  it("expõe os quatro padrões desta rodada", () => {
    expect(Object.keys(persuasionRegistry).sort()).toEqual([
      "anchoring",
      "authority",
      "frictionReduction",
      "socialProof"
    ]);
  });

  it("não expõe urgency nesta rodada", () => {
    expect(hasPersuasionPattern("urgency")).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/components/persuasion/registry.test.ts`

Expected: FAIL com `./registry` ausente.

- [ ] **Step 3: Adicionar dependência de gráfico**

```json
// apps/editor/package.json
{
  "dependencies": {
    "recharts": "2.12.7"
  }
}
```

- [ ] **Step 4: Instalar dependências**

Run: `pnpm install --no-frozen-lockfile`

Expected: PASS e `pnpm-lock.yaml` atualizado.

- [ ] **Step 5: Commit**

```bash
git add apps/editor/package.json pnpm-lock.yaml apps/editor/src/components/persuasion/registry.test.ts
git commit -m "test: add persuasion registry contract"
```

### Task 2: Registry de persuasão

**Files:**
- Create: `apps/editor/src/components/persuasion/registry.ts`
- Create: `apps/editor/src/components/persuasion/usePersuasion.ts`
- Create: `apps/editor/src/components/persuasion/patterns/socialProof.ts`
- Create: `apps/editor/src/components/persuasion/patterns/authority.ts`
- Create: `apps/editor/src/components/persuasion/patterns/anchoring.ts`
- Create: `apps/editor/src/components/persuasion/patterns/frictionReduction.ts`
- Modify: `apps/editor/src/components/persuasion/registry.test.ts`

- [ ] **Step 1: Implementar o contrato da camada de persuasão**

```ts
// apps/editor/src/components/persuasion/registry.ts
export type PersuasionPatternName =
  | "socialProof"
  | "authority"
  | "anchoring"
  | "frictionReduction";

export interface PersuasionContext {
  reducedMotion: boolean;
}

export type PersuasionResult = {
  className?: string;
  badges?: string[];
  highlighted?: boolean;
  progressive?: boolean;
  animatedValue?: number;
};

export type PersuasionPattern = (
  input: Record<string, unknown>,
  ctx: PersuasionContext
) => PersuasionResult;
```

- [ ] **Step 2: Implementar os quatro padrões mínimos**

```ts
// apps/editor/src/components/persuasion/patterns/authority.ts
import type { PersuasionPattern } from "../registry";

export const authorityPattern: PersuasionPattern = (input) => ({
  badges: Array.isArray(input.badges) ? (input.badges as string[]) : [],
  highlighted: true
});
```

Aplicar o mesmo princípio:
- `socialProof`: normaliza `value`, `label`, `suffix`
- `anchoring`: retorna `highlighted` para opção recomendada
- `frictionReduction`: retorna `progressive: true`

- [ ] **Step 3: Montar o registry e o hook**

```ts
// apps/editor/src/components/persuasion/registry.ts
import { anchoringPattern } from "./patterns/anchoring";
import { authorityPattern } from "./patterns/authority";
import { frictionReductionPattern } from "./patterns/frictionReduction";
import { socialProofPattern } from "./patterns/socialProof";

export const persuasionRegistry: Record<PersuasionPatternName, PersuasionPattern> = {
  socialProof: socialProofPattern,
  authority: authorityPattern,
  anchoring: anchoringPattern,
  frictionReduction: frictionReductionPattern
};

export function hasPersuasionPattern(value: string): value is PersuasionPatternName {
  return value in persuasionRegistry;
}
```

```ts
// apps/editor/src/components/persuasion/usePersuasion.ts
import { hasPersuasionPattern, persuasionRegistry } from "./registry";

export function usePersuasion(
  persuasion?: { pattern?: string; options?: Record<string, unknown> },
  reducedMotion = false
) {
  if (!persuasion?.pattern || !hasPersuasionPattern(persuasion.pattern)) {
    return null;
  }
  return persuasionRegistry[persuasion.pattern](persuasion.options ?? {}, { reducedMotion });
}
```

- [ ] **Step 4: Rodar os testes do registry**

Run: `pnpm --filter editor test -- src/components/persuasion/registry.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/components/persuasion
git commit -m "feat: add persuasion registry"
```

### Task 3: BlockRenderer e blocos reais

**Files:**
- Create: `apps/editor/src/components/blocks/BlockRenderer.tsx`
- Create: `apps/editor/src/components/blocks/Text.tsx`
- Create: `apps/editor/src/components/blocks/Image.tsx`
- Create: `apps/editor/src/components/blocks/Button.tsx`
- Create: `apps/editor/src/components/blocks/Card.tsx`
- Create: `apps/editor/src/components/blocks/Gallery.tsx`
- Create: `apps/editor/src/components/blocks/Video.tsx`
- Create: `apps/editor/src/components/blocks/Table.tsx`
- Create: `apps/editor/src/components/blocks/Chart.tsx`
- Create: `apps/editor/src/components/blocks/Form.tsx`
- Create: `apps/editor/src/components/blocks/BlockRenderer.test.tsx`

- [ ] **Step 1: Escrever o teste falhando do BlockRenderer**

```tsx
// apps/editor/src/components/blocks/BlockRenderer.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { BlockRenderer } from "./BlockRenderer";

describe("BlockRenderer", () => {
  it("renderiza um bloco gallery", () => {
    render(
      <ThemeProvider>
        <BlockRenderer
          block={{
            id: "b1",
            type: "gallery",
            animationPreset: null,
            persuasion: null,
            props: {
              layout: "grid",
              images: [{ url: "/demo/editorial-scene-960.svg", alt: "demo" }]
            }
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByAltText("demo")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/components/blocks/BlockRenderer.test.tsx`

Expected: FAIL com `BlockRenderer` ausente.

- [ ] **Step 3: Implementar os blocos mínimos**

```tsx
// apps/editor/src/components/blocks/Text.tsx
export function TextBlock({ content, as = "p" }: { content: string; as?: "h1" | "h2" | "p" }) {
  if (as === "h1") return <h1>{content}</h1>;
  if (as === "h2") return <h2>{content}</h2>;
  return <p>{content}</p>;
}
```

Implementar no mesmo espírito:
- `ImageBlock`: `img` com `loading="lazy"`
- `ButtonBlock`: `a` estilizado
- `CardBlock`: título, descrição e link
- `GalleryBlock`: grid de imagens
- `VideoBlock`: `video`
- `TableBlock`: tabela simples
- `ChartBlock`: `ResponsiveContainer` + gráfico Recharts
- `FormBlock`: campos progressivos se `frictionReduction` estiver ativo

- [ ] **Step 4: Implementar o BlockRenderer**

```tsx
// apps/editor/src/components/blocks/BlockRenderer.tsx
import { useMemo, useRef } from "react";
import { useScrollAnimation } from "../animations/useScrollAnimation";
import { usePersuasion } from "../persuasion/usePersuasion";

export function BlockRenderer({ block }: { block: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollAnimation(ref, {
    name: block.animationPreset?.name,
    options: block.animationPreset?.options
  });

  const persuasion = usePersuasion(block.persuasion);
  const Component = blockRegistry[block.type] ?? TextBlock;

  return (
    <div ref={ref} data-block-type={block.type} data-highlighted={persuasion?.highlighted ?? false}>
      <Component {...block.props} persuasion={persuasion} />
    </div>
  );
}
```

- [ ] **Step 5: Rodar os testes de bloco**

Run: `pnpm --filter editor test -- src/components/blocks/BlockRenderer.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/editor/src/components/blocks
git commit -m "feat: add block renderer and core blocks"
```

### Task 4: SectionRenderer

**Files:**
- Create: `apps/editor/src/components/sections/SectionRenderer.tsx`
- Create: `apps/editor/src/components/sections/SectionRenderer.test.tsx`

- [ ] **Step 1: Escrever o teste falhando do SectionRenderer**

```tsx
// apps/editor/src/components/sections/SectionRenderer.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { SectionRenderer } from "./SectionRenderer";

describe("SectionRenderer", () => {
  it("renderiza os blocos da seção cases", () => {
    render(
      <ThemeProvider>
        <SectionRenderer
          section={{
            id: "s1",
            type: "cases",
            animationPreset: null,
            props: { title: "Cases" },
            blocks: [
              {
                id: "b1",
                type: "gallery",
                animationPreset: null,
                persuasion: null,
                props: {
                  layout: "grid",
                  images: [{ url: "/demo/editorial-scene-960.svg", alt: "case image" }]
                }
              }
            ]
          }}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Cases")).toBeTruthy();
    expect(screen.getByAltText("case image")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/components/sections/SectionRenderer.test.tsx`

Expected: FAIL com `SectionRenderer` ausente.

- [ ] **Step 3: Implementar o renderer de seção**

```tsx
// apps/editor/src/components/sections/SectionRenderer.tsx
import { useRef } from "react";
import { useScrollAnimation } from "../animations/useScrollAnimation";
import { BlockRenderer } from "../blocks/BlockRenderer";

export function SectionRenderer({ section }: { section: any }) {
  const ref = useRef<HTMLElement>(null);
  useScrollAnimation(ref, {
    name: section.animationPreset?.name,
    options: section.animationPreset?.options
  });

  return (
    <section ref={ref} data-section-type={section.type}>
      {section.props?.title ? <h2>{section.props.title}</h2> : null}
      <div>
        {section.blocks.map((block: any) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Rodar os testes da seção**

Run: `pnpm --filter editor test -- src/components/sections/SectionRenderer.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/components/sections
git commit -m "feat: add section renderer"
```

### Task 5: Estado do Builder com blocos

**Files:**
- Create: `apps/editor/src/builder/types.ts`
- Create: `apps/editor/src/builder/actions.ts`
- Create: `apps/editor/src/builder/initial.ts`
- Create: `apps/editor/src/builder/reducer.ts`
- Create: `apps/editor/src/builder/reducer.test.ts`

- [ ] **Step 1: Escrever o teste falhando do reducer**

```ts
// apps/editor/src/builder/reducer.test.ts
import { describe, expect, it } from "vitest";
import { initialBuilderState } from "./initial";
import { builderReducer } from "./reducer";

describe("builderReducer", () => {
  it("adiciona um bloco gallery dentro da seção cases", () => {
    const state = builderReducer(initialBuilderState, {
      type: "ADD_BLOCK",
      sectionId: "section-cases",
      block: {
        type: "gallery",
        props: {
          layout: "grid",
          images: [{ url: "/demo/editorial-scene-960.svg", alt: "gallery item" }]
        }
      }
    });

    const section = state.sections.find((item) => item.id === "section-cases");
    expect(section?.blocks).toHaveLength(1);
    expect(section?.blocks[0]?.type).toBe("gallery");
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/builder/reducer.test.ts`

Expected: FAIL com reducer ausente.

- [ ] **Step 3: Implementar tipos, estado inicial e reducer**

```ts
// apps/editor/src/builder/types.ts
export interface BuilderBlock {
  id: string;
  type: string;
  animationPreset: null | { name: string; options?: Record<string, unknown> };
  persuasion: null | { pattern: string; options?: Record<string, unknown> };
  props: Record<string, unknown>;
}

export interface BuilderSection {
  id: string;
  type: string;
  animationPreset: null | { name: string; options?: Record<string, unknown> };
  props: Record<string, unknown>;
  blocks: BuilderBlock[];
}

export interface BuilderState {
  sections: BuilderSection[];
  selectedSectionId: string | null;
  selectedBlockId: string | null;
}
```

```ts
// apps/editor/src/builder/reducer.ts
export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "ADD_BLOCK":
      return {
        ...state,
        sections: state.sections.map((section) =>
          section.id === action.sectionId
            ? {
                ...section,
                blocks: [
                  ...section.blocks,
                  {
                    id: action.block.id ?? `${action.sectionId}-block-${section.blocks.length + 1}`,
                    animationPreset: null,
                    persuasion: null,
                    ...action.block
                  }
                ]
              }
            : section
        ),
        selectedSectionId: action.sectionId
      };
```

Completar também:
- `REMOVE_BLOCK`
- `SELECT_BLOCK`
- `UPDATE_BLOCK_PROPS`
- `REORDER_BLOCKS`

- [ ] **Step 4: Rodar os testes do reducer**

Run: `pnpm --filter editor test -- src/builder/reducer.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/builder
git commit -m "feat: add builder reducer with block actions"
```

### Task 6: Builder mínimo com preview real

**Files:**
- Modify: `apps/editor/src/App.tsx`

- [ ] **Step 1: Escrever um teste mínimo de integração do App**

```tsx
// adicionar em apps/editor/src/App.test.tsx
it("renderiza preview com gallery adicionada na seção cases", () => {
  render(<App />);
  expect(screen.getByText("Builder preview")).toBeTruthy();
  expect(screen.getByAltText("gallery item")).toBeTruthy();
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/App.test.tsx`

Expected: FAIL porque o App atual ainda é só demo do Prompt 2.

- [ ] **Step 3: Integrar Builder e preview no App**

```tsx
// guia de composição em apps/editor/src/App.tsx
function BuilderPreview({ sections }: { sections: BuilderSection[] }) {
  return (
    <div data-testid="builder-preview">
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);

  return (
    <ThemeProvider>
      <main>
        <aside>
          <h2>Builder preview</h2>
          <button
            onClick={() =>
              dispatch({
                type: "ADD_BLOCK",
                sectionId: "section-cases",
                block: {
                  type: "gallery",
                  props: {
                    layout: "grid",
                    images: [{ url: "/demo/editorial-scene-960.svg", alt: "gallery item" }]
                  }
                }
              })
            }
          >
            Adicionar gallery
          </button>
        </aside>
        <BuilderPreview sections={state.sections} />
      </main>
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: Rodar validação final**

Run: `pnpm type-check && pnpm test && pnpm build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/App.tsx apps/editor/src/App.test.tsx
git commit -m "feat: add builder preview with real renderers"
```

## Self-review

- Cobertura do spec:
  - camada de persuasão: Tasks 1 e 2
  - renderização de blocos e seções: Tasks 3 e 4
  - estado do Builder: Task 5
  - preview com renderização real: Task 6
- Sem placeholders: todas as tasks têm arquivos, testes, comandos e trechos concretos.
- Consistência:
  - `selectedSectionId` e `selectedBlockId` mantidos do início ao fim
  - `BlockRenderer` e `SectionRenderer` são reutilizados no preview
  - `gallery` em `cases` aparece nos testes de reducer, seção e App
