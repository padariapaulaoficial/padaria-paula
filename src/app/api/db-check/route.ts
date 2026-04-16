// API para verificar e corrigir o banco de dados
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('[DB-CHECK] Iniciando verificação completa...');
    
    const resultados: Record<string, any> = {};
    
    // 1. Testar conexão
    try {
      await prisma.$queryRaw`SELECT 1`;
      resultados.conexao = 'OK';
    } catch (e) {
      return NextResponse.json({ error: 'Sem conexão com banco', detalhes: String(e) }, { status: 500 });
    }

    // 2. Listar tabelas existentes
    let tabelas: any[] = [];
    try {
      tabelas = await prisma.$queryRaw<any[]>`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      resultados.tabelas = tabelas.map(t => t.table_name);
    } catch (e) {
      resultados.tabelas = `Erro: ${e}`;
    }

    // 3. Verificar cada tabela
    const tabelasEsperadas = ['Configuracao', 'Cliente', 'Produto', 'Pedido', 'ItemPedido', 'Orcamento', 'ItemOrcamento', 'Bairro', 'ConfiguracaoCatalogo'];
    resultados.tabelasFaltando = tabelasEsperadas.filter(t => !tabelas.some(tt => tt.table_name === t));

    // 4. Verificar colunas do Pedido
    try {
      const colunasPedido = await prisma.$queryRaw<any[]>`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'Pedido' AND table_schema = 'public'
      `;
      const nomesColunas = colunasPedido.map(c => c.column_name);
      
      const colunasEsperadas = [
        'id', 'numero', 'clienteId', 'observacoes', 'total', 'totalPedida',
        'status', 'impresso', 'tipoEntrega', 'dataEntrega', 'horarioEntrega',
        'enderecoEntrega', 'bairroEntrega', 'statusPagamento', 'valorEntrada',
        'formaPagamentoEntrada', 'dataEntrada', 'alertaProducaoEnviado',
        'valorTeleEntrega', 'createdAt', 'updatedAt'
      ];
      
      resultados.colunasPedidoExistentes = nomesColunas;
      resultados.colunasPedidoFaltando = colunasEsperadas.filter(c => !nomesColunas.includes(c));
    } catch (e) {
      resultados.colunasPedidoErro = String(e);
    }

    // 5. Verificar Configuracao
    try {
      const config = await prisma.configuracao.findFirst();
      resultados.configuracao = config ? 'OK' : 'VAZIO - Precisa de seed';
    } catch (e: any) {
      resultados.configuracao = `ERRO: ${e.message}`;
    }

    // 6. Verificar Produto
    try {
      const count = await prisma.produto.count();
      resultados.produtos = count;
    } catch (e: any) {
      resultados.produtos = `ERRO: ${e.message}`;
    }

    // 7. Verificar ConfiguracaoCatalogo
    try {
      const cat = await prisma.configuracaoCatalogo.findFirst();
      resultados.configuracaoCatalogo = cat ? 'OK' : 'VAZIO';
    } catch (e: any) {
      resultados.configuracaoCatalogo = `ERRO: ${e.message}`;
    }

    return NextResponse.json({
      status: 'diagnostico',
      resultados
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro no diagnóstico',
      detalhes: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Executar correções
export async function POST() {
  try {
    console.log('[DB-CHECK] Iniciando correções...');
    const correcoes: string[] = [];

    // Conectar
    await prisma.$connect();

    // 1. Criar tabela ConfiguracaoCatalogo se não existir
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ConfiguracaoCatalogo" (
          "id" TEXT NOT NULL,
          "pedidoMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "mensagemBoasVindas" TEXT NOT NULL DEFAULT 'Bem-vindo!',
          "mensagemDadosCliente" TEXT NOT NULL DEFAULT 'Dados do cliente',
          "exibirBusca" BOOLEAN NOT NULL DEFAULT true,
          "exibirWhatsapp" BOOLEAN NOT NULL DEFAULT true,
          "horarioAbertura" TEXT,
          "horarioFechamento" TEXT,
          "diasFuncionamento" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ConfiguracaoCatalogo_pkey" PRIMARY KEY ("id")
        );
      `);
      correcoes.push('Tabela ConfiguracaoCatalogo verificada/criada');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        correcoes.push(`Erro ConfiguracaoCatalogo: ${e.message}`);
      }
    }

    // 2. Adicionar colunas faltantes em Pedido
    const colunasParaAdicionar = [
      { nome: 'statusPagamento', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "statusPagamento" TEXT NOT NULL DEFAULT 'PENDENTE'` },
      { nome: 'valorEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "valorEntrada" DOUBLE PRECISION NOT NULL DEFAULT 0` },
      { nome: 'formaPagamentoEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "formaPagamentoEntrada" TEXT` },
      { nome: 'dataEntrada', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "dataEntrada" TIMESTAMP(3)` },
      { nome: 'totalPedida', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "totalPedida" DOUBLE PRECISION NOT NULL DEFAULT 0` },
      { nome: 'alertaProducaoEnviado', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "alertaProducaoEnviado" BOOLEAN NOT NULL DEFAULT false` },
      { nome: 'valorTeleEntrega', sql: `ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "valorTeleEntrega" DOUBLE PRECISION` },
    ];

    for (const col of colunasParaAdicionar) {
      try {
        await prisma.$executeRawUnsafe(col.sql);
        correcoes.push(`Coluna ${col.nome} adicionada/verificada`);
      } catch (e: any) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          correcoes.push(`Coluna ${col.nome} já existe`);
        } else {
          correcoes.push(`Erro coluna ${col.nome}: ${e.message}`);
        }
      }
    }

    // 3. Criar índices se não existirem
    const indices = [
      `CREATE INDEX IF NOT EXISTS "Pedido_numero_idx" ON "Pedido"("numero")`,
      `CREATE INDEX IF NOT EXISTS "Pedido_clienteId_idx" ON "Pedido"("clienteId")`,
      `CREATE INDEX IF NOT EXISTS "Pedido_dataEntrega_idx" ON "Pedido"("dataEntrega")`,
    ];

    for (const idx of indices) {
      try {
        await prisma.$executeRawUnsafe(idx);
      } catch (e) {
        // Ignorar erros de índice
      }
    }
    correcoes.push('Índices verificados');

    // 4. Verificar se existe configuração, se não, criar
    const configCount = await prisma.configuracao.count();
    if (configCount === 0) {
      await prisma.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '2025',
        }
      });
      correcoes.push('Configuração padrão criada');
    }

    return NextResponse.json({
      status: 'correcoes_aplicadas',
      correcoes
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao aplicar correções',
      detalhes: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
