import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { Play, RotateCcw, Sparkles, Eye, Palette, ArrowDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroHandDrawnProps {
  onExploreClick: () => void;
  onStoryClick: () => void;
}

export const HeroHandDrawn: React.FC<HeroHandDrawnProps> = ({ onExploreClick, onStoryClick }) => {
  const { t } = useLanguage();
  // stages: 'drawing' -> 'coloring' -> 'completed'
  const [stage, setStage] = useState<'drawing' | 'coloring' | 'completed'>('drawing');
  const [autoProgress, setAutoProgress] = useState(true);
  const [activePigment, setActivePigment] = useState<string | null>(null);

  // Natural 3D scroll physics for the framed artwork canvas
  const { scrollY } = useScroll();
  const rawRotateX = useTransform(scrollY, [0, 600], [0, 9]);
  const rawRotateY = useTransform(scrollY, [0, 600], [0, -5]);
  const rawScale = useTransform(scrollY, [0, 600], [1, 0.96]);

  const canvasRotateX = useSpring(rawRotateX, { stiffness: 90, damping: 25 });
  const canvasRotateY = useSpring(rawRotateY, { stiffness: 90, damping: 25 });
  const canvasScale = useSpring(rawScale, { stiffness: 90, damping: 25 });

  useEffect(() => {
    if (!autoProgress) return;
    const timer1 = setTimeout(() => {
      setStage('coloring');
    }, 2800);

    const timer2 = setTimeout(() => {
      setStage('completed');
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [autoProgress]);

  const handleReplay = () => {
    setAutoProgress(false);
    setStage('drawing');
    setTimeout(() => {
      setStage('coloring');
    }, 2500);
    setTimeout(() => {
      setStage('completed');
      setAutoProgress(true);
    }, 5000);
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-24 pb-16 overflow-hidden paper-bg">
      {/* Subtle background decorative double borders */}
      <div className="absolute inset-x-4 top-20 bottom-8 pointer-events-none border border-[#78350F]/15 rounded-sm">
        <div className="absolute inset-1 border border-dashed border-[#C94A29]/20" />
      </div>

      {/* Floating subtle cultural watermark motifs */}
      <div className="absolute -left-12 top-1/4 opacity-10 pointer-events-none select-none hidden md:block">
        <svg width="220" height="220" viewBox="0 0 100 100" fill="none" stroke="#8C2711" strokeWidth="1.5">
          <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="30" />
          <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" />
        </svg>
      </div>

      <div className="absolute -right-12 bottom-1/4 opacity-10 pointer-events-none select-none hidden md:block">
        <svg width="240" height="240" viewBox="0 0 100 100" fill="none" stroke="#2A4B7C" strokeWidth="1.5">
          <path d="M10 50 C 30 20, 70 20, 90 50 C 70 80, 30 80, 10 50 Z" />
          <circle cx="75" cy="45" r="3" fill="#2A4B7C" />
          <path d="M10 50 L-5 35 M10 50 L-5 65" />
          <path d="M35 38 Q 45 50 35 62 M48 35 Q 58 50 48 65 M61 38 Q 71 50 61 62" />
        </svg>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        {/* Left column: Storytelling Headline and Context */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 text-left space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAD8C0]/60 border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#C94A29]" />
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-display font-medium text-[#261A12] leading-[1.15] tracking-tight">
            {t.hero.titleMain} <br />
            <span className="italic font-normal text-[#8C2711]">{t.hero.titleHighlight}</span>
          </h1>

          <p className="text-[#5C4A3C] text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg font-normal">
            {t.hero.desc}
          </p>

          {/* Interactive stage indicator */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-[#7A6452] mb-2 font-medium">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${stage === 'drawing' ? 'bg-[#C94A29] animate-pulse' : 'bg-[#426B43]'}`} />
                {stage === 'drawing' && t.hero.drawingPhase}
                {stage === 'coloring' && t.hero.colorPhase}
                {stage === 'completed' && t.hero.finalPhase}
              </span>
              <button 
                onClick={handleReplay}
                className="inline-flex items-center gap-1 text-[#8C2711] hover:text-[#5C1A0B] underline text-xs cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Replay
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <button
                onClick={() => { setAutoProgress(false); setStage('drawing'); }}
                className={`py-1.5 px-1 sm:px-2 text-[11px] sm:text-xs rounded border transition-all text-center truncate ${
                  stage === 'drawing'
                    ? 'border-[#8C2711] bg-[#8C2711] text-white font-medium shadow-sm'
                    : 'border-[#D9C8B0] bg-[#FAF5EA] text-[#5C4A3C] hover:border-[#8C2711]/40'
                }`}
              >
                {t.hero.drawingPhase}
              </button>
              <button
                onClick={() => { setAutoProgress(false); setStage('coloring'); }}
                className={`py-1.5 px-1 sm:px-2 text-[11px] sm:text-xs rounded border transition-all text-center truncate ${
                  stage === 'coloring'
                    ? 'border-[#C94A29] bg-[#C94A29] text-white font-medium shadow-sm'
                    : 'border-[#D9C8B0] bg-[#FAF5EA] text-[#5C4A3C] hover:border-[#C94A29]/40'
                }`}
              >
                {t.hero.colorPhase}
              </button>
              <button
                onClick={() => { setAutoProgress(false); setStage('completed'); }}
                className={`py-1.5 px-1 sm:px-2 text-[11px] sm:text-xs rounded border transition-all text-center truncate ${
                  stage === 'completed'
                    ? 'border-[#2A4B7C] bg-[#2A4B7C] text-white font-medium shadow-sm'
                    : 'border-[#D9C8B0] bg-[#FAF5EA] text-[#5C4A3C] hover:border-[#2A4B7C]/40'
                }`}
              >
                {t.hero.finalPhase}
              </button>
            </div>
          </div>

          {/* Call to Actions (Fully responsive for mobile touch) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={onExploreClick}
              id="hero-explore-gallery-btn"
              className="w-full sm:w-auto px-6 py-3 bg-[#8C2711] hover:bg-[#6E1C0A] text-[#FAF5EA] rounded text-sm font-medium tracking-wide shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>{t.hero.exploreBtn}</span>
            </button>
            <button
              onClick={onStoryClick}
              id="hero-heritage-story-btn"
              className="w-full sm:w-auto px-6 py-3 border border-[#8C2711]/40 hover:border-[#8C2711] text-[#4A3222] hover:text-[#8C2711] rounded text-sm font-medium tracking-wide bg-[#FAF5EA]/80 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Palette className="w-4 h-4 text-[#C94A29]" />
              <span>{t.hero.storyBtn}</span>
            </button>
          </div>


          {/* Quick trust metrics (Responsive grid with clean dividers) */}
          <div className="pt-4 border-t border-[#E8DEC8] grid grid-cols-3 divide-x divide-[#D9CDB7] text-center text-xs text-[#6B5747]">
            <div className="px-1.5">
              <span className="block font-serif-display text-base sm:text-lg font-bold text-[#241A14]">100%</span>
              <span className="text-[10px] sm:text-xs">Direct to Artisans</span>
            </div>
            <div className="px-1.5">
              <span className="block font-serif-display text-base sm:text-lg font-bold text-[#241A14]">Original</span>
              <span className="text-[10px] sm:text-xs">Certified Folk Art</span>
            </div>
            <div className="px-1.5">
              <span className="block font-serif-display text-base sm:text-lg font-bold text-[#241A14]">Global</span>
              <span className="text-[10px] sm:text-xs">Insured Shipping</span>
            </div>
          </div>
        </motion.div>

        {/* Right column: The Dynamic Hand-Drawn Animated Mithila Artwork Canvas */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="lg:col-span-7 flex flex-col items-center w-full"
          style={{ perspective: '1200px' }}
        >
          {/* Outer Art Mount Frame with Authentic Sheesham, 3D Scroll Physics & Double Border */}
          <motion.div 
            style={{
              rotateX: canvasRotateX,
              rotateY: canvasRotateY,
              scale: canvasScale,
              transformStyle: 'preserve-3d'
            }}
            className="relative w-full max-w-xl p-3 sm:p-5 rounded-lg bg-[#F3EADA] shadow-2xl border border-[#D5C3A5] mithila-double-border overflow-hidden transition-shadow hover:shadow-3xl"
          >
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#8C2711] pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#8C2711] pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#8C2711] pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#8C2711] pointer-events-none" />

            {/* Canvas Header & Pigment Badge */}
            <div className="flex items-center justify-between px-2 py-1 mb-2 text-xs text-[#7A604D] border-b border-[#E2D2BC]">
              <span className="font-serif italic font-semibold text-[#8C2711]">
                Kalpavriksha (Sacred Cosmic Tree of Mithila)
              </span>
              <span className="bg-[#FAF5EA] px-2 py-0.5 rounded border border-[#D5C3A5] font-mono text-[10px]">
                {stage === 'drawing' ? 'Kachni Line Phase' : stage === 'coloring' ? 'Bharni Pigment Phase' : 'Museum Finished'}
              </span>
            </div>

            {/* The SVG Canvas that visually animates hand-drawn lines then color fills */}
            <div className="relative aspect-[4/3] w-full rounded bg-[#FAF5EA] overflow-hidden border border-[#D8C7AF] flex items-center justify-center">
              {/* Paper fiber grain overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                  backgroundImage: 'radial-gradient(#C4A882 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              <svg 
                viewBox="0 0 600 450" 
                className="w-full h-full p-2 select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Subtle shadows and filter */}
                  <filter id="handMadeTexture" x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>

                {/* 1. Double Border Line Art (Auspicious Ghera) */}
                <rect 
                  x="12" y="12" width="576" height="426" 
                  fill="none" 
                  stroke="#261A12" 
                  strokeWidth="2.5" 
                  className="transition-all duration-1000"
                />
                <rect 
                  x="20" y="20" width="560" height="410" 
                  fill="none" 
                  stroke="#8C2711" 
                  strokeWidth="1.5" 
                  strokeDasharray={stage === 'drawing' ? '6 3' : 'none'}
                />

                {/* 2. COLOR FILLS (Animated in during 'coloring' and 'completed' stages) */}
                <g 
                  className="transition-opacity duration-1000"
                  style={{ opacity: stage === 'drawing' ? 0.05 : 1 }}
                >
                  {/* Sun Disc */}
                  <circle cx="300" cy="90" r="38" fill="#E5A93C" opacity="0.85" />
                  <circle cx="300" cy="90" r="24" fill="#C94A29" opacity="0.9" />

                  {/* Kalpavriksha Foliage Leaves Wash */}
                  <path 
                    d="M 230 200 C 180 160, 140 220, 200 270 C 260 250, 280 220, 230 200 Z" 
                    fill="#3F6844" opacity="0.75" 
                  />
                  <path 
                    d="M 370 200 C 420 160, 460 220, 400 270 C 340 250, 320 220, 370 200 Z" 
                    fill="#3F6844" opacity="0.75" 
                  />
                  <path 
                    d="M 300 135 C 240 160, 260 210, 300 210 C 340 210, 360 160, 300 135 Z" 
                    fill="#4D7C52" opacity="0.8" 
                  />

                  {/* Sacred Peacocks Pigment Wash */}
                  {/* Left Peacock Body */}
                  <path 
                    d="M 170 310 C 140 290, 120 240, 150 200 C 165 180, 190 200, 185 240 C 180 270, 200 300, 170 310 Z" 
                    fill="#2A4B7C" opacity="0.85" 
                  />
                  {/* Left Peacock Train Feathers */}
                  <path 
                    d="M 120 350 C 90 310, 80 260, 140 230 C 130 270, 110 320, 120 350 Z" 
                    fill="#E5A93C" opacity="0.8" 
                  />

                  {/* Right Peacock Body */}
                  <path 
                    d="M 430 310 C 460 290, 480 240, 450 200 C 435 180, 410 200, 415 240 C 420 270, 400 300, 430 310 Z" 
                    fill="#2A4B7C" opacity="0.85" 
                  />
                  {/* Right Peacock Train Feathers */}
                  <path 
                    d="M 480 350 C 510 310, 520 260, 460 230 C 470 270, 490 320, 480 350 Z" 
                    fill="#E5A93C" opacity="0.8" 
                  />

                  {/* Cosmic Fish River Water Wash */}
                  <path 
                    d="M 80 405 C 160 380, 240 420, 320 395 C 400 420, 480 380, 520 405 L 520 420 L 80 420 Z" 
                    fill="#E3BE78" opacity="0.4" 
                  />
                  {/* Lotus petals wash */}
                  <circle cx="300" cy="390" r="22" fill="#C94A29" opacity="0.7" />
                </g>

                {/* 3. BAMBOO NIB LINE ART (Drawn with SVG stroke animation) */}
                <g 
                  stroke="#221711" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {/* Sun Rays & Face */}
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  >
                    <circle cx="300" cy="90" r="38" />
                    <circle cx="300" cy="90" r="28" strokeDasharray="3 2" />
                    {/* Sun rays around the halo */}
                    <path d="M 300 42 L 300 24 M 300 138 L 300 156" />
                    <path d="M 252 90 L 234 90 M 348 90 L 366 90" />
                    <path d="M 265 55 L 250 40 M 335 125 L 350 140" />
                    <path d="M 265 125 L 250 140 M 335 55 L 350 40" />
                    {/* Sun eyes and nose (classic Mithila profile eyes) */}
                    <circle cx="290" cy="84" r="2.5" fill="#221711" />
                    <circle cx="310" cy="84" r="2.5" fill="#221711" />
                    <path d="M 300 80 L 300 94 Q 304 96 306 94" />
                    <path d="M 292 102 Q 300 108 308 102" />
                  </motion.g>

                  {/* Kalpavriksha Sacred Tree Trunk and Spiral Branches */}
                  <motion.path
                    d="M 285 390 C 285 330, 270 290, 260 250 C 250 210, 220 180, 180 170"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.2, delay: 0.3 }}
                    strokeWidth="3.5"
                  />
                  <motion.path
                    d="M 315 390 C 315 330, 330 290, 340 250 C 350 210, 380 180, 420 170"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.2, delay: 0.3 }}
                    strokeWidth="3.5"
                  />
                  <motion.path
                    d="M 300 260 L 300 150 M 270 220 C 290 190, 310 190, 330 220"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8, delay: 0.5 }}
                    strokeWidth="2"
                  />

                  {/* Kachni Fine Hatching on the Trunk */}
                  <g stroke="#3A281C" strokeWidth="1" opacity={stage === 'drawing' ? 0.6 : 0.85}>
                    <line x1="288" y1="370" x2="312" y2="370" />
                    <line x1="287" y1="355" x2="313" y2="355" />
                    <line x1="285" y1="340" x2="315" y2="340" />
                    <line x1="283" y1="325" x2="317" y2="325" />
                    <line x1="280" y1="310" x2="320" y2="310" />
                    <line x1="275" y1="295" x2="325" y2="295" />
                    <line x1="270" y1="280" x2="330" y2="280" />
                  </g>

                  {/* Left Peacock with Crown, Beak, and Feathers */}
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, delay: 0.7 }}
                  >
                    {/* Body outline */}
                    <path d="M 170 310 C 140 290, 120 240, 150 200 C 165 180, 190 200, 185 240 C 180 270, 200 300, 170 310 Z" />
                    {/* Head and beak */}
                    <circle cx="160" cy="180" r="14" />
                    <path d="M 148 180 L 132 184 L 148 188" />
                    <circle cx="156" cy="178" r="2.5" fill="#221711" />
                    {/* Kalgi / Crest feathers */}
                    <path d="M 160 166 L 155 148 M 165 167 L 168 146 M 170 170 L 180 152" strokeWidth="1.5" />
                    <circle cx="155" cy="147" r="2.5" fill="#C94A29" />
                    <circle cx="168" cy="145" r="2.5" fill="#C94A29" />
                    <circle cx="180" cy="151" r="2.5" fill="#C94A29" />
                    {/* Tail plumage swirls */}
                    <path d="M 130 330 C 80 300, 60 240, 110 200 C 100 240, 95 290, 130 330" />
                    <circle cx="95" cy="235" r="5" stroke="#C94A29" strokeWidth="1.5" />
                    <circle cx="85" cy="275" r="5" stroke="#C94A29" strokeWidth="1.5" />
                  </motion.g>

                  {/* Right Peacock (Symmetric Mithila Balance) */}
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, delay: 0.7 }}
                  >
                    <path d="M 430 310 C 460 290, 480 240, 450 200 C 435 180, 410 200, 415 240 C 420 270, 400 300, 430 310 Z" />
                    <circle cx="440" cy="180" r="14" />
                    <path d="M 452 180 L 468 184 L 452 188" />
                    <circle cx="444" cy="178" r="2.5" fill="#221711" />
                    {/* Kalgi crest */}
                    <path d="M 440 166 L 445 148 M 435 167 L 432 146 M 430 170 L 420 152" strokeWidth="1.5" />
                    <circle cx="445" cy="147" r="2.5" fill="#C94A29" />
                    <circle cx="432" cy="145" r="2.5" fill="#C94A29" />
                    <circle cx="420" cy="151" r="2.5" fill="#C94A29" />
                    <path d="M 470 330 C 520 300, 540 240, 490 200 C 500 240, 505 290, 470 330" />
                    <circle cx="505" cy="235" r="5" stroke="#C94A29" strokeWidth="1.5" />
                    <circle cx="515" cy="275" r="5" stroke="#C94A29" strokeWidth="1.5" />
                  </motion.g>

                  {/* Auspicious Twin Fish at the Root Pond (Matsya) */}
                  <motion.g
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.2, delay: 1 }}
                  >
                    {/* Left Fish */}
                    <path d="M 180 395 C 210 380, 245 385, 270 405 C 245 425, 210 425, 180 395 Z" strokeWidth="2" />
                    <path d="M 180 395 L 160 380 M 180 395 L 160 410 L 170 395" strokeWidth="1.5" />
                    <circle cx="255" cy="402" r="2" fill="#221711" />
                    <path d="M 210 390 Q 220 405 210 420 M 230 390 Q 240 405 230 420" strokeWidth="1" />

                    {/* Right Fish */}
                    <path d="M 420 395 C 390 380, 355 385, 330 405 C 355 425, 390 425, 420 395 Z" strokeWidth="2" />
                    <path d="M 420 395 L 440 380 M 420 395 L 440 410 L 430 395" strokeWidth="1.5" />
                    <circle cx="345" cy="402" r="2" fill="#221711" />
                    <path d="M 390 390 Q 380 405 390 420 M 370 390 Q 360 405 370 420" strokeWidth="1" />

                    {/* Central Lotus */}
                    <circle cx="300" cy="390" r="12" strokeWidth="2" />
                    <path d="M 288 390 C 285 375, 300 365, 300 378 C 300 365, 315 375, 312 390" strokeWidth="1.5" />
                  </motion.g>

                  {/* Corner Auspicious Floral Border Patterns */}
                  <g strokeWidth="1.5">
                    {/* Top Left */}
                    <path d="M 30 30 C 50 30, 50 50, 30 50" />
                    <path d="M 30 30 C 30 50, 50 50, 50 30" />
                    {/* Top Right */}
                    <path d="M 570 30 C 550 30, 550 50, 570 50" />
                    {/* Bottom Left */}
                    <path d="M 30 420 C 50 420, 50 400, 30 400" />
                    {/* Bottom Right */}
                    <path d="M 570 420 C 550 420, 550 400, 570 400" />
                  </g>
                </g>
              </svg>

              {/* Master signature seal watermark */}
              <div className="absolute bottom-4 right-5 font-serif-display text-[11px] text-[#8C2711]/60 tracking-wider flex items-center gap-1">
                <span>अम्बिका देवी / Ambika Devi</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C2711]/50" />
                <span>Jitwarpur, Bihar</span>
              </div>
            </div>

            {/* Natural Pigment Palette Tray underneath artwork */}
            <div className="mt-3 pt-3 border-t border-[#E2D2BC] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#69513F] font-medium flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#C94A29]" />
                Traditional Natural Pigments:
              </span>
              <div className="flex items-center gap-2">
                <span 
                  title="Lamp Black (Kajal from Mustard Oil Lamps)"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#261A12] text-white text-[10px] font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Lamp Black
                </span>
                <span 
                  title="Turmeric (Haldi) simmered with gum arabic"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E5A93C] text-[#241A14] text-[10px] font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C2711]" />
                  Raw Turmeric
                </span>
                <span 
                  title="Vermillion (Sindoor) with Peepal Resin"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#C94A29] text-white text-[10px] font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Vermillion
                </span>
                <span 
                  title="Natural Indigo (Neel) from Bettiah"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2A4B7C] text-white text-[10px] font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]" />
                  Natural Indigo
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="mt-10 flex flex-col items-center gap-1 text-[#8C2711]/70 text-xs tracking-wider uppercase font-semibold"
      >
        <span>Scroll to Explore the Heritage</span>
        <ArrowDown className="w-4 h-4" />
      </motion.div>
    </section>
  );
};
