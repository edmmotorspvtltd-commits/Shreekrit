import React, { useRef } from 'react';
import { Artist, CurrencyCode, Painting, Pouch } from '../types';
import { ShopCategory, shopPath } from '../utils/routes';
import { navigate } from '../utils/router';
import { useLanguage } from '../context/LanguageContext';
import { GallerySection } from './GallerySection';
import { PouchesSection } from './PouchesSection';

interface ShopPageProps {
  category: ShopCategory;
  // False when there are no sellable pouches: the switch is hidden and only
  // paintings are shown.
  showPouches: boolean;
  paintings: Painting[];
  artists: Artist[];
  pouches: Pouch[];
  pouchesLoaded: boolean;
  currency: CurrencyCode;
  onQuickAdd: React.ComponentProps<typeof GallerySection>['onQuickAdd'];
  onAddPouch: (pouch: Pouch) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  category, showPouches, paintings, artists, pouches, pouchesLoaded, currency, onQuickAdd, onAddPouch
}) => {
  const { t } = useLanguage();
  const tabRefs = useRef<Record<ShopCategory, HTMLButtonElement | null>>({ paintings: null, pouches: null });

  const tabs: { id: ShopCategory; label: string }[] = [
    { id: 'paintings', label: t.shop.paintingsTab },
    { id: 'pouches', label: t.shop.pouchesTab }
  ];

  const select = (id: ShopCategory) => {
    if (id !== category) navigate(shopPath(id));
  };

  // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.id === category);
    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    select(tabs[next].id);
    tabRefs.current[tabs[next].id]?.focus();
  };

  return (
    <>
      {showPouches && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div
            role="tablist"
            aria-label={t.nav.shop}
            onKeyDown={onKeyDown}
            className="inline-flex rounded-full border border-[#D5C3A5] bg-[#FAF5EA] p-1"
          >
            {tabs.map((tab) => {
              const active = tab.id === category;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  role="tab"
                  id={`shop-tab-${tab.id}`}
                  aria-selected={active}
                  aria-controls="shop-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(tab.id)}
                  className={`px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8C2711] ${
                    active ? 'bg-[#8C2711] text-[#FAF5EA]' : 'text-[#4A3525] hover:bg-[#F0E4D2]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div id="shop-panel" role={showPouches ? 'tabpanel' : undefined} aria-labelledby={showPouches ? `shop-tab-${category}` : undefined}>
        {category === 'pouches' ? (
          <PouchesSection pouches={pouches} loaded={pouchesLoaded} currency={currency} onAdd={onAddPouch} />
        ) : (
          <GallerySection paintings={paintings} artists={artists} currency={currency} onQuickAdd={onQuickAdd} />
        )}
      </div>
    </>
  );
};
