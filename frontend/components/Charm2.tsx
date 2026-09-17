'use client';

import { useEffect, useRef, useState } from 'react';
import { useActiveProduct } from '@/context/ActiveProductContext';

interface Charm2Props {
  heroImage?: string;
}

// Independent pendulum phase so Charm 2 never moves identically to Hero Charm 1.
const SWAY_PHASE = 2.1;

export default function Charm2({ heroImage }: Charm2Props) {
  const { activeProduct } = useActiveProduct();
  const rootRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<HTMLDivElement>(null);

  // Same asset as Hero Charm: live product image first, CMS hero image fallback.
  const src = activeProduct?.image || heroImage || '';

  // Image loading state: never flash a broken-image icon (same pattern as Hero fix).
  const [imgReady, setImgReady] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgReady(false);
  }

  useEffect(() => {
    const root = rootRef.current;
    const sway = swayRef.current;
    if (!root || !sway) return;

    let rafId = 0;
    let entryStart = -1; // timestamp when entry animation began (-1 = not started)
    let lastShopTop = Number.POSITIVE_INFINITY;
    let lastShopH = 1;
    let lastFooterTop = Number.POSITIVE_INFINITY;
    let lastVh = 1;
    let metricsDirty = true;

    const measure = () => {
      const vh = window.innerHeight || 800;
      const shop = document.getElementById('shop');
      const footer = document.querySelector('.site-footer') as HTMLElement | null;
      const sr = shop ? shop.getBoundingClientRect() : null;
      const fr = footer ? footer.getBoundingClientRect() : null;
      lastVh = vh;
      lastShopTop = sr ? sr.top : Number.POSITIVE_INFINITY;
      lastShopH = sr ? Math.max(sr.height, 1) : 1;
      lastFooterTop = fr ? fr.top : Number.POSITIVE_INFINITY;
      metricsDirty = false;
    };

    const onScroll = () => {
      metricsDirty = true;
    };
    const onResize = () => {
      metricsDirty = true;
    };

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (now: number) => {
      if (metricsDirty) measure();
      const vh = lastVh;

      const entered = lastShopTop < vh * 0.8;
      const aboveShop = lastShopTop > vh * 0.8;
      // Footer fade: 1 while footer is below viewport, → 0 as footer fills it.
      const fade = clamp01((lastFooterTop - vh * 0.35) / (vh * 0.65));
      const eligible = entered && !aboveShop && fade > 0.01;

      if (!eligible) {
        entryStart = -1;
        root.style.opacity = '0';
        root.style.visibility = 'hidden';
      } else {
        if (entryStart < 0) entryStart = now;
        const e = easeOutCubic(clamp01((now - entryStart) / 750));
        // Subtle scroll parallax: ±24px across the section journey.
        const progress = clamp01((vh * 0.8 - lastShopTop) / (vh * 0.8 + lastShopH));
        const parallaxY = (progress - 0.5) * 48;
        const entryX = (1 - e) * 48;
        const scale = 0.96 + 0.04 * e;
        root.style.opacity = String(fade * e);
        root.style.visibility = fade * e > 0.01 ? 'visible' : 'hidden';
        root.style.transform = `translate3d(${entryX.toFixed(1)}px, ${parallaxY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      }

      // Independent gentle sway (rotation only — float comes from CSS).
      if (reduceMotion) {
        sway.style.transform = '';
      } else {
        const t = now / 1000;
        const ang = Math.sin(t * 0.9 + SWAY_PHASE) * 2;
        const sx = Math.sin(t * 0.62 + SWAY_PHASE) * 5;
        sway.style.transform = `translateX(${sx.toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    measure();
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={rootRef} className="lillo-charm-2" aria-hidden="true">
      <div className="lillo-charm-2__float">
        <div ref={swayRef} className="lillo-charm-2__sway">
          <svg className="lillo-charm-2__cord" viewBox="-14 -8 28 237" aria-hidden="true">
            <defs>
              <linearGradient id="c2Silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="22%" stopColor="#e2e8f0" />
                <stop offset="55%" stopColor="#94a3b8" />
                <stop offset="82%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <filter id="c2Shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.18" />
              </filter>
            </defs>
            <g filter="url(#c2Shadow)">
              <circle cx="0" cy="0" r="6" fill="none" stroke="url(#c2Silver)" strokeWidth="2.8" />
              <circle cx="0" cy="0" r="3" fill="#1f1f24" />
              <line x1="0" y1="6" x2="0" y2="202" stroke="#161619" strokeWidth="3.2" strokeLinecap="round" />
              <rect x="-4" y="202" width="8" height="12" rx="2" fill="url(#c2Silver)" stroke="#334155" strokeWidth="0.9" />
              <circle cx="0" cy="218" r="4" fill="none" stroke="url(#c2Silver)" strokeWidth="2" />
            </g>
          </svg>
          {src ? (
            <img
              className="lillo-charm-2__image"
              src={src}
              alt=""
              draggable={false}
              loading="lazy"
              style={{ visibility: imgReady ? 'visible' : 'hidden' }}
              onLoad={() => setImgReady(true)}
              onError={() => setImgReady(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
