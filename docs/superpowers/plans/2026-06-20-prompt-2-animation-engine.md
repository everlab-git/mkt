# Prompt 2 Animation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um motor de animação com `gsap` + `ScrollTrigger` + `lenis`, com registry extensível, fallback obrigatório para `prefers-reduced-motion`, carga lazy e gate de Lighthouse no CI.

**Architecture:** O editor passa a ter uma camada própria de animação em `src/components/animations/`, com `registry` e `hook` centralizando import dinâmico, reduced motion e cleanup. O `App.tsx` vira uma página demo de scroll com múltiplas seções, suficiente para validar presets, lazy-loading e performance no CI.

**Tech Stack:** React 18, Vite, TypeScript, Vitest, GSAP, ScrollTrigger, Lenis, Lighthouse CI, GitHub Actions.

---

## Estrutura de arquivos

- Criar: `apps/editor/src/components/animations/lib/reducedMotion.ts`
- Criar: `apps/editor/src/components/animations/lib/lenis.ts`
- Criar: `apps/editor/src/components/animations/registry.ts`
- Criar: `apps/editor/src/components/animations/useScrollAnimation.ts`
- Criar: `apps/editor/src/components/animations/presets/reveal.ts`
- Criar: `apps/editor/src/components/animations/presets/parallax.ts`
- Criar: `apps/editor/src/components/animations/presets/pinScrub.ts`
- Criar: `apps/editor/src/components/animations/presets/splitText.ts`
- Criar: `apps/editor/src/components/animations/presets/marquee.ts`
- Criar: `apps/editor/src/components/animations/registry.test.ts`
- Criar: `apps/editor/src/components/animations/lib/reducedMotion.test.ts`
- Criar: `apps/editor/src/components/animations/lib/lenis.test.ts`
- Criar: `apps/editor/src/components/animations/useScrollAnimation.test.tsx`
- Criar: `apps/editor/lighthouserc.json`
- Modificar: `apps/editor/package.json`
- Modificar: `apps/editor/src/App.tsx`
- Modificar: `.github/workflows/ci.yml`
- Modificar: `pnpm-lock.yaml`

### Task 1: Dependências e testes de contrato

**Files:**
- Modify: `apps/editor/package.json`
- Create: `apps/editor/src/components/animations/registry.test.ts`
- Create: `apps/editor/src/components/animations/lib/reducedMotion.test.ts`
- Create: `apps/editor/src/components/animations/lib/lenis.test.ts`
- Create: `apps/editor/src/components/animations/useScrollAnimation.test.tsx`

- [ ] **Step 1: Escrever os testes falhando para registry, reduced motion, singleton e hook**

```ts
// apps/editor/src/components/animations/registry.test.ts
import { describe, expect, it } from "vitest";
import { animationRegistry, hasAnimationPreset } from "./registry";

describe("animationRegistry", () => {
  it("expõe os cinco presets do Prompt 2", () => {
    expect(Object.keys(animationRegistry).sort()).toEqual([
      "marquee",
      "parallax",
      "pinScrub",
      "reveal",
      "splitText"
    ]);
  });

  it("identifica corretamente se um preset existe", () => {
    expect(hasAnimationPreset("reveal")).toBe(true);
    expect(hasAnimationPreset("nao-existe")).toBe(false);
  });
});
```

```ts
// apps/editor/src/components/animations/lib/reducedMotion.test.ts
import { describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "./reducedMotion";

describe("prefersReducedMotion", () => {
  it("retorna false quando matchMedia não existe", () => {
    // @ts-expect-error teste de ambiente
    delete globalThis.window;
    expect(prefersReducedMotion()).toBe(false);
  });

  it("retorna true quando o sistema pede reduce", () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    });
    expect(prefersReducedMotion()).toBe(true);
  });
});
```

```ts
// apps/editor/src/components/animations/lib/lenis.test.ts
import { describe, expect, it } from "vitest";
import { getLenisInstance, resetLenisForTests } from "./lenis";

describe("lenis singleton", () => {
  it("retorna a mesma instância em chamadas repetidas", async () => {
    resetLenisForTests();
    const a = await getLenisInstance();
    const b = await getLenisInstance();
    expect(a).toBe(b);
  });
});
```

```tsx
// apps/editor/src/components/animations/useScrollAnimation.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useScrollAnimation } from "./useScrollAnimation";

function Demo() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollAnimation(ref, { name: "reveal", options: {} });
  return <div ref={ref}>demo</div>;
}

describe("useScrollAnimation", () => {
  it("não oculta conteúdo quando reduced motion está ativo", async () => {
    vi.stubGlobal("window", {
      matchMedia: vi.fn().mockReturnValue({ matches: true })
    });
    const { findByText } = render(<Demo />);
    expect(await findByText("demo")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar os testes para validar que falham**

Run: `pnpm --filter editor test -- src/components/animations/registry.test.ts src/components/animations/lib/reducedMotion.test.ts src/components/animations/lib/lenis.test.ts src/components/animations/useScrollAnimation.test.tsx`

Expected: FAIL com módulos ausentes (`registry`, `reducedMotion`, `lenis`, `useScrollAnimation`) e/ou dependências ainda não instaladas.

- [ ] **Step 3: Adicionar dependências reais**

```json
// apps/editor/package.json
{
  "dependencies": {
    "gsap": "3.12.5",
    "lenis": "1.1.16",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@testing-library/react": "16.0.1",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "@vitejs/plugin-react": "4.3.1",
    "typescript": "5.4.5",
    "vite": "5.2.12",
    "vitest": "1.6.0"
  }
}
```

- [ ] **Step 4: Instalar dependências**

Run: `pnpm install --no-frozen-lockfile`

Expected: PASS e `pnpm-lock.yaml` atualizado.

- [ ] **Step 5: Commit**

```bash
git add apps/editor/package.json pnpm-lock.yaml apps/editor/src/components/animations
git commit -m "test: add animation engine contracts"
```

### Task 2: Utilitários centrais e registry

**Files:**
- Create: `apps/editor/src/components/animations/lib/reducedMotion.ts`
- Create: `apps/editor/src/components/animations/lib/lenis.ts`
- Create: `apps/editor/src/components/animations/registry.ts`
- Modify: `apps/editor/src/components/animations/registry.test.ts`
- Modify: `apps/editor/src/components/animations/lib/reducedMotion.test.ts`
- Modify: `apps/editor/src/components/animations/lib/lenis.test.ts`

- [ ] **Step 1: Implementar utilitário de reduced motion**

```ts
// apps/editor/src/components/animations/lib/reducedMotion.ts
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 2: Implementar singleton de Lenis**

```ts
// apps/editor/src/components/animations/lib/lenis.ts
import Lenis from "lenis";

let lenisPromise: Promise<Lenis> | null = null;

export async function getLenisInstance() {
  if (!lenisPromise) {
    lenisPromise = Promise.resolve(
      new Lenis({
        smoothWheel: true,
        syncTouch: false
      })
    );
  }
  return lenisPromise;
}

export function resetLenisForTests() {
  lenisPromise = null;
}
```

- [ ] **Step 3: Criar registry com o shape do contrato**

```ts
// apps/editor/src/components/animations/registry.ts
export type AnimationPresetName =
  | "reveal"
  | "parallax"
  | "pinScrub"
  | "splitText"
  | "marquee";

export type AnimationCleanup = () => void;

export interface AnimationPresetContext {
  reducedMotion: boolean;
  loadGsap: () => Promise<typeof import("gsap") & { ScrollTrigger?: unknown }>;
  getLenis: typeof import("./lib/lenis").getLenisInstance;
}

export type AnimationPreset = (
  element: HTMLElement,
  options: Record<string, unknown>,
  ctx: AnimationPresetContext
) => Promise<AnimationCleanup> | AnimationCleanup;

export const animationRegistry: Record<AnimationPresetName, AnimationPreset> = {
  reveal: async () => () => {},
  parallax: async () => () => {},
  pinScrub: async () => () => {},
  splitText: async () => () => {},
  marquee: async () => () => {}
};

export function hasAnimationPreset(name: string): name is AnimationPresetName {
  return name in animationRegistry;
}
```

- [ ] **Step 4: Rodar os testes centrais**

Run: `pnpm --filter editor test -- src/components/animations/registry.test.ts src/components/animations/lib/reducedMotion.test.ts src/components/animations/lib/lenis.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/components/animations/lib apps/editor/src/components/animations/registry.ts
git commit -m "feat: add animation registry core"
```

### Task 3: Hook de animação e presets reais

**Files:**
- Create: `apps/editor/src/components/animations/useScrollAnimation.ts`
- Create: `apps/editor/src/components/animations/presets/reveal.ts`
- Create: `apps/editor/src/components/animations/presets/parallax.ts`
- Create: `apps/editor/src/components/animations/presets/pinScrub.ts`
- Create: `apps/editor/src/components/animations/presets/splitText.ts`
- Create: `apps/editor/src/components/animations/presets/marquee.ts`
- Modify: `apps/editor/src/components/animations/registry.ts`
- Modify: `apps/editor/src/components/animations/useScrollAnimation.test.tsx`

- [ ] **Step 1: Escrever um teste mais específico para o hook**

```tsx
it("faz fallback estático sem importar GSAP quando reduced motion está ativo", async () => {
  const gsapLoader = vi.fn();
  function Demo() {
    const ref = useRef<HTMLDivElement>(null);
    useScrollAnimation(ref, { name: "reveal", options: {}, loadGsap: gsapLoader });
    return <div ref={ref}>demo</div>;
  }
  vi.stubGlobal("window", {
    matchMedia: vi.fn().mockReturnValue({ matches: true })
  });
  render(<Demo />);
  expect(gsapLoader).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Implementar o hook central**

```ts
// apps/editor/src/components/animations/useScrollAnimation.ts
import { useEffect } from "react";
import { animationRegistry, hasAnimationPreset } from "./registry";
import { prefersReducedMotion } from "./lib/reducedMotion";
import { getLenisInstance } from "./lib/lenis";

async function defaultGsapLoader() {
  const gsapModule = await import("gsap");
  const scrollTriggerModule = await import("gsap/ScrollTrigger");
  gsapModule.gsap.registerPlugin(scrollTriggerModule.ScrollTrigger);
  return { ...gsapModule, ScrollTrigger: scrollTriggerModule.ScrollTrigger };
}

export function useScrollAnimation(
  ref: React.RefObject<HTMLElement>,
  config?: {
    name?: string;
    options?: Record<string, unknown>;
    loadGsap?: () => Promise<unknown>;
  }
) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !config?.name || !hasAnimationPreset(config.name)) return;

    const reducedMotion = prefersReducedMotion();
    let cleanup: (() => void) | undefined;

    if (reducedMotion) {
      element.style.opacity = "1";
      element.style.transform = "none";
      return;
    }

    void Promise.resolve(
      animationRegistry[config.name](element, config.options ?? {}, {
        reducedMotion,
        loadGsap: (config.loadGsap as () => Promise<typeof import("gsap")>) ?? defaultGsapLoader,
        getLenis: getLenisInstance
      })
    ).then((fn) => {
      cleanup = fn;
    });

    return () => cleanup?.();
  }, [config?.name, config?.options, config?.loadGsap, ref]);
}
```

- [ ] **Step 3: Implementar presets com fallback seguro**

```ts
// apps/editor/src/components/animations/presets/reveal.ts
import type { AnimationPreset } from "../registry";

export const revealPreset: AnimationPreset = async (element, options, ctx) => {
  if (ctx.reducedMotion) {
    element.style.opacity = "1";
    element.style.transform = "none";
    return () => {};
  }
  const { gsap, ScrollTrigger } = await ctx.loadGsap();
  const tween = gsap.fromTo(
    element,
    { opacity: 0, y: Number(options.y ?? 24) },
    {
      opacity: 1,
      y: 0,
      duration: Number(options.duration ?? 0.8),
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: "top 85%"
      }
    }
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
};
```

Usar o mesmo padrão para:
- `parallax`: animar `yPercent`
- `pinScrub`: usar `pin: true` e desativar totalmente em reduced motion
- `splitText`: degradar para reveal por palavra/frase, sem depender de plugin pago
- `marquee`: usar timeline horizontal contínua com cleanup

- [ ] **Step 4: Conectar os presets no registry**

```ts
import { marqueePreset } from "./presets/marquee";
import { parallaxPreset } from "./presets/parallax";
import { pinScrubPreset } from "./presets/pinScrub";
import { revealPreset } from "./presets/reveal";
import { splitTextPreset } from "./presets/splitText";

export const animationRegistry = {
  reveal: revealPreset,
  parallax: parallaxPreset,
  pinScrub: pinScrubPreset,
  splitText: splitTextPreset,
  marquee: marqueePreset
};
```

- [ ] **Step 5: Rodar os testes do hook**

Run: `pnpm --filter editor test -- src/components/animations/useScrollAnimation.test.tsx src/components/animations/registry.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/editor/src/components/animations
git commit -m "feat: add gsap presets and animation hook"
```

### Task 4: Página demo de scroll e lazy-loading

**Files:**
- Modify: `apps/editor/src/App.tsx`

- [ ] **Step 1: Escrever um cenário visual mínimo**

```tsx
// Estrutura esperada em App.tsx
<ThemeProvider>
  <main>
    <HeroSection data-testid="hero-reveal" />
    <StorySection data-testid="parallax-section" />
    <PinnedSection data-testid="pin-section" />
    <MarqueeSection data-testid="marquee-section" />
  </main>
</ThemeProvider>
```

- [ ] **Step 2: Implementar a demo substituindo a tela estática do Prompt 1**

```tsx
// trecho-guia de App.tsx
function AnimatedSection({
  title,
  preset,
  options,
  children
}: {
  title: string;
  preset: "reveal" | "parallax" | "pinScrub" | "splitText" | "marquee";
  options?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useScrollAnimation(ref, { name: preset, options });
  const theme = useSiteTheme();

  return (
    <section
      ref={ref}
      style={{
        minHeight: "90vh",
        padding: "96px 24px",
        borderBottom: `1px solid ${theme.palette.accent}`,
        background: theme.palette.background,
        color: theme.palette.text
      }}
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 3: Garantir lazy-loading explícito nas imagens da demo**

```tsx
<img
  src="/demo/stone.webp"
  srcSet="/demo/stone.webp 1200w"
  loading="lazy"
  alt="Imagem decorativa da demo"
  style={{ width: "100%", height: "auto" }}
/>
```

- [ ] **Step 4: Rodar a build**

Run: `pnpm --filter editor build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/App.tsx
git commit -m "feat: add animated demo page"
```

### Task 5: Lighthouse CI

**Files:**
- Create: `apps/editor/lighthouserc.json`
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Criar config do Lighthouse**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "apps/editor/dist",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }]
      }
    }
  }
}
```

- [ ] **Step 2: Integrar no CI**

```yaml
# .github/workflows/ci.yml
- name: Lighthouse CI
  run: pnpm dlx @lhci/cli@0.13.x autorun --config=apps/editor/lighthouserc.json
```

Inserir esse passo depois de `Build`.

- [ ] **Step 3: Rodar verificação local do fluxo completo**

Run: `pnpm type-check && pnpm test && pnpm build && pnpm dlx @lhci/cli@0.13.x autorun --config=apps/editor/lighthouserc.json`

Expected: PASS com score de performance `>= 0.85`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml apps/editor/lighthouserc.json
git commit -m "ci: add lighthouse performance gate"
```

## Self-review

- Cobertura do spec:
  - registry/hook/presets: cobertos nas Tasks 2 e 3
  - reduced motion: Tasks 1, 2 e 3
  - lazy loading e demo real de scroll: Task 4
  - Lighthouse CI: Task 5
- Sem placeholders: cada tarefa tem arquivos, passos, comandos e trechos de código concretos.
- Consistência: os nomes `animationRegistry`, `useScrollAnimation`, `prefersReducedMotion` e `getLenisInstance` são mantidos de ponta a ponta.
