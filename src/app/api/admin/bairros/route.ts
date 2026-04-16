import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar todos os bairros
export async function GET() {
  try {
    const bairros = await db.bairro.findMany({
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(bairros);
  } catch (error) {
    console.error('Erro ao buscar bairros:', error);
    return NextResponse.json({ error: 'Erro ao buscar bairros' }, { status: 500 });
  }
}

// POST - Criar novo bairro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, taxaEntrega } = body;

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do bairro é obrigatório' }, { status: 400 });
    }

    const bairro = await db.bairro.create({
      data: {
        nome: nome.trim(),
        taxaEntrega: parseFloat(taxaEntrega) || 0,
      },
    });

    return NextResponse.json(bairro, { status: 201 });
  } catch (error: unknown) {
    console.error('Erro ao criar bairro:', error);
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Este bairro já existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar bairro' }, { status: 500 });
  }
}

// PUT - Atualizar bairro
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, taxaEntrega, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do bairro é obrigatório' }, { status: 400 });
    }

    const bairro = await db.bairro.update({
      where: { id },
      data: {
        nome: nome?.trim(),
        taxaEntrega: taxaEntrega !== undefined ? parseFloat(taxaEntrega) : undefined,
        ativo: ativo !== undefined ? ativo : undefined,
      },
    });

    return NextResponse.json(bairro);
  } catch (error) {
    console.error('Erro ao atualizar bairro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar bairro' }, { status: 500 });
  }
}

// DELETE - Excluir bairro
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do bairro é obrigatório' }, { status: 400 });
    }

    await db.bairro.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir bairro:', error);
    return NextResponse.json({ error: 'Erro ao excluir bairro' }, { status: 500 });
  }
}
