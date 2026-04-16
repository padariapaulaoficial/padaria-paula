import { db } from '../src/lib/db';

async function main() {
  // Verificar se existe configuração
  const config = await db.configuracao.findFirst();
  
  if (config) {
    console.log('Configuração encontrada:', config);
    // Atualizar senha para 2026
    await db.configuracao.update({
      where: { id: config.id },
      data: { senha: '2026' }
    });
    console.log('Senha atualizada para: 2026');
  } else {
    // Criar configuração com senha 2026
    const nova = await db.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123',
        telefone: '(54) 3227-2838',
        cnpj: '12.345.678/0001-90',
        senha: '2026',
      }
    });
    console.log('Configuração criada:', nova);
  }
  
  // Verificar novamente
  const verificado = await db.configuracao.findFirst();
  console.log('Senha atual no banco:', verificado?.senha);
}

main().catch(console.error).finally(() => process.exit(0));
