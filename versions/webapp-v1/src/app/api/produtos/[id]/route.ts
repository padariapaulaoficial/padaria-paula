// API Route para Produto específico
// Operações em um produto por ID

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const produto = await db.produto.findUnique({
      where: { id },
    });

    if (!produto) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, descricao, tipoVenda, valorUnit, categoria, ativo } = body;

    const produto = await db.produto.update({
      where: { id },
      data: {
        nome: nome || undefined,
        descricao: descricao !== undefined ? descricao : undefined,
        tipoVenda: tipoVenda || undefined,
        valorUnit: valorUnit !== undefined ? parseFloat(valorUnit) : undefined,
        categoria: categoria !== undefined ? categoria : undefined,
        ativo: ativo !== undefined ? ativo : undefined,
      },
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.produto.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Produto excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return NextResponse.json(
      { error: "Erro ao excluir produto" },
      { status: 500 }
    );
  }
}
