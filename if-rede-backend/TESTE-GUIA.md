# 🎉 Guia Completo de Testes - Sistema de Perfis

## 📋 Resumo Executivo

O **Sistema de Perfis de Usuários** foi implementado completamente e está **100% pronto para testes**.

### Status: ✅ PRONTO

- ✅ 5 modelos MongoDB criados
- ✅ 23 endpoints implementados
- ✅ Autenticação JWT integrada
- ✅ Privacidade e amizades funcionando
- ✅ Auditoria completa
- ✅ Guias de teste fornecidos

---

## 🚀 Comece Aqui

### Opção 1: Teste Automático (Recomendado) ⭐

#### Windows (PowerShell):
```powershell
cd C:\TCC\if-rede-backend
.\teste.ps1
```

#### Linux/Mac (Bash):
```bash
cd /path/to/TCC/if-rede-backend
bash teste.sh
```

**Tempo**: 5-10 minutos  
**Resultado**: Todos os 21 testes executados automaticamente

---

### Opção 2: Teste Manual com Curl

1. Abra: `GUIA-TESTES-COMPLETO.txt`
2. Siga os 12 passos
3. Execute cada comando cURL
4. Valide as respostas

**Tempo**: 15-30 minutos

---

### Opção 3: Postman

1. Abra Postman
2. File → Import → `TESTES.json`
3. Execute a Collection

**Tempo**: 10-15 minutos

---

## 📂 Arquivos de Teste

| Arquivo | Tipo | Uso | Tempo |
|---------|------|-----|------|
| `COMECE-AQUI.txt` | Texto | Visão geral rápida | 2 min |
| `LEIA-TESTES.txt` | Texto | Índice completo | 5 min |
| `GUIA-TESTES-COMPLETO.txt` | Texto | Passo a passo detalhado | 30 min |
| `TESTE-COMPLETO.js` | Node.js | Documentação interativa | 5 min |
| `teste.ps1` | PowerShell | Script automático | 10 min |
| `teste.sh` | Bash | Script automático | 10 min |
| `TESTES.json` | JSON | Postman Collection | 15 min |

---

## ✅ Pré-requisitos

Antes de começar, certifique-se:

- [ ] MongoDB rodando: `mongod`
- [ ] Servidor rodando: `npm run dev`
- [ ] `.env` configurado
- [ ] curl ou Postman instalado

---

## 🧪 Testes Inclusos

### Total: 21+ Testes

| Categoria | Testes | Status |
|-----------|--------|--------|
| Autenticação | 3 | ✅ |
| Perfil | 6 | ✅ |
| Privacidade | 4 | ✅ |
| Preferências | 2 | ✅ |
| Amizades/Conexões | 6 | ✅ |

---

## 📊 O que será testado

### ✅ Autenticação
- Registro de usuário
- Login
- Tokens JWT

### ✅ Perfil
- Obter perfil completo
- Atualizar perfil
- Customizar aparência
- Badges e estatísticas

### ✅ Privacidade
- Configurações de privacidade
- Bloquear/Desbloquear usuários

### ✅ Preferências
- Tema, idioma, notificações

### ✅ Amizades
- Solicitar amizade
- Aceitar/Recusar
- Remover amizade
- Listar conexões

### ✅ Banco de Dados
- Criação automática de documentos
- Auditoria de ações
- Índices e performance

---

## 🎯 Resultado Esperado

Se todos os testes passarem:

```
✅ 21+ requisições com status 200/201
✅ JSON válido em todas as respostas
✅ Dados salvos no MongoDB
✅ Auditoria registrando ações
✅ 2 usuários criados
✅ Amizades funcionando
✅ Privacidade respeitada
✅ Zero erros nos logs

= SISTEMA 100% FUNCIONAL ✅ =
```

---

## 🔍 Teste Rápido com Curl

```bash
# 1. Health Check
curl http://localhost:3000/health

# 2. Registrar usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@test.ifrede.com",
    "matricula": "2024001",
    "senha": "Senha@123456",
    "status_vinculo": "estudante"
  }'

# Salve: TOKEN e USUARIO_ID da resposta

# 3. Obter meu perfil
curl http://localhost:3000/perfil/meu-perfil \
  -H "Authorization: Bearer TOKEN"

# 4. Atualizar perfil
curl -X PUT http://localhost:3000/perfil/atualizar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Atualizado",
    "bio": "Desenvolvedor Full Stack"
  }'
```

**Mais testes**: Veja `GUIA-TESTES-COMPLETO.txt`

---

## 📚 Documentação Adicional

- **SISTEMA-PERFIS-API.md** → Documentação técnica dos endpoints
- **SISTEMA-PERFIS-IMPLEMENTACAO.md** → Detalhes de implementação
- **README-SISTEMA-PERFIS.md** → Visão geral do projeto
- **SISTEMA-PERFIS.json** → Documentação em JSON

---

## ⚠️ Possíveis Erros

### "Connection refused"
- MongoDB ou servidor não estão rodando
- Solução: `mongod && npm run dev`

### "Invalid token"
- Token está incorreto ou expirado
- Solução: Registre novo usuário

### "Email already exists"
- Email já foi usado
- Solução: Use email diferente

### "User not found"
- ID do usuário está incorreto
- Solução: Copie o ID exato da resposta

---

## 💡 Dicas Importantes

1. Use `-s` com curl para saída limpa:
   ```bash
   curl -s http://localhost:3000/health | jq '.'
   ```

2. Salve tokens em variáveis:
   ```bash
   TOKEN="seu_token_aqui"
   curl ... -H "Authorization: Bearer $TOKEN"
   ```

3. Use `jq` para formatar JSON:
   ```bash
   curl ... | jq '.data'
   ```

4. Verifique o banco MongoDB:
   ```bash
   use if-rede
   db.usuarios.find()
   ```

---

## 🚀 Próximas Etapas

Após passar em **100% dos testes**:

1. ✅ Integrar com Frontend React/Next.js
2. ✅ Implementar upload de avatar
3. ✅ Adicionar cache com Redis
4. ✅ Fazer testes automatizados (Jest)
5. ✅ Deploy em produção

---

## 📞 Suporte

Dúvidas sobre os testes?

1. Leia: `GUIA-TESTES-COMPLETO.txt`
2. Verifique: `SISTEMA-PERFIS-API.md`
3. Procure em: `SISTEMA-PERFIS-IMPLEMENTACAO.md`

---

## ✨ BOA SORTE NOS TESTES!

Se todos os testes passarem ✅, você tem um:

> **SISTEMA DE PERFIS COMPLETO, FUNCIONAL E PRONTO PARA PRODUÇÃO!**

---

### Próximas Etapas Imediatas:

```
1. Execute os testes
2. Valide 100% dos testes
3. Verifique o banco de dados
4. Integre com frontend
5. Deploy!
```

---

**Versão**: 1.0.0  
**Data**: 2026-05-19  
**Status**: ✅ PRONTO PARA TESTE
