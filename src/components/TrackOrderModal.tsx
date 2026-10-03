import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Search, AlertCircle, ArrowLeft } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '../types';
import { OrderDetailCard } from './OrderDetailCard';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: OrderRecord; items: OrderItemRecord[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({ order_ref: orderNumber.trim(), email: email.trim() });
      const res = await fetch(`/api/orders/track?${params}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setError('No order found with that order number and email. Double-check both and try again.');
      } else if (res.status === 400) {
        setError(data.error || 'Please check your order number and email and try again.');
      } else if (!res.ok || !data.order) {
        setError('Something went wrong looking up your order. Please try again.');
      } else {
        setResult({ order: data.order, items: data.order.order_items ?? [] });
      }
    } catch {
      setError('Something went wrong looking up your order. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    setOrderNumber('');
    setEmail('');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#1A120B]/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        <div className="p-4 sm:p-5 border-b border-[#E0D0B8] bg-[#F4EADB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-[#8C2711] text-white">
              <Search className="w-4 h-4" />
            </span>
            <h3 className="font-serif-display font-bold text-lg text-[#241A14]">
              Track Your Order
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {result ? (
            <div className="space-y-4">
              <button
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Search Again</span>
              </button>
              <OrderDetailCard order={result.order} items={result.items} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#7A6452]">
                Enter the order number from your confirmation and the email you checked out with.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="SHK-000123"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                />
              </div>

              {error && (
                <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{isSearching ? 'Searching...' : 'Track Order'}</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
