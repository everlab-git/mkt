# Setup — GitHub + Supabase + Vercel

Este repositório (`https://github.com/everlab-git/mkt`) estava vazio. Este scaffold cria a base do **monorepo** (editor + api) para destravar:
- CI no GitHub
- Deploy do editor na Vercel
- Banco Postgres no Supabase (apenas DB)

---

## 1) GitHub

### 1.1 Subir o scaffold para o repositório

```bash
git clone https://github.com/everlab-git/mkt
cd mkt

# copie os arquivos deste scaffold para dentro do repo (sobrescrevendo)
# depois:
git add .
git commit -m "chore: init freya monorepo scaffold"
git push origin main
```

### 1.2 Ajustes recomendados no GitHub (manual)

- **Branch protection (main)**:
  - exigir PR
  - exigir status checks: `CI / build-test`
  - bloquear push direto
- **Secrets**:
  - adicionar secrets apenas quando a API estiver em produção

---

## 2) Supabase (somente Postgres)

### 2.1 Criar projeto

1. Criar um projeto novo no Supabase.
2. Copiar a **connection string** do Postgres (modo *Transaction* / *Session* conforme preferência).

### 2.2 Rodar o schema inicial

No SQL Editor do Supabase, execute o arquivo:

`apps/api/src/db/schema.sql`

> Ele já habilita RLS nas tabelas principais.

### 2.3 Como vamos usar RLS sem Supabase Auth

Como você escolheu “Só Postgres”, a aplicação (API) vai:
- autenticar o usuário por conta própria (Auth.js/Passkeys depois)
- **definir** o usuário no Postgres por request com:
  - `SET LOCAL app.user_id = '<uuid>'`

Assim, as policies usam `current_setting('app.user_id')`.

### 2.4 Variáveis de ambiente (API)

No ambiente (Vercel/servidor), definir pelo menos:
- `DATABASE_URL` (string do Supabase)

---

## 3) Vercel (deploy do Editor + API)

### 3.1 Criar projeto na Vercel

1. Importar o repositório `everlab-git/mkt`.
2. **Root Directory:** `apps/editor`
3. Framework Preset: **Vite**

### 3.2 Build settings

- Install Command:
  - `pnpm install --frozen-lockfile`
- Build Command:
  - `pnpm --filter editor build`
- Output Directory:
  - `apps/editor/dist`

### 3.3 Environment variables (Editor)

Definir em Preview + Production:
- `VITE_API_URL`
  - use a URL do projeto da API na Vercel (ex: `https://freya-api-xyz.vercel.app`)
  - endpoint de teste: `GET /api/health`

---

## 4) Vercel — Projeto da API

> A API está preparada como **Vercel Functions** (pasta `apps/api/api/*`).

### 4.1 Criar projeto na Vercel

1. Criar/importar um **segundo** projeto na Vercel, usando o mesmo repositório.
2. **Root Directory:** `apps/api`
3. Framework Preset: **Other**

### 4.2 Build settings

- Install Command:
  - `pnpm install --frozen-lockfile`
- Build Command:
  - `pnpm --filter api build`

### 4.3 Environment variables (API)

Definir em Preview + Production:
- `DATABASE_URL` (Supabase connection string)

Teste rápido:
- `GET https://SUA-API.vercel.app/api/health` → `{ "ok": true }`

---

## 5) Próximo passo

Quando você decidir o runtime da API, eu ajusto o scaffold para deploy:
- **Vercel Functions** (Node) ou
- **Cloudflare Workers** (mais alinhado com o spec do Freya)
