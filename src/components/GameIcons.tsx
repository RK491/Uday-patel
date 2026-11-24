import { useId, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Crown,
  Egg,
  Flame,
  Package,
  Send,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import type {
  AchievementIconKey,
  AchievementTier,
  ChickenBreedId,
  IncubatorTierId,
  MeadowCritterKind,
  ShowcaseBadge,
} from '../types/farm';

export function PlayerAvatar({
  photoUrl,
  displayName,
  avatarColor,
  className = 'w-10 h-10 text-base',
}: {
  photoUrl?: string;
  displayName: string;
  avatarColor: string;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (displayName || 'F').charAt(0).toUpperCase();
  const showImage = Boolean(photoUrl && !imgFailed);

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center text-white font-extrabold shrink-0 border-2 border-[#3B261D] dark:border-amber-200/70 shadow-[0_3px_0_rgba(59,38,29,0.28),inset_0_2px_3px_rgba(255,255,255,0.45)] ${className}`}
      style={{ backgroundColor: avatarColor }}
    >
      {showImage ? (
        <img
          src={photoUrl}
          alt={displayName}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export function CoinIcon({ className = 'w-6 h-6' }: { className?: string }) {
  const uid = useId();
  const outerGradId = `animeCoinOuter-${uid}`;
  const innerGradId = `animeCoinInner-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className={`drop-shadow-[0_2px_0_rgba(59,38,29,0.3)] ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={outerGradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={innerGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill={`url(#${outerGradId})`} stroke="#3B261D" strokeWidth="2.1" />
      <circle cx="16" cy="16" r="10.1" fill={`url(#${innerGradId})`} stroke="#B45309" strokeWidth="1.5" />
      <ellipse cx="12.2" cy="10.2" rx="3.4" ry="1.4" transform="rotate(-24 12.2 10.2)" fill="#FFFFFF" opacity="0.72" />
      <path d="M16 9.6v12.8M13.2 12.6c0-1.3 1.2-2.1 2.8-2.1s2.8.8 2.8 1.9c0 1.2-1.1 1.7-2.8 2.1-1.7.4-2.8 1-2.8 2.2 0 1.3 1.2 2.1 2.8 2.1s2.8-.8 2.8-2.1" fill="none" stroke="#5C2D0C" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23.5" cy="9.5" r="1.1" fill="#FFFFFF" opacity="0.9" />
    </svg>
  );
}

export function EggIcon({ className = 'w-6 h-6' }: { className?: string }) {
  const uid = useId();
  const eggGradId = `animeEggGrad-${uid}`;
  return (
    <svg viewBox="0 0 32 32" className={`drop-shadow-[0_2px_0_rgba(59,38,29,0.28)] ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={eggGradId} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="56%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.8C10.4 2.8 6.4 11.4 6.4 18.5C6.4 24.9 10.5 29.2 16 29.2C21.5 29.2 25.6 24.9 25.6 18.5C25.6 11.4 21.6 2.8 16 2.8Z"
        fill={`url(#${eggGradId})`}
        stroke="#3B261D"
        strokeWidth="2.1"
      />
      {/* Cel-shaded warm belly crescent */}
      <path
        d="M9.6 22.8C11.7 26.2 16 27.6 20.6 25.5C22.4 24.6 23.6 22.8 24 20.8C22.5 23.2 18.8 24.5 14.5 24C12.3 23.8 10.7 23.2 9.6 22.8Z"
        fill="#F59E0B"
        opacity="0.34"
      />
      <ellipse cx="12.2" cy="11.4" rx="2.3" ry="4.1" transform="rotate(-16 12.2 11.4)" fill="#FFFFFF" opacity="0.95" />
      <circle cx="15.2" cy="8.1" r="0.95" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

/**
 * Hand-crafted cel-shaded Anime Chibi Hen sprites with ink lineart, glossy kawaii eyes,
 * rosy blush cheeks, and crisp two-tone plumage so every breed pops against the anime meadow.
 */
export function ChickenSprite({
  breed,
  className = 'w-12 h-12',
  facingLeft = false,
}: {
  breed: ChickenBreedId;
  className?: string;
  facingLeft?: boolean;
}) {
  const palette: Record<
    ChickenBreedId,
    {
      body: string;
      shade: string;
      wing: string;
      belly: string;
      beak: string;
      comb: string;
      blush: string;
      outline: string;
      eye: string;
      ribbon?: string;
    }
  > = {
    leghorn: {
      body: '#FFFDF8',
      shade: '#E8EDF5',
      wing: '#F1F5F9',
      belly: '#FFFFFF',
      beak: '#FB923C',
      comb: '#FB7185',
      blush: '#FDA4AF',
      outline: '#2D1E18',
      eye: '#2D1E18',
      ribbon: '#F43F5E',
    },
    rhode: {
      body: '#EA580C',
      shade: '#9A3412',
      wing: '#C2410C',
      belly: '#FED7AA',
      beak: '#FBBF24',
      comb: '#E11D48',
      blush: '#FDBA74',
      outline: '#2D1E18',
      eye: '#1C1410',
      ribbon: '#10B981',
    },
    orpington: {
      body: '#FCD34D',
      shade: '#D97706',
      wing: '#F59E0B',
      belly: '#FEF9C3',
      beak: '#F97316',
      comb: '#F43F5E',
      blush: '#FB7185',
      outline: '#3B2314',
      eye: '#2D1E18',
      ribbon: '#EC4899',
    },
    australorp: {
      body: '#334155',
      shade: '#1E293B',
      wing: '#475569',
      belly: '#94A3B8',
      beak: '#FBBF24',
      comb: '#F43F5E',
      blush: '#F472B6',
      outline: '#0F172A',
      eye: '#0F172A',
      ribbon: '#FBBF24',
    },
  };

  const c = palette[breed];

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}
      aria-label={`${breed} anime hen`}
      role="img"
    >
      {/* Crisp cel ground shadow */}
      <ellipse cx="32" cy="56" rx="16" ry="4" fill="rgba(45, 30, 24, 0.24)" />

      {/* Legs & feet */}
      <path
        d="M26 46v7.5m0 0l-4 1.8m4-1.8l3.5 1.6M38 46v7.5m0 0l-3.5 1.6m3.5-1.6l4 1.8"
        stroke="#EA580C"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Fluffy anime tail feathers */}
      <path
        d="M15 30c-5-6-9-3-6 4-4 1-4 6 1 7.5l8.5-3z"
        fill={c.wing}
        stroke={c.outline}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Crown comb */}
      <path
        d="M32 10.5c0-4 4.2-5 5.6-1.8 2-3.2 6-1.4 5.2 2 2.8-.6 4 2.8 1.4 4.8H32z"
        fill={c.comb}
        stroke={c.outline}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Chibi round hen body */}
      <path
        d="M14.5 34.5c0-10.2 7.2-18.8 18.2-18.8 8.2 0 14.8 5.2 14.8 13.8 0 10.5-7.4 18.5-17.8 18.5-8.8 0-15.2-5.8-15.2-13.5z"
        fill={c.body}
        stroke={c.outline}
        strokeWidth="2.5"
      />

      {/* Two-tone cel bottom shadow crescent */}
      <path
        d="M16.8 38.2c2.8 5.5 8.2 8.2 14.4 7.8 6.8-.4 12.4-4.2 14.4-10-2.6 4.4-7.6 6.8-14 6.8-6.4 0-11.6-1.8-14.8-4.6z"
        fill={c.shade}
        opacity="0.72"
      />

      {/* Glossy crown highlight */}
      <ellipse cx="29" cy="21" rx="6" ry="2.6" transform="rotate(-18 29 21)" fill="#FFFFFF" opacity="0.55" />

      {/* Cute anime collar ribbon */}
      {c.ribbon && (
        <path
          d="M32 36.2c3.5 1.8 8.5 1.6 11.8-.4"
          stroke={c.ribbon}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Fluffy side wing */}
      <path
        d="M21 31.5c0-4.8 5.4-7.4 11-5.8 3.6 1 4.6 5 1.8 8-3.2 3.2-12.8 2.6-12.8-2.2z"
        fill={c.wing}
        stroke={c.outline}
        strokeWidth="2.3"
      />

      {/* Cute wattle & golden anime beak */}
      <path
        d="M44.8 31.4c2 1.6 1.5 5-0.8 5.2-1.8.2-2.2-2.4-1-4.6"
        fill={c.comb}
        stroke={c.outline}
        strokeWidth="2"
      />
      <path
        d="M45.8 25.5l8.2 2.8-8.2 3.4z"
        fill={c.beak}
        stroke={c.outline}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />

      {/* Rosy anime cheek blush */}
      <ellipse cx="38.2" cy="30.6" rx="3.4" ry="2" fill={c.blush} opacity="0.72" />

      {/* Large expressive kawaii anime eye with twin specular highlights */}
      <circle cx="40.5" cy="24.5" r="3.6" fill="#FFFFFF" stroke={c.outline} strokeWidth="1.5" />
      <circle cx="41.1" cy="24.7" r="2.3" fill={c.eye} />
      <circle cx="40.3" cy="23.6" r="0.95" fill="#FFFFFF" />
      <circle cx="42.1" cy="25.8" r="0.5" fill="#FFFFFF" />
      {breed === 'australorp' && (
        <circle cx="41.1" cy="24.7" r="1.4" fill="#FDE047" opacity="0.35" />
      )}
    </svg>
  );
}

export function QRCodeSvg({ value, className = 'w-44 h-44' }: { value: string; className?: string }) {
  const { size, rects } = useMemo(() => {
    const qr = QRCode.create(value || ' ', { errorCorrectionLevel: 'M' });
    const dim = qr.modules.size;
    const data = qr.modules.data;
    const cells: Array<{ x: number; y: number }> = [];
    for (let r = 0; r < dim; r += 1) {
      for (let c = 0; c < dim; c += 1) {
        if (data[r * dim + c]) {
          cells.push({ x: c + 2, y: r + 2 });
        }
      }
    }
    return { size: dim + 4, rects: cells };
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label="Deposit wallet QR code"
      shapeRendering="crispEdges"
    >
      <rect x="0" y="0" width={size} height={size} rx="2" fill="#FFFFFF" />
      {rects.map((cell) => (
        <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width="1" height="1" fill="#111827" />
      ))}
    </svg>
  );
}

const BADGE_TIER_STYLE: Record<
  AchievementTier,
  {
    shell: string;
    mutedShell: string;
    iconColor: string;
    label: string;
  }
> = {
  bronze: {
    shell:
      'bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-950/90 dark:to-amber-900/80 border-[#7C2D12] dark:border-orange-500 shadow-[0_2px_0_#C2410C,inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    mutedShell:
      'bg-stone-100/80 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-400 dark:text-stone-500',
    iconColor: 'text-orange-800 dark:text-orange-200',
    label: 'Bronze',
  },
  silver: {
    shell:
      'bg-gradient-to-br from-slate-100 to-sky-200 dark:from-slate-800 dark:to-sky-900/80 border-[#075985] dark:border-sky-500 shadow-[0_2px_0_#0284C7,inset_0_1.5px_0_rgba(255,255,255,0.8)]',
    mutedShell:
      'bg-stone-100/80 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-400 dark:text-stone-500',
    iconColor: 'text-sky-800 dark:text-sky-200',
    label: 'Silver',
  },
  gold: {
    shell:
      'bg-gradient-to-br from-yellow-200 to-amber-400 dark:from-amber-700 dark:to-yellow-700 border-[#4A2B11] dark:border-amber-400 shadow-[0_2px_0_#92400E,inset_0_1.5px_0_rgba(255,255,255,0.75)]',
    mutedShell:
      'bg-stone-100/80 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-400 dark:text-stone-500',
    iconColor: 'text-amber-950 dark:text-amber-50',
    label: 'Gold',
  },
  legend: {
    shell:
      'bg-gradient-to-br from-emerald-200 via-teal-200 to-amber-300 dark:from-emerald-800 dark:via-teal-800 dark:to-amber-700 border-[#064E3B] dark:border-emerald-400 shadow-[0_2px_0_#059669,inset_0_1.5px_0_rgba(255,255,255,0.8)]',
    mutedShell:
      'bg-stone-100/80 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-400 dark:text-stone-500',
    iconColor: 'text-emerald-950 dark:text-emerald-100',
    label: 'Legend',
  },
};

function renderBadgeGlyph(icon: AchievementIconKey, iconClass: string) {
  switch (icon) {
    case 'egg':
      return <Egg className={iconClass} />;
    case 'crown':
      return <Crown className={iconClass} />;
    case 'flame':
      return <Flame className={iconClass} />;
    case 'basket':
      return <Package className={iconClass} />;
    case 'users':
      return <Users className={iconClass} />;
    case 'trophy':
      return <Trophy className={iconClass} />;
    case 'send':
      return <Send className={iconClass} />;
    case 'sparkles':
    default:
      return <Sparkles className={iconClass} />;
  }
}

export function AchievementBadgeEmblem({
  badge,
  size = 'md',
  locked = false,
}: {
  badge: Pick<ShowcaseBadge, 'title' | 'badgeLabel' | 'tier' | 'icon' | 'perkLabel'>;
  size?: 'xs' | 'sm' | 'md';
  locked?: boolean;
}) {
  const tierStyle = BADGE_TIER_STYLE[badge.tier];
  const boxCls =
    size === 'xs'
      ? 'w-5 h-5 rounded-md border-[1.5px]'
      : size === 'sm'
        ? 'w-8 h-8 rounded-xl border-2'
        : 'w-10 h-10 rounded-xl border-2';
  const iconCls =
    size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
        ? 'w-4 h-4'
        : 'w-5 h-5';
  const tooltip = `${badge.title} (${tierStyle.label}) · ${badge.perkLabel}`;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex items-center justify-center shrink-0 transition-transform ${boxCls} ${
        locked ? `${tierStyle.mutedShell} opacity-65` : `${tierStyle.shell} ${tierStyle.iconColor}`
      }`}
    >
      {renderBadgeGlyph(badge.icon, iconCls)}
    </span>
  );
}

/**
 * Hand-crafted cel-shaded Anime Fox & Crow mini-event sprites matching ChickenSprite ink lineart.
 */
export function CritterSprite({
  kind,
  className = 'w-14 h-14',
  facingLeft = false,
}: {
  kind: MeadowCritterKind;
  className?: string;
  facingLeft?: boolean;
}) {
  if (kind === 'fox') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={className}
        style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}
        aria-label="Sneaky red fox"
        role="img"
      >
        <ellipse cx="32" cy="57" rx="18" ry="4" fill="rgba(45, 30, 24, 0.24)" />
        {/* Bushy fox tail with cream tip */}
        <path
          d="M18 42C8 42 5 30 12 24c4 2 7 7 9 13z"
          fill="#EA580C"
          stroke="#2D1E18"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M10 31c-2-3 0-6 2-7 3 2 5 5 6 8-3 1-6 0-8-1z"
          fill="#FFF7ED"
        />
        {/* Body */}
        <ellipse cx="30" cy="43" rx="13" ry="10.5" fill="#F97316" stroke="#2D1E18" strokeWidth="2.4" />
        <ellipse cx="34" cy="45" rx="7.5" ry="7" fill="#FFF7ED" />
        {/* Paws */}
        <path d="M23 51v4.5M38 51v4.5" stroke="#2D1E18" strokeWidth="3.2" strokeLinecap="round" />
        {/* Ears */}
        <path d="M24 23l-4-11 10 6z" fill="#EA580C" stroke="#2D1E18" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M40 23l4-11-10 6z" fill="#EA580C" stroke="#2D1E18" strokeWidth="2.3" strokeLinejoin="round" />
        <path d="M24 20l-2-6 5 3zM40 20l2-6-5 3z" fill="#FED7AA" />
        {/* Head */}
        <path
          d="M19 28c0-7.5 6-12 14-12s14 4.5 14 12c0 6-6.5 10.5-14 10.5S19 34 19 28z"
          fill="#F97316"
          stroke="#2D1E18"
          strokeWidth="2.4"
        />
        {/* Cream cheek fur */}
        <path
          d="M21 31c3.5 0 6 2 8 6.5-4.5-.5-7.5-3-8-6.5zM45 31c-3.5 0-6 2-8 6.5 4.5-.5 7.5-3 8-6.5z"
          fill="#FFF7ED"
        />
        {/* Mischievous eyes & nose */}
        <ellipse cx="28" cy="27" rx="2.3" ry="2.7" fill="#2D1E18" />
        <ellipse cx="39" cy="27" rx="2.3" ry="2.7" fill="#2D1E18" />
        <circle cx="27.2" cy="26" r="0.9" fill="#FFFFFF" />
        <circle cx="38.2" cy="26" r="0.9" fill="#FFFFFF" />
        <path d="M25.5 23.2l4.5 1.3M41.5 23.2l-4.5 1.3" stroke="#2D1E18" strokeWidth="1.9" strokeLinecap="round" />
        <ellipse cx="34" cy="32.5" rx="2.6" ry="1.9" fill="#2D1E18" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}
      aria-label="Farmyard crow"
      role="img"
    >
      <ellipse cx="32" cy="57" rx="15" ry="3.8" fill="rgba(45, 30, 24, 0.24)" />
      {/* Tail feathers */}
      <path d="M16 40l-9 5 4-9z" fill="#1E293B" stroke="#0F172A" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Legs */}
      <path d="M27 48v6.5M36 48v6.5" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
      {/* Flapping Wing */}
      <path
        d="M25 32c-8-9-16-4-12 5 3 5 9 5 14 2z"
        fill="#334155"
        stroke="#0F172A"
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* Body & Head */}
      <ellipse cx="32" cy="39" rx="13" ry="11.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2.4" />
      <circle cx="36" cy="23" r="10.5" fill="#1E293B" stroke="#0F172A" strokeWidth="2.4" />
      <path d="M29 19c2-4 7-5 11-3" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      {/* Sharp Golden Beak */}
      <path d="M44 21l11 3.5-10.5 4z" fill="#FBBF24" stroke="#2D1E18" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Alert Eye */}
      <circle cx="39" cy="22" r="3" fill="#FEF3C7" stroke="#0F172A" strokeWidth="1.4" />
      <circle cx="39.5" cy="22" r="1.5" fill="#0F172A" />
      <circle cx="38.8" cy="21.2" r="0.6" fill="#FFFFFF" />
      {/* Front wing highlight */}
      <path d="M24 37c4-3 11-2 13 3-4 4-10 4-13-3z" fill="#334155" stroke="#0F172A" strokeWidth="1.8" />
    </svg>
  );
}

export function IncubatorNestEggSprite({
  tier,
  ready = false,
  className = 'w-12 h-12',
}: {
  tier: IncubatorTierId;
  ready?: boolean;
  className?: string;
}) {
  const uid = useId();
  const gradId = `incEgg-${uid}`;
  const palette =
    tier === 'royal'
      ? { top: '#A7F3D0', mid: '#34D399', bottom: '#059669', spot: '#FEF08A' }
      : tier === 'golden'
        ? { top: '#FEF9C3', mid: '#FDE047', bottom: '#F59E0B', spot: '#FFFFFF' }
        : { top: '#FFFFFF', mid: '#FFEDD5', bottom: '#FB923C', spot: '#FDBA74' };

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={palette.top} />
          <stop offset="55%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.bottom} />
        </linearGradient>
      </defs>
      {/* Cozy straw nest */}
      <ellipse cx="24" cy="38" rx="18" ry="6.5" fill="#D97706" stroke="#3B261D" strokeWidth="2.2" />
      <path d="M9 36.5c5 3 25 3 30 0M11 40c6 2.5 20 2.5 26 0" stroke="#FCD34D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Egg */}
      <path
        d="M24 6.5C16.2 6.5 11.4 17.5 11.4 26.2c0 7.6 5.2 12.3 12.6 12.3s12.6-4.7 12.6-12.3C36.6 17.5 31.8 6.5 24 6.5z"
        fill={`url(#${gradId})`}
        stroke="#3B261D"
        strokeWidth="2.3"
      />
      <ellipse cx="19.2" cy="17.5" rx="2.6" ry="5" transform="rotate(-15 19.2 17.5)" fill="#FFFFFF" opacity="0.85" />
      <circle cx="29" cy="24" r="2.2" fill={palette.spot} opacity="0.65" />
      <circle cx="26" cy="30" r="1.5" fill={palette.spot} opacity="0.55" />
      {ready && (
        <path
          d="M17.5 22l4.2 3.2 3.3-3.4 3.8 3.6 3.7-2.6"
          fill="none"
          stroke="#3B261D"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

