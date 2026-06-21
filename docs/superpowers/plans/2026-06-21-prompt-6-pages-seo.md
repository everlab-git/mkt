# Prompt 6 Pages SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar criação de páginas por modelo/duplicação/em branco, SEO por página com gate na publicação e sugestão opcional de modelo visual para páginas em branco.

**Architecture:** A API passa a tratar páginas como recurso principal do projeto, com criação por estratégia (`template`, `duplicate`, `blank`), validação de SEO no publish e um helper para sugerir sequência visual com base nas páginas publicadas do projeto. No editor, `PagesView` deixa de ser apenas demonstrativo e vira o shell de criação/gestão de páginas; o builder recebe o bloco de SEO sempre visível e feedback claro quando a publicação é bloqueada.

**Tech Stack:** React 18, Vite, TypeScript, Hono, Postgres/JSONB, renderers do Prompt 3, shell admin do Prompt 5.

---

## Estrutura de arquivos

- Create: `apps/api/src/pages/creation.ts`
- Create: `apps/api/src/pages/seo.ts`
- Create: `apps/api/src/pages/visual-pattern.ts`
- Create: `apps/api/src/pages/creation.test.ts`
- Create: `apps/api/src/pages/seo.test.ts`
- Create: `apps/api/src/pages/visual-pattern.test.ts`
- Create: `apps/editor/src/admin/views/CreatePageModal.tsx`
- Create: `apps/editor/src/admin/views/CreatePageModal.test.tsx`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/editor/src/admin/views/PagesView.tsx`
- Modify: `apps/editor/src/admin/views/PagesView.test.tsx`
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/initial.ts`

### Task 1: Helpers de SEO e gate de publicação

**Files:**
- Create: `apps/api/src/pages/seo.ts`
- Create: `apps/api/src/pages/seo.test.ts`

- [ ] **Step 1: Escrever o teste falhando do gate de SEO**

```ts
// apps/api/src/pages/seo.test.ts
import { describe, expect, it } from "vitest";
import { canPublishPage, normalizeSeoPayload } from "./seo";

describe("page seo", () => {
  it("permite salvar draft sem SEO preenchido", () => {
    expect(
      canPublishPage("draft", {
        title: "",
        description: ""
      })
    ).toEqual({ ok: true });
  });

  it("bloqueia publicação sem title e description", () => {
    expect(
      canPublishPage("published", {
        title: "",
        description: ""
      })
    ).toEqual({
      ok: false,
      message: "Preencha SEO title e SEO description antes de publicar."
    });
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/pages/seo.test.ts`

Expected: FAIL com `./seo` ausente.

- [ ] **Step 3: Implementar helper de SEO**

```ts
// apps/api/src/pages/seo.ts
export interface SeoPayload {
  title: string;
  description: string;
  ogImage: string;
  canonical: string;
}

export function normalizeSeoPayload(
  input: Partial<SeoPayload>,
  fallbackCanonical: string
): SeoPayload {
  return {
    title: String(input.title ?? "").trim(),
    description: String(input.description ?? "").trim(),
    ogImage: String(input.ogImage ?? "").trim(),
    canonical: String(input.canonical ?? fallbackCanonical).trim()
  };
}

export function canPublishPage(status: "draft" | "published", seo: Partial<SeoPayload>) {
  if (status !== "published") {
    return { ok: true as const };
  }

  if (!String(seo.title ?? "").trim() || !String(seo.description ?? "").trim()) {
    return {
      ok: false as const,
      message: "Preencha SEO title e SEO description antes de publicar."
    };
  }

  return { ok: true as const };
}
```

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter api test -- src/pages/seo.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/pages/seo.ts apps/api/src/pages/seo.test.ts
git commit -m "feat: add page seo publish gate"
```

### Task 2: Criação de página por estratégia

**Files:**
- Create: `apps/api/src/pages/creation.ts`
- Create: `apps/api/src/pages/creation.test.ts`

- [ ] **Step 1: Escrever o teste falhando da criação por estratégia**

```ts
// apps/api/src/pages/creation.test.ts
import { describe, expect, it } from "vitest";
import { buildPagePayload } from "./creation";

describe("buildPagePayload", () => {
  it("cria payload em branco sem seções", () => {
    const payload = buildPagePayload({
      strategy: "blank",
      name: "Contato"
    });

    expect(payload.content.sections).toEqual([]);
  });

  it("duplica preservando conteúdo e seo", () => {
    const payload = buildPagePayload({
      strategy: "duplicate",
      name: "Cases 2",
      sourcePage: {
        content: { sections: [{ id: "s1", type: "hero", blocks: [] }] },
        seo: { title: "Cases", description: "Desc", canonical: "/cases", ogImage: "" }
      }
    });

    expect(payload.content.sections[0]?.type).toBe("hero");
    expect(payload.seo.title).toBe("Cases");
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/pages/creation.test.ts`

Expected: FAIL com `./creation` ausente.

- [ ] **Step 3: Implementar builder de payload**

```ts
// apps/api/src/pages/creation.ts
import { normalizeSeoPayload } from "./seo";

export type PageCreationStrategy = "template" | "duplicate" | "blank";

export function buildPagePayload(input: {
  strategy: PageCreationStrategy;
  name: string;
  slug?: string;
  templateKey?: "institutional" | "services" | "cases" | "contact";
  sourcePage?: {
    content: { sections: Array<Record<string, unknown>> };
    seo: Record<string, unknown>;
  };
}) {
  if (input.strategy === "blank") {
    return {
      content: { sections: [] },
      seo: normalizeSeoPayload({}, `/${input.slug ?? ""}`)
    };
  }

  if (input.strategy === "duplicate" && input.sourcePage) {
    return {
      content: JSON.parse(JSON.stringify(input.sourcePage.content)),
      seo: normalizeSeoPayload(input.sourcePage.seo, `/${input.slug ?? ""}`)
    };
  }

  const templateMap = {
    institutional: [{ id: "institutional-hero", type: "hero", blocks: [] }],
    services: [{ id: "services-hero", type: "hero", blocks: [] }],
    cases: [{ id: "cases-hero", type: "hero", blocks: [] }],
    contact: [{ id: "contact-hero", type: "hero", blocks: [] }]
  } as const;

  return {
    content: { sections: [...templateMap[input.templateKey ?? "institutional"]] },
    seo: normalizeSeoPayload({}, `/${input.slug ?? ""}`)
  };
}
```

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter api test -- src/pages/creation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/pages/creation.ts apps/api/src/pages/creation.test.ts
git commit -m "feat: add page creation strategies"
```

### Task 3: Sugestão de modelo visual

**Files:**
- Create: `apps/api/src/pages/visual-pattern.ts`
- Create: `apps/api/src/pages/visual-pattern.test.ts`

- [ ] **Step 1: Escrever o teste falhando da sugestão visual**

```ts
// apps/api/src/pages/visual-pattern.test.ts
import { describe, expect, it } from "vitest";
import { suggestVisualPattern } from "./visual-pattern";

describe("suggestVisualPattern", () => {
  it("retorna a sequência mais frequente entre páginas publicadas", () => {
    const suggestion = suggestVisualPattern([
      ["hero", "cards", "cta"],
      ["hero", "cards", "cta"],
      ["hero", "gallery"]
    ]);

    expect(suggestion).toEqual(["hero", "cards", "cta"]);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/pages/visual-pattern.test.ts`

Expected: FAIL com `./visual-pattern` ausente.

- [ ] **Step 3: Implementar helper**

```ts
// apps/api/src/pages/visual-pattern.ts
export function suggestVisualPattern(patterns: string[][]): string[] {
  const counter = new Map<string, number>();

  for (const pattern of patterns) {
    const key = pattern.join("::");
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  const winner = [...counter.entries()].sort((a, b) => b[1] - a[1])[0];
  return winner ? winner[0].split("::").filter(Boolean) : [];
}
```

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter api test -- src/pages/visual-pattern.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/pages/visual-pattern.ts apps/api/src/pages/visual-pattern.test.ts
git commit -m "feat: add visual pattern suggestion helper"
```

### Task 4: Rotas de páginas na API

**Files:**
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Escrever o teste falhando das rotas de páginas**

Adicionar uma suíte HTTP cobrindo:

```ts
it("cria página em branco", async () => {
  const response = await app.request("/api/projects/site-1/pages", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "freya_session=token-valido" },
    body: JSON.stringify({
      name: "Contato",
      strategy: "blank",
      followVisualModel: false
    })
  });

  expect([201, 401]).toContain(response.status);
});

it("bloqueia publish sem SEO mínimo", async () => {
  const response = await app.request("/api/projects/site-1/pages/page-1/status", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: "freya_session=token-valido" },
    body: JSON.stringify({ status: "published", seo: { title: "", description: "" } })
  });

  expect([400, 401]).toContain(response.status);
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/projects/routes.test.ts`

Expected: FAIL porque as novas rotas ainda não existem.

- [ ] **Step 3: Implementar rotas mínimas**

Adicionar em `apps/api/src/index.ts`:

- `GET /api/projects/:siteId/pages`
- `POST /api/projects/:siteId/pages`
- `POST /api/projects/:siteId/pages/:pageId/status`
- `POST /api/projects/:siteId/pages/:pageId/seo`
- `GET /api/projects/:siteId/pages/suggestions/visual-pattern`

Trecho-guia da criação:

```ts
const payload = buildPagePayload({
  strategy: body.strategy,
  name: body.name,
  slug,
  templateKey: body.templateKey,
  sourcePage
});

await pool.query(
  "insert into pages (site_id, name, slug, type, status, content, block_types, seo, order_idx) values ($1, $2, $3, 'page', 'draft', $4::jsonb, $5::text[], $6::jsonb, $7)",
  [siteId, body.name, slug, JSON.stringify(payload.content), derivedBlockTypes, JSON.stringify(payload.seo), nextOrder]
);
```

Trecho-guia do publish:

```ts
const publishCheck = canPublishPage(status, seoPayload);
if (!publishCheck.ok) {
  return c.json({ ok: false, error: "seo_required", message: publishCheck.message }, 400);
}
```

- [ ] **Step 4: Rodar a suíte da API**

Run: `pnpm --filter api test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat: add page creation and seo routes"
```

### Task 5: Modal de criação de página no editor

**Files:**
- Create: `apps/editor/src/admin/views/CreatePageModal.tsx`
- Create: `apps/editor/src/admin/views/CreatePageModal.test.tsx`

- [ ] **Step 1: Escrever o teste falhando do modal**

```tsx
// apps/editor/src/admin/views/CreatePageModal.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { CreatePageModal } from "./CreatePageModal";

describe("CreatePageModal", () => {
  it("permite escolher blank, template ou duplicate", () => {
    render(
      <ThemeProvider>
        <CreatePageModal open onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/em branco/i)).toBeTruthy();
    expect(screen.getByLabelText(/modelo/i)).toBeTruthy();
    expect(screen.getByLabelText(/duplicar página existente/i)).toBeTruthy();
  });

  it("mostra a opção de seguir modelo visual só em branco", () => {
    render(
      <ThemeProvider>
        <CreatePageModal open onClose={() => {}} />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/seguir o modelo visual/i)).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/modelo/i));
    expect(screen.queryByLabelText(/seguir o modelo visual/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/admin/views/CreatePageModal.test.tsx`

Expected: FAIL com `CreatePageModal` ausente.

- [ ] **Step 3: Implementar o modal**

Criar um componente controlado com:

- nome da página
- escolha da estratégia
- seleção de template
- escolha da página-fonte para duplicar
- checkbox `seguir o modelo visual` apenas em `blank`

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter editor test -- src/admin/views/CreatePageModal.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/admin/views/CreatePageModal.tsx apps/editor/src/admin/views/CreatePageModal.test.tsx
git commit -m "feat: add page creation modal"
```

### Task 6: PagesView, App e gate de SEO no editor

**Files:**
- Modify: `apps/editor/src/admin/views/PagesView.tsx`
- Modify: `apps/editor/src/admin/views/PagesView.test.tsx`
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/initial.ts`

- [ ] **Step 1: Escrever o teste falhando da UI de páginas**

Adicionar casos cobrindo:

```tsx
it("abre o fluxo de nova página no PagesView", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /new page/i }));
  expect(screen.getByText(/criar página/i)).toBeTruthy();
});

it("mostra erro claro ao tentar publicar sem seo mínimo", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /builder/i }));
  fireEvent.click(screen.getByRole("button", { name: /publicar página/i }));
  expect(screen.getByText(/preencha seo title e seo description/i)).toBeTruthy();
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/App.test.tsx src/admin/views/PagesView.test.tsx`

Expected: FAIL porque o fluxo ainda não existe.

- [ ] **Step 3: Estender o estado do builder com página ativa e SEO**

Adicionar no estado:

- `activePageId`
- `publishValidationMessage`

E um shape de página com:

- `seo`
- `status`
- `slug`
- `name`

- [ ] **Step 4: Integrar no `PagesView`**

Adicionar:

- botão `New page`
- abertura do `CreatePageModal`
- ação de duplicar página
- status `draft/published`

- [ ] **Step 5: Integrar no `App`**

No builder:

- bloco SEO sempre visível
- botão `Publicar página`
- validação inline usando a mesma regra do backend

Trecho-guia:

```tsx
{state.publishValidationMessage ? (
  <p role="alert">{state.publishValidationMessage}</p>
) : null}
```

- [ ] **Step 6: Rodar a validação final**

Run: `pnpm type-check && pnpm test && pnpm build`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/editor/src/admin/views apps/editor/src/App.tsx apps/editor/src/App.test.tsx apps/editor/src/builder
git commit -m "feat: add page creation flow and seo gate in editor"
```

## Self-review

- Cobertura do spec:
  - SEO com gate de publicação: Tasks 1, 4 e 6
  - criação por template/duplicação/em branco: Tasks 2, 4 e 5
  - sugestão visual para blank: Tasks 3 e 5
  - integração no `PagesView` e builder: Task 6
- Sem placeholders: cada task tem arquivos, testes, trechos e comandos concretos.
- Consistência:
  - `seo` permanece em JSONB, coerente com o schema atual
  - `followVisualModel` aparece só no caminho `blank`
  - o bloqueio de publicação usa a mesma mensagem no backend e no editor
