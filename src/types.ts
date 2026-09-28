export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type Language = 'en' | 'hi' | 'mai';


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
}

export interface CartItem {
  painting: Painting;
  frame: FrameOption;
  framePriceINR: number;
  addedAt: number;
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

export interface OrderConfirmation {
  orderId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalINR: number;
  currency: CurrencyCode;
  totalInCurrency: number;
  shippingCostINR: number;
  paymentMethod: 'razorpay' | 'stripe' | 'paypal';
  orderDate: string;
  estimatedDeliveryDate: string;
}
