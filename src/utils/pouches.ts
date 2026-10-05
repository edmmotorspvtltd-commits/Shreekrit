import type { Pouch } from '../types';

/** True when at least one non-placeholder pouch exists, sold or not. */
export const hasSellablePouches = (pouches: Pouch[]): boolean =>
  pouches.some((p) => !p.isPlaceholder);

/** True when pouches exist but every non-placeholder one is sold out. */
export const allPouchesSoldOut = (pouches: Pouch[]): boolean =>
  hasSellablePouches(pouches) &&
  pouches.filter((p) => !p.isPlaceholder).every((p) => p.quantity === 0);
