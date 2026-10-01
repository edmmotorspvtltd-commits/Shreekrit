import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Award, ArrowRight, Sparkles, Feather } from 'lucide-react';
import { Artist } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Link } from './Link';
import { artistPath } from '../utils/routes';

interface ArtistsSectionProps {
  artists: Artist[];
  onOpenCommission: (artistName?: string) => void;
  // true when this section is the page's own top-level heading (the
  // standalone Master Artists view) rather than a teaser embedded within
  // the home page, which already has its own <h1> — keeps exactly one
  // <h1> per view instead of either zero or two.
  isPageHeading?: boolean;
}

export const ArtistsSection: React.FC<ArtistsSectionProps> = ({
  artists,
  onOpenCommission,
  isPageHeading = false
}) => {
  const { t } = useLanguage();
  const HeadingTag = isPageHeading ? 'h1' : 'h2';
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
            {t.artists.title}
          </HeadingTag>
          <p className="text-sm sm:text-base text-[#5C4A3C]">
            {t.artists.subtitle}
          </p>
        </div>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <p className="text-xs text-[#5C4A3C] line-clamp-3 leading-relaxed text-center">
                  "{artist.quote}"
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E8DEC8] flex items-center justify-between text-xs">
                <span className="text-[#877260] font-medium text-[12px]">
                  {artist.yearsOfExperience} {t.artists.yearsExp}
                </span>
                <span className="text-[#8C2711] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform py-3 -my-3 pl-1 -ml-1">
                  {t.artists.viewBodyOfWork} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
