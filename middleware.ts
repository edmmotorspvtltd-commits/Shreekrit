// Vercel Routing Middleware: maintenance mode.
//
// Runs on every request (pages, assets and /api/*). When MAINTENANCE_MODE is
// exactly "true" the public gets a 503 maintenance page; any other value (or
// no value) lets requests through untouched. The site owner can still view
// the real site with MAINTENANCE_BYPASS_KEY, either as a cookie or via
// ?bypass=<key> (which sets the cookie and redirects to the clean URL).
import { next } from '@vercel/functions';
import { LOGO_DATA_URI } from './maintenance-logo';

const BYPASS_COOKIE = 'preview_access';
const BYPASS_PARAM = 'bypass';
const BYPASS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Shreekrit — Back soon</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #FAF5EA;
    color: #241A14;
    font-family: Georgia, 'Times New Roman', serif;
    text-align: center;
  }
  main { max-width: 32rem; }
  .logo { display: block; width: min(260px, 70vw); height: auto; margin: 0 auto 24px; }
  .rule { width: 56px; height: 3px; margin: 0 auto 28px; background: #8C2711; border-radius: 2px; }
  h1 { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  p { margin: 0 0 12px; font-size: 1.125rem; line-height: 1.6; color: #4A3525; }
  .contact { margin-top: 28px; font-size: 0.95rem; color: #665141; }
  a { color: #8C2711; text-decoration: underline; text-underline-offset: 3px; }
  a:hover { color: #5C1A0B; }
</style>
</head>
<body>
<main>
  <img class="logo" src="${LOGO_DATA_URI}" alt="Shreekrit" width="260" height="152">
  <div class="rule"></div>
  <h1>Shreekrit</h1><!-- visible name is the logo; kept for screen readers -->
  <p>We're currently in development and will be back soon.</p>
  <p class="contact">Questions? Write to <a href="mailto:shreekrit06@gmail.com">shreekrit06@gmail.com</a></p>
</main>
</body>
</html>`;

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      const raw = part.slice(index + 1).trim();
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

// Compares without bailing out at the first differing character.
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

export default function middleware(request: Request): Response {
  if (process.env.MAINTENANCE_MODE !== 'true') {
    return next();
  }

  // An empty or missing key never grants access.
  const bypassKey = process.env.MAINTENANCE_BYPASS_KEY;
  if (bypassKey) {
    const cookieValue = readCookie(request, BYPASS_COOKIE);
    if (cookieValue !== null && safeEqual(cookieValue, bypassKey)) {
      return next();
    }

    const url = new URL(request.url);
    const queryValue = url.searchParams.get(BYPASS_PARAM);
    if (queryValue !== null && safeEqual(queryValue, bypassKey)) {
      url.searchParams.delete(BYPASS_PARAM);
      return new Response(null, {
        status: 307,
        headers: {
          Location: url.pathname + url.search,
          'Set-Cookie': `${BYPASS_COOKIE}=${encodeURIComponent(bypassKey)}; Path=/; Max-Age=${BYPASS_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store'
        }
      });
    }
  }

  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '86400',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex'
    }
  });
}
