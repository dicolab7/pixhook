# PixHook

PixHook e um projeto para validar o uso de um app Android com plano gratuito/PRO, controle de limite diario, integracao com Google Play Billing e painel administrativo protegido.

O backend tambem serve a pagina publica do produto, entao o mesmo servidor Express entrega:

- Site publico em `/`
- APIs do app Android em `/api/*`
- Area restrita do admin em `/admin`
- Webhook RTDN da Google Play em `/api/rtdn`

## Estrutura do projeto

```text
pixhook/
+-- bkend_playstore/
|   +-- middleware/
|   |   +-- adminAuth.js
|   +-- migrations/
|   +-- public/
|   |   +-- admin-login.html
|   |   +-- admin-plan.html
|   |   +-- app.js
|   |   +-- index.html
|   +-- routes/
|   +-- services/
|   +-- db.js
|   +-- migrate.js
|   +-- package.json
|   +-- server.js
+-- webhook_page/
    +-- css/
    +-- favicon/
    +-- img/
    +-- documents.html
    +-- index.html
    +-- privacidade.html
    +-- termos.html
```

## Tecnologias

- Node.js
- Express
- PostgreSQL
- Google Android Publisher API
- HTML/CSS/JavaScript puro para o frontend publico e admin

## Requisitos

- Node.js 18 ou superior
- PostgreSQL
- Uma base de dados criada para o PixHook
- Credenciais da Google Play Console, caso use verificacao de compras

## Configuracao

Entre na pasta do backend:

```bash
cd bkend_playstore
```

Instale as dependencias:

```bash
npm install
```

Crie o arquivo `.env` com base em `.env.example`:

```bash
cp .env.example .env
```

Exemplo de variaveis:

```env
PORT=3000
PUBLIC_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=pixhook
DB_USER=postgres
DB_PASSWORD=sua_senha

ADMIN_PASSWORD=uma_senha_forte
ADMIN_SESSION_SECRET=um_segredo_longo_aleatorio
ADMIN_KEY=uma_chave_longa_para_automacoes

GOOGLE_SERVICE_ACCOUNT_KEY=./service-account.json
```

### Variaveis importantes

| Variavel | Uso |
| --- | --- |
| `PORT` | Porta HTTP do servidor. |
| `PUBLIC_URL` | URL publica do projeto em producao. |
| `CORS_ORIGIN` | Origem permitida para CORS. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexao PostgreSQL. |
| `ADMIN_PASSWORD` | Senha usada no login do painel admin. |
| `ADMIN_SESSION_SECRET` | Segredo usado para assinar a sessao do admin. |
| `ADMIN_KEY` | Chave opcional para automacoes via header `x-admin-key`. |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Caminho do JSON da service account da Google Play. |

## Banco de dados

As migrations ficam em `bkend_playstore/migrations` e criam as tabelas:

- `devices`: dispositivos Android, plano atual e contagem diaria.
- `purchases`: compras verificadas na Google Play.
- `purchase_events`: eventos de compra, renovacao, cancelamento e reembolso.
- `usage_logs`: historico de uso do app.

O servidor executa as migrations automaticamente ao iniciar. Tambem e possivel rodar manualmente:

```bash
npm run migrate
```

## Executando localmente

Na pasta `bkend_playstore`:

```bash
npm start
```

Se tudo estiver correto, o log deve mostrar algo parecido com:

```text
Migrations finalizadas com sucesso
PixHook backend rodando na porta 3000
```

Depois acesse:

```text
http://localhost:3000
```

## Area admin

A area restrita fica em:

```text
http://localhost:3000/admin
```

O servidor redireciona para:

```text
/admin/login
```

Use a senha configurada em:

```env
ADMIN_PASSWORD=...
```

O painel permite:

- Listar dispositivos cadastrados
- Alterar plano entre `FREE` e `PRO`
- Remover dispositivos
- Atualizar plano manualmente pela tela `/admin/plan`

### Seguranca do admin

A area admin usa:

- Cookie `HttpOnly`
- `SameSite=Strict`
- Sessao assinada com `ADMIN_SESSION_SECRET`
- Expiracao de sessao
- Limite simples de tentativas de login
- Rotas administrativas protegidas por middleware

Para producao, use sempre HTTPS e configure senhas/chaves longas.

## Rotas principais

### Publicas

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/` | Site publico do PixHook. |
| `GET` | `/documents.html` | Documentacao publica do uso do webhook PIX. |
| `GET` | `/termos.html` | Termos de uso. |
| `GET` | `/privacidade.html` | Politica de privacidade. |

### App Android

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/device/init` | Inicializa ou consulta um dispositivo pelo `android_id`. |
| `POST` | `/api/check` | Verifica se o dispositivo ainda pode usar o plano gratuito. |
| `POST` | `/api/purchase/verify` | Verifica uma compra da Google Play e ativa PRO. |

### Google Play RTDN

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/rtdn` | Recebe notificacoes em tempo real da Google Play. |

### Admin

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/admin` | Painel restrito. |
| `GET` | `/admin/login` | Tela de login. |
| `POST` | `/admin/login` | Cria sessao admin. |
| `POST` | `/admin/logout` | Encerra sessao admin. |
| `GET` | `/admin/devices` | Lista dispositivos. |
| `PUT` | `/admin/plan` | Atualiza plano de um dispositivo. |
| `DELETE` | `/admin/device/:id` | Remove um dispositivo. |
| `POST` | `/admin/device/plan` | Atualiza plano manualmente, com sessao admin ou `x-admin-key`. |

## Exemplos de payload

### Inicializar dispositivo

```http
POST /api/device/init
Content-Type: application/json
```

```json
{
  "android_id": "f3b4bc1c431fa831"
}
```

Resposta para plano gratuito:

```json
{
  "plan": "FREE",
  "remaining": 5
}
```

### Verificar uso diario

```http
POST /api/check
Content-Type: application/json
```

```json
{
  "android_id": "f3b4bc1c431fa831"
}
```

Resposta possivel:

```json
{
  "allowed": true,
  "remaining": 4
}
```

### Verificar compra da Google Play

```http
POST /api/purchase/verify
Content-Type: application/json
```

```json
{
  "android_id": "f3b4bc1c431fa831",
  "product_id": "pixhook_pro",
  "purchase_token": "token_da_compra",
  "package_name": "com.seuapp.pixhook"
}
```

Resposta:

```json
{
  "ok": true,
  "pro": true
}
```

## Deploy

Para deploy em Render, Railway, VPS ou similar:

1. Configure um PostgreSQL acessivel pelo servidor.
2. Defina todas as variaveis de ambiente.
3. Configure `PUBLIC_URL` e `CORS_ORIGIN` com o dominio final.
4. Garanta que o arquivo da service account da Google Play esteja disponivel no caminho de `GOOGLE_SERVICE_ACCOUNT_KEY`.
5. Rode o comando de start:

```bash
npm start
```

## Observacoes

- O backend serve o site publico de `webhook_page`.
- A pasta `bkend_playstore/public` e usada apenas para telas do admin.
- O endpoint `/api/whatsapp/qr/1` nao faz parte deste projeto atualmente. Se ele aparecer nos logs, provavelmente vem de uma aba antiga, cache, teste externo ou outro frontend apontando para este servidor.

## Uso e direitos

Este e um produto privado e proprietario.

Todos os direitos reservados. O codigo-fonte, marca, telas, documentacao e demais arquivos deste repositorio nao podem ser copiados, modificados, redistribuidos, revendidos ou usados comercialmente por terceiros sem autorizacao expressa do autor.
