import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { CartItem, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { handleImageError } from '../utils/imageFallback';
import { useLanguage } from '../context/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyCode;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onRemoveItem,
  onCheckout
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  const subtotalINR = items.reduce(
    (sum, item) => sum + item.unitPriceINR + item.framePriceINR,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#1A120B]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-2 sm:pl-10">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-screen max-w-md bg-[#FAF5EA] border-l-4 border-[#8C2711] shadow-2xl flex flex-col justify-between"
        >
          {/* Drawer Header styled like an artisanal framed plaque */}
          <div className="p-5 border-b border-[#E0D0B8] bg-[#F4EADB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded bg-[#8C2711] text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif-display font-bold text-lg text-[#241A14]">
                  {t.cart.title}
                </h3>
                <span className="text-xs text-[#7A6452]">
                  {items.length} {t.cart.itemsCount}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              id="close-cart-drawer-btn"
              className="p-1.5 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F3EADA] border border-[#DFCDB3] flex items-center justify-center mx-auto text-[#8C2711]">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-[#241A14]">
                    {t.cart.emptyTitle}
                  </h4>
                  <p className="text-xs text-[#6B5747] max-w-xs mx-auto">
                    {t.cart.emptyDesc}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  {t.cart.exploreCollection}
                </button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div
                  key={`${item.painting.id}-${idx}`}
                  className="p-3 bg-[#FAF5EA] rounded border border-[#E0D0B8] shadow-sm flex gap-3 relative group"
                >
                  <img
                    src={item.painting.primaryImage}
                    alt={item.painting.title}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="w-20 h-20 object-cover rounded border border-[#DFCDB3] flex-shrink-0"
                  />

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-serif text-sm font-bold text-[#241A14] truncate">
                        {(language === 'mai' || language === 'hi') && item.painting.maithiliTitle ? item.painting.maithiliTitle : item.painting.title}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(idx)}
                        className="text-[#994736] hover:text-[#7A1F10] p-1 transition-colors cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-[#7A604D] truncate">
                      {t.gallery.byArtist} {item.painting.artistName}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-[#8C2711] bg-[#F4EBDB] px-1.5 py-0.5 rounded inline-block font-mono">
                        {item.frame}
                      </span>
                      <span className="text-[11px] text-[#3E5C38] bg-[#E8F0E5] px-1.5 py-0.5 rounded inline-block font-mono">
                        {item.editionType === 'original' ? 'Original' : 'Museum Print'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-[#6E5948] text-[10px]">
                        {item.painting.dimensions.inches}
                      </span>
                      <span className="font-bold text-[#241A14] font-serif-display text-sm">
                        {formatPrice(item.unitPriceINR + item.framePriceINR, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#E0D0B8] bg-[#F4EADB] space-y-3">
              {/* International Shipping Guarantee */}
              <div className="flex items-center gap-2 text-[11px] text-[#3E5C38] bg-[#E8F0E5] p-2 rounded border border-[#C6DCBF]">
                <Truck className="w-4 h-4 flex-shrink-0" />
                <span>{t.cart.shippingGuarantee}</span>
              </div>

              {/* Subtotal */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs uppercase tracking-wider text-[#6E5948] font-semibold">
                  {t.cart.subtotal}
                </span>
                <span className="font-serif-display text-2xl font-bold text-[#241A14]">
                  {formatPrice(subtotalINR, currency)}
                </span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={onCheckout}
                id="cart-drawer-checkout-btn"
                className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>{t.cart.checkoutBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#7A6452]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8C2711]" />
                <span>{t.cart.coaNotice}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

