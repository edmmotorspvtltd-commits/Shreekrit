import { sql } from './_lib/db';
import { SITE_ORIGIN, paintingPath, artistPath, sectionPath } from '../src/utils/routes';

export const config = { runtime: 'edge' };

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const urlEntry = (path: string, changefreq: string, priority: string) => `
  <url>
    <loc>${escapeXml(SITE_ORIGIN + (path === '/' ? '' : path))}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Every painting (sold ones included: their pages still take
    // commission enquiries) and every artist. URLs come from the same
    // helpers the app uses for its canonical tags.
    const [paintings, artists] = await Promise.all([
      sql()`SELECT id, title FROM paintings ORDER BY id ASC`,
      sql()`SELECT id, name FROM artists ORDER BY id ASC`
    ]);

    const staticSections = ['home', 'gallery', 'story', 'heritage', 'artists', 'blog'];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
      staticSections.map((section) => urlEntry(sectionPath(section), 'daily', section === 'home' ? '1.0' : '0.8')).join('')
    }${
      paintings.map((p: any) => urlEntry(paintingPath({ id: p.id, title: p.title }), 'weekly', '0.6')).join('')
    }${
      artists.map((a: any) => urlEntry(artistPath({ id: a.id, name: a.name }), 'weekly', '0.6')).join('')
    }
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate'
      }
    });
  } catch (err) {
    console.error('Sitemap generation failed:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
