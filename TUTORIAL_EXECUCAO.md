# 🚀 Guia de Execução - IF REDE (TCC)

Este guia contém o passo a passo completo para configurar e rodar o projeto **IF REDE** em sua máquina local.

---

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado:
1.  **Node.js** (v18 ou superior recomendado) - [Download](https://nodejs.org/)
2.  **MongoDB** (Local ou via Atlas) - [Download Community Server](https://www.mongodb.com/try/download/community)
3.  **Git** (opcional, para clonar o repositório)

---

## 🛠️ Passo 1: Configurando o Backend

O backend gerencia o banco de dados, autenticação e a lógica de negócios.

1.  Abra um terminal na pasta `if-rede-backend`.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente:
    *   Copie o arquivo `.env.example` e renomeie para `.env`.
    *   Abra o `.env` e certifique-se de que a `MONGODB_URI` está correta. 
    *   *Dica:* Se o seu MongoDB estiver rodando localmente sem senha, use: `mongodb://localhost:27017/if-rede`.
4.  (Opcional) Popular o banco de dados com dados iniciais:
    ```bash
    npm run seed
    ```
5.  Inicie o servidor:
    ```bash
    npm run dev
    ```
    *O backend estará rodando em: `http://localhost:3000`*

---

## 🎨 Passo 2: Configurando o Frontend

O frontend é a interface visual construída em Next.js.

1.  Abra um novo terminal na pasta `if-rede-frontend`.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    *O frontend estará rodando em: `http://localhost:3001`*

---

## 🌐 Resumo de Portas

*   **Frontend:** `http://localhost:3001`
*   **Backend (API):** `http://localhost:3000`
*   **MongoDB:** `27017`

---

## 📝 Comandos Úteis

### Backend
*   `npm run dev`: Inicia com Nodemon (recarrega ao salvar).
*   `npm run seed`: Cria usuários e postagens de teste.
*   `npm start`: Inicia em modo de produção.

### Frontend
*   `npm run dev`: Inicia o ambiente de desenvolvimento.
*   `npm run build`: Gera a versão otimizada para produção.

---

## 🧐 Solução de Problemas

1.  **Erro de conexão com o MongoDB:** Verifique se o serviço do MongoDB está ativo (Services.msc no Windows ou `systemctl status mongod` no Linux).
2.  **Porta 3000 ou 3001 ocupada:** Encerre processos antigos ou mude a porta nos arquivos de configuração (`.env` no backend ou script no `package.json` do frontend).
3.  **Imagens não carregam:** Verifique se as URLs no banco de dados apontam para o caminho correto ou se o backend está servindo a pasta `uploads`.

---

✨ **IF REDE** - Conectando Conhecimento Acadêmico.
