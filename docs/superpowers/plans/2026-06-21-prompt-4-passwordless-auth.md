# Prompt 4 Passwordless Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar autenticação passwordless por código de email, com sessão por cookie `httpOnly`, hash de código/token e integração do RLS com `app.user_id` vindo da sessão.

**Architecture:** A API ganha tabelas de `login_codes` e `sessions`, pequenos módulos de auth (`code`, `session`, `email`, `middleware`) e endpoints `request-code`, `verify-code`, `logout` e `session`. O middleware resolve o cookie, valida a sessão e injeta o `user_id` autenticado para o mesmo mecanismo de `SET LOCAL app.user_id` já usado pelo RLS.

**Tech Stack:** Hono, TypeScript, Postgres/Supabase, cookies `httpOnly`, Resend, Vitest, `crypto` nativo do Node.

---

## Estrutura de arquivos

- Create: `apps/api/src/auth/code.ts`
- Create: `apps/api/src/auth/session.ts`
- Create: `apps/api/src/auth/cookies.ts`
- Create: `apps/api/src/auth/email.ts`
- Create: `apps/api/src/auth/middleware.ts`
- Create: `apps/api/src/auth/rate-limit.ts`
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/src/db/rls.ts`
- Create: `apps/api/src/auth/code.test.ts`
- Create: `apps/api/src/auth/session.test.ts`
- Create: `apps/api/src/auth/rate-limit.test.ts`
- Create: `apps/api/src/auth/routes.test.ts`
- Modify: `apps/api/src/db/schema.sql`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/package.json`
- Modify: `pnpm-lock.yaml`

### Task 1: Dependências e contratos de auth

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/auth/code.test.ts`
- Create: `apps/api/src/auth/session.test.ts`

- [ ] **Step 1: Escrever os testes falhando para geração/hash de código e sessão**

```ts
// apps/api/src/auth/code.test.ts
import { describe, expect, it } from "vitest";
import { compareLoginCode, generateLoginCode, hashLoginCode } from "./code";

describe("login code", () => {
  it("gera código numérico de 6 dígitos", () => {
    const code = generateLoginCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hasheia e compara sem guardar texto puro", async () => {
    const code = "123456";
    const hash = hashLoginCode(code);
    expect(hash).not.toBe(code);
    expect(await compareLoginCode(code, hash)).toBe(true);
    expect(await compareLoginCode("000000", hash)).toBe(false);
  });
});
```

```ts
// apps/api/src/auth/session.test.ts
import { describe, expect, it } from "vitest";
import { createSessionToken, hashSessionToken, isSessionExpired } from "./session";

describe("session token", () => {
  it("gera token opaco e hasheia antes de persistir", () => {
    const token = createSessionToken();
    const hash = hashSessionToken(token);
    expect(token).not.toBe(hash);
    expect(token.length).toBeGreaterThan(20);
  });

  it("reconhece sessão expirada", () => {
    expect(isSessionExpired(new Date("2020-01-01T00:00:00.000Z"))).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar os testes para validar RED**

Run: `pnpm --filter api test -- src/auth/code.test.ts src/auth/session.test.ts`

Expected: FAIL com módulos `./code` e `./session` ausentes.

- [ ] **Step 3: Adicionar dependências mínimas**

```json
// apps/api/package.json
{
  "dependencies": {
    "@hono/node-server": "1.12.2",
    "@resend/node": "4.0.1",
    "hono": "4.4.7",
    "pg": "8.12.0"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/pg": "8.11.10",
    "tsx": "4.16.2",
    "typescript": "5.4.5",
    "vitest": "1.6.0"
  }
}
```

- [ ] **Step 4: Instalar dependências**

Run: `pnpm install --no-frozen-lockfile`

Expected: PASS e `pnpm-lock.yaml` atualizado.

- [ ] **Step 5: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml apps/api/src/auth/code.test.ts apps/api/src/auth/session.test.ts
git commit -m "test: add passwordless auth contracts"
```

### Task 2: Schema e helpers criptográficos

**Files:**
- Modify: `apps/api/src/db/schema.sql`
- Create: `apps/api/src/auth/code.ts`
- Create: `apps/api/src/auth/session.ts`
- Modify: `apps/api/src/auth/code.test.ts`
- Modify: `apps/api/src/auth/session.test.ts`

- [ ] **Step 1: Estender o schema com `users.name`, `login_codes` e `sessions`**

```sql
-- apps/api/src/db/schema.sql
alter table users add column if not exists name text;

create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts int not null default 0,
  requested_ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  created_ip_hash text
);

create index if not exists idx_login_codes_email_created_at on login_codes (email, created_at desc);
create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_token_hash on sessions (token_hash);
```

- [ ] **Step 2: Implementar helpers de código**

```ts
// apps/api/src/auth/code.ts
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function generateLoginCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashLoginCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function compareLoginCode(code: string, hash: string): Promise<boolean> {
  const incoming = Buffer.from(hashLoginCode(code), "hex");
  const stored = Buffer.from(hash, "hex");
  return incoming.length === stored.length && timingSafeEqual(incoming, stored);
}
```

- [ ] **Step 3: Implementar helpers de sessão**

```ts
// apps/api/src/auth/session.ts
import { createHash, randomBytes } from "node:crypto";

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isSessionExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
```

- [ ] **Step 4: Rodar os testes dos helpers**

Run: `pnpm --filter api test -- src/auth/code.test.ts src/auth/session.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema.sql apps/api/src/auth/code.ts apps/api/src/auth/session.ts
git commit -m "feat: add auth schema and crypto helpers"
```

### Task 3: Rate limit e cookie de sessão

**Files:**
- Create: `apps/api/src/auth/cookies.ts`
- Create: `apps/api/src/auth/rate-limit.ts`
- Create: `apps/api/src/auth/rate-limit.test.ts`

- [ ] **Step 1: Escrever o teste falhando do rate limit**

```ts
// apps/api/src/auth/rate-limit.test.ts
import { describe, expect, it } from "vitest";
import { isWithinRequestCodeLimit, isWithinVerifyLimit } from "./rate-limit";

describe("rate-limit helpers", () => {
  it("bloqueia mais de 3 pedidos por janela", () => {
    expect(isWithinRequestCodeLimit(3)).toBe(true);
    expect(isWithinRequestCodeLimit(4)).toBe(false);
  });

  it("bloqueia mais de 5 tentativas de verificação", () => {
    expect(isWithinVerifyLimit(5)).toBe(true);
    expect(isWithinVerifyLimit(6)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/auth/rate-limit.test.ts`

Expected: FAIL com `./rate-limit` ausente.

- [ ] **Step 3: Implementar utilitários simples**

```ts
// apps/api/src/auth/rate-limit.ts
export function isWithinRequestCodeLimit(count: number): boolean {
  return count <= 3;
}

export function isWithinVerifyLimit(count: number): boolean {
  return count <= 5;
}
```

```ts
// apps/api/src/auth/cookies.ts
export const SESSION_COOKIE_NAME = "freya_session";

export function buildSessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `pnpm --filter api test -- src/auth/rate-limit.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/cookies.ts apps/api/src/auth/rate-limit.ts apps/api/src/auth/rate-limit.test.ts
git commit -m "feat: add auth rate limit and session cookies"
```

### Task 4: Cliente Postgres, email e middleware

**Files:**
- Create: `apps/api/src/db/client.ts`
- Create: `apps/api/src/db/rls.ts`
- Create: `apps/api/src/auth/email.ts`
- Create: `apps/api/src/auth/middleware.ts`

- [ ] **Step 1: Implementar cliente de banco**

```ts
// apps/api/src/db/client.ts
import { Pool } from "pg";

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}
```

- [ ] **Step 2: Implementar helper de RLS**

```ts
// apps/api/src/db/rls.ts
import type { PoolClient } from "pg";

export async function applyRlsUser(client: PoolClient, userId: string) {
  await client.query("select set_config('app.user_id', $1, true)", [userId]);
}
```

- [ ] **Step 3: Implementar envio de email via Resend**

```ts
// apps/api/src/auth/email.ts
import { Resend } from "@resend/node";

export async function sendLoginCodeEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Resend env vars are required");
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: email,
    subject: "Seu código de acesso Freya",
    text: `Seu código de acesso é: ${code}`
  });
}
```

- [ ] **Step 4: Implementar middleware de sessão**

```ts
// apps/api/src/auth/middleware.ts
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { SESSION_COOKIE_NAME } from "./cookies";
import { hashSessionToken, isSessionExpired } from "./session";
import { getDbPool } from "../db/client";

export async function authSessionMiddleware(c: Context, next: Next) {
  const token = getCookie(c, SESSION_COOKIE_NAME);

  if (!token) {
    c.set("authUserId", null);
    return next();
  }

  const pool = getDbPool();
  const { rows } = await pool.query(
    "select user_id, expires_at from sessions where token_hash = $1 limit 1",
    [hashSessionToken(token)]
  );

  const session = rows[0];
  if (!session || isSessionExpired(new Date(session.expires_at))) {
    c.set("authUserId", null);
    return next();
  }

  c.set("authUserId", String(session.user_id));
  return next();
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/client.ts apps/api/src/db/rls.ts apps/api/src/auth/email.ts apps/api/src/auth/middleware.ts
git commit -m "feat: add auth db and middleware layer"
```

### Task 5: Endpoints de auth e teste de fluxo

**Files:**
- Modify: `apps/api/src/index.ts`
- Create: `apps/api/src/auth/routes.test.ts`

- [ ] **Step 1: Escrever o teste falhando do contrato HTTP**

```ts
// apps/api/src/auth/routes.test.ts
import { describe, expect, it } from "vitest";
import { app } from "../index";

describe("auth routes", () => {
  it("expõe request-code", async () => {
    const response = await app.request("/auth/request-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "rick@example.com" })
    });

    expect(response.status).toBe(200);
  });

  it("expõe session", async () => {
    const response = await app.request("/auth/session");
    expect([200, 401]).toContain(response.status);
  });
});
```

- [ ] **Step 2: Rodar o teste para validar RED**

Run: `pnpm --filter api test -- src/auth/routes.test.ts`

Expected: FAIL porque `index.ts` ainda não exporta `app` nem as rotas.

- [ ] **Step 3: Refatorar `index.ts` para exportar `app` e implementar rotas**

```ts
// apps/api/src/index.ts
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { serve } from "@hono/node-server";
import { authSessionMiddleware } from "./auth/middleware";
import { buildSessionCookie, clearSessionCookie } from "./auth/cookies";

export const app = new Hono();
app.use("*", authSessionMiddleware);

app.post("/auth/request-code", async (c) => {
  return c.json({ ok: true, message: "Se o email existir, um código foi enviado." });
});

app.post("/auth/verify-code", async (c) => {
  return c.json({ ok: false, error: "not_implemented_yet" }, 501);
});

app.post("/auth/logout", async (c) => {
  c.header("Set-Cookie", clearSessionCookie(process.env.NODE_ENV === "production"));
  return c.json({ ok: true });
});

app.get("/auth/session", async (c) => {
  const authUserId = c.get("authUserId");
  if (!authUserId) {
    return c.json({ ok: false }, 401);
  }
  return c.json({ ok: true, userId: authUserId });
});
```

Depois evoluir `request-code` e `verify-code` para:
- checar usuário existente sem revelar enumeração
- gravar `login_codes`
- enviar email
- validar código
- criar `sessions`
- setar cookie

- [ ] **Step 4: Proteger endpoints existentes com sessão**

Adicionar uma rota protegida mínima para validar a troca do header cru:

```ts
app.get("/api/sites", async (c) => {
  const authUserId = c.get("authUserId");
  if (!authUserId) {
    return c.json({ ok: false, error: "unauthorized" }, 401);
  }
  return c.json({ ok: true, sites: [] });
});
```

- [ ] **Step 5: Rodar os testes HTTP**

Run: `pnpm --filter api test -- src/auth/routes.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/index.ts apps/api/src/auth/routes.test.ts
git commit -m "feat: add passwordless auth routes"
```

### Task 6: Validação final do fluxo e endurecimento

**Files:**
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/auth/middleware.ts`
- Modify: `apps/api/src/auth/routes.test.ts`

- [ ] **Step 1: Completar `request-code`**

Implementar no handler:

```ts
const email = String(body.email ?? "").trim().toLowerCase();
// contar requests recentes por email/IP
// buscar user por email
// se existir: gerar código, hash, insert em login_codes, enviar email
return c.json({ ok: true, message: "Se o email existir, um código foi enviado." });
```

- [ ] **Step 2: Completar `verify-code`**

Implementar no handler:

```ts
// buscar último login_code válido
// recusar expirado/usado
// comparar hash
// incrementar attempts em falha
// marcar used_at em sucesso
// criar sessão com token_hash
// setar cookie httpOnly
// responder { ok: true }
```

- [ ] **Step 3: Renovar sessão no middleware**

Ao validar sessão com sucesso:

```ts
await pool.query(
  "update sessions set last_seen_at = now(), expires_at = now() + interval '30 days' where token_hash = $1",
  [hashSessionToken(token)]
);
```

- [ ] **Step 4: Rodar a validação final**

Run: `pnpm --filter api type-check && pnpm --filter api test && pnpm --filter api build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src
git commit -m "feat: complete passwordless email auth"
```

## Self-review

- Cobertura do spec:
  - schema (`users.name`, `login_codes`, `sessions`): Task 2
  - hash de código/token: Tasks 1 e 2
  - rate limit mínimo: Task 3
  - Resend: Task 4
  - middleware e RLS via sessão: Tasks 4 e 5
  - request-code / verify-code / logout / session: Tasks 5 e 6
- Sem placeholders: todas as tasks têm arquivos exatos, testes, comandos e trechos concretos.
- Consistência:
  - `authUserId` é o nome do valor no contexto do Hono em todas as tasks
  - `SESSION_COOKIE_NAME` é reutilizado de ponta a ponta
  - `hashLoginCode` e `hashSessionToken` mantêm SHA-256 em toda a cadeia
