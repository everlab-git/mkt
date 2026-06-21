# Prompt 4 — autenticação passwordless por código de email

## Escopo

Esta rodada substitui o uso confiável do header `x-user-id` por uma identidade real baseada em sessão. O fluxo será passwordless por código enviado por email via Resend, sem cadastro pela aplicação e sem qualquer armazenamento de senha.

## Estado atual

Hoje a API ainda está muito básica:

- existe `users` no schema, mas sem `name`
- não existem `login_codes` nem `sessions`
- o `schema.sql` ainda assume acesso centrado em `owner_id`
- a API em `apps/api/src/index.ts` ainda é um scaffold Hono mínimo

Ou seja, o Prompt 4 não é só “trocar o header”; ele precisa criar a base de autenticação e o middleware de sessão na API.

## Abordagem escolhida

Vou usar uma solução própria, enxuta, em vez de trazer um framework completo de auth.

### Motivo

- o fluxo é específico: email + código numérico + cookie httpOnly
- o schema e o RLS já são nossos
- o prompt pede pouca superfície: login, sessão e troca da fonte de `app.user_id`
- isso reduz acoplamento e evita encaixar uma stack maior do que o necessário nesta fase

## Fluxo de autenticação

### Pedir código

1. usuário informa email
2. API normaliza o email
3. API aplica rate limit por email e IP
4. se o email existir em `users`, gera código numérico aleatório
5. salva apenas `code_hash` em `login_codes`, com expiração de 10 minutos
6. envia o código via Resend
7. responde sempre de forma genérica, sem revelar se o email existe

### Validar código

1. usuário informa email + código
2. API aplica rate limit por email e IP
3. busca o código válido mais recente
4. valida:
   - não expirado
   - não usado
   - hash confere
   - tentativas abaixo do limite
5. em caso de falha, incrementa `attempts`
6. em caso de sucesso:
   - marca `used_at`
   - cria sessão em `sessions`
   - envia cookie httpOnly

### Requests autenticadas

1. middleware lê cookie de sessão
2. token bruto do cookie é hasheado
3. API busca sessão válida
4. se existir, injeta `user_id`
5. ao abrir transação com Postgres, continua usando `SET LOCAL app.user_id`, mas agora vindo da sessão

## Estrutura proposta

### Banco

Adicionar ao schema:

- `users.name`
- `login_codes`
- `sessions`

`login_codes` terá:

- `id`
- `email`
- `code_hash`
- `expires_at`
- `used_at`
- `attempts`
- `created_at`
- `requested_ip_hash`

`sessions` terá:

- `id`
- `user_id`
- `token_hash`
- `created_at`
- `expires_at`
- `last_seen_at`
- `created_ip_hash`

Também vale incluir índices por:

- `login_codes(email, created_at desc)`
- `sessions(user_id)`
- `sessions(token_hash)`

## Serviços da API

Eu dividiria a autenticação em pequenos módulos:

- `src/auth/code.ts`
  - gerar código
  - hash do código
  - comparar código

- `src/auth/session.ts`
  - gerar token de sessão
  - hash do token
  - montar cookie
  - validar expiração

- `src/auth/rate-limit.ts`
  - regra simples por janela usando Postgres
  - sem Redis nesta fase

- `src/auth/email.ts`
  - encapsular envio via Resend

- `src/auth/middleware.ts`
  - resolver sessão do cookie
  - popular contexto de usuário

- `src/db/rls.ts`
  - helper para aplicar `SET LOCAL app.user_id` a partir do contexto autenticado

## Endpoints

Endpoints novos:

- `POST /auth/request-code`
- `POST /auth/verify-code`
- `POST /auth/logout`
- `GET /auth/session`

Comportamento:

- `request-code` sempre responde genericamente
- `verify-code` cria cookie de sessão
- `logout` invalida a sessão atual
- `session` retorna dados mínimos do usuário autenticado

## Cookie e sessão

O cookie deve ser:

- `httpOnly`
- `sameSite=lax`
- `secure` em produção
- `path=/`
- expiração alinhada com a sessão

A sessão terá duração inicial de 30 dias, com renovação no uso por atualização de `last_seen_at` e `expires_at`.

## Rate limit

Nesta fase, o rate limit pode ficar no próprio Postgres.

Regras iniciais:

- pedir código: máximo 3 pedidos por email a cada 15 minutos
- validar código: máximo 5 tentativas por código
- também limitar por IP hash para reduzir abuso óbvio

Isso não é a solução definitiva de escala, mas atende o prompt e cabe no momento atual da stack.

## Segurança

Medidas obrigatórias:

- nunca persistir código em texto puro
- nunca persistir token em texto puro
- hashear IP antes de guardar
- resposta genérica para evitar enumeração
- invalidar código após uso
- bloquear código expirado
- sessão inválida não popula contexto de usuário

## RLS e compatibilidade

O mecanismo do banco continua o mesmo em essência:

- abrir transação
- aplicar `SET LOCAL app.user_id`

A diferença é que o valor agora vem do middleware de sessão, não do header cru.

Os endpoints existentes como `GET /api/sites` devem continuar funcionando, mas exigindo sessão válida.

## Critério de pronto

- pedir código funciona com resposta genérica
- validar código cria sessão e cookie
- requests autenticadas resolvem `app.user_id` via sessão
- rate limit mínimo funciona
- código expira e não reutiliza
- sem senha em nenhuma etapa
- usuário sem projeto ainda consegue logar, mas verá lista vazia quando Prompt 5 entrar

## Limites desta rodada

- sem login social
- sem cadastro pela aplicação
- sem Redis
- sem mexer ainda em `project_members`
- sem convite de equipe
