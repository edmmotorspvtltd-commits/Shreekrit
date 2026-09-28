import { CurrencyCode } from '../types';
import { CURRENCY_RATES } from '../data/paintings';

export const formatPrice = (amountINR: number, currency: CurrencyCode = 'INR'): string => {
  const rateInfo = CURRENCY_RATES[currency] || CURRENCY_RATES.INR;
  const converted = amountINR * rateInfo.rateFromINR;

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
