# Padaria Paula - Script de Instalação (PowerShell)
# Execute este script para instalar e iniciar o sistema

param(
    [switch]$Reset
)

# Configurar encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Cores
function Write-Header {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Green
    Write-Host "  ║       🥖 PADARIA E CONFEITARIA PAULA 🥐                   ║" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Green
    Write-Host "  ║              Sistema de Gestão v1.0                       ║" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Green
    Write-Host "  ╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
}

function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }

# Iniciar
Write-Header

# Verificar Node.js
Write-Info "Verificando Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js não encontrado!"
    Write-Host ""
    Write-Host "Por favor, instale o Node.js:" -ForegroundColor Yellow
    Write-Host "https://nodejs.org/" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}
$nodeVersion = node -v
Write-Success "Node.js instalado: $nodeVersion"

# Verificar Bun
Write-Info "Verificando Bun..."
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Warning "Bun não encontrado. Instalando..."
    npm install -g bun
    if (-not $?) {
        Write-Error "Falha ao instalar Bun"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}
$bunVersion = bun -v
Write-Success "Bun instalado: v$bunVersion"

# Copiar schema SQLite
Write-Info "Configurando banco de dados SQLite..."
Copy-Item -Path "prisma/schema.sqlite.prisma" -Destination "prisma/schema.prisma" -Force
Write-Success "Schema SQLite configurado"

# Instalar dependências
Write-Info "Instalando dependências..."
bun install
if (-not $?) {
    Write-Error "Falha ao instalar dependências"
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Success "Dependências instaladas"

# Gerar Prisma
Write-Info "Gerando cliente do banco de dados..."
bunx prisma generate
if (-not $?) {
    Write-Error "Falha ao gerar Prisma"
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Success "Cliente Prisma gerado"

# Criar/popular banco
Write-Info "Criando banco de dados..."
if ($Reset) {
    bunx prisma db push --force-reset
} else {
    bunx prisma db push
}
if (-not $?) {
    Write-Error "Falha ao criar banco de dados"
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Success "Banco de dados criado"

# Seed
Write-Info "Populando produtos iniciais..."
bun run db:seed
if (-not $?) {
    Write-Warning "Seed já executado anteriormente"
} else {
    Write-Success "Produtos cadastrados"
}

# Pronto!
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  ✅ SISTEMA PRONTO!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 Acesse no navegador: " -NoNewline
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📌 PIN dos funcionários: " -NoNewline
Write-Host "2026" -ForegroundColor Yellow
Write-Host "  🔐 Senha do administrador: " -NoNewline
Write-Host "admin2026" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Pressione CTRL+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor
bun run dev
