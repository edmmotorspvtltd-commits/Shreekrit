// A `pg`-backed stand-in for the Neon HTTP client returned by neon(), used
// ONLY for local development against a local Postgres. Never imported from
// api/: the dev server plugin and the db/ scripts install it, so the code that
// ships to Vercel has no `pg` in it (checked by db/check-api-bundle.ts).
//
// It mirrors the parts of neon()'s API this app uses:
//   sql`SELECT ... ${value}`            tagged template -> Promise<rows[]>
//   sql('SELECT ... $1', [value])       call style
//   sql.transaction([q1, q2])           array of queries, one atomic batch
//   sql.transaction((txn) => [txn`..`]) callback form
// Queries are lazy, like Neon's: nothing runs until awaited or handed to
// transaction(). Row parsing uses Neon's own type parsers, so values come
// back in the same shapes as in production (numeric as string, etc.).
import pg from 'pg';
import { types as neonTypes, type NeonQueryFunction } from '@neondatabase/serverless';

type Row = Record<string, unknown>;

interface ParameterizedQuery {
  query: string;
  params: unknown[];
}

type Runner = (q: ParameterizedQuery) => Promise<Row[]>;

class LocalQuery implements PromiseLike<Row[]> {
  readonly parameterizedQuery: ParameterizedQuery;
  private readonly runner: Runner;
  private promise?: Promise<Row[]>;

  constructor(parameterizedQuery: ParameterizedQuery, runner: Runner) {
    this.parameterizedQuery = parameterizedQuery;
    this.runner = runner;
  }

  private execute(): Promise<Row[]> {
    this.promise ??= this.runner(this.parameterizedQuery);
    return this.promise;
  }

  then<R1 = Row[], R2 = never>(
    onFulfilled?: ((value: Row[]) => R1 | PromiseLike<R1>) | null,
    onRejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this.execute().then(onFulfilled, onRejected);
  }
  catch<R = never>(onRejected?: ((reason: unknown) => R | PromiseLike<R>) | null): Promise<Row[] | R> {
    return this.execute().catch(onRejected);
  }
  finally(onFinally?: (() => void) | null): Promise<Row[]> {
    return this.execute().finally(onFinally);
  }
}

const isTemplate = (value: unknown): value is TemplateStringsArray => Array.isArray(value) && 'raw' in (value as object);

function toQuery(strings: TemplateStringsArray, values: unknown[]): ParameterizedQuery {
  let query = '';
  strings.forEach((part, i) => {
    query += part;
    if (i < values.length) query += `$${i + 1}`;
  });
  return { query, params: values };
}

export interface LocalSql {
  sql: NeonQueryFunction<false, false>;
  end: () => Promise<void>;
}

interface TransactionOptions {
  isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  readOnly?: boolean;
  deferrable?: boolean;
}

const ISOLATION: Record<NonNullable<TransactionOptions['isolationLevel']>, string> = {
  ReadUncommitted: 'READ UNCOMMITTED',
  ReadCommitted: 'READ COMMITTED',
  RepeatableRead: 'REPEATABLE READ',
  Serializable: 'SERIALIZABLE'
};

export function createLocalSql(connectionString: string): LocalSql {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    // Same parsers Neon's HTTP driver uses, so rows have the same shapes.
    types: neonTypes as unknown as pg.CustomTypesConfig
  });
  // An idle client dropping must not crash the dev server.
  pool.on('error', (err) => console.error('Local Postgres pool error:', err.message));

  const runOnPool: Runner = async ({ query, params }) => (await pool.query(query, params as unknown[])).rows;

  const makeQuery = (first: TemplateStringsArray | string, rest: unknown[], runner: Runner): LocalQuery =>
    isTemplate(first)
      ? new LocalQuery(toQuery(first, rest), runner)
      : new LocalQuery({ query: first, params: (rest[0] as unknown[] | undefined) ?? [] }, runner);

  const sql = ((first: TemplateStringsArray | string, ...rest: unknown[]) => makeQuery(first, rest, runOnPool)) as unknown as NeonQueryFunction<false, false>;

  // Queries built inside the callback form are only read, never run on the pool.
  const txnBuilder = ((first: TemplateStringsArray | string, ...rest: unknown[]) =>
    makeQuery(first, rest, () => Promise.reject(new Error('Queries built inside sql.transaction(fn) only run as part of it')))) as unknown;

  (sql as unknown as { transaction: unknown }).transaction = async (
    queriesOrFn: LocalQuery[] | ((txn: unknown) => { parameterizedQuery: ParameterizedQuery }[]),
    options: TransactionOptions = {}
  ): Promise<Row[][]> => {
    const queries = typeof queriesOrFn === 'function' ? queriesOrFn(txnBuilder) : queriesOrFn;
    if (!Array.isArray(queries) || queries.some((q) => !q?.parameterizedQuery)) {
      throw new TypeError('sql.transaction() takes an array of queries (or a function returning one)');
    }

    const client = await pool.connect();
    let broken = false;
    try {
      const modes = [
        options.isolationLevel ? `ISOLATION LEVEL ${ISOLATION[options.isolationLevel]}` : '',
        options.readOnly ? 'READ ONLY' : '',
        options.deferrable ? 'DEFERRABLE' : ''
      ].filter(Boolean).join(' ');
      await client.query(`BEGIN${modes ? ` ${modes}` : ''}`);

      const results: Row[][] = [];
      for (const { parameterizedQuery: { query, params } } of queries) {
        results.push((await client.query(query, params as unknown[])).rows);
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {
        broken = true; // connection is unusable: discard it instead of returning it to the pool
      }
      throw err;
    } finally {
      client.release(broken ? true : undefined);
    }
  };

  return { sql, end: () => pool.end() };
}
