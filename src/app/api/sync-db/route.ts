// API para sincronizar o banco de dados - Padaria Paula
// Garante que a senha 2026 funcione

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Tentar buscar configuração
    let configuracao = await db.configuracao.findFirst();
    
    if (!configuracao) {
      // Criar configuração padrão
      configuracao = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '2026',
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Configuração criada com senha 2026!',
        action: 'created'
      });
    }
    
    // Garantir que a senha seja 2026
    await db.configuracao.update({
      where: { id: configuracao.id },
      data: { 
        senha: '2026',
        senhaAdmin: '2026'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Senha atualizada para 2026!',
      action: 'updated',
      configId: configuracao.id
    });
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
