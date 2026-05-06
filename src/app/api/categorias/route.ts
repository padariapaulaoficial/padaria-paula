// API de Categorias - Padaria Paula
// CRUD completo de categorias para organização de produtos e impressão

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar categorias (ordenadas por ordem)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');

    const where: Record<string, unknown> = {};

    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }

    const categorias = await db.categoria.findMany({
      where,
      orderBy: { ordem: 'asc' },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, ordem, ativo } = body;

    if (!nome || typeof nome !== 'string' || nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe
    const existente = await db.categoria.findUnique({
      where: { nome: nome.trim() },
    });

    if (existente) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    // Se ordem não informada, usar a próxima disponível
    let ordemFinal = ordem;
    if (ordemFinal === undefined || ordemFinal === null) {
      const ultima = await db.categoria.findFirst({
        orderBy: { ordem: 'desc' },
        select: { ordem: true },
      });
      ordemFinal = ultima ? ultima.ordem + 1 : 0;
    }

    const categoria = await db.categoria.create({
      data: {
        nome: nome.trim(),
        ordem: parseInt(ordemFinal),
        ativo: ativo !== undefined ? ativo : true,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar categoria: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Atualizar categoria
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, ordem, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (nome !== undefined) {
      if (typeof nome !== 'string' || nome.trim() === '') {
        return NextResponse.json(
          { error: 'Nome da categoria não pode ser vazio' },
          { status: 400 }
        );
      }
      // Verificar se já existe outra categoria com este nome
      const existente = await db.categoria.findFirst({
        where: {
          nome: nome.trim(),
          NOT: { id },
        },
      });
      if (existente) {
        return NextResponse.json(
          { error: 'Já existe outra categoria com este nome' },
          { status: 400 }
        );
      }
      updateData.nome = nome.trim();
    }

    if (ordem !== undefined) {
      updateData.ordem = parseInt(ordem);
    }

    if (ativo !== undefined) {
      updateData.ativo = ativo;
    }

    const categoria = await db.categoria.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao atualizar categoria: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Excluir categoria
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se existem produtos com esta categoria
    const produtosComCategoria = await db.produto.count({
      where: { categoria: { not: null } },
    });

    // Buscar nome da categoria
    const categoria = await db.categoria.findUnique({
      where: { id },
      select: { nome: true },
    });

    if (categoria) {
      const produtosComEstaCategoria = await db.produto.count({
        where: { categoria: categoria.nome },
      });

      if (produtosComEstaCategoria > 0) {
        // Se existem produtos, apenas desativar
        const catAtualizada = await db.categoria.update({
          where: { id },
          data: { ativo: false },
        });

        return NextResponse.json({
          message: 'Categoria desativada (existem produtos relacionados)',
          categoria: catAtualizada,
        });
      }
    }

    // Se não há produtos, excluir permanentemente
    await db.categoria.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir categoria' },
      { status: 500 }
    );
  }
}
