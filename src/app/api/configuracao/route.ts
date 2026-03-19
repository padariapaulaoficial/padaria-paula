// API de Configurações - Padaria Paula
// Gerencia dados da loja

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar configurações
export async function GET() {
  try {
    let config = await db.configuracao.findFirst();
    
    // Criar configuração padrão se não existir
    if (!config) {
      config = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          cnpj: '',
        },
      });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar configurações
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, nomeLoja, endereco, telefone, cnpj, logoUrl, 
      mensagemWhatsApp, mensagemOrcamento, mensagemProntoRetirada, mensagemProntoEntrega 
    } = body;

    if (!id) {
      // Criar nova configuração
      const config = await db.configuracao.create({
        data: {
          nomeLoja: nomeLoja || 'Padaria Paula',
          endereco: endereco || '',
          telefone: telefone || '',
          cnpj: cnpj || '',
          logoUrl: logoUrl || null,
          mensagemWhatsApp: mensagemWhatsApp || null,
          mensagemOrcamento: mensagemOrcamento || null,
          mensagemProntoRetirada: mensagemProntoRetirada || null,
          mensagemProntoEntrega: mensagemProntoEntrega || null,
        },
      });
      return NextResponse.json(config);
    }

    const config = await db.configuracao.update({
      where: { id },
      data: {
        nomeLoja,
        endereco,
        telefone,
        cnpj,
        logoUrl,
        mensagemWhatsApp,
        mensagemOrcamento,
        mensagemProntoRetirada,
        mensagemProntoEntrega,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
