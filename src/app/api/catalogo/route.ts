import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Buscar produtos ativos e configurações para o catálogo público
export async function GET() {
  try {
    // Buscar produtos e configurações em paralelo
    const [produtos, configuracao] = await Promise.all([
      prisma.produto.findMany({
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
      prisma.configuracao.findFirst({
        select: {
          nomeLoja: true,
          telefone: true,
          endereco: true,
        },
      }),
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
    });
  } catch (error) {
    console.error('Erro ao buscar dados do catálogo:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar catálogo' },
      { status: 500 }
    );
  }
}
