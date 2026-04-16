import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verificar autenticação
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'admin' ou null para app normal

    const config = await db.configuracao.findFirst();

    if (!config) {
      return NextResponse.json({ autenticado: false });
    }

    // Retorna apenas se o sistema requer senha
    return NextResponse.json({
      autenticado: false,
      requerSenha: !!config.senha,
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return NextResponse.json({ autenticado: false }, { status: 500 });
  }
}

// Login (senha diferente para app e admin)
export async function POST(request: NextRequest) {
  try {
    const { senha, tipo } = await request.json();

    if (!senha || senha.length !== 4) {
      return NextResponse.json({
        autenticado: false,
        error: 'Senha deve ter 4 dígitos',
      });
    }

    const config = await db.configuracao.findFirst();

    if (!config) {
      // Se não há configuração, cria com senha padrão
      await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '2026',
        },
      });

      // Verifica se a senha informada é a padrão
      if (senha === '2026') {
        return NextResponse.json({ autenticado: true });
      }

      return NextResponse.json({ autenticado: false });
    }

    // Verifica qual senha usar baseado no tipo
    if (tipo === 'admin') {
      // Login de admin: usa senhaAdmin se configurada, senão usa senha padrão
      const senhaCorreta = config.senhaAdmin || config.senha;
      if (senha === senhaCorreta) {
        return NextResponse.json({ autenticado: true });
      }
    } else {
      // Login do app: usa apenas senha padrão
      if (senha === config.senha) {
        return NextResponse.json({ autenticado: true });
      }
    }

    return NextResponse.json({ autenticado: false });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ autenticado: false }, { status: 500 });
  }
}

// Alterar senha
export async function PUT(request: NextRequest) {
  try {
    const { senhaAtual, novaSenha, tipo } = await request.json();

    console.log('[AUTH] Tentativa de alteração de senha:', {
      tipo: tipo || 'app',
      temSenhaAtual: !!senhaAtual,
      temNovaSenha: !!novaSenha,
      novaSenhaTamanho: novaSenha?.length
    });

    if (!senhaAtual || !novaSenha || novaSenha.length !== 4) {
      return NextResponse.json({
        success: false,
        error: 'Senha deve ter 4 dígitos',
      });
    }

    const config = await db.configuracao.findFirst();

    if (!config) {
      console.log('[AUTH] Configuração não encontrada');
      return NextResponse.json({ success: false, error: 'Configuração não encontrada' });
    }

    console.log('[AUTH] Config encontrada:', {
      id: config.id,
      temSenha: !!config.senha,
      temSenhaAdmin: !!config.senhaAdmin
    });

    // Determina qual senha verificar/alterar
    if (tipo === 'admin') {
      // Alterar senha do admin
      const senhaCorreta = config.senhaAdmin || config.senha;
      
      console.log('[AUTH] Verificando senha admin:', {
        senhaAtualFornecida: senhaAtual,
        senhaCorretaEsperada: senhaCorreta,
        confere: senhaAtual === senhaCorreta
      });
      
      if (senhaAtual !== senhaCorreta) {
        return NextResponse.json({ success: false, error: 'Senha atual incorreta' });
      }

      const resultado = await db.configuracao.update({
        where: { id: config.id },
        data: { senhaAdmin: novaSenha },
      });
      
      console.log('[AUTH] Senha admin atualizada:', {
        id: resultado.id,
        novaSenhaAdmin: resultado.senhaAdmin
      });

      return NextResponse.json({ success: true, message: 'Senha administrativa alterada com sucesso' });
    } else {
      // Alterar senha do app
      console.log('[AUTH] Verificando senha app:', {
        senhaAtualFornecida: senhaAtual,
        senhaCorretaEsperada: config.senha,
        confere: senhaAtual === config.senha
      });
      
      if (senhaAtual !== config.senha) {
        return NextResponse.json({ success: false, error: 'Senha atual incorreta' });
      }

      const resultado = await db.configuracao.update({
        where: { id: config.id },
        data: { senha: novaSenha },
      });
      
      console.log('[AUTH] Senha app atualizada:', {
        id: resultado.id,
        novaSenha: resultado.senha
      });

      return NextResponse.json({ success: true, message: 'Senha de acesso alterada com sucesso' });
    }
  } catch (error: any) {
    console.error('[AUTH] Erro ao alterar senha:', error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
