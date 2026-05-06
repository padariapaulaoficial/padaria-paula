// API de Reordenação de Categorias - Padaria Paula
// Permite reordenar as categorias em lote

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT - Reordenar categorias em lote
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { categorias } = body;

    if (!categorias || !Array.isArray(categorias)) {
      return NextResponse.json(
        { error: 'Lista de categorias é obrigatória' },
        { status: 400 }
      );
    }

    // Atualizar ordem de cada categoria
    const updates = categorias.map((cat: { id: string; ordem: number }) =>
      db.categoria.update({
        where: { id: cat.id },
        data: { ordem: cat.ordem },
      })
    );

    await Promise.all(updates);

    // Retornar categorias atualizadas
    const categoriasAtualizadas = await db.categoria.findMany({
      orderBy: { ordem: 'asc' },
    });

    return NextResponse.json(categoriasAtualizadas);
  } catch (error) {
    console.error('Erro ao reordenar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar categorias' },
      { status: 500 }
    );
  }
}
