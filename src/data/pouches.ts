import { Pouch } from '../types';

export const POUCHES: Pouch[] = [
  {
    id: 'pouch-lotus',
    name: 'Lotus Pond Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 950,
    sizeCm: '20 x 14',
    material: 'Cotton canvas, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Spot clean with a damp cloth. Do not machine wash or wring. Dry in shade.',
    quantity: 1,
    description: 'Hand-painted with lotus and fish motifs in the Mithila tradition.',
    images: ['/pouches/pouch-1-1.jpeg', '/pouches/pouch-1-2.jpeg', '/pouches/pouch-1-3.jpeg'],
    isFeatured: true,
    isPlaceholder: false
  },
  {
    id: 'pouch-peacock',
    name: 'Peacock Pair Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 1200,
    sizeCm: '24 x 16',
    material: 'Raw silk, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Dry clean or spot clean only. Keep away from water and direct sun.',
    quantity: 1,
    description: 'One-of-one pouch with a pair of peacocks and a hand-drawn border.',
    images: ['/pouches/pouch-2-1.jpeg', '/pouches/pouch-2-2.jpeg', '/pouches/pouch-2-3.jpeg'],
    isFeatured: false,
    isPlaceholder: false
  },
  {
    id: 'pouch-sunrise',
    name: 'Sun & Fish Pouch',
    artistId: 'artist-lovely-jha',
    artistName: 'Lovely Jha',
    priceINR: 800,
    sizeCm: '18 x 12',
    material: 'Cotton canvas, cotton lining',
    paintType: 'Fabric-safe acrylic',
    careInstructions: 'Spot clean with a damp cloth. Do not machine wash or wring. Dry in shade.',
    quantity: 1,
    description: 'Hand-painted pouch with a rising sun and fish pair, a symbol of good fortune.',
    images: ['/pouches/pouch-3-1.jpeg', '/pouches/pouch-3-2.jpeg', '/pouches/pouch-3-3.jpeg'],
    isFeatured: false,
    isPlaceholder: false
  }
];
