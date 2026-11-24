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
