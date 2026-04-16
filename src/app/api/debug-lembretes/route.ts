// API de Diagnóstico de Lembretes - Padaria Paula
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Buscar configuração (sem campos de lembrete que não existem no banco)
    const config = await db.configuracao.findFirst();
    
    // Buscar todos os pedidos pendentes/producao
    const pedidos = await db.pedido.findMany({
      where: {
        status: { in: ['PENDENTE', 'PRODUCAO'] },
      },
      include: {
        cliente: { select: { nome: true } },
      },
      orderBy: { dataEntrega: 'asc' },
      take: 20,
    });

    // Data de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Calcular dias para cada pedido
    const pedidosComDias = pedidos.map(p => {
      let dataEntrega: Date;
      
      // Parse da data
      if (/^\d{4}-\d{2}-\d{2}$/.test(p.dataEntrega)) {
        dataEntrega = new Date(p.dataEntrega + 'T12:00:00');
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(p.dataEntrega)) {
        const [dia, mes, ano] = p.dataEntrega.split('/');
        dataEntrega = new Date(`${ano}-${mes}-${dia}T12:00:00`);
      } else {
        dataEntrega = new Date(p.dataEntrega);
      }
      
      dataEntrega.setHours(0, 0, 0, 0);
      const diffTime = dataEntrega.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        id: p.id,
        numero: p.numero,
        status: p.status,
        dataEntrega: p.dataEntrega,
        cliente: p.cliente?.nome,
        diasParaEntrega: diffDays,
        urgente: diffDays <= 1,
      };
    });

    return NextResponse.json({
      hoje: hoje.toISOString(),
      config: config ? {
        id: config.id,
        nomeLoja: config.nomeLoja,
        senha: config.senha,
      } : null,
      diasLembreteConfigurados: [1, 3, 7],
      totalPedidosPendentes: pedidos.length,
      pedidos: pedidosComDias,
      pedidosQueDeveriamAparecer: pedidosComDias.filter(p => p.diasParaEntrega <= 7),
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json({
      error: String(error),
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
