// API para criar tabelas no banco de dados
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Criar tabela Configuracao
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Configuracao" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "nomeLoja" TEXT NOT NULL DEFAULT 'Padaria e Confeitaria Paula',
        "endereco" TEXT NOT NULL DEFAULT 'Rua das Flores, 123',
        "telefone" TEXT NOT NULL DEFAULT '(11) 99999-9999',
        "cnpj" TEXT NOT NULL DEFAULT '',
        "logoUrl" TEXT,
        "senha" TEXT NOT NULL DEFAULT '2026',
        "senhaAdmin" TEXT,
        "mensagemWhatsApp" TEXT DEFAULT 'Ola {nome}! Seu pedido esta pronto.',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela Cliente
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Cliente" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" TEXT NOT NULL,
        "telefone" TEXT NOT NULL UNIQUE,
        "cpfCnpj" TEXT UNIQUE,
        "tipoPessoa" TEXT NOT NULL DEFAULT 'CPF',
        "endereco" TEXT,
        "bairro" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela Produto
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Produto" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "nome" TEXT NOT NULL,
        "descricao" TEXT,
        "tipoVenda" TEXT NOT NULL,
        "valorUnit" DOUBLE PRECISION NOT NULL,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "categoria" TEXT,
        "imagem" TEXT,
        "tipoProduto" TEXT NOT NULL DEFAULT 'NORMAL',
        "tamanhos" TEXT,
        "precosTamanhos" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela Pedido
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Pedido" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero" INTEGER NOT NULL,
        "clienteId" TEXT NOT NULL,
        "observacoes" TEXT,
        "total" DOUBLE PRECISION NOT NULL,
        "totalPedida" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'PENDENTE',
        "impresso" BOOLEAN NOT NULL DEFAULT false,
        "tipoEntrega" TEXT NOT NULL DEFAULT 'RETIRA',
        "dataEntrega" TEXT NOT NULL,
        "horarioEntrega" TEXT,
        "enderecoEntrega" TEXT,
        "bairroEntrega" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela ItemPedido
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ItemPedido" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "pedidoId" TEXT NOT NULL,
        "produtoId" TEXT NOT NULL,
        "quantidadePedida" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "quantidade" DOUBLE PRECISION NOT NULL,
        "valorUnit" DOUBLE PRECISION NOT NULL,
        "subtotalPedida" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "observacao" TEXT,
        "tamanho" TEXT
      );
    `);

    // Criar tabela Orcamento
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Orcamento" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero" INTEGER NOT NULL,
        "clienteId" TEXT NOT NULL,
        "observacoes" TEXT,
        "total" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDENTE',
        "tipoEntrega" TEXT NOT NULL DEFAULT 'RETIRA',
        "dataEntrega" TEXT NOT NULL,
        "horarioEntrega" TEXT,
        "enderecoEntrega" TEXT,
        "bairroEntrega" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar tabela ItemOrcamento
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ItemOrcamento" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "orcamentoId" TEXT NOT NULL,
        "produtoId" TEXT NOT NULL,
        "quantidade" DOUBLE PRECISION NOT NULL,
        "valorUnit" DOUBLE PRECISION NOT NULL,
        "subtotal" DOUBLE PRECISION NOT NULL,
        "observacao" TEXT,
        "tamanho" TEXT
      );
    `);

    // Criar índices
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Pedido_numero_idx" ON "Pedido"("numero");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Pedido_clienteId_idx" ON "Pedido"("clienteId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Pedido_createdAt_idx" ON "Pedido"("createdAt");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ItemPedido_pedidoId_idx" ON "ItemPedido"("pedidoId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ItemPedido_produtoId_idx" ON "ItemPedido"("produtoId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Orcamento_numero_idx" ON "Orcamento"("numero");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Orcamento_clienteId_idx" ON "Orcamento"("clienteId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Orcamento_status_idx" ON "Orcamento"("status");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ItemOrcamento_orcamentoId_idx" ON "ItemOrcamento"("orcamentoId");`);
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ItemOrcamento_produtoId_idx" ON "ItemOrcamento"("produtoId");`);

    return NextResponse.json({
      success: true,
      message: "Tabelas criadas com sucesso!",
      proximoPasso: "Acesse /api/seed para adicionar dados iniciais"
    });

  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
