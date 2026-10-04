import React, { useMemo, useState } from 'react';
import { Pouch, CurrencyCode } from '../types';
import { PouchCard } from './PouchCard';

interface PouchesSectionProps {
  pouches: Pouch[];
  loaded: boolean;
  currency: CurrencyCode;
  onAdd: (pouch: Pouch) => void;
}

export const PouchesSection: React.FC<PouchesSectionProps> = ({ pouches, loaded, currency, onAdd }) => {
  const [material, setMaterial] = useState('All');
  const materials = useMemo(() => ['All', ...Array.from(new Set(pouches.map((p) => p.material)))], [pouches]);
  const visible = pouches.filter((p) => material === 'All' || p.material === material);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#241A14]">Hand-Painted Pouches</h1>
        <p className="text-sm text-[#665141] mt-2 max-w-2xl">
          Fabric pouches hand-painted in the Mithila tradition by Lovely Jha. Each design is made in small numbers, so stock is limited.
        </p>
      </div>

      {materials.length > 2 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="pouch-material" className="text-[#7A6452] font-medium">Material</label>
          <select
            id="pouch-material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="bg-[#FAF5EA] border border-[#D5C3A5] rounded px-2 py-1.5"
          >
            {materials.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visible.map((pouch) => (
            <PouchCard key={pouch.id} pouch={pouch} currency={currency} onAdd={onAdd} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#665141]">
          {loaded ? 'No pouches are available right now. Please check back soon.' : 'Loading pouches…'}
        </div>
      )}
    </section>
  );
};
