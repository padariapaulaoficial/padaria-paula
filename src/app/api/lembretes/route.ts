// API de Lembretes - Padaria Paula
// Retorna pedidos pendentes com entrega próxima

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar pedidos que precisam de lembrete
export async function GET(request: NextRequest) {
  try {
    const config = await db.configuracao.findFirst();
    
    if (!config || !config.lembretesAtivos) {
      return NextResponse.json({ lembretes: [] });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Dias de lembrete configurados
    const diasLembrete = [
      config.diasLembrete1 || 1,
      config.diasLembrete2 || 3,
      config.diasLembrete3 || 7,
    ].sort((a, b) => a - b);

    // Buscar todos os pedidos pendentes
    const pedidosPendentes = await db.pedido.findMany({
      where: {
        status: { in: ['PENDENTE', 'PRODUCAO'] },
      },
      include: {
        cliente: true,
        itens: {
          include: { produto: true },
        },
      },
      orderBy: { dataEntrega: 'asc' },
    });

    // Filtrar pedidos que precisam de lembrete
    const lembretes: Array<{
      pedido: typeof pedidosPendentes[0];
      diasParaEntrega: number;
      urgente: boolean;
    }> = [];

    for (const pedido of pedidosPendentes) {
      const dataEntrega = new Date(pedido.dataEntrega + 'T12:00:00');
      dataEntrega.setHours(0, 0, 0, 0);
      
      const diffTime = dataEntrega.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Se está dentro dos dias de lembrete ou já passou
      if (diffDays <= Math.max(...diasLembrete)) {
        lembretes.push({
          pedido,
          diasParaEntrega: diffDays,
          urgente: diffDays <= 1,
        });
      }
    }

    return NextResponse.json({ 
      lembretes,
      diasConfigurados: diasLembrete,
      lembretesAtivos: config.lembretesAtivos,
    });
  } catch (error) {
    console.error('Erro ao buscar lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembretes', lembretes: [] },
      { status: 500 }
    );
  }
}
