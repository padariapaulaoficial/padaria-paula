// API de Health Check - Padaria Paula
// Verifica se o sistema está funcionando corretamente

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Testar conexão com o banco usando métodos normais do Prisma
    // (não usar $queryRaw para evitar problemas com pooler)
    
    // Contar registros principais
    const [clientes, produtos, pedidos] = await Promise.all([
      db.cliente.count(),
      db.produto.count({ where: { ativo: true } }),
      db.pedido.count(),
    ]);
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'connected',
      counts: {
        clientes,
        produtos,
        pedidos,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
