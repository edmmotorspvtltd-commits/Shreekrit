import type { SyntheticEvent } from 'react';

// Shared fallback for any <img> rendering a painting's remote (Unsplash)
// image — this is a store selling physical art sight-unseen, so a broken
// <img> icon where a painting photo should be is a real trust problem, not
// just a cosmetic one.
const PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#EFE6D5"/>
  <g stroke="#B49E85" stroke-width="2" fill="none">
    <rect x="90" y="70" width="220" height="160" rx="4"/>
    <circle cx="140" cy="115" r="14"/>
    <path d="M90 200 L160 145 L210 185 L250 150 L310 200" />
  </g>
  <text x="200" y="252" font-family="Georgia, serif" font-size="14" fill="#8C7665" text-anchor="middle">Image unavailable</text>
</svg>
`.trim();

export const PAINTING_IMAGE_FALLBACK = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;

// Swaps a broken image to the fallback and disarms onerror so a second
// failure (loading the fallback itself) can't loop.
export const handleImageError = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PAINTING_IMAGE_FALLBACK;
};
