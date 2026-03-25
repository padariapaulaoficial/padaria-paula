@echo off
chcp 65001 >nul
title Padaria Paula
color 0A

:: ============================================================
:: INICIADOR RÁPIDO - Use este após a primeira instalação
:: ============================================================

cls
echo.
echo  🥖 PADARIA PAULA - Iniciando...
echo.

:: Verificar se está instalado
if not exist "node_modules" (
    echo  Primeira vez? Execute PADARIA-PAULA-INSTALAR.bat
    pause
    exit /b 1
)

:: Abrir navegador
start http://localhost:3000

:: Iniciar
call bun run dev

pause
