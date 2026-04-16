// API Route para Seed de dados iniciais
// Popula o banco com produtos de exemplo

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - Executar seed
export async function POST() {
  try {
    // Verificar se já existem produtos
    const produtosExistentes = await db.produto.count();

    if (produtosExistentes > 0) {
      return NextResponse.json({
        message: "Banco já possui produtos cadastrados",
        totalProdutos: produtosExistentes,
      });
    }

    // Criar produtos iniciais
    const produtos = await db.produto.createMany({
      data: [
        // Tortas
        {
          nome: "Torta de Limão",
          descricao: "Deliciosa torta de limão com merengue",
          tipoVenda: "KG",
          valorUnit: 45.0,
          categoria: "Tortas",
          ativo: true,
        },
        {
          nome: "Torta de Chocolate",
          descricao: "Torta de chocolate belga com cobertura brilhante",
          tipoVenda: "KG",
          valorUnit: 50.0,
          categoria: "Tortas",
          ativo: true,
        },
        {
          nome: "Torta de Morango",
          descricao: "Torta com morangos frescos e creme",
          tipoVenda: "KG",
          valorUnit: 48.0,
          categoria: "Tortas",
          ativo: true,
        },
        // Docinhos
        {
          nome: "Brigadeiro",
          descricao: "Brigadeiro tradicional com granulado",
          tipoVenda: "UNIDADE",
          valorUnit: 0.25,
          categoria: "Docinhos",
          ativo: true,
        },
        {
          nome: "Beijinho",
          descricao: "Beijinho de coco com açúcar cristal",
          tipoVenda: "UNIDADE",
          valorUnit: 0.25,
          categoria: "Docinhos",
          ativo: true,
        },
        {
          nome: "Cajuzinho",
          descricao: "Docinho de amendoin com chocolate",
          tipoVenda: "UNIDADE",
          valorUnit: 0.28,
          categoria: "Docinhos",
          ativo: true,
        },
        {
          nome: "Olho de Sogra",
          descricao: "Doce com nozes e coco",
          tipoVenda: "UNIDADE",
          valorUnit: 0.30,
          categoria: "Docinhos",
          ativo: true,
        },
        // Salgadinhos
        {
          nome: "Coxinha",
          descricao: "Coxinha de frango com catupiry",
          tipoVenda: "UNIDADE",
          valorUnit: 5.0,
          categoria: "Salgadinhos",
          ativo: true,
        },
        {
          nome: "Risole",
          descricao: "Risole de queijo e presunto",
          tipoVenda: "UNIDADE",
          valorUnit: 4.5,
          categoria: "Salgadinhos",
          ativo: true,
        },
        {
          nome: "Enroladinho de Salsicha",
          descricao: "Massa frita com salsicha",
          tipoVenda: "UNIDADE",
          valorUnit: 4.0,
          categoria: "Salgadinhos",
          ativo: true,
        },
        {
          nome: "Empada",
          descricao: "Empada de frango com palmito",
          tipoVenda: "UNIDADE",
          valorUnit: 5.5,
          categoria: "Salgadinhos",
          ativo: true,
        },
        // Pães
        {
          nome: "Pão de Queijo",
          descricao: "Pão de queijo mineiro",
          tipoVenda: "KG",
          valorUnit: 40.0,
          categoria: "Pães",
          ativo: true,
        },
        {
          nome: "Pão Francês",
          descricao: "Pão francês quentinho",
          tipoVenda: "KG",
          valorUnit: 18.0,
          categoria: "Pães",
          ativo: true,
        },
        {
          nome: "Croissant",
          descricao: "Croissant de manteiga",
          tipoVenda: "UNIDADE",
          valorUnit: 6.0,
          categoria: "Pães",
          ativo: true,
        },
        // Bolos
        {
          nome: "Bolo de Cenoura",
          descricao: "Bolo de cenoura com cobertura de chocolate",
          tipoVenda: "KG",
          valorUnit: 35.0,
          categoria: "Bolos",
          ativo: true,
        },
        {
          nome: "Bolo de Fubá",
          descricao: "Bolo de fubá com queijo",
          tipoVenda: "KG",
          valorUnit: 30.0,
          categoria: "Bolos",
          ativo: true,
        },
      ],
    });

    // Criar configuração inicial
    const configExistente = await db.configuracao.findFirst();
    if (!configExistente) {
      await db.configuracao.create({
        data: {
          nomeLoja: "Padaria Paula",
          endereco: "Rua das Flores, 123",
          telefone: "(11) 99999-9999",
          cnpj: "12.345.678/0001-90",
        },
      });
    }

    return NextResponse.json({
      message: "Seed executado com sucesso!",
      totalProdutos: produtos.count,
    });
  } catch (error) {
    console.error("Erro ao executar seed:", error);
    return NextResponse.json(
      { error: "Erro ao executar seed" },
      { status: 500 }
    );
  }
}
