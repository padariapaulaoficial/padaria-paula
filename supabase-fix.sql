-- SCRIPT SQL PARA SUPABASE - Padaria Paula
-- Execute este script no SQL Editor do Supabase
-- Corrige a senha e adiciona colunas faltantes

-- 1. Adicionar colunas faltantes na tabela Configuracao (se não existirem)
DO $$
BEGIN
    -- Adicionar senhaAdmin se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'senhaAdmin') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "senhaAdmin" TEXT;
    END IF;
    
    -- Adicionar mensagemOrcamento se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemOrcamento') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemOrcamento" TEXT;
    END IF;
    
    -- Adicionar mensagemProntoRetirada se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemProntoRetirada') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemProntoRetirada" TEXT;
    END IF;
    
    -- Adicionar mensagemProntoEntrega se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemProntoEntrega') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemProntoEntrega" TEXT;
    END IF;
END $$;

-- 2. Atualizar ou criar configuração com senha 2026
INSERT INTO "Configuracao" (id, "nomeLoja", endereco, telefone, senha, "senhaAdmin", "createdAt", "updatedAt")
VALUES (
    'config-padaria-paula',
    'Padaria e Confeitaria Paula',
    'Rua das Flores, 123',
    '(11) 99999-9999',
    '2026',
    '2026',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    senha = '2026',
    "senhaAdmin" = '2026',
    "updatedAt" = NOW();

-- 3. Se já existe configuração com outro ID, atualizar a senha
UPDATE "Configuracao" SET 
    senha = '2026',
    "senhaAdmin" = '2026',
    "updatedAt" = NOW()
WHERE senha != '2026' OR "senhaAdmin" IS NULL OR "senhaAdmin" != '2026';

-- 4. Verificar resultado
SELECT id, "nomeLoja", senha, "senhaAdmin" FROM "Configuracao";
