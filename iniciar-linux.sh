#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear

echo ""
echo "  ╔════════════════════════════════════════════════════════════╗"
echo "  ║                                                            ║"
echo "  ║       🥖 PADARIA E CONFEITARIA PAULA 🥐                   ║"
echo "  ║                                                            ║"
echo "  ║              Sistema de Gestão v1.0                       ║"
echo "  ║                                                            ║"
echo "  ╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[ERRO] Node.js não encontrado!${NC}"
    echo ""
    echo "Por favor, instale o Node.js primeiro:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

# Verificar Bun
if ! command -v bun &> /dev/null; then
    echo -e "${BLUE}[INFO] Bun não encontrado, instalando...${NC}"
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
fi

echo -e "${GREEN}[1/4] Configurando banco de dados SQLite...${NC}"
cp -f prisma/schema.sqlite.prisma prisma/schema.prisma

echo -e "${GREEN}[2/4] Instalando dependências...${NC}"
bun install

echo -e "${GREEN}[3/4] Gerando banco de dados...${NC}"
bunx prisma generate
bunx prisma db push --force-reset

echo -e "${GREEN}[4/4] Populando produtos iniciais...${NC}"
bun run db:seed

echo ""
echo "  ════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}✅ SISTEMA PRONTO!${NC}"
echo ""
echo -e "  ${BLUE}🌐 Acesse no navegador: http://localhost:3000${NC}"
echo ""
echo "  📌 PIN dos funcionários: 2026"
echo "  🔐 Senha do administrador: admin2026"
echo ""
echo "  ════════════════════════════════════════════════════════════"
echo ""
echo "  Pressione CTRL+C para parar o servidor"
echo ""

# Iniciar o servidor
bun run dev
