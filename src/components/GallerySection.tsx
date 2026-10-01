import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Filter, Sparkles, 
  RotateCcw, Check, ChevronDown 
} from 'lucide-react';
import { Painting, Artist, CurrencyCode, PaintingTheme, PaintingStyle } from '../types';
import { PaintingCard } from './PaintingCard';
import { useLanguage } from '../context/LanguageContext';

interface GallerySectionProps {
  paintings: Painting[];
  artists: Artist[];
  currency: CurrencyCode;
  onQuickAdd: (painting: Painting) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  paintings,
  artists,
  currency,
  onQuickAdd
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [selectedArtist, setSelectedArtist] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'hours'>('featured');

  const themes: (PaintingTheme | 'All')[] = [
    'All',
    'Tree of Life',
    'Krishna & Deities',
    'Nature & Wildlife',
    'Cosmos & Sun',
    'Wedding & Kohbar'
  ];

  const styles: (PaintingStyle | 'All')[] = [
    'All',
    'Kachni',
    'Bharni',
    'Godna',
    'Tantrik',
    'Kohbar'
  ];

  // Filtering Logic
  const filteredPaintings = useMemo(() => {
    return paintings
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q) || p.maithiliTitle.toLowerCase().includes(q);
          const matchesArtist = p.artistName.toLowerCase().includes(q);
          const matchesStory = p.story.toLowerCase().includes(q);
          const matchesMotifs = p.motifs.some(m => m.name.toLowerCase().includes(q));
          if (!matchesTitle && !matchesArtist && !matchesStory && !matchesMotifs) return false;
        }

        // Theme filter
        if (selectedTheme !== 'All' && p.theme !== selectedTheme) {
          return false;
        }

        // Style filter
        if (selectedStyle !== 'All' && p.style !== selectedStyle) {
          return false;
        }

        // Artist filter
        if (selectedArtist !== 'All' && p.artistId !== selectedArtist) {
          return false;
        }

        // Availability filter
        if (selectedAvailability === 'available' && !p.isAvailable) return false;
        if (selectedAvailability === 'sold' && p.isAvailable) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.priceINR - b.priceINR;
        if (sortBy === 'price-desc') return b.priceINR - a.priceINR;
        if (sortBy === 'hours') return b.completionHours - a.completionHours;
        // Default featured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [paintings, searchQuery, selectedTheme, selectedStyle, selectedArtist, selectedAvailability, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTheme('All');
    setSelectedStyle('All');
    setSelectedArtist('All');
    setSelectedAvailability('All');
    setSortBy('featured');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedTheme !== 'All' || 
    selectedStyle !== 'All' || 
    selectedArtist !== 'All' || 
    selectedAvailability !== 'All';

  return (
    <section id="gallery-section" className="py-12 sm:py-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-10">
      {/* Section Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAD8C0]/80 border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#C94A29]" />
          <span>{t.gallery.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif-display font-bold text-[#241A14]">
          {t.gallery.title}
        </h1>
        <p className="text-xs sm:text-base text-[#5C4A3C]">
          {t.gallery.subtitle}
        </p>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-[#FAF5EA] p-3.5 sm:p-5 rounded-lg border border-[#D5C3A5] shadow-xs space-y-3.5 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          
          {/* Search Input */}
          <div className="sm:col-span-2 md:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8C7665] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t.gallery.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-base text-[#241A14] placeholder-[#8C7665] focus:outline-[#8C2711]"
            />
          </div>

          {/* Sort selector */}
          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-base text-[#241A14] font-medium focus:outline-[#8C2711]"
            >
              <option value="featured">{t.gallery.sortFeatured}</option>
              <option value="price-asc">{t.gallery.sortPriceAsc}</option>
              <option value="price-desc">{t.gallery.sortPriceDesc}</option>
              <option value="hours">{t.gallery.sortHours}</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2.5 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-base text-[#241A14] font-medium focus:outline-[#8C2711]"
            >
              <option value="All">{t.gallery.filterAll}</option>
              <option value="available">{t.gallery.filterAvailable}</option>
              <option value="sold">{t.gallery.filterSold}</option>
            </select>
          </div>
        </div>

        {/* Theme Pills */}
        <div className="pt-1 flex items-center gap-2 overflow-x-auto pb-1.5 text-xs scrollbar-none">
          <span className="text-[#7A6452] font-semibold whitespace-nowrap mr-1">
            {t.gallery.themeLabel}
          </span>
          {themes.map((theme) => {
            const label = (t.themes as Record<string, string>)[theme] || theme;
            return (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                className={`min-h-[44px] inline-flex items-center px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium ${
                  selectedTheme === theme
                    ? 'bg-[#8C2711] text-white shadow-xs'
                    : 'bg-[#F2E5D3]/70 text-[#523F31] hover:bg-[#EAE0CD]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Bar: Style and Artist */}
        <div className="pt-2.5 border-t border-[#E8DEC8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[#7A6452] font-medium">{t.gallery.styleLabel}</span>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="px-2.5 py-1 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-base"
              >
                {styles.map(s => {
                  const styleLabel = (t.styles as Record<string, string>)[s] || s;
                  return <option key={s} value={s}>{styleLabel}</option>;
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#7A6452] font-medium">{t.gallery.artistLabel}</span>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="px-2.5 py-1 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-base max-w-[170px] truncate"
              >
                <option value="All">{t.gallery.allArtists}</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>
                    {language === 'mai' && a.maithiliName ? `${a.maithiliName} (${a.name})` : a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[#8C2711] hover:text-[#5C1A0B] text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> {t.gallery.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Painting Cards with 3D Tilt Hover */}
      {filteredPaintings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          <AnimatePresence>
            {filteredPaintings.map((painting) => (
              <PaintingCard
                key={painting.id}
                painting={painting}
                currency={currency}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="py-16 text-center bg-[#FAF5EA] rounded-lg border border-[#D5C3A5] p-8 space-y-3">
          <h4 className="font-serif-display text-xl font-bold text-[#241A14]">
            {t.gallery.noPaintingsFound}
          </h4>
          <p className="text-xs text-[#7A6452] max-w-sm mx-auto">
            {t.gallery.noPaintingsDesc}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#8C2711] text-white rounded text-xs font-medium cursor-pointer"
          >
            {t.gallery.resetBtn}
          </button>
        </div>
      )}
    </section>
  );
};

