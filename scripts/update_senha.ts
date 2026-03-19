import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracao.findFirst();
  
  if (config) {
    await prisma.configuracao.update({
      where: { id: config.id },
      data: { 
        senha: '2026',
        nomeLoja: 'Padaria e Confeitaria Paula'
      },
    });
    console.log('Senha atualizada para 2026');
  } else {
    await prisma.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123',
        telefone: '(11) 99999-9999',
        senha: '2026',
      },
    });
    console.log('Configuração criada com senha 2026');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
