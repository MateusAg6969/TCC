# ============================================================================
# SCRIPT DE TESTES - SISTEMA DE PERFIS (PowerShell)
# ============================================================================
#
# Para Windows - Execute no PowerShell
#
# Como usar:
# 1. Abra PowerShell como Administrador
# 2. Copie e execute cada bloco abaixo
# 3. Salve os tokens em variáveis para reutilizar

$API = "http://localhost:3000"

Write-Host "`n╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║             TESTE COMPLETO - SISTEMA DE PERFIS (PowerShell)             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# TESTE 1: Health Check
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 1: Health Check" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado1 = Invoke-WebRequest -Uri "$API/health" -Method Get
Write-Host "Status: $($resultado1.StatusCode)" -ForegroundColor Yellow
$resultado1.Content | ConvertFrom-Json | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 2: Registrar Primeiro Usuário
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 2: Registrar Primeiro Usuário" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body2 = @{
    nome = "João Silva"
    email = "joao@test.ifrede.com"
    matricula = "2024001"
    senha = "Senha@123456"
    status_vinculo = "estudante"
} | ConvertTo-Json

$resultado2 = Invoke-WebRequest -Uri "$API/auth/register" -Method Post -Body $body2 -ContentType "application/json"
$data2 = $resultado2.Content | ConvertFrom-Json
Write-Host "Status: $($resultado2.StatusCode)" -ForegroundColor Yellow
$data2 | ConvertTo-Json | Write-Host

# Extrair token e ID
$TOKEN1 = $data2.data.tokens.accessToken
$USUARIO1 = $data2.data.usuario._id

Write-Host "`n✅ Token extraído: $($TOKEN1.Substring(0, 30))..." -ForegroundColor Yellow
Write-Host "✅ Usuário ID: $USUARIO1" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# TESTE 3: Obter Meu Perfil
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 3: Obter Meu Perfil Completo" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado3 = Invoke-WebRequest -Uri "$API/perfil/meu-perfil" -Method Get -Headers @{Authorization = "Bearer $TOKEN1"}
$data3 = $resultado3.Content | ConvertFrom-Json
Write-Host "Status: $($resultado3.StatusCode)" -ForegroundColor Yellow
$data3 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 4: Atualizar Perfil
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 4: Atualizar Perfil" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body4 = @{
    nome = "João Silva Atualizado"
    bio = "Desenvolvedor Full Stack apaixonado por tecnologia"
} | ConvertTo-Json

$resultado4 = Invoke-WebRequest -Uri "$API/perfil/atualizar" -Method Put -Body $body4 -ContentType "application/json" -Headers @{Authorization = "Bearer $TOKEN1"}
$data4 = $resultado4.Content | ConvertFrom-Json
Write-Host "Status: $($resultado4.StatusCode)" -ForegroundColor Yellow
$data4 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 5: Customizar Aparência
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 5: Customizar Aparência" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body5 = @{
    cor_fundo = "#F3F4F6"
    cor_botoes = "#7C3AED"
    tema = "dark"
} | ConvertTo-Json

$resultado5 = Invoke-WebRequest -Uri "$API/perfil/atualizar-customizacao" -Method Put -Body $body5 -ContentType "application/json" -Headers @{Authorization = "Bearer $TOKEN1"}
$data5 = $resultado5.Content | ConvertFrom-Json
Write-Host "Status: $($resultado5.StatusCode)" -ForegroundColor Yellow
$data5 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 6: Obter Privacidade
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 6: Obter Privacidade" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado6 = Invoke-WebRequest -Uri "$API/privacidade/minha-privacidade" -Method Get -Headers @{Authorization = "Bearer $TOKEN1"}
$data6 = $resultado6.Content | ConvertFrom-Json
Write-Host "Status: $($resultado6.StatusCode)" -ForegroundColor Yellow
$data6 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 7: Atualizar Privacidade
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 7: Atualizar Privacidade" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body7 = @{
    perfil_publico = $true
    quem_pode_mensagear = "amigos"
    mostrar_email_publicamente = $false
} | ConvertTo-Json

$resultado7 = Invoke-WebRequest -Uri "$API/privacidade/atualizar" -Method Put -Body $body7 -ContentType "application/json" -Headers @{Authorization = "Bearer $TOKEN1"}
$data7 = $resultado7.Content | ConvertFrom-Json
Write-Host "Status: $($resultado7.StatusCode)" -ForegroundColor Yellow
$data7 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 8: Obter Preferências
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 8: Obter Preferências" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado8 = Invoke-WebRequest -Uri "$API/preferencias/minhas-preferencias" -Method Get -Headers @{Authorization = "Bearer $TOKEN1"}
$data8 = $resultado8.Content | ConvertFrom-Json
Write-Host "Status: $($resultado8.StatusCode)" -ForegroundColor Yellow
$data8 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 9: Atualizar Preferências
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 9: Atualizar Preferências" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body9 = @{
    tema_preferido = "dark"
    idioma = "pt-BR"
    tamanho_fonte = 1.2
} | ConvertTo-Json

$resultado9 = Invoke-WebRequest -Uri "$API/preferencias/atualizar" -Method Put -Body $body9 -ContentType "application/json" -Headers @{Authorization = "Bearer $TOKEN1"}
$data9 = $resultado9.Content | ConvertFrom-Json
Write-Host "Status: $($resultado9.StatusCode)" -ForegroundColor Yellow
$data9 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 10: Registrar Segundo Usuário
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 10: Registrar Segundo Usuário" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$body10 = @{
    nome = "Maria Santos"
    email = "maria@test.ifrede.com"
    matricula = "2024002"
    senha = "Senha@654321"
    status_vinculo = "estudante"
} | ConvertTo-Json

$resultado10 = Invoke-WebRequest -Uri "$API/auth/register" -Method Post -Body $body10 -ContentType "application/json"
$data10 = $resultado10.Content | ConvertFrom-Json
Write-Host "Status: $($resultado10.StatusCode)" -ForegroundColor Yellow
$data10 | ConvertTo-Json | Write-Host

$USUARIO2 = $data10.data.usuario._id
$TOKEN2 = $data10.data.tokens.accessToken

Write-Host "`n✅ Segundo usuário ID: $USUARIO2" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# TESTE 11: Solicitar Amizade
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 11: Solicitar Amizade" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado11 = Invoke-WebRequest -Uri "$API/conexoes/$USUARIO2/solicitar-amizade" -Method Post -Headers @{Authorization = "Bearer $TOKEN1"}
$data11 = $resultado11.Content | ConvertFrom-Json
Write-Host "Status: $($resultado11.StatusCode)" -ForegroundColor Yellow
$data11 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 12: Listar Minhas Conexões
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 12: Listar Minhas Conexões" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado12 = Invoke-WebRequest -Uri "$API/conexoes/minhas-conexoes" -Method Get -Headers @{Authorization = "Bearer $TOKEN1"}
$data12 = $resultado12.Content | ConvertFrom-Json
Write-Host "Status: $($resultado12.StatusCode)" -ForegroundColor Yellow
$data12 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# TESTE 13: Ver Perfil Público
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ TESTE 13: Ver Perfil Público" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$resultado13 = Invoke-WebRequest -Uri "$API/perfil/$USUARIO1" -Method Get
$data13 = $resultado13.Content | ConvertFrom-Json
Write-Host "Status: $($resultado13.StatusCode)" -ForegroundColor Yellow
$data13 | ConvertTo-Json | Write-Host
Write-Host ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host "`n╔════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                          TESTES CONCLUÍDOS                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumo de Tokens Extraídos:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "JOÃO:" -ForegroundColor Cyan
Write-Host "  ID: $USUARIO1" -ForegroundColor Yellow
Write-Host "  Token: $($TOKEN1.Substring(0, 30))..." -ForegroundColor Yellow
Write-Host ""
Write-Host "MARIA:" -ForegroundColor Cyan
Write-Host "  ID: $USUARIO2" -ForegroundColor Yellow
Write-Host "  Token: $($TOKEN2.Substring(0, 30))..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Próximos Passos:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "1. Verifique todos os status HTTP 200/201" -ForegroundColor Green
Write-Host "2. Verifique a estrutura das respostas JSON" -ForegroundColor Green
Write-Host "3. Verifique no MongoDB se os dados foram salvos" -ForegroundColor Green
Write-Host "4. Faça testes adicionais conforme necessário" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Sistema de Perfis testado!" -ForegroundColor Green
Write-Host ""
