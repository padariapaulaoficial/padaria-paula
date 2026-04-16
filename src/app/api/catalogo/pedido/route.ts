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
      bairroEntrega,
      tipoEntrega,
      dataEntrega,
      horarioEntrega,
      taxaEntrega,
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

    if (!horarioEntrega) {
      return NextResponse.json(
        { error: 'Horário de entrega é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar telefone (mínimo 10 dígitos)
    const telefoneLimpo = telefoneCliente.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Inclua o DDD.' },
        { status: 400 }
      );
    }

    // Tele-entrega requer endereço
    if (tipoEntrega === 'TELE_ENTREGA' && !enderecoCliente) {
      return NextResponse.json(
        { error: 'Endereço é obrigatório para tele-entrega' },
        { status: 400 }
      );
    }
    
    // Normalizar nome para comparação (remover acentos, case insensitive)
    const normalizarNome = (nome: string) => {
      return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' ')            // Normaliza espaços
        .trim();
    };
    
    const nomeNormalizado = normalizarNome(nomeCliente);
    
    // Buscar cliente por telefone (compatível com diferentes formatos)
    // ou por nome similar (case insensitive, ignorando acentos)
    let cliente = await db.cliente.findFirst({
      where: { 
        telefone: telefoneLimpo 
      },
    });
    
    // Se não encontrou por telefone, tentar buscar por nome similar
    if (!cliente) {
      // Buscar todos os clientes e filtrar por nome normalizado
      const clientesExistentes = await db.cliente.findMany();
      cliente = clientesExistentes.find(c => {
        const nomeExistenteNormalizado = normalizarNome(c.nome);
        return nomeExistenteNormalizado === nomeNormalizado;
      }) || null;
      
      if (cliente) {
        console.log(`Cliente encontrado por nome similar: ${cliente.nome} (telefone diferente)`);
        
        // Se encontrou por nome mas telefone é diferente, atualizar o telefone
        if (cliente.telefone !== telefoneLimpo) {
          // Verificar se o novo telefone já existe em outro cliente
          const telefoneEmUso = await db.cliente.findFirst({
            where: { 
              telefone: telefoneLimpo,
              id: { not: cliente.id }
            },
          });
          
          if (telefoneEmUso) {
            // Se o telefone já está em uso por outro cliente, usar o cliente existente do telefone
            cliente = telefoneEmUso;
            console.log(`Telefone já cadastrado para outro cliente: ${telefoneEmUso.nome}`);
          } else {
            // Atualizar o telefone do cliente encontrado
            await db.cliente.update({
              where: { id: cliente.id },
              data: { telefone: telefoneLimpo },
            });
            console.log(`Telefone atualizado para cliente: ${cliente.nome}`);
          }
        }
      }
    }
    
    if (!cliente) {
      // Criar novo cliente
      cliente = await db.cliente.create({
        data: {
          nome: nomeCliente,
          telefone: telefoneLimpo,
          endereco: enderecoCliente || null,
          bairro: bairroEntrega || null,
        },
      });
      console.log(`Novo cliente criado: ${cliente.nome} (${cliente.telefone})`);
    } else {
      // Atualizar dados se fornecidos e diferentes
      const dadosAtualizacao: { nome?: string; endereco?: string; bairro?: string } = {};
      
      if (nomeCliente && nomeCliente !== cliente.nome) {
        dadosAtualizacao.nome = nomeCliente;
      }
      
      if (enderecoCliente && enderecoCliente !== cliente.endereco) {
        dadosAtualizacao.endereco = enderecoCliente;
      }
      
      if (bairroEntrega && bairroEntrega !== cliente.bairro) {
        dadosAtualizacao.bairro = bairroEntrega;
      }
      
      if (Object.keys(dadosAtualizacao).length > 0) {
        await db.cliente.update({
          where: { id: cliente.id },
          data: dadosAtualizacao,
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

    // Total com taxa de entrega
    const totalComTaxa = totalItens + (taxaEntrega || 0);
    
    // Criar pedido
    const pedido = await db.pedido.create({
      data: {
        numero: novoNumero,
        clienteId: cliente.id,
        observacoes: observacoes || null,
        total: totalComTaxa,
        totalPedida: totalComTaxa,
        tipoEntrega: tipoEntrega || 'RETIRA',
        dataEntrega: dataEntrega,
        horarioEntrega: horarioEntrega || null,
        enderecoEntrega: tipoEntrega === 'TELE_ENTREGA' ? enderecoCliente : null,
        bairroEntrega: tipoEntrega === 'TELE_ENTREGA' ? bairroEntrega : null,
        valorTeleEntrega: taxaEntrega || null,
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
