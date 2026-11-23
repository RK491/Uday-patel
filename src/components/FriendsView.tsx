import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, Clock, Copy, Gift, Share2, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildInvitedFriendsList,
  buildReferralGrowthSeries,
  type DailyReferralGrowthPoint,
  REFERRAL_DEPOSIT_COMMISSION_RATE,
  REFERRER_SIGNUP_BONUS_COINS,
  summarizeReferrals,
} from '../game/economy';
import type { ReferralRecord, TransactionEntry, UserFarmProfile } from '../types/farm';
import {
  buildPersonalReferralUrl,
  buildReferralShareData,
  copyTextWithFallback,
  getReferralStartId,
  openTelegramForwardShare,
} from '../utils/referralShare';
import { detectBrowserTelegramBotConfig } from '../utils/telegram';
import clayHenMascot from '../assets/images/clay_hen_mascot_1794678825872.jpg';
import clayEggBasket from '../assets/images/clay_egg_basket_1794678826026.jpg';
import { ChickenSprite, CoinIcon } from './GameIcons';

function ReferralGrowthTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DailyReferralGrowthPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="clay-card-dark !rounded-2xl text-white px-3 py-2 text-xs space-y-0.5">
      <div className="font-extrabold text-amber-300">
        {point.label}, {point.fullDate}
      </div>
      <div className="font-mono-num font-bold">
        {point.newReferrals} {point.newReferrals === 1 ? 'new referral' : 'new referrals'}
      </div>
      {point.newReferrals > 0 && (
        <div className="text-[10px] text-stone-300 font-mono-num">
          {point.activeReferrals} active · {point.pendingReferrals} pending
        </div>
      )}
    </div>
  );
}

interface FriendsViewProps {
  profile: UserFarmProfile;
  referrals: ReferralRecord[];
  transactions?: TransactionEntry[];
  perReferRewardCoins?: number;
  botUsername?: string;
  appShortName?: string;
}

export function FriendsView({
  profile,
  referrals,
  transactions = [],
  perReferRewardCoins = REFERRER_SIGNUP_BONUS_COINS,
  botUsername,
  appShortName,
}: FriendsViewProps) {
  const effectiveReferReward = Math.max(0, Math.floor(Number(perReferRewardCoins) ?? REFERRER_SIGNUP_BONUS_COINS));
  const [feedback, setFeedback] = useState<'shared' | 'copied-link' | 'copied-pitch' | 'error' | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [basketImgFailed, setBasketImgFailed] = useState(false);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showFeedback = (next: 'shared' | 'copied-link' | 'copied-pitch' | 'error') => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(next);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 2000);
  };

  const botConfig = useMemo(
    () =>
      detectBrowserTelegramBotConfig({
        serverBotUsername: botUsername,
        serverAppShortName: appShortName,
      }),
    [appShortName, botUsername],
  );

  const referralStartId = useMemo(
    () => getReferralStartId(profile.uid, profile.referralCode),
    [profile.referralCode, profile.uid],
  );

  const referralUrl = useMemo(
    () =>
      buildPersonalReferralUrl(referralStartId, {
        botUsername: botConfig.botUsername,
        appShortName: botConfig.appShortName,
      }),
    [botConfig.appShortName, botConfig.botUsername, referralStartId],
  );

  const handleCopy = async (text: string, kind: 'copied-link' | 'copied-pitch' = 'copied-link') => {
    const ok = await copyTextWithFallback(text);
    showFeedback(ok ? kind : 'error');
  };

  const handleCopyInvitePitch = async () => {
    const shareData = buildReferralShareData(referralStartId, referralUrl, profile.displayName);
    const fullPitch = `${shareData.text || ''}\n\n${referralUrl}`;
    await handleCopy(fullPitch, 'copied-pitch');
  };

  const handleShare = () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const opened = openTelegramForwardShare(referralUrl, profile.displayName);
      showFeedback(opened ? 'shared' : 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const { activeCount, pendingCount, totalToppedUp } = summarizeReferrals(referrals);
  const effectiveActiveCount = Math.max(profile.referralCount, activeCount);
  const invitedFriends = useMemo(
    () => buildInvitedFriendsList(referrals, transactions),
    [referrals, transactions],
  );
  const referralGrowthSeries = useMemo(
    () => buildReferralGrowthSeries(referrals),
    [referrals],
  );
  const weeklyReferralsTotal = useMemo(
    () => referralGrowthSeries.reduce((sum, day) => sum + day.newReferrals, 0),
    [referralGrowthSeries],
  );
  const depositPercentLabel = `${Math.round(REFERRAL_DEPOSIT_COMMISSION_RATE * 100)}%`;

  const shareButtonLabel = isSharing
    ? 'Opening Telegram...'
    : feedback === 'shared'
      ? 'Ready to Forward in Telegram!'
      : feedback === 'copied-link'
        ? 'Referral Link Copied!'
        : feedback === 'copied-pitch'
          ? 'Invite Message Copied!'
          : 'Share Referral Link';

  return (
    <div className="animate-clay-enter space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">Invite Friends</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Earn +{effectiveReferReward.toLocaleString()} coins per verified refer &amp; {depositPercentLabel} lifetime deposit share
          </p>
        </div>
      </div>

      {/* Clay Mascot & Reward Trio Hero */}
      <div className="relative flex items-center justify-center gap-4 py-1">
        <motion.div
          whileHover={{ scale: 1.08, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 360, damping: 20 }}
          className="w-16 h-16 rounded-2xl clay-icon-well p-1 flex items-center justify-center overflow-hidden"
        >
          {!basketImgFailed ? (
            <img
              src={clayEggBasket}
              alt="Clay egg basket reward"
              referrerPolicy="no-referrer"
              onError={() => setBasketImgFailed(true)}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <Gift className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          )}
        </motion.div>
        <div className="relative">
          <span
            aria-hidden="true"
            className="animate-collect-halo pointer-events-none absolute -inset-2 rounded-3xl bg-amber-300/35 blur-md"
          />
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: 'spring', stiffness: 340, damping: 18 }}
            className="animate-clay-float relative w-24 h-24 rounded-3xl clay-card-warm p-1.5 flex items-center justify-center overflow-hidden"
          >
            {!heroImgFailed ? (
              <img
                src={clayHenMascot}
                alt="Clay Alpha Gram mascot"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover rounded-[1.25rem]"
              />
            ) : (
              <ChickenSprite breed="leghorn" className="w-18 h-18" />
            )}
          </motion.div>
        </div>
        <motion.div
          whileHover={{ scale: 1.08, rotate: 6 }}
          transition={{ type: 'spring', stiffness: 360, damping: 20 }}
          className="w-16 h-16 rounded-2xl clay-icon-well flex items-center justify-center text-rose-500 dark:text-rose-400"
        >
          <Gift className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Share Referral Link */}
      <div className="clay-card p-4 space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Referral rewards</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            You earn +{effectiveReferReward.toLocaleString()} coins when your friend buys their 1st hen (verified refer), plus {depositPercentLabel} coins on every deposit for life.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="clay-card-mint clay-hover-lift !rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono-num">
              <CoinIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>+{effectiveReferReward.toLocaleString()}</span>
            </div>
            <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 mt-0.5 leading-tight">
              Verified refer (1st hen)
            </div>
          </div>
          <div className="clay-card-warm clay-hover-lift !rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-lg sm:text-xl font-extrabold text-amber-700 dark:text-amber-400 font-mono-num">
              <CoinIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{depositPercentLabel}</span>
            </div>
            <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 mt-0.5 leading-tight">
              Lifetime deposit share
            </div>
          </div>
        </div>

        <div className="clay-inset !rounded-2xl px-3.5 py-2.5 text-[11px] font-semibold text-stone-600 dark:text-stone-300 text-center">
          Instant Telegram Bot &amp; in-app alerts notify you when your friend unlocks +{effectiveReferReward.toLocaleString()} coins (verified refer) or makes any deposit ({depositPercentLabel} lifetime share).
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">Your Referral Link</span>
            <button
              type="button"
              onClick={() => void handleCopyInvitePitch()}
              className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              {feedback === 'copied-pitch' ? 'Invite Message Copied!' : 'Copy Invite Message'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              aria-label="Your referral link"
              className="clay-inset flex-1 min-h-[44px] px-3 text-xs font-mono-num text-stone-700 dark:text-stone-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void handleCopy(referralUrl, 'copied-link')}
              aria-label="Copy referral link"
              className="clay-btn clay-btn-emerald min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center shrink-0"
            >
              {feedback === 'copied-link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={isSharing}
            onClick={handleShare}
            className="clay-btn clay-btn-amber clay-cta-sheen w-full min-h-[48px] rounded-2xl disabled:opacity-60 font-extrabold text-sm flex items-center justify-center gap-2"
          >
            {feedback === 'shared' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span>{shareButtonLabel}</span>
          </motion.button>
          {feedback === 'error' && (
            <p className="text-center text-xs font-semibold text-rose-600 dark:text-rose-400">
              Unable to open Telegram share sheet — copy your referral link above.
            </p>
          )}
        </div>
      </div>

      {/* Referral Growth (Last 7 Days) */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl clay-icon-well flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                Referral Growth
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                New referrals per day · Last 7 days
              </p>
            </div>
          </div>
          <span className="clay-card-mint !rounded-full text-xs font-extrabold font-mono-num px-3 py-1 text-emerald-800 dark:text-emerald-300 shrink-0">
            +{weeklyReferralsTotal} this week
          </span>
        </div>

        <div className="clay-inset p-2.5 h-44 w-full min-w-0" aria-label="Referral Growth chart over the last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={referralGrowthSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="referralGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" strokeOpacity={0.22} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#78716C', fontWeight: 600 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
                domain={[0, (dataMax: number) => Math.max(3, dataMax + 1)]}
                tick={{ fontSize: 11, fill: '#78716C', fontWeight: 600 }}
              />
              <Tooltip content={<ReferralGrowthTooltip />} />
              <Area
                type="monotone"
                dataKey="newReferrals"
                name="New Referrals"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#referralGrowthFill)"
                dot={{ r: 3.5, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 5.5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {weeklyReferralsTotal === 0 && (
          <p className="text-[11px] text-center text-stone-400 dark:text-stone-500">
            Share your referral link above to track daily friend sign-ups here.
          </p>
        )}
      </div>

      {/* Invited Friends Transparency List */}
      <div className="clay-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">Invited Friends</h2>
            <span className="text-xs font-extrabold font-mono-num text-stone-400 dark:text-stone-500">
              ({invitedFriends.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {pendingCount > 0 && (
              <span className="text-[11px] font-extrabold font-mono-num px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {pendingCount} Pending
              </span>
            )}
            <span className="text-xs font-extrabold font-mono-num px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {effectiveActiveCount} Verified
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="clay-card-mint !rounded-2xl p-2.5">
            <div className="flex items-center gap-1 text-base font-extrabold text-stone-900 dark:text-stone-100 font-mono-num">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{effectiveActiveCount.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Verified refers</div>
          </div>
          <div className="clay-inset p-2.5">
            <div className="flex items-center gap-1 text-base font-extrabold text-stone-900 dark:text-stone-100 font-mono-num">
              <CoinIcon className="w-4 h-4 shrink-0" />
              <span>+{profile.referralCoinsEarned.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Coins earned</div>
          </div>
          <div className="clay-inset p-2.5">
            <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 font-mono-num">
              ${totalToppedUp.toFixed(2)}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Deposited</div>
          </div>
        </div>

        {invitedFriends.length === 0 ? (
          <div className="clay-inset p-5 text-center text-xs text-stone-500 dark:text-stone-400">
            No invited friends yet. Share your invite link to earn{' '}
            <span className="font-bold text-emerald-700 dark:text-emerald-400">+{effectiveReferReward.toLocaleString()} coins</span> when they buy their 1st hen and a{' '}
            <span className="font-bold text-amber-700 dark:text-amber-400">{depositPercentLabel} lifetime deposit commission</span> from every friend!
          </div>
        ) : (
          <ul aria-label="Invited Friends" className="divide-y divide-stone-100 dark:divide-stone-800">
            {invitedFriends.map((friend) => {
              const joinedDate =
                friend.createdAtMs > 0
                  ? new Date(friend.createdAtMs).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown date';
              const isPending = friend.status === 'pending';

              return (
                <li key={friend.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm ${
                        isPending ? 'bg-amber-500' : 'bg-sky-500'
                      }`}
                    >
                      {(friend.referredName || friend.formattedHandle).replace(/^@/, '').charAt(0).toUpperCase() || 'F'}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          {friend.referredName || friend.formattedHandle}
                        </span>
                        {isPending ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 flex-wrap">
                        <span className="font-mono-num font-semibold text-stone-700 dark:text-stone-300 truncate">
                          {friend.formattedHandle}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
                          <span>Joined {joinedDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-0.5">
                    {isPending ? (
                      <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono-num">
                        Needs 1st hen
                      </div>
                    ) : (
                      <>
                        <div className="inline-flex items-center justify-end gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono-num">
                          <CoinIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>+{friend.coinsEarned.toLocaleString()} coins</span>
                        </div>
                        {friend.toppedUpUsd > 0 && (
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono-num">
                            ${friend.toppedUpUsd.toFixed(2)} deposited
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
