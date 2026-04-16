// API para verificar estrutura completa do banco de dados
// Padaria Paula

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const resultado: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tabelas: {},
    problemas: [] as string[],
    recomendacoes: [] as string[],
  };

  try {
    // Verificar tabela Pedido e suas colunas
    try {
      const pedidoColumns = await db.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Pedido'
        ORDER BY ordinal_position
      `;
      
      resultado.tabelas.Pedido = {
        colunas: pedidoColumns.map(c => c.column_name),
        detalhes: pedidoColumns
      };

      // Verificar colunas obrigatórias
      const colunasObrigatorias = [
        'id', 'numero', 'clienteId', 'total', 'totalPedida', 'status',
        'impresso', 'tipoEntrega', 'dataEntrega', 'statusPagamento',
        'valorEntrada', 'alertaProducaoEnviado', 'valorTeleEntrega'
      ];
      
      const colunasExistentes = pedidoColumns.map(c => c.column_name);
      const colunasFaltando = colunasObrigatorias.filter(c => !colunasExistentes.includes(c));
      
      if (colunasFaltando.length > 0) {
        resultado.problemas.push(`Pedido: Colunas faltando: ${colunasFaltando.join(', ')}`);
        resultado.recomendacoes.push('Execute /api/migrate-db para adicionar colunas faltantes');
      }
    } catch (err: any) {
      resultado.tabelas.Pedido = { erro: err.message };
      resultado.problemas.push(`Pedido: Erro ao verificar - ${err.message}`);
    }

    // Verificar tabela Orcamento
    try {
      const orcamentoColumns = await db.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Orcamento'
        ORDER BY ordinal_position
      `;
      
      resultado.tabelas.Orcamento = {
        colunas: orcamentoColumns.map(c => c.column_name),
        detalhes: orcamentoColumns
      };

      const colunasObrigatorias = [
        'id', 'numero', 'clienteId', 'total', 'status',
        'tipoEntrega', 'dataEntrega', 'valorTeleEntrega'
      ];
      
      const colunasExistentes = orcamentoColumns.map(c => c.column_name);
      const colunasFaltando = colunasObrigatorias.filter(c => !colunasExistentes.includes(c));
      
      if (colunasFaltando.length > 0) {
        resultado.problemas.push(`Orcamento: Colunas faltando: ${colunasFaltando.join(', ')}`);
      }
    } catch (err: any) {
      resultado.tabelas.Orcamento = { erro: err.message };
      resultado.problemas.push(`Orcamento: Erro ao verificar - ${err.message}`);
    }

    // Verificar tabela Cliente
    try {
      const clienteColumns = await db.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Cliente'
        ORDER BY ordinal_position
      `;
      
      resultado.tabelas.Cliente = {
        colunas: clienteColumns.map(c => c.column_name),
        detalhes: clienteColumns
      };
    } catch (err: any) {
      resultado.tabelas.Cliente = { erro: err.message };
    }

    // Verificar tabela Produto
    try {
      const produtoColumns = await db.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Produto'
        ORDER BY ordinal_position
      `;
      
      resultado.tabelas.Produto = {
        colunas: produtoColumns.map(c => c.column_name),
        detalhes: produtoColumns
      };

      const colunasObrigatorias = ['tipoProduto', 'tamanhos', 'precosTamanhos'];
      const colunasExistentes = produtoColumns.map(c => c.column_name);
      const colunasFaltando = colunasObrigatorias.filter(c => !colunasExistentes.includes(c));
      
      if (colunasFaltando.length > 0) {
        resultado.problemas.push(`Produto: Colunas faltando: ${colunasFaltando.join(', ')}`);
      }
    } catch (err: any) {
      resultado.tabelas.Produto = { erro: err.message };
    }

    // Verificar tabela Configuracao
    try {
      const configColumns = await db.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Configuracao'
        ORDER BY ordinal_position
      `;
      
      resultado.tabelas.Configuracao = {
        colunas: configColumns.map(c => c.column_name),
        detalhes: configColumns
      };
    } catch (err: any) {
      resultado.tabelas.Configuracao = { erro: err.message };
    }

    // Contar registros
    try {
      const contagem = {
        pedidos: await db.pedido.count(),
        orcamentos: await db.orcamento.count(),
        clientes: await db.cliente.count(),
        produtos: await db.produto.count(),
      };
      resultado.contagem = contagem;
    } catch (err: any) {
      resultado.contagem = { erro: err.message };
    }

    // Status final
    resultado.status = resultado.problemas.length === 0 ? 'OK' : 'PROBLEMAS ENCONTRADOS';
    
    if (resultado.problemas.length > 0) {
      resultado.recomendacoes.push('Execute /api/migrate-db para corrigir colunas faltantes');
    }

  } catch (error: any) {
    resultado.erroGeral = error.message;
  }

  return NextResponse.json(resultado);
}
