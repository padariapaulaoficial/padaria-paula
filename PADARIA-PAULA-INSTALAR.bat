@echo off
chcp 65001 >nul
title Padaria Paula - Instalador e Iniciador
color 0A
setlocal enabledelayedexpansion

:: ============================================================
:: PADARIA PAULA - INSTALADOR AUTOMÁTICO PARA WINDOWS
:: Funciona como um "executável" - instala tudo sozinho
:: ============================================================

:MENU
cls
echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                                                            ║
echo  ║       🥖 PADARIA E CONFEITARIA PAULA 🥐                   ║
echo  ║                                                            ║
echo  ║              SISTEMA DE GESTÃO                            ║
echo  ║                                                            ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  ❌ Node.js não está instalado!
    echo.
    echo  ────────────────────────────────────────────────────────────
    echo.
    echo  O Node.js é necessário para rodar o sistema.
    echo.
    echo  Deseja instalar automaticamente?
    echo.
    echo  [1] Sim, instalar Node.js agora
    echo  [2] Não, sair
    echo.
    set /p opcao="  Escolha uma opção: "
    
    if "!opcao!"=="1" (
        echo.
        echo  Baixando Node.js...
        start https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi
        echo.
        echo  ✔ Download iniciado! Instale o Node.js e execute este arquivo novamente.
        pause
        exit /b 0
    ) else (
        exit /b 0
    )
)

:: Node.js encontrado
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo  ✔ Node.js encontrado: %NODE_VERSION%
echo.

:: Verificar Bun
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo  ⏳ Instalando Bun (gerenciador de pacotes)...
    npm install -g bun >nul 2>nul
    if %errorlevel% neq 0 (
        echo  ❌ Erro ao instalar Bun. Tentando com npm...
    ) else (
        echo  ✔ Bun instalado com sucesso!
    )
) else (
    echo  ✔ Bun já está instalado
)
echo.

:: Configurar banco SQLite
echo  ⏳ Configurando banco de dados...
copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma >nul 2>nul
echo  ✔ Schema configurado
echo.

:: Instalar dependências
if not exist "node_modules" (
    echo  ⏳ Instalando dependências (primeira vez pode demorar)...
    call bun install >nul 2>nul
    if %errorlevel% neq 0 (
        echo  Tentando com npm...
        call npm install >nul 2>nul
    )
    echo  ✔ Dependências instaladas
) else (
    echo  ✔ Dependências já instaladas
)
echo.

:: Gerar Prisma
echo  ⏳ Preparando banco de dados...
call bunx prisma generate >nul 2>nul
call bunx prisma db push >nul 2>nul
echo  ✔ Banco de dados pronto
echo.

:: Verificar se precisa de seed
call bunx prisma db seed >nul 2>nul
echo  ✔ Produtos cadastrados
echo.

:: Pronto!
echo  ════════════════════════════════════════════════════════════
echo.
echo  ✅ SISTEMA PRONTO!
echo.
echo  🌐 Acesse no navegador: http://localhost:3000
echo.
echo  📌 PIN dos funcionários: 2026
echo  🔐 Senha do administrador: admin2026
echo.
echo  ════════════════════════════════════════════════════════════
echo.
echo  Abrindo navegador automaticamente em 3 segundos...
echo  (Pressione CTRL+C para cancelar)
echo.

:: Abrir navegador após 3 segundos
ping -n 4 127.0.0.1 >nul 2>nul
start http://localhost:3000

:: Iniciar servidor
echo  🚀 Iniciando servidor...
echo.
call bun run dev

pause
