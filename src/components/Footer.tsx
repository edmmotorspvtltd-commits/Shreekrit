import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Heart, Send, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenCommission: () => void;
  onOpenArtistApplication: () => void;
  onOpenTrackOrder: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCommission, onOpenArtistApplication, onOpenTrackOrder }) => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="bg-[#241A14] text-[#FAF5EA] border-t-4 border-[#8C2711] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Top Newsletter & Cultural Invitation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-[#47362B]">
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#FAF5EA] p-1.5">
                <img
                  src="/shreekrit-emblem.png"
                  alt="Shreekrit Logo"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
              <span className="font-serif-display text-2xl font-bold tracking-tight">
                Shreekrit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#C9B6A6] leading-relaxed max-w-md">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-4 text-xs text-[#E5A93C]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {t.footer.certifiedOriginals}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-[#C94A29]" /> {t.footer.directArtisans}
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <h4 className="font-serif-display text-lg font-bold text-[#FAF5EA]">
              {t.footer.gazetteTitle}
            </h4>
            <p className="text-xs text-[#B5A191]">
              {t.footer.gazetteDesc}
            </p>
            {!subscribed ? (
              <form onSubmit={handleNewsletter} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder={t.footer.subscribePlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3.5 py-2 rounded bg-[#33251D] border border-[#543F33] text-base text-white placeholder-[#8A7669] flex-grow focus:outline-[#C94A29]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8C2711] hover:bg-[#A83218] text-white text-xs font-semibold rounded cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.footer.subscribeBtn}</span>
                </button>
              </form>
            ) : (
              <div className="text-xs text-[#7FB078] flex items-center gap-1 py-2">
                <Check className="w-4 h-4" /> {t.footer.subscribedMsg}
              </div>
            )}
          </div>
        </div>

        {/* Links Navigation Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs text-[#C9B6A6]">
          <div className="space-y-3">
            <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.theCollection}
            </h5>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'कल्पवृक्ष (जीवनक वृक्ष)' : 'Kalpavriksha (Tree of Life)'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'सूर्य ओ चन्द्र मण्डल' : 'Surya & Chandra Mandalas'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'राधा कृष्ण रासलीला' : 'Radha Krishna Rasleela'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'कोहबर भित्तिचित्र' : 'Ceremonial Kohbar Murals'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'मत्स्य आ जल लोककथा' : 'Matsya & Aquatic Folklore'}</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.canonicalStyles}
            </h5>
            <ul className="space-y-2">
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'कचनी (महीन रेखांकन)' : 'Kachni (Line Hatching)'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'भरनी (प्राकृतिक रंग)' : 'Bharni (Jeweled Washes)'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'गोदना (टैटू ज्यामिति)' : 'Godna (Tattoo Geometry)'}</button></li>
              <li><button onClick={() => onNavigate('gallery')} className="hover:text-white cursor-pointer">{language === 'mai' || language === 'hi' ? 'तांत्रिक यंत्र' : 'Tantrik Yantras'}</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.patronageCustom}
            </h5>
            <ul className="space-y-2">
              <li><button onClick={onOpenCommission} className="hover:text-white cursor-pointer text-[#E5A93C] font-medium">{t.nav.commission}</button></li>
              <li><button onClick={() => onNavigate('story')} className="hover:text-white cursor-pointer">{t.nav.story}</button></li>
              <li><button onClick={() => onNavigate('heritage')} className="hover:text-white cursor-pointer">{t.nav.heritage}</button></li>
              <li><button onClick={() => onNavigate('artists')} className="hover:text-white cursor-pointer">{t.nav.artists}</button></li>
              <li><button onClick={onOpenArtistApplication} className="hover:text-white cursor-pointer text-[#E5A93C] font-medium">{t.nav.forArtisans}</button></li>
              <li><button onClick={onOpenTrackOrder} className="hover:text-white cursor-pointer">Track Your Order</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
              {t.footer.artisanGuild}
            </h5>
            <p className="text-[11px] leading-relaxed text-[#9E8A7A]">
              Mithila Folk Art Guild<br />
              Jitwarpur & Ranti Centers,<br />
              Madhubani District, Bihar 847211, India<br />
              curator@shreekrit.com
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div className="pt-8 border-t border-[#3D2C22] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C7665] gap-4">
          <div>
            © {new Date().getFullYear()} Shreekrit Fine Arts. {t.footer.rights}
          </div>
          <div className="flex items-center gap-4">
            <span>{language === 'mai' ? 'प्राकृतिक रंग प्रमाणीकरण' : language === 'hi' ? 'प्राकृतिक रंग प्रमाणीकरण' : 'Natural Pigment Verification'}</span>
            <span>•</span>
            <span>{language === 'mai' ? 'लोकता कागद' : language === 'hi' ? 'लोकता कागज' : 'Archival Lokta Paper'}</span>
            <span>•</span>
            <span>{language === 'mai' ? 'वैश्विक सुरक्षित प्रेषण' : language === 'hi' ? 'वैश्विक सुरक्षित शिपिंग' : 'Worldwide Insured Transit'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
