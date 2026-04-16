const Database = require('better-sqlite3');
const db = new Database('./db/custom.db');

// Verificar colunas existentes
const columns = db.prepare("PRAGMA table_info(Configuracao)").all();
console.log('Colunas atuais:', columns.map(c => c.name));

// Adicionar colunas faltantes se necessário
const neededColumns = [
  { name: 'mensagemOrcamento', type: 'TEXT', default: "'Olá {nome}! Segue seu orçamento.'" },
  { name: 'mensagemProntoRetirada', type: 'TEXT', default: "'Olá {nome}! Seu pedido está PRONTO e esperando por você!'" },
  { name: 'mensagemProntoEntrega', type: 'TEXT', default: "'Olá {nome}! Seu pedido está PRONTO e já está a caminho!'" }
];

for (const col of neededColumns) {
  if (!columns.find(c => c.name === col.name)) {
    try {
      db.prepare(`ALTER TABLE Configuracao ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`).run();
      console.log(`Coluna ${col.name} adicionada!`);
    } catch (e) {
      console.log(`Coluna ${col.name}: ${e.message}`);
    }
  }
}

// Verificar resultado
const updatedColumns = db.prepare("PRAGMA table_info(Configuracao)").all();
console.log('Colunas após update:', updatedColumns.map(c => c.name));

// Verificar dados
const config = db.prepare('SELECT * FROM Configuracao LIMIT 1').get();
console.log('Config:', config);

db.close();
