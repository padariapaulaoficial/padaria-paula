// API de Estatísticas - Padaria Paula
// Fornece dados para o Dashboard do Admin

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar estatísticas para o dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'dia'; // dia, semana, mes

    // Data atual
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    // Data de início dos últimos 7 dias
    const inicio7Dias = new Date(hoje);
    inicio7Dias.setDate(hoje.getDate() - 6);
    inicio7Dias.setHours(0, 0, 0, 0);

    // === VENDAS DO DIA ===
    const vendasDia = await db.pedido.aggregate({
      where: {
        createdAt: {
          gte: inicioHoje,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // === VENDAS DOS ÚLTIMOS 7 DIAS ===
    const vendas7Dias = await db.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio7Dias,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por dia
    const vendasPorDia: Record<string, { data: string; total: number; pedidos: number }> = {};
    
    // Inicializar todos os dias
    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      vendasPorDia[dataStr] = {
        data: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        total: 0,
        pedidos: 0,
      };
    }

    // Preencher com dados reais
    for (const venda of vendas7Dias) {
      const dataStr = venda.createdAt.toISOString().split('T')[0];
      if (vendasPorDia[dataStr]) {
        vendasPorDia[dataStr].total += venda.total;
        vendasPorDia[dataStr].pedidos += 1;
      }
    }

    // Converter para array ordenado
    const graficoVendas = Object.values(vendasPorDia).reverse();

    // === TOP 5 PRODUTOS MAIS VENDIDOS ===
    const topProdutosRaw = await db.$queryRaw<
      { produtoId: string; nome: string; totalVendido: number; quantidadeTotal: number }[]
    >`
      SELECT 
        ip."produtoId",
        p.nome,
        SUM(ip.subtotal) as "totalVendido",
        SUM(ip.quantidade) as "quantidadeTotal"
      FROM "ItemPedido" ip
      JOIN "Produto" p ON ip."produtoId" = p.id
      JOIN "Pedido" ped ON ip."pedidoId" = ped.id
      WHERE ped."createdAt" >= ${inicio7Dias}
      GROUP BY ip."produtoId", p.nome
      ORDER BY "quantidadeTotal" DESC
      LIMIT 5
    `;

    const topProdutos = topProdutosRaw.map((p, index) => ({
      posicao: index + 1,
      nome: p.nome,
      quantidade: Number(p.quantidadeTotal),
      total: Number(p.totalVendido),
    }));

    // === TEMPO MÉDIO DE ENTREGA/PRODUÇÃO ===
    // Calcular baseado em pedidos entregues nos últimos 7 dias
    // (Considerando createdAt como início e updatedAt como conclusão)
    const pedidosConcluidos = await db.pedido.findMany({
      where: {
        createdAt: {
          gte: inicio7Dias,
        },
        status: 'ENTREGUE',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let tempoMedioMinutos = 0;
    if (pedidosConcluidos.length > 0) {
      const tempos = pedidosConcluidos.map((p) => {
        const diff = new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime();
        return diff / (1000 * 60); // diferença em minutos
      });
      tempoMedioMinutos = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
    }

    // === RESUMO GERAL ===
    const totalClientes = await db.cliente.count();
    const totalProdutos = await db.produto.count({
      where: { ativo: true },
    });
    const pedidosPendentes = await db.pedido.count({
      where: { status: 'PENDENTE' },
    });
    const pedidosHoje = await db.pedido.count({
      where: {
        createdAt: { gte: inicioHoje },
      },
    });

    // === Comparativo com ontem ===
    const inicioOntem = new Date(inicioHoje);
    inicioOntem.setDate(inicioOntem.getDate() - 1);
    const fimOntem = new Date(inicioHoje);
    
    const vendasOntem = await db.pedido.aggregate({
      where: {
        createdAt: {
          gte: inicioOntem,
          lt: fimOntem,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const valorVendasOntem = vendasOntem._sum.total || 0;
    const valorVendasHoje = vendasDia._sum.total || 0;
    const percentualVariacao = valorVendasOntem > 0 
      ? ((valorVendasHoje - valorVendasOntem) / valorVendasOntem) * 100 
      : valorVendasHoje > 0 ? 100 : 0;

    return NextResponse.json({
      vendasDia: {
        total: vendasDia._sum.total || 0,
        pedidos: vendasDia._count.id || 0,
        comparativo: {
          ontem: valorVendasOntem,
          variacao: percentualVariacao,
        },
      },
      graficoVendas,
      topProdutos,
      tempoMedio: {
        minutos: tempoMedioMinutos,
        formato: formatarTempo(tempoMedioMinutos),
      },
      resumo: {
        totalClientes,
        totalProdutos,
        pedidosPendentes,
        pedidosHoje,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    );
  }
}

// Função auxiliar para formatar tempo
function formatarTempo(minutos: number): string {
  if (minutos < 60) {
    return `${minutos} min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}
