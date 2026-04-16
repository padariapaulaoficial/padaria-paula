@echo off
chcp 65001 >nul
title Padaria Paula - Instalador Completo
color 0A

:: ============================================================
:: PADARIA PAULA - INSTALADOR AUTOMÁTICO
:: Este script cria a pasta, baixa e instala tudo automaticamente
:: ============================================================

cls
echo.
echo  ========================================================
echo        PADARIA E CONFEITARIA PAULA
echo        INSTALADOR AUTOMÁTICO
echo  ========================================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] Node.js não está instalado!
    echo.
    echo  Por favor, instale o Node.js primeiro:
    echo  https://nodejs.org/
    echo.
    echo  Baixe a versão LTS e instale.
    echo.
    pause
    start https://nodejs.org/
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  [OK] Node.js encontrado: %NODE_VER%
echo.

:: Instalar Bun se não existir
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo  [INSTALANDO] Bun...
    npm install -g bun
)
echo  [OK] Bun pronto
echo.

:: Criar pasta do projeto
set PASTA=%USERPROFILE%\Desktop\PadariaPaula
echo  [CRIANDO] Pasta do projeto em: %PASTA%
if not exist "%PASTA%" mkdir "%PASTA%"
cd /d "%PASTA%"
echo  [OK] Pasta criada
echo.

:: Criar package.json
echo  [CRIANDO] package.json...
(
echo {
echo   "name": "padaria-paula",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "next dev -p 3000",
echo     "build": "prisma generate && next build",
echo     "postinstall": "prisma generate",
echo     "db:push": "prisma db push",
echo     "db:seed": "bun run prisma/seed.ts"
echo   },
echo   "dependencies": {
echo     "@prisma/client": "6",
echo     "next": "^15.0.0",
echo     "react": "^19.0.0",
echo     "react-dom": "^19.0.0",
echo     "lucide-react": "^0.400.0",
echo     "zustand": "^5.0.0",
echo     "recharts": "^2.12.0",
echo     "html2canvas": "^1.4.1",
echo     "class-variance-authority": "^0.7.0",
echo     "clsx": "^2.1.0",
echo     "tailwind-merge": "^2.2.0",
echo     "@radix-ui/react-dialog": "^1.0.0",
echo     "@radix-ui/react-dropdown-menu": "^2.0.0",
echo     "@radix-ui/react-select": "^2.0.0",
echo     "@radix-ui/react-tabs": "^1.0.0",
echo     "@radix-ui/react-switch": "^1.0.0",
echo     "@radix-ui/react-alert-dialog": "^1.0.0",
echo     "@radix-ui/react-label": "^2.0.0",
echo     "@radix-ui/react-scroll-area": "^1.0.0",
echo     "@radix-ui/react-separator": "^1.0.0",
echo     "@radix-ui/react-slot": "^1.0.0",
echo     "@radix-ui/react-badge": "^1.0.0",
echo     "@radix-ui/react-checkbox": "^1.0.0",
echo     "@radix-ui/react-progress": "^1.0.0",
echo     "@radix-ui/react-tooltip": "^1.0.0",
echo     "date-fns": "^3.0.0"
echo   },
echo   "devDependencies": {
echo     "@tailwindcss/postcss": "^4",
echo     "@types/react": "^19",
echo     "@types/react-dom": "^19",
echo     "prisma": "6",
echo     "tailwindcss": "^4",
echo     "typescript": "^5"
echo   }
echo }
) > package.json
echo  [OK] package.json criado
echo.

:: Criar next.config.ts
echo  [CRIANDO] next.config.ts...
(
echo import type {{ NextConfig }} from 'next';
echo const nextConfig: NextConfig = {{}};
echo export default nextConfig;
) > next.config.ts
echo  [OK] next.config.ts criado
echo.

:: Criar tsconfig.json
echo  [CRIANDO] tsconfig.json...
(
echo {
echo   "compilerOptions": {
echo     "target": "ES2017",
echo     "lib": ["dom", "dom.iterable", "esnext"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [{"name": "next"}],
echo     "paths": {
echo       "@/*": ["./src/*"]
echo     }
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo }
) > tsconfig.json
echo  [OK] tsconfig.json criado
echo.

:: Criar estrutura de pastas
echo  [CRIANDO] Estrutura de pastas...
mkdir src\app 2>nul
mkdir src\app\api 2>nul
mkdir src\components\ui 2>nul
mkdir src\components\padaria 2>nul
mkdir src\lib 2>nul
mkdir src\store 2>nul
mkdir src\hooks 2>nul
mkdir prisma 2>nul
mkdir public 2>nul
echo  [OK] Pastas criadas
echo.

:: Criar schema do Prisma
echo  [CRIANDO] Banco de dados...
(
echo generator client {{
echo   provider = "prisma-client-js"
echo }}
echo.
echo datasource db {{
echo   provider = "sqlite"
echo   url      = "file:./padaria.db"
echo }}
echo.
echo model Configuracao {{
echo   id               String   @id @default(cuid())
echo   nomeLoja         String   @default("Padaria e Confeitaria Paula")
echo   endereco         String   @default("Rua das Flores, 123")
echo   telefone         String   @default("(11) 99999-9999")
echo   cnpj             String   @default("")
echo   logoUrl          String?
echo   senha            String   @default("2026")
echo   senhaAdmin       String?
echo   mensagemWhatsApp String?  @default("Ola {{nome}}!")
echo   createdAt        DateTime @default(now())
echo   updatedAt        DateTime @updatedAt
echo }}
echo.
echo model Cliente {{
echo   id         String       @id @default(cuid())
echo   nome       String
echo   telefone   String       @unique
echo   cpfCnpj    String?      @unique
echo   tipoPessoa String       @default("CPF")
echo   endereco   String?
echo   bairro     String?
echo   createdAt  DateTime     @default(now())
echo   updatedAt  DateTime     @updatedAt
echo   pedidos    Pedido[]
echo   orcamentos Orcamento[]
echo }}
echo.
echo model Produto {{
echo   id             String          @id @default(cuid())
echo   nome           String
echo   descricao      String?
echo   tipoVenda      String
echo   valorUnit      Float
echo   ativo          Boolean         @default(true)
echo   categoria      String?
echo   tipoProduto    String          @default("NORMAL")
echo   createdAt      DateTime        @default(now())
echo   updatedAt      DateTime        @updatedAt
echo   itensPedido    ItemPedido[]
echo   itensOrcamento ItemOrcamento[]
echo }}
echo.
echo model Pedido {{
echo   id              String       @id @default(cuid())
echo   numero          Int
echo   clienteId       String
echo   observacoes     String?
echo   total           Float
echo   totalPedida     Float        @default(0)
echo   status          String       @default("PENDENTE")
echo   impresso        Boolean      @default(false)
echo   tipoEntrega     String       @default("RETIRA")
echo   dataEntrega     String
echo   horarioEntrega  String?
echo   enderecoEntrega String?
echo   bairroEntrega   String?
echo   createdAt       DateTime     @default(now())
echo   updatedAt       DateTime     @updatedAt
echo   itens           ItemPedido[]
echo   cliente         Cliente      @relation(fields: [clienteId], references: [id])
echo }}
echo.
echo model ItemPedido {{
echo   id               String  @id @default(cuid())
echo   pedidoId         String
echo   produtoId        String
echo   quantidadePedida Float   @default(0)
echo   quantidade       Float
echo   valorUnit        Float
echo   subtotalPedida   Float   @default(0)
echo   subtotal         Float
echo   observacao       String?
echo   pedido           Pedido  @relation(fields: [pedidoId], references: [id], onDelete: Cascade)
echo   produto          Produto @relation(fields: [produtoId], references: [id])
echo }}
echo.
echo model Orcamento {{
echo   id              String          @id @default(cuid())
echo   numero          Int
echo   clienteId       String
echo   observacoes     String?
echo   total           Float
echo   status          String          @default("PENDENTE")
echo   tipoEntrega     String          @default("RETIRA")
echo   dataEntrega     String
echo   horarioEntrega  String?
echo   enderecoEntrega String?
echo   bairroEntrega   String?
echo   createdAt       DateTime        @default(now())
echo   updatedAt       DateTime        @updatedAt
echo   itens           ItemOrcamento[]
echo   cliente         Cliente         @relation(fields: [clienteId], references: [id])
echo }}
echo.
echo model ItemOrcamento {{
echo   id          String    @id @default(cuid())
echo   orcamentoId String
echo   produtoId   String
echo   quantidade  Float
echo   valorUnit   Float
echo   subtotal    Float
echo   observacao  String?
echo   orcamento   Orcamento @relation(fields: [orcamentoId], references: [id], onDelete: Cascade)
echo   produto     Produto   @relation(fields: [produtoId], references: [id])
echo }}
) > prisma\schema.prisma
echo  [OK] Schema criado
echo.

:: Criar seed
(
echo // Seed - Padaria Paula
echo import {{ PrismaClient }} from '@prisma/client';
echo const prisma = new PrismaClient();
echo async function main() {{
echo   const config = await prisma.configuracao.findFirst();
echo   if (!config) await prisma.configuracao.create({{ data: {{ nomeLoja: 'Padaria Paula' }} }});
echo.
echo   const produtos = [
echo     {{ nome: 'Torta de Limao', tipoVenda: 'KG', valorUnit: 45, categoria: 'Tortas' }},
echo     {{ nome: 'Torta de Chocolate', tipoVenda: 'KG', valorUnit: 50, categoria: 'Tortas' }},
echo     {{ nome: 'Brigadeiro', tipoVenda: 'CENTO', valorUnit: 25, categoria: 'Docinhos' }},
echo     {{ nome: 'Beijinho', tipoVenda: 'CENTO', valorUnit: 25, categoria: 'Docinhos' }},
echo     {{ nome: 'Coxinha', tipoVenda: 'CENTO', valorUnit: 45, categoria: 'Salgadinhos' }},
echo     {{ nome: 'Risole', tipoVenda: 'CENTO', valorUnit: 40, categoria: 'Salgadinhos' }},
echo     {{ nome: 'Pao Frances', tipoVenda: 'KG', valorUnit: 16, categoria: 'Paes' }},
echo     {{ nome: 'Bolo de Cenoura', tipoVenda: 'KG', valorUnit: 35, categoria: 'Bolos' }},
echo   ];
echo.
echo   for (const p of produtos) {{
echo     const existente = await prisma.produto.findFirst({{ where: {{ nome: p.nome }} }});
echo     if (!existente) await prisma.produto.create({{ data: p }});
echo   }}
echo   console.log('Seed concluido!');
echo }}
echo main().finally(() => prisma.$disconnect());
) > prisma\seed.ts
echo  [OK] Seed criado
echo.

:: Instalar dependências
echo  [INSTALANDO] Dependencias (pode demorar alguns minutos)...
call bun install
if %errorlevel% neq 0 (
    echo  Tentando com npm...
    call npm install
)
echo  [OK] Dependencias instaladas
echo.

:: Gerar Prisma
echo  [CONFIGURANDO] Banco de dados...
call bunx prisma generate
call bunx prisma db push
call bunx prisma db seed
echo  [OK] Banco configurado
echo.

:: Sucesso!
echo.
echo  ========================================================
echo.
echo  SUCESSO! Sistema instalado em:
echo  %PASTA%
echo.
echo  Para iniciar, digite:
echo    cd "%PASTA%"
echo    bun run dev
echo.
echo  Ou execute o arquivo INICIAR.bat que sera criado
echo.
echo  Acesse: http://localhost:3000
echo  PIN: 2026
echo  Admin: admin2026
echo.
echo  ========================================================
echo.

:: Criar arquivo INICIAR.bat
(
echo @echo off
echo cd /d "%PASTA%"
echo start http://localhost:3000
echo bun run dev
) > "%USERPROFILE%\Desktop\INICIAR-PADARIA.bat"
echo  Arquivo INICIAR-PADARIA.bat criado na Area de Trabalho!
echo.

pause
