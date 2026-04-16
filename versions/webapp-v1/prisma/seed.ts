// Script de seed - Padaria Paula
// Popula o banco com dados iniciais

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar configuração padrão
  const existingConfig = await prisma.configuracao.findFirst();
  
  if (!existingConfig) {
    await prisma.configuracao.create({
      data: {
        nomeLoja: 'Padaria e Confeitaria Paula',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 99999-9999',
        cnpj: '00.000.000/0001-00',
        senha: '2026',
      },
    });
    console.log('✅ Configuração criada: Padaria e Confeitaria Paula');
  } else {
    console.log('✅ Configuração já existe:', existingConfig.nomeLoja);
  }

  // Produtos iniciais
  const produtos = [
    // Tortas (por kg)
    { nome: 'Torta de Limão', tipoVenda: 'KG', valorUnit: 45.00, categoria: 'Tortas', descricao: 'Deliciosa torta de limão com merengue' },
    { nome: 'Torta de Chocolate', tipoVenda: 'KG', valorUnit: 50.00, categoria: 'Tortas', descricao: 'Torta de chocolate belga' },
    { nome: 'Torta de Morango', tipoVenda: 'KG', valorUnit: 48.00, categoria: 'Tortas', descricao: 'Torta com morangos frescos' },
    { nome: 'Torta Holandesa', tipoVenda: 'KG', valorUnit: 55.00, categoria: 'Tortas', descricao: 'Tradicional torta holandesa' },
    
    // Docinhos (por cento)
    { nome: 'Brigadeiro', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos', descricao: 'Brigadeiro tradicional' },
    { nome: 'Beijinho', tipoVenda: 'CENTO', valorUnit: 25.00, categoria: 'Docinhos', descricao: 'Beijinho de coco' },
    { nome: 'Cajuzinho', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos', descricao: 'Docinho de amendoim com chocolate' },
    { nome: 'Olho de Sogra', tipoVenda: 'CENTO', valorUnit: 28.00, categoria: 'Docinhos', descricao: 'Ameixa com coco' },
    { nome: 'Palha Italiana', tipoVenda: 'CENTO', valorUnit: 24.00, categoria: 'Docinhos', descricao: 'Biscoito com leite condensado' },
    
    // Salgadinhos (por cento)
    { nome: 'Coxinha', tipoVenda: 'CENTO', valorUnit: 45.00, categoria: 'Salgadinhos', descricao: 'Coxinha de frango cremosa' },
    { nome: 'Risole de Queijo', tipoVenda: 'CENTO', valorUnit: 40.00, categoria: 'Salgadinhos', descricao: 'Risole recheado com queijo' },
    { nome: 'Enroladinho de Salsicha', tipoVenda: 'CENTO', valorUnit: 42.00, categoria: 'Salgadinhos', descricao: 'Massa crocante com salsicha' },
    { nome: 'Empadinha', tipoVenda: 'CENTO', valorUnit: 48.00, categoria: 'Salgadinhos', descricao: 'Empadinha de frango' },
    { nome: 'Kibe', tipoVenda: 'CENTO', valorUnit: 40.00, categoria: 'Salgadinhos', descricao: 'Kibe frito' },
    
    // Salgados unitários
    { nome: 'Coxinha Unitária', tipoVenda: 'UNIDADE', valorUnit: 5.00, categoria: 'Salgados Unitários', descricao: 'Coxinha grande' },
    { nome: 'Pão de Queijo', tipoVenda: 'UNIDADE', valorUnit: 3.50, categoria: 'Salgados Unitários', descricao: 'Pão de queijo mineiro' },
    { nome: 'Croissant', tipoVenda: 'UNIDADE', valorUnit: 6.00, categoria: 'Salgados Unitários', descricao: 'Croissant de manteiga' },
    { nome: 'Esfiha', tipoVenda: 'UNIDADE', valorUnit: 4.00, categoria: 'Salgados Unitários', descricao: 'Esfiha de carne' },
    
    // Pães (por kg)
    { nome: 'Pão Francês', tipoVenda: 'KG', valorUnit: 16.00, categoria: 'Pães', descricao: 'Pão francês tradicional' },
    { nome: 'Pão de Forma', tipoVenda: 'UNIDADE', valorUnit: 12.00, categoria: 'Pães', descricao: 'Pão de forma caseiro' },
    { nome: 'Pão Integral', tipoVenda: 'KG', valorUnit: 22.00, categoria: 'Pães', descricao: 'Pão integral com grãos' },
    
    // Bolos (por kg)
    { nome: 'Bolo de Cenoura', tipoVenda: 'KG', valorUnit: 35.00, categoria: 'Bolos', descricao: 'Com cobertura de chocolate' },
    { nome: 'Bolo de Fubá', tipoVenda: 'KG', valorUnit: 30.00, categoria: 'Bolos', descricao: 'Bolo de fubá com goiabada' },
    { nome: 'Bolo de Laranja', tipoVenda: 'KG', valorUnit: 32.00, categoria: 'Bolos', descricao: 'Bolo fofinho de laranja' },
  ];

  for (const produto of produtos) {
    // Verificar se produto já existe
    const existente = await prisma.produto.findFirst({
      where: { nome: produto.nome },
    });
    
    if (!existente) {
      const criado = await prisma.produto.create({
        data: produto,
      });
      console.log(`✅ Produto criado: ${criado.nome} - R$ ${criado.valorUnit.toFixed(2)}/${criado.tipoVenda.toLowerCase()}`);
    } else {
      // Atualizar preço se já existir
      const atualizado = await prisma.produto.update({
        where: { id: existente.id },
        data: { valorUnit: produto.valorUnit },
      });
      console.log(`📝 Produto atualizado: ${atualizado.nome} - R$ ${atualizado.valorUnit.toFixed(2)}/${atualizado.tipoVenda.toLowerCase()}`);
    }
  }

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
