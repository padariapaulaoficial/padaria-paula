// API de Backup - Padaria Paula
// Exporta e restaura o banco de dados completo em JSON

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Exportar backup completo do banco
export async function GET() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Buscar todos os dados
    const [
      configuracao,
      clientes,
      produtos,
      pedidos,
      orcamentos,
    ] = await Promise.all([
      db.configuracao.findFirst(),
      db.cliente.findMany({
        include: { _count: { select: { pedidos: true, orcamentos: true } } }
      }),
      db.produto.findMany(),
      db.pedido.findMany({
        include: {
          cliente: true,
          itens: { include: { produto: true } }
        }
      }),
      db.orcamento.findMany({
        include: {
          cliente: true,
          itens: { include: { produto: true } }
        }
      }),
    ]);

    // Montar objeto de backup
    const backup = {
      versao: '1.0',
      dataBackup: new Date().toISOString(),
      nomeSistema: 'Padaria Paula',
      dados: {
        configuracao,
        clientes,
        produtos,
        pedidos,
        orcamentos,
      },
      estatisticas: {
        totalClientes: clientes.length,
        totalProdutos: produtos.length,
        totalPedidos: pedidos.length,
        totalOrcamentos: orcamentos.length,
      }
    };

    // Retornar como download JSON
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-padaria-${timestamp}.json"`,
      },
    });
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return NextResponse.json(
      { error: 'Erro ao criar backup' },
      { status: 500 }
    );
  }
}

// POST - Restaurar backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dados, sobrescrever } = body;

    if (!dados) {
      return NextResponse.json(
        { error: 'Dados de backup não fornecidos' },
        { status: 400 }
      );
    }

    const resultados = {
      configuracao: false,
      clientes: 0,
      produtos: 0,
      pedidos: 0,
      orcamentos: 0,
    };

    // Se sobrescrever, limpar dados existentes
    if (sobrescrever) {
      await db.itemPedido.deleteMany();
      await db.itemOrcamento.deleteMany();
      await db.pedido.deleteMany();
      await db.orcamento.deleteMany();
      await db.cliente.deleteMany();
      await db.produto.deleteMany();
    }

    // Restaurar configuração
    if (dados.configuracao) {
      try {
        await db.configuracao.upsert({
          where: { id: dados.configuracao.id },
          update: dados.configuracao,
          create: dados.configuracao,
        });
        resultados.configuracao = true;
      } catch (e) {
        console.log('Configuração já existe ou erro:', e);
      }
    }

    // Restaurar produtos
    if (dados.produtos && Array.isArray(dados.produtos)) {
      for (const produto of dados.produtos) {
        try {
          await db.produto.upsert({
            where: { id: produto.id },
            update: produto,
            create: produto,
          });
          resultados.produtos++;
        } catch (e) {
          console.log('Erro ao restaurar produto:', e);
        }
      }
    }

    // Restaurar clientes
    if (dados.clientes && Array.isArray(dados.clientes)) {
      for (const cliente of dados.clientes) {
        try {
          await db.cliente.upsert({
            where: { id: cliente.id },
            update: {
              nome: cliente.nome,
              telefone: cliente.telefone,
              cpfCnpj: cliente.cpfCnpj,
              tipoPessoa: cliente.tipoPessoa,
              endereco: cliente.endereco,
              bairro: cliente.bairro,
            },
            create: cliente,
          });
          resultados.clientes++;
        } catch (e) {
          console.log('Erro ao restaurar cliente:', e);
        }
      }
    }

    // Restaurar pedidos
    if (dados.pedidos && Array.isArray(dados.pedidos)) {
      for (const pedido of dados.pedidos) {
        try {
          // Criar pedido sem os itens primeiro
          const { itens, cliente, ...pedidoData } = pedido;
          await db.pedido.upsert({
            where: { id: pedido.id },
            update: pedidoData,
            create: pedidoData,
          });
          
          // Criar itens do pedido
          if (itens && Array.isArray(itens)) {
            for (const item of itens) {
              try {
                await db.itemPedido.upsert({
                  where: { id: item.id },
                  update: item,
                  create: item,
                });
              } catch (e) {
                console.log('Erro ao restaurar item pedido:', e);
              }
            }
          }
          resultados.pedidos++;
        } catch (e) {
          console.log('Erro ao restaurar pedido:', e);
        }
      }
    }

    // Restaurar orçamentos
    if (dados.orcamentos && Array.isArray(dados.orcamentos)) {
      for (const orcamento of dados.orcamentos) {
        try {
          const { itens, cliente, ...orcamentoData } = orcamento;
          await db.orcamento.upsert({
            where: { id: orcamento.id },
            update: orcamentoData,
            create: orcamentoData,
          });
          
          if (itens && Array.isArray(itens)) {
            for (const item of itens) {
              try {
                await db.itemOrcamento.upsert({
                  where: { id: item.id },
                  update: item,
                  create: item,
                });
              } catch (e) {
                console.log('Erro ao restaurar item orçamento:', e);
              }
            }
          }
          resultados.orcamentos++;
        } catch (e) {
          console.log('Erro ao restaurar orçamento:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso!',
      resultados,
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return NextResponse.json(
      { error: 'Erro ao restaurar backup' },
      { status: 500 }
    );
  }
}
