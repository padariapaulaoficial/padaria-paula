// API para migrar o banco de dados - Adiciona colunas faltantes
// Padaria Paula

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const results: string[] = [];

  try {
    // Lista de colunas que podem estar faltando na tabela Configuracao
    const columnsToAdd = [
      { name: 'mensagemWhatsApp', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemWhatsApp" TEXT DEFAULT 'Olá {nome}! Seu pedido está pronto para entrega.'` },
      { name: 'mensagemOrcamento', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemOrcamento" TEXT DEFAULT 'Olá {nome}! Segue seu orçamento.'` },
      { name: 'mensagemProntoRetirada', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemProntoRetirada" TEXT DEFAULT 'Olá {nome}! Seu pedido está PRONTO e esperando por você! Pode vir buscar quando quiser.'` },
      { name: 'mensagemProntoEntrega', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemProntoEntrega" TEXT DEFAULT 'Olá {nome}! Seu pedido está PRONTO e já está a caminho!'` },
      { name: 'mensagemAprovacao', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemAprovacao" TEXT DEFAULT 'Olá {nome}! Seu orçamento foi aprovado! Estamos preparando seu pedido.'` },
      { name: 'mensagemRevisao', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "mensagemRevisao" TEXT DEFAULT 'Olá {nome}! Por favor, revise seu pedido e confirme se está tudo correto.'` },
      { name: 'diasAlertaProducao', sql: `ALTER TABLE "Configuracao" ADD COLUMN IF NOT EXISTS "diasAlertaProducao" INTEGER DEFAULT 3` },
    ];

    // Adicionar colunas faltantes
    for (const col of columnsToAdd) {
      try {
        await db.$executeRawUnsafe(col.sql);
        results.push(`Coluna ${col.name} verificada/adicionada`);
      } catch (err: any) {
        results.push(`Coluna ${col.name}: ${err.message}`);
      }
    }

    // Verificar colunas faltantes na tabela Pedido
    const pedidoColumns = [
      { name: 'valorEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "valorEntrada" DOUBLE PRECISION DEFAULT 0` },
      { name: 'formaPagamentoEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "formaPagamentoEntrada" TEXT` },
      { name: 'dataEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "dataEntrada" TIMESTAMP(3)` },
      { name: 'alertaProducaoEnviado', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "alertaProducaoEnviado" BOOLEAN DEFAULT false` },
      { name: 'valorTeleEntrega', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "valorTeleEntrega" DOUBLE PRECISION` },
    ];

    for (const col of pedidoColumns) {
      try {
        await db.$executeRawUnsafe(col.sql);
        results.push(`Coluna Pedido.${col.name} verificada/adicionada`);
      } catch (err: any) {
        results.push(`Coluna Pedido.${col.name}: ${err.message}`);
      }
    }

    // Verificar colunas faltantes na tabela Produto
    const produtoColumns = [
      { name: 'tipoProduto', sql: `ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "tipoProduto" TEXT DEFAULT 'NORMAL'` },
      { name: 'tamanhos', sql: `ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "tamanhos" TEXT` },
      { name: 'precosTamanhos', sql: `ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "precosTamanhos" TEXT` },
    ];

    for (const col of produtoColumns) {
      try {
        await db.$executeRawUnsafe(col.sql);
        results.push(`Coluna Produto.${col.name} verificada/adicionada`);
      } catch (err: any) {
        results.push(`Coluna Produto.${col.name}: ${err.message}`);
      }
    }

    // Verificar coluna cpfCnpj na tabela Cliente
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "cpfCnpj" TEXT UNIQUE`);
      results.push('Coluna Cliente.cpfCnpj verificada/adicionada');
    } catch (err: any) {
      results.push(`Coluna Cliente.cpfCnpj: ${err.message}`);
    }

    // Verificar coluna bairro na tabela Cliente
    try {
      await db.$executeRawUnsafe(`ALTER TABLE "Cliente" ADD COLUMN IF NOT EXISTS "bairro" TEXT`);
      results.push('Coluna Cliente.bairro verificada/adicionada');
    } catch (err: any) {
      results.push(`Coluna Cliente.bairro: ${err.message}`);
    }

    // Agora garantir que a configuração existe com senha 2026
    try {
      const configExists = await db.$queryRaw<any[]>`SELECT id FROM "Configuracao" LIMIT 1`;

      if (!configExists || configExists.length === 0) {
        await db.$executeRawUnsafe(`
          INSERT INTO "Configuracao" (id, "nomeLoja", endereco, telefone, senha, "senhaAdmin", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'Padaria e Confeitaria Paula', 'Rua das Flores, 123', '(11) 99999-9999', '2026', '2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        results.push('Configuração criada com senha 2026');
      } else {
        await db.$executeRawUnsafe(`
          UPDATE "Configuracao" SET senha = '2026', "senhaAdmin" = '2026', "updatedAt" = CURRENT_TIMESTAMP
        `);
        results.push('Senha atualizada para 2026');
      }
    } catch (err: any) {
      results.push(`Erro ao atualizar configuração: ${err.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Migração concluída!',
      results,
      proximoPasso: 'Acesse /api/diagnostico para verificar se está tudo correto'
    });

  } catch (error: any) {
    console.error('Erro na migração:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      results
    }, { status: 500 });
  }
}
