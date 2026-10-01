import { SITE_ORIGIN } from './routes';

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image?: string;
}

const ensureTag = (selector: string, create: () => HTMLElement) => {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  const el = ensureTag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute('content', content);
};

export const truncate = (text: string, max = 158) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
};

export function applyPageMeta({ title, description, path, image }: PageMeta) {
  const url = `${SITE_ORIGIN}${path === '/' ? '' : path}`;
  const imageUrl = image ? (image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`) : `${SITE_ORIGIN}/og-image.png`;

  document.title = title;
  setMeta('name', 'description', description);

  const canonical = ensureTag('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  });
  canonical.setAttribute('href', url);

  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', imageUrl);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', imageUrl);
}
