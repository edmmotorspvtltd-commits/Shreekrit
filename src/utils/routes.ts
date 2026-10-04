import type { Artist, Painting, Pouch } from '../types';

// Canonical host. Canonical tags, og:url and the sitemap must all use this,
// and it must match the host the domain redirects to.
export const SITE_ORIGIN = 'https://www.shreekrit.in';

export const SECTIONS = ['home', 'gallery', 'story', 'heritage', 'pouches', 'artists', 'blog', 'my-orders'] as const;

export type Route =
  | { kind: 'section'; section: string }
  | { kind: 'painting'; id: string }
  | { kind: 'pouch'; id: string }
  | { kind: 'artist'; id: string }
  | { kind: 'not-found' };

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const sectionPath = (section: string) => (section === 'home' ? '/' : `/${section}`);

// /painting/<id>/<readable-slug> — the id (first segment) is what identifies
// the item; the slug is cosmetic and may be stale or missing.
export const paintingPath = (painting: Pick<Painting, 'id' | 'title'>) => {
  const slug = slugify(painting.title);
  return `/painting/${encodeURIComponent(painting.id)}${slug ? `/${slug}` : ''}`;
};

// /pouch/<id>/<readable-slug>, same scheme as paintings.
export const pouchPath = (pouch: Pick<Pouch, 'id' | 'name'>) => {
  const slug = slugify(pouch.name);
  return `/pouch/${encodeURIComponent(pouch.id)}${slug ? `/${slug}` : ''}`;
};

export const artistPath = (artist: Pick<Artist, 'id' | 'name'>) => {
  const slug = slugify(artist.name);
  return `/artist/${encodeURIComponent(artist.id)}${slug ? `/${slug}` : ''}`;
};

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const parseRoute = (pathname: string): Route => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return { kind: 'section', section: 'home' };

  if ((segments[0] === 'painting' || segments[0] === 'artist' || segments[0] === 'pouch') && segments.length >= 2 && segments.length <= 3) {
    return { kind: segments[0], id: safeDecode(segments[1]) };
  }

  if (segments.length === 1 && (SECTIONS as readonly string[]).includes(segments[0])) {
    return { kind: 'section', section: segments[0] };
  }
  return { kind: 'not-found' };
};

// Resolves a route id against the loaded items. Falls back to a "<slug>-<id>"
// suffix match so a hand-typed or older-style URL still finds its item.
export const findById = <T extends { id: string }>(items: T[], id: string): T | undefined =>
  items.find((item) => item.id === id) ?? items.find((item) => id.endsWith(`-${item.id}`));
