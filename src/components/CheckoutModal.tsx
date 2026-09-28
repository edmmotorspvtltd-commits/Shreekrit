import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X, Check, ShieldCheck, Lock,
  Award, ArrowRight, Printer, AlertCircle
} from 'lucide-react';
import { CartItem, CurrencyCode, ShippingAddress, OrderConfirmation } from '../types';
import { formatPrice } from '../utils/currency';
import { SHIPPING_COST_INR, FREE_SHIPPING_THRESHOLD_INR } from '../data/paintings';
import { useLanguage } from '../context/LanguageContext';
import { openRazorpayCheckout } from '../utils/razorpay';

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
  if (!isOpen) return null;

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderConfirmation | null>(null);

  // Form State — left blank; this is a real order form, not a filled-in demo.
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

  const subtotalINR = items.reduce(
    (sum, item) => sum + item.unitPriceINR + item.framePriceINR,
    0
  );

  // Shipping calculation
  // Free insured shipping on orders above ₹40,000 (~$500)
  const isFreeShipping = subtotalINR > FREE_SHIPPING_THRESHOLD_INR;
  const shippingCostINR = isFreeShipping ? 0 : SHIPPING_COST_INR;
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

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Server recomputes every price from the database and creates the
      // real Razorpay order — the client never decides what gets charged.
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            paintingId: item.painting.id,
            editionType: item.editionType,
            frame: item.frame
          })),
          shipping: formData,
          currency
        })
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || 'Could not start checkout');
      }

      // No Razorpay keys configured yet — the server already recorded a
      // clearly-marked test_paid order (see api/orders/create.ts) and
      // handed back a full confirmation directly, skipping the real
      // gateway entirely. Nothing was charged.
      if (createData.testMode) {
        setIsProcessing(false);
        setCompletedOrder(createData as OrderConfirmation);
        setStep('confirmation');
        onClearCart();

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8C2711', '#E5A93C', '#2A4B7C', '#426B43']
        });
        return;
      }

      await openRazorpayCheckout({
        keyId: createData.keyId,
        amountPaise: createData.amountPaise,
        razorpayOrderId: createData.razorpayOrderId,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone
        },
        onDismiss: () => setIsProcessing(false),
        onSuccess: async (response) => {
          const verifyRes = await fetch('/api/orders/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dbOrderId: createData.dbOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const order: OrderConfirmation = await verifyRes.json();
          if (!verifyRes.ok) {
            throw new Error((order as any).error || 'Payment could not be verified');
          }

          setIsProcessing(false);
          setCompletedOrder(order);
          setStep('confirmation');
          onClearCart();

          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8C2711', '#E5A93C', '#2A4B7C', '#426B43']
          });
        },
        onFailure: (description) => {
          setIsProcessing(false);
          setPaymentError(description);
        }
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
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'shipping' ? 'bg-[#8C2711] text-white' : 'bg-[#426B43] text-white'}`}>
                {step === 'payment' ? '✓' : '1'}
              </span>
              {t.checkout.shippingTitle}
            </span>
            <div className="w-8 h-px bg-[#D5C2A7]" />
            <span className={`flex items-center gap-1.5 font-medium ${step === 'payment' ? 'text-[#8C2711]' : 'text-[#877260]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'payment' ? 'bg-[#8C2711] text-white' : 'bg-[#EAE0CD] text-[#7A6452]'}`}>
                2
              </span>
              {t.checkout.paymentTitle}
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
                  {t.checkout.shippingTitle}
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
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.city}
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                      {t.checkout.postalCode}
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
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
                    <span>{t.checkout.continuePayment}</span>
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
                        src={item.painting.primaryImage}
                        alt={item.painting.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded object-cover border border-[#D5C3A5]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#241A14] truncate">{item.painting.title}</div>
                        <div className="text-[10px] text-[#7A6452] truncate">
                          {item.frame} · {item.editionType === 'original' ? 'Original' : 'Museum Print'}
                        </div>
                      </div>
                      <span className="font-mono font-semibold">
                        {formatPrice(item.unitPriceINR + item.framePriceINR, currency)}
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

                <div className="p-2.5 bg-[#FAF5EA] rounded border border-[#D5C3A5] text-[11px] text-[#695343] space-y-1">
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
                  Secure Payment via Razorpay
                </h4>
                <p className="text-xs text-[#6B5747]">
                  Cards, UPI, netbanking, and wallets — all transactions are encrypted with 256-bit SSL protocols.
                </p>
              </div>

              <div className="bg-[#F4EADB] p-5 rounded border border-[#DFCDB3] flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#2A4B7C] flex-shrink-0" />
                <p className="text-xs text-[#5A4535]">
                  You'll be taken to Razorpay's secure checkout to complete payment. Shreekrit never sees or
                  stores your card, UPI, or bank details.
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
                    <span className="animate-pulse">Opening Razorpay...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.checkout.payNow} ({formatPrice(grandTotalINR, currency)})</span>
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
                  TEST MODE — Razorpay isn't configured yet. Nothing was charged; this preview lets you review the
                  confirmation and certificate layout ahead of real payments going live.
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
                  {t.checkout.orderSuccess}
                </h4>
                <p className="text-xs sm:text-sm text-[#665141] mt-2 max-w-md mx-auto">
                  A formal notification has been dispatched to {completedOrder.shippingAddress.email}. The master artisan in Madhubani has been notified to prepare the custom certificate of authenticity.
                </p>
              </div>

              {/* Printable Certificate of Authenticity Preview Card */}
              <div className="p-6 bg-[#FFFDF9] rounded-lg border-2 border-[#8C2711] shadow-md text-left space-y-4 relative overflow-hidden">
                <div className="absolute top-2 right-3 text-[10px] font-mono text-[#8C2711]/60">
                  OFFICIAL GUILD REGISTRATION
                </div>

                <div className="text-center border-b border-[#E0D0B8] pb-3">
                  <h5 className="font-serif-display font-bold text-xl text-[#8C2711]">
                    Shreekrit Certificate of Authenticity
                  </h5>
                  <p className="text-[11px] text-[#7A6452] italic">
                    {completedOrder.items[0]?.editionType === 'print'
                      ? 'Certified Limited Giclée Edition of Madhubani Folk Art, Bihar, India'
                      : 'Certified Hand-Painted Original Folk Art of Madhubani, Bihar, India'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[#8C7665] block text-[10px]">Collector / Custodian</span>
                    <span className="font-bold text-[#241A14]">{completedOrder.shippingAddress.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[10px]">Date of Certification</span>
                    <span className="font-bold text-[#241A14]">{completedOrder.orderDate}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[10px]">Estimated Delivery to Door</span>
                    <span className="font-bold text-[#426B43]">{completedOrder.estimatedDeliveryDate}</span>
                  </div>
                  <div>
                    <span className="text-[#8C7665] block text-[10px]">
                      {completedOrder.items[0]?.editionType === 'print' ? 'Print Edition Certificate ID' : 'Registry Certificate ID'}
                    </span>
                    <span className="font-mono font-bold text-[#8C2711]">
                      {completedOrder.items[0]?.certificateNumber ?? completedOrder.orderRef}
                    </span>
                  </div>
                </div>

                {completedOrder.items.length > 1 && (
                  <div className="pt-2 border-t border-[#E0D0B8] space-y-1">
                    {completedOrder.items.slice(1).map((item, i) => (
                      <div key={i} className="flex justify-between text-[10px] text-[#7A6452]">
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
