# ⚽ FUT-DOMINATION (SaaS Edition)

Uma plataforma social de dominação de territórios para times de futebol amador.

Este projeto está configurado como um **Web Service** (Node.js + React), ideal para operações SaaS escaláveis, permitindo futuro suporte a webhooks, SSR ou lógica de backend segura.

## 🚀 Tecnologias

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Servidor:** Node.js + Express (Server-Side Serving)
- **IA:** Google Gemini API
- **Banco de Dados:** SQLite Cloud
- **Mapas:** Leaflet

---

## 🛠️ Instalação Local

1. **Clone e Instale:**
   ```bash
   git clone https://github.com/seu-usuario/fut-domination.git
   cd fut-domination
   npm install
   ```

2. **Configure o Ambiente (.env):**
   ```env
   API_KEY=sua_chave_gemini
   =sua_string_sqlite
   ```

3. **Rodar em Desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Testar Versão de Produção (Simulando o Web Service):**
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Deploy no Render (Modo Web Service)

Para operar como um SaaS, usaremos o modo **Web Service** do Render. Isso garante que o servidor Node.js gerencie o roteamento e mantenha a aplicação ativa.

### Passo 1: Criar o Serviço
1. Acesse o [Dashboard do Render](https://dashboard.render.com/).
2. Clique em **New +** -> **Web Service**.
3. Conecte seu repositório GitHub.

### Passo 2: Configurações do Serviço
Preencha exatamente como abaixo:

| Campo | Configuração | Explicação |
|-------|--------------|------------|
| **Name** | `fut-domination-saas` | Nome do seu app |
| **Runtime** | **Node** | Ambiente de execução |
| **Build Command** | `npm install && npm run build` | Instala deps e compila o React |
| **Start Command** | `npm start` | Inicia o servidor Express (`node server.js`) |
| **Instance Type** | Free (ou Starter para produção) | Free "dorme" após inatividade |

### Passo 3: Variáveis de Ambiente (Environment Variables)
No painel do serviço, aba **Environment**, adicione:

1. `API_KEY`: Sua chave do Google Gemini.
2. `SQLITE_CONNECTION_STRING`: Sua conexão do banco.
3. `NODE_VERSION`: `20` (Recomendado para compatibilidade).

> **Nota:** O Render injetará essas variáveis durante o `Build Command` (para o Vite configurar o frontend) e elas estarão disponíveis para o servidor Node.js em tempo de execução.

### Passo 4: Deploy
Clique em **Create Web Service**.

### 🔍 Por que Web Service e não Static Site?
Como SaaS, escolhemos Web Service porque:
- **Roteamento Híbrido:** O servidor Express (`server.js`) garante que se o usuário recarregar a página em `/profile`, ele não receberá um erro 404, mas sim o app React carregado corretamente.
- **Extensibilidade:** Se amanhã você quiser criar uma API `/api/webhook-pagamento` para receber notificações de pagamento do plano "Dono de Time", você pode adicionar diretamente no `server.js` sem mudar a infraestrutura.

---

## 📱 Estrutura do Projeto

- `/dist`: Arquivos compilados de produção (gerados pelo Vite).
- `/src`: Código fonte React.
- `server.js`: Servidor de entrada para produção (SaaS).
- `vite.config.ts`: Configuração do bundler.
