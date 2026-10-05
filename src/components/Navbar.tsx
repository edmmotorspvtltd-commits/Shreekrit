import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingBag, Menu, X, Sparkles,
  Feather, User, LogOut, Package, ChevronDown
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_RATES } from '../data/paintings';
import { Link } from './Link';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../i18n/translations';

const DISCOVER_ITEMS = [
  { to: '/story', section: 'story', key: 'story' },
  { to: '/heritage', section: 'heritage', key: 'heritage' },
  { to: '/artists', section: 'artists', key: 'artists' }
] as const;

const ACTIVE_LINK = 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]';

interface NavbarProps {
  activeSection: string;
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

  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [mobileDiscoverOpen, setMobileDiscoverOpen] = useState(false);
  const discoverRef = useRef<HTMLDivElement>(null);
  const discoverButtonRef = useRef<HTMLButtonElement>(null);
  const discoverActive = DISCOVER_ITEMS.some((item) => item.section === activeSection);

  // Close the desktop dropdown on outside click and Escape.
  useEffect(() => {
    if (!discoverOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!discoverRef.current?.contains(e.target as Node)) setDiscoverOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setDiscoverOpen(false);
      discoverButtonRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [discoverOpen]);

  // Escape also collapses the mobile menu.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setMobileDiscoverOpen(false);
    setDiscoverOpen(false);
  };

  const currencies: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'JPY'];

  // Blog nav entry stays hidden until there's at least one real (non-
  // placeholder) post — no point sending visitors to a page that only
  // says "Replace Before Launch". Set to true once real posts are published.
  const hasRealBlogContent = false;

  return (
    <header className="sticky top-0 z-40 bg-[#FAF5EA]/95 backdrop-blur-md border-b border-[#E2D4BF] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-w-0">
        <div className="flex items-center justify-between h-16 sm:h-24 md:h-28 min-w-0">

          {/* Brand Logo and Tagline */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Shreekrit home"
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
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3 text-[13px] 2xl:text-sm font-medium text-[#4A3525]">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'home' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
              }`}
            >
              {t.nav.home}
            </Link>
            <Link
              to="/shop"
              onClick={closeMenus}
              className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                activeSection === 'shop' ? ACTIVE_LINK : ''
              }`}
            >
              {t.nav.shop}
            </Link>
            <div
              ref={discoverRef}
              className="relative"
              onMouseEnter={() => setDiscoverOpen(true)}
              onMouseLeave={() => setDiscoverOpen(false)}
              onFocus={() => setDiscoverOpen(true)}
              onBlur={(e) => {
                if (!discoverRef.current?.contains(e.relatedTarget as Node | null)) setDiscoverOpen(false);
              }}
            >
              <button
                ref={discoverButtonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={discoverOpen}
                aria-controls="discover-menu"
                onClick={() => setDiscoverOpen(true)}
                className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                  discoverActive ? ACTIVE_LINK : ''
                }`}
              >
                {t.nav.discover}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${discoverOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {discoverOpen && (
                <div id="discover-menu" className="absolute left-0 top-full pt-2 z-50">
                  <ul className="min-w-48 bg-[#FAF5EA] border border-[#E2D4BF] rounded-lg shadow-lg py-1">
                    {DISCOVER_ITEMS.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={closeMenus}
                          aria-current={activeSection === item.section ? 'page' : undefined}
                          className={`block px-4 py-2 text-sm hover:bg-[#F0E4D2] hover:text-[#8C2711] ${
                            activeSection === item.section ? 'text-[#8C2711] font-semibold' : 'text-[#241A14]'
                          }`}
                        >
                          {t.nav[item.key]}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {hasRealBlogContent && (
              <Link
                to="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className={`whitespace-nowrap hover:text-[#8C2711] transition-colors cursor-pointer ${
                  activeSection === 'blog' ? 'text-[#8C2711] font-semibold underline underline-offset-8 decoration-[#8C2711]' : ''
                }`}
              >
                {t.nav.blog}
              </Link>
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
                  <Link to="/my-orders" className="w-full text-left px-4 py-2 text-sm text-[#241A14] hover:bg-[#F0E4D2] flex items-center gap-2">
                    <Package className="w-4 h-4" /> My Orders
                  </Link>
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

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.home}
          </Link>
          <Link
            to="/shop"
            onClick={closeMenus}
            className="block w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
          >
            {t.nav.shop}
          </Link>
          <div className="border-b border-[#E8DEC8]">
            <button
              type="button"
              aria-expanded={mobileDiscoverOpen}
              aria-controls="mobile-discover-menu"
              onClick={() => setMobileDiscoverOpen((open) => !open)}
              className="flex w-full items-center justify-between py-2 text-sm font-medium text-[#241A14]"
            >
              {t.nav.discover}
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileDiscoverOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            {mobileDiscoverOpen && (
              <ul id="mobile-discover-menu" className="pb-2 pl-4">
                {DISCOVER_ITEMS.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={closeMenus}
                      aria-current={activeSection === item.section ? 'page' : undefined}
                      className={`block py-2 text-sm ${activeSection === item.section ? 'text-[#8C2711] font-semibold' : 'text-[#241A14]'}`}
                    >
                      {t.nav[item.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {hasRealBlogContent && (
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left py-2 text-sm font-medium text-[#241A14] border-b border-[#E8DEC8]"
            >
              {t.nav.blog}
            </Link>
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
                <Link to="/my-orders" onClick={() => setMobileMenuOpen(false)} className="w-full text-left py-2 text-sm font-medium text-[#241A14] flex items-center gap-2">
                  <Package className="w-4 h-4" /> My Orders
                </Link>
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

