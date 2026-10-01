import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, ShieldCheck, Sun, Users, Award, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Link } from './Link';

interface HeritageAboutSectionProps {
  onOpenCommission: () => void;
  // See ArtistsSection's isPageHeading — same reasoning, this component
  // is reused both as a home-page teaser and as the standalone Heritage
  // Lore / Artisan Journey page content.
  isPageHeading?: boolean;
}

export const HeritageAboutSection: React.FC<HeritageAboutSectionProps> = ({
  onOpenCommission,
  isPageHeading = false
}) => {
  const { t, language } = useLanguage();
  const HeadingTag = isPageHeading ? 'h1' : 'h2';

  const stylesInfo = [
    {
      title: language === 'mai' || language === 'hi' ? 'कचनी (रेखांकन)' : 'Kachni (Line Work)',
      meaning: language === 'mai' 
        ? 'बांस के तीली सँ खींचल महीन समानांतर रेखांकन, जे मात्र करिया आ सिंदूरी रंग सँ बनाओल जाइत अछि।'
        : language === 'hi'
        ? 'बांस की तीली से खींचा गया महीन समानांतर रेखांकन, जो शुद्ध काले और सिंदूरी रंगों से तैयार होता है।'
        : 'Micro-fine hatching drawn with bamboo styluses, historically cultivated by Kayastha women. Pure black and vermillion lines without color fill.',
      color: '#8C2711'
    },
    {
      title: language === 'mai' || language === 'hi' ? 'भरनी (रंग भराव)' : 'Bharni (Color Fill)',
      meaning: language === 'mai'
        ? 'प्राकृतिक वनस्पति आ खनिज रंगक गहीर भराव, जेना हरदी, नील, आ मंजिष्ठा।'
        : language === 'hi'
        ? 'प्राकृतिक वनस्पति और खनिज रंगों का गहरा भराव, जैसे हल्दी, नील और मजीठ।'
        : 'Vibrant, jewel-toned mineral dye washes. Every section is filled with sacred pigments like turmeric, indigo, and madder root.',
      color: '#C94A29'
    },
    {
      title: language === 'mai' || language === 'hi' ? 'गोदना (टैटू रूपांकन)' : 'Godna (Tattoo Motifs)',
      meaning: language === 'mai'
        ? 'पारम्परिक दैहिक सुरक्षा टैटू सँ विकसित संकेन्द्रीय ज्यामितीय आ वन्यजीव आकृति।'
        : language === 'hi'
        ? 'पारंपरिक सुरक्षात्मक टैटू से विकसित ज्यामितीय और वन्यजीव आकृतियां।'
        : 'Concentric geometric and wildlife patterns derived from protective body tattoos, championed by Dalit and Paswan village communities.',
      color: '#241A14'
    },
    {
      title: language === 'mai' || language === 'hi' ? 'तांत्रिक (ब्रह्मांडीय यंत्र)' : 'Tantrik (Cosmic Yantras)',
      meaning: language === 'mai'
        ? 'सूर्य, चन्द्रमा, आ महाविद्या सभक पवित्र ज्यामिति, जे ब्रह्मांडीय ऊर्जाक ध्यान करैत अछि।'
        : language === 'hi'
        ? 'सूर्य, चंद्रमा और महाविद्याओं की पवित्र ज्यामिति, जो ब्रह्मांडीय ऊर्जा का ध्यान कराती है।'
        : 'Sacred geometry of the sun, moon, and Mahavidyas, meditating upon cosmic cycles and the Kamla river sacred waters.',
      color: '#E5A93C'
    },
    {
      title: language === 'mai' || language === 'hi' ? 'कोहबर (विवाह कक्ष)' : 'Kohbar (Nuptial Chamber)',
      meaning: language === 'mai'
        ? 'विवाहक पवित्र कोहबर घरक मांगलिक चित्र, जाहि में बांस, कमल, आ माछक युगल रहैत अछि।'
        : language === 'hi'
        ? 'विवाह के पवित्र कोहबर घर के मांगलिक चित्र, जिसमें बांस, सात कमल और मछलियों का जोड़ा होता है।'
        : 'Auspicious wedding chamber blessing murals featuring the central bamboo grove (bans), seven lotuses, and pairs of fish.',
      color: '#2A4B7C'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF5EA] border-t border-[#DFCDB5]">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Heritage Story Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAD8C0] border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-[#C94A29]" />
              <span>{t.heritage.badge}</span>
            </div>

            <HeadingTag className="text-3xl sm:text-4xl font-serif-display font-bold text-[#241A14] leading-tight">
              {t.heritage.title}
            </HeadingTag>

            <p className="text-sm sm:text-base text-[#5C4A3C] leading-relaxed">
              {t.heritage.p1}
            </p>

            <p className="text-xs sm:text-sm text-[#5C4A3C] leading-relaxed">
              {t.heritage.p2}
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Link
                to="/gallery"
                className="px-5 py-2.5 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                {t.heritage.exploreBtn}
              </Link>
              <button
                onClick={onOpenCommission}
                className="px-5 py-2.5 border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-white rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer"
              >
                {t.heritage.commissionBtn}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="p-4 bg-[#F2E5D3] rounded-lg border border-[#D5C3A5] shadow-xl mithila-double-border">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80"
                alt="Traditional Mithila Art detail"
                referrerPolicy="no-referrer"
                className="rounded w-full object-cover shadow-inner"
              />
              <div className="p-3 bg-[#FAF5EA] rounded mt-3 text-xs text-[#6B5747] flex items-center justify-between">
                <span className="font-serif italic text-[#8C2711]">
                  {language === 'mai' ? 'दुहरी मांगलिक रेखांकन दैवीय ऊर्जा के कैनवास भीतर सुरक्षित राखैत अछि।' : language === 'hi' ? 'दोहरी पवित्र रेखांकन दैवीय ऊर्जा को कैनवास के भीतर सुरक्षित रखती है।' : 'Sacred double-line boundaries seal divine energy within the canvas.'}
                </span>
                <span className="font-mono text-[12px]">Lokta Parchment</span>
              </div>
            </div>
          </div>
        </div>

        {/* The 5 Canonical Mithila Styles */}
        <div className="space-y-6 pt-6 border-t border-[#DFCDB5]">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#241A14]">
              {t.heritage.stylesTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#665141]">
              {t.heritage.stylesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stylesInfo.map((style, idx) => (
              <div
                key={idx}
                className="bg-[#FAF5EA] p-4 rounded-md border border-[#DFCDB3] hover:border-[#8C2711] transition-all space-y-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: style.color }}
                  />
                  <h4 className="font-serif-display font-bold text-sm text-[#241A14]">
                    {style.title}
                  </h4>
                </div>
                <p className="text-[12px] text-[#695444] leading-relaxed">
                  {style.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Ethical Direct Impact Commitment */}
        <div className="bg-[#F4EADB] p-8 rounded-lg border border-[#DFCDB3] shadow-md space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C2711] uppercase tracking-wider">
              <Heart className="w-4 h-4 text-[#C94A29]" />
              <span>{t.heritage.manifestoBadge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#241A14]">
              {t.heritage.manifestoTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4535] leading-relaxed">
              {t.heritage.manifestoDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#DFCDB3]">
            <div className="space-y-1">
              <span className="font-serif-display text-3xl font-bold text-[#8C2711]">{t.heritage.stat1Num}</span>
              <h5 className="font-semibold text-xs text-[#241A14]">{t.heritage.stat1Label}</h5>
              <p className="text-[12px] text-[#695444]">
                {t.heritage.stat1Desc}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-serif-display text-3xl font-bold text-[#8C2711]">{t.heritage.stat2Num}</span>
              <h5 className="font-semibold text-xs text-[#241A14]">{t.heritage.stat2Label}</h5>
              <p className="text-[12px] text-[#695444]">
                {t.heritage.stat2Desc}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-serif-display text-3xl font-bold text-[#8C2711]">{t.heritage.stat3Num}</span>
              <h5 className="font-semibold text-xs text-[#241A14]">{t.heritage.stat3Label}</h5>
              <p className="text-[12px] text-[#695444]">
                {t.heritage.stat3Desc}
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
