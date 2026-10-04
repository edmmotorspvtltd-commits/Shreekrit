import { Pouch } from '../types';

// Demo pouches so the Pouches section can be built and reviewed before real
// stock is photographed. All are isPlaceholder: the API hides them (and
// refuses to sell them) when VERCEL_ENV is "production".
// TODO: replace with Lovely Jha's real pouches (photos under public/pouches/,
// referenced as '/pouches/<file>.jpg', like public/paintings/).
const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

export const POUCHES: Pouch[] = [
  {
    id: 'pouch-demo-lotus',
    name: 'Lotus Pond Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 950,
    sizeCm: '20 x 14',
    material: 'Cotton canvas, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Spot clean with a damp cloth. Do not machine wash or wring. Dry in shade.',
    quantity: 3,
    description: 'Demo pouch hand-painted with lotus and fish motifs in the Mithila tradition.',
    images: [IMG('photo-1507003211169-0a1dd7228f2d'), IMG('photo-1534528741775-53994a69daeb'), IMG('photo-1544005313-94ddf0286df2')],
    isFeatured: true,
    isPlaceholder: true
  },
  {
    id: 'pouch-demo-peacock',
    name: 'Peacock Pair Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 1200,
    sizeCm: '24 x 16',
    material: 'Raw silk, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Dry clean or spot clean only. Keep away from water and direct sun.',
    quantity: 1,
    description: 'Demo one-of-one pouch with a pair of peacocks and a hand-drawn border.',
    images: [IMG('photo-1573496359142-b8d87734a5a2'), IMG('photo-1541961017774-22349e4a1262'), IMG('photo-1507003211169-0a1dd7228f2d')],
    isFeatured: false,
    isPlaceholder: true
  },
  {
    id: 'pouch-demo-sunrise',
    name: 'Sun & Fish Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 800,
    sizeCm: '18 x 12',
    material: 'Cotton canvas, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Spot clean with a damp cloth. Do not machine wash or wring. Dry in shade.',
    quantity: 5,
    description: 'Demo pouch with a rising sun and fish pair, a symbol of good fortune.',
    images: [IMG('photo-1534528741775-53994a69daeb'), IMG('photo-1544005313-94ddf0286df2'), IMG('photo-1573496359142-b8d87734a5a2'), IMG('photo-1541961017774-22349e4a1262')],
    isFeatured: false,
    isPlaceholder: true
  }
];
