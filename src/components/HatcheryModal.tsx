import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Flame, Play, Sparkles, Timer, X } from 'lucide-react';
import {
  getChickenPack,
  getIncubatorStatus,
  INCUBATOR_TIERS,
} from '../game/economy';
import type {
  ChickenBreedId,
  IncubatorCurrency,
  IncubatorTierId,
  UserFarmProfile,
} from '../types/farm';
import {
  ChickenSprite,
  CoinIcon,
  EggIcon,
  IncubatorNestEggSprite,
} from './GameIcons';

export interface HatchedRevealInfo {
  breed: ChickenBreedId;
  xpGained: number;
  tierName: string;
}

interface HatcheryModalProps {
  profile: UserFarmProfile;
  loading?: boolean;
  hatchedReveal?: HatchedRevealInfo | null;
  onStartIncubation: (tierId: IncubatorTierId, currency: IncubatorCurrency) => void;
  onSpeedUpWithAd: () => void;
  onClaimHatched: () => void;
  onClearReveal: () => void;
  onClose: () => void;
}

function formatHatchCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatSavedDuration(ms: number): string {
  const totalMins = Math.max(1, Math.round(ms / 60_000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `-${h}h ${m}m`;
  if (h > 0) return `-${h}h`;
  return `-${m}m`;
}

export function HatcheryModal({
  profile,
  loading = false,
  hatchedReveal = null,
  onStartIncubation,
  onSpeedUpWithAd,
  onClaimHatched,
  onClearReveal,
  onClose,
}: HatcheryModalProps) {
  const [liveNowMs, setLiveNowMs] = useState(() => Date.now());
  const [currency, setCurrency] = useState<IncubatorCurrency>(() =>
    profile.eggs >= 12_000 ? 'eggs' : 'coins',
  );

  useEffect(() => {
    const id = window.setInterval(() => setLiveNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const status = getIncubatorStatus(profile, liveNowMs);

  return (
    <div
      className="animate-clay-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#2B1B2E]/50 dark:bg-[#0D0B18]/75 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hatchery-modal-title"
    >
      <div className="animate-anime-pop kawaii-modal w-full max-w-md p-5 space-y-4 my-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl clay-icon-well-amber flex items-center justify-center shrink-0">
              <IncubatorNestEggSprite
                tier={status.tier?.id ?? 'golden'}
                ready={status.status === 'ready'}
                className="w-8 h-8"
              />
            </div>
            <div className="min-w-0">
              <h3
                id="hatchery-modal-title"
                className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-tight"
              >
                Egg Incubator &amp; Hatchery
              </h3>
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                Hatch mystery hens from eggs or coins · Hatched: {status.hatchedCount}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close incubator hatchery modal"
            onClick={onClose}
            className="clay-btn clay-btn-neutral w-9 h-9 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-300 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hatchedReveal ? (
          (() => {
            const pack = getChickenPack(hatchedReveal.breed);
            return (
              <div className="kawaii-panel-peach p-5 text-center space-y-3.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>New Hen Hatched!</span>
                </div>
                <div className="w-24 h-24 rounded-3xl clay-icon-well mx-auto flex items-center justify-center">
                  <ChickenSprite breed={hatchedReveal.breed} className="w-20 h-20 animate-chicken-pop" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold text-stone-900 dark:text-stone-100">
                    {pack.name}
                  </h4>
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Hatched from {hatchedReveal.tierName} &amp; joined your meadow!
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-extrabold">
                  <span className="clay-card-mint !rounded-xl px-3 py-1.5 text-emerald-800 dark:text-emerald-300 font-mono-num">
                    +{pack.eggsPerHour} eggs/h
                  </span>
                  <span className="clay-inset !rounded-xl px-3 py-1.5 text-amber-800 dark:text-amber-300 font-mono-num">
                    +{hatchedReveal.xpGained} XP
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClearReveal}
                    className="clay-btn clay-btn-amber min-h-[44px] rounded-2xl text-xs font-extrabold"
                  >
                    Hatch Another
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearReveal();
                      onClose();
                    }}
                    className="clay-btn clay-btn-emerald min-h-[44px] rounded-2xl text-xs font-extrabold"
                  >
                    Back to Farm
                  </button>
                </div>
              </div>
            );
          })()
        ) : status.hasActive && status.tier ? (
          <div className="space-y-3.5">
            <div
              className={`!rounded-2xl p-4 text-center space-y-3 ${
                status.status === 'ready' ? 'clay-card-mint' : 'clay-card-warm'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                  <span>{status.tier.name}</span>
                </span>
                <span className="font-mono-num px-2 py-0.5 rounded-lg bg-black/10 dark:bg-white/10 text-stone-800 dark:text-stone-100">
                  {status.status === 'ready' ? 'Ready!' : `${status.progressPct}%`}
                </span>
              </div>

              <div className="flex justify-center py-1">
                <div
                  className={`w-24 h-24 rounded-3xl clay-icon-well flex items-center justify-center ${
                    status.status === 'ready' ? 'animate-chicken-pop ring-2 ring-emerald-400' : 'animate-egg-wiggle'
                  }`}
                >
                  <IncubatorNestEggSprite
                    tier={status.tier.id}
                    ready={status.status === 'ready'}
                    className="w-16 h-16"
                  />
                </div>
              </div>

              {status.status === 'ready' ? (
                <div className="space-y-1">
                  <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                    The egg is cracking open!
                  </div>
                  <p className="text-xs font-semibold text-emerald-800/85 dark:text-emerald-300/85">
                    Tap below to reveal which laying hen hatched for your farm.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-lg font-extrabold font-mono-num tabular-nums text-stone-900 dark:text-stone-100">
                    <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{formatHatchCountdown(status.remainingMs)}</span>
                  </div>
                  <div className="h-3 rounded-xl clay-inset p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-500 clay-shimmer-bar"
                      style={{ width: `${status.progressPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                    Ad Speed-Ups used: {status.speedupsUsed}/{status.maxSpeedups}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {status.tier.outcomes.map((out) => {
                  const pack = getChickenPack(out.breed);
                  return (
                    <div
                      key={out.breed}
                      className="clay-inset !rounded-xl px-2.5 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-200"
                    >
                      <ChickenSprite breed={out.breed} className="w-4 h-4" />
                      <span>{pack.name}</span>
                      <span className="font-mono-num text-amber-700 dark:text-amber-300">
                        {out.chancePct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {status.status === 'ready' ? (
              <button
                type="button"
                disabled={loading}
                onClick={onClaimHatched}
                className="clay-btn clay-btn-emerald w-full min-h-[48px] rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hatch Egg &amp; Claim Hen!</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || !status.canSpeedUpWithAd}
                onClick={onSpeedUpWithAd}
                className={`clay-btn w-full min-h-[48px] rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 ${
                  status.canSpeedUpWithAd
                    ? 'clay-btn-amber'
                    : 'clay-btn-neutral opacity-60 cursor-not-allowed text-stone-500 dark:text-stone-400'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {status.canSpeedUpWithAd
                    ? `Speed Up ${formatSavedDuration(status.nextAdSavedMs)} (Watch Ad · ${status.speedupsUsed}/${status.maxSpeedups})`
                    : `All ${status.maxSpeedups}/${status.maxSpeedups} Ad Speed-Ups Used`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="clay-inset !rounded-xl grid grid-cols-2 gap-1 p-1">
              <button
                type="button"
                onClick={() => setCurrency('eggs')}
                className={`clay-btn min-h-[38px] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                  currency === 'eggs' ? 'clay-btn-amber' : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                <EggIcon className="w-3.5 h-3.5" />
                <span>Eggs ({Math.floor(profile.eggs).toLocaleString()})</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('coins')}
                className={`clay-btn min-h-[38px] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                  currency === 'coins' ? 'clay-btn-amber' : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                <CoinIcon className="w-3.5 h-3.5" />
                <span>Coins ({Math.floor(profile.coins).toLocaleString()})</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-0.5">
              {INCUBATOR_TIERS.map((tier) => {
                const cost = currency === 'coins' ? tier.coinCost : tier.eggCost;
                const available = currency === 'coins' ? profile.coins : profile.eggs;
                const canAfford = !loading && available >= cost;
                return (
                  <div
                    key={tier.id}
                    className="clay-card !rounded-2xl p-3.5 flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl clay-icon-well flex items-center justify-center shrink-0">
                          <IncubatorNestEggSprite tier={tier.id} className="w-8 h-8" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                              {tier.name}
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300">
                              {tier.badge}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{tier.durationHours}h hatch · up to 2× Ad Speed-Up</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onStartIncubation(tier.id, currency)}
                        className={`clay-btn min-h-[40px] px-3 rounded-xl text-xs font-extrabold inline-flex items-center gap-1 shrink-0 ${
                          canAfford
                            ? 'clay-btn-emerald'
                            : 'clay-btn-neutral opacity-55 cursor-not-allowed text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {currency === 'coins' ? (
                          <CoinIcon className="w-3.5 h-3.5" />
                        ) : (
                          <EggIcon className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono-num">{cost.toLocaleString()}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {tier.outcomes.map((out) => {
                        const pack = getChickenPack(out.breed);
                        return (
                          <div
                            key={out.breed}
                            className="clay-inset !rounded-lg px-2 py-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-200"
                          >
                            <ChickenSprite breed={out.breed} className="w-4 h-4" />
                            <span>{pack.name}</span>
                            <span className="font-mono-num text-emerald-700 dark:text-emerald-300">
                              {out.chancePct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
