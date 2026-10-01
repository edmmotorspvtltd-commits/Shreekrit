import { sql } from './_lib/db';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const host = req.headers.get('host') || url.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    // Get dynamic items for the sitemap
    const [paintings, artists] = await Promise.all([
      sql()`SELECT id FROM paintings WHERE is_available = true`,
      sql()`SELECT id FROM artists`
    ]);

    const staticRoutes = [
      '',
      '/gallery',
      '/story',
      '/heritage',
      '/artists',
      '/blog'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
  ${paintings.map((p: any) => `
  <url>
    <loc>${baseUrl}/painting/${p.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  ${artists.map((a: any) => `
  <url>
    <loc>${baseUrl}/artist/${a.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

    return new Response(sitemap.trim(), {
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
