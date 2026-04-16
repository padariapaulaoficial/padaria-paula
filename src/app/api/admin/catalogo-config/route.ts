import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar configurações do catálogo
export async function GET() {
  try {
    let config = await db.configuracaoCatalogo.findFirst();
    
    // Criar configuração padrão se não existir
    if (!config) {
      config = await db.configuracaoCatalogo.create({
        data: {
          pedidoMinimo: 0,
          mensagemBoasVindas: 'Bem-vindo ao nosso catálogo!',
          mensagemDadosCliente: 'Falta pouco! Preciso dos seus dados para finalizar seu pedido e garantir que tudo fique perfeito!',
          exibirBusca: true,
          exibirWhatsapp: true,
          horarioAbertura: '08:00',
          horarioFechamento: '20:00',
          diasFuncionamento: '1,2,3,4,5,6',
        },
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

// PUT - Atualizar configurações do catálogo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Buscar config existente
    let config = await db.configuracaoCatalogo.findFirst();
    
    if (!config) {
      // Criar nova configuração
      config = await db.configuracaoCatalogo.create({
        data: {
          pedidoMinimo: parseFloat(body.pedidoMinimo) || 0,
          mensagemBoasVindas: body.mensagemBoasVindas || '',
          mensagemDadosCliente: body.mensagemDadosCliente || '',
          exibirBusca: body.exibirBusca ?? true,
          exibirWhatsapp: body.exibirWhatsapp ?? true,
          horarioAbertura: body.horarioAbertura || '08:00',
          horarioFechamento: body.horarioFechamento || '20:00',
          diasFuncionamento: body.diasFuncionamento || '1,2,3,4,5,6',
        },
      });
    } else {
      // Atualizar existente
      config = await db.configuracaoCatalogo.update({
        where: { id: config.id },
        data: {
          pedidoMinimo: body.pedidoMinimo !== undefined ? parseFloat(body.pedidoMinimo) : undefined,
          mensagemBoasVindas: body.mensagemBoasVindas,
          mensagemDadosCliente: body.mensagemDadosCliente,
          exibirBusca: body.exibirBusca,
          exibirWhatsapp: body.exibirWhatsapp,
          horarioAbertura: body.horarioAbertura,
          horarioFechamento: body.horarioFechamento,
          diasFuncionamento: body.diasFuncionamento,
        },
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configurações do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
