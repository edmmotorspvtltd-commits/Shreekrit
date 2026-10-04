import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Share2, ShoppingBag, Sparkles, Minus, Plus } from 'lucide-react';
import { Pouch, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { handleImageError } from '../utils/imageFallback';
import { LOW_STOCK_THRESHOLD, MAX_PIECES_PER_POUCH } from '../utils/cart';

interface PouchDetailModalProps {
  pouch: Pouch;
  currency: CurrencyCode;
  onClose: () => void;
  onAddToCart: (pouch: Pouch, quantity: number) => void;
  onBuyNow: (pouch: Pouch, quantity: number) => void;
}

export const PouchDetailModal: React.FC<PouchDetailModalProps> = ({ pouch, currency, onClose, onAddToCart, onBuyNow }) => {
  const [imageIndex, setImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);

  const soldOut = pouch.quantity <= 0;
  const maxQty = Math.max(1, Math.min(pouch.quantity, MAX_PIECES_PER_POUCH));
  const lowStock = !soldOut && pouch.quantity <= LOW_STOCK_THRESHOLD;

  const share = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const details: [string, string][] = [
    ['Size', `${pouch.sizeCm} cm`],
    ['Material', pouch.material],
    ['Paint', pouch.paintType],
    ['Artist', pouch.artistName]
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-[#1A120B]/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-5xl bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        <div className="px-5 py-3 border-b border-[#E2D2BC] flex items-center justify-between bg-[#F4EADB]">
          <span className="font-serif italic font-semibold text-[#8C2711] text-xs">Shreekrit · Pouches</span>
          <div className="flex items-center gap-2">
            <button onClick={share} className="p-1.5 rounded-full hover:bg-[#E8DAC5] text-[#5C4230] text-xs flex items-center gap-1 cursor-pointer" title="Share">
              <Share2 className="w-4 h-4" />
              {copied && <span className="text-[12px] text-[#8C2711] font-semibold">Link Copied!</span>}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#E8DAC5] text-[#241A14] cursor-pointer" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="aspect-square rounded-md bg-[#EADDC9] border border-[#D5C3A5] overflow-hidden">
                <img
                  src={pouch.images[imageIndex] ?? pouch.images[0]}
                  alt={`${pouch.name}, image ${imageIndex + 1}`}
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  className="w-full h-full object-cover"
                />
              </div>
              {pouch.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {pouch.images.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setImageIndex(i)}
                      aria-label={`Show image ${i + 1}`}
                      className={`aspect-square rounded border overflow-hidden cursor-pointer ${i === imageIndex ? 'border-[#8C2711] ring-1 ring-[#8C2711]' : 'border-[#D5C3A5]'}`}
                    >
                      <img src={src} alt="" referrerPolicy="no-referrer" onError={handleImageError} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#241A14]">{pouch.name}</h2>
                <p className="text-sm text-[#665141] mt-1">Hand-painted pouch by {pouch.artistName}</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-serif-display text-3xl font-bold text-[#241A14]">{formatPrice(pouch.priceINR, currency)}</span>
                {soldOut && <span className="text-xs font-semibold uppercase tracking-wider text-white bg-[#7A2818] px-2 py-1 rounded">Sold out</span>}
                {lowStock && <span className="text-xs font-semibold text-[#241A14] bg-[#E5A93C] px-2 py-1 rounded">Only {pouch.quantity} left</span>}
              </div>

              <p className="text-sm text-[#4A3A2E] leading-relaxed">{pouch.description}</p>

              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm border-t border-b border-[#E0D0B8] py-4">
                {details.map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt className="text-[#8C7665]">{k}</dt>
                    <dd className="text-[#241A14] font-medium">{v}</dd>
                  </React.Fragment>
                ))}
              </dl>

              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#8C2711] mb-1">Care</h3>
                <p className="text-sm text-[#4A3A2E] leading-relaxed">{pouch.careInstructions}</p>
              </div>

              {!soldOut ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#7A6452]">Quantity</span>
                    <div className="inline-flex items-center border border-[#D5C3A5] rounded">
                      <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 disabled:opacity-40 cursor-pointer">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{qty}</span>
                      <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="p-2 disabled:opacity-40 cursor-pointer">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onBuyNow(pouch, qty)}
                      className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" /> Buy now
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(pouch, qty)}
                      className="w-full py-3 border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-white rounded text-sm font-semibold tracking-wide bg-[#FAF5EA] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to cart
                    </button>
                  </div>
                </div>
              ) : (
                <p className="p-3 bg-[#7A2818]/10 border border-[#7A2818]/30 rounded text-sm text-[#5C4535] text-center">
                  This design is sold out.
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
