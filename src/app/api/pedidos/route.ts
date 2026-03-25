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
    const alertaProducao = searchParams.get('alertaProducao');
    
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
    
    // Buscar pedidos que precisam de alerta de produção (3 dias antes)
    if (alertaProducao === 'true') {
      const hoje = new Date();
      const dataAlertaInicio = new Date(hoje);
      dataAlertaInicio.setDate(hoje.getDate() + 3); // 3 dias à frente
      dataAlertaInicio.setHours(0, 0, 0, 0);
      
      const dataAlertaFim = new Date(dataAlertaInicio);
      dataAlertaFim.setHours(23, 59, 59, 999);
      
      const dataEntregaStr = dataAlertaInicio.toISOString().split('T')[0];
      
      const pedidosAlerta = await db.pedido.findMany({
        where: {
          dataEntrega: dataEntregaStr,
          status: { notIn: ['ENTREGUE', 'CANCELADO'] },
          alertaProducaoEnviado: false,
        },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
            },
          },
        },
        orderBy: { horarioEntrega: 'asc' },
      });
      
      return NextResponse.json(pedidosAlerta);
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
      bairroEntrega,
      valorTeleEntrega
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
    
    // Calcular total incluindo taxa de tele-entrega
    const taxaEntrega = (tipoEntrega === 'TELE_ENTREGA' && valorTeleEntrega) 
      ? parseFloat(valorTeleEntrega) || 0 
      : 0;
    const totalFinal = parseFloat(total) + taxaEntrega;
    
    // Criar pedido com itens
    const pedido = await db.pedido.create({
      data: {
        numero: novoNumero,
        clienteId,
        observacoes: observacoes || null,
        total: totalFinal,
        totalPedida: parseFloat(totalPedida) || parseFloat(total) || 0,
        tipoEntrega: tipoEntrega || 'RETIRA',
        dataEntrega,
        horarioEntrega,
        enderecoEntrega: tipoEntrega === 'TELE_ENTREGA' ? enderecoEntrega : null,
        bairroEntrega: tipoEntrega === 'TELE_ENTREGA' ? bairroEntrega : null,
        valorTeleEntrega: taxaEntrega > 0 ? taxaEntrega : null,
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
    const { 
      id, status, impresso, itens, novosItens,
      valorEntrada, formaPagamentoEntrada, dataEntrada,
      alertaProducaoEnviado,
      dataEntrega, horarioEntrega, valorTeleEntrega
    } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }
    
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (impresso !== undefined) data.impresso = impresso;
    
    // Campos de entrada
    if (valorEntrada !== undefined) data.valorEntrada = parseFloat(valorEntrada) || 0;
    if (formaPagamentoEntrada !== undefined) data.formaPagamentoEntrada = formaPagamentoEntrada;
    if (dataEntrada !== undefined) data.dataEntrada = dataEntrada ? new Date(dataEntrada) : null;
    if (alertaProducaoEnviado !== undefined) data.alertaProducaoEnviado = alertaProducaoEnviado;
    
    // Campos de entrega (edição de data/horário)
    if (dataEntrega !== undefined) data.dataEntrega = dataEntrega;
    if (horarioEntrega !== undefined) data.horarioEntrega = horarioEntrega;
    if (valorTeleEntrega !== undefined) data.valorTeleEntrega = parseFloat(valorTeleEntrega) || 0;
    
    // Se houver itens para atualizar
    if (itens && Array.isArray(itens)) {
      // Atualizar cada item existente
      for (const item of itens) {
        if (item.id) {
          await db.itemPedido.update({
            where: { id: item.id },
            data: {
              quantidade: item.quantidade,
              quantidadePedida: item.quantidade, // Sincronizar com a quantidade pedida para produção
              subtotal: item.subtotal,
              subtotalPedida: item.subtotal, // Sincronizar subtotal pedida também
            },
          });
        }
      }
    }
    
    // Se houver novos itens para adicionar
    if (novosItens && Array.isArray(novosItens) && novosItens.length > 0) {
      for (const item of novosItens) {
        if (item.produtoId) {
          // Verificar se o produto é ESPECIAL (torta) ou KG (peso)
          const produto = await db.produto.findUnique({
            where: { id: item.produtoId },
            select: { tipoProduto: true, tipoVenda: true },
          });
          
          // Produtos que NÃO somam (sempre criam item separado):
          // - ESPECIAL (tortas)
          // - KG (produtos vendidos por peso)
          // Apenas UNIDADE normais podem ser somados
          const naoSoma = produto?.tipoProduto === 'ESPECIAL' || produto?.tipoVenda === 'KG';
          
          if (naoSoma) {
            // Criar novo item sempre (não somar)
            await db.itemPedido.create({
              data: {
                pedidoId: id,
                produtoId: item.produtoId,
                quantidadePedida: item.quantidade || 0,
                quantidade: item.quantidade || 0,
                valorUnit: item.valorUnit || 0,
                subtotalPedida: item.subtotal || 0,
                subtotal: item.subtotal || 0,
                observacao: item.observacao || null,
                tamanho: item.tamanho || null,
              },
            });
          } else {
            // Para produtos UNIDADE normais, verificar se já existe item com mesmo produto E tamanho
            const itemExistente = await db.itemPedido.findFirst({
              where: {
                pedidoId: id,
                produtoId: item.produtoId,
                tamanho: item.tamanho || null,
              },
            });
            
            if (itemExistente) {
              // Se existe, somar as quantidades
              const novaQuantidade = itemExistente.quantidade + (item.quantidade || 0);
              const novaQuantidadePedida = itemExistente.quantidadePedida + (item.quantidade || 0);
              const novoSubtotal = novaQuantidade * itemExistente.valorUnit;
              const novoSubtotalPedida = novaQuantidadePedida * itemExistente.valorUnit;
              
              await db.itemPedido.update({
                where: { id: itemExistente.id },
                data: {
                  quantidade: novaQuantidade,
                  quantidadePedida: novaQuantidadePedida,
                  subtotal: novoSubtotal,
                  subtotalPedida: novoSubtotalPedida,
                },
              });
            } else {
              // Se não existe, criar novo item
              await db.itemPedido.create({
                data: {
                  pedidoId: id,
                  produtoId: item.produtoId,
                  quantidadePedida: item.quantidade || 0,
                  quantidade: item.quantidade || 0,
                  valorUnit: item.valorUnit || 0,
                  subtotalPedida: item.subtotal || 0,
                  subtotal: item.subtotal || 0,
                  observacao: item.observacao || null,
                  tamanho: item.tamanho || null,
                },
              });
            }
          }
        }
      }
    }
    
    // Recalcular total do pedido se houve alterações em itens
    if ((itens && Array.isArray(itens)) || (novosItens && Array.isArray(novosItens) && novosItens.length > 0)) {
      const itensAtualizados = await db.itemPedido.findMany({
        where: { pedidoId: id },
      });
      
      // Buscar o pedido atual para obter a taxa de tele-entrega
      const pedidoAtual = await db.pedido.findUnique({
        where: { id },
        select: { valorTeleEntrega: true },
      });
      
      const subtotalItens = itensAtualizados.reduce((sum, item) => sum + item.subtotal, 0);
      const taxaEntrega = pedidoAtual?.valorTeleEntrega || 0;
      const novoTotal = subtotalItens + taxaEntrega;
      
      data.total = novoTotal;
      data.totalPedida = subtotalItens; // totalPedida não inclui taxa
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
