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
export type PaintingMedium = 'Hand-Painted on Handmade Paper' | 'Natural Pigments on Handmade Lokta Paper' | 'Vegetable Dyes on Khadi Silk' | 'Organic Pigments on Raw Canvas';
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
  // True for placeholder paintings that use stock photography — false for
  // real inventory.
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
  // True for placeholder artist profiles — false once a real bio and photo
  // are in place.
  isPlaceholder?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
  coverImage: string;
  author: string;
  // True for placeholder posts — false once real editorial content replaces
  // them. Mirrors Painting/Artist's isPlaceholder convention.
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

// One paid line item as CheckoutModal assembles it right after a
// successful order write to Supabase (see handlePaymentSubmit in
// CheckoutModal.tsx and supabase/schema.sql) — not fabricated client-side.
// The certificate number is derived from the real DB order_number, not a
// random client-side string.
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
  // True when this order bypassed Razorpay entirely because no gateway
  // keys are configured yet — nothing was charged. See api/orders/create.ts.
  testMode?: boolean;
  orderDate: string;
  estimatedDeliveryDate: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// A row as it actually comes back from Supabase (orders/order_items via
// supabase-js or the get_guest_order/create_guest_order RPCs) — snake_case
// on purpose, matching supabase/schema.sql's columns directly rather than
// remapping to camelCase, since these are read straight off query results
// in MyOrdersSection.tsx / TrackOrderModal.tsx / CheckoutModal.tsx.
export interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  status: OrderStatus;
  currency: string;
  total_amount_inr: number;
  total_amount_display: number;
  shipping_address: ShippingAddress;
  payment_method: string;
  tracking_number: string | null;
  tracking_carrier: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  painting_id: string;
  painting_title: string;
  edition_type: string;
  unit_price_inr: number;
  frame: string;
  frame_price_inr: number;
}
