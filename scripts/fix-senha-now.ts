import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Buscar configuração atual
  const config = await prisma.configuracao.findFirst();
  
  if (!config) {
    console.log('Nenhuma configuração encontrada. Criando...');
    await prisma.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123',
        telefone: '(11) 99999-9999',
        senha: '2026',
        senhaAdmin: '2026',
      }
    });
    console.log('Configuração criada com senha 2026');
  } else {
    console.log('Configuração encontrada:');
    console.log('ID:', config.id);
    console.log('Senha atual:', config.senha);
    console.log('Senha Admin atual:', config.senhaAdmin);
    
    // Atualizar para 2026
    await prisma.configuracao.update({
      where: { id: config.id },
      data: { 
        senha: '2026',
        senhaAdmin: '2026'
      }
    });
    console.log('\nSenha atualizada para 2026!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
