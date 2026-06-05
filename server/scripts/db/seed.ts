import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { Client } from 'pg';

const seedDatabase = async () => {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error('SUPABASE_DB_URL is required to run seed');
  }

  const seedPath = join(process.cwd(), 'supabase', 'seed.sql');
  const sql = await readFile(seedPath, 'utf8');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  await client.connect();
  await client.query(sql);
  await client.end();

  console.log('Seed completed: supabase/seed.sql');
};

seedDatabase().catch((error) => {
  console.error(error);
  process.exit(1);
});
