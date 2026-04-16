// API para popular o banco com dados iniciais
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Criar configuração inicial
    const configExistente = await db.configuracao.findFirst();
    
    if (!configExistente) {
      await db.configuracao.create({
        data: {
          nomeLoja: "Padaria e Confeitaria Paula",
          endereco: "Rua das Flores, 123 - Centro",
          telefone: "(11) 99999-9999",
          cnpj: "00.000.000/0001-00",
          senha: "2026",
        },
      });
    }

    // Verificar se já existem produtos
    const produtosExistentes = await db.produto.count();
    
    if (produtosExistentes > 0) {
      return NextResponse.json({
        success: true,
        message: "Banco ja configurado!",
        senha: "2026",
        totalProdutos: produtosExistentes
      });
    }

    // Criar produtos iniciais
    await db.produto.createMany({
      data: [
        { nome: "Torta de Limao", descricao: "Deliciosa torta de limao", tipoVenda: "KG", valorUnit: 45.0, categoria: "Tortas", ativo: true },
        { nome: "Torta de Chocolate", descricao: "Torta de chocolate belga", tipoVenda: "KG", valorUnit: 50.0, categoria: "Tortas", ativo: true },
        { nome: "Torta de Morango", descricao: "Torta com morangos frescos", tipoVenda: "KG", valorUnit: 48.0, categoria: "Tortas", ativo: true },
        { nome: "Torta Holandesa", descricao: "Tradicional torta holandesa", tipoVenda: "KG", valorUnit: 55.0, categoria: "Tortas", ativo: true },
        { nome: "Brigadeiro", descricao: "Brigadeiro tradicional", tipoVenda: "CENTO", valorUnit: 25.0, categoria: "Docinhos", ativo: true },
        { nome: "Beijinho", descricao: "Beijinho de coco", tipoVenda: "CENTO", valorUnit: 25.0, categoria: "Docinhos", ativo: true },
        { nome: "Cajuzinho", descricao: "Docinho de amendoim", tipoVenda: "CENTO", valorUnit: 28.0, categoria: "Docinhos", ativo: true },
        { nome: "Olho de Sogra", descricao: "Ameixa com coco", tipoVenda: "CENTO", valorUnit: 28.0, categoria: "Docinhos", ativo: true },
        { nome: "Palha Italiana", descricao: "Biscoito com leite condensado", tipoVenda: "CENTO", valorUnit: 24.0, categoria: "Docinhos", ativo: true },
        { nome: "Coxinha", descricao: "Coxinha de frango cremosa", tipoVenda: "CENTO", valorUnit: 45.0, categoria: "Salgadinhos", ativo: true },
        { nome: "Risole de Queijo", descricao: "Risole recheado", tipoVenda: "CENTO", valorUnit: 40.0, categoria: "Salgadinhos", ativo: true },
        { nome: "Enroladinho", descricao: "Massa crocante com salsicha", tipoVenda: "CENTO", valorUnit: 42.0, categoria: "Salgadinhos", ativo: true },
        { nome: "Empadinha", descricao: "Empadinha de frango", tipoVenda: "CENTO", valorUnit: 48.0, categoria: "Salgadinhos", ativo: true },
        { nome: "Kibe", descricao: "Kibe frito", tipoVenda: "CENTO", valorUnit: 40.0, categoria: "Salgadinhos", ativo: true },
        { nome: "Coxinha Unitaria", descricao: "Coxinha grande", tipoVenda: "UNIDADE", valorUnit: 5.0, categoria: "Salgados", ativo: true },
        { nome: "Pao de Queijo", descricao: "Pao de queijo mineiro", tipoVenda: "UNIDADE", valorUnit: 3.5, categoria: "Salgados", ativo: true },
        { nome: "Croissant", descricao: "Croissant de manteiga", tipoVenda: "UNIDADE", valorUnit: 6.0, categoria: "Salgados", ativo: true },
        { nome: "Esfiha", descricao: "Esfiha de carne", tipoVenda: "UNIDADE", valorUnit: 4.0, categoria: "Salgados", ativo: true },
        { nome: "Pao Frances", descricao: "Pao frances tradicional", tipoVenda: "KG", valorUnit: 16.0, categoria: "Paes", ativo: true },
        { nome: "Pao de Forma", descricao: "Pao de forma caseiro", tipoVenda: "UNIDADE", valorUnit: 12.0, categoria: "Paes", ativo: true },
        { nome: "Pao Integral", descricao: "Pao integral com graos", tipoVenda: "KG", valorUnit: 22.0, categoria: "Paes", ativo: true },
        { nome: "Bolo de Cenoura", descricao: "Com cobertura de chocolate", tipoVenda: "KG", valorUnit: 35.0, categoria: "Bolos", ativo: true },
        { nome: "Bolo de Fuba", descricao: "Bolo de fuba com goiabada", tipoVenda: "KG", valorUnit: 30.0, categoria: "Bolos", ativo: true },
        { nome: "Bolo de Laranja", descricao: "Bolo fofinho de laranja", tipoVenda: "KG", valorUnit: 32.0, categoria: "Bolos", ativo: true },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Banco configurado com sucesso!",
      senha: "2026",
      instrucoes: "Va para a pagina inicial e entre com a senha: 2026"
    });

  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: "Tente acessar /api/setup primeiro para criar as tabelas"
    }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
