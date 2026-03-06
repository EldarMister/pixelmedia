const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        database: process.env.PGDATABASE || 'pixel_media_crm',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        ssl: isProduction ? { rejectUnauthorized: false } : false
      }
);

let initialized = false;

async function initDb() {
  if (initialized) return;
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
  initialized = true;
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb
};
