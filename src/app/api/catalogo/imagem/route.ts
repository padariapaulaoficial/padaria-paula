import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar produtos para debug
export async function GET() {
  try {
    const produtos = await db.produto.findMany({
      select: {
        id: true,
        nome: true,
        categoria: true,
        imagem: true,
      },
      take: 10,
    });
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}

// PUT - Adicionar imagem a um produto
export async function PUT(request: NextRequest) {
  try {
    const { produtoId, imagemUrl } = await request.json();
    
    const produto = await db.produto.update({
      where: { id: produtoId },
      data: { imagem: imagemUrl },
    });
    
    return NextResponse.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar imagem:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
