import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Pouch, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { handleImageError } from '../utils/imageFallback';
import { pouchPath } from '../utils/routes';
import { LOW_STOCK_THRESHOLD } from '../utils/cart';
import { Link } from './Link';

interface PouchCardProps {
  pouch: Pouch;
  currency: CurrencyCode;
  onAdd: (pouch: Pouch) => void;
}

export const PouchCard: React.FC<PouchCardProps> = ({ pouch, currency, onAdd }) => {
  const soldOut = pouch.quantity <= 0;
  const lowStock = !soldOut && pouch.quantity <= LOW_STOCK_THRESHOLD;

  return (
    <div className="bg-[#FFFDF9] border border-[#E2D4BF] rounded-lg overflow-hidden shadow-sm flex flex-col">
      <Link to={pouchPath(pouch)} className="block relative aspect-square bg-[#EADDC9]" aria-label={`View ${pouch.name}`}>
        <img
          src={pouch.images[0]}
          alt={pouch.name}
          referrerPolicy="no-referrer"
          onError={handleImageError}
          loading="lazy"
          className={`w-full h-full object-cover ${soldOut ? 'opacity-60' : ''}`}
        />
        {soldOut && (
          <span className="absolute top-3 left-3 bg-[#7A2818] text-white text-[12px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
            Sold out
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 bg-[#E5A93C] text-[#241A14] text-[12px] font-semibold px-2 py-1 rounded">
            Only {pouch.quantity} left
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <Link to={pouchPath(pouch)} className="font-serif text-base font-bold text-[#241A14] hover:text-[#8C2711]">
          {pouch.name}
        </Link>
        <div className="text-[12px] text-[#7A604D]">
          by {pouch.artistName} · {pouch.sizeCm} cm
        </div>
        <div className="text-[12px] text-[#7A604D]">{pouch.material}</div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-serif-display text-lg font-bold text-[#241A14]">{formatPrice(pouch.priceINR, currency)}</span>
          <button
            type="button"
            disabled={soldOut}
            onClick={() => onAdd(pouch)}
            aria-label={`Add ${pouch.name} to cart`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#8C2711] cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
