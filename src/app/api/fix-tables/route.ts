// API para verificar e corrigir estrutura do banco de dados
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const resultados: string[] = [];

    // 1. Verificar tabelas existentes
    const tabelas = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    resultados.push(`Tabelas: ${(tabelas as any[]).map(t => t.table_name).join(', ')}`);

    // 2. Verificar se há orçamentos órfãos (sem cliente)
    const orcamentosOrfaos = await db.$queryRaw`
      SELECT o.id, o.numero, o."clienteId"
      FROM "Orcamento" o
      LEFT JOIN "Cliente" c ON o."clienteId" = c.id
      WHERE c.id IS NULL;
    `;
    if ((orcamentosOrfaos as any[]).length > 0) {
      resultados.push(`Orçamentos sem cliente: ${(orcamentosOrfaos as any[]).length}`);
      // Deletar orçamentos órfãos
      for (const o of orcamentosOrfaos as any[]) {
        await db.$executeRawUnsafe(`DELETE FROM "ItemOrcamento" WHERE "orcamentoId" = '${o.id}'`);
        await db.$executeRawUnsafe(`DELETE FROM "Orcamento" WHERE id = '${o.id}'`);
        resultados.push(`Orçamento órfão ${o.numero} removido`);
      }
    }

    // 3. Verificar itens de orçamento órfãos (sem produto)
    const itensOrfaos = await db.$queryRaw`
      SELECT io.id, io."orcamentoId", io."produtoId"
      FROM "ItemOrcamento" io
      LEFT JOIN "Produto" p ON io."produtoId" = p.id
      WHERE p.id IS NULL;
    `;
    if ((itensOrfaos as any[]).length > 0) {
      resultados.push(`Itens sem produto: ${(itensOrfaos as any[]).length}`);
      // Deletar itens órfãos
      for (const item of itensOrfaos as any[]) {
        await db.$executeRawUnsafe(`DELETE FROM "ItemOrcamento" WHERE id = '${item.id}'`);
        resultados.push(`Item órfão removido`);
      }
    }

    // 4. Adicionar foreign keys se não existirem
    try {
      await db.$executeRawUnsafe(`
        DO $$
        BEGIN
          -- Pedido -> Cliente
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'Pedido_clienteId_fkey'
          ) THEN
            ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey"
            FOREIGN KEY ("clienteId") REFERENCES "Cliente"(id) ON DELETE RESTRICT;
          END IF;

          -- ItemPedido -> Pedido
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'ItemPedido_pedidoId_fkey'
          ) THEN
            ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey"
            FOREIGN KEY ("pedidoId") REFERENCES "Pedido"(id) ON DELETE CASCADE;
          END IF;

          -- ItemPedido -> Produto
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'ItemPedido_produtoId_fkey'
          ) THEN
            ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_produtoId_fkey"
            FOREIGN KEY ("produtoId") REFERENCES "Produto"(id);
          END IF;

          -- Orcamento -> Cliente
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'Orcamento_clienteId_fkey'
          ) THEN
            ALTER TABLE "Orcamento" ADD CONSTRAINT "Orcamento_clienteId_fkey"
            FOREIGN KEY ("clienteId") REFERENCES "Cliente"(id) ON DELETE RESTRICT;
          END IF;

          -- ItemOrcamento -> Orcamento
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'ItemOrcamento_orcamentoId_fkey'
          ) THEN
            ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_orcamentoId_fkey"
            FOREIGN KEY ("orcamentoId") REFERENCES "Orcamento"(id) ON DELETE CASCADE;
          END IF;

          -- ItemOrcamento -> Produto
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'ItemOrcamento_produtoId_fkey'
          ) THEN
            ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_produtoId_fkey"
            FOREIGN KEY ("produtoId") REFERENCES "Produto"(id);
          END IF;
        END $$;
      `);
      resultados.push("Foreign keys verificadas");
    } catch (e: any) {
      // Ignorar erro de FK já existente
      resultados.push(`FK info: ${e.message?.substring(0, 100)}`);
    }

    // 5. Verificar contagem final
    const contagens = {
      configuracao: await db.configuracao.count(),
      clientes: await db.cliente.count(),
      produtos: await db.produto.count(),
      pedidos: await db.pedido.count(),
      orcamentos: await db.orcamento.count(),
      itensOrcamento: await db.itemOrcamento.count(),
    };

    // 6. Testar query de orçamentos
    try {
      const testOrcamentos = await db.orcamento.findMany({
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
            },
          },
        },
        take: 5,
      });
      resultados.push(`Query teste orçamentos: ${testOrcamentos.length} encontrados`);
    } catch (e: any) {
      resultados.push(`Erro query orçamentos: ${e.message}`);
    }

    return NextResponse.json({
      success: true,
      mensagem: "Banco de dados verificado",
      contagens,
      acoes: resultados
    });

  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
