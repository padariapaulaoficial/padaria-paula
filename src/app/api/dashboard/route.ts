// API de Dashboard - Padaria Paula
// Estatísticas e métricas para o painel administrativo

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar estatísticas do dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje'; // hoje, semana, mes, todos

    // Data atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Data de ontem
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    // Início do mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Início da semana (domingo)
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());

    // Fim da semana (sábado)
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    // Definir período de busca
    let dataInicio: Date;
    let dataFim: Date;

    switch (periodo) {
      case 'hoje':
        dataInicio = hoje;
        dataFim = new Date(hoje);
        dataFim.setHours(23, 59, 59, 999);
        break;
      case 'semana':
        dataInicio = inicioSemana;
        dataFim = fimSemana;
        break;
      case 'mes':
        dataInicio = inicioMes;
        dataFim = new Date();
        break;
      default:
        dataInicio = new Date(2020, 0, 1);
        dataFim = new Date();
    }

    // 1. Total de vendas do período
    const vendasPeriodo = await db.pedido.aggregate({
      where: {
        createdAt: { gte: dataInicio, lte: dataFim },
        status: { not: 'CANCELADO' },
      },
      _sum: { total: true },
      _count: true,
    });

    // 2. Vendas de hoje
    const vendasHoje = await db.pedido.aggregate({
      where: {
        createdAt: { gte: hoje },
        status: { not: 'CANCELADO' },
      },
      _sum: { total: true },
      _count: true,
    });

    // 3. Vendas de ontem (para comparação)
    const vendasOntem = await db.pedido.aggregate({
      where: {
        createdAt: { gte: ontem, lt: hoje },
        status: { not: 'CANCELADO' },
      },
      _sum: { total: true },
      _count: true,
    });

    // 4. Pedidos por status
    const pedidosPorStatus = await db.pedido.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        createdAt: { gte: dataInicio, lte: dataFim },
      },
    });

    // 5. Últimos 7 dias de vendas
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(hoje);
      dia.setDate(dia.getDate() - i);
      const diaInicio = new Date(dia);
      diaInicio.setHours(0, 0, 0, 0);
      const diaFim = new Date(dia);
      diaFim.setHours(23, 59, 59, 999);

      const vendasDia = await db.pedido.aggregate({
        where: {
          createdAt: { gte: diaInicio, lte: diaFim },
          status: { not: 'CANCELADO' },
        },
        _sum: { total: true },
        _count: true,
      });

      ultimos7Dias.push({
        data: dia.toISOString().split('T')[0],
        dia: dia.toLocaleDateString('pt-BR', { weekday: 'short' }),
        total: vendasDia._sum.total || 0,
        pedidos: vendasDia._count,
      });
    }

    // 6. Produtos mais vendidos
    const itensVendidos = await db.itemPedido.groupBy({
      by: ['produtoId'],
      _sum: { quantidade: true, subtotal: true },
      _count: true,
      where: {
        pedido: {
          createdAt: { gte: dataInicio, lte: dataFim },
          status: { not: 'CANCELADO' },
        },
      },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 10,
    });

    // Buscar nomes dos produtos
    const produtosIds = itensVendidos.map(item => item.produtoId);
    const produtos = await db.produto.findMany({
      where: { id: { in: produtosIds } },
      select: { id: true, nome: true, categoria: true },
    });

    const produtosMaisVendidos = itensVendidos.map(item => {
      const produto = produtos.find(p => p.id === item.produtoId);
      return {
        produtoId: item.produtoId,
        nome: produto?.nome || 'Produto removido',
        categoria: produto?.categoria || 'Outros',
        quantidade: item._sum.quantidade || 0,
        total: item._sum.subtotal || 0,
        pedidos: item._count,
      };
    });

    // 7. Últimos pedidos
    const ultimosPedidos = await db.pedido.findMany({
      where: {
        createdAt: { gte: dataInicio, lte: dataFim },
      },
      include: {
        cliente: { select: { nome: true, telefone: true } },
        itens: { select: { produto: { select: { nome: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 8. Clientes que mais compram
    const clientesTop = await db.pedido.groupBy({
      by: ['clienteId'],
      _sum: { total: true },
      _count: true,
      where: {
        createdAt: { gte: dataInicio, lte: dataFim },
        status: { not: 'CANCELADO' },
      },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    });

    // Buscar dados dos clientes
    const clientesIds = clientesTop.map(c => c.clienteId);
    const clientes = await db.cliente.findMany({
      where: { id: { in: clientesIds } },
      select: { id: true, nome: true, telefone: true },
    });

    const clientesTopFormatados = clientesTop.map(item => {
      const cliente = clientes.find(c => c.id === item.clienteId);
      return {
        clienteId: item.clienteId,
        nome: cliente?.nome || 'Cliente removido',
        telefone: cliente?.telefone || '',
        totalGasto: item._sum.total || 0,
        pedidos: item._count,
      };
    });

    // 9. Contagem geral
    const totalClientes = await db.cliente.count();
    const totalProdutos = await db.produto.count({ where: { ativo: true } });
    const pedidosPendentes = await db.pedido.count({
      where: { status: 'PENDENTE' },
    });
    const pedidosEmProducao = await db.pedido.count({
      where: { status: 'PRODUCAO' },
    });
    const pedidosProntos = await db.pedido.count({
      where: { status: 'PRONTO' },
    });

    // Calcular variação percentual em relação a ontem
    const variacaoVendas = vendasOntem._sum.total
      ? ((vendasHoje._sum.total || 0) - (vendasOntem._sum.total || 0)) / (vendasOntem._sum.total || 1) * 100
      : 0;

    return NextResponse.json({
      vendasHoje: {
        total: vendasHoje._sum.total || 0,
        pedidos: vendasHoje._count,
        variacao: variacaoVendas,
      },
      vendasPeriodo: {
        total: vendasPeriodo._sum.total || 0,
        pedidos: vendasPeriodo._count,
      },
      pedidosPorStatus: pedidosPorStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      ultimos7Dias,
      produtosMaisVendidos,
      ultimosPedidos: ultimosPedidos.map(p => ({
        id: p.id,
        numero: p.numero,
        cliente: p.cliente,
        total: p.total,
        status: p.status,
        createdAt: p.createdAt,
        tipoEntrega: p.tipoEntrega,
        itensCount: p.itens.length,
      })),
      clientesTop: clientesTopFormatados,
      resumo: {
        totalClientes,
        totalProdutos,
        pedidosPendentes,
        pedidosEmProducao,
        pedidosProntos,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
