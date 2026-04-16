// API de Produtos - Padaria Paula
// CRUD completo de produtos (normais e especiais com tamanhos)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const categoria = searchParams.get('categoria');
    const tipoProduto = searchParams.get('tipoProduto');
    
    const where: Record<string, unknown> = {};
    
    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (tipoProduto) {
      where.tipoProduto = tipoProduto;
    }
    
    const produtos = await db.produto.findMany({
      where,
      orderBy: [
        { tipoProduto: 'asc' },
        { categoria: 'asc' },
        { nome: 'asc' },
      ],
    });
    
    // Parsear campos JSON
    const produtosFormatados = produtos.map(produto => ({
      ...produto,
      tamanhos: produto.tamanhos ? JSON.parse(produto.tamanhos) : null,
      precosTamanhos: produto.precosTamanhos ? JSON.parse(produto.precosTamanhos) : null,
    }));
    
    return NextResponse.json(produtosFormatados);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nome, 
      descricao, 
      tipoVenda, 
      valorUnit, 
      categoria, 
      ativo,
      tipoProduto,
      tamanhos,
      precosTamanhos,
      imagem
    } = body;
    
    if (!nome || !tipoVenda || valorUnit === undefined) {
      return NextResponse.json(
        { error: 'Nome, tipo de venda e valor são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Tipos válidos de venda
    const tiposValidos = ['KG', 'UNIDADE', 'ESPECIAL'];
    if (!tiposValidos.includes(tipoVenda)) {
      return NextResponse.json(
        { error: 'Tipo de venda inválido. Use: KG, UNIDADE ou ESPECIAL' },
        { status: 400 }
      );
    }
    
    // Validar tamanhos para produtos especiais
    if (tipoProduto === 'ESPECIAL') {
      if (!tamanhos || !Array.isArray(tamanhos) || tamanhos.length === 0) {
        return NextResponse.json(
          { error: 'Produtos especiais precisam ter tamanhos definidos' },
          { status: 400 }
        );
      }
      if (!precosTamanhos || typeof precosTamanhos !== 'object') {
        return NextResponse.json(
          { error: 'Produtos especiais precisam ter preços por tamanho' },
          { status: 400 }
        );
      }
    }
    
    const produto = await db.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        tipoVenda,
        valorUnit: parseFloat(valorUnit),
        categoria: categoria || 'Outros',
        ativo: ativo !== undefined ? ativo : true,
        tipoProduto: tipoProduto || 'NORMAL',
        tamanhos: tamanhos ? JSON.stringify(tamanhos) : null,
        precosTamanhos: precosTamanhos ? JSON.stringify(precosTamanhos) : null,
        imagem: imagem || null,
      },
    });
    
    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorDetails = error instanceof Error && 'code' in error ? ` (Código: ${(error as Record<string, unknown>).code})` : '';
    return NextResponse.json(
      { error: `Erro ao criar produto: ${errorMessage}${errorDetails}` },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tamanhos, precosTamanhos, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }
    
    // Validar tipo de venda se estiver sendo atualizado
    if (data.tipoVenda) {
      const tiposValidos = ['KG', 'UNIDADE', 'ESPECIAL'];
      if (!tiposValidos.includes(data.tipoVenda)) {
        return NextResponse.json(
          { error: 'Tipo de venda inválido. Use: KG, UNIDADE ou ESPECIAL' },
          { status: 400 }
        );
      }
    }
    
    if (data.valorUnit !== undefined) {
      data.valorUnit = parseFloat(data.valorUnit);
    }
    
    // Converter tamanhos e precosTamanhos para JSON string
    const updateData: Record<string, unknown> = { ...data };
    if (tamanhos !== undefined) {
      updateData.tamanhos = tamanhos ? JSON.stringify(tamanhos) : null;
    }
    if (precosTamanhos !== undefined) {
      updateData.precosTamanhos = precosTamanhos ? JSON.stringify(precosTamanhos) : null;
    }
    
    const produto = await db.produto.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorDetails = error instanceof Error && 'code' in error ? ` (Código: ${(error as Record<string, unknown>).code})` : '';
    return NextResponse.json(
      { error: `Erro ao atualizar produto: ${errorMessage}${errorDetails}` },
      { status: 500 }
    );
  }
}

// DELETE - Excluir produto permanentemente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se existem pedidos com este produto
    const itensRelacionados = await db.itemPedido.count({
      where: { produtoId: id }
    });
    
    if (itensRelacionados > 0) {
      // Se existem pedidos, apenas desativar
      const produto = await db.produto.update({
        where: { id },
        data: { ativo: false },
      });
      
      return NextResponse.json({ 
        message: 'Produto desativado (existem pedidos relacionados)',
        produto 
      });
    }
    
    // Se não há pedidos, excluir permanentemente
    await db.produto.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
}
