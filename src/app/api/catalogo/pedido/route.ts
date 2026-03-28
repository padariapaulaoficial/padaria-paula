import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Criar pedido a partir do catálogo público
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Pedido do catálogo:', JSON.stringify(body, null, 2));
    
    const { 
      nomeCliente,
      telefoneCliente,
      enderecoCliente,
      tipoEntrega,
      dataEntrega,
      horarioEntrega,
      itens,
      observacoes
    } = body;
    
    // Validações básicas
    if (!nomeCliente || !telefoneCliente) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      );
    }
    
    if (!dataEntrega) {
      return NextResponse.json(
        { error: 'Data de entrega é obrigatória' },
        { status: 400 }
      );
    }
    
    // Buscar ou criar cliente pelo telefone
    let cliente = await db.cliente.findUnique({
      where: { telefone: telefoneCliente },
    });
    
    if (!cliente) {
      // Criar novo cliente
      cliente = await db.cliente.create({
        data: {
          nome: nomeCliente,
          telefone: telefoneCliente,
          endereco: enderecoCliente || null,
        },
      });
    } else {
      // Atualizar endereço se fornecido e diferente
      if (enderecoCliente && enderecoCliente !== cliente.endereco) {
        await db.cliente.update({
          where: { id: cliente.id },
          data: { endereco: enderecoCliente },
        });
      }
    }
    
    // Calcular número sequencial do pedido
    const ultimoPedido = await db.pedido.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const novoNumero = (ultimoPedido?.numero || 0) + 1;
    
    // Calcular total dos itens
    const totalItens = itens.reduce((sum: number, item: Record<string, unknown>) => {
      return sum + ((item.subtotal as number) || 0);
    }, 0);
    
    // Criar pedido
    const pedido = await db.pedido.create({
      data: {
        numero: novoNumero,
        clienteId: cliente.id,
        observacoes: observacoes || null,
        total: totalItens,
        totalPedida: totalItens,
        tipoEntrega: tipoEntrega || 'RETIRA',
        dataEntrega: dataEntrega,
        horarioEntrega: horarioEntrega || null,
        enderecoEntrega: tipoEntrega === 'TELE_ENTREGA' ? enderecoCliente : null,
        bairroEntrega: null,
        status: 'PENDENTE',
        itens: {
          create: itens.map((item: Record<string, unknown>) => ({
            produtoId: item.produtoId as string,
            quantidadePedida: item.quantidade as number,
            quantidade: item.quantidade as number,
            valorUnit: item.preco as number,
            subtotalPedida: item.subtotal as number,
            subtotal: item.subtotal as number,
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
    
    console.log(`Pedido #${pedido.numero} criado com sucesso para ${cliente.nome}`);
    
    return NextResponse.json({
      success: true,
      pedido,
      message: `Pedido #${pedido.numero} criado com sucesso!`
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar pedido do catálogo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar pedido: ${errorMessage}` },
      { status: 500 }
    );
  }
}
