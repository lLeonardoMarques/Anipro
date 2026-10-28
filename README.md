# AnPrice — Análise de Preços (frontend)

Interface React + Vite do AnPrice. Em produção ela é **servida pelo próprio servidor AnPrice no Render**
(repositório `anprice-servidor`), na mesma origem da API:

```
https://anprice-servidor.onrender.com/        → este frontend
https://anprice-servidor.onrender.com/api/... → API (login, busca, OAuth)
```

Mesma origem = sem CORS, cookie de sessão de primeira parte (`HttpOnly; Secure; SameSite=Lax`)
e funcionamento em qualquer navegador, inclusive os que bloqueiam cookies de terceiros.

O endereço antigo `https://lleonardomarques.github.io/Anipro/` passou a ser apenas um redirecionamento.

## Desenvolvimento

```bash
npm install
npm run dev          # http://localhost:5173
```

O Vite encaminha `/api`, `/auth` e `/health` para o servidor do Render (`vite.config.ts`), então o
login e a busca funcionam no localhost sem CORS. Para usar um backend local:

```bash
# PowerShell
$env:ANPRICE_API_URL="http://localhost:3000"; npm run dev
```

A conexão OAuth com o Mercado Livre deve ser feita pelo site publicado (a Redirect URI registrada
aponta para o Render). O token fica no servidor e vale para os dois ambientes.

Não há segredos neste repositório: senha, tokens e credenciais do Mercado Livre existem apenas
nas variáveis de ambiente do servidor.

## Publicação

Um `push` na `main` dispara `.github/workflows/deploy.yml`, que:

1. roda `npm ci`, verifica os tipos e compila (falha se `package-lock.json` estiver inconsistente);
2. publica no GitHub Pages a página de redirecionamento (`pages-redirect/`);
3. dispara o deploy do Render, se o segredo `RENDER_DEPLOY_HOOK` estiver configurado no repositório.

Ao alterar dependências, rode `npm install` e envie o `package-lock.json` junto.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com proxy para a API |
| `npm run build` | Compila para `dist/` |
| `npm run lint` | Verificação de tipos (TypeScript) |
