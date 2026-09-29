import React from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Award, Calendar, Quote, Sparkles, ArrowRight } from 'lucide-react';
import { Artist, Painting, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { handleImageError } from '../utils/imageFallback';
import { useLanguage } from '../context/LanguageContext';

interface ArtistProfileModalProps {
  artist: Artist | null;
  paintings: Painting[];
  currency: CurrencyCode;
  onClose: () => void;
  onSelectPainting: (painting: Painting) => void;
  onOpenCommission: (artistName?: string) => void;
}

export const ArtistProfileModal: React.FC<ArtistProfileModalProps> = ({
  artist,
  paintings,
  currency,
  onClose,
  onSelectPainting,
  onOpenCommission
}) => {
  const { t, language } = useLanguage();
  if (!artist) return null;

  const artistWorks = paintings.filter(p => p.artistId === artist.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#1A120B]/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E0D0B8] bg-[#F4EADB] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#7A6452]">
            <span className="font-serif italic font-semibold text-[#8C2711]">Master Artist Archives</span>
            <span>•</span>
            <span>{artist.generation}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Artist Bio Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#8C2711] shadow-lg">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-serif-display font-bold text-[#241A14]">
                  {artist.name}
                </h3>
                <div className="text-sm font-serif italic text-[#8C2711]">
                  {artist.maithiliName}
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#7A6452] mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#8C2711]" />
                  <span>{artist.village}, {artist.district}, {artist.state}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-[#EAE0CD] text-[#241A14] font-medium">
                  Style: {artist.specialtyStyle}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#EAE0CD] text-[#241A14] font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#8C2711]" />
                  {artist.yearsOfExperience} {t.artists.yrsExperience}
                </span>
              </div>

              <p className="text-sm text-[#523F31] leading-relaxed">
                {artist.bio}
              </p>

              {/* Quote */}
              <div className="p-3.5 bg-[#F4EBDB] rounded border-l-4 border-[#8C2711] italic text-xs text-[#4A3222] flex gap-2">
                <Quote className="w-4 h-4 text-[#8C2711] flex-shrink-0" />
                <span>"{artist.quote}"</span>
              </div>

              {/* Accolades & Awards */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#735D4B] block">
                  Honors & National Recognition:
                </span>
                <div className="flex flex-wrap gap-2">
                  {artist.awards.map((award, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-[#3E5C38] bg-[#E8F0E5] px-2.5 py-1 rounded border border-[#C6DCBF]">
                      <Award className="w-3 h-3 text-[#426B43]" />
                      {award}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenCommission(artist.name)}
                  className="px-4 py-2 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.artists.commissionBtn} ({artist.name.split(' ')[0]})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Artist's Body of Work */}
          <div className="pt-6 border-t border-[#E0D0B8] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif-display text-xl font-bold text-[#241A14]">
                  Portfolio of Original Canvases
                </h4>
                <p className="text-xs text-[#7A6452]">
                  {artistWorks.length} documented masterworks in the archive
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {artistWorks.map((painting) => (
                <div
                  key={painting.id}
                  onClick={() => onSelectPainting(painting)}
                  className="bg-[#FAF5EA] rounded border border-[#DFCDB3] hover:border-[#8C2711] overflow-hidden p-3 transition-all cursor-pointer group space-y-2 shadow-xs"
                >
                  <div className="aspect-[4/3] rounded overflow-hidden bg-[#E2D4BF]">
                    <img
                      src={painting.primaryImage}
                      alt={painting.title}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-serif font-bold text-sm text-[#241A14] group-hover:text-[#8C2711] line-clamp-1">
                        {(language === 'mai' || language === 'hi') && painting.maithiliTitle ? painting.maithiliTitle : painting.title}
                      </h5>
                      <span className="text-[10px] text-[#7A6452] block">{painting.dimensions.inches}</span>
                    </div>
                    <span className="font-serif-display font-bold text-xs text-[#241A14]">
                      {formatPrice(painting.priceINR, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
