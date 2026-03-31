// API de Clientes - Padaria Paula
// CRUD completo de clientes com validação de unicidade

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Função para normalizar telefone (remove formatação)
function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D/g, '');
}

// Função para normalizar nome para comparação (case insensitive, sem acentos)
function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')            // Normaliza espaços
    .trim();
}

// GET - Listar todos os clientes ou buscar por telefone
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telefone = searchParams.get('telefone');
    const busca = searchParams.get('busca');
    
    if (telefone) {
      // Buscar cliente por telefone normalizado
      const telefoneNormalizado = normalizarTelefone(telefone);
      const cliente = await db.cliente.findFirst({
        where: { telefone: telefoneNormalizado },
      });
      return NextResponse.json(cliente);
    }
    
    if (busca) {
      // Buscar clientes por nome ou telefone
      const clientes = await db.cliente.findMany({
        where: {
          OR: [
            { nome: { contains: busca } },
            { telefone: { contains: busca.replace(/\D/g, '') } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          _count: {
            select: { pedidos: true }
          }
        }
      });
      return NextResponse.json(clientes);
    }
    
    // Listar todos os clientes (últimos 100)
    const clientes = await db.cliente.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: {
          select: { pedidos: true }
        }
      }
    });
    
    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, telefone, cpfCnpj, tipoPessoa, endereco, bairro } = body;
    
    // Validações obrigatórias
    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Normalizar telefone
    const telefoneNormalizado = normalizarTelefone(telefone);
    
    if (telefoneNormalizado.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Inclua o DDD.' },
        { status: 400 }
      );
    }
    
    // Verificar se telefone já existe
    const telefoneExistente = await db.cliente.findFirst({
      where: { telefone: telefoneNormalizado },
    });
    
    if (telefoneExistente) {
      return NextResponse.json(
        { error: `Já existe um cliente com este telefone: ${telefoneExistente.nome}` },
        { status: 400 }
      );
    }
    
    // Verificar se já existe cliente com nome similar (case insensitive)
    const nomeNormalizado = normalizarNome(nome);
    const clientesExistentes = await db.cliente.findMany();
    const clienteComNomeSimilar = clientesExistentes.find(c => 
      normalizarNome(c.nome) === nomeNormalizado
    );
    
    if (clienteComNomeSimilar) {
      return NextResponse.json(
        { error: `Já existe um cliente com nome similar: ${clienteComNomeSimilar.nome} (Telefone: ${clienteComNomeSimilar.telefone})` },
        { status: 400 }
      );
    }
    
    // Verificar se CPF/CNPJ já existe (se informado)
    if (cpfCnpj && cpfCnpj.trim() !== '') {
      const cpfCnpjNormalizado = cpfCnpj.replace(/\D/g, '');
      const cpfCnpjExistente = await db.cliente.findFirst({
        where: { cpfCnpj: cpfCnpjNormalizado },
      });
      
      if (cpfCnpjExistente) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este CPF/CNPJ' },
          { status: 400 }
        );
      }
    }
    
    const cliente = await db.cliente.create({
      data: {
        nome: nome.trim(),
        telefone: telefoneNormalizado,
        cpfCnpj: cpfCnpj && cpfCnpj.trim() !== '' ? cpfCnpj.replace(/\D/g, '') : null,
        tipoPessoa: tipoPessoa || 'CPF',
        endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null,
        bairro: bairro && bairro.trim() !== '' ? bairro.trim() : null,
      },
    });
    
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    
    // Erro de constraint única do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const campo = (error.meta?.target as string[])?.[0] || 'campo';
        return NextResponse.json(
          { error: `Já existe um cliente com este ${campo}` },
          { status: 400 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao criar cliente: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, telefone, cpfCnpj, tipoPessoa, endereco, bairro } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Normalizar telefone
    const telefoneNormalizado = normalizarTelefone(telefone);
    
    if (telefoneNormalizado.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido. Inclua o DDD.' },
        { status: 400 }
      );
    }
    
    // Verificar se telefone já existe em outro cliente
    const telefoneExistente = await db.cliente.findFirst({
      where: {
        telefone: telefoneNormalizado,
        NOT: { id },
      },
    });
    
    if (telefoneExistente) {
      return NextResponse.json(
        { error: `Já existe outro cliente com este telefone: ${telefoneExistente.nome}` },
        { status: 400 }
      );
    }
    
    // Verificar se já existe cliente com nome similar (case insensitive)
    const nomeNormalizado = normalizarNome(nome);
    const clientesExistentes = await db.cliente.findMany({
      where: { NOT: { id } }
    });
    const clienteComNomeSimilar = clientesExistentes.find(c => 
      normalizarNome(c.nome) === nomeNormalizado
    );
    
    if (clienteComNomeSimilar) {
      return NextResponse.json(
        { error: `Já existe outro cliente com nome similar: ${clienteComNomeSimilar.nome}` },
        { status: 400 }
      );
    }
    
    // Verificar se CPF/CNPJ já existe em outro cliente (se informado)
    if (cpfCnpj && cpfCnpj.trim() !== '') {
      const cpfCnpjNormalizado = cpfCnpj.replace(/\D/g, '');
      const cpfCnpjExistente = await db.cliente.findFirst({
        where: {
          cpfCnpj: cpfCnpjNormalizado,
          NOT: { id },
        },
      });
      
      if (cpfCnpjExistente) {
        return NextResponse.json(
          { error: 'Já existe outro cliente com este CPF/CNPJ' },
          { status: 400 }
        );
      }
    }
    
    const cliente = await db.cliente.update({
      where: { id },
      data: {
        nome: nome.trim(),
        telefone: telefoneNormalizado,
        cpfCnpj: cpfCnpj && cpfCnpj.trim() !== '' ? cpfCnpj.replace(/\D/g, '') : null,
        tipoPessoa: tipoPessoa || 'CPF',
        endereco: endereco && endereco.trim() !== '' ? endereco.trim() : null,
        bairro: bairro && bairro.trim() !== '' ? bairro.trim() : null,
      },
    });
    
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    
    // Erro de constraint única do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const campo = (error.meta?.target as string[])?.[0] || 'campo';
        return NextResponse.json(
          { error: `Já existe outro cliente com este ${campo}` },
          { status: 400 }
        );
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: `Erro ao atualizar cliente: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se existem pedidos para este cliente
    const pedidosRelacionados = await db.pedido.count({
      where: { clienteId: id }
    });
    
    if (pedidosRelacionados > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir. Este cliente possui pedidos registrados.' },
        { status: 400 }
      );
    }
    
    // Excluir cliente
    await db.cliente.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cliente' },
      { status: 500 }
    );
  }
}
