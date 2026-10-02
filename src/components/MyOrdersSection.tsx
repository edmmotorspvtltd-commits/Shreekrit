import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, ShieldAlert } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PAINTINGS } from '../data/paintings';
import { handleImageError } from '../utils/imageFallback';
import { OrderDetailCard } from './OrderDetailCard';

interface MyOrdersSectionProps {
  onOpenAuth: () => void;
}

type OrderWithItems = OrderRecord & { order_items: OrderItemRecord[] };

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-[#EFE4D2] text-[#7A6452]',
  paid: 'bg-[#E5EEE2] text-[#426B43]',
  processing: 'bg-[#E5EEF5] text-[#2A4B7C]',
  shipped: 'bg-[#F4E5D2] text-[#8C5A11]',
  delivered: 'bg-[#E5EEE2] text-[#426B43]',
  cancelled: 'bg-[#FBEAE6] text-[#8C2711]'
};

// order_items only snapshots painting_id/painting_title (see
// supabase/schema.sql) — no image, since it's not a DB table. This is a
// best-effort lookup against the static seed data for a thumbnail; an order
// for a painting no longer in that list just shows the fallback icon.
const thumbnailFor = (paintingId: string) => PAINTINGS.find((p) => p.id === paintingId)?.primaryImage;

export const MyOrdersSection: React.FC<MyOrdersSectionProps> = ({ onOpenAuth }) => {
  const { user, session, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/orders/list', {
          headers: { Authorization: `Bearer ${session?.access_token ?? ''}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch orders');
        }
        
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setOrders(data.orders || []);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || 'Something went wrong');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, session?.access_token]);

  if (authLoading) {
    return <div className="py-24 text-center text-sm text-[#8C7665]">Loading…</div>;
  }

  if (!user) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#F4EADB] border border-[#DFCDB3] flex items-center justify-center mx-auto text-[#8C2711]">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-serif-display font-bold text-[#241A14]">Log In to View Your Orders</h1>
        <p className="text-xs text-[#665141]">
          Order history is tied to your account. Log in or sign up to see past acquisitions.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-semibold cursor-pointer"
        >
          Log In / Sign Up
        </button>
      </section>
    );
  }

  if (selectedOrder) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setSelectedOrder(null)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </button>
        <OrderDetailCard order={selectedOrder} items={selectedOrder.order_items} />
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif-display font-bold text-[#241A14]">My Orders</h1>
        <p className="text-sm text-[#5C4A3C]">{user.email}</p>
      </div>

      {isLoading && <div className="py-16 text-center text-sm text-[#8C7665]">Loading orders…</div>}

      {error && (
        <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711] text-center">
          {error}
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <Package className="w-10 h-10 text-[#D5C3A5] mx-auto" />
          <p className="text-sm text-[#8C7665]">No orders yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="w-full text-left p-4 bg-[#FAF5EA] rounded border border-[#E2D4BF] hover:border-[#8C2711]/50 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
          >
            <div className="flex -space-x-3 flex-shrink-0">
              {order.order_items.slice(0, 3).map((item, i) => {
                const thumb = thumbnailFor(item.painting_id);
                return thumb ? (
                  <img
                    key={item.id}
                    src={thumb}
                    alt={item.painting_title}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="w-10 h-10 rounded object-cover border-2 border-[#FAF5EA] shadow-sm"
                    style={{ zIndex: 3 - i }}
                  />
                ) : (
                  <div
                    key={item.id}
                    className="w-10 h-10 rounded bg-[#EFE6D5] border-2 border-[#FAF5EA] shadow-sm flex items-center justify-center"
                    style={{ zIndex: 3 - i }}
                  >
                    <Package className="w-4 h-4 text-[#A08D78]" />
                  </div>
                );
              })}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#8C2711]">{order.order_number}</span>
                <span className={`text-[12px] uppercase font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] || ''}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[12px] text-[#7A6452] mt-1">
                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <span className="font-serif-display font-bold text-[#241A14]">
              {order.currency} {Math.round(order.total_amount_display).toLocaleString()}
            </span>
            <ArrowRight className="w-4 h-4 text-[#8C2711] flex-shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
};
