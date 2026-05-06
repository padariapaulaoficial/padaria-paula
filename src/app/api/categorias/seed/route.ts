// API de Seed de Categorias - Padaria Paula
// Popula as categorias iniciais com a ordem oficial

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Categorias oficiais com ordem definida
const CATEGORIAS_INICIAIS = [
  { nome: 'Tortas e Tabuas', ordem: 1 },
  { nome: 'Bolos e Cuca', ordem: 2 },
  { nome: 'Salgados fritos', ordem: 3 },
  { nome: 'Salgados assados', ordem: 4 },
  { nome: 'Doces Folhados', ordem: 5 },
  { nome: 'Doces', ordem: 6 },
  { nome: 'Pães', ordem: 7 },
  { nome: 'Bebidas', ordem: 8 },
  { nome: 'Descartáveis', ordem: 9 },
  { nome: 'Outros', ordem: 10 },
];

// POST - Popular categorias iniciais
export async function POST(request: NextRequest) {
  try {
    // Verificar se já existem categorias
    const existentes = await db.categoria.count();

    if (existentes > 0) {
      return NextResponse.json({
        message: 'Categorias já existem',
        count: existentes,
      });
    }

    // Criar categorias
    const categoriasCriadas = await db.categoria.createMany({
      data: CATEGORIAS_INICIAIS,
    });

    return NextResponse.json({
      message: 'Categorias criadas com sucesso',
      count: categoriasCriadas.count,
      categorias: CATEGORIAS_INICIAIS,
    });
  } catch (error) {
    console.error('Erro ao criar categorias iniciais:', error);
    return NextResponse.json(
      { error: 'Erro ao criar categorias iniciais' },
      { status: 500 }
    );
  }
}
