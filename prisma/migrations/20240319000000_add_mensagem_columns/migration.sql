-- Add mensagem columns to Configuracao table
-- Migration for Supabase/PostgreSQL

-- Add senhaAdmin column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'senhaAdmin') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "senhaAdmin" TEXT;
    END IF;
END $$;

-- Add mensagemOrcamento column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemOrcamento') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemOrcamento" TEXT DEFAULT 'Olá {nome}! Segue seu orçamento.';
    END IF;
END $$;

-- Add mensagemProntoRetirada column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemProntoRetirada') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemProntoRetirada" TEXT DEFAULT 'Olá {nome}! Seu pedido está PRONTO e esperando por você! Pode vir buscar quando quiser.';
    END IF;
END $$;

-- Add mensagemProntoEntrega column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Configuracao' AND column_name = 'mensagemProntoEntrega') THEN
        ALTER TABLE "Configuracao" ADD COLUMN "mensagemProntoEntrega" TEXT DEFAULT 'Olá {nome}! Seu pedido está PRONTO e já está a caminho!';
    END IF;
END $$;

-- Update senha and senhaAdmin to 2026
UPDATE "Configuracao" SET 
    senha = '2026',
    "senhaAdmin" = '2026'
WHERE senha IS NULL OR senha = '' OR "senhaAdmin" IS NULL;
