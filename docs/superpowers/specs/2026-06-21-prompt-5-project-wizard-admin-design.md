# Prompt 5 — wizard de criação de projeto e views de administração

## Escopo

Esta rodada constrói duas frentes conectadas:

1. um wizard de criação de projeto em 4 passos, com IA opcional e desligada por padrão
2. o shell das views administrativas de um projeto existente: `pages`, `settings`, `preview` e `builder`

Ela também introduz o modelo de equipe por projeto com `project_members` e atualiza o RLS para múltiplos membros por projeto.

## Dependências já disponíveis

- Prompt 1: `theme`, schema de conteúdo e fallback do editor
- Prompt 2: motor de animação e preview scrollável
- Prompt 3: renderers reais e Builder mínimo
- Prompt 4: sessão real por cookie e `authUserId` vindo do middleware

## Abordagem escolhida

Vou tratar o Prompt 5 como três camadas coordenadas:

1. **backend de projeto/equipe**
2. **wizard de criação**
3. **shell de views administrativas**

Essa ordem evita UI oca. O wizard só entra depois que a API já consegue criar projeto, criar páginas iniciais, persistir `logo_url` e criar automaticamente a linha de `project_members` com `owner`.

## Backend

### Schema

Adicionar no banco:

- `sites.logo_url`
- `sites.goal` ou equivalente no `config`/`metadata`
- `project_members`

Minha recomendação é:

- manter `logo_url` como coluna simples em `sites`
- persistir `goal` em `sites.config` ou coluna dedicada curta
- usar `project_members` como tabela relacional explícita

### `project_members`

Shape:

- `site_id`
- `user_id`
- `role`
- `invited_at`
- `accepted_at`

Regras:

- ao criar projeto, o criador ganha `role = 'owner'`
- o acesso a projeto passa a ser decidido por existência de linha em `project_members`
- `sites.owner_id` pode continuar existindo como compatibilidade/histórico, mas o RLS deixa de depender só dele

### RLS

O RLS de `sites` e `pages` precisa trocar a lógica:

- antes: baseado em `owner_id`
- depois: baseado em membership em `project_members`

Isso é a peça central de segurança do Prompt 5. O wizard e as views só são corretos se a política do banco já refletir isso.

## Wizard de criação

### Passo 1

Campos:

- nome do projeto
- objetivo:
  - geração de leads
  - institucional/branding
  - vendas
  - outro

Sem chamada externa.

### Passo 2

Toggle principal:

- “Quer que a IA ajude a acelerar a criação?”

Default:

- desligado

Se ligado:

- storytelling curto
- `sugerir paleta a partir do logo`
- `gerar rascunho de texto para páginas iniciais`

Os dois subcampos começam marcados.

Regra forte:

- com toggle desligado, nenhuma chamada de IA acontece

### Passo 3

Upload de logo sempre disponível.

Se IA para paleta estiver ligada:

- usar logo como entrada da IA
- popular `theme.palette`
- deixar totalmente editável antes da confirmação

Se IA para paleta estiver desligada:

- usuário escolhe manualmente:
  - background
  - primary
  - accent
  - text

### Passo 4

Escolha do ponto de partida:

- em branco
- estrutura institucional

Se estrutura institucional:

- criar páginas:
  - institucional
  - serviços
  - cases
  - contato

Se IA de texto estiver ligada:

- mostrar prévia editável dos rascunhos antes de finalizar

Se IA de texto estiver desligada:

- usar placeholders neutros

## Views administrativas

### `pages`

Será a view padrão ao abrir um projeto existente.

Responsabilidades:

- árvore de páginas com parent/child
- status por página
- clique numa página abre `builder`

### `settings`

Abas:

- Geral
- Aparência
- Idiomas
- Menu
- Equipe

Observação:

- `Idiomas` aqui pode existir como shell visual/preparação, sem antecipar o Prompt 7

### `preview`

Usa a renderização real do site:

- sections
- blocks
- animações
- persuasão

Sem captura estática.

## Equipe

Na aba Equipe:

- listar membros atuais
- convidar por email
- aceitar apenas emails já existentes em `users`

Se o email não existir:

- mostrar erro claro
- não criar usuário

Nesta rodada:

- apenas papéis `owner` e `member`

## Integração com IA

Para manter o escopo enxuto e coerente:

- o toggle e os subcampos ficam no wizard
- as chamadas à IA ficam encapsuladas no backend
- tudo deve ser opcional e desligado por padrão

As chamadas de IA aqui são de dois tipos:

1. paleta a partir do logo
2. rascunho de texto para páginas iniciais

Essas chamadas devem ser isoladas para permitir futura troca por controle de quota/limite.

## Ponto crítico

Existe **um ponto crítico real de produto** no Prompt 5:

- no passo 4, as opções `Em branco` e `Estrutura institucional` devem ou não começar com uma pré-seleção?

O próprio prompt marca isso como “assunção a confirmar com Rick antes de implementar”.

Minha recomendação conservadora:

- deixar **sem pré-seleção**
- duas opções neutras lado a lado

Isso respeita o texto mais literalmente e reduz risco de enviesar a criação do projeto sem intenção do usuário.

## Critério de pronto

- wizard completo funciona do passo 1 ao 4 com IA desligada
- IA só dispara quando toggle principal está ligado
- subopções de IA funcionam independentemente
- upload de logo funciona sem depender de IA
- projeto criado gera `project_members(role=owner)` para o criador
- views `pages`, `settings`, `preview` e `builder` navegam sem perder contexto principal
- usuários só enxergam projetos onde têm membership
