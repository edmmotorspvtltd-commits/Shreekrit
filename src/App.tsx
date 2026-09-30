/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

// Modals are lazy-loaded to keep the initial page bundle lean and fast
const TrackOrderModal = React.lazy(() => import('./components/TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
const ArtworkDetailModal = React.lazy(() => import('./components/ArtworkDetailModal').then(m => ({ default: m.ArtworkDetailModal })));
const ArtistProfileModal = React.lazy(() => import('./components/ArtistProfileModal').then(m => ({ default: m.ArtistProfileModal })));
const CartDrawer = React.lazy(() => import('./components/CartDrawer').then(m => ({ default: m.CartDrawer })));
const CheckoutModal = React.lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const CommissionModal = React.lazy(() => import('./components/CommissionModal').then(m => ({ default: m.CommissionModal })));
const ArtistApplicationModal = React.lazy(() => import('./components/ArtistApplicationModal').then(m => ({ default: m.ArtistApplicationModal })));
const AuthModal = React.lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));

export default function App() {
  const { t, language } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>('home');
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
  useEffect(() => {
    refreshLiveRates().then(() => forceRatesRerender((n) => n + 1));
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
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
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
    frame: FrameOption = 'Raw Sheesham Wood Frame',
    framePriceINR: number = 6500,
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

  // Quick Add (defaults to Sheesham frame, original edition at full price)
  const handleQuickAdd = (painting: Painting) => {
    handleAddToCart(painting, 'Raw Sheesham Wood Frame', 6500, 'original', painting.priceINR);
  };

  // Direct Buy ("Buy Now" - bypass cart)
  const handleDirectBuy = (
    painting: Painting,
    frame: FrameOption = 'Raw Sheesham Wood Frame',
    framePriceINR: number = 6500,
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
    setSelectedPainting(null);
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

  const handleArtistClickById = (artistId: string) => {
    const artist = artists.find((a) => a.id === artistId);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  const featuredPaintings = paintings.filter((p) => p.isFeatured).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAF5EA] text-[#241A14] flex flex-col relative selection:bg-[#C94A29]/20 selection:text-[#8C2711]" style={{ overflowX: 'clip' }}>
      {/* Background Layered Parallax Floating Motifs */}
      <ParallaxMotifs />

      {/* Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCommission={() => handleOpenCommission()}
        onOpenArtistApplication={() => setIsArtistApplicationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
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
              onStoryClick={() => {
                setActiveSection('heritage');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

                <button
                  onClick={() => setActiveSection('gallery')}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer group py-3 -my-3 px-1 -mx-1"
                >
                  <span>{t.featured.viewAll}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredPaintings.map((painting) => (
                  <PaintingCard
                    key={painting.id}
                    painting={painting}
                    currency={currency}
                    onSelect={(p) => setSelectedPainting(p)}
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
              onSelectArtist={(artist) => setSelectedArtist(artist)}
              onOpenCommission={handleOpenCommission}
            />

            {/* Heritage Lore & About */}
            <HeritageAboutSection
              onExploreGallery={() => {
                setActiveSection('gallery');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'gallery' && (
          <GallerySection
            paintings={paintings}
            artists={artists}
            currency={currency}
            onSelectPainting={(p) => setSelectedPainting(p)}
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
              onExploreGallery={() => setActiveSection('gallery')}
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'heritage' && (
          <div className="pt-6">
            <HeritageAboutSection
              isPageHeading
              onExploreGallery={() => setActiveSection('gallery')}
              onOpenCommission={() => handleOpenCommission()}
            />
          </div>
        )}

        {activeSection === 'artists' && (
          <div className="pt-6">
            <ArtistsSection
              isPageHeading
              artists={artists}
              onSelectArtist={(artist) => setSelectedArtist(artist)}
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
      </main>

      {/* Modals & Drawers wrapped in Suspense for dynamic code splitting */}
      <React.Suspense fallback={null}>
        {/* Flagship Artwork Detail Modal with High-Res Zoom Loupe & In-Room Scale */}
        <AnimatePresence>
          {selectedPainting && (
            <ArtworkDetailModal
              painting={selectedPainting}
              allPaintings={paintings}
              artists={artists}
              currency={currency}
              onClose={() => setSelectedPainting(null)}
              onAddToCart={(painting, frame, framePrice, editionType, unitPriceINR) => {
                handleAddToCart(painting, frame, framePrice, editionType, unitPriceINR);
                setSelectedPainting(null);
              }}
              onDirectBuy={(painting, frame, framePrice, editionType, unitPriceINR) => {
                handleDirectBuy(painting, frame, framePrice, editionType, unitPriceINR);
              }}
              onSelectArtist={(artistId) => {
                handleArtistClickById(artistId);
              }}
              onSelectRelated={(related) => {
                setSelectedPainting(related);
              }}
              onOpenCommission={(theme) => {
                setSelectedPainting(null);
                handleOpenCommissionTheme(theme);
              }}
            />
          )}
        </AnimatePresence>

        {/* Artist Profile Deep-Dive Modal */}
        <AnimatePresence>
          {selectedArtist && (
            <ArtistProfileModal
              artist={selectedArtist}
              paintings={paintings}
              currency={currency}
              onClose={() => setSelectedArtist(null)}
              onSelectPainting={(p) => {
                setSelectedArtist(null);
                setSelectedPainting(p);
              }}
              onOpenCommission={(artistName) => {
                setSelectedArtist(null);
                handleOpenCommission(artistName);
              }}
            />
          )}
        </AnimatePresence>

        {/* Slide-In Mini-Cart Drawer (Frame Styled) */}
        <AnimatePresence>
          {isCartOpen && (
            <CartDrawer
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

        {/* Checkout Modal with Multi-Currency & Certificate of Authenticity Generator */}
        <AnimatePresence>
          {isCheckoutOpen && (
            <CheckoutModal
              isOpen={isCheckoutOpen}
              onClose={() => setIsCheckoutOpen(false)}
              items={cart}
              currency={currency}
              onClearCart={handleClearCart}
            />
          )}
        </AnimatePresence>

        {/* Custom Commission Modal */}
        <AnimatePresence>
          {isCommissionOpen && (
            <CommissionModal
              isOpen={isCommissionOpen}
              onClose={() => setIsCommissionOpen(false)}
              artists={artists}
              preselectedArtist={commissionArtist}
              preselectedTheme={commissionTheme}
            />
          )}
        </AnimatePresence>

        {/* Artist Guild Onboarding Application Modal */}
        <AnimatePresence>
          {isArtistApplicationOpen && (
            <ArtistApplicationModal
              isOpen={isArtistApplicationOpen}
              onClose={() => setIsArtistApplicationOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Login / Sign Up Modal */}
        <AnimatePresence>
          {isAuthOpen && (
            <AuthModal
              isOpen={isAuthOpen}
              onClose={() => setIsAuthOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Guest Order Tracking Modal */}
        <AnimatePresence>
          {isTrackOrderOpen && (
            <TrackOrderModal
              isOpen={isTrackOrderOpen}
              onClose={() => setIsTrackOrderOpen(false)}
            />
          )}
        </AnimatePresence>
      </React.Suspense>

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

      {/* Footer */}
      <Footer
        onNavigate={(sec) => {
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCommission={() => handleOpenCommission()}
        onOpenArtistApplication={() => setIsArtistApplicationOpen(true)}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
      />
    </div>
  );
}
