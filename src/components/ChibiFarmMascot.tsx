import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';

export type ChibiMascotReaction = 'idle' | 'collect' | 'buy';

interface ChibiFarmMascotProps {
  reaction: ChibiMascotReaction;
  reactionSeq: number;
  reactionLabel?: string | null;
  isPaused?: boolean;
  onTap?: () => void;
}

export function ChibiFarmMascot({
  reaction,
  reactionSeq,
  reactionLabel,
  isPaused = false,
  onTap,
}: ChibiFarmMascotProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isBlinking, setIsBlinking] = useState(false);

  // Subtle idle eye blink every ~3.8s when idle and visible
  useEffect(() => {
    if (prefersReducedMotion || isPaused || reaction !== 'idle') return;
    let closeTimer: number | null = null;
    const interval = window.setInterval(() => {
      setIsBlinking(true);
      closeTimer = window.setTimeout(() => setIsBlinking(false), 150);
    }, 3800);
    return () => {
      window.clearInterval(interval);
      if (closeTimer) window.clearTimeout(closeTimer);
    };
  }, [prefersReducedMotion, isPaused, reaction]);

  const isCollect = reaction === 'collect';
  const isBuy = reaction === 'buy';
  const isReacting = isCollect || isBuy;

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-auto">
      {/* Expressive Kawaii Reaction Speech Bubble */}
      <AnimatePresence mode="wait">
        {isReacting && reactionLabel && (
          <motion.div
            key={`mascot-bubble-${reactionSeq}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.72 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 z-30 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold whitespace-nowrap shadow-lg border-2 inline-flex items-center gap-1 ${
              isBuy
                ? 'bg-gradient-to-r from-pink-100 via-rose-50 to-amber-100 border-pink-400 text-rose-900'
                : 'bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-100 border-amber-400 text-amber-950'
            }`}
          >
            {isBuy ? (
              <Heart className="w-3 h-3 text-pink-500 fill-pink-500 shrink-0" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
            )}
            <span>{reactionLabel}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Reaction Sparkles / Hearts */}
      <AnimatePresence>
        {isReacting && !prefersReducedMotion && (
          <motion.div
            key={`mascot-aura-${reactionSeq}`}
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.35, 1.6] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={`pointer-events-none absolute inset-0 rounded-full blur-md ${
              isBuy ? 'bg-pink-300/65' : 'bg-amber-300/65'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Interactive Chibi Mascot Character */}
      <motion.button
        key={`mascot-body-${isReacting ? reactionSeq : 'idle'}`}
        type="button"
        data-testid="chibi-farm-mascot"
        data-mascot-reaction={reaction}
        onClick={onTap}
        aria-label="Koko-chan farm mascot"
        whileHover={prefersReducedMotion ? undefined : { scale: 1.1, y: -3 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
        animate={
          prefersReducedMotion || isPaused
            ? { y: 0, rotate: 0, scale: 1 }
            : isCollect
              ? {
                  y: [0, -22, 4, -12, 0],
                  rotate: [0, -10, 10, -4, 0],
                  scale: [1, 1.15, 0.94, 1.07, 1],
                }
              : isBuy
                ? {
                    y: [0, -16, 2, -9, 0],
                    rotate: [0, 9, -9, 5, 0],
                    scale: [1, 1.2, 0.91, 1.1, 1],
                  }
                : {
                    y: [0, -6, 0],
                    rotate: [-1.4, 1.4, -1.4],
                    scale: 1,
                  }
        }
        transition={
          isReacting
            ? { duration: 0.85, ease: [0.22, 1, 0.36, 1] }
            : { duration: 3.1, repeat: Infinity, ease: 'easeInOut' }
        }
        className="group relative w-[68px] h-[76px] sm:w-[76px] sm:h-[84px] flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 rounded-full"
      >
        {/* Ground Soft Glow Shadow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-11 h-2.5 rounded-full bg-stone-950/35 blur-[3px] transition-transform duration-200 group-hover:scale-110"
        />

        {/* Soft Pastel Halo Behind Mascot */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-1 rounded-full transition-opacity duration-200 ${
            isBuy
              ? 'bg-pink-300/35 opacity-100'
              : isCollect
                ? 'bg-amber-300/35 opacity-100'
                : 'bg-pink-200/20 opacity-0 group-hover:opacity-100'
          }`}
        />

        {/* Cel-Shaded Chibi Anime Girl + Straw-Hat Chick SVG */}
        <svg
          viewBox="0 0 120 132"
          className="relative w-full h-full drop-shadow-[0_6px_10px_rgba(24,18,16,0.4)]"
          aria-hidden="true"
        >
          {/* Back Hair Flow */}
          <path
            d="M31 54 C24 68 25 84 35 91 C44 96 76 96 85 91 C95 84 96 68 89 54 Z"
            fill="#F472B6"
            stroke="#3B261D"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Cozy Pastel Mint Apron Dress & Body */}
          <path
            d="M39 84 C36 96 36 112 43 116 L77 116 C84 112 84 96 81 84 Z"
            fill="#A7F3D0"
            stroke="#3B261D"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* White Frilled Collar */}
          <path
            d="M44 85 Q60 95 76 85 L72 92 Q60 99 48 92 Z"
            fill="#FFFDF9"
            stroke="#3B261D"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Tiny Apron Pocket + Egg Motif */}
          <path
            d="M50 98 L70 98 L68 110 Q60 113 52 110 Z"
            fill="#FFFDF9"
            stroke="#3B261D"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <ellipse cx="60" cy="104" rx="4.2" ry="5" fill="#FDE047" stroke="#3B261D" strokeWidth="1.8" />

          {/* Expressive Chibi Arms */}
          {isReacting ? (
            <>
              <path
                d="M40 88 C28 80 24 70 29 66 C33 63 39 71 44 82"
                fill="#FFE4D6"
                stroke="#3B261D"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M80 88 C92 80 96 70 91 66 C87 63 81 71 76 82"
                fill="#FFE4D6"
                stroke="#3B261D"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <path
                d="M40 88 C32 95 31 103 36 105 C40 106 43 99 44 93"
                fill="#FFE4D6"
                stroke="#3B261D"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M80 88 C89 83 93 75 89 72 C85 69 81 76 77 84"
                fill="#FFE4D6"
                stroke="#3B261D"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </>
          )}

          {/* Cute Boots */}
          <ellipse cx="50" cy="119" rx="7.5" ry="4.8" fill="#F59E0B" stroke="#3B261D" strokeWidth="2.8" />
          <ellipse cx="70" cy="119" rx="7.5" ry="4.8" fill="#F59E0B" stroke="#3B261D" strokeWidth="2.8" />

          {/* Chibi Head */}
          <ellipse cx="60" cy="60" rx="28" ry="25" fill="#FFE7DC" stroke="#3B261D" strokeWidth="3.2" />

          {/* Rosy Kawaii Cheeks */}
          <ellipse cx="42" cy="66" rx="5.5" ry="3.2" fill="#FDA4AF" opacity="0.85" />
          <ellipse cx="78" cy="66" rx="5.5" ry="3.2" fill="#FDA4AF" opacity="0.85" />

          {/* Anime Eyes */}
          {isBuy ? (
            <>
              {/* Starry excited eyes on buying chickens */}
              <path
                d="M46 53 L48.2 58.2 L53.6 58.6 L49.4 62.1 L50.8 67.4 L46 64.4 L41.2 67.4 L42.6 62.1 L38.4 58.6 L43.8 58.2 Z"
                fill="#F59E0B"
                stroke="#3B261D"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M74 53 L76.2 58.2 L81.6 58.6 L77.4 62.1 L78.8 67.4 L74 64.4 L69.2 67.4 L70.6 62.1 L66.4 58.6 L71.8 58.2 Z"
                fill="#F59E0B"
                stroke="#3B261D"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </>
          ) : isCollect || isBlinking ? (
            <>
              {/* Happy curved ^ ^ eyes */}
              <path
                d="M40 60 Q46 53 52 60"
                fill="none"
                stroke="#3B261D"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M68 60 Q74 53 80 60"
                fill="none"
                stroke="#3B261D"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              {/* Glossy sparkling anime eyes */}
              <ellipse cx="46.5" cy="59.5" rx="5.6" ry="6.8" fill="#2D1E18" />
              <ellipse cx="73.5" cy="59.5" rx="5.6" ry="6.8" fill="#2D1E18" />
              <ellipse cx="46.5" cy="61.8" rx="3.4" ry="2.2" fill="#EC4899" opacity="0.55" />
              <ellipse cx="73.5" cy="61.8" rx="3.4" ry="2.2" fill="#EC4899" opacity="0.55" />
              <circle cx="44.5" cy="56.8" r="2.2" fill="#FFFFFF" />
              <circle cx="71.5" cy="56.8" r="2.2" fill="#FFFFFF" />
              <circle cx="48.5" cy="62.2" r="1.1" fill="#FFFFFF" />
              <circle cx="75.5" cy="62.2" r="1.1" fill="#FFFFFF" />
            </>
          )}

          {/* Expressive Mouth */}
          {isReacting ? (
            <path
              d="M54 69 Q60 77 66 69 Z"
              fill="#FB7185"
              stroke="#3B261D"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M55 69 Q57.5 72 60 69.5 Q62.5 72 65 69"
              fill="none"
              stroke="#3B261D"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {/* Front Sakura-Pink Anime Bangs & Side Locks */}
          <path
            d="M31 54 C31 38 44 31 60 31 C76 31 89 38 89 54 C84 46 77 44 71 50 C66 43 60 44 55 51 C49 44 41 46 31 54 Z"
            fill="#F9A8D4"
            stroke="#3B261D"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Sunny Farmer Straw Hat */}
          <ellipse cx="60" cy="34" rx="36" ry="9" fill="#FDE68A" stroke="#3B261D" strokeWidth="3" />
          <path
            d="M36 33 C38 17 48 13 60 13 C72 13 82 17 84 33 Z"
            fill="#FCD34D"
            stroke="#3B261D"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Pastel Mint Hat Ribbon */}
          <path
            d="M37 29 Q60 33 83 29 L84 33 Q60 37 36 33 Z"
            fill="#6EE7B7"
            stroke="#3B261D"
            strokeWidth="2.2"
          />

          {/* Tiny Baby Chick Perched on Straw Hat */}
          <circle cx="72" cy="13" r="8.5" fill="#FFFBEB" stroke="#3B261D" strokeWidth="2.5" />
          <circle cx="74.5" cy="11.5" r="1.4" fill="#3B261D" />
          <path d="M79 12.5 L83.5 14 L79 15.5 Z" fill="#F97316" stroke="#3B261D" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M68 6 C69 2 72 3 72 6" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.button>
    </div>
  );
}
