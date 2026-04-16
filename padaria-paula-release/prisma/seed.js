// Seed - Padaria Paula
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando configuração inicial...');

  // Criar configuração
  const existingConfig = await prisma.configuracao.findFirst();
  if (!existingConfig) {
    await prisma.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 99999-9999',
        senha: '2026',
      }
    });
    console.log('✅ Configuração criada!');
  }

  // Produtos iniciais
  const produtos = [
    { nome: 'Torta de Limão', tipoVenda: 'KG', valorUnit: 45.00, categoria: 'Tortas' },
    { nome: 'Torta de Chocolate', tipoVenda: 'KG', valorUnit: 50.00, categoria: 'Tortas' },
    { nome: 'Torta de Morango', tipoVenda: 'KG', valorUnit: 48.00, categoria: 'Tortas' },
    { nome: 'Torta Holandesa', tipoVenda: 'KG', valorUnit: 55.00, categoria: 'Tortas' },
    { nome: 'Brigadeiro', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos' },
    { nome: 'Beijinho', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos' },
    { nome: 'Cajuzinho', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos' },
    { nome: 'Olho de Sogra', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos' },
    { nome: 'Coxinha', tipoVenda: 'CENTO', valorUnit: 45.00, categoria: 'Salgadinhos' },
    { nome: 'Risole de Queijo', tipoVenda: 'CENTO', valorUnit: 40.00, categoria: 'Salgadinhos' },
    { nome: 'Enroladinho', tipoVenda: 'CENTO', valorUnit: 42.00, categoria: 'Salgadinhos' },
    { nome: 'Empadinha', tipoVenda: 'CENTO', valorUnit: 48.00, categoria: 'Salgadinhos' },
    { nome: 'Pão Francês', tipoVenda: 'KG', valorUnit: 16.00, categoria: 'Pães' },
    { nome: 'Pão de Queijo', tipoVenda: 'UNIDADE', valorUnit: 3.50, categoria: 'Salgados' },
    { nome: 'Bolo de Cenoura', tipoVenda: 'KG', valorUnit: 35.00, categoria: 'Bolos' },
    { nome: 'Bolo de Chocolate', tipoVenda: 'KG', valorUnit: 38.00, categoria: 'Bolos' },
  ];

  console.log('🌱 Cadastrando produtos...');
  for (const produto of produtos) {
    const existente = await prisma.produto.findFirst({ where: { nome: produto.nome } });
    if (!existente) {
      await prisma.produto.create({ data: produto });
      console.log(`✅ ${produto.nome}`);
    }
  }

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
