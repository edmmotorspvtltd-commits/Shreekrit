import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Lazily created so a missing DATABASE_URL only breaks the request that
// actually needs the database, not the whole function bundle at import
// time (relevant while DATABASE_URL isn't set yet in Vercel's env vars).
let sqlClient: NeonQueryFunction<false, false> | null = null;

export const sql = (): NeonQueryFunction<false, false> => {
  if (!sqlClient) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    sqlClient = neon(url);
  }
  return sqlClient;
};
