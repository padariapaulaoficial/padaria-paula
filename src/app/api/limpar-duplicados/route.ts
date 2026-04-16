// API para limpar duplicados na tabela Configuracao
// Preserva as senhas existentes

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Buscar TODAS as configurações
    const todasConfiguracoes = await db.$queryRaw<any[]>`
      SELECT id, "nomeLoja", senha, "senhaAdmin", "createdAt"
      FROM "Configuracao"
      ORDER BY "createdAt" DESC
    `;

    const total = todasConfiguracoes.length;

    if (total === 0) {
      // Criar configuração padrão
      await db.$executeRawUnsafe(`
        INSERT INTO "Configuracao" (id, "nomeLoja", endereco, telefone, senha, "senhaAdmin", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Padaria e Confeitaria Paula', 'Rua das Flores, 123', '(11) 99999-9999', '2026', '2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Configuração criada',
        total: 0,
        acao: 'criado'
      });
    }

    if (total === 1) {
      // Não há duplicados
      const config = todasConfiguracoes[0];
      
      // Verificar se senhaAdmin está null e corrigir
      if (!config.senhaAdmin) {
        await db.$executeRawUnsafe(`
          UPDATE "Configuracao"
          SET "senhaAdmin" = senha
          WHERE id = '${config.id}'
        `);
        
        return NextResponse.json({
          success: true,
          message: 'senhaAdmin estava null, foi sincronizado com senha',
          total: total,
          acao: 'senhaAdmin_sincronizado'
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Nenhum problema encontrado',
        total: total,
        senhaAtual: config.senha ? 'definida' : 'null',
        senhaAdminAtual: config.senhaAdmin ? 'definida' : 'null',
        acao: 'nenuma_acao_necessaria'
      });
    }

    // Há duplicados - manter apenas o mais recente
    const manter = todasConfiguracoes[0];
    const manterId = manter.id;
    
    // Remover todos exceto o primeiro (mais recente)
    for (let i = 1; i < todasConfiguracoes.length; i++) {
      try {
        await db.$executeRawUnsafe(`DELETE FROM "Configuracao" WHERE id = '${todasConfiguracoes[i].id}'`);
      } catch (e) {
        console.log('Erro ao remover duplicado:', e);
      }
    }

    // Garantir que senhaAdmin não seja null
    if (!manter.senhaAdmin) {
      await db.$executeRawUnsafe(`
        UPDATE "Configuracao"
        SET "senhaAdmin" = senha
        WHERE id = '${manterId}'
      `);
    }

    return NextResponse.json({
      success: true,
      message: `${total - 1} duplicados removidos`,
      totalAnterior: total,
      mantido: manterId,
      senhaPreservada: manter.senha ? 'sim' : 'nao',
      senhaAdminPreservada: manter.senhaAdmin ? 'sim' : 'nao',
      removidos: total - 1,
      acao: 'duplicados_removidos_senhas_preservadas'
    });

  } catch (error: any) {
    console.error('Erro ao limpar duplicados:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
