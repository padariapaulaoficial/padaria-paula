// API de Exportação Excel - Padaria Paula
// Exporta clientes, produtos e vendas para formato Excel (CSV compatível)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Função para converter dados em CSV
function arrayToCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.join(';');
  const rows = data.map(item => 
    headers.map(h => {
      const value = item[h];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(';')) {
        return `"${value}"`;
      }
      return String(value);
    }).join(';')
  );
  return [headerRow, ...rows].join('\n');
}

// GET - Exportar dados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'clientes'; // clientes, produtos, vendas, completo
    const dataInicio = searchParams.get('inicio');
    const dataFim = searchParams.get('fim');
    
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = '';
    let filename = '';

    switch (tipo) {
      case 'clientes': {
        const clientes = await db.cliente.findMany({
          include: {
            _count: { select: { pedidos: true } }
          },
          orderBy: { nome: 'asc' }
        });

        const dados = clientes.map(c => ({
          nome: c.nome,
          telefone: c.telefone,
          cpfCnpj: c.cpfCnpj || '',
          tipoPessoa: c.tipoPessoa,
          endereco: c.endereco || '',
          bairro: c.bairro || '',
          totalPedidos: c._count?.pedidos || 0,
          cadastradoEm: new Date(c.createdAt).toLocaleDateString('pt-BR')
        }));

        csvContent = arrayToCSV(dados, ['nome', 'telefone', 'cpfCnpj', 'tipoPessoa', 'endereco', 'bairro', 'totalPedidos', 'cadastradoEm']);
        filename = `clientes-padaria-${timestamp}.csv`;
        break;
      }

      case 'produtos': {
        const produtos = await db.produto.findMany({
          orderBy: [{ categoria: 'asc' }, { nome: 'asc' }]
        });

        const dados = produtos.map(p => ({
          nome: p.nome,
          categoria: p.categoria || 'Sem categoria',
          tipoVenda: p.tipoVenda,
          tipoProduto: p.tipoProduto,
          valorUnit: p.valorUnit.toFixed(2).replace('.', ','),
          ativo: p.ativo ? 'Sim' : 'Não',
          tamanhos: p.tamanhos || '',
          cadastradoEm: new Date(p.createdAt).toLocaleDateString('pt-BR')
        }));

        csvContent = arrayToCSV(dados, ['nome', 'categoria', 'tipoVenda', 'tipoProduto', 'valorUnit', 'ativo', 'tamanhos', 'cadastradoEm']);
        filename = `produtos-padaria-${timestamp}.csv`;
        break;
      }

      case 'vendas': {
        const where: Record<string, unknown> = {};
        
        if (dataInicio) {
          const inicio = new Date(dataInicio);
          inicio.setHours(0, 0, 0, 0);
          where.createdAt = { ...where.createdAt as object, gte: inicio };
        }
        
        if (dataFim) {
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          where.createdAt = { ...where.createdAt as object, lte: fim };
        }

        const pedidos = await db.pedido.findMany({
          where,
          include: {
            cliente: true,
            itens: { include: { produto: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        const dados = pedidos.map(p => ({
          numero: p.numero.toString().padStart(5, '0'),
          cliente: p.cliente?.nome || 'N/A',
          telefone: p.cliente?.telefone || '',
          tipoEntrega: p.tipoEntrega === 'RETIRA' ? 'Cliente Retira' : 'Tele Entrega',
          dataEntrega: p.dataEntrega ? new Date(p.dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR') : '',
          horario: p.horarioEntrega || '',
          total: p.total.toFixed(2).replace('.', ','),
          status: p.status,
          itens: p.itens.length,
          dataPedido: new Date(p.createdAt).toLocaleDateString('pt-BR'),
          horaPedido: new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));

        csvContent = arrayToCSV(dados, ['numero', 'cliente', 'telefone', 'tipoEntrega', 'dataEntrega', 'horario', 'total', 'status', 'itens', 'dataPedido', 'horaPedido']);
        filename = `vendas-padaria-${timestamp}.csv`;
        break;
      }

      case 'completo': {
        // Exportar tudo em um único arquivo com múltiplas seções
        const [clientes, produtos, pedidos] = await Promise.all([
          db.cliente.findMany({ orderBy: { nome: 'asc' } }),
          db.produto.findMany({ orderBy: { nome: 'asc' } }),
          db.pedido.findMany({
            include: { cliente: true, itens: { include: { produto: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500
          })
        ]);

        // Seção Clientes
        csvContent = '=== CLIENTES ===\n';
        csvContent += arrayToCSV(
          clientes.map(c => ({
            nome: c.nome,
            telefone: c.telefone,
            cpfCnpj: c.cpfCnpj || '',
            endereco: c.endereco || '',
            bairro: c.bairro || ''
          })),
          ['nome', 'telefone', 'cpfCnpj', 'endereco', 'bairro']
        );

        // Seção Produtos
        csvContent += '\n\n=== PRODUTOS ===\n';
        csvContent += arrayToCSV(
          produtos.map(p => ({
            nome: p.nome,
            categoria: p.categoria || '',
            tipoVenda: p.tipoVenda,
            valor: p.valorUnit.toFixed(2).replace('.', ','),
            ativo: p.ativo ? 'Sim' : 'Não'
          })),
          ['nome', 'categoria', 'tipoVenda', 'valor', 'ativo']
        );

        // Seção Vendas
        csvContent += '\n\n=== VENDAS ===\n';
        csvContent += arrayToCSV(
          pedidos.map(p => ({
            numero: p.numero.toString().padStart(5, '0'),
            cliente: p.cliente?.nome || '',
            total: p.total.toFixed(2).replace('.', ','),
            status: p.status,
            data: new Date(p.createdAt).toLocaleDateString('pt-BR')
          })),
          ['numero', 'cliente', 'total', 'status', 'data']
        );

        filename = `exportacao-completa-padaria-${timestamp}.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Tipo de exportação inválido' }, { status: 400 });
    }

    // Adicionar BOM para UTF-8 (compatibilidade com Excel em português)
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados' },
      { status: 500 }
    );
  }
}
