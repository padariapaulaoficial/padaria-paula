import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Endpoint de diagnóstico - remove após resolver o problema
export async function GET() {
  const diagnostico: Record<string, any> = {
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV,
    banco: {
      status: 'verificando',
      erro: null as string | null,
      configExiste: false,
      senhaDefinida: false,
      senhaAdminDefinida: false,
    },
  };

  try {
    // Tenta conectar ao banco e buscar configuração
    const config = await db.configuracao.findFirst();
    
    diagnostico.banco.status = 'conectado';
    diagnostico.banco.configExiste = !!config;
    diagnostico.banco.senhaDefinida = !!config?.senha;
    diagnostico.banco.senhaAdminDefinida = !!config?.senhaAdmin;
    
    if (config) {
      diagnostico.banco.dados = {
        id: config.id,
        nomeLoja: config.nomeLoja,
        temSenha: !!config.senha,
        temSenhaAdmin: !!config.senhaAdmin,
        // NÃO retorna as senhas por segurança
      };
    }
  } catch (error: any) {
    diagnostico.banco.status = 'erro';
    diagnostico.banco.erro = error.message || 'Erro desconhecido';
    diagnostico.banco.codigo = error.code;
  }

  return NextResponse.json(diagnostico);
}
