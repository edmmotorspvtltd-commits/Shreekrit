import React from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';

export const ParallaxMotifs: React.FC = () => {
  const { scrollYProgress, scrollY } = useScroll();

  // Smooth springs to give a natural organic liquid floating feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001
  });

  // Multi-depth 3D transformations for authentic dimensional perspective
  // Layer 1: Sacred Surya Mandala (Deep background Z: -80px, rotating gracefully)
  const suryaY = useTransform(smoothProgress, [0, 1], [-20, 220]);
  const suryaRotate = useTransform(smoothProgress, [0, 1], [0, 90]);
  const suryaTiltX = useTransform(smoothProgress, [0, 0.5, 1], [4, -2, 6]);

  // Layer 2: Auspicious Matsya / Sacred Twin Fishes (Midground Z: 20px, organic undulating swimming curve)
  const fishY = useTransform(smoothProgress, [0, 1], [60, -180]);
  const fishX = useTransform(smoothProgress, [0, 0.5, 1], [0, 25, -15]);
  const fishRotateZ = useTransform(smoothProgress, [0, 0.5, 1], [-10, 8, -5]);
  const fishRotateY = useTransform(smoothProgress, [0, 0.5, 1], [0, 18, -12]);

  // Layer 3: Kamla River Sacred Lotus (Foreground Z: 50px, gentle breathing elevation)
  const lotusY = useTransform(smoothProgress, [0, 1], [150, -320]);
  const lotusRotate = useTransform(smoothProgress, [0, 1], [12, -25]);
  const lotusScale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1.08, 0.92]);

  // Layer 4: Peacock Feather Eye (Mid-Deep Z: -30px, graceful drift)
  const peacockY = useTransform(smoothProgress, [0, 1], [40, 260]);
  const peacockRotate = useTransform(smoothProgress, [0, 1], [-18, 15]);
  const peacockTilt = useTransform(smoothProgress, [0, 1], [8, -8]);

  // Layer 5: Auspicious Kalash & Sacred Sprout (Lower section Z: 30px)
  const kalashY = useTransform(smoothProgress, [0, 1], [300, -120]);
  const kalashRotate = useTransform(smoothProgress, [0, 1], [-6, 12]);

  // Layer 6: Traditional Kachni Lattice Ribbon (Drifting along lower screen)
  const borderY = useTransform(smoothProgress, [0, 1], [100, -200]);
  const borderSkew = useTransform(smoothProgress, [0, 1], [-2, 3]);

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      aria-hidden="true"
    >
      {/* 3D Ambient Natural Light & Paper Grain Vibe */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#8C2711]/[0.015] to-transparent pointer-events-none" />

      {/* Motif 1: Sacred Surya (Sun) Mandala — Top right, rotating in 3D */}
      <motion.div
        className="hidden md:block absolute -right-8 sm:right-6 top-24 opacity-25 md:opacity-35"
        style={{
          y: suryaY,
          rotateZ: suryaRotate,
          rotateX: suryaTiltX,
          translateZ: '-60px',
          filter: 'drop-shadow(0 12px 24px rgba(229, 169, 60, 0.15))'
        }}
      >
        <svg width="220" height="220" viewBox="0 0 160 160" fill="none" stroke="#8C2711" strokeWidth="1.2" className="w-36 h-36 sm:w-52 sm:h-52">
          {/* Outer ray halo */}
          <circle cx="80" cy="80" r="70" strokeDasharray="3 3" stroke="#E5A93C" strokeWidth="1.5" />
          <circle cx="80" cy="80" r="58" stroke="#C94A29" />
          <circle cx="80" cy="80" r="46" stroke="#8C2711" strokeDasharray="4 2" />
          <circle cx="80" cy="80" r="28" fill="#FAF5EA" stroke="#241A14" strokeWidth="1.5" />
          
          {/* Concentric petal ring */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 80 + 46 * Math.cos(angle);
            const y1 = 80 + 46 * Math.sin(angle);
            const x2 = 80 + 58 * Math.cos(angle);
            const y2 = 80 + 58 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8C2711" strokeWidth="1.2" />;
          })}

          {/* Compass rays */}
          <path d="M80 6 L80 18 M80 142 L80 154 M6 80 L18 80 M142 80 L154 80" stroke="#8C2711" strokeWidth="2" />
          <path d="M28 28 L36 36 M124 124 L132 132 M28 132 L36 124 M124 36 L132 28" stroke="#C94A29" strokeWidth="1.5" />
          
          {/* Auspicious Center Dot */}
          <circle cx="80" cy="80" r="7" fill="#8C2711" />
        </svg>
      </motion.div>

      {/* Motif 2: Auspicious Matsya (Twin Peaked Fish) — Mid-left edge with fluid 3D swimming tilt */}
      <motion.div
        className="hidden md:block absolute -left-6 sm:left-4 top-1/3 opacity-25 md:opacity-35"
        style={{
          y: fishY,
          x: fishX,
          rotateZ: fishRotateZ,
          rotateY: fishRotateY,
          translateZ: '30px',
          filter: 'drop-shadow(0 14px 28px rgba(140, 39, 17, 0.12))'
        }}
      >
        <svg width="200" height="130" viewBox="0 0 160 100" fill="none" stroke="#8C2711" strokeWidth="1.3" className="w-36 sm:w-48">
          {/* Main Fish 1 */}
          <path d="M15 50 C 50 20, 100 20, 140 50 C 100 80, 50 80, 15 50 Z" fill="#FAF5EA" fillOpacity="0.4" />
          <path d="M15 50 L0 32 M15 50 L0 68 M15 50 L2 50" strokeWidth="1.5" />
          <circle cx="118" cy="44" r="3.5" fill="#8C2711" />
          {/* Kachni scales */}
          <path d="M50 38 Q 65 50 50 62" strokeWidth="1" />
          <path d="M70 34 Q 85 50 70 66" strokeWidth="1" />
          <path d="M90 36 Q 105 50 90 64" strokeWidth="1" />

          {/* Miniature companion fish swimming above */}
          <path d="M70 20 C 90 6, 120 6, 145 20 C 120 34, 90 34, 70 20 Z" stroke="#2A4B7C" strokeWidth="1" />
          <circle cx="132" cy="17" r="2" fill="#2A4B7C" />
          <path d="M70 20 L60 12 M70 20 L60 28" stroke="#2A4B7C" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Motif 3: Peacock Feather Eye (Mayura Pankh) — Right-center floating gently */}
      <motion.div
        className="hidden md:block absolute -right-6 sm:right-8 top-1/2 opacity-25 md:opacity-35"
        style={{
          y: peacockY,
          rotateZ: peacockRotate,
          rotateX: peacockTilt,
          translateZ: '-20px',
          filter: 'drop-shadow(0 16px 30px rgba(42, 75, 124, 0.12))'
        }}
      >
        <svg width="150" height="200" viewBox="0 0 100 140" fill="none" stroke="#2A4B7C" strokeWidth="1.2" className="w-28 sm:w-36">
          <ellipse cx="50" cy="55" rx="38" ry="48" stroke="#2A4B7C" />
          <ellipse cx="50" cy="55" rx="28" ry="36" stroke="#426B43" strokeDasharray="3 2" />
          <circle cx="50" cy="55" r="20" fill="#2A4B7C" fillOpacity="0.15" stroke="#2A4B7C" strokeWidth="1.5" />
          <circle cx="50" cy="55" r="11" fill="#E5A93C" fillOpacity="0.4" stroke="#8C2711" strokeWidth="1" />
          <circle cx="50" cy="55" r="5" fill="#8C2711" />
          
          {/* Feather shaft */}
          <path d="M50 103 C 50 118, 52 135, 54 140" stroke="#426B43" strokeWidth="2" strokeLinecap="round" />
          {/* Fine radiating barbs */}
          <path d="M20 40 L8 30 M80 40 L92 30 M15 65 L4 65 M85 65 L96 65 M22 85 L12 95 M78 85 L88 95" stroke="#2A4B7C" strokeWidth="0.9" />
        </svg>
      </motion.div>

      {/* Motif 4: Sacred Lotus of Kamla (Padma) — Lower left with natural opening breathing motion */}
      <motion.div
        className="hidden md:block absolute -left-8 sm:left-10 top-3/4 opacity-25 md:opacity-35"
        style={{
          y: lotusY,
          rotateZ: lotusRotate,
          scale: lotusScale,
          translateZ: '45px',
          filter: 'drop-shadow(0 14px 28px rgba(201, 74, 41, 0.12))'
        }}
      >
        <svg width="180" height="150" viewBox="0 0 140 120" fill="none" stroke="#C94A29" strokeWidth="1.3" className="w-32 sm:w-44">
          {/* Central Lotus Bulb & Petals */}
          <path d="M70 20 C55 45, 55 75, 70 95 C85 75, 85 45, 70 20 Z" fill="#FAF5EA" fillOpacity="0.5" stroke="#8C2711" strokeWidth="1.5" />
          
          {/* Flanking Petals */}
          <path d="M70 95 C45 80, 25 55, 38 35 C52 48, 62 70, 70 95 Z" stroke="#C94A29" />
          <path d="M70 95 C95 80, 115 55, 102 35 C88 48, 78 70, 70 95 Z" stroke="#C94A29" />
          
          {/* Outer Petals */}
          <path d="M70 95 C30 92, 10 70, 18 50 C32 62, 50 82, 70 95 Z" stroke="#E5A93C" strokeWidth="1.1" />
          <path d="M70 95 C110 92, 130 70, 122 50 C108 62, 90 82, 70 95 Z" stroke="#E5A93C" strokeWidth="1.1" />
          
          {/* Sacred Base ripples */}
          <ellipse cx="70" cy="102" rx="42" ry="7" stroke="#426B43" strokeWidth="1.2" strokeDasharray="4 2" />
        </svg>
      </motion.div>

      {/* Motif 5: Auspicious Kalash Vessel & Sprout — Floating in lower right corner */}
      <motion.div
        className="hidden md:block absolute -right-8 sm:right-12 bottom-32 opacity-20 md:opacity-30"
        style={{
          y: kalashY,
          rotateZ: kalashRotate,
          translateZ: '10px'
        }}
      >
        <svg width="150" height="170" viewBox="0 0 120 140" fill="none" stroke="#241A14" strokeWidth="1.2" className="w-28 sm:w-36">
          {/* Coconut & Mango Leaves on top */}
          <circle cx="60" cy="35" r="18" fill="#FAF5EA" stroke="#8C2711" strokeWidth="1.4" />
          <path d="M60 20 C50 6, 40 12, 46 28 M60 20 C70 6, 80 12, 74 28" stroke="#426B43" strokeWidth="1.5" />
          <circle cx="60" cy="35" r="4" fill="#8C2711" />
          
          {/* Urn Neck & Body */}
          <ellipse cx="60" cy="54" rx="20" ry="6" stroke="#8C2711" strokeWidth="1.5" />
          <path d="M42 56 C28 72, 26 95, 40 115 C48 126, 72 126, 80 115 C94 95, 92 72, 78 56 Z" fill="#FAF5EA" fillOpacity="0.4" stroke="#8C2711" strokeWidth="1.5" />
          
          {/* Sacred Swastika / Auspicious Yantra mark on Urn */}
          <line x1="50" y1="85" x2="70" y2="85" stroke="#C94A29" strokeWidth="1.5" />
          <line x1="60" y1="75" x2="60" y2="95" stroke="#C94A29" strokeWidth="1.5" />
          <line x1="70" y1="85" x2="70" y2="92" stroke="#C94A29" strokeWidth="1.5" />
          <line x1="50" y1="85" x2="50" y2="78" stroke="#C94A29" strokeWidth="1.5" />
          <line x1="60" y1="75" x2="67" y2="75" stroke="#C94A29" strokeWidth="1.5" />
          <line x1="60" y1="95" x2="53" y2="95" stroke="#C94A29" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* Motif 6: Traditional Kachni Lattice Geometric Border Band */}
      <motion.div
        className="absolute left-0 right-0 bottom-12 opacity-15 md:opacity-25"
        style={{
          y: borderY,
          skewX: borderSkew,
          translateZ: '-40px'
        }}
      >
        <svg width="100%" height="40" viewBox="0 0 1200 40" preserveAspectRatio="none" fill="none" stroke="#8C2711" strokeWidth="1">
          <line x1="0" y1="10" x2="1200" y2="10" strokeWidth="1.2" />
          <line x1="0" y1="14" x2="1200" y2="14" strokeWidth="0.8" />
          <line x1="0" y1="26" x2="1200" y2="26" strokeWidth="0.8" />
          <line x1="0" y1="30" x2="1200" y2="30" strokeWidth="1.2" />
          {/* Repeated triangular hatching across width */}
          {[...Array(60)].map((_, i) => (
            <path key={i} d={`M ${i * 20} 14 L ${i * 20 + 10} 26 L ${i * 20 + 20} 14`} stroke="#C94A29" strokeWidth="0.8" />
          ))}
        </svg>
      </motion.div>
    </div>
  );
};

