import { useEffect, useRef, useState } from 'react';
import { Globe, Plus, ShieldCheck, Trophy, Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { UserFarmProfile } from '../types/farm';
import { CoinIcon, EggIcon, PlayerAvatar } from './GameIcons';
import { PWAInstallButton } from './PWAControls';

interface TopBarProps {
  profile: UserFarmProfile;
  coinsLabel: string;
  eggsLabel: string;
  isAllMuted: boolean;
  muteAllLabel: string;
  unmuteAllLabel: string;
  isAdmin?: boolean;
  isLeaderboardActive?: boolean;
  ranksLabel?: string;
  onOpenProfile: () => void;
  onOpenAdmin?: () => void;
  onToggleLeaderboard?: () => void;
  onToggleMuteAll: () => void;
  onOpenSettings: () => void;
  onOpenDeposit: () => void;
}

function useAnimatedDisplayValue(
  target: number,
  uid: string,
  prefersReducedMotion: boolean,
): number {
  const [displayValue, setDisplayValue] = useState(target);
  const currentValRef = useRef(target);
  const uidRef = useRef(uid);

  useEffect(() => {
    if (uidRef.current !== uid || prefersReducedMotion) {
      uidRef.current = uid;
      currentValRef.current = target;
      setDisplayValue(target);
      return;
    }

    const from = currentValRef.current;
    if (from === target) return;

    const startTime = performance.now();
    const duration = Math.min(620, Math.max(260, Math.abs(target - from) > 100 ? 520 : 340));
    let rafId = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (target - from) * eased);
      currentValRef.current = next;
      setDisplayValue(next);
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        currentValRef.current = target;
        setDisplayValue(target);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, uid, prefersReducedMotion]);

  return displayValue;
}

export function TopBar({
  profile,
  coinsLabel,
  eggsLabel,
  isAllMuted,
  muteAllLabel,
  unmuteAllLabel,
  isAdmin = false,
  isLeaderboardActive = false,
  ranksLabel = 'Ranks',
  onOpenProfile,
  onOpenAdmin,
  onToggleLeaderboard,
  onToggleMuteAll,
  onOpenSettings,
  onOpenDeposit,
}: TopBarProps) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const animatedCoins = useAnimatedDisplayValue(profile.coins, profile.uid, prefersReducedMotion);
  const animatedEggs = useAnimatedDisplayValue(profile.eggs, profile.uid, prefersReducedMotion);

  const [coinArrivalPulse, setCoinArrivalPulse] = useState(0);
  const [floatingCoinDeltas, setFloatingCoinDeltas] = useState<Array<{ id: number; amount: number }>>([]);
  const [coinLiftSeq, setCoinLiftSeq] = useState(0);

  const [eggArrivalPulse, setEggArrivalPulse] = useState(0);
  const [floatingEggDeltas, setFloatingEggDeltas] = useState<Array<{ id: number; amount: number }>>([]);
  const [eggLiftSeq, setEggLiftSeq] = useState(0);

  const prevUidRef = useRef<string>(profile.uid);
  const prevCoinsRef = useRef<number>(profile.coins);
  const prevEggsRef = useRef<number>(profile.eggs);
  const floatSeqRef = useRef(0);
  const coinDeltaTimersRef = useRef<Set<number>>(new Set());
  const eggDeltaTimersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const coinTimers = coinDeltaTimersRef.current;
    const eggTimers = eggDeltaTimersRef.current;
    return () => {
      coinTimers.forEach((id) => window.clearTimeout(id));
      coinTimers.clear();
      eggTimers.forEach((id) => window.clearTimeout(id));
      eggTimers.clear();
    };
  }, []);

  useEffect(() => {
    if (prevUidRef.current !== profile.uid) {
      prevUidRef.current = profile.uid;
      prevCoinsRef.current = profile.coins;
      prevEggsRef.current = profile.eggs;
      coinDeltaTimersRef.current.forEach((id) => window.clearTimeout(id));
      coinDeltaTimersRef.current.clear();
      eggDeltaTimersRef.current.forEach((id) => window.clearTimeout(id));
      eggDeltaTimersRef.current.clear();
      setFloatingCoinDeltas([]);
      setFloatingEggDeltas([]);
      return;
    }

    const coinDelta = profile.coins - prevCoinsRef.current;
    prevCoinsRef.current = profile.coins;

    if (coinDelta > 0) {
      const nextId = ++floatSeqRef.current;
      setCoinLiftSeq((n) => n + 1);
      setFloatingCoinDeltas((prev) => [...prev.slice(-2), { id: nextId, amount: coinDelta }]);
      const cleanupId = window.setTimeout(() => {
        coinDeltaTimersRef.current.delete(cleanupId);
        setFloatingCoinDeltas((prev) => prev.filter((item) => item.id !== nextId));
      }, 1150);
      coinDeltaTimersRef.current.add(cleanupId);
    }

    const eggDelta = profile.eggs - prevEggsRef.current;
    prevEggsRef.current = profile.eggs;

    if (eggDelta > 0) {
      const nextId = ++floatSeqRef.current;
      setEggLiftSeq((n) => n + 1);
      setFloatingEggDeltas((prev) => [...prev.slice(-2), { id: nextId, amount: eggDelta }]);
      const cleanupId = window.setTimeout(() => {
        eggDeltaTimersRef.current.delete(cleanupId);
        setFloatingEggDeltas((prev) => prev.filter((item) => item.id !== nextId));
      }, 1250);
      eggDeltaTimersRef.current.add(cleanupId);
    }
  }, [profile.coins, profile.eggs, profile.uid]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCoinArrival = () => {
      setCoinArrivalPulse((n) => n + 1);
    };
    const handleEggArrival = () => {
      setEggArrivalPulse((n) => n + 1);
    };
    window.addEventListener('alphagram:coin-arrival', handleCoinArrival);
    window.addEventListener('alphagram:egg-arrival', handleEggArrival);
    return () => {
      window.removeEventListener('alphagram:coin-arrival', handleCoinArrival);
      window.removeEventListener('alphagram:egg-arrival', handleEggArrival);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 clay-header px-3 sm:px-5 py-2 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Row 1: Alpha Gram Brand + Profile Trigger + Utility Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="hidden sm:flex items-center gap-2 pr-2.5 border-r border-stone-300/60 dark:border-stone-700/60 shrink-0">
              <motion.div
                whileHover={{ rotate: [0, -8, 6, 0], scale: 1.08 }}
                transition={{ duration: 0.35 }}
                className="alpha-brand-crest clay-cta-sheen w-9 h-9 rounded-xl text-sm font-extrabold flex items-center justify-center tracking-tight select-none cursor-default"
              >
                αG
              </motion.div>
              <span className="font-display text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
                Alpha Gram
              </span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onOpenProfile}
              aria-label={`Open profile for ${profile.displayName}`}
              className="clay-btn flex items-center gap-2 min-w-0 min-h-[44px] pr-2.5 pl-1 py-1 rounded-2xl hover:bg-white/60 dark:hover:bg-stone-800/60 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <PlayerAvatar
                  photoUrl={profile.photoUrl}
                  displayName={profile.displayName}
                  avatarColor={profile.avatarColor}
                  className="w-9 h-9 text-sm"
                />
                <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full clay-btn-amber text-[9px] font-extrabold flex items-center justify-center">
                  {profile.level}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate leading-tight">
                  {profile.displayName}
                </div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 truncate">
                  <span className="sm:hidden font-bold text-amber-700 dark:text-amber-400">Alpha Gram · </span>
                  {profile.handle}
                </div>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton compact />

            {isAdmin && onOpenAdmin && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={onOpenAdmin}
                aria-label="Open Admin Panel"
                className="clay-btn clay-btn-emerald h-10 px-2.5 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-extrabold whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Admin Panel</span>
              </motion.button>
            )}

            {onToggleLeaderboard && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={onToggleLeaderboard}
                aria-pressed={isLeaderboardActive}
                aria-label={isLeaderboardActive ? 'Back to Farm' : 'Open Leaderboard'}
                title={ranksLabel}
                className={`clay-btn h-10 px-2.5 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-extrabold whitespace-nowrap ${
                  isLeaderboardActive
                    ? 'clay-btn-amber text-amber-950'
                    : 'clay-btn-neutral text-amber-600 dark:text-amber-400'
                }`}
              >
                <Trophy className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{ranksLabel}</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onToggleMuteAll}
              aria-pressed={isAllMuted}
              aria-label={
                isAllMuted
                  ? 'Unmute all music and sound effects'
                  : 'Mute all music and sound effects'
              }
              className={`clay-btn h-10 px-2.5 sm:px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-extrabold whitespace-nowrap ${
                isAllMuted
                  ? 'bg-gradient-to-b from-rose-200 to-rose-300 dark:from-rose-900 dark:to-rose-950 border-2 border-[#881337] dark:border-rose-500 text-[#881337] dark:text-rose-100 shadow-[0_3px_0_#9F1239] dark:shadow-[0_3px_0_#090B14]'
                  : 'clay-btn-neutral text-stone-700 dark:text-stone-200'
              }`}
            >
              {isAllMuted ? (
                <VolumeX className="w-4 h-4 shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="hidden xs:inline sm:inline">{isAllMuted ? unmuteAllLabel : muteAllLabel}</span>
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onOpenSettings}
              aria-label="Open language and sound settings"
              className="clay-btn clay-btn-neutral w-10 h-10 rounded-2xl flex items-center justify-center text-stone-700 dark:text-stone-200"
            >
              <Globe className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Row 2: Coins & Eggs Clay Resource Wells */}
        <div className="grid grid-cols-2 gap-2.5">
          <motion.div
            key={`coin-card-${coinArrivalPulse}`}
            animate={
              coinArrivalPulse > 0 && !prefersReducedMotion
                ? { scale: [1, 1.05, 0.985, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
            className="clay-card relative !rounded-2xl flex items-center justify-between gap-2 px-3 py-1.5"
          >
            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                key={`coin-icon-${profile.coins}-${coinArrivalPulse}`}
                data-coin-balance-target="true"
                initial={prefersReducedMotion ? false : { scale: 1.24, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 440, damping: 18 }}
                className="relative w-8 h-8 rounded-xl clay-icon-well flex items-center justify-center shrink-0"
              >
                {coinArrivalPulse > 0 && !prefersReducedMotion && (
                  <motion.span
                    key={`coin-halo-${coinArrivalPulse}`}
                    aria-hidden="true"
                    initial={{ opacity: 0.85, scale: 0.85 }}
                    animate={{ opacity: 0, scale: 1.75 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                  />
                )}
                <CoinIcon className="w-5 h-5" />
              </motion.div>
              <div className="relative min-w-0">
                <AnimatePresence>
                  {!prefersReducedMotion &&
                    floatingCoinDeltas.map((delta) => (
                      <motion.span
                        key={delta.id}
                        aria-hidden="true"
                        initial={{ opacity: 0, y: 6, scale: 0.85 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          y: [6, -6, -15, -23],
                          scale: [0.85, 1.05, 1, 0.95],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1.05,
                          times: [0, 0.18, 0.72, 1],
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="pointer-events-none absolute -top-2 left-0 z-20 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/90 dark:bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold font-mono-num text-white shadow-md whitespace-nowrap"
                      >
                        +{delta.amount.toLocaleString()}
                      </motion.span>
                    ))}
                </AnimatePresence>
                <motion.div
                  key={`coins-${profile.coins}-${coinLiftSeq}`}
                  initial={
                    prefersReducedMotion
                      ? false
                      : coinLiftSeq > 0
                        ? { y: 4, scale: 1.12 }
                        : { scale: 1.06 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { scale: 1 }
                      : coinLiftSeq > 0
                        ? { y: [4, -3, 0], scale: [1.12, 1.06, 1] }
                        : { y: 0, scale: 1 }
                  }
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-sm sm:text-base font-extrabold font-mono-num leading-none truncate origin-left ${
                    profile.coins < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : coinLiftSeq > 0
                        ? 'text-emerald-700 dark:text-emerald-300 transition-colors duration-300'
                        : 'text-stone-900 dark:text-stone-100 transition-colors duration-300'
                  }`}
                >
                  {animatedCoins.toLocaleString()}
                </motion.div>
                <div className="text-[10px] font-bold tracking-wide text-stone-500 dark:text-stone-400 mt-0.5">
                  {profile.coins < 0 ? `${coinsLabel} (Debt)` : coinsLabel}
                </div>
              </div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onOpenDeposit}
              aria-label="Top up coins"
              className="clay-btn clay-btn-emerald clay-cta-sheen w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.75]" />
            </motion.button>
          </motion.div>

          <motion.div
            key={`egg-card-${eggArrivalPulse}`}
            animate={
              eggArrivalPulse > 0 && !prefersReducedMotion
                ? { scale: [1, 1.06, 0.985, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="clay-card relative !rounded-2xl flex items-center gap-2 px-3 py-1.5"
          >
            <motion.div
              key={`egg-icon-${profile.eggs}-${eggArrivalPulse}`}
              data-egg-balance-target="true"
              initial={prefersReducedMotion ? false : { scale: 1.26, rotate: 12 }}
              animate={{ scale: [1.26, 0.94, 1.04, 1], rotate: [12, -6, 0] }}
              transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-8 h-8 rounded-xl clay-icon-well flex items-center justify-center shrink-0"
            >
              {eggArrivalPulse > 0 && !prefersReducedMotion && (
                <motion.span
                  key={`egg-halo-${eggArrivalPulse}`}
                  aria-hidden="true"
                  initial={{ opacity: 0.9, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.9 }}
                  transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-xl border-2 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.75)]"
                />
              )}
              <EggIcon className="w-5 h-5" />
            </motion.div>
            <div className="relative min-w-0">
              <AnimatePresence>
                {!prefersReducedMotion &&
                  floatingEggDeltas.map((delta) => (
                    <motion.span
                      key={delta.id}
                      aria-hidden="true"
                      initial={{ opacity: 0, y: 6, scale: 0.85 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [6, -7, -17, -25],
                        scale: [0.85, 1.08, 1, 0.94],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 1.15,
                        times: [0, 0.18, 0.72, 1],
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="pointer-events-none absolute -top-2 left-0 z-20 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-extrabold font-mono-num text-white shadow-md whitespace-nowrap"
                    >
                      +{delta.amount.toLocaleString()}
                    </motion.span>
                  ))}
              </AnimatePresence>
              <motion.div
                key={`eggs-${profile.eggs}-${eggLiftSeq}`}
                initial={
                  prefersReducedMotion
                    ? false
                    : eggLiftSeq > 0
                      ? { y: 4, scale: 1.14 }
                      : { scale: 1.06 }
                }
                animate={
                  prefersReducedMotion
                    ? { scale: 1 }
                    : eggLiftSeq > 0
                      ? { y: [4, -3, 0], scale: [1.14, 1.06, 1] }
                      : { y: 0, scale: 1 }
                }
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`text-sm sm:text-base font-extrabold font-mono-num leading-none truncate origin-left ${
                  eggLiftSeq > 0
                    ? 'text-amber-700 dark:text-amber-300 transition-colors duration-300'
                    : 'text-stone-900 dark:text-stone-100 transition-colors duration-300'
                }`}
              >
                {animatedEggs.toLocaleString()}
              </motion.div>
              <div className="text-[10px] font-bold tracking-wide text-stone-500 dark:text-stone-400 mt-0.5">
                {eggsLabel}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
