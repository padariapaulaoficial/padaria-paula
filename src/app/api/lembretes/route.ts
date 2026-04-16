// API de Lembretes - Padaria Paula
// Retorna pedidos pendentes com entrega próxima
// Usa valores fixos: 1, 3, 7 dias (sem depender de configuração no banco)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Dias de lembrete fixos (podemos tornar configurável no futuro)
const DIAS_LEMBRETE = [1, 3, 7];

// Função para converter data de vários formatos para Date
function parseDataEntrega(dataStr: string): Date {
  // Tenta formato ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return new Date(dataStr + 'T12:00:00');
  }
  
  // Tenta formato brasileiro (DD/MM/YYYY)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const [dia, mes, ano] = dataStr.split('/');
    return new Date(`${ano}-${mes}-${dia}T12:00:00`);
  }
  
  // Fallback - tenta parse direto
  return new Date(dataStr);
}

// GET - Buscar pedidos que precisam de lembrete
export async function GET(request: NextRequest) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const maxDias = Math.max(...DIAS_LEMBRETE);

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

    console.log(`[Lembretes] Encontrados ${pedidosPendentes.length} pedidos pendentes`);
    console.log(`[Lembretes] Data hoje: ${hoje.toISOString()}`);
    console.log(`[Lembretes] Dias de lembrete: ${DIAS_LEMBRETE.join(', ')}`);

    // Filtrar pedidos que precisam de lembrete
    const lembretes: Array<{
      pedido: typeof pedidosPendentes[0];
      diasParaEntrega: number;
      urgente: boolean;
    }> = [];

    for (const pedido of pedidosPendentes) {
      const dataEntrega = parseDataEntrega(pedido.dataEntrega);
      dataEntrega.setHours(0, 0, 0, 0);
      
      const diffTime = dataEntrega.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`[Lembretes] Pedido #${pedido.numero}: dataEntrega=${pedido.dataEntrega}, diffDays=${diffDays}`);
      
      // Se está dentro dos dias de lembrete ou já passou
      if (diffDays <= maxDias) {
        lembretes.push({
          pedido,
          diasParaEntrega: diffDays,
          urgente: diffDays <= 1,
        });
      }
    }

    console.log(`[Lembretes] Retornando ${lembretes.length} lembretes`);

    return NextResponse.json({ 
      lembretes,
      diasConfigurados: DIAS_LEMBRETE,
      lembretesAtivos: true,
    });
  } catch (error) {
    console.error('Erro ao buscar lembretes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lembretes', lembretes: [] },
      { status: 500 }
    );
  }
}
