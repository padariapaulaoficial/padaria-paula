// API de Relatórios - Padaria Paula
// Geração de relatórios com exportação CSV

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Gerar relatórios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'vendas'; // vendas, produtos, clientes
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const formato = searchParams.get('formato') || 'json'; // json, csv

    // Validar datas
    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: 'Data início e data fim são obrigatórias' },
        { status: 400 }
      );
    }

    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    let dados: unknown[];
    let csvHeaders: string[];
    let csvRows: string[];

    switch (tipo) {
      case 'vendas':
        // Relatório de vendas por período
        const pedidos = await db.pedido.findMany({
          where: {
            createdAt: { gte: inicio, lte: fim },
          },
          include: {
            cliente: { select: { nome: true, telefone: true } },
            itens: {
              include: {
                produto: { select: { nome: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        dados = pedidos.map(p => ({
          numero: p.numero,
          data: p.createdAt.toISOString().split('T')[0],
          hora: p.createdAt.toTimeString().slice(0, 5),
          cliente: p.cliente.nome,
          telefone: p.cliente.telefone,
          status: p.status,
          tipoEntrega: p.tipoEntrega,
          total: p.total,
          itens: p.itens.length,
        }));

        csvHeaders = ['Número', 'Data', 'Hora', 'Cliente', 'Telefone', 'Status', 'Tipo Entrega', 'Total', 'Itens'];
        csvRows = pedidos.map(p =>
          [
            p.numero,
            p.createdAt.toISOString().split('T')[0],
            p.createdAt.toTimeString().slice(0, 5),
            `"${p.cliente.nome}"`,
            p.cliente.telefone,
            p.status,
            p.tipoEntrega,
            p.total.toFixed(2),
            p.itens.length,
          ].join(',')
        );
        break;

      case 'produtos':
        // Relatório de produtos mais vendidos
        const itensVendidos = await db.itemPedido.findMany({
          where: {
            pedido: {
              createdAt: { gte: inicio, lte: fim },
              status: { not: 'CANCELADO' },
            },
          },
          include: {
            produto: { select: { nome: true, categoria: true, tipoVenda: true } },
          },
        });

        // Agrupar por produto
        const produtosAgrupados = new Map<string, {
          nome: string;
          categoria: string | null;
          tipoVenda: string;
          quantidade: number;
          total: number;
          pedidos: number;
        }>();

        itensVendidos.forEach(item => {
          const key = item.produtoId;
          const existing = produtosAgrupados.get(key);
          if (existing) {
            existing.quantidade += item.quantidade;
            existing.total += item.subtotal;
            existing.pedidos += 1;
          } else {
            produtosAgrupados.set(key, {
              nome: item.produto.nome,
              categoria: item.produto.categoria,
              tipoVenda: item.produto.tipoVenda,
              quantidade: item.quantidade,
              total: item.subtotal,
              pedidos: 1,
            });
          }
        });

        dados = Array.from(produtosAgrupados.entries())
          .map(([id, p]) => ({
            id,
            nome: p.nome,
            categoria: p.categoria || 'Outros',
            tipoVenda: p.tipoVenda,
            quantidade: p.quantidade,
            total: p.total,
            pedidos: p.pedidos,
          }))
          .sort((a, b) => b.total - a.total);

        csvHeaders = ['ID', 'Produto', 'Categoria', 'Tipo', 'Quantidade', 'Total', 'Pedidos'];
        csvRows = dados.map(p =>
          [
            p.id,
            `"${p.nome}"`,
            `"${p.categoria}"`,
            p.tipoVenda,
            p.quantidade.toFixed(3),
            p.total.toFixed(2),
            p.pedidos,
          ].join(',')
        );
        break;

      case 'clientes':
        // Relatório de clientes que mais compram
        const pedidosClientes = await db.pedido.findMany({
          where: {
            createdAt: { gte: inicio, lte: fim },
            status: { not: 'CANCELADO' },
          },
          include: {
            cliente: {
              select: {
                nome: true,
                telefone: true,
                endereco: true,
                bairro: true,
              },
            },
          },
        });

        // Agrupar por cliente
        const clientesAgrupados = new Map<string, {
          nome: string;
          telefone: string;
          endereco: string | null;
          bairro: string | null;
          total: number;
          pedidos: number;
        }>();

        pedidosClientes.forEach(p => {
          const key = p.clienteId;
          const existing = clientesAgrupados.get(key);
          if (existing) {
            existing.total += p.total;
            existing.pedidos += 1;
          } else {
            clientesAgrupados.set(key, {
              nome: p.cliente.nome,
              telefone: p.cliente.telefone,
              endereco: p.cliente.endereco,
              bairro: p.cliente.bairro,
              total: p.total,
              pedidos: 1,
            });
          }
        });

        dados = Array.from(clientesAgrupados.entries())
          .map(([id, c]) => ({
            id,
            nome: c.nome,
            telefone: c.telefone,
            endereco: c.endereco || '',
            bairro: c.bairro || '',
            total: c.total,
            pedidos: c.pedidos,
            ticketMedio: c.pedidos > 0 ? c.total / c.pedidos : 0,
          }))
          .sort((a, b) => b.total - a.total);

        csvHeaders = ['ID', 'Cliente', 'Telefone', 'Endereço', 'Bairro', 'Total Gasto', 'Pedidos', 'Ticket Médio'];
        csvRows = dados.map(c =>
          [
            c.id,
            `"${c.nome}"`,
            c.telefone,
            `"${c.endereco}"`,
            `"${c.bairro}"`,
            c.total.toFixed(2),
            c.pedidos,
            c.ticketMedio.toFixed(2),
          ].join(',')
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        );
    }

    // Retornar CSV se solicitado
    if (formato === 'csv') {
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio_${tipo}_${dataInicio}_${dataFim}.csv"`,
        },
      });
    }

    return NextResponse.json(dados);
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
