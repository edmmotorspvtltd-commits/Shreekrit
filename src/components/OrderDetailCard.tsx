import React from 'react';
import { Truck, MapPin, Package } from 'lucide-react';
import { OrderRecord, OrderItemRecord } from '../types';
import { OrderStatusTimeline } from './OrderStatusTimeline';

// TODO: status/tracking_number/tracking_carrier are updated manually via
// the Supabase Table Editor for now (no admin UI exists yet — deliberately
// out of scope for this MVP). This component just renders whatever's in
// those columns; a real admin dashboard to edit them from a UI is planned
// future work, not built here.
interface OrderDetailCardProps {
  order: OrderRecord;
  items: OrderItemRecord[];
}

const formatStoredAmount = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export const OrderDetailCard: React.FC<OrderDetailCardProps> = ({ order, items }) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-mono font-bold text-[#8C2711] tracking-widest uppercase">
            {order.order_number}
          </span>
          <div className="text-xs text-[#7A6452] mt-0.5">Placed {formatDate(order.created_at)}</div>
        </div>
        <span className="font-serif-display text-xl font-bold text-[#241A14]">
          {formatStoredAmount(order.total_amount_display, order.currency)}
        </span>
      </div>

      <div className="p-4 bg-[#F4EADB] rounded border border-[#DFCDB3]">
        <OrderStatusTimeline status={order.status} />
      </div>

      {(order.tracking_number || order.tracking_carrier) && (
        <div className="p-3 bg-[#FAF5EA] rounded border border-[#D5C3A5] flex items-start gap-2 text-xs text-[#5A4535]">
          <Truck className="w-4 h-4 text-[#8C2711] flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[#241A14]">Tracking</div>
            {order.tracking_carrier && <div>{order.tracking_carrier}</div>}
            {order.tracking_number && <div className="font-mono">{order.tracking_number}</div>}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-[#5A4535] flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#8C2711]" />
          <span>Items</span>
        </h5>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs p-2.5 bg-[#FAF5EA] rounded border border-[#E8DEC8]">
              <div>
                <div className="font-medium text-[#241A14]">{item.painting_title}</div>
                <div className="text-[10px] text-[#7A6452]">
                  {item.frame} · {item.edition_type === 'original' ? 'Original' : 'Museum Print'}
                </div>
              </div>
              <span className="font-mono font-semibold text-[#5A4535]">
                {formatStoredAmount(Number(item.unit_price_inr) + Number(item.frame_price_inr), 'INR')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h5 className="text-xs font-semibold text-[#5A4535] flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#8C2711]" />
          <span>Shipping Address</span>
        </h5>
        <div className="text-xs text-[#5A4535] bg-[#FAF5EA] rounded border border-[#E8DEC8] p-2.5 leading-relaxed">
          <div className="font-medium text-[#241A14]">{order.shipping_address.fullName}</div>
          <div>{order.shipping_address.addressLine1}</div>
          {order.shipping_address.addressLine2 && <div>{order.shipping_address.addressLine2}</div>}
          <div>
            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postalCode}
          </div>
          <div>{order.shipping_address.country}</div>
        </div>
      </div>
    </div>
  );
};
