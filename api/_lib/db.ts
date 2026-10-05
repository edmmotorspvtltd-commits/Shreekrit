import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let sqlClient: NeonQueryFunction<false, false> | null = null;

// Local development only. The Vite dev server plugin sets __shreekritDev and
// installs a client for a local Postgres on globalThis. Nothing in api/ imports
// that client, and neither global is ever set on Vercel, so a deployed function
// always takes the neon() path below. The flag arms the hook: a stray
// __shreekritLocalSql without __shreekritDev is ignored.
interface DevGlobals {
  __shreekritDev?: boolean;
  __shreekritLocalSql?: NeonQueryFunction<false, false>;
}

export const sql = (): NeonQueryFunction<false, false> => {
  if (!sqlClient) {
    const dev = globalThis as DevGlobals;
    if (dev.__shreekritDev === true) {
      // In dev there is no fallback to neon(): a missing local client is an error,
      // never a quiet connection to a remote database.
      if (!dev.__shreekritLocalSql) {
        throw new Error('Dev server is running but no local SQL client was installed');
      }
      sqlClient = dev.__shreekritLocalSql;
      return sqlClient;
    }
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    sqlClient = neon(url);
  }
  return sqlClient;
};
