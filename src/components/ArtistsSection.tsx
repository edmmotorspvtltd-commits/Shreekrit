import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Award, ArrowRight, Sparkles, Feather } from 'lucide-react';
import { Artist, Painting, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import { handleImageError } from '../utils/imageFallback';
import { useLanguage } from '../context/LanguageContext';
import { Link } from './Link';
import { artistPath, paintingPath } from '../utils/routes';

interface ArtistsSectionProps {
  artists: Artist[];
  paintings: Painting[];
  currency: CurrencyCode;
  onOpenCommission: (artistName?: string) => void;
  // true when this section is the page's own top-level heading (the
  // standalone Master Artists view) rather than a teaser embedded within
  // the home page, which already has its own <h1> — keeps exactly one
  // <h1> per view instead of either zero or two.
  isPageHeading?: boolean;
}

export const ArtistsSection: React.FC<ArtistsSectionProps> = ({
  artists,
  paintings,
  currency,
  onOpenCommission,
  isPageHeading = false
}) => {
  const { t } = useLanguage();
  const HeadingTag = isPageHeading ? 'h1' : 'h2';
  // With a single artist the card grid would sit alone in a wide empty row,
  // so show that artist as a full-width featured profile instead.
  const featured = artists.length === 1 ? artists[0] : null;
  const featuredWorks = featured ? paintings.filter((p) => p.artistId === featured.id).slice(0, 3) : [];
  return (
    <section id="artists-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5EDE0] border-t border-[#DFCDB5]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DAC5] border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
            <Feather className="w-3.5 h-3.5 text-[#C94A29]" />
            <span>{t.artists.badge}</span>
          </div>
          <HeadingTag className="text-3xl sm:text-4xl font-serif-display font-bold text-[#241A14]">
            {featured ? t.artists.meetTheArtist : t.artists.title}
          </HeadingTag>
          <p className="text-sm sm:text-base text-[#5C4A3C]">
            {featured ? t.artists.meetTheArtistSubtitle : t.artists.subtitle}
          </p>
        </div>

        {featured && (
          <div className="space-y-10">
            <div className="grid md:grid-cols-5 gap-8 md:gap-12 items-center bg-[#FAF5EA] rounded-lg border border-[#DFCDB3] shadow-xs p-6 sm:p-10">
              <div className="md:col-span-2 flex justify-center">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-[#D5C3A5] shadow-lg">
                  <img
                    src={featured.avatar}
                    alt={featured.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-3 space-y-4 text-center md:text-left">
                <div className="space-y-1">
                  <h3 className="font-serif-display font-bold text-3xl sm:text-4xl text-[#241A14]">{featured.name}</h3>
                  <div className="font-serif italic text-[#8C2711]">{featured.maithiliName}</div>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs">
                  <span className="flex items-center gap-1 text-[#7A6452]">
                    <MapPin className="w-3.5 h-3.5 text-[#8C2711]" />
                    {featured.village}, {featured.district}, Bihar
                  </span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAE0CD] text-[12px] uppercase font-semibold text-[#523F31]">
                    {featured.specialtyStyle} {t.artists.styleSpecialist}
                  </span>
                  {featured.yearsOfExperience > 0 && (
                    <span className="text-[#877260] font-medium">{featured.yearsOfExperience} {t.artists.yearsExp}</span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-[#523F31] leading-relaxed">{featured.bio}</p>
                {featured.quote && (
                  <p className="italic text-sm text-[#4A3222] border-l-4 border-[#8C2711] pl-3">"{featured.quote}"</p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <Link
                    to={artistPath(featured)}
                    className="px-5 py-2.5 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {t.artists.viewBodyOfWork} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onOpenCommission(featured.name)}
                    className="px-5 py-2.5 border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.artists.requestCommission} {featured.name.split(' ')[0]}
                  </button>
                </div>
              </div>
            </div>

            {featuredWorks.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-serif-display font-bold text-xl text-[#241A14] text-center md:text-left">
                  {t.artists.selectedWorks}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featuredWorks.map((painting) => (
                    <Link
                      key={painting.id}
                      to={paintingPath(painting)}
                      className="group block bg-[#FAF5EA] rounded-lg border border-[#DFCDB3] hover:border-[#8C2711] overflow-hidden shadow-xs hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[4/3] bg-[#E2D4BF] overflow-hidden">
                        <img
                          src={painting.primaryImage}
                          alt={painting.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="font-serif-display font-bold text-[#241A14] group-hover:text-[#8C2711] transition-colors">{painting.title}</div>
                          <div className="text-[12px] text-[#7A6452]">{painting.dimensions.inches}</div>
                        </div>
                        <span className="font-serif-display font-bold text-sm text-[#241A14] whitespace-nowrap">
                          {formatPrice(painting.priceINR, currency)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Artist Grid (two or more artists) */}
        {!featured && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              to={artistPath(artist)}
              className="group bg-[#FAF5EA] rounded-lg border border-[#DFCDB3] hover:border-[#8C2711] p-5 shadow-xs transition-all hover:shadow-lg cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-full overflow-hidden border-2 border-[#D5C3A5] group-hover:border-[#8C2711] transition-colors max-w-[160px] mx-auto">
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="text-center space-y-1">
                  <h3 className="font-serif-display font-bold text-lg text-[#241A14] group-hover:text-[#8C2711] transition-colors">
                    {artist.name}
                  </h3>
                  <div className="text-xs font-serif italic text-[#8C2711]">
                    {artist.maithiliName}
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[12px] text-[#7A6452]">
                    <MapPin className="w-3 h-3 text-[#8C2711]" />
                    <span>{artist.village}, {artist.district}</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#EAE0CD] text-[12px] uppercase font-semibold text-[#523F31]">
                    {artist.specialtyStyle} {t.artists.styleSpecialist}
                  </span>
                </div>

                {artist.quote && (
                  <p className="text-xs text-[#5C4A3C] line-clamp-3 leading-relaxed text-center">
                    "{artist.quote}"
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#E8DEC8] flex items-center justify-between text-xs">
                <span className="text-[#877260] font-medium text-[12px]">
                  {artist.yearsOfExperience > 0 ? `${artist.yearsOfExperience} ${t.artists.yearsExp}` : ''}
                </span>
                <span className="text-[#8C2711] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform py-3 -my-3 pl-1 -ml-1">
                  {t.artists.viewBodyOfWork} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>}
      </div>
    </section>
  );
};
