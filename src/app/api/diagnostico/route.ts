import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Endpoint de diagnóstico para verificar senhas e duplicatas
export async function GET() {
  const diagnostico: Record<string, any> = {
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV,
    banco: {
      status: 'verificando',
      erro: null as string | null,
      configExiste: false,
      totalLinhas: 0,
      linhas: [] as any[],
    },
  };

  try {
    // Busca TODAS as linhas da tabela Configuracao
    const todasConfigs = await db.configuracao.findMany({
      select: {
        id: true,
        nomeLoja: true,
        senha: true,
        senhaAdmin: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    diagnostico.banco.status = 'conectado';
    diagnostico.banco.totalLinhas = todasConfigs.length;
    diagnostico.banco.configExiste = todasConfigs.length > 0;
    
    // Mostra informações de cada linha (sem expor senhas completamente)
    diagnostico.banco.linhas = todasConfigs.map((c, idx) => ({
      indice: idx + 1,
      id: c.id,
      nomeLoja: c.nomeLoja,
      senhaValor: c.senha,
      senhaAdminValor: c.senhaAdmin || '(null)',
      senhaTamanho: c.senha?.length || 0,
      senhaAdminTamanho: c.senhaAdmin?.length || 0,
      updatedAt: c.updatedAt,
    }));
    
    // Alerta se houver duplicatas
    if (todasConfigs.length > 1) {
      diagnostico.banco.alerta = `⚠️ DUPLICATAS DETECTADAS! ${todasConfigs.length} linhas na tabela Configuracao. Execute /api/limpar-duplicados para corrigir.`;
    }
  } catch (error: any) {
    diagnostico.banco.status = 'erro';
    diagnostico.banco.erro = error.message || 'Erro desconhecido';
    diagnostico.banco.codigo = error.code;
  }

  return NextResponse.json(diagnostico);
}
