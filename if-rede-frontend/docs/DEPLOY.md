# Deploy IF REDE (Frontend + Backend)

Este guia coloca o site no ar usando:
- Frontend: Vercel (Next.js)
- Backend: Render (Node.js + MongoDB Atlas)

## 1) Subir o backend (Render)

1. Crie uma conta em https://render.com.
2. Clique em New + Web Service e conecte o repositorio do backend.
3. Configure:
- Runtime: Node
- Build Command: npm install
- Start Command: npm start
- Root Directory: if-rede-backend (se o repo for monorepo)

4. Adicione variaveis de ambiente:
- NODE_ENV=production
- PORT=10000
- MONGODB_URI=<sua_string_mongodb_atlas>
- JWT_SECRET=<um_secret_forte>
- JWT_REFRESH_SECRET=<outro_secret_forte>
- RATE_LIMIT_POR_MINUTO=100
- CORS_ORIGINS=https://SEU_FRONTEND.vercel.app

5. Publique e teste:
- https://SEU_BACKEND.onrender.com/health

## 2) Subir o frontend (Vercel)

1. Crie conta em https://vercel.com.
2. Importe o repositorio do frontend.
3. Configure:
- Framework Preset: Next.js
- Root Directory: if-rede-frontend (se o repo for monorepo)

4. Variavel de ambiente obrigatoria:
- NEXT_PUBLIC_API_URL=https://SEU_BACKEND.onrender.com

5. Deploy.

## 3) Ajustar CORS no backend

Depois de publicar o frontend, atualize no Render:
- CORS_ORIGINS=https://SEU_FRONTEND.vercel.app

Se tiver ambiente preview e producao, use dois dominios separados por virgula:
- CORS_ORIGINS=https://SEU_FRONTEND.vercel.app,https://SEU_FRONTEND-git-main.vercel.app

## 4) Validacao final

1. Abra o frontend publicado.
2. Teste cadastro/login.
3. Teste criacao de postagem e busca.
4. Verifique no DevTools se chamadas vao para a URL do backend publicado.

## Observacoes importantes

- Uploads atualmente usam pasta local do backend (/uploads). Em hospedagem como Render, arquivos podem nao persistir entre reinicios. Para producao real, mova uploads para S3/Cloudinary.
- O frontend ja usa NEXT_PUBLIC_API_URL para apontar para a API publicada.
- A rota /health ajuda a verificar disponibilidade da API.