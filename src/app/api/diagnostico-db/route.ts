// API de Diagnóstico do Banco de Dados - Padaria Paula
// Verifica se todas as tabelas e colunas existem

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const resultados: Record<string, unknown> = {};

    // Testar conexão com cada tabela
    try {
      const config = await db.configuracao.findFirst();
      resultados.configuracao = { ok: true, count: config ? 1 : 0 };
    } catch (e) {
      resultados.configuracao = { ok: false, error: String(e) };
    }

    try {
      const clientes = await db.cliente.count();
      resultados.cliente = { ok: true, count: clientes };
    } catch (e) {
      resultados.cliente = { ok: false, error: String(e) };
    }

    try {
      const produtos = await db.produto.count();
      resultados.produto = { ok: true, count: produtos };
    } catch (e) {
      resultados.produto = { ok: false, error: String(e) };
    }

    try {
      const pedidos = await db.pedido.count();
      resultados.pedido = { ok: true, count: pedidos };
    } catch (e) {
      resultados.pedido = { ok: false, error: String(e) };
    }

    try {
      const itens = await db.itemPedido.count();
      resultados.itemPedido = { ok: true, count: itens };
    } catch (e) {
      resultados.itemPedido = { ok: false, error: String(e) };
    }

    try {
      const orcamentos = await db.orcamento.count();
      resultados.orcamento = { ok: true, count: orcamentos };
    } catch (e) {
      resultados.orcamento = { ok: false, error: String(e) };
    }

    try {
      const bairros = await db.bairro.count();
      resultados.bairro = { ok: true, count: bairros };
    } catch (e) {
      resultados.bairro = { ok: false, error: String(e) };
    }

    // Verificar se há erros
    const temErros = Object.values(resultados).some(
      (r: any) => r.ok === false
    );

    return NextResponse.json({
      status: temErros ? 'erro' : 'ok',
      tabelas: resultados,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json(
      { status: 'erro', error: String(error) },
      { status: 500 }
    );
  }
}
