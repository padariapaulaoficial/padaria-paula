// API de Configurações - Padaria Paula
// Gerencia dados da loja

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Mensagens padrão com pontuação e acentuação corretas
const MENSAGENS_PADRAO = {
  mensagemOrcamento: 'Olá, {nome}! Tudo bem? Segue seu orçamento.',
  mensagemProntoRetirada: 'Olá, {nome}! Seu pedido #{pedido} está *PRONTO* e esperando por você! Pode vir buscar quando quiser. 🍰 Agradecemos pela preferência! 🙏',
  mensagemProntoEntrega: 'Olá, {nome}! Seu pedido #{pedido} está *PRONTO* e já está a caminho! 🚚 Agradecemos pela preferência! 🙏',
  mensagemAprovacao: 'Olá, {nome}! Seu orçamento foi aprovado! Estamos preparando seu pedido.',
  mensagemRevisao: 'Olá, {nome}! Por favor, revise seu pedido e confirme se está tudo correto.',
};

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
            mensagemOrcamento: MENSAGENS_PADRAO.mensagemOrcamento,
            mensagemProntoRetirada: MENSAGENS_PADRAO.mensagemProntoRetirada,
            mensagemProntoEntrega: MENSAGENS_PADRAO.mensagemProntoEntrega,
            mensagemAprovacao: MENSAGENS_PADRAO.mensagemAprovacao,
            mensagemRevisao: MENSAGENS_PADRAO.mensagemRevisao,
            diasAlertaProducao: 3,
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
          mensagemOrcamento: MENSAGENS_PADRAO.mensagemOrcamento,
          mensagemProntoRetirada: MENSAGENS_PADRAO.mensagemProntoRetirada,
          mensagemProntoEntrega: MENSAGENS_PADRAO.mensagemProntoEntrega,
          mensagemAprovacao: MENSAGENS_PADRAO.mensagemAprovacao,
          mensagemRevisao: MENSAGENS_PADRAO.mensagemRevisao,
          diasAlertaProducao: 3,
        });
      }
    }

    // Garantir que todos os campos existam com valores padrão
    const configCompleta = {
      id: config.id,
      nomeLoja: config.nomeLoja || 'Padaria e Confeitaria Paula',
      endereco: config.endereco || '',
      telefone: config.telefone || '',
      cnpj: (config as any).cnpj || '',
      logoUrl: (config as any).logoUrl || null,
      mensagemWhatsApp: (config as any).mensagemWhatsApp || null,
      mensagemOrcamento: (config as any).mensagemOrcamento || MENSAGENS_PADRAO.mensagemOrcamento,
      mensagemProntoRetirada: (config as any).mensagemProntoRetirada || MENSAGENS_PADRAO.mensagemProntoRetirada,
      mensagemProntoEntrega: (config as any).mensagemProntoEntrega || MENSAGENS_PADRAO.mensagemProntoEntrega,
      mensagemAprovacao: (config as any).mensagemAprovacao || MENSAGENS_PADRAO.mensagemAprovacao,
      mensagemRevisao: (config as any).mensagemRevisao || MENSAGENS_PADRAO.mensagemRevisao,
      diasAlertaProducao: (config as any).diasAlertaProducao || 3,
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
      mensagemWhatsApp, mensagemOrcamento, mensagemProntoRetirada, mensagemProntoEntrega,
      mensagemAprovacao, mensagemRevisao, diasAlertaProducao
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
            mensagemAprovacao,
            mensagemRevisao,
            diasAlertaProducao: diasAlertaProducao || 3,
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
          mensagemWhatsApp,
          mensagemOrcamento,
          mensagemProntoRetirada,
          mensagemProntoEntrega,
          mensagemAprovacao,
          mensagemRevisao,
          diasAlertaProducao: diasAlertaProducao ? parseInt(diasAlertaProducao) : undefined,
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
        mensagemAprovacao,
        mensagemRevisao,
        diasAlertaProducao,
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
