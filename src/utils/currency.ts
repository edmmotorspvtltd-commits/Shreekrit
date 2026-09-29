import { CurrencyCode } from '../types';
import { CURRENCY_RATES } from '../data/paintings';

// Applied on top of the raw FX conversion for every non-INR currency.
// This isn't margin — it's cost recovery for what an international sale
// actually costs beyond a domestic one: international-card acceptance fees
// run ~3-3.5% (plus GST) even through Razorpay's own cross-border rails,
// and export packaging/customs paperwork for shipping original artwork out
// of India adds real cost on top of that. 15% covers both with a small
// buffer; it is not arbitrary and should be revisited if actual gateway/
// shipping costs change.
export const INTERNATIONAL_MARKUP = 1.15;

// Numeric conversion only, no formatting — used wherever a raw number is
// needed (e.g. writing total_amount_display to the orders table) rather
// than a display string. formatPrice below wraps this for rendering.
export const convertPrice = (amountINR: number, currency: CurrencyCode = 'INR'): number => {
  const rateInfo = CURRENCY_RATES[currency] || CURRENCY_RATES.INR;
  const markup = currency === 'INR' ? 1 : INTERNATIONAL_MARKUP;
  return amountINR * rateInfo.rateFromINR * markup;
};

export const formatPrice = (amountINR: number, currency: CurrencyCode = 'INR'): string => {
  const rateInfo = CURRENCY_RATES[currency] || CURRENCY_RATES.INR;
  const converted = convertPrice(amountINR, currency);

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(converted);
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(converted);
  }

  if (currency === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(converted);
  }

  if (currency === 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(converted);
  }

  if (currency === 'JPY') {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(converted);
  }

  return `${rateInfo.symbol} ${Math.round(converted).toLocaleString()}`;
};
