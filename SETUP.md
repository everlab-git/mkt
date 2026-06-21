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

## 3) Vercel (deploy do Editor agora)

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
  - por enquanto pode ser algo como `https://SUA-API-AQUI.example.com`
  - depois atualizamos para a URL real da API quando decidirmos onde hospedar

### 3.4 Verificação manual do Prompt 1

Ao abrir o editor, a tela inicial deve mostrar **dois cards com o mesmo componente**, mas com temas diferentes:
- card 1: usa o fallback do sistema quando não existe `theme`
- card 2: usa um `theme` explícito de exemplo

Isso documenta o critério de aceite de tema por site: o mesmo componente renderiza identidades visuais diferentes sem hardcode de marca no componente.

---

## 4) Próximo passo (para eu já deixar pronto)

Quando você decidir o runtime da API, eu ajusto o scaffold para deploy:
- **Vercel Functions** (Node) ou
- **Cloudflare Workers** (mais alinhado com o spec do Freya)
