import { Pool } from 'pg';

// Temporarily hardcoded for Vercel deployment debugging as requested
const connectionString = "postgresql://retool:npg_fYvMsiEmu6h2@ep-orange-paper-afxn5lg0-pooler.c-2.us-west-2.retooldb.com/retool?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  query: (text: string, params?: any[]) => {
    return pool.query(text, params);
  },
  pool,
};

export default db;
