import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X, Check, ShieldCheck, Lock,
  Award, ArrowRight, Printer, AlertCircle
} from 'lucide-react';
import { CartItem, CurrencyCode, ShippingAddress, OrderConfirmation } from '../types';
import { formatPrice, convertPrice } from '../utils/currency';
import { FREE_SHIPPING_THRESHOLD_INR } from '../data/paintings';
import { isPouchItem, cartItemKey, cartItemTitle, cartItemImage, cartLineTotalINR, cartSubtotalINR, cartShippingINR } from '../utils/cart';
import { handleImageError } from '../utils/imageFallback';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currency: CurrencyCode;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  currency,
  onClearCart
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);

  // Form state — left blank for the customer to fill in.
  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });

  const subtotalINR = cartSubtotalINR(items);

  // Shipping calculation
  // Free insured shipping on orders above ₹40,000 (~$500)
  // Mirrors the server (computeShippingINR in api/orders/create.ts), which
  // recomputes the charged amount itself.
  const shippingCostINR = cartShippingINR(items);
  const isFreeShipping = shippingCostINR === 0 && subtotalINR > FREE_SHIPPING_THRESHOLD_INR;
  const grandTotalINR = subtotalINR + shippingCostINR;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  // Only paintings get a certificate of authenticity.
  const certItems = completedOrder ? completedOrder.items.filter((item) => item.productType !== 'pouch') : [];

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const payload = {
        items: items.map(item => isPouchItem(item)
          ? { productType: 'pouch', pouchId: item.pouch.id, quantity: item.quantity }
          : {
              productType: 'painting',
              paintingId: item.painting.id,
              editionType: item.editionType,
              frame: item.frame
            }),
        shipping: formData,
        currency
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      const confirmation = data as OrderConfirmation;

      setIsProcessing(false);
      setCompletedOrder(confirmation);
      setStep('confirmation');
      onClearCart();

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8C2711', '#E5A93C', '#2A4B7C', '#426B43']
      });
    } catch (err) {
      setIsProcessing(false);
      setPaymentError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-[#1A120B]/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E0D0B8] bg-[#F4EADB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded bg-[#8C2711] text-white">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-serif-display font-bold text-lg text-[#241A14]">
                {step === 'confirmation' ? 'Acquisition Confirmed' : 'Direct Artisan Checkout'}
              </h3>
              <p className="text-xs text-[#7A6452]">
                Guaranteed Authenticity & Insured International Logistics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer"
            aria-label="Close checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper progress (hidden on confirmation) */}
        {step !== 'confirmation' && (
          <div className="px-6 py-2 bg-[#FAF5EA] border-b border-[#E0D0B8] flex items-center justify-center gap-8 text-xs">
            <span className={`flex items-center gap-1.5 font-medium ${step === 'shipping' ? 'text-[#8C2711]' : 'text-[#426B43]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] ${step === 'shipping' ? 'bg-[#8C2711] text-white' : 'bg-[#426B43] text-white'}`}>
                {step === 'payment' ? '✓' : '1'}
              </span>
              {t.checkout.stepShipping}
            </span>
            <div className="w-8 h-px bg-[#D5C2A7]" />
            <span className={`flex items-center gap-1.5 font-medium ${step === 'payment' ? 'text-[#8C2711]' : 'text-[#877260]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[12px] ${step === 'payment' ? 'bg-[#8C2711] text-white' : 'bg-[#EAE0CD] text-[#7A6452]'}`}>
                2
              </span>
              {t.checkout.stepPayment}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Shipping Fields */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="font-serif-display text-lg font-bold text-[#241A14]">
                  {t.checkout.stepShipping}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.fullName}
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.email}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.checkout.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.checkout.address}
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    required
                    autoComplete="address-line1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.city}
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      autoComplete="address-level1"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.postalCode}
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      autoComplete="postal-code"
                      inputMode="numeric"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.checkout.country}
                  </label>
                  <select
                    name="country"
                    required
                    autoComplete="country-name"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  >
                    <option value="" disabled>Select a country</option>
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Switzerland">Switzerland</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{t.checkout.continueBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-5 bg-[#F4EADB] p-5 rounded border border-[#DFCDB3] space-y-4">
                <h4 className="font-serif-display font-bold text-base text-[#241A14]">
                  Acquisition Summary
                </h4>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2.5 items-center text-xs">
                      <img
                        src={cartItemImage(item)}
                        alt={cartItemTitle(item)}
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                        className="w-12 h-12 rounded object-cover border border-[#D5C3A5]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#241A14] truncate">{cartItemTitle(item)}</div>
                        <div className="text-[12px] text-[#7A6452] truncate">
                          {isPouchItem(item)
                            ? `Hand-painted pouch × ${item.quantity}`
                            : `${item.frame} · ${item.editionType === 'original' ? 'Original' : 'Museum Print'}`}
                        </div>
                      </div>
                      <span className="font-mono font-semibold">
                        {formatPrice(cartLineTotalINR(item), currency)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#DFCDB3] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B5747]">
                    <span>Artwork Subtotal</span>
                    <span>{formatPrice(subtotalINR, currency)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B5747]">
                    <span>Insured Global Courier</span>
                    <span>{isFreeShipping ? 'FREE (Threshold met)' : formatPrice(shippingCostINR, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#241A14] pt-2 border-t border-[#DFCDB3]">
                    <span>Total Investment</span>
                    <span className="font-serif-display text-lg">{formatPrice(grandTotalINR, currency)}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF5EA] rounded border border-[#D5C3A5] text-[12px] text-[#695343] space-y-1">
                  <div className="font-semibold text-[#8C2711] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Fair-Trade Direct Promise
                  </div>
                  <div>85%+ of net proceeds go directly into the artisan bank account in Madhubani.</div>
                </div>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <form onSubmit={handlePaymentSubmit} className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h4 className="font-serif-display text-2xl font-bold text-[#241A14]">
                  Review & Confirm Order
                </h4>
                <p className="text-xs text-[#6B5747]">
                  Real payment processing isn't live yet — confirming below simulates a successful payment so you
                  can preview the full order flow. No card, UPI, or bank details are collected.
                </p>
              </div>

              <div className="bg-[#F4EADB] p-5 rounded border border-[#DFCDB3] flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#2A4B7C] flex-shrink-0" />
                <p className="text-xs text-[#5A4535]">
                  Your order — items, shipping address, and total — is still saved for real once confirmed. Only the
                  payment step itself is a preview; a real gateway is separate, already-planned future work.
                </p>
              </div>

              {paymentError && (
                <div className="bg-[#FBEAE5] border border-[#C94A29]/40 rounded p-3 flex items-start gap-2 text-xs text-[#8C2711]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-[#241A14]">
                <span>Total Charge:</span>
                <span className="font-serif-display text-2xl text-[#8C2711]">
                  {formatPrice(grandTotalINR, currency)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('shipping')}
                  className="px-4 py-2.5 rounded border border-[#D5C3A5] text-xs font-semibold text-[#5A4535] hover:bg-[#F3EADA] transition-colors cursor-pointer"
                >
                  Back to Address
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  id="pay-and-complete-order-btn"
                  className="flex-1 py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">{t.checkout.processing}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.checkout.payBtn} {formatPrice(grandTotalINR, currency)}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'confirmation' && completedOrder && (
            <div className="max-w-2xl mx-auto space-y-6 text-center">
              {completedOrder.testMode && (
                <div className="bg-[#FBEAE5] border border-[#C94A29]/40 rounded p-3 text-xs text-[#8C2711] font-semibold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  TEST MODE — real payment processing isn't live yet. Nothing was charged, but this order and its
                  items are saved for real, so you can review the confirmation and certificate layout ahead of
                  real payments going live.
                </div>
              )}

              <div className="w-16 h-16 rounded-full bg-[#E8F0E5] border-2 border-[#426B43] flex items-center justify-center mx-auto text-[#426B43]">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#8C2711] tracking-widest uppercase">
                  Order Reference: {completedOrder.orderRef}
                </span>
                <h4 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#241A14] mt-1">
                  {t.checkout.confirmedTitle}
                </h4>
                <p className="text-xs sm:text-sm text-[#665141] mt-2 max-w-md mx-auto">
                  A formal notification has been dispatched to {completedOrder.shippingAddress.email}. The master artisan in Madhubani has been notified to prepare the custom certificate of authenticity.
                </p>
              </div>

              {/* Pouches carry no certificate; list them separately. */}
              {completedOrder.items.some((item) => item.productType === 'pouch') && (
                <div className="p-4 bg-[#FFFDF9] rounded-lg border border-[#E0D0B8] text-left text-xs space-y-1">
                  {completedOrder.items.filter((item) => item.productType === 'pouch').map((item, i) => (
                    <div key={i} className="flex justify-between text-[#5A4535]">
                      <span>{item.paintingTitle} × {item.quantity ?? 1}</span>
                      <span className="font-mono">{formatPrice((item.unitPriceINR + item.framePriceINR) * (item.quantity ?? 1), currency)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Printable Certificate of Authenticity Preview Card (paintings only) */}
              {certItems.length > 0 && (
              <div className="p-6 bg-[#FFFDF9] rounded-lg border-2 border-[#8C2711] shadow-md text-left space-y-4 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-[12px] font-mono text-[#8C2711]/60">
                  OFFICIAL GUILD REGISTRATION
                </div>

                <div className="text-center border-b border-[#E0D0B8] pb-3">
                  <h5 className="font-serif-display font-bold text-xl text-[#8C2711]">
                    Shreekrit Certificate of Authenticity
                  </h5>
                  <p className="text-[12px] text-[#7A6452] italic">
                    {certItems[0]?.editionType === 'print'
                      ? 'Certified Limited Giclée Edition of Madhubani Folk Art, Bihar, India'
                      : 'Certified Hand-Painted Original Folk Art of Madhubani, Bihar, India'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8C7665] block text-[12px]">Collector / Custodian</span>
                    <span className="font-bold text-[#241A14]">{completedOrder.shippingAddress.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[12px]">Date of Certification</span>
                    <span className="font-bold text-[#241A14]">{completedOrder.orderDate}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[12px]">Estimated Delivery to Door</span>
                    <span className="font-bold text-[#426B43]">{completedOrder.estimatedDeliveryDate}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[12px]">
                      {certItems[0]?.editionType === 'print' ? 'Print Edition Certificate ID' : 'Registry Certificate ID'}
                    </span>
                    <span className="font-mono font-bold text-[#8C2711]">
                      {certItems[0]?.certificateNumber ?? completedOrder.orderRef}
                    </span>
                  </div>
                </div>

                {certItems.length > 1 && (
                  <div className="pt-2 border-t border-[#E0D0B8] space-y-1">
                    {certItems.slice(1).map((item, i) => (
                      <div key={i} className="flex justify-between text-[12px] text-[#7A6452]">
                        <span>{item.paintingTitle} ({item.editionType === 'print' ? 'Print' : 'Original'})</span>
                        <span className="font-mono font-bold text-[#8C2711]">{item.certificateNumber}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-[#E0D0B8] pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#8C2711]" />
                    <span className="text-[#5A4535]">Physical Hand-Signed Document Attached with Shipment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 text-[#8C2711] hover:underline font-semibold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Receipt
                  </button>
                </div>
              </div>
              )}

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md transition-colors cursor-pointer"
                >
                  Return to Gallery
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
