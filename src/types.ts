export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type Language = 'en' | 'hi' | 'mai';
export type EditionType = 'original' | 'print';


export interface CurrencyRate {
  code: CurrencyCode;
  symbol: string;
  rateFromINR: number; // 1 INR in target currency
  name: string;
}

export type PaintingStyle = 'Kachni' | 'Bharni' | 'Godna' | 'Tantrik' | 'Kohbar';
export type PaintingTheme = 'Tree of Life' | 'Krishna & Deities' | 'Nature & Wildlife' | 'Cosmos & Sun' | 'Wedding & Kohbar';
export type PaintingMedium = 'Natural Pigments on Handmade Lokta Paper' | 'Vegetable Dyes on Khadi Silk' | 'Organic Pigments on Raw Canvas';
export type FrameOption = 'Unframed (Rolled in Archival Tube)' | 'Raw Sheesham Wood Frame' | 'Matte Ebony Frame' | 'Minimalist Warm Brass';

export interface MotifSymbol {
  name: string;
  meaning: string;
  iconName?: string;
}

export interface Painting {
  id: string;
  title: string;
  maithiliTitle: string; // Maithili script or phonetic name
  artistId: string;
  artistName: string;
  priceINR: number;
  year: number;
  style: PaintingStyle;
  theme: PaintingTheme;
  medium: PaintingMedium;
  dimensions: {
    cm: string;
    inches: string;
  };
  weightGrams: number;
  isOriginal: boolean;
  isAvailable: boolean; // false = Sold
  isFeatured: boolean;
  completionHours: number;
  story: string;
  pigmentsUsed: string[];
  motifs: MotifSymbol[];
  primaryImage: string;
  detailImages: string[];
  inRoomImage: string;
  artistSignatureImage?: string;
  certificateId: string;
  // True for the demo paintings seeded from the original scaffold's
  // placeholder stock photography — false once real inventory replaces them.
  isPlaceholder?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  maithiliName: string;
  village: string;
  district: string;
  state: string;
  yearsOfExperience: number;
  generation: string;
  specialtyStyle: PaintingStyle;
  bio: string;
  avatar: string;
  awards: string[];
  quote: string;
  // True for the four invented demo artists — false once real artist
  // bios/photos replace them.
  isPlaceholder?: boolean;
}

export interface CartItem {
  painting: Painting;
  frame: FrameOption;
  framePriceINR: number;
  addedAt: number;
  // The edition actually being purchased, and the price that was agreed to
  // for it at add-to-cart time. Cart/checkout/drawer must total off
  // unitPriceINR, never off painting.priceINR directly — priceINR is the
  // ORIGINAL's price only; a print is a fraction of it (see
  // ArtworkDetailModal's basePrice calc) and totaling off priceINR silently
  // overcharges anyone who chose a print.
  editionType: EditionType;
  unitPriceINR: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// One paid line item as the server records it — assembled from
// api/orders/verify.ts's response, not fabricated client-side. The
// certificate number is a real sequential value from order_items.id
// (see db/schema.sql), not derived from the order id.
export interface ConfirmedOrderItem {
  paintingId: string;
  paintingTitle: string;
  editionType: EditionType;
  frame: string;
  framePriceINR: number;
  unitPriceINR: number;
  certificateNumber: string;
}

export interface OrderConfirmation {
  orderRef: string;
  items: ConfirmedOrderItem[];
  shippingAddress: ShippingAddress;
  totalINR: number;
  currency: CurrencyCode;
  shippingCostINR: number;
  paymentMethod: 'razorpay';
  orderDate: string;
  estimatedDeliveryDate: string;
}
