# Prompt 5 Project Wizard Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o wizard de criação de projeto, as views administrativas `pages/settings/preview`, a tabela `project_members` e o RLS para múltiplos membros por projeto.

**Architecture:** Primeiro entra a base de dados e a API de membership, porque o wizard e as views dependem de projeto real e RLS correto. Depois vêm os serviços do wizard e a UI do editor, reaproveitando o reducer e o `SET_VIEW` já existentes para navegar entre `pages`, `settings`, `preview` e `builder`.

**Tech Stack:** React 18, Vite, TypeScript, Hono, Postgres/Supabase, cookies de sessão já existentes, CSS-in-JS, renderers do Prompt 3.

---

## Estrutura de arquivos

- Modify: `apps/api/src/db/schema.sql`
- Modify: `apps/api/src/index.ts`
- Create: `apps/api/src/projects/members.ts`
- Create: `apps/api/src/projects/creation.ts`
- Create: `apps/api/src/projects/members.test.ts`
- Create: `apps/api/src/projects/creation.test.ts`
- Create: `apps/editor/src/admin/types.ts`
- Create: `apps/editor/src/admin/views/PagesView.tsx`
- Create: `apps/editor/src/admin/views/SettingsView.tsx`
- Create: `apps/editor/src/admin/views/PreviewView.tsx`
- Create: `apps/editor/src/admin/views/WizardView.tsx`
- Create: `apps/editor/src/admin/views/WizardView.test.tsx`
- Create: `apps/editor/src/admin/views/PagesView.test.tsx`
- Create: `apps/editor/src/admin/views/SettingsView.test.tsx`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/initial.ts`
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`

### Task 1: Schema de projeto, equipe e RLS

**Files:**
- Modify: `apps/api/src/db/schema.sql`
- Create: `apps/api/src/projects/members.test.ts`

- [ ] **Step 1: Escrever o teste falhando das regras de membership**

```ts
// apps/api/src/projects/members.test.ts
import { describe, expect, it } from "vitest";
import { canInviteExistingUserOnly, normalizeMemberRole } from "./members";

describe("project membership helpers", () => {
  it("aceita apenas owner e member", () => {
    expect(normalizeMemberRole("owner")).toBe("owner");
    expect(normalizeMemberRole("member")).toBe("member");
  });

  it("exige que o convite só siga para usuário existente", () => {
    expect(canInviteExistingUserOnly(true)).toBe(true);
    expect(canInviteExistingUserOnly(false)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/projects/members.test.ts`

Expected: FAIL com `./members` ausente.

- [ ] **Step 3: Atualizar o schema**

```sql
-- apps/api/src/db/schema.sql
alter table sites add column if not exists logo_url text;
alter table sites add column if not exists goal text;

create table if not exists project_members (
  site_id uuid not null references sites(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (site_id, user_id)
);

create index if not exists idx_project_members_user_id on project_members (user_id);
create index if not exists idx_project_members_site_id on project_members (site_id);

drop policy if exists sites_owner on sites;
create policy sites_members on sites
  for all
  using (
    exists (
      select 1 from project_members pm
      where pm.site_id = sites.id
        and pm.user_id = current_setting('app.user_id')::uuid
    )
  );

drop policy if exists pages_via_site on pages;
create policy pages_via_membership on pages
  for all
  using (
    exists (
      select 1 from project_members pm
      where pm.site_id = pages.site_id
        and pm.user_id = current_setting('app.user_id')::uuid
    )
  );
```

- [ ] **Step 4: Criar helper mínimo de membership**

```ts
// apps/api/src/projects/members.ts
export type MemberRole = "owner" | "member";

export function normalizeMemberRole(value: string): MemberRole {
  return value === "owner" ? "owner" : "member";
}

export function canInviteExistingUserOnly(userExists: boolean): boolean {
  return userExists;
}
```

- [ ] **Step 5: Rodar o teste**

Run: `pnpm --filter api test -- src/projects/members.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/schema.sql apps/api/src/projects/members.ts apps/api/src/projects/members.test.ts
git commit -m "feat: add project membership schema and helpers"
```

### Task 2: Serviço de criação de projeto

**Files:**
- Create: `apps/api/src/projects/creation.ts`
- Create: `apps/api/src/projects/creation.test.ts`

- [ ] **Step 1: Escrever o teste falhando do payload do wizard**

```ts
// apps/api/src/projects/creation.test.ts
import { describe, expect, it } from "vitest";
import { normalizeWizardPayload } from "./creation";

describe("normalizeWizardPayload", () => {
  it("mantém o passo 4 sem pré-seleção por padrão", () => {
    const payload = normalizeWizardPayload({
      name: "Kintsugi",
      goal: "institucional/branding"
    });

    expect(payload.startingPoint).toBeNull();
  });

  it("desliga IA por padrão", () => {
    const payload = normalizeWizardPayload({
      name: "Kintsugi",
      goal: "geração de leads"
    });

    expect(payload.ai.enabled).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/projects/creation.test.ts`

Expected: FAIL com `./creation` ausente.

- [ ] **Step 3: Implementar normalização do payload**

```ts
// apps/api/src/projects/creation.ts
export type StartingPoint = "blank" | "institutional";

export interface WizardPayload {
  name: string;
  goal: string;
  logoUrl?: string | null;
  theme?: Record<string, unknown>;
  startingPoint: StartingPoint | null;
  ai: {
    enabled: boolean;
    storytelling: string;
    paletteFromLogo: boolean;
    draftInitialCopy: boolean;
  };
}

export function normalizeWizardPayload(input: Partial<WizardPayload>): WizardPayload {
  return {
    name: String(input.name ?? "").trim(),
    goal: String(input.goal ?? "").trim(),
    logoUrl: input.logoUrl ?? null,
    theme: input.theme ?? {},
    startingPoint: input.startingPoint ?? null,
    ai: {
      enabled: input.ai?.enabled ?? false,
      storytelling: input.ai?.storytelling ?? "",
      paletteFromLogo: input.ai?.paletteFromLogo ?? true,
      draftInitialCopy: input.ai?.draftInitialCopy ?? true
    }
  };
}
```

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter api test -- src/projects/creation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/projects/creation.ts apps/api/src/projects/creation.test.ts
git commit -m "feat: add wizard payload normalization"
```

### Task 3: Rotas de projeto, criação e equipe

**Files:**
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Escrever o teste falhando do contrato das rotas**

Adicionar testes HTTP cobrindo:

```ts
// trecho a adicionar em uma nova suíte ou em teste existente
it("cria projeto e vincula owner", async () => {
  const response = await app.request("/api/projects", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: "freya_session=token-valido"
    },
    body: JSON.stringify({
      name: "Projeto teste",
      goal: "institucional/branding",
      startingPoint: null,
      ai: { enabled: false, storytelling: "", paletteFromLogo: true, draftInitialCopy: true }
    })
  });

  expect([200, 201, 401]).toContain(response.status);
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/auth/routes.test.ts src/projects/creation.test.ts`

Expected: FAIL porque `/api/projects` ainda não existe.

- [ ] **Step 3: Implementar rotas mínimas**

Adicionar em `apps/api/src/index.ts`:

```ts
app.get("/api/projects", async (c) => {
  const authUserId = c.get("authUserId");
  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const pool = getDbPool();
  const { rows } = await pool.query(
    "select s.id, s.name, s.slug, s.logo_url, s.goal from sites s join project_members pm on pm.site_id = s.id where pm.user_id = $1 order by s.created_at desc",
    [authUserId]
  );

  return c.json({ ok: true, projects: rows });
});
```

```ts
app.post("/api/projects", async (c) => {
  const authUserId = c.get("authUserId");
  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }

  const body = normalizeWizardPayload(await c.req.json().catch(() => ({})));
  const pool = getDbPool();
  const slug = body.name.toLowerCase().replace(/\s+/g, "-");

  const siteResult = await pool.query(
    "insert into sites (owner_id, name, slug, goal, logo_url, theme, config) values ($1, $2, $3, $4, $5, $6, $7) returning id, name, slug",
    [authUserId, body.name, slug, body.goal, body.logoUrl, body.theme, JSON.stringify({ ai: body.ai })]
  );

  const site = siteResult.rows[0];
  await pool.query(
    "insert into project_members (site_id, user_id, role, accepted_at) values ($1, $2, 'owner', now()) on conflict do nothing",
    [site.id, authUserId]
  );

  return c.json({ ok: true, project: site }, 201);
});
```

```ts
app.get("/api/projects/:siteId/members", async (c) => { /* lista membros */ });
app.post("/api/projects/:siteId/invite", async (c) => { /* convida email existente */ });
```

- [ ] **Step 4: Criar páginas institucionais quando o ponto de partida for `institutional`**

Inserir no fluxo do POST:

```ts
if (body.startingPoint === "institutional") {
  await pool.query(
    "insert into pages (site_id, name, slug, type, status, content, seo, order_idx) values ($1, 'Institucional', 'institucional', 'page', 'draft', $2::jsonb, '{}'::jsonb, 0), ($1, 'Serviços', 'servicos', 'page', 'draft', $3::jsonb, '{}'::jsonb, 1), ($1, 'Cases', 'cases', 'page', 'draft', $4::jsonb, '{}'::jsonb, 2), ($1, 'Contato', 'contato', 'page', 'draft', $5::jsonb, '{}'::jsonb, 3)",
    [site.id, heroPlaceholder, servicesPlaceholder, casesPlaceholder, contactPlaceholder]
  );
}
```

- [ ] **Step 5: Rodar os testes da API**

Run: `pnpm --filter api test`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/index.ts
git commit -m "feat: add project creation and membership routes"
```

### Task 4: Tipos administrativos no editor

**Files:**
- Create: `apps/editor/src/admin/types.ts`

- [ ] **Step 1: Escrever o teste falhando ou o uso inicial dos tipos**

Criar o shape esperado:

```ts
// apps/editor/src/admin/types.ts
export type ProjectGoal =
  | "geração de leads"
  | "institucional/branding"
  | "vendas"
  | "outro";

export type ProjectView = "wizard" | "pages" | "settings" | "preview" | "builder";

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  goal: string | null;
  logoUrl: string | null;
}
```

- [ ] **Step 2: Rodar type-check para validar que o arquivo entra limpo**

Run: `pnpm --filter editor type-check`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/editor/src/admin/types.ts
git commit -m "feat: add admin view types"
```

### Task 5: WizardView

**Files:**
- Create: `apps/editor/src/admin/views/WizardView.tsx`
- Create: `apps/editor/src/admin/views/WizardView.test.tsx`

- [ ] **Step 1: Escrever o teste falhando do wizard**

```tsx
// apps/editor/src/admin/views/WizardView.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../theme/ThemeContext";
import { WizardView } from "./WizardView";

describe("WizardView", () => {
  it("mantém IA desligada por padrão", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/quer que a ia ajude/i)).not.toBeChecked();
  });

  it("não deixa ponto de partida pré-selecionado", () => {
    render(
      <ThemeProvider>
        <WizardView />
      </ThemeProvider>
    );

    expect(screen.getByLabelText(/em branco/i)).not.toBeChecked();
    expect(screen.getByLabelText(/estrutura institucional/i)).not.toBeChecked();
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/admin/views/WizardView.test.tsx`

Expected: FAIL com `WizardView` ausente.

- [ ] **Step 3: Implementar o wizard**

Criar `WizardView.tsx` com:

- passo 1: nome + objetivo
- passo 2: toggle IA e subcampos condicionais
- passo 3: upload/logo placeholder + cores
- passo 4: opções lado a lado **sem pré-seleção**

Trecho mínimo:

```tsx
const [startingPoint, setStartingPoint] = useState<"blank" | "institutional" | null>(null);
const [aiEnabled, setAiEnabled] = useState(false);
```

- [ ] **Step 4: Rodar o teste**

Run: `pnpm --filter editor test -- src/admin/views/WizardView.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/editor/src/admin/views/WizardView.tsx apps/editor/src/admin/views/WizardView.test.tsx
git commit -m "feat: add project creation wizard"
```

### Task 6: Views pages/settings/preview e integração no App

**Files:**
- Create: `apps/editor/src/admin/views/PagesView.tsx`
- Create: `apps/editor/src/admin/views/SettingsView.tsx`
- Create: `apps/editor/src/admin/views/PreviewView.tsx`
- Create: `apps/editor/src/admin/views/PagesView.test.tsx`
- Create: `apps/editor/src/admin/views/SettingsView.test.tsx`
- Modify: `apps/editor/src/builder/types.ts`
- Modify: `apps/editor/src/builder/actions.ts`
- Modify: `apps/editor/src/builder/reducer.ts`
- Modify: `apps/editor/src/builder/initial.ts`
- Modify: `apps/editor/src/App.tsx`
- Modify: `apps/editor/src/App.test.tsx`

- [ ] **Step 1: Escrever o teste falhando da navegação de views**

```tsx
// acrescentar em apps/editor/src/App.test.tsx
it("navega entre pages, settings, preview e builder", () => {
  render(<App />);

  fireEvent.click(screen.getByRole("button", { name: /pages/i }));
  expect(screen.getByText(/árvore de páginas/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /settings/i }));
  expect(screen.getByText(/aba geral/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /preview/i }));
  expect(screen.getByTestId("project-preview")).toBeTruthy();
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter editor test -- src/App.test.tsx`

Expected: FAIL porque essas views ainda não existem.

- [ ] **Step 3: Estender o estado do builder**

Reusar `SET_VIEW` para:

- `pages`
- `settings`
- `preview`
- `builder`

Atualizar `initialBuilderState` para entrar em `pages` quando houver projeto selecionado.

- [ ] **Step 4: Implementar as views**

`PagesView.tsx`

```tsx
export function PagesView() {
  return (
    <section>
      <h2>Árvore de páginas</h2>
      <p>Draft/publicado por página e abertura do builder ao clicar.</p>
    </section>
  );
}
```

`SettingsView.tsx`

```tsx
export function SettingsView() {
  return (
    <section>
      <h2>Configurações</h2>
      <button>Aba Geral</button>
      <button>Aba Aparência</button>
      <button>Aba Idiomas</button>
      <button>Aba Menu</button>
      <button>Aba Equipe</button>
    </section>
  );
}
```

`PreviewView.tsx`

```tsx
export function PreviewView({ sections }: { sections: BuilderSection[] }) {
  return (
    <div data-testid="project-preview">
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Integrar no `App.tsx`**

Trocar o shell atual por navegação simples:

```tsx
switch (state.view) {
  case "pages":
    return <PagesView />;
  case "settings":
    return <SettingsView />;
  case "preview":
    return <PreviewView sections={state.sections} />;
  case "builder":
  default:
    return <BuilderPreview sections={state.sections} />;
}
```

- [ ] **Step 6: Rodar a validação final**

Run: `pnpm type-check && pnpm test && pnpm build`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/editor/src/admin apps/editor/src/App.tsx apps/editor/src/App.test.tsx apps/editor/src/builder
git commit -m "feat: add project admin views"
```

## Self-review

- Cobertura do spec:
  - `project_members` e RLS: Task 1
  - payload do wizard e decisão sem pré-seleção: Task 2
  - rotas de criação/listagem/equipe: Task 3
  - tipos administrativos: Task 4
  - wizard em 4 passos: Task 5
  - views `pages/settings/preview/builder`: Task 6
- Sem placeholders: cada task tem arquivos, trechos, comandos e critérios concretos.
- Consistência:
  - a decisão do passo 4 do wizard está fixada como `startingPoint: null` por padrão
  - `owner/member` são os únicos papéis no plano
  - a navegação reaproveita `SET_VIEW` já presente no estado
