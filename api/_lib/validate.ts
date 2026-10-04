// Shared server-side input checks for the public API routes. Every helper
// returns the cleaned (trimmed) value, or null when the input is invalid, so
// handlers can reject with one 400 and never use unvalidated text.

export const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY'] as const;
export const EDITION_TYPES = ['original', 'print'] as const;
export const PRODUCT_TYPES = ['painting', 'pouch'] as const;

// Most pieces of one pouch design a single order may contain, summed across
// cart lines. Enforced server-side in api/orders/create.ts.
export const MAX_PIECES_PER_PRODUCT = 10;

export const MAX = {
  name: 100,
  email: 254,
  line: 200,
  place: 100,
  id: 100,
  subject: 200,
  shortNote: 100,
  longText: 3000,
  bio: 2000,
  sampleWork: 500
} as const;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^\+?[0-9][0-9 ()-]{5,18}[0-9]$/;
const POSTAL_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/;

// Control characters have no place in any field (and newlines would let a
// value break out of a single-line field such as an email subject).
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

type Opts = { max: number; min?: number; multiline?: boolean };

export function text(value: unknown, { max, min = 1, multiline = false }: Opts): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (v.length < min || v.length > max) return null;
  if (CONTROL_RE.test(v)) return null;
  if (!multiline && /[\r\n]/.test(v)) return null;
  return v;
}

export function optionalText(value: unknown, opts: Opts): string | null | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return text(value, { ...opts, min: 1 });
}

export function email(value: unknown): string | null {
  const v = text(value, { max: MAX.email, min: 5 });
  return v && EMAIL_RE.test(v) ? v : null;
}

export function phone(value: unknown): string | null {
  const v = text(value, { max: 20, min: 7 });
  return v && PHONE_RE.test(v) ? v : null;
}

export function postalCode(value: unknown): string | null {
  const v = text(value, { max: 12, min: 3 });
  return v && POSTAL_RE.test(v) ? v : null;
}

export function quantity(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_PIECES_PER_PRODUCT ? value : null;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export const badRequest = (error: string) =>
  new Response(JSON.stringify({ error }), { status: 400, headers: { 'Content-Type': 'application/json' } });
