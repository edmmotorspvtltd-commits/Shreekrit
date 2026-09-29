import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X, Check, ShieldCheck, Lock,
  Award, ArrowRight, Printer, AlertCircle
} from 'lucide-react';
import { CartItem, CurrencyCode, ShippingAddress, OrderConfirmation } from '../types';
import { formatPrice, convertPrice } from '../utils/currency';
import { SHIPPING_COST_INR, FREE_SHIPPING_THRESHOLD_INR } from '../data/paintings';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

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
      // No real payment gateway is wired up yet (separate, already-flagged
      // future work) — this simulates processing latency so the flow feels
      // real, then writes a genuine order record to Supabase. Nothing is
      // charged; status is only ever 'paid' after this simulated success,
      // never before.
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const itemsPayload = items.map((item) => ({
        painting_id: item.painting.id,
        painting_title: item.painting.title,
        edition_type: item.editionType,
        unit_price_inr: item.unitPriceINR,
        frame: item.frame,
        frame_price_inr: item.framePriceINR
      }));

      const totalAmountDisplay = convertPrice(grandTotalINR, currency);
      const estimatedDelivery = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      const estimatedDeliveryISO = estimatedDelivery.toISOString().slice(0, 10);

      let orderRow: { order_number: string; created_at: string };
      let orderItemRows: {
        painting_id: string;
        painting_title: string;
        edition_type: string;
        unit_price_inr: number | string;
        frame: string;
        frame_price_inr: number | string;
      }[];

      if (user) {
        // Logged-in: a direct RLS-gated insert — auth.uid() is derived
        // server-side from the session, so user_id can't be spoofed here.
        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            status: 'paid',
            currency,
            total_amount_inr: grandTotalINR,
            total_amount_display: totalAmountDisplay,
            shipping_address: formData,
            payment_method: 'razorpay',
            estimated_delivery_date: estimatedDeliveryISO
          })
          .select()
          .single();

        if (orderError || !insertedOrder) {
          throw new Error(orderError?.message || 'Could not create order');
        }

        const { data: insertedItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsPayload.map((item) => ({ ...item, order_id: insertedOrder.id })))
          .select();

        if (itemsError) {
          throw new Error(itemsError.message);
        }

        orderRow = insertedOrder;
        orderItemRows = insertedItems ?? [];
      } else {
        // Guest: routed through the create_guest_order() SECURITY DEFINER
        // function (see supabase/schema.sql) rather than a client-writable
        // insert — guest_email is set from a validated parameter, not a
        // spoofable column, and the order + items are created atomically.
        const { data, error } = await supabase.rpc('create_guest_order', {
          p_guest_email: formData.email,
          p_currency: currency,
          p_total_amount_inr: grandTotalINR,
          p_total_amount_display: totalAmountDisplay,
          p_shipping_address: formData,
          p_payment_method: 'razorpay',
          p_status: 'paid',
          p_estimated_delivery_date: estimatedDeliveryISO,
          p_items: itemsPayload
        });

        if (error || !data) {
          throw new Error(error?.message || 'Could not create order');
        }

        orderRow = data.order;
        orderItemRows = data.items ?? [];
      }

      const orderDate = new Date(orderRow.created_at);
      const confirmation: OrderConfirmation = {
        orderRef: orderRow.order_number,
        items: orderItemRows.map((row, i) => ({
          paintingId: row.painting_id,
          paintingTitle: row.painting_title,
          editionType: row.edition_type as CartItem['editionType'],
          frame: row.frame,
          framePriceINR: Number(row.frame_price_inr),
          unitPriceINR: Number(row.unit_price_inr),
          // Derived from the real order_number, not a random client-side
          // string — deterministic and traceable back to the DB row.
          certificateNumber: `${orderRow.order_number}-${String(i + 1).padStart(2, '0')}`
        })),
        shippingAddress: formData,
        totalINR: grandTotalINR,
        currency,
        shippingCostINR,
        paymentMethod: 'razorpay',
        // Always true today since no real gateway is wired up — keeps the
        // existing TEST MODE banner accurate until Razorpay integration
        // lands.
        testMode: true,
        orderDate: orderDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        estimatedDeliveryDate: estimatedDelivery.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      };

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
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'shipping' ? 'bg-[#8C2711] text-white' : 'bg-[#426B43] text-white'}`}>
                {step === 'payment' ? '✓' : '1'}
              </span>
              {t.checkout.stepShipping}
            </span>
            <div className="w-8 h-px bg-[#D5C2A7]" />
            <span className={`flex items-center gap-1.5 font-medium ${step === 'payment' ? 'text-[#8C2711]' : 'text-[#877260]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'payment' ? 'bg-[#8C2711] text-white' : 'bg-[#EAE0CD] text-[#7A6452]'}`}>
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
