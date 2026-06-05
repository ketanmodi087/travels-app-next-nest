import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const runMigrations = async () => {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is required to run migrations');
  }

  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_init.sql');
  const sql = await readFile(migrationPath, 'utf8');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  await client.connect();
  await client.query(sql);
  await client.end();

  console.log('Migration completed: 001_init.sql');
};

runMigrations().catch((error) => {
  console.error(error);
  process.exit(1);
});
