@echo off
chcp 65001 >nul
title Padaria Paula - Instalador
color 0A

cls
echo.
echo  ========================================================
echo         PADARIA E CONFEITARIA PAULA
echo         INSTALADOR AUTOMATICO
echo  ========================================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Baixe e instale o Node.js:
    echo  https://nodejs.org/
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js: %NODE_VER%
echo.

:: Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERRO] npm nao encontrado!
    pause
    exit /b 1
)
echo  [OK] npm disponivel
echo.

:: Instalar dependencias
echo  [INSTALANDO] Dependencias do projeto...
echo  Isso pode demorar alguns minutos...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] Falha ao instalar dependencias!
    pause
    exit /b 1
)
echo.
echo  [OK] Dependencias instaladas!
echo.

:: Gerar Prisma
echo  [CONFIGURANDO] Banco de dados...
call npx prisma generate
call npx prisma db push
echo  [OK] Banco configurado!
echo.

:: Criar arquivo .env
echo  [CRIANDO] Arquivo de configuracao...
(
echo DATABASE_URL="file:./prisma/padaria.db"
echo PIN_FUNCIONARIOS="2026"
echo ADMIN_PASSWORD="admin2026"
) > .env
echo  [OK] Configuracao criada!
echo.

:: Rodar seed
echo  [POVULANDO] Produtos iniciais...
call npx prisma db seed
echo  [OK] Produtos cadastrados!
echo.

:: Criar atalho na area de trabalho
(
echo @echo off
echo cd /d "%CD%"
echo start http://localhost:3000
echo npm run dev
) > "%USERPROFILE%\Desktop\INICIAR-PADARIA.bat"
echo  [OK] Atalho criado na Area de Trabalho!
echo.

:: Pronto!
echo.
echo  ========================================================
echo.
echo  >>> SUCESSO! SISTEMA INSTALADO! <<<
echo.
echo  Para iniciar:
echo    1. Clique duas vezes em INICIAR-PADARIA.bat
echo       que foi criado na sua Area de Trabalho
echo.
echo  OU
echo.
echo    1. Abra esta pasta no CMD
echo    2. Digite: npm run dev
echo    3. Acesse: http://localhost:3000
echo.
echo  ==========================================
echo  PIN Funcionarios: 2026
echo  Senha Admin: admin2026
echo  ==========================================
echo.
echo  ========================================================
echo.
pause
