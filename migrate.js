import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');

  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(
      path.join(migrationsDir, file),
      'utf-8'
    );

    console.log(`▶️ Rodando migration: ${file}`);
    await db.query(sql);
  }

  console.log('✅ Migrations finalizadas com sucesso');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('❌ Erro na migration:', err);
  process.exit(1);
});
