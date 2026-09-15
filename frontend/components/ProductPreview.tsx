'use client';

import { useEffect, useRef, useState } from 'react';
import { getProducts, getCategories, normalizeProduct, NormalizedProductItem } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { useActiveProduct } from '@/context/ActiveProductContext';

const HOMEPAGE_PREVIEW_COUNT = 4;

const DEFAULT_FALLBACK_PRODUCT: NormalizedProductItem = {
  id: 'drishti',
  name: 'Drishti Bomma',
  category: 'LUCK',
  price: 'Rp25.000',
  image: '',
  hasImage: false,
  stock: 0,
  inStock: false,
};

import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';

interface ProductPreviewProps {
  categoryHeader?: HomepageContent['categorySection'];
}

export default function ProductPreview({ categoryHeader }: ProductPreviewProps) {
  const cHeader = categoryHeader || DEFAULT_HOMEPAGE_CONTENT.categorySection;
  const [productList, setProductList] = useState<NormalizedProductItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProductItem>(DEFAULT_FALLBACK_PRODUCT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isStageActive, setIsStageActive] = useState(false);
  const [isStageFadeOut, setIsStageFadeOut] = useState(false);
  const swingTriggerRef = useRef<(() => void) | null>(null);
  const { activeProduct, setActiveProduct } = useActiveProduct();

  const stageRef = useRef<HTMLDivElement>(null);
  const charmRef = useRef<HTMLImageElement>(null);
  const keyRingRef = useRef<SVGGElement>(null);
  const crimpRef = useRef<SVGGElement>(null);
  const cordPathRef = useRef<SVGPathElement>(null);

  const fetchProductsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawProducts, categories] = await Promise.all([
        getProducts(),
        getCategories().catch(() => []),
      ]);
      const categoryMap = new Map(
        categories.map((c) => [
          (c.$id || '').toLowerCase(),
          c.name,
        ])
      );
      const normalized = rawProducts.map((p) => normalizeProduct(p, categoryMap));
      // Shuffle before slicing so the 4 preview cards show a random selection
      // of products on every page load instead of always the same first 4.
      const shuffled = [...normalized];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const featured = shuffled.slice(0, HOMEPAGE_PREVIEW_COUNT);
      setProductList(featured);
      if (featured.length > 0) {
        setSelectedProduct(featured[0]);
        // The Hero Charm + Charm2 follow the same active product.
        setActiveProduct(featured[0]);
      }
    } catch (err: unknown) {
      console.warn('Failed to fetch products from API:', err);
      setError('Produk tidak tersedia sementara. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsData();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const charm = charmRef.current;
    if (!stage || !charm) return;

    let REST = 220;
    const DAMP = 2.6;
    const GRAV = 580;
    let anchor = { x: 110, y: 10 };
    let pos = { x: 110, y: 230 };
    let vel = { x: 0, y: 0 };
    let dragging = false;
    let grabOff = { x: 0, y: 0 };
    let lastT = 0;
    let breeze = Math.random() * 5;
    let animId: number;

    const SEGS = 12;
    let rope = Array.from({ length: SEGS + 1 }, () => ({ x: 110, y: 10, px: 110, py: 10 }));

    const layout = () => {
      const sw = stage.clientWidth || 220;
      anchor = { x: sw * 0.5, y: 10 };
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

    swingTriggerRef.current = () => {
      vel.x = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 100);
      vel.y = -60;
    };

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
      rope[0].x = anchor.x;
      rope[0].y = anchor.y;
      rope[SEGS].x = pos.x;
      rope[SEGS].y = pos.y;

      for (let k = 0; k < 18; k++) {
        for (let i = 0; i < SEGS; i++) {
          const a = rope[i];
          const b = rope[i + 1];
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
        rope[0].x = anchor.x;
        rope[0].y = anchor.y;
        rope[SEGS].x = pos.x;
        rope[SEGS].y = pos.y;
      }
    };

    const render = () => {
      const cw = 110;
      const dx = pos.x - anchor.x;
      const dy = pos.y - anchor.y;
      const tilt = Math.atan2(dx, Math.max(dy, 30)) * -24;

      if (charm) {
        charm.style.transform = `translate(${pos.x - cw / 2}px, ${pos.y - 2}px) rotate(${tilt}deg)`;
      }

      stepRope();

      if (keyRingRef.current) {
        keyRingRef.current.setAttribute('transform', `translate(${anchor.x.toFixed(1)}, ${anchor.y.toFixed(1)})`);
      }

      if (cordPathRef.current) {
        let dStr = `M ${anchor.x.toFixed(1)} ${anchor.y.toFixed(1)}`;
        for (let i = 1; i <= SEGS; i++) {
          dStr += ` L ${rope[i].x.toFixed(1)} ${rope[i].y.toFixed(1)}`;
        }
        cordPathRef.current.setAttribute('d', dStr);
      }

      if (crimpRef.current) {
        const a = rope[SEGS - 1];
        const b = rope[SEGS];
        const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) - 90;
        crimpRef.current.setAttribute('transform', `translate(${pos.x.toFixed(1)}, ${(pos.y - 10).toFixed(1)}) rotate(${angle.toFixed(1)})`);
      }
    };

    const step = (t: number) => {
      const dt = Math.min((t - lastT) / 1000, 0.033) || 0.016;
      lastT = t;
      breeze += dt;

      if (!dragging) {
        const targetSwayX = anchor.x + Math.sin(breeze * 1.5) * 22;
        const targetSwayY = anchor.y + Math.sqrt(Math.max(80, REST * REST - (targetSwayX - anchor.x) ** 2));

        vel.x += (targetSwayX - pos.x) * 4.2 * dt;
        vel.y += (targetSwayY - pos.y) * 4.2 * dt;
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
      }

      render();
      animId = requestAnimationFrame(step);
    };

    const getPt = (e: MouseEvent | TouchEvent) => {
      const p = 'touches' in e && e.touches.length > 0 ? e.touches[0] : (e as MouseEvent);
      const sr = stage.getBoundingClientRect();
      return { x: p.clientX - sr.left, y: p.clientY - sr.top };
    };

    const down = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      const p = getPt(e);
      grabOff = { x: p.x - pos.x, y: p.y - pos.y };
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const p = getPt(e);
      const rx = p.x - grabOff.x;
      const ry = p.y - grabOff.y;
      const ddx = rx - anchor.x;
      const ddy = ry - anchor.y;
      const raw = Math.hypot(ddx, ddy) || 1;

      const eff = Math.min(raw, REST);
      pos.x = anchor.x + (ddx / raw) * eff;
      pos.y = anchor.y + (ddy / raw) * eff;
    };

    const up = () => {
      dragging = false;
    };

    const onMouseDown = (e: MouseEvent) => down(e);
    const onMouseMove = (e: MouseEvent) => move(e);
    const onMouseUp = () => up();

    charm.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    animId = requestAnimationFrame(step);

    // Scroll visibility toggle for Keychain 2 (sticky right preview stage)
    const updatePreviewVisibility = () => {
      const shopSec = document.getElementById('shop');
      const footerSec = document.querySelector('.site-footer') || document.querySelector('footer');
      if (!shopSec) return;

      const shopRect = shopSec.getBoundingClientRect();
      const footerRect = footerSec ? footerSec.getBoundingClientRect() : null;
      const winH = window.innerHeight;

      // Ensure it never shows when scroll is at the very top (Hero section)
      const isAtTop = window.scrollY < winH * 0.5;

      // Keychain 2 only appears when scroll reaches Section 3 (#shop top <= 250px from top of viewport)
      const inSection3OrBelow = !isAtTop && shopRect.top <= 250;
      // Footer is reached when footer top enters bottom 90% of viewport
      const footerReached = Boolean(footerRect && footerRect.top <= winH * 0.9);

      if (footerReached) {
        setIsStageActive(false);
        setIsStageFadeOut(true);
      } else if (inSection3OrBelow) {
        setIsStageActive(true);
        setIsStageFadeOut(false);
      } else {
        setIsStageActive(false);
        setIsStageFadeOut(false);
      }
    };

    window.addEventListener('scroll', updatePreviewVisibility, { passive: true });
    updatePreviewVisibility();

    return () => {
      window.removeEventListener('resize', layout);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('scroll', updatePreviewVisibility);
      cancelAnimationFrame(animId);
    };
  }, []);

  const handleProductSelect = (product: NormalizedProductItem) => {
    setSelectedProduct(product);
    // PREVIEW click drives Hero Charm + Charm2; Charm Wall is independent.
    setActiveProduct(product);
    if (swingTriggerRef.current) {
      swingTriggerRef.current();
    }
  };

  return (
    <section id="shop" className="featured-collection-section">
      {/* Ambient Background Light Glow */}
      <div className="featured-ambient-glow"></div>

      <div className="featured-container">
        {/* Section Header */}
        <div className="featured-header">
          <span className="featured-small-label">{cHeader.kicker}</span>
          <h2 className="featured-heading">{cHeader.title}</h2>
          <p className="featured-desc">
            {cHeader.sub}
          </p>
        </div>

        {/* Product Cards Grid / States */}
        {loading ? (
          <div className="product-cards-grid" id="productGrid" style={{ opacity: 0.7 }}>
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="lillo-product-card" style={{ pointerEvents: 'none' }}>
                <div className="card-image-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Memuat...</span>
                </div>
                <div className="card-info-box">
                  <span className="card-category">...</span>
                  <h3 className="card-title">Memuat Produk</h3>
                  <div className="card-price">--.--</div>
                </div>
              </article>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFFFFF', borderRadius: '24px', border: '1px solid rgba(24,24,24,0.08)' }}>
            <p style={{ color: '#c93a32', marginBottom: '1.25rem', fontSize: '0.95rem' }}>{error}</p>
            <button
              onClick={fetchProductsData}
              className="btn btn-secondary"
              style={{ cursor: 'pointer', padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
            >
              Coba Lagi
            </button>
          </div>
        ) : productList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFFFFF', borderRadius: '24px', border: '1px solid rgba(24,24,24,0.08)' }}>
            <p style={{ color: '#5C5C5C', fontSize: '0.95rem' }}>Belum ada produk yang tersedia.</p>
          </div>
        ) : (
          <div className="product-cards-grid" id="productGrid">
            {productList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProduct.id === product.id}
                onClick={() => handleProductSelect(product)}
                actionLabel="PRATINJAU LANGSUNG"
              />
            ))}
          </div>
        )}

        {/* Far Right Corner Fixed Interactive Keychain Preview Stage */}
        <div
          className={`shop-preview-stage ${isStageActive ? 'active' : ''} ${isStageFadeOut ? 'fade-out' : ''}`}
        >
          <div id="shopPlayground"></div>
          <div id="shopCharmStage" ref={stageRef}>
            <svg id="shopCordSvg">
              <defs>
                <linearGradient id="shopSilverMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#e2e8f0" />
                  <stop offset="60%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <filter id="shopDropShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.18" />
                </filter>
              </defs>
              <g id="shopKeyRingGroup" ref={keyRingRef} filter="url(#shopDropShadow)">
                <circle cx="0" cy="0" r="5.5" fill="none" stroke="url(#shopSilverMetal)" strokeWidth="2.4" />
                <circle cx="0" cy="0" r="2.8" fill="#1f1f24" />
              </g>
              <path
                id="shopCordPath"
                ref={cordPathRef}
                fill="none"
                stroke="#161619"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#shopDropShadow)"
              />
              <g id="shopCrimpGroup" ref={crimpRef} filter="url(#shopDropShadow)">
                <rect x="-3.5" y="-10" width="7" height="10" rx="1.5" fill="url(#shopSilverMetal)" stroke="#334155" strokeWidth="0.8" />
                <line x1="-1" y1="-8" x2="-1" y2="0" stroke="#ffffff" strokeWidth="1.1" opacity="0.9" />
                <circle cx="0" cy="3.5" r="3.5" fill="none" stroke="url(#shopSilverMetal)" strokeWidth="1.8" />
                <path d="M -3.5 7 C -3.5 13 3.5 13 3.5 7 C 3.5 4.5 1.8 3.5 0 3.5 C -1.8 3.5 -3.5 4.5 -3.5 7 Z" fill="none" stroke="url(#shopSilverMetal)" strokeWidth="1.8" />
                <line x1="-2" y1="6" x2="1" y2="9.5" stroke="url(#shopSilverMetal)" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            </svg>
            {activeProduct?.image || selectedProduct.image ? (
              <img
                id="shopCharmPreview"
                ref={charmRef}
                src={activeProduct?.image || selectedProduct.image}
                alt={activeProduct?.name || selectedProduct.name}
                draggable={false}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '0';
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
