import type { VercelRequest, VercelResponse } from '@vercel/node';

// frankfurter.app mirrors the ECB's daily reference rates and needs no
// API key. It doesn't quote INR as a base, so we ask it for INR's value
// in each target currency directly (amount=1&from=INR&to=...), which is
// exactly the rateFromINR shape CURRENCY_RATES already uses.
const TARGET_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
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
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ rates, asOf: new Date().toISOString(), source: 'frankfurter.app (ECB)' });
  } catch (err) {
    console.error('GET /api/fx failed:', err);
    // Client-side refreshLiveRates() already treats a non-OK response as
    // "keep the static fallback" — surface that explicitly here.
    res.status(502).json({ error: 'Live FX feed unavailable' });
  }
}
