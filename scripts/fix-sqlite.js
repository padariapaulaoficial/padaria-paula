const Database = require('better-sqlite3');
const db = new Database('./db/custom.db');

// Verificar tabela
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tabelas:', tables.map(t => t.name));

// Verificar configuração atual
try {
  const config = db.prepare('SELECT id, senha, senhaAdmin FROM Configuracao LIMIT 1').get();
  console.log('Config atual:', config);
  
  if (config) {
    // Atualizar senha
    db.prepare("UPDATE Configuracao SET senha = '2026', senhaAdmin = '2026' WHERE id = ?").run(config.id);
    console.log('Senha atualizada para 2026!');
    
    // Verificar
    const updated = db.prepare('SELECT id, senha, senhaAdmin FROM Configuracao LIMIT 1').get();
    console.log('Config após update:', updated);
  } else {
    console.log('Nenhuma configuração encontrada, criando...');
    db.prepare(`INSERT INTO Configuracao (id, nomeLoja, endereco, telefone, senha, senhaAdmin, createdAt, updatedAt) 
                VALUES (?, 'Padaria e Confeitaria Paula', 'Rua das Flores, 123', '(11) 99999-9999', '2026', '2026', ?, ?)`)
       .run('config-' + Date.now(), new Date().toISOString(), new Date().toISOString());
    console.log('Configuração criada!');
  }
} catch (e) {
  console.error('Erro:', e.message);
}

db.close();
