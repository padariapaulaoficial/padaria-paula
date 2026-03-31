import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Buscar produtos ativos, configurações e bairros para o catálogo público
export async function GET() {
  try {
    // Buscar produtos e configurações em paralelo
    const [produtos, configuracao, bairros, configCatalogo] = await Promise.all([
      db.produto.findMany({
        where: {
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          tipoVenda: true,
          valorUnit: true,
          categoria: true,
          tipoProduto: true,
          tamanhos: true,
          precosTamanhos: true,
          imagem: true,
        },
        orderBy: [
          { categoria: 'asc' },
          { nome: 'asc' },
        ],
      }),
      db.configuracao.findFirst({
        select: {
          nomeLoja: true,
          telefone: true,
          endereco: true,
        },
      }),
      db.bairro.findMany({
        where: {
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          taxaEntrega: true,
        },
        orderBy: {
          nome: 'asc',
        },
      }),
      db.configuracaoCatalogo.findFirst(),
    ]);

    // Parse dos tamanhos e preços
    const produtosFormatados = produtos.map(produto => ({
      ...produto,
      tamanhos: produto.tamanhos ? JSON.parse(produto.tamanhos) : null,
      precosTamanhos: produto.precosTamanhos ? JSON.parse(produto.precosTamanhos) : null,
      imagemUrl: produto.imagem,
    }));

    return NextResponse.json({
      produtos: produtosFormatados,
      configuracao: configuracao || {
        nomeLoja: 'Padaria Paula',
        telefone: '(11) 99999-9999',
        endereco: '',
      },
      bairros: bairros || [],
      configCatalogo: configCatalogo || {
        pedidoMinimo: 0,
        mensagemBoasVindas: 'Bem-vindo ao nosso catálogo!',
        mensagemDadosCliente: 'Falta pouco! Preciso dos seus dados para finalizar seu pedido.',
        exibirBusca: true,
        exibirWhatsapp: true,
        horarioAbertura: '08:00',
        horarioFechamento: '20:00',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dados do catálogo:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar catálogo' },
      { status: 500 }
    );
  }
}
