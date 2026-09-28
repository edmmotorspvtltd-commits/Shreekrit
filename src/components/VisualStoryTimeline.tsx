import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Sparkles, Feather, Home, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StoryChapter {
  id: string;
  step: string;
  title: string;
  location: string;
  description: string;
  image: string;
  caption: string;
  motifs: string[];
}

export const VisualStoryTimeline: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);

  const CHAPTERS: StoryChapter[] = [
    {
      id: 'village',
      step: '01',
      title: t.storyTimeline.stage1,
      location: language === 'mai' ? 'मधुबनी जिला, उत्तर बिहार' : language === 'hi' ? 'मधुबनी जिला, उत्तर बिहार' : 'Madhubani District, North Bihar',
      description: language === 'mai' 
        ? 'कमला नदीक काछ में बसल शांत गाम सब में, कला कोनो किताबी व्यवसाय नहि अछि—ई जन्म, विवाह आ पाबनि-तिहार सँ जुड़ल अछि। तीन हजार वर्ष सँ, मैथिल नारी अपन आँगनक माटिक भीत पर मांगलिक चिन्ह बनाबि परिवारक कल्यान करैत आबि रहल छथि।'
        : language === 'hi'
        ? 'कमला नदी के किनारे बसे शांत गांवों में, कला कोई अलग अकादमिक पेशा नहीं है—यह जन्म, विवाह और मौसमी फसलों से जुड़ी है। तीन हजार वर्षों से, मैथिल महिलाएं अपने आंगनों की मिट्टी की दीवारों पर मांगलिक प्रतीकों से अपने परिवारों को आशीर्वाद देती आई हैं।'
        : 'In the tranquil villages flanking the Kamla river, art is not an isolated academic profession—it is woven into birth, marriage, and seasonal harvests. For three thousand years, Maithil women adorned the adobe mud walls of their courtyards with auspicious symbols to bless their families.',
      image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
      caption: language === 'mai' ? 'मधुबनीक पारम्परिक ग्रामीण आँगन' : language === 'hi' ? 'मधुबनी का पारंपरिक ग्रामीण आंगन' : 'Traditional rural courtyard in Madhubani where village painters gather at dawn.',
      motifs: language === 'mai' || language === 'hi' ? ['कमला नदी', 'माटिक भीत', 'पवित्र तुलसी चौड़ा'] : ['Kamla River Waters', 'Earthen Mud Walls', 'Sacred Tulsi Shrine']
    },
    {
      id: 'artisan',
      step: '02',
      title: t.storyTimeline.stage2,
      location: language === 'mai' ? 'कलाकार के ओसारा' : language === 'hi' ? 'कलाकार का बरामदा' : 'The Artist\'s Veranda',
      description: language === 'mai'
        ? 'एतय कोनो कृत्रिम रासायनिक रंग नहि अछि। कलाकार हरदी सँ पीयर रंग, दियाक काजर सँ गहीर करिया रंग, आ अपराजिता फूल ओ नील सँ नील रंग बनबैत छथि। बांस के तीली पर रुई लपेटि श्रद्धा पूर्वक रेखा खींचल जाइत अछि।'
        : language === 'hi'
        ? 'यहां कोई रासायनिक रंग नहीं हैं। कलाकार हल्दी से पीला, दीये के काजल से गहरा काला और अपराजिता की पंखुड़ियों से नीला रंग तैयार करते हैं। नुकीली बांस की तीली पर कच्ची रुई लपेटकर साधना पूर्वक रेखाएं खींची जाती हैं।'
        : 'No commercial synthetic tubes exist here. The artist harvests turmeric roots for warm ochres, collects lamp soot (kajal) from clay mustard oil burners for midnight black, and steeps aparajita petals and indigo leaves. Using sharpened bamboo styluses wrapped in raw cotton lint, lines are drawn with measured devotion.',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      caption: language === 'mai' ? 'प्राकृतिक रंग आ बांस के तीली सँ महीन रेखांकन' : language === 'hi' ? 'प्राकृतिक रंग निर्माण और बांस की कलम से महीन काम' : 'Natural pigment preparation and fine bamboo nib stylus line work.',
      motifs: language === 'mai' || language === 'hi' ? ['दीपक कज्जल', 'जंगली हरदी', 'बांस के तीली'] : ['Lamp Soot Kajal', 'Wild Haldi Ochre', 'Raw Bamboo Nib (Tili)']
    },
    {
      id: 'painting',
      step: '03',
      title: t.storyTimeline.stage3,
      location: language === 'mai' ? 'हस्तनिर्मित लोकता / मधुबनी पत्र' : language === 'hi' ? 'हस्तनिर्मित लोकता कागज़' : 'Handmade Lokta Fibers',
      description: language === 'mai'
        ? '१२० सँ २४० घंटा के धैर्यक साधना सँ चित्र जीवंत भऽ उठैत अछि। मिथिला परम्परा में खाली स्थान अशुभ मानल जाइत अछि। प्रत्येक इंच कचनी (समानांतर रेखांकन) वा भरनी (गहीर रंग) सँ सजल होइत अछि, जे दुहरी मांगलिक सीमारेखा में सुरक्षित रहैत अछि।'
        : language === 'hi'
        ? '120 से 240 घंटों की अनवरत साधना से कैनवास जीवंत होता है। मिथिला परंपरा में खाली जगह को अशुभ माना जाता है। हर मिलीमीटर कचनी (समानांतर महीन रेखांकन) या भरनी से भरा होता है, जो दोहरी पवित्र सीमाओं में बंधा होता है।'
        : 'Over 120 to 240 patient hours, the canvas comes alive. In orthodox Mithila doctrine, empty space is considered inauspicious (horror vacui). Every millimeter is graced with kachni (parallel geometric hatching) or bharni (saturated natural color wash), protected within twin sacred borders.',
      image: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80',
      caption: language === 'mai' ? 'हस्तनिर्मित कागद पर जटिल पूर्ण मूल कलाकृति' : language === 'hi' ? 'हस्तनिर्मित कागज पर बारीक सम्पूर्ण कलाकृति' : 'Intricate completed original on unbleached fibrous handmade Lokta paper.',
      motifs: language === 'mai' || language === 'hi' ? ['मयूर युगल', 'भास्कर सूर्य', 'सृष्टिक कमल'] : ['Twin Peacocks (Mayura)', 'Cosmic Sun (Surya)', 'Lotus of Creation']
    },
    {
      id: 'collector',
      step: '04',
      title: t.storyTimeline.stage4,
      location: 'Tokyo • London • New York • Zurich • New Delhi',
      description: language === 'mai'
        ? 'शीशम काठक फ्रेम आ यूवी-संरक्षित एक्रिलिक में मढ़ल ई कलाकृति, विश्वक आधुनिक भवन सब में हजारों वर्ष पुरान मिथिलाक पवित्र ऊर्जा आ सौन्दर्य प्रसारित करैत अछि।'
        : language === 'hi'
        ? 'शीशम की लकड़ी के फ्रेम और यूवी संरक्षित ग्लास में मढ़ी यह कलाकृति, दुनिया भर के आधुनिक घरों में सदियों पुरानी भारतीय लोक कला की जीवंत ऊर्जा लाती है।'
        : 'Framed in sustainably harvested seasoned Sheesham teak and museum-grade UV acrylic, the artwork brings grounding organic resonance, tactile paper grain, and millennia of sacred Indian heritage into contemporary architectural interiors worldwide.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      caption: language === 'mai' ? 'शीशम फ्रेम में आधुनिक गैलरी में सुसज्जित' : language === 'hi' ? 'शीशम फ्रेम में आधुनिक आर्ट गैलरी में सुसज्जित' : 'Mithila original framed in warm Sheesham wood within a modern living gallery.',
      motifs: language === 'mai' || language === 'hi' ? ['संग्रहालय ग्लास', 'सीधा प्रमाण-पत्र', 'धरोहर विरासत'] : ['Museum Archival Glass', 'Fair-Trade Direct Provenance', 'Heirloom Legacy']
    }
  ];

  const currentChapter = CHAPTERS[activeIdx];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % CHAPTERS.length);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + CHAPTERS.length) % CHAPTERS.length);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5EDE0] border-y border-[#DFCDB5] relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DAC5] border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
            <Feather className="w-3.5 h-3.5 text-[#C94A29]" />
            <span>{t.storyTimeline.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-[#241A14]">
            {t.storyTimeline.title}
          </h2>
          <p className="text-sm sm:text-base text-[#5C4A3C]">
            {t.storyTimeline.subtitle}
          </p>
        </div>

        {/* Story Navigator Stepper Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-[#D8C6AE] pb-4">
          {CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setActiveIdx(idx)}
              className={`p-3 rounded-md text-left transition-all cursor-pointer border ${
                activeIdx === idx
                  ? 'bg-[#FAF5EA] border-[#8C2711] shadow-md ring-1 ring-[#8C2711]'
                  : 'bg-[#F2E5D3]/60 border-transparent hover:border-[#D5C2A7]'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8C2711] font-semibold">
                <span>Chapter {ch.step}</span>
                {activeIdx === idx && <Sparkles className="w-3 h-3 text-[#C94A29]" />}
              </div>
              <div className="font-serif text-sm font-bold text-[#241A14] mt-0.5 truncate">
                {ch.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Chapter Stage Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF5EA] p-6 sm:p-8 rounded-lg border border-[#D5C3A5] shadow-lg">
          {/* Chapter Image with Caption */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-[#E2D4BF] shadow border border-[#CDBBA0]">
              <img
                src={currentChapter.image}
                alt={currentChapter.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 inset-x-4 text-white text-xs flex items-center justify-between">
                <span className="font-medium drop-shadow">{currentChapter.caption}</span>
                <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono">
                  Stage {currentChapter.step}
                </span>
              </div>
            </div>
          </div>

          {/* Chapter Details & Lore */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-xs font-mono font-bold text-[#8C2711] tracking-widest uppercase">
                Stage {currentChapter.step}
              </span>
              <h3 className="text-2xl font-serif-display font-bold text-[#241A14] mt-1 leading-snug">
                {currentChapter.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-[#7A6452] mt-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#8C2711]" />
                <span>{currentChapter.location}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#523F31] leading-relaxed">
              {currentChapter.description}
            </p>

            <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#735D4B] block">
                {language === 'mai' ? 'पारम्परिक तत्व आ सामग्री:' : language === 'hi' ? 'पारंपरिक तत्व एवं सामग्री:' : 'Traditional Elements & Materials:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {currentChapter.motifs.map((motif, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-[#F3E8D7] text-[#3D2C20] text-xs border border-[#DFCDB3] font-medium"
                  >
                    • {motif}
                  </span>
                ))}
              </div>
            </div>

            {/* Stepper controls */}
            <div className="pt-4 flex items-center justify-between border-t border-[#E8DEC8]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-full border border-[#D5C3A5] hover:bg-[#F3EADA] text-[#241A14] cursor-pointer transition-colors"
                  aria-label="Previous chapter"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-full border border-[#D5C3A5] hover:bg-[#F3EADA] text-[#241A14] cursor-pointer transition-colors"
                  aria-label="Next chapter"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-[#735D4B] font-mono">
                {activeIdx + 1} of {CHAPTERS.length}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
