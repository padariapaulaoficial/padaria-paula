// API Route para Pedido específico
// Operações em um pedido por ID

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Buscar pedido por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pedido = await db.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedido" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validar status
    const statusValidos = ["PENDENTE", "PRODUCAO", "PRONTO", "ENTREGUE"];
    if (status && !statusValidos.includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use: PENDENTE, PRODUCAO, PRONTO ou ENTREGUE" },
        { status: 400 }
      );
    }

    const pedido = await db.pedido.update({
      where: { id },
      data: { status },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
          },
        },
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Primeiro excluir os itens do pedido
    await db.itemPedido.deleteMany({
      where: { pedidoId: id },
    });

    // Depois excluir o pedido
    await db.pedido.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pedido excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    return NextResponse.json(
      { error: "Erro ao excluir pedido" },
      { status: 500 }
    );
  }
}
