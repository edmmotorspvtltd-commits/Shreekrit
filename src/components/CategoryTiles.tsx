import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from './Link';
import { useLanguage } from '../context/LanguageContext';
import { shopPath } from '../utils/routes';

interface CategoryTilesProps {
  // The pouches tile only shows when sellable pouches exist; paintings then
  // takes the full width.
  showPouches: boolean;
}

interface TileProps {
  to: string;
  image: string;
  alt: string;
  title: string;
  description: string;
}

const Tile: React.FC<TileProps> = ({ to, image, alt, title, description }) => (
  <Link
    to={to}
    className="group relative block overflow-hidden rounded-2xl border border-[#E2D4BF] bg-[#241A14] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8C2711]"
  >
    <div className="aspect-[4/3] sm:aspect-[16/10]">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        draggable={false}
        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[#241A14]/85 via-[#241A14]/20 to-transparent" aria-hidden="true" />
    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-[#FAF5EA]">
      <h2 className="font-serif-display text-2xl sm:text-3xl font-bold">{title}</h2>
      <p className="mt-1 flex items-center justify-between gap-3 text-sm sm:text-base text-[#F0E4D2]">
        <span>{description}</span>
        <ArrowRight className="h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </p>
    </div>
  </Link>
);

export const CategoryTiles: React.FC<CategoryTilesProps> = ({ showPouches }) => {
  const { t } = useLanguage();
  const tiles = t.home.tiles;

  return (
    <section aria-label={t.nav.shop} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${showPouches ? 'md:grid-cols-2' : ''}`}>
        <Tile
          to={shopPath('paintings')}
          image="/paintings/lakshmi-on-lotus.jpg"
          alt={tiles.paintingsAlt}
          title={tiles.paintingsTitle}
          description={tiles.paintingsDesc}
        />
        {showPouches && (
          <Tile
            to={shopPath('pouches')}
            image="/pouches/pouch-1-1.jpeg"
            alt={tiles.pouchesAlt}
            title={tiles.pouchesTitle}
            description={tiles.pouchesDesc}
          />
        )}
      </div>
    </section>
  );
};
