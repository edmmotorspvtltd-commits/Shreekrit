// Refuses to run anything that writes unless DATABASE_URL points at a LOCAL
// Postgres. Used by the dev server plugin and by the db/ scripts.
//
// Messages never include the connection string, the host name or the user:
// they only say what rule was broken.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export interface LocalDbTarget {
  host: string;
  port: string;
  database: string;
}

export class NotLocalDatabaseError extends Error {}

export function assertLocalDb(url: string | undefined, options: { database: RegExp; purpose: string }): LocalDbTarget {
  const refuse = (rule: string): never => {
    throw new NotLocalDatabaseError(`Refusing to ${options.purpose}: ${rule}.`);
  };

  if (!url) return refuse('DATABASE_URL is not set');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return refuse('DATABASE_URL is not a valid URL');
  }
  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') return refuse('DATABASE_URL is not a postgres:// URL');
  // A `host=` query parameter (unix socket or another host) would override the URL's host.
  if (parsed.searchParams.has('host') || parsed.searchParams.has('hostaddr')) return refuse('DATABASE_URL overrides the host in its query string');
  if (parsed.hostname.includes(',')) return refuse('DATABASE_URL lists more than one host');
  if (!LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) return refuse('the database host is not localhost');

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (!options.database.test(database)) return refuse(`the database name must match ${options.database}`);

  return { host: parsed.hostname, port: parsed.port || '5432', database };
}

// Name rules used by the scripts.
export const DEV_OR_TEST_DB = /^shreekrit_(dev|test)$/;
export const TEST_DB = /^shreekrit_test$/;
