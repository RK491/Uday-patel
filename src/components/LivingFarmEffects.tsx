import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bot } from 'lucide-react';
import animeFarmMeadowBg from '../assets/images/anime_farm_meadow_1795509839666.jpg';

export const STATIC_FARM_IMAGE_PATH = animeFarmMeadowBg;

const FARM_IMAGE_ASPECT = 2 / 3;

interface FoliageZone {
  id: string;
  clipPath: string;
  animClass: string;
  delay: string;
  duration?: string;
}

/**
 * Strictly cherry-blossom canopy & meadow bush zones anchored to the 2:3 anime sanctuary,
 * keeping the farmhouse, coop barn, fences, stepping stones, and pasture 100% still.
 */
const ANIME_FOLIAGE_ZONES: FoliageZone[] = [
  {
    id: 'sakura-upper-left',
    clipPath: 'polygon(6% 18%, 25% 18%, 26% 32%, 7% 32%)',
    animClass: 'animate-foliage-rustle-a',
    delay: '0s',
    duration: '6.2s',
  },
  {
    id: 'sakura-center-behind',
    clipPath: 'polygon(37% 17%, 54% 17%, 54% 30%, 38% 30%)',
    animClass: 'animate-foliage-rustle-b',
    delay: '0.9s',
    duration: '6.8s',
  },
  {
    id: 'sakura-upper-right',
    clipPath: 'polygon(80% 21%, 98% 20%, 98% 33%, 81% 32%)',
    animClass: 'animate-foliage-rustle-a',
    delay: '1.4s',
    duration: '6.5s',
  },
  {
    id: 'sakura-mid-left-main',
    clipPath: 'polygon(0% 34%, 20% 34%, 22% 50%, 0% 49%)',
    animClass: 'animate-foliage-rustle-b',
    delay: '0.4s',
    duration: '5.8s',
  },
  {
    id: 'sakura-mid-left-lower',
    clipPath: 'polygon(12% 44%, 28% 44%, 28% 55%, 13% 55%)',
    animClass: 'animate-foliage-rustle-a',
    delay: '1.1s',
    duration: '5.5s',
  },
  {
    id: 'trees-bottom-left',
    clipPath: 'polygon(0% 59%, 22% 62%, 25% 84%, 0% 84%)',
    animClass: 'animate-foliage-rustle-a',
    delay: '0.6s',
    duration: '5.6s',
  },
  {
    id: 'trees-bottom-right',
    clipPath: 'polygon(80% 60%, 100% 58%, 100% 80%, 82% 76%)',
    animClass: 'animate-foliage-rustle-b',
    delay: '1.5s',
    duration: '5.9s',
  },
  {
    id: 'creek-reeds',
    clipPath: 'ellipse(11% 6.5% at 62% 76%)',
    animClass: 'animate-reed-sway',
    delay: '0.7s',
    duration: '4.1s',
  },
];

interface SakuraPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  rot: number;
  vrot: number;
  phase: number;
  tint: 'pink' | 'pale' | 'gold';
}

interface CreekGlint {
  x: number;
  y: number;
  len: number;
  phase: number;
  speed: number;
}

interface StoneRipple {
  cx: number;
  cy: number;
  rx: number;
  maxRx: number;
  alpha: number;
  speed: number;
}

interface KomorebiMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface LivingFarmEffectsProps {
  boosterActive: boolean;
  droneActive: boolean;
  isPaused?: boolean;
  weatherEffectsEnabled?: boolean;
  children?: React.ReactNode;
}

const CSS_POLLEN_SPECS = [
  { left: '11%', top: '34%', size: 5, delay: '-0.8s', duration: '6.4s', tint: 'gold' },
  { left: '22%', top: '58%', size: 4, delay: '-2.1s', duration: '7.1s', tint: 'cream' },
  { left: '31%', top: '41%', size: 6, delay: '-4.2s', duration: '6.8s', tint: 'gold' },
  { left: '43%', top: '67%', size: 4, delay: '-1.5s', duration: '7.6s', tint: 'mint' },
  { left: '52%', top: '30%', size: 5, delay: '-3.4s', duration: '6.1s', tint: 'cream' },
  { left: '61%', top: '54%', size: 6, delay: '-5.2s', duration: '7.4s', tint: 'gold' },
  { left: '72%', top: '42%', size: 4, delay: '-0.4s', duration: '6.9s', tint: 'cream' },
  { left: '84%', top: '62%', size: 5, delay: '-2.8s', duration: '7.8s', tint: 'gold' },
  { left: '17%', top: '76%', size: 4, delay: '-4.9s', duration: '6.3s', tint: 'mint' },
  { left: '37%', top: '81%', size: 5, delay: '-1.1s', duration: '7.2s', tint: 'gold' },
  { left: '66%', top: '74%', size: 4, delay: '-3.9s', duration: '6.6s', tint: 'cream' },
  { left: '89%', top: '36%', size: 5, delay: '-5.6s', duration: '7.5s', tint: 'gold' },
] as const;

const CSS_LEAF_SPECS = [
  { left: '9%', top: '12%', size: 12, delay: '-1.2s', duration: '10.6s', fill: '#86EFAC' },
  { left: '24%', top: '8%', size: 10, delay: '-5.4s', duration: '12.2s', fill: '#F9A8D4' },
  { left: '38%', top: '15%', size: 11, delay: '-8.1s', duration: '11.1s', fill: '#FDE047' },
  { left: '54%', top: '10%', size: 10, delay: '-3.3s', duration: '13.4s', fill: '#FBCFE8' },
  { left: '69%', top: '18%', size: 12, delay: '-6.7s', duration: '10.9s', fill: '#4ADE80' },
  { left: '83%', top: '11%', size: 10, delay: '-9.5s', duration: '12.6s', fill: '#FDBA74' },
  { left: '15%', top: '36%', size: 11, delay: '-4.5s', duration: '11.8s', fill: '#F9A8D4' },
  { left: '47%', top: '31%', size: 10, delay: '-7.2s', duration: '12.9s', fill: '#86EFAC' },
  { left: '77%', top: '39%', size: 11, delay: '-2.1s', duration: '11.4s', fill: '#FDE047' },
] as const;

export function LivingFarmEffects({
  boosterActive,
  droneActive,
  isPaused = false,
  weatherEffectsEnabled = true,
  children,
}: LivingFarmEffectsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [bgFailed, setBgFailed] = useState(false);
  const stageOuterRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [coverBox, setCoverBox] = useState<{ width: number; height: number } | null>(null);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocVisible, setIsDocVisible] = useState(
    () => (typeof document === 'undefined' ? true : document.visibilityState === 'visible'),
  );

  useEffect(() => {
    const el = stageOuterRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInViewport(entry.isIntersecting && entry.intersectionRatio > 0);
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisibility = () => {
      setIsDocVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const effectivePaused = Boolean(isPaused) || !isInViewport || !isDocVisible;

  useEffect(() => {
    const el = stageOuterRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const containerAspect = rect.width / rect.height;
      let width = rect.width;
      let height = rect.height;
      if (containerAspect > FARM_IMAGE_ASPECT) {
        width = rect.width;
        height = rect.width / FARM_IMAGE_ASPECT;
      } else {
        height = rect.height;
        width = rect.height * FARM_IMAGE_ASPECT;
      }
      setCoverBox((prev) =>
        prev && Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
          ? prev
          : { width, height },
      );
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !coverBox) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(coverBox.width));
    const H = Math.max(1, Math.round(coverBox.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    // Drifting sakura petals across the sunlit sanctuary
    const petals: SakuraPetal[] = Array.from({ length: 24 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 10 + Math.random() * 14,
      vy: 14 + Math.random() * 16,
      rx: 2.6 + Math.random() * 2.2,
      ry: 1.5 + Math.random() * 1.2,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 2.4,
      phase: i * 0.7,
      tint: i % 5 === 0 ? 'gold' : i % 2 === 0 ? 'pink' : 'pale',
    }));

    // Anime crystal creek glints along the lower-right stream
    const creekGlints: CreekGlint[] = Array.from({ length: 26 }, (_, i) => {
      const t = i / 25; // 0 (top-right stream) to 1 (bottom-left stream)
      const baseX = (0.94 - t * 0.72) * W + (Math.random() - 0.5) * (0.1 * W);
      const baseY = (0.64 + t * 0.34) * H + (Math.random() - 0.5) * (0.04 * H);
      return {
        x: baseX,
        y: baseY,
        len: 0.015 * W + Math.random() * (0.02 * W),
        phase: i * 0.65,
        speed: 1.4 + Math.random() * 1.2,
      };
    });

    // Subtle stepping stone water ripples in the lower-right stream
    const stoneRipples: StoneRipple[] = [
      { cx: 0.76 * W, cy: 0.75 * H, rx: 4, maxRx: 0.044 * W, alpha: 0.55, speed: 9.5 },
      { cx: 0.66 * W, cy: 0.79 * H, rx: 10, maxRx: 0.048 * W, alpha: 0.52, speed: 10 },
      { cx: 0.57 * W, cy: 0.83 * H, rx: 6, maxRx: 0.045 * W, alpha: 0.5, speed: 9 },
      { cx: 0.46 * W, cy: 0.91 * H, rx: 8, maxRx: 0.052 * W, alpha: 0.54, speed: 10.5 },
    ];

    // Golden-hour komorebi dust motes floating lazily above the clover lawn
    const motes: KomorebiMote[] = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 3 + Math.random() * 6,
      vy: -2.5 - Math.random() * 4.5,
      r: 1 + Math.random() * 1.4,
      phase: i * 0.85,
    }));

    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;

    const drawFrame = (dt: number) => {
      elapsed += dt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // 1. Anime Stream Sparkles & Stepping-Stone Ripples (lower right diagonal stream)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(W, 0.54 * H);
      ctx.lineTo(W, H);
      ctx.lineTo(0.08 * W, H);
      ctx.lineTo(0.55 * W, 0.72 * H);
      ctx.closePath();
      ctx.clip();

      for (const gl of creekGlints) {
        const pulse = 0.25 + 0.7 * Math.max(0, Math.sin(elapsed * gl.speed + gl.phase));
        const driftX = gl.x - Math.sin(elapsed * 0.9 + gl.phase) * 3;
        ctx.strokeStyle = `rgba(255, 255, 255, ${(pulse * 0.78).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(driftX - gl.len * 0.5, gl.y);
        ctx.lineTo(driftX + gl.len * 0.5, gl.y);
        ctx.stroke();
      }

      for (const sr of stoneRipples) {
        sr.rx += sr.speed * dt;
        const prog = sr.rx / sr.maxRx;
        if (prog >= 1) {
          sr.rx = 3;
        }
        const a = Math.max(0, sr.alpha * (1 - sr.rx / sr.maxRx));
        ctx.strokeStyle = `rgba(240, 249, 255, ${a.toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(sr.cx, sr.cy, sr.rx, sr.rx * 0.45, -0.25, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Komorebi Sunlit Pollen Motes (when weather effects enabled)
      if (weatherEffectsEnabled) {
        for (const m of motes) {
          m.x += (m.vx + Math.sin(elapsed * 0.8 + m.phase) * 3.5) * dt;
          m.y += (m.vy + Math.cos(elapsed * 0.7 + m.phase) * 2) * dt;
          if (m.x > W + 8) m.x = -6;
          if (m.y < -8) m.y = H + 6;

          const twinkle = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * 2 + m.phase));
          ctx.fillStyle = boosterActive
            ? `rgba(110, 231, 183, ${(twinkle * 0.82).toFixed(2)})`
            : `rgba(254, 240, 138, ${(twinkle * 0.8).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Drifting Sakura Cherry-Blossom Petals
        for (const p of petals) {
          p.x += (p.vx + Math.sin(elapsed * 1.1 + p.phase) * 9) * dt;
          p.y += (p.vy + Math.cos(elapsed * 1.4 + p.phase) * 4) * dt;
          p.rot += p.vrot * dt;

          if (p.x > W + 12) p.x = -10;
          if (p.y > H + 12) {
            p.y = -10;
            p.x = Math.random() * W;
          }

          const flutter = 0.55 + 0.45 * Math.sin(elapsed * 2.2 + p.phase);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, flutter);
          ctx.fillStyle =
            p.tint === 'gold'
              ? 'rgba(254, 240, 138, 0.88)'
              : p.tint === 'pink'
                ? 'rgba(249, 168, 212, 0.92)'
                : 'rgba(252, 231, 243, 0.92)';
          ctx.beginPath();
          ctx.moveTo(-p.rx, 0);
          ctx.quadraticCurveTo(0, -p.ry * 1.5, p.rx, 0);
          ctx.quadraticCurveTo(0, p.ry * 1.3, -p.rx, 0);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    if (prefersReducedMotion || effectivePaused) {
      drawFrame(0);
      return;
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      if (canvas.offsetParent !== null) {
        drawFrame(dt);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [boosterActive, coverBox, effectivePaused, prefersReducedMotion, weatherEffectsEnabled]);

  return (
    <div
      ref={stageOuterRef}
      data-farm-paused={effectivePaused || prefersReducedMotion ? 'true' : undefined}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* Locked-camera 2:3 Anime Countryside Sanctuary Stage */}
      <div
        style={
          coverBox
            ? { width: `${coverBox.width}px`, height: `${coverBox.height}px` }
            : undefined
        }
        className={
          coverBox
            ? 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none'
            : 'absolute inset-0 w-full h-full pointer-events-none'
        }
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {!bgFailed ? (
            <img
              src={animeFarmMeadowBg}
              alt="Hand-painted Studio Ghibli style anime poultry farm sanctuary with red-roofed farmhouse, timber coop barn, blooming sakura trees, sunlit clover meadow, and sparkling clear blue stream"
              referrerPolicy="no-referrer"
              onError={() => setBgFailed(true)}
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-sky-300 via-emerald-500 to-emerald-800 flex items-center justify-center">
              <div className="clay-card-warm px-5 py-3 text-center text-amber-950 text-xs font-extrabold">
                Sakura Clover Sanctuary
              </div>
            </div>
          )}

          {/* 1. Sakura Cherry-Blossom Canopy & Creek Reed Sway Overlays */}
          {!bgFailed &&
            !prefersReducedMotion &&
            ANIME_FOLIAGE_ZONES.map((zone) => (
              <div
                key={zone.id}
                style={{
                  clipPath: zone.clipPath,
                  WebkitClipPath: zone.clipPath,
                }}
                className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform"
              >
                <img
                  src={animeFarmMeadowBg}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    animationDelay: zone.delay,
                    animationDuration: zone.duration,
                  }}
                  className={`${zone.animClass} will-change-transform w-full h-full object-cover object-center select-none pointer-events-none`}
                />
              </div>
            ))}

          {/* 2. Distant Anime Horizon Birds & Meadow Butterflies */}
          {!prefersReducedMotion && (
            <>
              {[0, 1, 2].map((idx) => (
                <motion.svg
                  key={`anime-bird-${idx}`}
                  viewBox="0 0 24 12"
                  initial={{ x: -30, y: 0, opacity: 0 }}
                  animate={
                    effectivePaused
                      ? false
                      : {
                          x: [-30 + idx * 18, 140 + idx * 24, 310],
                          y: [0, -10 - idx * 3, -4],
                          scaleY: [1, 0.55, 1.15, 0.65, 1],
                          opacity: [0, 0.72, 0.72, 0],
                        }
                  }
                  transition={{
                    duration: 16 + idx * 2.6,
                    delay: idx * 3.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ left: `${10 + idx * 6}%`, top: `${7.5 + idx * 2}%` }}
                  className="will-change-transform absolute w-3.5 h-2 text-[#2D1E18]/65"
                >
                  <path
                    d="M1 8 Q6 2 12 7 Q18 2 23 8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                </motion.svg>
              ))}

              {/* Anime Garden Butterflies fluttering over flower edges */}
              {[
                { left: '25%', top: '44%', dx: 18, dy: -11, dur: 5.2, color: 'text-amber-300' },
                { left: '72%', top: '52%', dx: -16, dy: -10, dur: 5.9, color: 'text-pink-200' },
                { left: '34%', top: '65%', dx: 14, dy: -12, dur: 4.8, color: 'text-yellow-200' },
              ].map((bf, idx) => (
                <motion.div
                  key={`anime-butterfly-${idx}`}
                  animate={
                    effectivePaused
                      ? false
                      : {
                          x: [0, bf.dx, bf.dx * 0.4, -bf.dx * 0.5, 0],
                          y: [0, bf.dy, -3, bf.dy * 0.7, 0],
                          scaleX: [1, 0.36, 1, 0.4, 1],
                        }
                  }
                  transition={{
                    duration: bf.dur,
                    delay: idx * 0.85,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{ left: bf.left, top: bf.top }}
                  className={`will-change-transform absolute w-3 h-3 ${bf.color} drop-shadow-[0_1px_1px_rgba(45,30,24,0.55)]`}
                >
                  <svg viewBox="0 0 16 12" className="w-full h-full fill-current stroke-[#2D1E18] stroke-[0.7]">
                    <path d="M8 6 C5 1, 1 2, 2 6 C1 9, 5 11, 8 7 C11 11, 15 9, 14 6 C15 2, 11 1, 8 6 Z" />
                  </svg>
                </motion.div>
              ))}
            </>
          )}

          {/* 3. Warm Anime Komorebi Morning Sunbeams */}
          <div
            className="animate-sunbeam absolute -top-24 -left-16 w-80 h-[125%] bg-gradient-to-b from-amber-100/28 via-yellow-50/10 to-transparent blur-2xl"
          />
          <div
            style={{ animationDelay: '2.5s' }}
            className="animate-sunbeam absolute -top-24 left-1/3 w-56 h-[125%] bg-gradient-to-b from-pink-100/20 via-amber-50/10 to-transparent blur-2xl"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_6%,rgba(254,240,138,0.28),rgba(253,186,116,0.08)_42%,transparent_72%)]"
          />

          {/* 4. Real-Time Anime Atmosphere Canvas: Drifting Sakura Petals, Stream Sparkles & Komorebi Motes */}
          <canvas
            ref={canvasRef}
            className="will-change-transform absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* 4b. CSS-Keyframe Subtle Meadow Weather Effects: Floating Pollen & Falling Leaves */}
          {weatherEffectsEnabled && !prefersReducedMotion && (
            <div
              data-testid="meadow-weather-effects"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              {CSS_POLLEN_SPECS.map((mote, idx) => (
                <span
                  key={`weather-pollen-${idx}`}
                  style={{
                    left: mote.left,
                    top: mote.top,
                    width: `${mote.size}px`,
                    height: `${mote.size}px`,
                    animationDelay: mote.delay,
                    animationDuration: mote.duration,
                  }}
                  className={`animate-weather-pollen absolute rounded-full ${
                    boosterActive || mote.tint === 'mint'
                      ? 'bg-emerald-200/85 shadow-[0_0_8px_rgba(110,231,183,0.75)]'
                      : mote.tint === 'cream'
                        ? 'bg-amber-50/90 shadow-[0_0_7px_rgba(255,251,235,0.8)]'
                        : 'bg-yellow-200/85 shadow-[0_0_8px_rgba(253,224,71,0.75)]'
                  }`}
                />
              ))}
              {CSS_LEAF_SPECS.map((leaf, idx) => (
                <svg
                  key={`weather-leaf-${idx}`}
                  viewBox="0 0 16 12"
                  style={{
                    left: leaf.left,
                    top: leaf.top,
                    width: `${leaf.size}px`,
                    height: `${Math.round(leaf.size * 0.78)}px`,
                    animationDelay: leaf.delay,
                    animationDuration: leaf.duration,
                  }}
                  className="animate-weather-leaf absolute drop-shadow-[0_1px_2px_rgba(45,30,24,0.28)]"
                >
                  <path
                    d="M1 6 C4 1, 11 1, 15 6 C11 11, 4 11, 1 6 Z"
                    fill={leaf.fill}
                    fillOpacity="0.82"
                    stroke="rgba(45,30,24,0.24)"
                    strokeWidth="0.7"
                  />
                  <path
                    d="M2.5 6 Q8 5.2 13.5 6"
                    fill="none"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                  />
                </svg>
              ))}
            </div>
          )}

          {/* 5. Active Auto-Harvest Drone patrolling smoothly above the clover pasture */}
          {droneActive && !prefersReducedMotion && (
            <motion.div
              animate={
                effectivePaused
                  ? false
                  : {
                      x: [-52, 52, 34, -40, -52],
                      y: [-10, -22, 6, -4, -10],
                    }
              }
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ left: '50%', top: '38%' }}
              className="will-change-transform absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-[#0C4A6E] flex items-center justify-center shadow-[0_3px_0_#075985]">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="mt-1.5 w-6 h-1.5 rounded-full bg-[#2D1E18]/30 blur-[2px]" />
            </motion.div>
          )}
        </div>

        {/* Bought Roaming Chibi Anime Hens Layer aligned strictly inside the open clover yard */}
        {children}
      </div>
    </div>
  );
}
