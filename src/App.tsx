/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Eye, ArrowRight, ShieldCheck, 
  ShoppingBag, Check, Award, Heart, ChevronRight 
} from 'lucide-react';
import { Painting, Artist, CartItem, CurrencyCode, FrameOption, EditionType } from './types';
import { PAINTINGS } from './data/paintings';
import { ARTISTS } from './data/artists';
import { formatPrice } from './utils/currency';
import { refreshLiveRates } from './utils/liveRates';
import { useLanguage } from './context/LanguageContext';
import { Link } from './components/Link';
import { usePathname, navigate, closeModalRoute, getNavState } from './utils/router';
import { parseRoute, findById, paintingPath, artistPath, sectionPath } from './utils/routes';
import { applyPageMeta, truncate } from './utils/seo';

// Components
import { Navbar } from './components/Navbar';
import { HeroHandDrawn } from './components/HeroHandDrawn';
import { ParallaxMotifs } from './components/ParallaxMotifs';
import { GallerySection } from './components/GallerySection';
import { PaintingCard } from './components/PaintingCard';
import { VisualStoryTimeline } from './components/VisualStoryTimeline';
import { HeritageAboutSection } from './components/HeritageAboutSection';
import { ArtistsSection } from './components/ArtistsSection';
import { BlogSection } from './components/BlogSection';
import { MyOrdersSection } from './components/MyOrdersSection';
import { Footer } from './components/Footer';

import { ModalErrorBoundary } from './components/ModalErrorBoundary';

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  chunkId: string
) {
  return React.lazy(async () => {
    try {
      const module = await factory();
      window.sessionStorage.removeItem(`lazy-retry-${chunkId}`);
      return module;
    } catch (error) {
      try {
        const module = await factory();
        window.sessionStorage.removeItem(`lazy-retry-${chunkId}`);
        return module;
      } catch (retryError) {
        const hasRetried = window.sessionStorage.getItem(`lazy-retry-${chunkId}`);
        if (!hasRetried) {
          window.sessionStorage.setItem(`lazy-retry-${chunkId}`, 'true');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        throw retryError;
      }
    }
  });
}

// Modals are lazy-loaded to keep the initial page bundle lean and fast
const TrackOrderModal = lazyWithRetry(() => import('./components/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })), 'TrackOrderModal');
const ArtworkDetailModal = lazyWithRetry(() => import('./components/ArtworkDetailModal').then(m => ({ default: m.ArtworkDetailModal })), 'ArtworkDetailModal');
const ArtistProfileModal = lazyWithRetry(() => import('./components/ArtistProfileModal').then(m => ({ default: m.ArtistProfileModal })), 'ArtistProfileModal');
const CartDrawer = lazyWithRetry(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })), 'CartDrawer');
const CheckoutModal = lazyWithRetry(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })), 'CheckoutModal');
const CommissionModal = lazyWithRetry(() => import('./components/CommissionModal').then(m => ({ default: m.CommissionModal })), 'CommissionModal');
const ArtistApplicationModal = lazyWithRetry(() => import('./components/ArtistApplicationModal').then(m => ({ default: m.ArtistApplicationModal })), 'ArtistApplicationModal');
const AuthModal = lazyWithRetry(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })), 'AuthModal');

const HOME_DESCRIPTION = 'Fine-art gallery of authentic, hand-painted Mithila (Madhubani) folk art from India — original paintings, museum prints, artist profiles and direct checkout.';

const SECTION_META: Record<string, { title: string; description: string }> = {
  home: { title: 'Shreekrit — Hand-Painted Folk Art Gallery', description: HOME_DESCRIPTION },
  gallery: { title: 'Gallery — Original Mithila Paintings | Shreekrit', description: 'Browse original hand-painted Mithila (Madhubani) paintings by master artists, filterable by style, theme and price.' },
  story: { title: 'The Story of a Painting | Shreekrit', description: 'Follow a Mithila painting from natural pigments and hand-drawn motifs to the finished work and its certificate of authenticity.' },
  heritage: { title: 'Mithila Heritage & Lore | Shreekrit', description: 'The history, symbols and living tradition of Mithila (Madhubani) folk painting from Bihar, India.' },
  artists: { title: 'Master Artists of Mithila | Shreekrit', description: 'Meet the master Mithila artists behind Shreekrit, their villages, lineages and signature styles.' },
  blog: { title: 'The Shreekrit Gazette | Journal', description: 'Stories, techniques and notes on Mithila art from the Shreekrit journal.' },
  'my-orders': { title: 'My Orders | Shreekrit', description: 'Track your Shreekrit orders and certificates.' }
};

export default function App() {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const route = useMemo(() => parseRoute(pathname), [pathname]);

  // Section shown behind the page/modal. Painting and artist URLs render as
  // modals over a section; on a direct visit there is no previous section,
  // so fall back to the natural parent listing.
  const [backgroundSection, setBackgroundSection] = useState<string>(() => {
    const initial = parseRoute(window.location.pathname);
    if (initial.kind === 'section') return initial.section;
    return initial.kind === 'artist' ? 'artists' : 'gallery';
  });
  useEffect(() => {
    if (route.kind === 'section') setBackgroundSection(route.section);
  }, [route]);

  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('mithila_currency');
    return (saved as CurrencyCode) || 'INR';
  });

  // Gallery data is seeded with authentic collection for instant 0ms first render,
  // then seamlessly revalidated with the database (Neon) in the background (stale-while-revalidate).
  const [paintings, setPaintings] = useState<Painting[]>(() => {
    try {
      const cached = localStorage.getItem('mithila_cached_paintings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return PAINTINGS;
  });

  const [artists, setArtists] = useState<Artist[]>(() => {
    try {
      const cached = localStorage.getItem('mithila_cached_artists');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return ARTISTS;
  });

  // Direct visits to /painting/:id or /artist/:id can't be called missing
  // until the background database sync has had a chance to add them.
  const [dataSynced, setDataSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [paintingsRes, artistsRes] = await Promise.all([
          fetch('/api/paintings'),
          fetch('/api/artists')
        ]);
        if (!paintingsRes.ok || !artistsRes.ok) {
          throw new Error('Gallery data request failed');
        }
        const [paintingsData, artistsData] = await Promise.all([
          paintingsRes.json(),
          artistsRes.json()
        ]);
        if (!cancelled) {
          if (Array.isArray(paintingsData) && paintingsData.length > 0) {
            setPaintings(paintingsData);
            try {
              localStorage.setItem('mithila_cached_paintings', JSON.stringify(paintingsData));
            } catch {
              // ignore quota
            }
          }
          if (Array.isArray(artistsData) && artistsData.length > 0) {
            setArtists(artistsData);
            try {
              localStorage.setItem('mithila_cached_artists', JSON.stringify(artistsData));
            } catch {
              // ignore quota
            }
          }
        }
      } catch (e) {
        // Silent background fallback: existing seed/cached data is preserved
        console.warn('Background gallery data sync encountered an issue, preserving cached data:', e);
      } finally {
        if (!cancelled) setDataSynced(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live FX rates mutate CURRENCY_RATES in place (see utils/liveRates.ts);
  // this forces one re-render afterward so already-mounted prices reflect
  // the refreshed rates instead of the static fallback snapshot.
  const [, forceRatesRerender] = useState(0);
  const [ratesAsOf, setRatesAsOf] = useState<string | null>(null);
  useEffect(() => {
    refreshLiveRates().then((asOf) => {
      if (asOf) setRatesAsOf(asOf);
      forceRatesRerender((n) => n + 1);
    });
  }, []);

  // Session-persisted cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mithila_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Modals and Selections
  // Painting and artist modals are driven by the URL (/painting/:id,
  // /artist/:id). An artist opened from a painting keeps that painting
  // beneath it (history state `under`), so closing returns to it.
  const underPaintingId = route.kind === 'artist' ? getNavState().under : undefined;
  const routedPainting = route.kind === 'painting' ? findById<Painting>(paintings, route.id) : undefined;
  const selectedPainting: Painting | null =
    routedPainting ?? (underPaintingId ? findById<Painting>(paintings, underPaintingId) ?? null : null);
  const selectedArtist: Artist | null = route.kind === 'artist' ? findById<Artist>(artists, route.id) ?? null : null;
  const isMissingItem =
    dataSynced &&
    ((route.kind === 'painting' && !routedPainting) || (route.kind === 'artist' && !selectedArtist));
  const activeSection =
    route.kind === 'not-found' || isMissingItem ? '404' : route.kind === 'section' ? route.section : backgroundSection;

  const openPainting = (painting: Painting) => navigate(paintingPath(painting));
  const closeModalPage = () => closeModalRoute(route.kind === 'artist' ? sectionPath('artists') : sectionPath('gallery'));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [commissionArtist, setCommissionArtist] = useState<string | undefined>(undefined);
  const [commissionTheme, setCommissionTheme] = useState<string | undefined>(undefined);
  const [isArtistApplicationOpen, setIsArtistApplicationOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global scroll lock for modals
  useEffect(() => {
    const isAnyModalOpen = isCartOpen || isCheckoutOpen || isCommissionOpen || isArtistApplicationOpen || isAuthOpen || isTrackOrderOpen || selectedPainting || selectedArtist;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen, isCheckoutOpen, isCommissionOpen, isArtistApplicationOpen, isAuthOpen, isTrackOrderOpen, selectedPainting, selectedArtist]);

  // Per-page title, description and canonical tag.
  useEffect(() => {
    if (route.kind === 'painting' && routedPainting) {
      const path = paintingPath(routedPainting);
      applyPageMeta({
        title: `${routedPainting.title} by ${routedPainting.artistName} | Shreekrit`,
        description: truncate(`${routedPainting.title}, a hand-painted ${routedPainting.style} Mithila painting by ${routedPainting.artistName}. ${routedPainting.story}`),
        path,
        image: routedPainting.primaryImage
      });
      if (decodeURI(window.location.pathname) !== decodeURI(path)) {
        window.history.replaceState(window.history.state, '', path);
      }
    } else if (route.kind === 'artist' && selectedArtist) {
      const path = artistPath(selectedArtist);
      applyPageMeta({
        title: `${selectedArtist.name} — Mithila Artist from ${selectedArtist.village} | Shreekrit`,
        description: truncate(`${selectedArtist.name} (${selectedArtist.maithiliName}), ${selectedArtist.specialtyStyle} specialist from ${selectedArtist.village}, ${selectedArtist.district}. ${selectedArtist.bio}`),
        path,
        image: selectedArtist.avatar
      });
      if (decodeURI(window.location.pathname) !== decodeURI(path)) {
        window.history.replaceState(window.history.state, '', path);
      }
    } else if (route.kind === 'section') {
      const meta = SECTION_META[route.section] ?? SECTION_META.home;
      applyPageMeta({ ...meta, path: sectionPath(route.section) });
    } else if (route.kind === 'not-found' || isMissingItem) {
      applyPageMeta({
        title: 'Page not found | Shreekrit',
        description: SECTION_META.home.description,
        path: '/'
      });
    }
  }, [route, routedPainting, selectedArtist, isMissingItem]);

  // Save cart to session localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mithila_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }, [cart]);

  // Save currency preference
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    localStorage.setItem('mithila_currency', newCurrency);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add to Cart
  const handleAddToCart = (
    painting: Painting,
    frame: FrameOption = 'Unframed (Rolled in Archival Tube)',
    framePriceINR: number = 0,
    editionType: EditionType = 'original',
    unitPriceINR: number = painting.priceINR
  ) => {
    setCart((prev) => [
      ...prev,
      {
        painting,
        frame,
        framePriceINR,
        addedAt: Date.now(),
        editionType,
        unitPriceINR
      }
    ]);
    const pTitle = (language === 'mai' || language === 'hi') && painting.maithiliTitle ? painting.maithiliTitle : painting.title;
    showToast(language === 'mai' ? `"${pTitle}" आहाँक मंजूषा (कार्ट) में जोड़ल गेल।` : language === 'hi' ? `"${pTitle}" आपकी कार्ट में जोड़ा गया।` : `Added "${pTitle}" to your acquisition cart.`);
    setIsCartOpen(true);
  };

  // Quick Add (defaults to Unframed, original edition at full price)
  const handleQuickAdd = (painting: Painting) => {
    handleAddToCart(painting, 'Unframed (Rolled in Archival Tube)', 0, 'original', painting.priceINR);
  };

  // Direct Buy ("Buy Now" - bypass cart)
  const handleDirectBuy = (
    painting: Painting,
    frame: FrameOption = 'Unframed (Rolled in Archival Tube)',
    framePriceINR: number = 0,
    editionType: EditionType = 'original',
    unitPriceINR: number = painting.priceINR
  ) => {
    setCart([
      {
        painting,
        frame,
        framePriceINR,
        addedAt: Date.now(),
        editionType,
        unitPriceINR
      }
    ]);
    if (route.kind === 'painting') closeModalPage();
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOpenCommission = (artistOrTheme?: string) => {
    setCommissionArtist(artistOrTheme);
    setIsCommissionOpen(true);
  };

  const handleOpenCommissionTheme = (theme?: string) => {
    setCommissionTheme(theme);
    setIsCommissionOpen(true);
  };

  const featuredPaintings = paintings.filter((p) => p.isFeatured).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#241A14] flex flex-col relative selection:bg-[#C94A29]/20 selection:text-[#8C2711]" style={{ overflowX: 'clip' }}>
      {/* Background Layered Parallax Floating Motifs */}
      <ParallaxMotifs />

      {/* Top Navigation */}
      <Navbar
        activeSection={activeSection}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCommission={() => handleOpenCommission()}
        onOpenArtistApplication={() => setIsArtistApplicationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
      />

      {/* Main Views Container */}
      <main className="flex-grow z-10">
        {activeSection === 'home' && (
          <div className="space-y-16">
            {/* Signature Hand-Drawn Animated Hero */}
            <HeroHandDrawn
              onExploreClick={() => {
                const el = document.getElementById('featured-curation');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Curated "Featured Masterpieces" Strip */}
            <section id="featured-curation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2D4BF] pb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8C2711] mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#C94A29]" />
                    <span>{t.featured.badge}</span>
                  </div>
                  <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#241A14]">
                    {t.featured.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#665141] mt-1">
                    {t.featured.subtitle}
                  </p>
                </div>

                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer group py-3 -my-3 px-1 -mx-1"
                >
                  <span>{t.featured.viewAll}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPaintings.map((painting) => (
                  <PaintingCard
                    key={painting.id}
                    painting={painting}
                    currency={currency}
                    onQuickAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </section>

            {/* Visual Narrative 4-Stage Journey Timeline */}
            <VisualStoryTimeline />

            {/* Meet the Artists Teaser Strip */}
            <ArtistsSection
              artists={artists}
              onOpenCommission={handleOpenCommission}
            />

            {/* Heritage Lore & About */}
            <HeritageAboutSection
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'gallery' && (
          <GallerySection
            paintings={paintings}
            artists={artists}
            currency={currency}
            onQuickAdd={handleQuickAdd}
          />
        )}

        {activeSection === 'story' && (
          <div className="pt-6">
            <VisualStoryTimeline isPageHeading />
            {/* Explicit boundary marker — without this, Heritage Lore's
                content ran straight on from the story timeline above it
                with nothing to signal a new section had started. */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 py-8">
                <div className="h-px flex-1 bg-[#D5C3A5]" />
                <span className="text-xs uppercase tracking-widest font-semibold text-[#8C2711] whitespace-nowrap">
                  {t.nav.heritage}
                </span>
                <div className="h-px flex-1 bg-[#D5C3A5]" />
              </div>
            </div>
            <HeritageAboutSection
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'heritage' && (
          <div className="pt-6">
            <HeritageAboutSection
              isPageHeading
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'artists' && (
          <div className="pt-6">
            <ArtistsSection
              isPageHeading
              artists={artists}
              onOpenCommission={handleOpenCommission}
            />
          </div>
        )}

        {activeSection === 'blog' && (
          <div className="pt-6">
            <BlogSection />
          </div>
        )}

        {activeSection === 'my-orders' && (
          <div className="pt-6">
            <MyOrdersSection onOpenAuth={() => setIsAuthOpen(true)} />
          </div>
        )}

        {activeSection === '404' && (
          <div className="pt-20 pb-32 text-center flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <h2 className="font-serif-display text-4xl sm:text-5xl font-bold text-[#8C2711]">404</h2>
            <p className="text-[#665141] text-lg">Page not found.</p>
            <Link
              to="/"
              className="px-6 py-3 bg-[#8C2711] text-[#FAF5EA] rounded shadow-md hover:bg-[#5C1A0B] transition-colors cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        )}
      </main>

      {/* Modals & Drawers wrapped in Suspense for dynamic code splitting */}
      <ModalErrorBoundary>
        {/* Flagship Artwork Detail Modal with High-Res Zoom Loupe & In-Room Scale */}
        <React.Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300">
            <div className="w-10 h-10 border-4 border-[#C94A29] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <AnimatePresence>
            {selectedPainting && (
              <ArtworkDetailModal
                key="artwork-modal"
                painting={selectedPainting}
                allPaintings={paintings}
                artists={artists}
                currency={currency}
                onClose={closeModalPage}
                onAddToCart={(painting, frame, framePrice, editionType, unitPriceINR) => {
                  handleAddToCart(painting, frame, framePrice, editionType, unitPriceINR);
                  closeModalPage();
                }}
                onDirectBuy={(painting, frame, framePrice, editionType, unitPriceINR) => {
                  handleDirectBuy(painting, frame, framePrice, editionType, unitPriceINR);
                }}
                onOpenCommission={(theme) => {
                  closeModalPage();
                  handleOpenCommissionTheme(theme);
                }}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Artist Profile Deep-Dive Modal */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {selectedArtist && (
              <ArtistProfileModal
                key="artist-modal"
                artist={selectedArtist}
                paintings={paintings}
                currency={currency}
                onClose={closeModalPage}
                onOpenCommission={(artistName) => {
                  closeModalPage();
                  handleOpenCommission(artistName);
                }}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Slide-In Mini-Cart Drawer (Frame Styled) */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {isCartOpen && (
              <CartDrawer
                key="cart-drawer"
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cart}
                currency={currency}
                onRemoveItem={handleRemoveFromCart}
                onCheckout={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Checkout Modal with Multi-Currency & Certificate of Authenticity Generator */}
        <React.Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300">
            <div className="w-10 h-10 border-4 border-[#C94A29] border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <AnimatePresence>
            {isCheckoutOpen && (
              <CheckoutModal
                key="checkout-modal"
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                items={cart}
                currency={currency}
                onClearCart={handleClearCart}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Custom Commission Modal */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {isCommissionOpen && (
              <CommissionModal
                key="commission-modal"
                isOpen={isCommissionOpen}
                onClose={() => setIsCommissionOpen(false)}
                artists={artists}
                preselectedArtist={commissionArtist}
                preselectedTheme={commissionTheme}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Artist Guild Onboarding Application Modal */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {isArtistApplicationOpen && (
              <ArtistApplicationModal
                key="artist-app-modal"
                isOpen={isArtistApplicationOpen}
                onClose={() => setIsArtistApplicationOpen(false)}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Login / Sign Up Modal */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {isAuthOpen && (
              <AuthModal
                key="auth-modal"
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
              />
            )}
          </AnimatePresence>
        </React.Suspense>

        {/* Guest Order Tracking Modal */}
        <React.Suspense fallback={null}>
          <AnimatePresence>
            {isTrackOrderOpen && (
              <TrackOrderModal
                key="track-order-modal"
                isOpen={isTrackOrderOpen}
                onClose={() => setIsTrackOrderOpen(false)}
              />
            )}
          </AnimatePresence>
        </React.Suspense>
      </ModalErrorBoundary>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-[#241A14] text-[#FAF5EA] px-4 py-3 rounded-md shadow-2xl border border-[#8C2711] flex items-center gap-3 text-xs max-w-sm"
          >
            <div className="w-6 h-6 rounded-full bg-[#8C2711] flex items-center justify-center text-white flex-shrink-0">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer
        onOpenCommission={() => handleOpenCommission()}
        onOpenArtistApplication={() => setIsArtistApplicationOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenAuth={() => setIsAuthOpen(true)}
        ratesAsOf={ratesAsOf}
      />
    </div>
  );
}
