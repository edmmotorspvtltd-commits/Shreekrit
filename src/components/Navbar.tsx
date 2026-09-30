import React, { useState } from 'react';
import {
  ShoppingBag, Menu, X, Sparkles,
  Feather, User, LogOut, Package
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_RATES } from '../data/paintings';
import { BLOG_POSTS } from '../data/blogPosts';
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
  onOpenTrackOrder: () => void;
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
  onOpenAuth,
  onOpenTrackOrder
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

  // Blog nav entry stays hidden until there's at least one real (non-
  // placeholder) post — no point sending visitors to a page that only
  // says "Replace Before Launch". (Temporarily forced to true for preview)
  const hasRealBlogContent = true;

  const handleNavClick = (section: string) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF5EA]/95 backdrop-blur-md border-b border-[#E2D4BF] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-w-0">
        <div className="flex items-center justify-between h-16 sm:h-24 md:h-28 min-w-0">

          {/* Brand Logo and Tagline */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex flex-col items-center justify-center cursor-pointer group select-none flex-shrink min-w-0"
          >
            {/* Shreekrit Logo */}
            <div className="w-14 h-9 sm:w-24 sm:h-14 md:w-28 md:h-16 group-hover:scale-105 transition-transform flex-shrink-0 mb-0 sm:mb-1">
              <img
                src="/shreekrit-logo.png"
                alt="Shreekrit"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            {/* Tagline below logo — hidden on the smallest screens to save
                vertical/horizontal space; the logo image itself carries the
                brand name */}
            <span className="hidden sm:block font-serif text-[12px] sm:text-[12px] text-[#8C2711] tracking-widest uppercase font-semibold whitespace-nowrap">
              Authentic Folk Art Archive
            </span>
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
            {hasRealBlogContent && (
              <button
                onClick={() => handleNavClick('blog')}
                className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                  activeSection === 'blog' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
                }`}
              >
                {t.nav.blog}
              </button>
            )}
            <button
              onClick={onOpenCommission}
              className="whitespace-nowrap border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-[#FAF5EA] px-4 py-1.5 rounded-full transition-colors cursor-pointer text-sm font-medium"
            >
              {t.nav.customCommission}
            </button>
            <button
              onClick={onOpenArtistApplication}
              className="whitespace-nowrap border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-[#FAF5EA] px-4 py-1.5 rounded-full transition-colors cursor-pointer text-sm font-medium"
            >
              {t.nav.forArtisans}
            </button>
          </nav>

          {/* Right Controls: Account, Cart and mobile menu. */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {/* Account Trigger */}
            <div className="relative group hidden sm:block">
              <button
                onClick={() => user ? null : onOpenAuth()}
                className="p-3 sm:p-2 rounded-full hover:bg-[#F0E4D2] text-[#241A14] transition-colors cursor-pointer flex items-center"
                aria-label="Account"
              >
                <User className="w-5 h-5 text-[#8C2711]" />
              </button>
              {user && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FAF5EA] border border-[#E2D4BF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-[#E2D4BF]">
                    <p className="text-xs text-[#8C7665] truncate">{user.email}</p>
                  </div>
                  <button onClick={() => onNavigate('my-orders')} className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2">
                    <Package className="w-4 h-4" /> My Orders
                  </button>
                  <button onClick={onOpenTrackOrder} className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2">
                    <Package className="w-4 h-4" /> Track Guest Order
                  </button>
                  <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2 rounded-b-lg">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
              {!user && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FAF5EA] border border-[#E2D4BF] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button onClick={onOpenAuth} className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2 rounded-t-lg">
                    <User className="w-4 h-4" /> Log In / Sign Up
                  </button>
                  <button onClick={onOpenTrackOrder} className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2 rounded-b-lg">
                    <Package className="w-4 h-4" /> Track Guest Order
                  </button>
                </div>
              )}
            </div>

            {/* Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              id="navbar-cart-btn"
              className="relative p-3 sm:p-2 rounded-full hover:bg-[#F0E4D2] text-[#241A14] transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5 text-[#8C2711]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#8C2711] text-white text-[12px] sm:text-[12px] font-bold flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 rounded-full hover:bg-[#F0E4D2] text-[#241A14] transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF5EA] border-b border-[#E0D0B8] px-4 pt-2 pb-6 space-y-3 shadow-lg">

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
          {hasRealBlogContent && (
            <button
              onClick={() => handleNavClick('blog')}
              className="w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
            >
              {t.nav.blog}
            </button>
          )}
          <div className="flex flex-col gap-2 pt-2 pb-4 border-b border-[#E8DEC8]">
            <button
              onClick={() => { onOpenCommission(); setMobileMenuOpen(false); }}
              className="w-full text-center py-2 px-4 text-sm font-medium border border-[#8C2711] text-[#8C2711] rounded-md hover:bg-[#8C2711] hover:text-[#FAF5EA] transition-colors"
            >
              {t.nav.customCommission}
            </button>
            <button
              onClick={() => { onOpenArtistApplication(); setMobileMenuOpen(false); }}
              className="w-full text-center py-2 px-4 text-sm font-medium border border-[#8C2711] text-[#8C2711] rounded-md hover:bg-[#8C2711] hover:text-[#FAF5EA] transition-colors"
            >
              {t.nav.forArtisans}
            </button>
          </div>

          <div className="pt-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-2 text-sm text-[#8C7665]">
                  <User className="w-4 h-4 text-[#8C2711]" />
                  <span className="truncate">{user.email}</span>
                </div>
                <button onClick={() => { onNavigate('my-orders'); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-[#241A14] flex items-center gap-2">
                  <Package className="w-4 h-4" /> My Orders
                </button>
                <button onClick={() => { onOpenTrackOrder(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-[#241A14] flex items-center gap-2">
                  <Package className="w-4 h-4" /> Track Guest Order
                </button>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-[#241A14] flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-[#8C2711] flex items-center gap-2">
                  <User className="w-4 h-4" /> Log In / Sign Up
                </button>
                <button onClick={() => { onOpenTrackOrder(); setMobileMenuOpen(false); }} className="w-full text-left py-2 text-sm font-medium text-[#8C2711] flex items-center gap-2">
                  <Package className="w-4 h-4" /> Track Guest Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

