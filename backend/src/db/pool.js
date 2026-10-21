import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
}

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('Falta la variable DATABASE_URL en backend/.env');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
