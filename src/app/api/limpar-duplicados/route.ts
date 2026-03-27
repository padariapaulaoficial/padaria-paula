// API para limpar duplicados na tabela Configuracao
// e garantir que a senha admin funcione

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
      // Não há duplicados, apenas garantir que a senha está correta
      await db.$executeRawUnsafe(`
        UPDATE "Configuracao"
        SET senha = '2026', "senhaAdmin" = '2026'
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Nenhum duplicado encontrado, senhas atualizadas',
        total: total,
        acao: 'senhas_atualizadas'
      });
    }

    // Há duplicados - manter apenas o mais recente
    const manterId = todasConfiguracoes[0].id;
    
    // Remover todos exceto o primeiro (mais recente)
    for (let i = 1; i < todasConfiguracoes.length; i++) {
      try {
        await db.$executeRawUnsafe(`DELETE FROM "Configuracao" WHERE id = '${todasConfiguracoes[i].id}'`);
      } catch (e) {
        console.log('Erro ao remover duplicado:', e);
      }
    }

    // Garantir que a senha está correta
    await db.$executeRawUnsafe(`
      UPDATE "Configuracao"
      SET senha = '2026', "senhaAdmin" = '2026'
      WHERE id = '${manterId}'
    `);

    return NextResponse.json({
      success: true,
      message: `${total - 1} duplicados removidos`,
      totalAnterior: total,
      mantido: manterId,
      removidos: total - 1,
      acao: 'duplicados_removidos_e_senhas_atualizadas'
    });

  } catch (error: any) {
    console.error('Erro ao limpar duplicados:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
