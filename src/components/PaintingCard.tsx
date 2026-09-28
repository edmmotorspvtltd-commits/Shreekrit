import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, ShoppingBag, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { Painting, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';

interface PaintingCardProps {
  painting: Painting;
  currency: CurrencyCode;
  onSelect: (painting: Painting) => void;
  onQuickAdd: (painting: Painting) => void;
}

export const PaintingCard: React.FC<PaintingCardProps> = ({
  painting,
  currency,
  onSelect,
  onQuickAdd
}) => {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Subtle 3D tilt tracking cursor relative to card center
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Cap tilt angle at 5 degrees
    const rX = -(y / (rect.height / 2)) * 5;
    const rY = (x / (rect.width / 2)) * 5;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const displayTitle = (language === 'mai' || language === 'hi') && painting.maithiliTitle
    ? painting.maithiliTitle
    : painting.title;

  const secondaryTitle = (language === 'mai' || language === 'hi')
    ? painting.title
    : painting.maithiliTitle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col h-full bg-[#FAF5EA] rounded-md border border-[#E2D4BF] hover:border-[#8C2711]/50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out, box-shadow 0.3s'
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic 3D lighting sheen reflecting across Lokta parchment paper */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(circle at ${50 + rotateY * 6}% ${50 - rotateX * 6}%, rgba(255,255,255,0.24) 0%, transparent 65%)`
        }}
      />

      {/* Visual Canvas Framing */}
      <div 
        onClick={() => onSelect(painting)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE6D5] cursor-pointer"
      >
        <img
          src={painting.primaryImage}
          alt={painting.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Paper texture overlay on image to give authentic tactile feel */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-multiply"
          style={{
            backgroundImage: 'radial-gradient(#5A381E 0.75px, transparent 0.75px)',
            backgroundSize: '12px 12px'
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#241A14]/80 backdrop-blur-sm text-[#FAF5EA] text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded shadow-sm">
              {(t.styles as Record<string, string>)[painting.style] || painting.style}
            </span>
            {painting.isOriginal && (
              <span className="bg-[#8C2711]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> {t.detail.original}
              </span>
            )}
          </div>

          {!painting.isAvailable ? (
            <span className="bg-[#782414] text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded shadow">
              {t.gallery.soldOut}
            </span>
          ) : (
            <span className="bg-[#FAF5EA]/90 backdrop-blur-sm text-[#3E5C38] border border-[#3E5C38]/30 text-[10px] font-semibold px-2 py-0.5 rounded">
              ✓
            </span>
          )}
        </div>

        {/* Hover Quick Action Overlay */}
        <div className={`absolute inset-0 bg-[#241A14]/30 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center gap-3 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(painting);
            }}
            className="px-3.5 py-2 bg-[#FAF5EA] text-[#241A14] hover:bg-white rounded text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-transform transform hover:scale-105 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#8C2711]" />
            <span>{t.gallery.detailsBtn}</span>
          </button>
          {painting.isAvailable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(painting);
              }}
              className="px-3 py-2 bg-[#8C2711] text-white hover:bg-[#6B1C0A] rounded text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-transform transform hover:scale-105 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t.gallery.quickAddBtn}</span>
            </button>
          )}
        </div>

        {/* Completion Hours ribbon */}
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="text-[10px] text-[#FAF5EA] bg-[#241A14]/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {painting.completionHours} {t.gallery.hoursWorked}
          </span>
        </div>
      </div>

      {/* Card Body Information */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 
              onClick={() => onSelect(painting)}
              className="font-serif-display text-lg font-semibold text-[#241A14] group-hover:text-[#8C2711] transition-colors line-clamp-1 cursor-pointer"
            >
              {displayTitle}
            </h3>
          </div>

          <div className="text-xs text-[#7A6452] italic mb-2">
            {secondaryTitle}
          </div>

          <div className="flex items-center justify-between text-xs text-[#5C4A3C] pb-3 border-b border-[#E8DEC8]">
            <span className="font-medium hover:text-[#8C2711] transition-colors">
              {t.gallery.byArtist} {painting.artistName}
            </span>
            <span className="text-[#877260] font-mono text-[11px]">
              {painting.dimensions.inches}
            </span>
          </div>

          <div className="pt-2 text-xs text-[#6B5747] line-clamp-2 leading-relaxed">
            {painting.story}
          </div>
        </div>

        {/* Pricing & Footer Actions */}
        <div className="pt-4 mt-3 border-t border-[#E8DEC8] flex items-center justify-between">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-[#8A7665] font-medium">
              {t.gallery.sortPriceAsc.split(':')[0]}
            </span>
            <span className="font-serif-display text-xl font-bold text-[#241A14]">
              {formatPrice(painting.priceINR, currency)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onSelect(painting)}
              className="px-2.5 sm:px-3 py-1.5 rounded border border-[#8C2711]/40 text-[#8C2711] hover:bg-[#8C2711] hover:text-[#FAF5EA] text-xs font-medium transition-colors cursor-pointer"
            >
              {t.gallery.detailsBtn}
            </button>
            {painting.isAvailable ? (
              <button
                type="button"
                onClick={() => onQuickAdd(painting)}
                aria-label={`Add ${painting.title} to cart`}
                className="p-2 sm:p-1.5 rounded bg-[#8C2711] hover:bg-[#6E1C0A] text-white transition-colors cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px]"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[11px] text-[#8C2711] italic font-medium">
                {t.gallery.soldOut}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

