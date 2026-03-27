// API de Orçamentos - Padaria Paula
// CRUD completo de orçamentos com conversão para pedido

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar orçamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limite = searchParams.get('limite');
    
    // Buscar orçamento específico por ID
    if (id) {
      const orcamento = await db.orcamento.findUnique({
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
      
      if (!orcamento) {
        return NextResponse.json(
          { error: 'Orçamento não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(orcamento);
    }
    
    // Filtros para listagem
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    // Listar orçamentos
    const orcamentos = await db.orcamento.findMany({
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
    
    return NextResponse.json(orcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamentos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));
    
    const { 
      clienteId, 
      itens, 
      observacoes, 
      total, 
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
    
    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Orçamento deve ter pelo menos um item.' },
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
    
    // Calcular número sequencial do orçamento
    const ultimoOrcamento = await db.orcamento.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const novoNumero = (ultimoOrcamento?.numero || 0) + 1;
    
    // Criar orçamento com itens
    const orcamento = await db.orcamento.create({
      data: {
        numero: novoNumero,
        clienteId,
        observacoes: observacoes || null,
        total: parseFloat(total) || 0,
        tipoEntrega: tipoEntrega || 'RETIRA',
        dataEntrega,
        horarioEntrega,
        enderecoEntrega: tipoEntrega === 'TELE_ENTREGA' ? enderecoEntrega : null,
        bairroEntrega: tipoEntrega === 'TELE_ENTREGA' ? bairroEntrega : null,
        valorTeleEntrega: tipoEntrega === 'TELE_ENTREGA' && valorTeleEntrega ? parseFloat(valorTeleEntrega) : null,
        status: 'PENDENTE',
        itens: {
          create: itens.map((item: Record<string, unknown>) => ({
            produtoId: item.produtoId as string,
            quantidade: typeof item.quantidade === 'number' 
              ? item.quantidade 
              : parseFloat(item.quantidade as string) || 0,
            valorUnit: typeof item.valorUnit === 'number' 
              ? item.valorUnit 
              : parseFloat(item.valorUnit as string) || 0,
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
    
    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar orçamento: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Atualizar orçamento (status, itens, adicionar produtos, dados de entrega)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, converterParaPedido, itens, novosItens, itensParaRemover, tipoEntrega, dataEntrega, horarioEntrega, valorTeleEntrega } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar orçamento atual
    const orcamentoAtual = await db.orcamento.findUnique({
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
    
    if (!orcamentoAtual) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se há atualização de dados de entrega
    const dadosEntrega: Record<string, unknown> = {};
    let recalcularTotal = false;
    
    if (tipoEntrega !== undefined) {
      dadosEntrega.tipoEntrega = tipoEntrega;
      recalcularTotal = true;
    }
    if (dataEntrega !== undefined) {
      dadosEntrega.dataEntrega = dataEntrega;
    }
    if (horarioEntrega !== undefined) {
      dadosEntrega.horarioEntrega = horarioEntrega || null;
    }
    if (valorTeleEntrega !== undefined) {
      dadosEntrega.valorTeleEntrega = valorTeleEntrega ? parseFloat(valorTeleEntrega) : null;
      recalcularTotal = true;
    }
    
    // Atualizar dados de entrega se fornecidos
    if (Object.keys(dadosEntrega).length > 0) {
      await db.orcamento.update({
        where: { id },
        data: dadosEntrega,
      });
    }
    
    // Se for para converter para pedido
    if (converterParaPedido && status === 'APROVADO') {
      // Calcular número sequencial do pedido
      const ultimoPedido = await db.pedido.findFirst({
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
      const novoNumero = (ultimoPedido?.numero || 0) + 1;
      
      // Criar pedido a partir do orçamento (incluindo orcamentoId para rastreamento)
      const pedido = await db.pedido.create({
        data: {
          numero: novoNumero,
          clienteId: orcamentoAtual.clienteId,
          orcamentoId: id, // Guarda referência ao orçamento de origem
          observacoes: orcamentoAtual.observacoes,
          total: orcamentoAtual.total,
          totalPedida: orcamentoAtual.total,
          tipoEntrega: orcamentoAtual.tipoEntrega,
          dataEntrega: orcamentoAtual.dataEntrega,
          horarioEntrega: orcamentoAtual.horarioEntrega,
          enderecoEntrega: orcamentoAtual.enderecoEntrega,
          bairroEntrega: orcamentoAtual.bairroEntrega,
          valorTeleEntrega: orcamentoAtual.valorTeleEntrega,
          status: 'PENDENTE',
          itens: {
            create: orcamentoAtual.itens.map((item) => ({
              produtoId: item.produtoId,
              quantidadePedida: item.quantidade,
              quantidade: item.quantidade,
              valorUnit: item.valorUnit,
              subtotalPedida: item.subtotal,
              subtotal: item.subtotal,
              observacao: item.observacao,
              tamanho: item.tamanho,
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
      
      // Atualizar status do orçamento para APROVADO
      await db.orcamento.update({
        where: { id },
        data: { status: 'APROVADO' },
      });
      
      return NextResponse.json({ 
        message: 'Orçamento aprovado e convertido para pedido',
        pedido,
        orcamento: { ...orcamentoAtual, status: 'APROVADO' }
      });
    }
    
    // Remover itens com quantidade 0
    if (itensParaRemover && Array.isArray(itensParaRemover) && itensParaRemover.length > 0) {
      await db.itemOrcamento.deleteMany({
        where: {
          id: { in: itensParaRemover },
          orcamentoId: id,
        },
      });
    }
    
    // Atualização de itens existentes
    if (itens && Array.isArray(itens)) {
      for (const itemUpdate of itens) {
        if (itemUpdate.id) {
          await db.itemOrcamento.update({
            where: { id: itemUpdate.id },
            data: {
              quantidade: itemUpdate.quantidade,
              subtotal: itemUpdate.subtotal,
            },
          });
        }
      }
    }
    
    // Adicionar novos itens
    if (novosItens && Array.isArray(novosItens)) {
      for (const novoItem of novosItens) {
        await db.itemOrcamento.create({
          data: {
            orcamentoId: id,
            produtoId: novoItem.produtoId,
            quantidade: novoItem.quantidade,
            valorUnit: novoItem.valorUnit,
            subtotal: novoItem.subtotal,
            observacao: novoItem.observacao || null,
            tamanho: novoItem.tamanho || null,
          },
        });
      }
    }
    
    // Recalcular total do orçamento
    if (itens || novosItens || itensParaRemover || recalcularTotal) {
      const itensAtualizados = await db.itemOrcamento.findMany({
        where: { orcamentoId: id },
      });
      const subtotalItens = itensAtualizados.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Buscar o orçamento atualizado para obter a taxa de tele-entrega
      const orcamentoAtualizado = await db.orcamento.findUnique({
        where: { id },
        select: { valorTeleEntrega: true, tipoEntrega: true },
      });
      
      // Calcular total incluindo taxa de tele-entrega
      const taxaEntrega = (orcamentoAtualizado?.tipoEntrega === 'TELE_ENTREGA' && orcamentoAtualizado?.valorTeleEntrega) 
        ? orcamentoAtualizado.valorTeleEntrega 
        : 0;
      const novoTotal = subtotalItens + taxaEntrega;
      
      await db.orcamento.update({
        where: { id },
        data: { total: novoTotal },
      });
    }
    
    // Atualização de status
    if (status) {
      await db.orcamento.update({
        where: { id },
        data: { status },
      });
    }
    
    // Buscar orçamento atualizado
    const orcamentoAtualizado = await db.orcamento.findUnique({
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
    
    return NextResponse.json(orcamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar orçamento' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir orçamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o orçamento existe
    const orcamento = await db.orcamento.findUnique({
      where: { id },
    });
    
    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir itens do orçamento primeiro (cascade)
    await db.itemOrcamento.deleteMany({
      where: { orcamentoId: id }
    });
    
    // Excluir orçamento
    await db.orcamento.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir orçamento' },
      { status: 500 }
    );
  }
}
