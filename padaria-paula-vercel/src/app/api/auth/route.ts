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

    let config = await db.configuracao.findFirst();

    if (!config) {
      // Se não há configuração, cria com senhas padrão
      config = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '1234',
        },
      });
    }

    // Verifica qual senha usar baseado no tipo
    if (tipo === 'admin') {
      // Login de admin: usa senhaAdmin se configurada, senão usa senha do app
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

    console.log('PUT /api/auth - tipo:', tipo, 'senhaAtual length:', senhaAtual?.length, 'novaSenha length:', novaSenha?.length);

    // Validações
    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({
        success: false,
        error: 'Preencha todos os campos',
      });
    }

    if (senhaAtual.length !== 4 || novaSenha.length !== 4) {
      return NextResponse.json({
        success: false,
        error: 'A senha deve ter exatamente 4 dígitos',
      });
    }

    let config = await db.configuracao.findFirst();

    if (!config) {
      // Criar configuração padrão se não existir
      config = await db.configuracao.create({
        data: {
          nomeLoja: 'Padaria e Confeitaria Paula',
          endereco: 'Rua das Flores, 123',
          telefone: '(11) 99999-9999',
          senha: '2026',
          senhaAdmin: '1234',
        },
      });
    }

    // Determina qual senha verificar/alterar
    if (tipo === 'admin') {
      // Alterar senha do admin
      // senhaAdmin pode ser null, então usa senha como fallback
      const senhaCorreta = config.senhaAdmin || config.senha;
      
      console.log('Verificando senha admin:', { 
        senhaCorreta: senhaCorreta, 
        senhaAtualInformada: senhaAtual 
      });

      if (senhaAtual !== senhaCorreta) {
        return NextResponse.json({ 
          success: false, 
          error: 'Senha atual incorreta. Tente: ' + (config.senhaAdmin || config.senha) 
        });
      }

      // Atualizar senha admin
      const updated = await db.configuracao.update({
        where: { id: config.id },
        data: { senhaAdmin: novaSenha },
      });

      console.log('Senha admin atualizada:', { id: updated.id, novaSenhaAdmin: updated.senhaAdmin });

      return NextResponse.json({ 
        success: true, 
        message: 'Senha administrativa alterada com sucesso!' 
      });
    } else {
      // Alterar senha do app
      console.log('Verificando senha app:', { 
        senhaCorreta: config.senha, 
        senhaAtualInformada: senhaAtual 
      });

      if (senhaAtual !== config.senha) {
        return NextResponse.json({ 
          success: false, 
          error: 'Senha atual incorreta' 
        });
      }

      // Atualizar senha do app
      const updated = await db.configuracao.update({
        where: { id: config.id },
        data: { senha: novaSenha },
      });

      console.log('Senha do app atualizada:', { id: updated.id, novaSenha: updated.senha });

      return NextResponse.json({ 
        success: true, 
        message: 'Senha de acesso alterada com sucesso!' 
      });
    }
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') 
    }, { status: 500 });
  }
}
