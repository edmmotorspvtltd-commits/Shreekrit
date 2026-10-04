import type { CartItem, Pouch } from '../types';
import { SHIPPING_COST_INR, FREE_SHIPPING_THRESHOLD_INR, POUCH_SHIPPING_COST_INR } from '../data/paintings';

// Keep in step with MAX_PIECES_PER_PRODUCT in api/_lib/validate.ts, which is
// the authoritative limit (the server re-checks it).
export const MAX_PIECES_PER_POUCH = 10;
// "Only N left" is shown at or below this many pieces.
export const LOW_STOCK_THRESHOLD = 3;

export const isPouchItem = (item: CartItem): item is Extract<CartItem, { kind: 'pouch' }> => item.kind === 'pouch';

export const cartItemKey = (item: CartItem, idx: number) =>
  `${isPouchItem(item) ? `pouch-${item.pouch.id}` : item.painting.id}-${idx}`;
export const cartItemTitle = (item: CartItem) => (isPouchItem(item) ? item.pouch.name : item.painting.title);
export const cartItemImage = (item: CartItem) => (isPouchItem(item) ? item.pouch.images[0] ?? '' : item.painting.primaryImage);
export const cartItemArtist = (item: CartItem) => (isPouchItem(item) ? item.pouch.artistName : item.painting.artistName);
export const cartItemQuantity = (item: CartItem) => (isPouchItem(item) ? item.quantity : 1);
export const cartLineTotalINR = (item: CartItem) => (item.unitPriceINR + item.framePriceINR) * cartItemQuantity(item);
export const cartSubtotalINR = (items: CartItem[]) => items.reduce((sum, item) => sum + cartLineTotalINR(item), 0);

// The shipping rule, shared by checkout and api/orders/create.ts (which
// computes the amount actually charged). Pouch-only orders pay a flat rate;
// any order containing a painting keeps the original free-above-threshold rule.
export const computeShippingINR = (subtotalINR: number, pouchOnly: boolean) =>
  pouchOnly ? POUCH_SHIPPING_COST_INR : subtotalINR > FREE_SHIPPING_THRESHOLD_INR ? 0 : SHIPPING_COST_INR;
export const cartShippingINR = (items: CartItem[]) =>
  items.length === 0 ? 0 : computeShippingINR(cartSubtotalINR(items), items.every(isPouchItem));

// Adds pieces of a pouch, merging into an existing line and never exceeding
// the stock the shopper can see or the per-order limit. UI convenience only.
export const addPouchToCart = (cart: CartItem[], pouch: Pouch, quantity: number): CartItem[] => {
  const cap = Math.min(pouch.quantity, MAX_PIECES_PER_POUCH);
  const existing = cart.findIndex((i) => isPouchItem(i) && i.pouch.id === pouch.id);
  if (existing === -1) {
    return [...cart, { kind: 'pouch', pouch, quantity: Math.min(quantity, cap), unitPriceINR: pouch.priceINR, framePriceINR: 0, addedAt: Date.now() }];
  }
  return cart.map((i, idx) => (idx === existing && isPouchItem(i) ? { ...i, pouch, quantity: Math.min(i.quantity + quantity, cap) } : i));
};

// Carts persisted in localStorage may predate pouches or be malformed.
export const sanitizeSavedCart = (raw: unknown): CartItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((i): i is CartItem => {
    if (!i || typeof i !== 'object' || typeof i.unitPriceINR !== 'number') return false;
    if (i.kind === 'pouch') return !!i.pouch && typeof i.pouch.id === 'string' && Number.isInteger(i.quantity) && i.quantity >= 1;
    return !!i.painting && typeof i.painting.id === 'string';
  });
};
