const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar configuração
  const config = await prisma.configuracao.findFirst();
  if (!config) {
    await prisma.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 99999-9999',
        senha: '2026',
        senhaAdmin: 'admin2026',
      }
    });
    console.log('✅ Configuração criada');
  }

  // Produtos
  const produtos = [
    { nome: 'Torta de Limão', tipoVenda: 'KG', valorUnit: 45.00, categoria: 'Tortas' },
    { nome: 'Torta de Chocolate', tipoVenda: 'KG', valorUnit: 50.00, categoria: 'Tortas' },
    { nome: 'Torta de Morango', tipoVenda: 'KG', valorUnit: 48.00, categoria: 'Tortas' },
    { nome: 'Torta Holandesa', tipoVenda: 'KG', valorUnit: 55.00, categoria: 'Tortas' },
    { nome: 'Brigadeiro', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos' },
    { nome: 'Beijinho', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos' },
    { nome: 'Cajuzinho', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos' },
    { nome: 'Olho de Sogra', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos' },
    { nome: 'Palha Italiana', tipoVenda: 'CENTO', valorUnit: 24.00, categoria: 'Docinhos' },
    { nome: 'Coxinha', tipoVenda: 'CENTO', valorUnit: 45.00, categoria: 'Salgadinhos' },
    { nome: 'Risole de Queijo', tipoVenda: 'CENTO', valorUnit: 40.00, categoria: 'Salgadinhos' },
    { nome: 'Enroladinho', tipoVenda: 'CENTO', valorUnit: 42.00, categoria: 'Salgadinhos' },
    { nome: 'Empadinha', tipoVenda: 'CENTO', valorUnit: 48.00, categoria: 'Salgadinhos' },
    { nome: 'Kibe', tipoVenda: 'CENTO', valorUnit: 40.00, categoria: 'Salgadinhos' },
    { nome: 'Pão Francês', tipoVenda: 'KG', valorUnit: 16.00, categoria: 'Pães' },
    { nome: 'Pão de Queijo', tipoVenda: 'UNIDADE', valorUnit: 3.50, categoria: 'Salgados' },
    { nome: 'Croissant', tipoVenda: 'UNIDADE', valorUnit: 6.00, categoria: 'Salgados' },
    { nome: 'Bolo de Cenoura', tipoVenda: 'KG', valorUnit: 35.00, categoria: 'Bolos' },
    { nome: 'Bolo de Chocolate', tipoVenda: 'KG', valorUnit: 38.00, categoria: 'Bolos' },
    { nome: 'Bolo de Laranja', tipoVenda: 'KG', valorUnit: 32.00, categoria: 'Bolos' },
  ];

  for (const p of produtos) {
    const existente = await prisma.produto.findFirst({ where: { nome: p.nome } });
    if (!existente) {
      await prisma.produto.create({ data: p });
      console.log(`✅ ${p.nome}`);
    }
  }

  console.log('🎉 Seed concluído!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
