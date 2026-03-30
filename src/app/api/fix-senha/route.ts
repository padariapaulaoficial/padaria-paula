// API para corrigir a senha de acesso
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Buscar configuração existente
    let config = await db.$queryRaw<any[]>`
      SELECT * FROM "Configuracao" LIMIT 1
    `;

    if (!config || config.length === 0) {
      // Criar configuração com senha padrão
      await db.$executeRaw`
        INSERT INTO "Configuracao" (id, "nomeLoja", endereco, telefone, senha, "senhaAdmin")
        VALUES (gen_random_uuid(), 'Padaria e Confeitaria Paula', 'Rua das Flores, 123', '(11) 99999-9999', '2026', '2026')
      `;

      return NextResponse.json({
        success: true,
        message: "Configuração criada com sucesso!",
        senha: "2026",
        action: "created"
      });
    }

    // Atualizar senha para 2026
    await db.$executeRaw`
      UPDATE "Configuracao" 
      SET senha = '2026', "senhaAdmin" = '2026'
      WHERE id = ${config[0].id}
    `;

    return NextResponse.json({
      success: true,
      message: "Senha corrigida com sucesso!",
      senha: "2026",
      action: "updated",
      configId: config[0].id
    });

  } catch (error: any) {
    console.error("Erro ao corrigir senha:", error);
    
    // Se a tabela não existe, criar
    if (error.message?.includes('does not exist')) {
      try {
        // Criar tabela Configuracao
        await db.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Configuracao" (
            "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
            "nomeLoja" TEXT NOT NULL DEFAULT 'Padaria e Confeitaria Paula',
            "endereco" TEXT NOT NULL DEFAULT 'Rua das Flores, 123',
            "telefone" TEXT NOT NULL DEFAULT '(11) 99999-9999',
            "cnpj" TEXT NOT NULL DEFAULT '',
            "logoUrl" TEXT,
            "senha" TEXT NOT NULL DEFAULT '2026',
            "senhaAdmin" TEXT DEFAULT '2026',
            "mensagemWhatsApp" TEXT,
            "mensagemOrcamento" TEXT,
            "mensagemProntoRetirada" TEXT,
            "mensagemProntoEntrega" TEXT,
            "mensagemAprovacao" TEXT,
            "mensagemRevisao" TEXT,
            "diasAlertaProducao" INTEGER DEFAULT 3,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Inserir configuração padrão
        await db.$executeRawUnsafe(`
          INSERT INTO "Configuracao" ("nomeLoja", endereco, telefone, senha, "senhaAdmin")
          VALUES ('Padaria e Confeitaria Paula', 'Rua das Flores, 123', '(11) 99999-9999', '2026', '2026')
        `);

        return NextResponse.json({
          success: true,
          message: "Tabela criada e configuração inserida!",
          senha: "2026",
          action: "table_created"
        });
      } catch (createError: any) {
        return NextResponse.json({
          success: false,
          error: createError.message,
          action: "create_failed"
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST para testar login
export async function POST(request: Request) {
  try {
    const { senha } = await request.json();

    // Buscar configuração
    const config = await db.$queryRaw<any[]>`
      SELECT senha FROM "Configuracao" LIMIT 1
    `;

    if (!config || config.length === 0) {
      return NextResponse.json({
        autenticado: false,
        error: "Configuração não encontrada"
      });
    }

    const senhaCorreta = config[0].senha === senha;

    return NextResponse.json({
      autenticado: senhaCorreta,
      senhaBanco: config[0].senha,
      senhaEnviada: senha
    });

  } catch (error: any) {
    return NextResponse.json({
      autenticado: false,
      error: error.message
    }, { status: 500 });
  }
}
