const TARGET_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'];

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = `https://api.frankfurter.app/latest?amount=1&from=INR&to=${TARGET_CURRENCIES.join(',')}`;
    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new Error(`frankfurter.app responded ${upstream.status}`);
    }
    const data: { rates: Record<string, number> } = await upstream.json();

    // ECB doesn't publish a JPY reference some days; fall back gracefully
    // by only returning currencies frankfurter actually priced today.
    const rates: Record<string, number> = { INR: 1, ...data.rates };

    // Cache at the edge for an hour — daily ECB rates don't need
    // per-request freshness, and this keeps us well inside frankfurter's
    // free, keyless usage norms.
    return new Response(JSON.stringify({ rates, asOf: new Date().toISOString(), source: 'frankfurter.app (ECB)' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (err) {
    console.error('GET /api/fx failed:', err);
    return new Response(JSON.stringify({ error: 'Live FX feed unavailable' }), { status: 502 });
  }
}
