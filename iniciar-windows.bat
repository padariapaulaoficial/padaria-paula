@echo off
chcp 65001 >nul
title Padaria Paula - Sistema de Gestao
color 0A

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                                                            ║
echo  ║       🥖 PADARIA E CONFEITARIA PAULA 🥐                   ║
echo  ║                                                            ║
echo  ║              Sistema de Gestao v1.0                       ║
echo  ║                                                            ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

:: Verificar se o Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js primeiro:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Verificar se o Bun está instalado
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Bun nao encontrado, instalando...
    npm install -g bun
)

echo [1/4] Configurando banco de dados SQLite...
copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma >nul 2>nul

echo [2/4] Instalando dependencias...
call bun install

echo [3/4] Gerando banco de dados...
call bunx prisma generate
call bunx prisma db push --force-reset

echo [4/4] Populando produtos iniciais...
call bun run db:seed

echo.
echo  ════════════════════════════════════════════════════════════
echo.
echo  ✅ SISTEMA PRONTO!
echo.
echo  🌐 Acesse no navegador: http://localhost:3000
echo.
echo  📌 PIN dos funcionarios: 2026
echo  🔐 Senha do administrador: admin2026
echo.
echo  ════════════════════════════════════════════════════════════
echo.
echo  Pressione CTRL+C para parar o servidor
echo.

:: Iniciar o servidor
call bun run dev

pause
