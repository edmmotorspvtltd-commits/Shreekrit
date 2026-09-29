import React from 'react';
import { Check, X } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderStatusTimelineProps {
  status: OrderStatus;
}

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending_payment', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-[#8C2711] bg-[#FBEAE6] border border-[#E0A192] rounded px-3 py-2">
        <X className="w-4 h-4 flex-shrink-0" />
        <span>Order Cancelled</span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isReached = i <= currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1 min-w-[64px]">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                  isReached
                    ? 'bg-[#8C2711] border-[#8C2711] text-white'
                    : 'bg-[#FAF5EA] border-[#D5C3A5] text-[#A08D78]'
                }`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[10px] text-center font-medium ${
                  isCurrent ? 'text-[#8C2711] font-bold' : isReached ? 'text-[#5A4535]' : 'text-[#A08D78]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-3 ${i < currentIndex ? 'bg-[#8C2711]' : 'bg-[#D5C3A5]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
