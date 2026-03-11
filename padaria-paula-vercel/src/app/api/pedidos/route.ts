// API de Pedidos - Padaria Paula
// CRUD completo de pedidos com dados de entrega no pedido

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = searchParams.get('data');
    const status = searchParams.get('status');
    const limite = searchParams.get('limite');
    
    // Buscar pedido específico por ID
    if (id) {
      const pedido = await db.pedido.findUnique({
        where: { id },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
            },
          },
        },
      });
      
      if (!pedido) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(pedido);
    }
    
    // Filtros para listagem
    const where: Record<string, unknown> = {};
    
    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      
      where.createdAt = {
        gte: dataInicio,
        lte: dataFim,
      };
    }
    
    if (status) {
      where.status = status;
    }
    
    // Listar pedidos
    const pedidos = await db.pedido.findMany({
      where,
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limite ? parseInt(limite) : 50,
    });
    
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));
    
    const { 
      clienteId, 
      itens, 
      observacoes, 
      total, 
      totalPedida, 
      tipoEntrega, 
      dataEntrega,
      horarioEntrega,
      enderecoEntrega,
      bairroEntrega
    } = body;
    
    // Validações
    if (!clienteId) {
      return NextResponse.json(
        { error: 'Cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!dataEntrega) {
      return NextResponse.json(
        { error: 'Data de entrega é obrigatória' },
        { status: 400 }
      );
    }
    
    if (!horarioEntrega) {
      return NextResponse.json(
        { error: 'Horário de entrega é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Pedido deve ter pelo menos um item.' },
        { status: 400 }
      );
    }
    
    // Validar se todos os itens têm produtoId
    for (const item of itens) {
      if (!item.produtoId) {
        return NextResponse.json(
          { error: 'Todos os itens devem ter um produto associado.' },
          { status: 400 }
        );
      }
    }
    
    // Verificar se cliente existe
    const clienteExistente = await db.cliente.findUnique({
      where: { id: clienteId },
    });
    
    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 400 }
      );
    }
    
    // Calcular número sequencial do pedido
    const ultimoPedido = await db.pedido.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const novoNumero = (ultimoPedido?.numero || 0) + 1;
    
    // Criar pedido com itens
    const pedido = await db.pedido.create({
      data: {
        numero: novoNumero,
        clienteId,
        observacoes: observacoes || null,
        total: parseFloat(total) || 0,
        totalPedida: parseFloat(totalPedida) || parseFloat(total) || 0,
        tipoEntrega: tipoEntrega || 'RETIRA',
        dataEntrega,
        horarioEntrega,
        enderecoEntrega: tipoEntrega === 'TELE_ENTREGA' ? enderecoEntrega : null,
        bairroEntrega: tipoEntrega === 'TELE_ENTREGA' ? bairroEntrega : null,
        status: 'PENDENTE',
        itens: {
          create: itens.map((item: Record<string, unknown>) => ({
            produtoId: item.produtoId as string,
            quantidadePedida: typeof item.quantidadePedida === 'number' 
              ? item.quantidadePedida 
              : typeof item.quantidade === 'number'
                ? item.quantidade
                : parseFloat(item.quantidade as string) || 0,
            quantidade: typeof item.quantidade === 'number' 
              ? item.quantidade 
              : parseFloat(item.quantidade as string) || 0,
            valorUnit: typeof item.valorUnit === 'number' 
              ? item.valorUnit 
              : parseFloat(item.valorUnit as string) || 0,
            subtotalPedida: typeof item.subtotalPedida === 'number' 
              ? item.subtotalPedida 
              : typeof item.subtotal === 'number'
                ? item.subtotal
                : parseFloat(item.subtotal as string) || 0,
            subtotal: typeof item.subtotal === 'number' 
              ? item.subtotal 
              : parseFloat(item.subtotal as string) || 0,
            observacao: item.observacao as string || null,
            tamanho: item.tamanho as string || null,
          })),
        },
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    });
    
    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar pedido: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status do pedido ou itens
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, impresso, itens } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }
    
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (impresso !== undefined) data.impresso = impresso;
    
    // Se houver itens para atualizar
    if (itens && Array.isArray(itens)) {
      // Atualizar cada item
      for (const item of itens) {
        if (item.id) {
          await db.itemPedido.update({
            where: { id: item.id },
            data: {
              quantidade: item.quantidade,
              subtotal: item.subtotal,
            },
          });
        }
      }
      
      // Recalcular total do pedido
      const itensAtualizados = await db.itemPedido.findMany({
        where: { pedidoId: id },
      });
      const novoTotal = itensAtualizados.reduce((sum, item) => sum + item.subtotal, 0);
      data.total = novoTotal;
    }
    
    const pedido = await db.pedido.update({
      where: { id },
      data,
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    });
    
    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir pedido
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o pedido existe
    const pedido = await db.pedido.findUnique({
      where: { id },
      include: { _count: { select: { itens: true } } }
    });
    
    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir itens do pedido primeiro (cascade)
    await db.itemPedido.deleteMany({
      where: { pedidoId: id }
    });
    
    // Excluir pedido
    await db.pedido.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Pedido excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir pedido' },
      { status: 500 }
    );
  }
}
