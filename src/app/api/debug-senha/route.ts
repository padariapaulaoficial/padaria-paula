// API de Diagnóstico - Padaria Paula
// Mostra e corrige problemas de senha

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Buscar configuração atual
    const config = await db.configuracao.findFirst();
    
    if (!config) {
      // Criar configuração padrão
      const novaConfig = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '2026',
        }
      });
      
      return NextResponse.json({
        status: 'criado',
        message: 'Configuração criada com senha 2026',
        config: {
          id: novaConfig.id,
          senha: novaConfig.senha,
          senhaAdmin: novaConfig.senhaAdmin
        }
      });
    }
    
    return NextResponse.json({
      status: 'existente',
      config: {
        id: config.id,
        nomeLoja: config.nomeLoja,
        senha: config.senha,
        senhaAdmin: config.senhaAdmin,
        senhaLength: config.senha?.length,
        senhaAdminLength: config.senhaAdmin?.length,
        senhaBytes: config.senha ? [...config.senha].map(c => c.charCodeAt(0)) : null,
      }
    });
  } catch (error) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json({
      status: 'erro',
      error: String(error),
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Forçar atualização da senha para 2026
    const config = await db.configuracao.findFirst();
    
    if (!config) {
      const novaConfig = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '2026',
        }
      });
      
      return NextResponse.json({
        status: 'criado',
        message: 'Configuração criada com senha 2026',
        config: novaConfig
      });
    }
    
    const atualizado = await db.configuracao.update({
      where: { id: config.id },
      data: {
        senha: '2026',
        senhaAdmin: '2026'
      }
    });
    
    return NextResponse.json({
      status: 'atualizado',
      message: 'Senha atualizada para 2026',
      antes: {
        senha: config.senha,
        senhaAdmin: config.senhaAdmin
      },
      depois: {
        senha: atualizado.senha,
        senhaAdmin: atualizado.senhaAdmin
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({
      status: 'erro',
      error: String(error)
    }, { status: 500 });
  }
}
