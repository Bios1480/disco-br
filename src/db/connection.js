const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'music.db');
const isNewDb = !fs.existsSync(dbPath);

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

// Cria as tabelas automaticamente se o banco ainda não existir
if (isNewDb) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Banco de dados criado em', dbPath);
}

module.exports = db;
