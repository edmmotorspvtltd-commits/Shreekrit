import { CURRENCY_RATES } from '../data/paintings';

// Fetches live FX rates from /api/fx (server-cached, ECB-sourced) and
// mutates CURRENCY_RATES in place so every existing formatPrice() call
// site picks the refreshed numbers on next render, without threading a
// rates object through every component. If the fetch fails for any
// reason, the static snapshot already in CURRENCY_RATES stays in effect —
// this never throws and never leaves prices blank.
export const refreshLiveRates = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/fx');
    if (!res.ok) return null;
    const data: { rates: Record<string, number>, asOf?: string } = await res.json();
    for (const code of Object.keys(data.rates)) {
      if (CURRENCY_RATES[code]) {
        CURRENCY_RATES[code].rateFromINR = data.rates[code];
      }
    }
    return data.asOf || null;
  } catch {
    // Static fallback rates in CURRENCY_RATES remain in effect.
    return null;
  }
};
