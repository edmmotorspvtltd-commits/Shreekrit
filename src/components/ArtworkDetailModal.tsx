import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ZoomIn, ZoomOut, Maximize2, ShieldCheck, Clock, 
  Sparkles, Check, ShoppingBag, ArrowRight, Share2, 
  HelpCircle, Info, Heart, Award, MapPin, Eye
} from 'lucide-react';
import { Painting, CurrencyCode, FrameOption } from '../types';
import { formatPrice } from '../utils/currency';
import { FRAME_OPTIONS } from '../data/paintings';
import { ARTISTS } from '../data/artists';
import { useLanguage } from '../context/LanguageContext';

interface ArtworkDetailModalProps {
  painting: Painting | null;
  allPaintings: Painting[];
  currency: CurrencyCode;
  onClose: () => void;
  onAddToCart: (painting: Painting, frame: FrameOption, framePriceINR: number) => void;
  onDirectBuy: (painting: Painting, frame: FrameOption, framePriceINR: number) => void;
  onSelectArtist: (artistId: string) => void;
  onSelectRelated: (painting: Painting) => void;
  onOpenCommission: (paintingTheme?: string) => void;
}

export const ArtworkDetailModal: React.FC<ArtworkDetailModalProps> = ({
  painting,
  allPaintings,
  currency,
  onClose,
  onAddToCart,
  onDirectBuy,
  onSelectArtist,
  onSelectRelated,
  onOpenCommission
}) => {
  if (!painting) return null;

  const { t, language } = useLanguage();
  const artist = ARTISTS.find(a => a.id === painting.artistId) || ARTISTS[0];

  // View modes: 'artwork' | 'macro' | 'in-room' | 'signature'
  const [activeViewMode, setActiveViewMode] = useState<'artwork' | 'macro' | 'in-room' | 'signature'>('artwork');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Format choice: Original vs Museum Print
  const [editionType, setEditionType] = useState<'original' | 'print'>('original');
  
  // Framing selection
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>('Raw Sheesham Wood Frame');

  // Interactive Zoom Lens State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Notification state for sold item
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Related paintings (same artist or same theme)
  const relatedPaintings = allPaintings
    .filter(p => p.id !== painting.id && (p.artistId === painting.artistId || p.theme === painting.theme))
    .slice(0, 3);

  const currentFrameObj = FRAME_OPTIONS.find(f => f.name === selectedFrame) || FRAME_OPTIONS[1];
  const basePrice = editionType === 'original' ? painting.priceINR : Math.round(painting.priceINR * 0.22);
  const framePrice = currentFrameObj.priceINR;
  const totalPriceINR = basePrice + framePrice;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-[#1A120B]/70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-6xl bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3 border-b border-[#E2D2BC] flex items-center justify-between bg-[#F4EADB]">
          <div className="flex items-center gap-2 text-xs text-[#735A47]">
            <span className="font-serif italic font-semibold text-[#8C2711]">Mithilā Heritage Archives</span>
            <span>•</span>
            <span className="font-mono text-[11px]">COA #{painting.certificateId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-[#E8DAC5] text-[#5C4230] transition-colors text-xs flex items-center gap-1 cursor-pointer"
              title="Share Painting"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="text-[10px] text-[#8C2711] font-semibold">Link Copied!</span>}
            </button>
            <button
              onClick={onClose}
              id="close-artwork-detail-btn"
              className="p-1.5 rounded-full hover:bg-[#E8DAC5] text-[#241A14] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto flex-grow p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT COLUMN: Gallery High-Res Zoomable Visualizer */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* View Switcher Tabs (Artwork | Macro Brushwork | In-Room Scale | Signature) */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-[#E0D0B8] pb-2">
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full">
                  <button
                    onClick={() => { setActiveViewMode('artwork'); setZoomLevel(1); }}
                    className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap ${
                      activeViewMode === 'artwork'
                        ? 'bg-[#8C2711] text-white font-medium shadow-sm'
                        : 'text-[#614936] hover:bg-[#EAE0CD]'
                    }`}
                  >
                    Full Canvas
                  </button>
                  <button
                    onClick={() => { setActiveViewMode('macro'); setZoomLevel(2.5); }}
                    className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      activeViewMode === 'macro'
                        ? 'bg-[#8C2711] text-white font-medium shadow-sm'
                        : 'text-[#614936] hover:bg-[#EAE0CD]'
                    }`}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    Macro Brushwork
                  </button>
                  <button
                    onClick={() => { setActiveViewMode('in-room'); setZoomLevel(1); }}
                    className={`px-2.5 sm:px-3 py-1 text-xs rounded transition-all cursor-pointer whitespace-nowrap ${
                      activeViewMode === 'in-room'
                        ? 'bg-[#8C2711] text-white font-medium shadow-sm'
                        : 'text-[#614936] hover:bg-[#EAE0CD]'
                    }`}
                  >
                    In-Room Scale
                  </button>
                </div>

                <div className="text-[11px] text-[#7A6452] hidden sm:flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-[#8C2711]" />
                  <span>Hover to zoom into pigment</span>
                </div>
              </div>

              {/* Main Image Stage */}
              <div 
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHoveringImage(true)}
                onMouseLeave={() => setIsHoveringImage(false)}
                className={`relative aspect-[4/3] w-full rounded-md bg-[#EADDC9] border border-[#D5C3A5] overflow-hidden cursor-crosshair shadow-inner flex items-center justify-center ${
                  selectedFrame === 'Raw Sheesham Wood Frame' ? 'p-6 sm:p-8 bg-[#4A2E1B]' :
                  selectedFrame === 'Matte Ebony Frame' ? 'p-6 sm:p-8 bg-[#1F1C1A]' :
                  selectedFrame === 'Minimalist Warm Brass' ? 'p-4 sm:p-6 bg-[#C2A264]' : 'p-2'
                }`}
              >
                {/* Standard Artwork or Macro View */}
                {activeViewMode !== 'in-room' ? (
                  <div className="relative w-full h-full overflow-hidden rounded bg-[#FAF5EA] flex items-center justify-center shadow-md">
                    <img
                      src={activeViewMode === 'macro' ? painting.detailImages[0] || painting.primaryImage : painting.primaryImage}
                      alt={painting.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain select-none transition-transform duration-100 ease-out"
                      style={{
                        transform: isHoveringImage 
                          ? `scale(${activeViewMode === 'macro' ? 3.5 : 2.2}) translate(-${(lensPos.x - 50) * 0.6}%, -${(lensPos.y - 50) * 0.6}%)`
                          : 'scale(1) translate(0, 0)'
                      }}
                    />

                    {/* Paper fiber grain overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply"
                      style={{
                        backgroundImage: 'radial-gradient(#4A3018 0.8px, transparent 0.8px)',
                        backgroundSize: '14px 14px'
                      }}
                    />

                    {/* Magnifying Loupe Guide Indicator */}
                    {isHoveringImage && (
                      <div 
                        className="absolute w-24 h-24 rounded-full border-2 border-[#8C2711] pointer-events-none shadow-lg -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${lensPos.x}%`,
                          top: `${lensPos.y}%`
                        }}
                      >
                        <div className="absolute top-1 right-1 px-1 bg-[#241A14] text-white text-[8px] rounded font-mono">
                          {activeViewMode === 'macro' ? '3.5×' : '2.2×'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* In-Room Wall Scale Simulation */
                  <div className="relative w-full h-full rounded overflow-hidden shadow-2xl flex items-center justify-center">
                    <img
                      src={painting.inRoomImage}
                      alt="Living room display preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                    {/* Simulated scaled artwork hanging on the wall */}
                    <div className="absolute top-1/4 w-44 sm:w-56 aspect-[4/3] rounded shadow-2xl border-4 border-[#3D2513] overflow-hidden bg-white">
                      <img 
                        src={painting.primaryImage} 
                        alt="Mounted in room" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#FAF5EA]/90 backdrop-blur-sm px-2 py-1 rounded text-[11px] text-[#4A3222] font-medium border border-[#D5C3A5]">
                      Realistic Living Room Scale (30" × 22")
                    </div>
                  </div>
                )}
              </div>

              {/* Angle Thumbnails */}
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                <button
                  onClick={() => { setActiveViewMode('artwork'); setSelectedImageIndex(0); }}
                  className={`w-16 h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer ${
                    activeViewMode === 'artwork' ? 'border-[#8C2711] ring-2 ring-[#8C2711]/20' : 'border-[#D5C3A5] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={painting.primaryImage} alt="Canvas" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
                {painting.detailImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveViewMode('macro'); setSelectedImageIndex(idx + 1); }}
                    className={`w-16 h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer relative ${
                      activeViewMode === 'macro' && selectedImageIndex === idx + 1 ? 'border-[#8C2711] ring-2 ring-[#8C2711]/20' : 'border-[#D5C3A5] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Detail ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center">Macro</span>
                  </button>
                ))}
                <button
                  onClick={() => setActiveViewMode('in-room')}
                  className={`w-16 h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-all cursor-pointer relative ${
                    activeViewMode === 'in-room' ? 'border-[#8C2711] ring-2 ring-[#8C2711]/20' : 'border-[#D5C3A5] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={painting.inRoomImage} alt="In Room" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center">Room</span>
                </button>
              </div>

              {/* Cultural Symbolism Decoder Box */}
              <div className="bg-[#F4EBDB] p-4 rounded-md border border-[#DFCDB3] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C2711]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C94A29]" />
                  <span>Iconography & Motif Symbolism</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {painting.motifs.map((motif, i) => (
                    <div key={i} className="bg-[#FAF5EA] p-2.5 rounded border border-[#E4D5BE] text-xs">
                      <span className="font-serif-display font-semibold text-[#241A14] block mb-0.5 text-sm">
                        {motif.name}
                      </span>
                      <p className="text-[#665141] leading-relaxed text-[11px]">
                        {motif.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Natural Pigments Botanical Recipes */}
              <div className="p-4 rounded-md border border-[#DFCDB3] bg-[#FAF5EA] space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69513F] block">
                  {t.detail.naturalPigments}:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#524032]">
                  {painting.pigmentsUsed.map((pigment, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8C2711]" />
                      <span>{pigment}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* RIGHT COLUMN: Artwork Specs, Pricing, Artist, Direct Buy & Framing */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Title & Cultural Header */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8C2711] uppercase tracking-wider mb-1">
                  <span>{(t.styles as Record<string, string>)[painting.style] || painting.style}</span>
                  <span>•</span>
                  <span>{(t.themes as Record<string, string>)[painting.theme] || painting.theme}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#241A14] leading-tight">
                  {(language === 'mai' || language === 'hi') && painting.maithiliTitle ? painting.maithiliTitle : painting.title}
                </h1>
                
                <div className="text-sm font-serif italic text-[#7A604D] mt-1">
                  {(language === 'mai' || language === 'hi') ? painting.title : `${painting.maithiliTitle} (Maithili)`}
                </div>
              </div>

              {/* Artist Card Banner */}
              <div 
                onClick={() => onSelectArtist(artist.id)}
                className="p-3 bg-[#F4EBDB] hover:bg-[#EDE1CE] rounded border border-[#DFCDB3] flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-[#C5B39A]"
                  />
                  <div>
                    <div className="text-xs text-[#876F5E]">Master Folk Artist</div>
                    <div className="font-serif-display font-bold text-sm text-[#241A14] hover:text-[#8C2711] transition-colors">
                      {language === 'mai' && artist.maithiliName ? `${artist.maithiliName} (${artist.name})` : artist.name}
                    </div>
                    <div className="text-[11px] text-[#695343] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#8C2711]" />
                      <span>{artist.village}, {artist.district}, Bihar</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#8C2711] font-semibold flex items-center gap-0.5">
                  {t.artists.viewProfile} <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              {/* Story behind the piece */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#69513F]">
                  {t.detail.culturalStory}
                </h3>
                <p className="text-xs sm:text-sm text-[#523F31] leading-relaxed">
                  {painting.story}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#7A6452] pt-1">
                  <Clock className="w-3.5 h-3.5 text-[#C94A29]" />
                  <span>Meticulously hand-drawn over <strong>{painting.completionHours} {t.gallery.hoursWorked}</strong>.</span>
                </div>
              </div>

              {/* Edition Choice: Original Masterwork vs Museum Archival Giclée */}
              <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#69513F]">
                  Acquisition Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditionType('original')}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                      editionType === 'original'
                        ? 'border-[#8C2711] bg-[#8C2711]/5 text-[#241A14] ring-1 ring-[#8C2711]'
                        : 'border-[#DFCDB3] bg-[#FAF5EA] text-[#614B3B] hover:border-[#8C2711]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#241A14]">{t.detail.original}</span>
                      {editionType === 'original' && <Check className="w-3.5 h-3.5 text-[#8C2711]" />}
                    </div>
                    <span className="text-[10px] text-[#826A57] block mt-0.5">One-of-a-kind original on handmade Lokta paper with artist signature</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditionType('print')}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                      editionType === 'print'
                        ? 'border-[#8C2711] bg-[#8C2711]/5 text-[#241A14] ring-1 ring-[#8C2711]'
                        : 'border-[#DFCDB3] bg-[#FAF5EA] text-[#614B3B] hover:border-[#8C2711]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#241A14]">Limited Giclée Print</span>
                      {editionType === 'print' && <Check className="w-3.5 h-3.5 text-[#8C2711]" />}
                    </div>
                    <span className="text-[10px] text-[#826A57] block mt-0.5">Edition of 50 on 310gsm German etching paper with stamped seal</span>
                  </button>
                </div>
              </div>

              {/* Handcrafted Framing Selector */}
              <div className="space-y-2 pt-2 border-t border-[#E8DEC8]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#69513F]">
                    {t.detail.framingOptions}:
                  </label>
                  <span className="text-xs text-[#8C2711] font-medium">
                    {framePrice > 0 ? `+${formatPrice(framePrice, currency)}` : 'Included'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {FRAME_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedFrame(opt.name as FrameOption)}
                      className={`flex items-start justify-between p-2.5 rounded border text-xs cursor-pointer transition-all ${
                        selectedFrame === opt.name
                          ? 'border-[#8C2711] bg-[#8C2711]/5 font-medium'
                          : 'border-[#DFCDB3] hover:border-[#8C2711]/30 bg-[#FAF5EA]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="frame-option"
                          checked={selectedFrame === opt.name}
                          onChange={() => setSelectedFrame(opt.name as FrameOption)}
                          className="accent-[#8C2711]"
                        />
                        <div>
                          <span className="text-[#241A14] block">{opt.name}</span>
                          <span className="text-[10px] text-[#7A6452]">{opt.description}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#523F31] font-semibold whitespace-nowrap pl-2">
                        {opt.priceINR === 0 ? 'Free' : formatPrice(opt.priceINR, currency)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Artwork Specifications Table */}
              <div className="bg-[#F4EBDB] p-3.5 rounded border border-[#DFCDB3] text-xs space-y-1.5">
                <div className="grid grid-cols-2 gap-2 pb-1 border-b border-[#E2D2BC]">
                  <span className="text-[#7A6452]">{t.detail.dimensions}:</span>
                  <span className="font-medium text-[#241A14]">{painting.dimensions.inches} ({painting.dimensions.cm})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-1 border-b border-[#E2D2BC]">
                  <span className="text-[#7A6452]">{t.detail.medium}:</span>
                  <span className="font-medium text-[#241A14]">{painting.medium}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pb-1 border-b border-[#E2D2BC]">
                  <span className="text-[#7A6452]">{t.detail.year}:</span>
                  <span className="font-medium text-[#241A14]">{painting.year}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-[#7A6452]">{t.detail.certificate}:</span>
                  <span className="font-medium text-[#426B43] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Included & Hand-Signed
                  </span>
                </div>
              </div>

              {/* Price Display & Direct Action Buttons */}
              <div className="p-4 rounded-md bg-[#F0E4D2] border border-[#D8C7AF] space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#735D4B] block">
                      Total Investment ({currency})
                    </span>
                    <span className="font-serif-display text-3xl font-bold text-[#241A14]">
                      {formatPrice(totalPriceINR, currency)}
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-[#735D4B]">
                    <span>Includes Insurance</span>
                    <br />
                    <span className="text-[#426B43] font-semibold">{t.detail.freeShipping}</span>
                  </div>
                </div>

                {painting.isAvailable ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      id="artwork-buy-now-btn"
                      onClick={() => onDirectBuy(painting, selectedFrame, framePrice)}
                      className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.detail.directBuy}</span>
                    </button>

                    <button
                      type="button"
                      id="artwork-add-cart-btn"
                      onClick={() => onAddToCart(painting, selectedFrame, framePrice)}
                      className="w-full py-3 border border-[#8C2711] text-[#8C2711] hover:bg-[#8C2711] hover:text-white rounded text-sm font-semibold tracking-wide bg-[#FAF5EA] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t.detail.addToCart}</span>
                    </button>
                  </div>
                ) : (
                  /* SOLD STATUS HANDLER WITH NOTIFY ME & SISTER COMMISSION */
                  <div className="space-y-3">
                    <div className="p-3 bg-[#7A2818]/10 border border-[#7A2818]/30 rounded text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8C2711] block mb-1">
                        Acquired by Private Collector
                      </span>
                      <p className="text-[11px] text-[#5C4535]">
                        This original has entered a private gallery in Kyoto. You can commission a similar custom sister artwork directly from {artist.name}.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onOpenCommission(painting.theme)}
                        className="flex-grow py-2.5 px-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        {t.detail.commissionSister}
                      </button>
                    </div>

                    {!notifySuccess ? (
                      <div className="pt-2">
                        <label className="text-[11px] text-[#695444] block mb-1 font-medium">
                          Notify me when similar pieces become available:
                        </label>
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (notifyEmail) setNotifySuccess(true);
                          }}
                          className="flex gap-1.5"
                        >
                          <input
                            type="email"
                            required
                            placeholder="Enter your email"
                            value={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.value)}
                            className="px-2.5 py-1.5 rounded border border-[#D5C3A5] bg-[#FAF5EA] text-xs flex-grow focus:outline-[#8C2711]"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-[#4A3525] text-white rounded text-xs font-medium cursor-pointer"
                          >
                            Notify
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="text-xs text-[#3E5C38] flex items-center gap-1 justify-center py-1">
                        <Check className="w-3.5 h-3.5" /> You'll be alerted on future releases from {artist.name}.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Certificate of Authenticity Stamp Detail */}
              <div className="p-3 rounded border border-dashed border-[#C5B39A] bg-[#FAF5EA] flex items-center gap-3">
                <Award className="w-8 h-8 text-[#C94A29] flex-shrink-0" />
                <div className="text-[11px] text-[#665141]">
                  <span className="font-semibold text-[#241A14] block">Government Registered Artisan Registry</span>
                  Includes physical parchment certificate bearing the artist's original thumb impression/signature, registered with the Madhubani Handicraft Guild.
                </div>
              </div>

            </div>

          </div>

          {/* "You May Also Like" Strip */}
          {relatedPaintings.length > 0 && (
            <div className="pt-8 border-t border-[#E0D0B8]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif-display text-xl font-bold text-[#241A14]">
                  You May Also Like
                </h3>
                <span className="text-xs text-[#7A6452]">Related by motif and master lineage</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedPaintings.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectRelated(rel)}
                    className="group bg-[#FAF5EA] rounded border border-[#E0D0B8] hover:border-[#8C2711] overflow-hidden p-2.5 transition-all cursor-pointer flex gap-3 items-center"
                  >
                    <img
                      src={rel.primaryImage}
                      alt={rel.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 object-cover rounded flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="overflow-hidden">
                      <h4 className="font-serif text-sm font-bold text-[#241A14] truncate group-hover:text-[#8C2711]">
                        {rel.title}
                      </h4>
                      <p className="text-[11px] text-[#7A604D] truncate">{rel.artistName}</p>
                      <p className="text-xs font-bold text-[#241A14] mt-0.5">
                        {formatPrice(rel.priceINR, currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
