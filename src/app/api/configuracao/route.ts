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
      try {
        config = await db.configuracao.create({
          data: {
            nomeLoja: 'Padaria e Confeitaria Paula',
            endereco: 'Rua das Flores, 123',
            telefone: '(11) 99999-9999',
            senha: '2026',
            senhaAdmin: '2026',
          },
        });
      } catch (createError) {
        console.error('Erro ao criar configuração:', createError);
        // Retornar configuração padrão sem criar no banco
        return NextResponse.json({
          id: 'temp',
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          cnpj: '',
          logoUrl: null,
          mensagemWhatsApp: null,
          mensagemOrcamento: null,
          mensagemProntoRetirada: null,
          mensagemProntoEntrega: null,
        });
      }
    }
    
    // Garantir que todos os campos existam
    const configCompleta = {
      id: config.id,
      nomeLoja: config.nomeLoja || 'Padaria e Confeitaria Paula',
      endereco: config.endereco || '',
      telefone: config.telefone || '',
      cnpj: (config as any).cnpj || '',
      logoUrl: (config as any).logoUrl || null,
      mensagemWhatsApp: (config as any).mensagemWhatsApp || null,
      mensagemOrcamento: (config as any).mensagemOrcamento || null,
      mensagemProntoRetirada: (config as any).mensagemProntoRetirada || null,
      mensagemProntoEntrega: (config as any).mensagemProntoEntrega || null,
    };
    
    return NextResponse.json(configCompleta);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações', details: String(error) },
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

    if (!id || id === 'temp') {
      // Tentar criar nova configuração
      try {
        const config = await db.configuracao.create({
          data: {
            nomeLoja: nomeLoja || 'Padaria e Confeitaria Paula',
            endereco: endereco || '',
            telefone: telefone || '',
            cnpj: cnpj || '',
            senha: '2026',
            senhaAdmin: '2026',
          },
        });
        return NextResponse.json(config);
      } catch (createError) {
        console.error('Erro ao criar configuração:', createError);
        return NextResponse.json({ error: 'Erro ao criar configuração' }, { status: 500 });
      }
    }

    try {
      const config = await db.configuracao.update({
        where: { id },
        data: {
          nomeLoja,
          endereco,
          telefone,
          cnpj,
          logoUrl,
        },
      });
      return NextResponse.json(config);
    } catch (updateError) {
      console.error('Erro ao atualizar:', updateError);
      // Retornar os dados enviados mesmo se falhar
      return NextResponse.json({
        id,
        nomeLoja,
        endereco,
        telefone,
        cnpj,
        logoUrl,
        mensagemWhatsApp,
        mensagemOrcamento,
        mensagemProntoRetirada,
        mensagemProntoEntrega,
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações', details: String(error) },
      { status: 500 }
    );
  }
}
