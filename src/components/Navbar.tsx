import React, { useState } from 'react';
import {
  ShoppingBag, Menu, X, Sparkles, Globe,
  ChevronDown, Languages, Check, Feather, User, LogOut, Package
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_RATES } from '../data/paintings';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../i18n/translations';

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (curr: CurrencyCode) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenCommission: () => void;
  onOpenArtistApplication: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  currency,
  onCurrencyChange,
  cartCount,
  onOpenCart,
  onOpenCommission,
  onOpenArtistApplication,
  onOpenAuth
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleNavClick = (section: string) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF5EA]/95 backdrop-blur-md border-b border-[#E2D4BF] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Wordmark in authentic Mithila typography */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            {/* Hand-drawn Mithila Sun/Peacock Logo Medallion */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#8C2711] flex items-center justify-center text-[#FAF5EA] shadow-sm border border-[#C94A29]/60 group-hover:scale-105 transition-transform flex-shrink-0">
              <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <circle cx="12" cy="12" r="3" fill="#E5A93C" />
              </svg>
            </div>

            <div>
              <span className="font-serif-display text-lg sm:text-2xl font-bold text-[#241A14] tracking-tight block leading-none">
                Shreekrit
              </span>
              <span className="font-serif text-[9px] sm:text-[11px] text-[#8C2711] tracking-wider uppercase font-semibold block mt-0.5">
                {t.nav.tagline}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-[13px] 2xl:text-sm font-medium text-[#4A3525]">
            <button
              onClick={() => handleNavClick('home')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'home' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => handleNavClick('gallery')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'gallery' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.gallery}
            </button>
            <button
              onClick={() => handleNavClick('story')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'story' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.story}
            </button>
            <button
              onClick={() => handleNavClick('heritage')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'heritage' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.heritage}
            </button>
            <button
              onClick={() => handleNavClick('artists')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'artists' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.artists}
            </button>
            <button
              onClick={() => handleNavClick('blog')}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'blog' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.blog}
            </button>
          </nav>

          {/* Right Controls: Language Selector, Currency, Custom Commission, Cart Button */}
          <div className="flex items-center gap-0.5">
            {/* Language Selector Switcher */}
            <div className="relative">
              <button
                type="button"
                id="language-switcher-btn"
                onClick={() => {
                  setLanguageDropdownOpen(!languageDropdownOpen);
                  setCurrencyDropdownOpen(false);
                }}
                className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-[#F0E4D2] text-[11px] sm:text-xs font-semibold text-[#3D2819] flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
                aria-label="Select language"
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8C2711] flex-shrink-0" />
                <span className="hidden 2xl:inline font-medium">{currentLang.nativeName}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#EFE4D2] text-[#8C2711] font-mono font-bold">
                  {currentLang.scriptBadge}
                </span>
                <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#7A6452] flex-shrink-0" />
              </button>

              {languageDropdownOpen && (
                <div 
                  id="language-dropdown-menu"
                  className="absolute right-0 mt-1 w-44 bg-[#FAF5EA] border border-[#D5C3A5] rounded-md shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7A6452] border-b border-[#E8DEC8]">
                    {t.nav.language} / Language
                  </div>
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLanguage(item.code);
                        setLanguageDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#F3EADA] transition-colors cursor-pointer ${
                        language === item.code ? 'bg-[#F0E4D2] font-bold text-[#8C2711]' : 'text-[#4A3222]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-center text-[10px] font-bold py-0.5 px-1 bg-[#E8DEC8] rounded text-[#3D2819]">
                          {item.scriptBadge}
                        </span>
                        <div>
                          <div className="font-medium text-xs">{item.nativeName}</div>
                          <div className="text-[10px] text-[#7A6452]">{item.label}</div>
                        </div>
                      </div>
                      {language === item.code && <Check className="w-3.5 h-3.5 text-[#8C2711]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Currency Selector (Sleek and compact INR box) */}
            <div className="relative">
              <button
                type="button"
                id="currency-switcher-btn"
                onClick={() => {
                  setCurrencyDropdownOpen(!currencyDropdownOpen);
                  setLanguageDropdownOpen(false);
                }}
                className="px-2 py-1 rounded-full hover:bg-[#F0E4D2] text-[11px] sm:text-xs font-semibold text-[#3D2819] flex items-center gap-1 transition-colors cursor-pointer"
                aria-label="Select currency"
              >
                <Globe className="w-3 h-3 text-[#8C2711] flex-shrink-0" />
                <span className="font-mono font-bold text-[#8C2711]">{CURRENCY_RATES[currency]?.symbol}</span>
                <span className="font-sans font-medium text-[11px] sm:text-xs">{currency}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#7A6452] flex-shrink-0" />
              </button>

              {currencyDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-[#FAF5EA] border border-[#D5C3A5] rounded-md shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#7A6452] border-b border-[#E8DEC8]">
                    {t.nav.currency}
                  </div>
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      onClick={() => {
                        onCurrencyChange(curr);
                        setCurrencyDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-[#F3EADA] cursor-pointer ${
                        currency === curr ? 'bg-[#F0E4D2] font-bold text-[#8C2711]' : 'text-[#4A3222]'
                      }`}
                    >
                      <span className="font-medium">{curr}</span>
                      <span className="font-mono font-bold text-[#8C2711]">{CURRENCY_RATES[curr]?.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px h-5 bg-[#E2D4BF] mx-0.5" />

            {/* Sell Your Art / Artist Onboarding Button — ghost style like the
                language/currency switchers, not a boxed CTA: Custom
                Commission is the one action in this row that should read as
                a solid button, since buyers are the typical visitor. */}
            <button
              onClick={onOpenArtistApplication}
              className="hidden lg:inline-flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-full hover:bg-[#F0E4D2] text-[#8C2711] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Feather className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden xl:inline">{t.nav.forArtisans}</span>
            </button>

            {/* Custom Commission Button */}
            <button
              onClick={onOpenCommission}
              className="hidden lg:inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-1.5 rounded-full bg-[#8C2711] text-white hover:bg-[#6E1C0A] text-xs font-semibold transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.nav.customCommission}</span>
            </button>

            {/* My Account — icon-only ghost button, dropdown for details.
                Kept minimal on purpose: the row is already at its width
                budget at 1280-1440px, so this stays the same footprint as
                the cart button rather than showing an email inline. */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountDropdownOpen(!accountDropdownOpen);
                  setLanguageDropdownOpen(false);
                  setCurrencyDropdownOpen(false);
                }}
                className="p-1.5 sm:p-2 rounded-full hover:bg-[#F0E4D2] text-[#241A14] transition-colors cursor-pointer"
                aria-label="Account"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C2711]" />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-[#FAF5EA] border border-[#D5C3A5] rounded-md shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {user ? (
                    <>
                      <div className="px-3 py-2 text-[11px] text-[#7A6452] border-b border-[#E8DEC8] truncate">
                        {user.email}
                      </div>
                      <button
                        onClick={() => {
                          onNavigate('my-orders');
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#F3EADA] transition-colors cursor-pointer text-[#4A3222]"
                      >
                        <Package className="w-3.5 h-3.5 text-[#8C2711]" />
                        <span>My Orders</span>
                      </button>
                      <button
                        onClick={() => {
                          signOut();
                          setAccountDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#F3EADA] transition-colors cursor-pointer text-[#4A3222]"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#8C2711]" />
                        <span>Log Out</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setAccountDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#F3EADA] transition-colors cursor-pointer text-[#4A3222]"
                    >
                      <User className="w-3.5 h-3.5 text-[#8C2711]" />
                      <span>Log In / Sign Up</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              id="navbar-cart-btn"
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-[#F0E4D2] text-[#241A14] transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C2711]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#8C2711] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded text-[#241A14] hover:bg-[#F3EADA] cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF5EA] border-b border-[#E0D0B8] px-4 pt-2 pb-6 space-y-3 shadow-lg">
          {/* Mobile Language Switcher */}
          <div className="py-2 border-b border-[#E8DEC8]">
            <div className="text-[11px] font-semibold text-[#7A6452] uppercase mb-1.5">
              {t.nav.language} (Language)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                  className={`py-1.5 px-2 rounded text-xs font-medium text-center border transition-all ${
                    language === item.code 
                      ? 'bg-[#8C2711] text-white border-[#8C2711] font-bold shadow-xs'
                      : 'bg-[#F4EADA] text-[#3D2819] border-[#D5C3A5]'
                  }`}
                >
                  <span className="block font-semibold">{item.nativeName}</span>
                  <span className="text-[9px] opacity-80">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Currency Switcher */}
          <div className="py-2 border-b border-[#E8DEC8]">
            <div className="text-[11px] font-semibold text-[#7A6452] uppercase mb-1.5 flex items-center justify-between">
              <span>{t.nav.currency} (Currency)</span>
              <span className="font-mono text-[#8C2711] font-bold text-xs">{CURRENCY_RATES[currency]?.symbol} {currency}</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => onCurrencyChange(curr)}
                  className={`py-1.5 px-1 rounded text-center border transition-all cursor-pointer ${
                    currency === curr
                      ? 'bg-[#8C2711] text-white border-[#8C2711] font-bold shadow-xs'
                      : 'bg-[#F4EADA] text-[#3D2819] border-[#D5C3A5]'
                  }`}
                >
                  <span className="block font-mono text-xs font-bold leading-none">{CURRENCY_RATES[curr]?.symbol}</span>
                  <span className="block text-[9px] mt-0.5">{curr}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleNavClick('home')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.home}
          </button>
          <button
            onClick={() => handleNavClick('gallery')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.gallery}
          </button>
          <button
            onClick={() => handleNavClick('story')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.story}
          </button>
          <button
            onClick={() => handleNavClick('heritage')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.heritage}
          </button>
          <button
            onClick={() => handleNavClick('artists')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.artists}
          </button>
          <button
            onClick={() => handleNavClick('blog')}
            className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.blog}
          </button>
          {/* Mobile Account Section */}
          <div className="py-2 border-b border-[#E8DEC8] space-y-2">
            {user ? (
              <>
                <div className="text-[11px] text-[#7A6452] truncate">{user.email}</div>
                <button
                  onClick={() => {
                    onNavigate('my-orders');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-[#8C2711] text-[#8C2711] rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>My Orders</span>
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-[#D5C3A5] text-[#4A3222] rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 border border-[#8C2711] text-[#8C2711] rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Log In / Sign Up</span>
              </button>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onOpenArtistApplication();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 border border-[#8C2711] text-[#8C2711] rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>{t.nav.forArtisans}</span>
            </button>
            <button
              onClick={() => {
                onOpenCommission();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-[#8C2711] text-white rounded text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.nav.customCommission}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

