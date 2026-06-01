#!/bin/bash

# ============================================================================
# SCRIPT DE TESTES - SISTEMA DE PERFIS
# ============================================================================
# 
# Copie e execute cada seção abaixo para testar o sistema
# 
# PRÉ-REQUISITOS:
# 1. MongoDB rodando
# 2. Servidor Express rodando em http://localhost:3000
# 3. Ter curl instalado

API="http://localhost:3000"

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║             TESTE COMPLETO - SISTEMA DE PERFIS                         ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# TESTE 1: Health Check
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/health"
echo ""

curl -s "$API/health" | jq '.' 2>/dev/null || curl -s "$API/health"
echo -e "\n"

# ============================================================================
# TESTE 2: Registrar Primeiro Usuário
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 2: Registrar Primeiro Usuário"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: POST $API/auth/register"
echo ""

RESPONSE=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@test.ifrede.com",
    "matricula": "2024001",
    "senha": "Senha@123456",
    "status_vinculo": "estudante"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Extrair token e ID
TOKEN1=$(echo "$RESPONSE" | jq -r '.data.tokens.accessToken' 2>/dev/null)
USUARIO1=$(echo "$RESPONSE" | jq -r '.data.usuario._id' 2>/dev/null)

if [ -z "$TOKEN1" ] || [ "$TOKEN1" = "null" ]; then
  echo "❌ ERRO: Não foi possível extrair o token!"
  echo "⚠️  SALVE O TOKEN MANUALMENTE!"
  exit 1
fi

echo "✅ Token extraído: ${TOKEN1:0:20}..."
echo "✅ Usuário ID: $USUARIO1"
echo ""

# ============================================================================
# TESTE 3: Obter Meu Perfil
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 3: Obter Meu Perfil Completo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/perfil/meu-perfil"
echo ""

curl -s "$API/perfil/meu-perfil" \
  -H "Authorization: Bearer $TOKEN1" | jq '.' 2>/dev/null || \
curl -s "$API/perfil/meu-perfil" \
  -H "Authorization: Bearer $TOKEN1"

echo ""

# ============================================================================
# TESTE 4: Atualizar Perfil
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 4: Atualizar Perfil"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: PUT $API/perfil/atualizar"
echo ""

curl -s -X PUT "$API/perfil/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Atualizado",
    "bio": "Desenvolvedor Full Stack apaixonado por tecnologia"
  }' | jq '.' 2>/dev/null || \
curl -s -X PUT "$API/perfil/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Atualizado",
    "bio": "Desenvolvedor Full Stack apaixonado por tecnologia"
  }'

echo ""

# ============================================================================
# TESTE 5: Customizar Aparência
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 5: Customizar Aparência"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: PUT $API/perfil/atualizar-customizacao"
echo ""

curl -s -X PUT "$API/perfil/atualizar-customizacao" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "cor_fundo": "#F3F4F6",
    "cor_botoes": "#7C3AED",
    "tema": "dark"
  }' | jq '.' 2>/dev/null || \
curl -s -X PUT "$API/perfil/atualizar-customizacao" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "cor_fundo": "#F3F4F6",
    "cor_botoes": "#7C3AED",
    "tema": "dark"
  }'

echo ""

# ============================================================================
# TESTE 6: Obter Privacidade
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 6: Obter Privacidade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/privacidade/minha-privacidade"
echo ""

curl -s "$API/privacidade/minha-privacidade" \
  -H "Authorization: Bearer $TOKEN1" | jq '.' 2>/dev/null || \
curl -s "$API/privacidade/minha-privacidade" \
  -H "Authorization: Bearer $TOKEN1"

echo ""

# ============================================================================
# TESTE 7: Atualizar Privacidade
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 7: Atualizar Privacidade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: PUT $API/privacidade/atualizar"
echo ""

curl -s -X PUT "$API/privacidade/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "perfil_publico": true,
    "quem_pode_mensagear": "amigos",
    "mostrar_email_publicamente": false
  }' | jq '.' 2>/dev/null || \
curl -s -X PUT "$API/privacidade/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "perfil_publico": true,
    "quem_pode_mensagear": "amigos",
    "mostrar_email_publicamente": false
  }'

echo ""

# ============================================================================
# TESTE 8: Obter Preferências
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 8: Obter Preferências"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/preferencias/minhas-preferencias"
echo ""

curl -s "$API/preferencias/minhas-preferencias" \
  -H "Authorization: Bearer $TOKEN1" | jq '.' 2>/dev/null || \
curl -s "$API/preferencias/minhas-preferencias" \
  -H "Authorization: Bearer $TOKEN1"

echo ""

# ============================================================================
# TESTE 9: Atualizar Preferências
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 9: Atualizar Preferências"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: PUT $API/preferencias/atualizar"
echo ""

curl -s -X PUT "$API/preferencias/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "tema_preferido": "dark",
    "idioma": "pt-BR",
    "tamanho_fonte": 1.2
  }' | jq '.' 2>/dev/null || \
curl -s -X PUT "$API/preferencias/atualizar" \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "tema_preferido": "dark",
    "idioma": "pt-BR",
    "tamanho_fonte": 1.2
  }'

echo ""

# ============================================================================
# TESTE 10: Registrar Segundo Usuário
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 10: Registrar Segundo Usuário"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: POST $API/auth/register"
echo ""

RESPONSE2=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "email": "maria@test.ifrede.com",
    "matricula": "2024002",
    "senha": "Senha@654321",
    "status_vinculo": "estudante"
  }')

echo "$RESPONSE2" | jq '.' 2>/dev/null || echo "$RESPONSE2"
echo ""

USUARIO2=$(echo "$RESPONSE2" | jq -r '.data.usuario._id' 2>/dev/null)
TOKEN2=$(echo "$RESPONSE2" | jq -r '.data.tokens.accessToken' 2>/dev/null)

echo "✅ Segundo usuário ID: $USUARIO2"
echo ""

# ============================================================================
# TESTE 11: Solicitar Amizade
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 11: Solicitar Amizade"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: POST $API/conexoes/$USUARIO2/solicitar-amizade"
echo ""

curl -s -X POST "$API/conexoes/$USUARIO2/solicitar-amizade" \
  -H "Authorization: Bearer $TOKEN1" | jq '.' 2>/dev/null || \
curl -s -X POST "$API/conexoes/$USUARIO2/solicitar-amizade" \
  -H "Authorization: Bearer $TOKEN1"

echo ""

# ============================================================================
# TESTE 12: Listar Minhas Conexões
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 12: Listar Minhas Conexões"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/conexoes/minhas-conexoes"
echo ""

curl -s "$API/conexoes/minhas-conexoes" \
  -H "Authorization: Bearer $TOKEN1" | jq '.' 2>/dev/null || \
curl -s "$API/conexoes/minhas-conexoes" \
  -H "Authorization: Bearer $TOKEN1"

echo ""

# ============================================================================
# TESTE 13: Ver Perfil Público
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TESTE 13: Ver Perfil Público"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Comando: GET $API/perfil/$USUARIO1"
echo ""

curl -s "$API/perfil/$USUARIO1" | jq '.' 2>/dev/null || \
curl -s "$API/perfil/$USUARIO1"

echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                          TESTES CONCLUÍDOS                             ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Resumo de Tokens Extraídos:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "JOÃO:"
echo "  ID: $USUARIO1"
echo "  Token: ${TOKEN1:0:30}..."
echo ""
echo "MARIA:"
echo "  ID: $USUARIO2"
echo "  Token: ${TOKEN2:0:30}..."
echo ""
echo "📋 Próximos Passos:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verifique todos os status HTTP 200/201"
echo "2. Verifique a estrutura das respostas JSON"
echo "3. Verifique no MongoDB se os dados foram salvos"
echo "4. Faça testes adicionais conforme necessário"
echo ""
echo "✅ Sistema de Perfis testado!"
echo ""
