const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'data.db');
const db = new Database(dbPath, { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    nombre TEXT,
    cedula TEXT,
    empresa TEXT,
    cargo TEXT,
    tipo TEXT,
    induccion360 TEXT,
    induccionEspecifica TEXT,
    vigencia TEXT,
    ss TEXT,
    foto TEXT,
    estado TEXT
  )
`);

console.log('Database initialized at:', dbPath);
