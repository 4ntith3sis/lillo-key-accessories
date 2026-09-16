'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';
import { useActiveProduct } from '@/context/ActiveProductContext';

const getValidLink = (link?: string, fallback = '/collection') => {
  if (!link || link === '#shop' || link === '/shop' || link === '#') return fallback;
  return link;
};

interface HeroProps {
  content?: HomepageContent['hero'];
}

export default function Hero({ content }: HeroProps) {
  const c = content || DEFAULT_HOMEPAGE_CONTENT.hero;
  const { activeProduct } = useActiveProduct();

  const stageRef = useRef<HTMLDivElement>(null);
  const playgroundRef = useRef<HTMLDivElement>(null);
  const charmRef = useRef<HTMLImageElement>(null);
  const keyRingRef = useRef<SVGGElement>(null);
  const crimpRef = useRef<SVGGElement>(null);
  const cordPathRef = useRef<SVGPathElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // Image loading state: keep the charm hidden until its src has actually
  // loaded, so a slow or invalid src (e.g. a stale CMS heroImage) never
  // flashes a broken-image icon. Layout/dimensions are preserved while hidden.
  const heroSrc = activeProduct?.image || c.heroImage;
  const [heroImgVisible, setHeroImgVisible] = useState(false);
  useEffect(() => {
    setHeroImgVisible(false);
    const el = charmRef.current;
    if (el && el.complete && el.naturalWidth > 0) setHeroImgVisible(true);
  }, [heroSrc]);

  useEffect(() => {
    const stage = stageRef.current;
    const playground = playgroundRef.current;
    // NOTE: #heroCharm may mount AFTER this effect runs (it appears when
    // activeProduct / CMS content resolves), so the loop must not depend on
    // the image being present at init. The image is picked up per-frame.
    if (!stage || !playground) return;

    let W = stage.clientWidth || window.innerWidth;
    let H = stage.clientHeight || window.innerHeight;
    let REST = window.innerWidth < 700 ? 150 : 215;
    const DAMP = 2.4;
    const GRAV = 580;
    let pos = { x: 0, y: 0 };
    let vel = { x: 0, y: 0 };
    let anchor = { x: 0, y: 0 };
    let dragging = false;
    let grabOff = { x: 0, y: 0 };
    let lastT = 0;
    let breeze = Math.random() * 7;
    let animId: number;

    const SEGS = 13;
    let rope: { x: number; y: number; px: number; py: number }[] = [];

    const layout = () => {
      W = stage.clientWidth || window.innerWidth;
      H = stage.clientHeight || window.innerHeight;
      REST = window.innerWidth < 700 ? 150 : 215;
      const r = playground.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      anchor = { x: r.left - sr.left + r.width * 0.5, y: Math.max(r.top - sr.top + 65, 40) };
      if (pos.x === 0 && pos.y === 0) {
        pos = { x: anchor.x, y: anchor.y + REST };
      }
      rope = Array.from({ length: SEGS + 1 }, (_, i) => {
        const t = i / SEGS;
        const rx = anchor.x + (pos.x - anchor.x) * t;
        const ry = anchor.y + (pos.y - anchor.y) * t;
        return { x: rx, y: ry, px: rx, py: ry };
      });
    };

    layout();
    window.addEventListener('resize', layout);

    const stepRope = () => {
      const segLen = REST / SEGS;
      for (let i = 1; i < SEGS; i++) {
        const p = rope[i];
        const vx = (p.x - p.px) * 0.95;
        const vy = (p.y - p.py) * 0.95;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + 0.9;
      }
      if (rope[0]) { rope[0].x = anchor.x; rope[0].y = anchor.y; }
      if (rope[SEGS]) { rope[SEGS].x = pos.x; rope[SEGS].y = pos.y; }

      for (let k = 0; k < 24; k++) {
        for (let i = 0; i < SEGS; i++) {
          const a = rope[i];
          const b = rope[i + 1];
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = ((d - segLen) / d) * 0.5;
          if (i > 0) {
            a.x += dx * diff;
            a.y += dy * diff;
          }
          if (i < SEGS - 1) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          }
        }
        if (rope[0]) { rope[0].x = anchor.x; rope[0].y = anchor.y; }
        if (rope[SEGS]) { rope[SEGS].x = pos.x; rope[SEGS].y = pos.y; }
      }
    };

    const render = () => {
      const cw = 172;
      const dx = pos.x - anchor.x;
      const dy = pos.y - anchor.y;
      const tilt = Math.atan2(dx, Math.max(dy, 40)) * -28;
      const turn = Math.max(-38, Math.min(38, vel.x * 0.055));

      const charmEl = charmRef.current;
      if (charmEl) {
        charmEl.style.transform = `translate(${pos.x - cw / 2}px, ${pos.y - 4}px) rotate(${tilt}deg) rotateY(${turn}deg)`;
      }

      if (hintRef.current && !hintRef.current.classList.contains('gone')) {
        hintRef.current.style.transform = `translate(${pos.x}px, ${pos.y + 240}px) translateX(-50%)`;
      }

      stepRope();

      if (keyRingRef.current) {
        keyRingRef.current.setAttribute('transform', `translate(${anchor.x.toFixed(1)}, ${anchor.y.toFixed(1)})`);
      }

      if (cordPathRef.current && rope.length > 0) {
        let dStr = `M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`;
        for (let i = 1; i <= SEGS; i++) {
          if (rope[i]) {
            dStr += ` L ${rope[i].x.toFixed(1)} ${rope[i].y.toFixed(1)}`;
          }
        }
        cordPathRef.current.setAttribute('d', dStr);
      }

      if (crimpRef.current && rope.length > SEGS) {
        const a = rope[SEGS - 1];
        const b = rope[SEGS];
        if (a && b) {
          const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) - 90;
          crimpRef.current.setAttribute('transform', `translate(${pos.x.toFixed(1)}, ${(pos.y - 14).toFixed(1)}) rotate(${angle.toFixed(1)})`);
        }
      }
    };

    const step = (t: number) => {
      const dt = Math.min((t - lastT) / 1000, 0.033) || 0.016;
      lastT = t;
      breeze += dt;

      const r = playground.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const tx = r.left - sr.left + r.width * 0.5;
      const ty = Math.max(r.top - sr.top + 65, 40);
      anchor.x += (tx - anchor.x) * 0.08;
      anchor.y += (ty - anchor.y) * 0.08;

      if (!dragging) {
        const swaySpeed = 1.35;
        const swayAmp = 42;
        const targetSwayX = anchor.x + Math.sin(breeze * swaySpeed) * swayAmp;
        const targetSwayY = anchor.y + Math.sqrt(Math.max(100, REST * REST - (targetSwayX - anchor.x) ** 2));

        vel.x += (targetSwayX - pos.x) * 3.8 * dt;
        vel.y += (targetSwayY - pos.y) * 3.8 * dt;
        vel.y += GRAV * 0.1 * dt;

        vel.x *= Math.exp(-DAMP * dt);
        vel.y *= Math.exp(-DAMP * dt);

        pos.x += vel.x * dt;
        pos.y += vel.y * dt;

        const dx = pos.x - anchor.x;
        const dy = pos.y - anchor.y;
        const len = Math.hypot(dx, dy) || 1;
        if (len > REST) {
          pos.x = anchor.x + (dx / len) * REST;
          pos.y = anchor.y + (dy / len) * REST;
        }

        const margin = 44;
        if (pos.x < margin) { pos.x = margin; vel.x *= -0.4; }
        if (pos.x > W - margin) { pos.x = W - margin; vel.x *= -0.4; }
        if (pos.y > H + 60) { pos.y = H + 60; vel.y *= -0.4; }
      }

      render();
      animId = requestAnimationFrame(step);
    };

    const getPt = (e: MouseEvent | TouchEvent) => {
      const p = 'touches' in e && e.touches.length > 0 ? e.touches[0] : (e as MouseEvent);
      const sr = stage.getBoundingClientRect();
      return { x: p.clientX - sr.left, y: p.clientY - sr.top };
    };

    let lastDrag = { x: 0, y: 0, t: 0 };

    const down = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      if (hintRef.current) hintRef.current.classList.add('gone');
      const p = getPt(e);
      grabOff = { x: p.x - pos.x, y: p.y - pos.y };
      lastDrag = { ...p, t: performance.now() };
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const p = getPt(e);
      const now = performance.now();
      const dt = Math.max(now - lastDrag.t, 1) / 1000;

      const rx = p.x - grabOff.x;
      const ry = p.y - grabOff.y;
      const ddx = rx - anchor.x;
      const ddy = ry - anchor.y;
      const raw = Math.hypot(ddx, ddy) || 1;

      const eff = Math.min(raw, REST);
      const nx = anchor.x + (ddx / raw) * eff;
      const ny = anchor.y + (ddy / raw) * eff;

      vel.x = ((nx - pos.x) / dt) * 0.6;
      vel.y = ((ny - pos.y) / dt) * 0.6;
      pos.x = nx;
      pos.y = ny;
      lastDrag = { ...p, t: now };
    };

    const up = () => {
      if (!dragging) return;
      dragging = false;
    };

    const onMouseDown = (e: MouseEvent) => down(e);
    const onMouseMove = (e: MouseEvent) => move(e);
    const onMouseUp = () => up();

    const onTouchStart = (e: TouchEvent) => down(e);
    const onTouchMove = (e: TouchEvent) => move(e);
    const onTouchEnd = () => up();

    // Pointer events are bound to the stage (the image may not exist yet)
    // and only act when the target is the charm image itself.
    const isCharmTarget = (t: EventTarget | null): boolean =>
      t !== null && t === charmRef.current;

    const onStageMouseDown = (e: MouseEvent) => {
      if (isCharmTarget(e.target)) onMouseDown(e);
    };
    const onStageTouchStart = (e: TouchEvent) => {
      if (isCharmTarget(e.target)) onTouchStart(e);
    };

    stage.addEventListener('mousedown', onStageMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    stage.addEventListener('touchstart', onStageTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    animId = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', layout);
      stage.removeEventListener('mousedown', onStageMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      stage.removeEventListener('touchstart', onStageTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="hero-section">
      {/* Left Hero Copy */}
      <div className="hero-copy">
        <p className="kicker intro-1">{c.kicker}</p>
        <h1 className="hero-title intro-2">
          {c.title}
        </h1>
        <p className="sub intro-3">
          {c.sub}
        </p>
        <div className="hero-cta intro-4">
"          <Link className="btn btn-primary magnetic" href={getValidLink(c.primaryBtnLink, '/collection')}>
            {c.primaryBtnText}
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link className="btn-link magnetic" href={getValidLink(c.secondaryBtnLink, '/about')}>
            {c.secondaryBtnText}
          </Link>"
        </div>
      </div>

      {/* Right Hero Interactive Keychain Stage */}
      <div className="hero-stage">
        <div id="playground" ref={playgroundRef}></div>

        <div id="charmStage" ref={stageRef}>
          <svg id="cordSvg">
            <defs>
              <linearGradient id="silverMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="22%" stopColor="#e2e8f0" />
                <stop offset="55%" stopColor="#94a3b8" />
                <stop offset="82%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <filter id="silverDropShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.18" />
              </filter>
            </defs>

            <g id="keyRingGroup" ref={keyRingRef} filter="url(#silverDropShadow)">
              <circle cx="0" cy="0" r="6" fill="none" stroke="url(#silverMetal)" strokeWidth="2.8" />
              <circle cx="0" cy="0" r="3" fill="#1f1f24" />
            </g>

            <path
              id="blackCordPath"
              ref={cordPathRef}
              fill="none"
              stroke="#161619"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#silverDropShadow)"
            />

            <g id="crimpGroup" ref={crimpRef} filter="url(#silverDropShadow)">
              <rect x="-4" y="-12" width="8" height="12" rx="2" fill="url(#silverMetal)" stroke="#334155" strokeWidth="0.9" />
              <line x1="-1" y1="-10" x2="-1" y2="0" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
              <circle cx="0" cy="4" r="4" fill="none" stroke="url(#silverMetal)" strokeWidth="2" />
              <path d="M -4 8 C -4 16 4 16 4 8 C 4 5 2 4 0 4 C -2 4 -4 5 -4 8 Z" fill="none" stroke="url(#silverMetal)" strokeWidth="2" strokeLinejoin="round" />
              <line x1="-2.5" y1="7" x2="1" y2="11" stroke="url(#silverMetal)" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          </svg>

          {heroSrc ? (
            <div className="charm-float">
              <img
                id="heroCharm"
                ref={charmRef}
                src={heroSrc}
                alt={activeProduct?.name || 'LILLO Interactive Keychain Charm — pull me!'}
                draggable={false}
                width={172}
                style={{ width: '172px', height: 'auto', objectFit: 'contain', visibility: heroImgVisible ? 'visible' : 'hidden' }}
                onLoad={() => setHeroImgVisible(true)}
                onError={() => setHeroImgVisible(false)}
              />
            </div>
          ) : null}
          <div className="pg-hint" id="pgHint" ref={hintRef}>
            pull me &darr;
          </div>
        </div>
      </div>
    </section>
  );
}
