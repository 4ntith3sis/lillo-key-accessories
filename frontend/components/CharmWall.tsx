'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { charms, CharmMeta, getCharmGeometry } from '@/lib/charms';
import { getProducts, getCategories } from '@/lib/api';
import { Product } from '@/types/product';

function buildCharmMeta(products: Product[]): CharmMeta[] {
  const out: CharmMeta[] = [];
  for (const p of products) {
    const img = (Array.isArray(p.images) && p.images[0]) || p.image || '';
    // Products without an image are skipped — never substitute another product's image.
    if (!img) continue;
    const key = p.slug || p.id || p.$id || '';
    const geo = getCharmGeometry(key);
    const prodId = p.$id || p.id || key || `p_${out.length}`;
    const prodSlug = p.slug || p.id || p.$id || prodId;
    out.push({
      id: prodId,
      slug: prodSlug,
      name: p.name || 'Charm',
      // Use the product's own categoryId from the API as the category key.
      // Previously this looked up cat from the static charms.ts template and
      // fell back to 'luck' for every unmatched product — ignoring categoryId.
      cat: p.categoryId || p.category || charms.find((c) => c.id === key)?.cat || 'other',
      ...geo,
      image: img,
    });
  }
  return out;
}

export default function CharmWall() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyInRef = useRef<HTMLDivElement>(null);
  const copyOutRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);

  const metaRef = useRef<CharmMeta[]>([]);
  // Map from categoryId → display name, built from GET /api/categories.
  // Stored as a ref so the animation closure can read it without re-running.
  const catNameMapRef = useRef<Map<string, string>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch products and categories in parallel — both needed before wall can render.
        const [raw, categories] = await Promise.all([getProducts(), getCategories()]);
        if (!mounted) return;

        // Build categoryId → display name map from the live categories list.
        // This means any category created via Admin will appear correctly without
        // a frontend code change.
        const nameMap = new Map<string, string>();
        for (const cat of categories) {
          // Category.$id is the Appwrite document ID used as the relation key in products.
          if (cat.$id && cat.name) nameMap.set(cat.$id, cat.name);
        }
        catNameMapRef.current = nameMap;

        const built = buildCharmMeta(raw);
        metaRef.current = built;
        setCount(built.length);
      } catch (err: unknown) {
        // API failure → show the wall empty (no fake/static product data).
        console.warn('CharmWall: Failed to load products from API:', err);
        if (mounted) {
          metaRef.current = [];
          setCount(0);
        }
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const sec = sectionRef.current;
    const cv = canvasRef.current;
    const stage = stageRef.current;
    const copyIn = copyInRef.current;
    const copyOut = copyOutRef.current;
    const nameEl = nameRef.current;
    const countEl = countRef.current;
    const railEl = railRef.current;

    if (!sec || !cv || !cv.getContext || !stage || !copyIn || !copyOut || !nameEl || !countEl || !railEl) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let queued = false;
    let ready = false;
    let vis = true;
    let wasFlat: boolean | null = null;

    const K = 1.15;
    const DEPTH = 40;
    const NEAR = 0.46;
    const ROWGAP = 1.13;
    const HOLD = 0.10;
    const TRAVEL = 0.72;
    const ASM = 0.34;
    const GATHER = 0.20;
    const STAG = 0.22;
    const SWING = 0.88;

    const WALL_META = metaRef.current;
    // Products from the database are the single source of truth for the wall.
    const meta = WALL_META;
    // Empty wall (no products / API unavailable): keep the section stable, no animation.
    if (meta.length === 0) return;
    let C: any[] = [];
    let motes: any[] = [];
    let hits: any[] = [];
    const full: Record<string, HTMLImageElement | false | null> = {};
    const BEADS = ['#E06A58', '#181818', '#888888'];

    function drawSilverChainOnCanvas(cCtx: CanvasRenderingContext2D, oLpx: number, bow: number, scale: number, alpha: number) {
      if (oLpx <= 2) return;
      cCtx.save();
      cCtx.globalAlpha = alpha;

      const cordW = Math.max(1.8, Math.min(2.4, scale * 0.008));
      const crimpH = Math.max(5, Math.min(13, scale * 0.075));
      const crimpW = Math.max(3.0, crimpH * 0.55);
      const cordH = Math.max(2, oLpx - crimpH - crimpW * 1.1);

      cCtx.strokeStyle = '#161619';
      cCtx.lineWidth = cordW;
      cCtx.lineCap = 'round';
      cCtx.lineJoin = 'round';
      cCtx.beginPath();
      cCtx.moveTo(0, 0);
      cCtx.quadraticCurveTo(bow, cordH * 0.55, 0, cordH);
      cCtx.stroke();

      if (scale > 8) {
        cCtx.save();
        cCtx.translate(0, cordH);

        cCtx.fillStyle = '#94a3b8';
        cCtx.strokeStyle = '#334155';
        cCtx.lineWidth = Math.max(0.5, crimpW * 0.14);
        if (cCtx.roundRect) {
          cCtx.roundRect(-crimpW * 0.5, 0, crimpW, crimpH, crimpW * 0.25);
        } else {
          cCtx.fillRect(-crimpW * 0.5, 0, crimpW, crimpH);
        }
        cCtx.fill();
        cCtx.stroke();

        cCtx.fillStyle = '#ffffff';
        cCtx.fillRect(-crimpW * 0.2, 1, crimpW * 0.35, crimpH - 2);

        const ringY = crimpH + crimpW * 0.38;
        cCtx.strokeStyle = '#cbd5e1';
        cCtx.lineWidth = Math.max(0.7, crimpW * 0.24);
        cCtx.beginPath();
        cCtx.arc(0, ringY, crimpW * 0.38, 0, Math.PI * 2);
        cCtx.stroke();

        const hookY = ringY + crimpW * 0.6;
        cCtx.strokeStyle = '#e2e8f0';
        cCtx.lineWidth = Math.max(0.6, crimpW * 0.2);
        cCtx.beginPath();
        cCtx.arc(0, hookY, crimpW * 0.48, 0.2, Math.PI * 1.8);
        cCtx.stroke();

        cCtx.restore();
      }

      cCtx.restore();
    }

    function sharp(c: any) {
      const got = full[c.id];
      if (got !== undefined) return got || null;
      full[c.id] = null;
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        full[c.id] = im;
        // Contain scaling: fit the image inside the charm's bounding box (hw × hw)
        // while preserving its true aspect ratio.
        //   Portrait / square → hw stays, ww = hw × (imgW / imgH)  ≤ hw
        //   Landscape         → ww = hw,  hw = hw / (imgW / imgH)  ≤ original hw
        // This makes every charm occupy the same maximum bounding box regardless
        // of image proportions — fixing the unequal visual sizes.
        if (im.naturalWidth > 0 && im.naturalHeight > 0) {
          const box = c.hw; // bounding box edge = current hw (same for all charms)
          const imgRatio = im.naturalWidth / im.naturalHeight;
          if (imgRatio >= 1) {
            // Landscape or square: cap the width side
            c.ww = box;
            c.hw = box / imgRatio;
          } else {
            // Portrait: height fills the box, width is narrower
            c.hw = box;
            c.ww = box * imgRatio;
          }
        }
        kick();
      };
      im.onerror = () => {
        full[c.id] = false;
      };
      if (c.image) im.src = c.image;
      return null;
    }

    let W = 0;
    let H = 0;
    let DPR = 1;
    let FOC = 1;
    let COLS = 11;
    let ROWS = 8;
    let COLGAP = 1.3;
    let LSQW = 1;

    let camEnd = 0;
    let fired = false;
    let lastT = 0;
    let lastCam = 0;
    let focus: any = null;
    let focusAt = 0;
    let rival: any = null;
    let rivalAt = 0;
    let hover: any = null;
    let parX = 0;
    let parY = 0;
    let parTX = 0;
    let parTY = 0;

    let mode = 'walk';
    let takeC: any = null;
    let lift = 0;

    const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
    const flat = () => still;

    function rng(a: number) {
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

    // Known category sort order — unlisted categories are placed after known ones.
    // Sorting is still by categoryId key (unchanged), not by display name.
    const CATORD: Record<string, number> = { luck: 0, animals: 1, myth: 2, play: 3, studio: 4, treats: 5, fashion: 6 };

    /**
     * Resolve the display name for a categoryId key.
     * Reads from catNameMapRef — the live Map built from GET /api/categories.
     * Returns the real category name (e.g. "Building") or empty string if the
     * category is not found, so the raw ID is never shown in the UI.
     */
    const catDisplayName = (key: string): string =>
      catNameMapRef.current.get(key) ?? '';

    function build() {
      const N = meta.length;
      const r = rng(88088);
      const walk = meta.map((_, i) => i);
      for (let i = N - 1; i > 0; i--) {
        const j = (r() * (i + 1)) | 0;
        const t = walk[i];
        walk[i] = walk[j];
        walk[j] = t;
      }
      const rank: number[] = [];
      walk.forEach((idx, k) => (rank[idx] = k));

      const slotOf: number[] = [];
      meta
        .map((_, i) => i)
        .sort((a, b) => (CATORD[meta[a].cat] || 0) - (CATORD[meta[b].cat] || 0) || a - b)
        .forEach((idx, slot) => (slotOf[idx] = slot));

      const START = -1;
      camEnd = START + DEPTH + 5.5;

      C = meta.map((m: any, i: number) => {
        const k = rank[i];
        const t = (k + 0.5) / N;
        // Uniform base size for all charms — no template-ratio (m.h/186).
        // The m.h/186 factor caused products using DEFAULT_CHARM_GEOMETRY
        // (h=110) to appear ~41% smaller than named charms (h=186).
        // Slight random variation (±7%) is kept for natural visual rhythm.
        const hw = 1.12 * (0.93 + r() * 0.15);
        return {
          id: m.id,
          slug: m.slug || m.id,
          name: m.name,
          cat: m.cat,
          image: m.image,
          sx: m.x,
          sy: m.y,
          sw: m.w,
          sh: m.h,
          bx: m.bx,
          by: m.by,
          bw: m.bw,
          bh: m.bh,
          hx: m.hx === undefined ? 0.5 : m.hx,
          hw: hw,
          ww: hw, // placeholder — corrected to true aspect ratio in sharp() onload
          fz: 2.2 + t * DEPTH + (r() - 0.5) * 0.9,
          fx: (k % 2 ? 1 : -1) * (0.95 + Math.pow(r(), 1.3) * 5.2),
          fa: -3.8 + (r() - 0.5) * 0.5,
          fl: 0.7 + Math.pow(r(), 0.9) * 3.9,
          slot: slotOf[i],
          col: 0,
          wz: 0,
          wx: 0,
          wa: 0,
          wl: 1,
          jz: (r() - 0.5) * 0.06,
          ph: r() * 6.283,
          per: 0.7 + r() * 0.9,
          br: 0.05 + r() * 0.09,
          bead: i % 5 === 2 ? i % 3 : -1,
          ang: (r() - 0.5) * 0.16,
          vel: 0,
          gate: ASM + (slotOf[i] / N) * STAG,
        };
      });

      const at = (id: string) => C.findIndex((c) => c.id === id);
      const put = (i: number, z: number, x: number, a: number, l: number) => {
        // Guard both underflow (i < 0) AND overflow (i >= C.length).
        // The fallback indices (0-4) below can exceed C.length when products
        // have been deleted and the named charms are no longer in the wall.
        if (i < 0 || i >= C.length) return;
        const c = C[i];
        c.fz = START + z;
        c.fx = x;
        c.fa = a;
        c.fl = l;
      };
      const subject = at('drishti') >= 0 ? at('drishti') : 0;
      put(subject, 10.4, -1.42, -3.5, 4.95);
      put(at('maneki') >= 0 ? at('maneki') : 1, 3.0, -2.1, -3.5, 1.3);
      put(at('daruma') >= 0 ? at('daruma') : 2, 3.7, 2.2, -3.6, 2.9);
      put(at('nimbu') >= 0 ? at('nimbu') : 3, 5.1, -2.45, -3.7, 0.95);
      put(at('hamsa') >= 0 ? at('hamsa') : 4, 6.0, 2.35, -3.55, 3.2);

      if (H > W) {
        const LSQ = Math.max(0.45, Math.min(1, (W / H) * 1.5));
        for (let i = 0; i < C.length; i++) C[i].fx *= LSQ;
        LSQW = LSQ;
      } else LSQW = 1;

      motes = [];
      for (let i = 0; i < 170; i++) {
        motes.push({
          x: (r() - 0.5) * 17,
          y: (r() - 0.5) * 11,
          z: r() * (DEPTH + 34),
          s: 0.4 + r() * 1.5,
          a: 0.1 + r() * 0.34,
        });
      }
    }

    function wallGeom() {
      if (!C.length || !W || !H) return;
      const wide = W / H >= 1.05;
      COLS = wide ? 5 : 5;
      ROWS = Math.ceil(C.length / COLS);
      const half = (COLS - 1) / 2;
      const bow = 9.2 * (1 - Math.cos(half * 0.115));
      const mag = 1.14;
      const needH = (ROWS - 1) * ROWGAP + 1.3;
      const pad = flat() ? 1.28 : 1.34;
      const d = Math.max(needH * pad * K * (mag / 1.14), 9);
      const dE = Math.max(2, d - bow);
      COLGAP = clamp((W * 0.5 * (flat() ? 0.76 : 0.82) * dE) / (FOC * half), 1.02, 2.1);
      const topY = -((ROWS - 1) * ROWGAP) / 2 - 0.54;
      for (let i = 0; i < C.length; i++) {
        const c = C[i];
        c.col = c.slot % COLS;
        const row = (c.slot / COLS) | 0;
        const a = (c.col - (COLS - 1) / 2) * 0.115;
        c.wx = (c.col - (COLS - 1) / 2) * COLGAP;
        c.wz = camEnd + d - 9.2 * (1 - Math.cos(a)) + row * 0.05 + c.jz;
        c.wa = topY - 1.45;
        c.wl = topY + row * ROWGAP - c.wa;
      }
    }

    function resize() {
      if (!sec || !cv || !ctx) return;
      const box = cv.getBoundingClientRect();
      if (!box.width || !box.height) return;
      DPR = Math.min(window.devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 2);
      W = box.width;
      H = box.height;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      FOC = K * H;
      wallGeom();
    }

    function progress() {
      if (!sec) return 1;
      if (flat()) return 1;
      const r = sec.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      if (span <= 0) return 1;
      return clamp(-r.top / span, 0, 1);
    }

    const START = -1;
    const camAt = (p: number) => START + smooth(clamp((p - HOLD) / (TRAVEL - HOLD), 0, 1)) * (DEPTH + 5.5);

    function draw(now: number) {
      queued = false;
      if (!ready || !ctx || !sec || !copyIn || !copyOut || !stage || !nameEl || !countEl || !railEl) return;
      const F = flat();
      if (F !== wasFlat) {
        wasFlat = F;
        if (F) {
          if (copyIn.parentNode !== sec) sec.insertBefore(copyIn, stage);
          [copyIn, copyOut].forEach((el) => {
            if (el) {
              el.style.opacity = '';
              el.style.transform = '';
              el.style.pointerEvents = '';
            }
          });
          nameEl.style.opacity = '';
          countEl.style.opacity = '';
          if (railEl.parentNode) (railEl.parentNode as HTMLElement).style.opacity = '';
          lastCam = camAt(1);
          for (let i = 0; i < C.length; i++) C[i].vel = 0.055 * Math.sqrt(9.8 / Math.max(0.5, C[i].wl));
        } else if (copyIn.parentNode !== stage) {
          stage.insertBefore(copyIn, copyOut);
        }
        resize();
      }

      const dt = still ? 0 : Math.min((now - lastT) / 1000 || 0.016, 0.05);
      lastT = now;
      const p = F ? 1 : progress();
      const camZ = camAt(p);
      const camV = (camZ - lastCam) / Math.max(dt || 0.016, 0.001);
      lastCam = camZ;

      const settle = smooth(clamp((p - TRAVEL) / 0.28, 0, 1));
      let camX = F ? 0 : (1 - settle) * 0.42 * LSQW * Math.sin(p * 6.1);
      let camY = F ? 0 : (1 - settle) * (-0.75 + 0.18 * Math.sin(p * 3.4 + 1.1));

      if (!still && !F) {
        parX += (parTX - parX) * 0.055;
        parY += (parTY - parY) * 0.055;
        camX += parX * 0.5;
        camY += parY * 0.3;
      }

      if (!fired && p >= SWING && !F) {
        fired = true;
        for (let i = 0; i < C.length; i++) C[i].vel += 0.22 * Math.sqrt(9.8 / Math.max(0.5, C[i].wl));
      }
      if (fired && p < SWING - 0.01) fired = false;

      ctx.fillStyle = '#F8F6F0';
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = F ? H * 0.5 : H * 0.54;

      if (lift > 0) {
        ctx.save();
        ctx.translate(0, -lift);
      }

      const SPAN = DEPTH + 34;
      ctx.fillStyle = '#E06A58';
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const d = (((m.z - camZ) % SPAN) + SPAN) % SPAN + 0.6;
        const s = FOC / d;
        const x = cx + (m.x - camX) * s;
        const y = cy + (m.y - camY) * s;
        if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
        ctx.globalAlpha = m.a * clamp(1 - d / SPAN, 0, 1) * clamp(d / 2.2, 0, 1) * 0.5;
        const r = Math.max(0.7, m.s * s * 0.006);
        ctx.fillRect(x, y, r, r);
      }
      ctx.globalAlpha = 1;

      let asm = 0;
      const draws: any[] = [];
      for (let i = 0; i < C.length; i++) {
        const c = C[i];
        const t = F ? 1 : smooth(clamp((p - c.gate) / GATHER, 0, 1));
        asm += t;
        const arc = Math.sin(t * 3.14159) * (c.fx >= 0 ? 2.9 : -2.9);
        const z = c.fz + (c.wz - c.fz) * t;
        const ax = c.fx + (c.wx - c.fx) * t + arc;
        const ay = c.fa + (c.wa - c.fa) * t;
        const L = c.fl + (c.wl - c.fl) * t;

        if (dt) {
          const g = 9.8 / Math.max(0.45, L);
          let acc = -g * Math.sin(c.ang) - 0.8 * c.vel;
          acc += c.br * (W < 900 ? 1.35 : 1) * Math.sin(now * 0.001 * c.per + c.ph) * (1 - t * 0.5);
          if (!F && t < 0.35) {
            const near = 1 - Math.abs(z - camZ) / 4.6;
            if (near > 0) {
              const lat = 1 / (1 + ax * ax * 0.3);
              acc += (ax >= 0 ? 1 : -1) * near * near * lat * clamp(camV * 0.055, 0, 2.6);
            }
          }
          c.vel += acc * dt;
          c.ang += c.vel * dt;
          if (c.ang > 0.6) {
            c.ang = 0.6;
            c.vel *= -0.35;
          }
          if (c.ang < -0.6) {
            c.ang = -0.6;
            c.vel *= -0.35;
          }
        }

        const d = z - camZ;
        if (d < NEAR) continue;
        const s = FOC / d;
        const px = cx + (ax - camX) * s;
        const py = cy + (ay - camY) * s;
        const hpx = c.hw * s;
        const wpx = c.ww * s;
        const Lpx = L * s;
        if (px + Lpx + wpx < -40 || px - Lpx - wpx > W + 40 || py > H + 40) continue;
        const chY = py + Math.cos(c.ang) * Lpx;
        if (chY > H + hpx * 0.55 || chY + hpx < -30) continue;

        const fog = 1 / (1 + Math.pow(d / (15 + 32 * t), 2.4));
        let a = fog * clamp((d - NEAR) / 3.2, 0, 1);
        if (t > 0.04 && t < 0.96) a *= clamp((d - 1.1) / 2.4, 0, 1);
        if (a < 0.012) continue;
        draws.push({ c, d, px, py, s, hpx, wpx, Lpx, a, blur: d < 2.5 ? Math.min(6, (2.5 - d) * 3.4) : 0 });
      }
      asm /= C.length;

      draws.sort((A, B) => B.d - A.d);

      const labelling = !F && p > HOLD && p < 0.62;
      if (!labelling) {
        focus = null;
        rival = null;
      } else {
        let cand: any = null;
        let best = 0;
        let cur = 0;
        for (let i = 0; i < draws.length; i++) {
          const o = draws[i];
          if (o.d < 2.1 || o.d > 11 || o.a < 0.35) continue;
          if (Math.abs(o.px - cx) > W * 0.26) continue;
          let sc = 1 / (1 + Math.abs(o.d - 5.5));
          const top = o.py + Math.cos(o.c.ang) * o.Lpx;
          if (top < 30 || top + o.hpx > H - 30) sc *= 0.3;
          if (o.c === focus) cur = sc;
          if (sc > best) {
            best = sc;
            cand = o.c;
          }
        }
        if (hover) {
          focus = hover;
          rival = null;
          focusAt = now;
        } else if (!focus || !cur) {
          if (cand && cand !== focus) {
            focus = cand;
            focusAt = now;
            rival = null;
          }
        } else if (cand && cand !== focus && best > cur * 1.15) {
          if (rival !== cand) {
            rival = cand;
            rivalAt = now;
          } else if (now - rivalAt > 180 && now - focusAt > 500) {
            focus = cand;
            focusAt = now;
            rival = null;
          }
        } else rival = null;
      }

      hits.length = 0;
      let soft = 0;
      let fRect: any = null;
      for (let i = 0; i < draws.length; i++) {
        const o = draws[i];
        const c = o.c;
        if (takeC && c === takeC && mode !== 'walk') continue;
        if (lift >= H * 1.4) continue;

        ctx.save();
        ctx.translate(o.px, o.py);
        ctx.rotate(c.ang);

        const bow = clamp(-c.vel * 5, -8, 8);
        drawSilverChainOnCanvas(ctx, o.Lpx, bow, o.s, o.a);

        if (c.bead >= 0 && o.s > 10) {
          const t7 = 0.3 + c.bead * 0.055;
          const by = o.Lpx * t7;
          const bxp = bow * 2 * t7 * (1 - t7);
          ctx.globalAlpha = o.a * 0.9;
          ctx.fillStyle = BEADS[c.bead % 3];
          ctx.beginPath();
          ctx.arc(bxp, by, Math.max(1.1, 0.02 * o.s), 0, 6.283);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = o.a;

        // Each charm is drawn from its own product image (lazily loaded).
        const hi = sharp(c);
        let src: any = hi;
        let ax = 0;
        let ay = 0;
        let aw = src ? src.naturalWidth : 0;
        let ah = src ? src.naturalHeight : 0;
        const hang = -o.wpx * c.hx;
        const mid = o.wpx * (0.5 - c.hx);
        if (src && o.blur > 0.6 && soft < 2) {
          soft++;
          const k = o.blur;
          ctx.globalAlpha = o.a * 0.3;
          ctx.drawImage(src, ax, ay, aw, ah, hang - k, o.Lpx - k, o.wpx, o.hpx);
          ctx.drawImage(src, ax, ay, aw, ah, hang + k, o.Lpx - k, o.wpx, o.hpx);
          ctx.drawImage(src, ax, ay, aw, ah, hang - k, o.Lpx + k, o.wpx, o.hpx);
          ctx.drawImage(src, ax, ay, aw, ah, hang + k, o.Lpx + k, o.wpx, o.hpx);
        } else if (src) {
          ctx.drawImage(src, ax, ay, aw, ah, hang, o.Lpx, o.wpx, o.hpx);
        }
        if (c === focus) {
          const sn2 = Math.sin(c.ang);
          const cs2 = Math.cos(c.ang);
          fRect = {
            x: o.px + sn2 * (o.Lpx + o.hpx / 2) + cs2 * mid,
            y: o.py + cs2 * (o.Lpx + o.hpx / 2) - sn2 * mid,
            w: o.wpx,
            h: o.hpx,
          };
          ctx.globalAlpha = Math.min(1, o.a + 0.3);
          ctx.strokeStyle = '#E06A58';
          ctx.lineWidth = 1;
          const uy = o.Lpx + o.hpx + Math.max(3, o.hpx * 0.045);
          const uw = o.wpx * 0.38;
          ctx.beginPath();
          ctx.moveTo(mid - uw, uy);
          ctx.lineTo(mid + uw, uy);
          ctx.stroke();
        }
        ctx.restore();
        if (o.d > 1.1 && o.a > 0.32) {
          const sn = Math.sin(c.ang);
          const cs = Math.cos(c.ang);
          hits.push({
            x: o.px + sn * (o.Lpx + o.hpx / 2) + cs * o.wpx * (0.5 - c.hx),
            y: o.py + cs * (o.Lpx + o.hpx / 2) - sn * o.wpx * (0.5 - c.hx),
            rx: o.wpx / 2 + 4,
            ry: o.hpx / 2 + 4,
            id: c.id,
            c: c,
            w: o.wpx,
            h: o.hpx,
            ax: o.px,
            ay: o.py,
            L: o.Lpx,
          });
        }
      }
      ctx.globalAlpha = 1;
      if (lift > 0) ctx.restore();

      if (!F) {
        const fin = 1 - smooth(clamp((p - 0.03) / 0.1, 0, 1));
        copyIn.style.opacity = mode === 'walk' ? String(fin) : '0';
        copyIn.style.transform = 'translateX(-50%) translateY(' + ((1 - fin) * -26).toFixed(1) + 'px)';

        const fout = mode === 'walk' ? smooth(clamp((p - 0.895) / 0.075, 0, 1)) : 0;
        copyOut.style.opacity = String(fout);
        copyOut.style.transform = 'translateX(-50%) translateY(' + ((1 - fout) * 26).toFixed(1) + 'px)';
        copyOut.style.pointerEvents = fout > 0.6 ? 'auto' : 'none';

        railEl.style.width = (p * 100).toFixed(2) + '%';
        if (railEl.parentNode) (railEl.parentNode as HTMLElement).style.opacity = String(1 - smooth(clamp((p - 0.86) / 0.08, 0, 1)));

        if (focus && fRect) {
          if (focus.id !== nameEl.dataset.id) {
            nameEl.dataset.id = focus.id;
            if (nameEl.firstElementChild) (nameEl.firstElementChild as HTMLElement).textContent = focus.name;
            if (nameEl.lastElementChild) (nameEl.lastElementChild as HTMLElement).textContent = catDisplayName(focus.cat);
          }
          const LW = 210;
          const edge = fRect.w * 0.5 + 16;
          const flip = fRect.x > W * 0.56;
          let lx = flip ? fRect.x - edge - LW - 44 : fRect.x + edge + 44;
          lx = Math.max(16, Math.min(W - LW - 16, lx));
          const ly = Math.max(40, Math.min(H - 132, fRect.y - 14));
          const lead = Math.max(14, flip ? fRect.x - edge - (lx + LW) : lx - (fRect.x + edge));
          nameEl.classList.toggle('flip', flip);
          nameEl.style.setProperty('--lead', lead.toFixed(0) + 'px');
          nameEl.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
          nameEl.style.opacity = '1';
        } else {
          nameEl.style.opacity = '0';
        }

        const cshow = p > 0.06 && p < 0.66 ? 1 : 0;
        countEl.style.opacity = String(cshow);
        if (cshow) {
          let n = 0;
          for (let i = 0; i < C.length; i++) if (C[i].fz < camZ) n++;
          n = Math.max(n, Math.round(asm * C.length));
          if (countEl.firstElementChild) {
            countEl.firstElementChild.textContent = String(n);
          }
        }
      }

      if (vis && !still) kick();
    }

    function kick() {
      if (!queued && ready && vis) {
        queued = true;
        animId = requestAnimationFrame(draw);
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!ready || !cv) return;
      const r = cv.getBoundingClientRect();
      const px = (e.clientX - r.left) * (W / Math.max(1, r.width));
      const py = (e.clientY - r.top) * (H / Math.max(1, r.height));
      parTX = px / Math.max(1, W) - 0.5;
      parTY = py / Math.max(1, H) - 0.5;

      let hFound: any = null;
      for (let i = 0; i < hits.length; i++) {
        const t = hits[i];
        const ddx = px - t.x;
        const ddy = py - t.y;
        if (Math.hypot(ddx, ddy) < t.rx) {
          hFound = t;
          break;
        }
      }
      cv.classList.toggle('hit', !!hFound);
      hover = hFound ? hFound.c : null;
      kick();
    };

    const handlePointerLeave = () => {
      hover = null;
      parTX = 0;
      parTY = 0;
      kick();
    };

    let downPos = { x: 0, y: 0, t: 0 };
    const handlePointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY, t: performance.now() };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!ready || !cv) return;
      const dx = Math.abs(e.clientX - downPos.x);
      const dy = Math.abs(e.clientY - downPos.y);
      const dt = performance.now() - downPos.t;
      if (dx > 10 || dy > 10 || dt > 500) return;

      const r = cv.getBoundingClientRect();
      const px = (e.clientX - r.left) * (W / Math.max(1, r.width));
      const py = (e.clientY - r.top) * (H / Math.max(1, r.height));

      let hitItem: any = null;
      for (let i = 0; i < hits.length; i++) {
        const t = hits[i];
        const ddx = px - t.x;
        const ddy = py - t.y;
        if (Math.hypot(ddx, ddy) < t.rx) {
          hitItem = t;
          break;
        }
      }

      if (hitItem && hitItem.c) {
        const targetSlug = hitItem.c.slug || hitItem.c.id;
        if (targetSlug) {
          router.push(`/products/${encodeURIComponent(targetSlug)}`);
        }
      }
    };

    cv.addEventListener('pointermove', handlePointerMove);
    cv.addEventListener('pointerleave', handlePointerLeave);
    cv.addEventListener('pointerdown', handlePointerDown);
    cv.addEventListener('pointerup', handlePointerUp);

    // NATIVE SCROLL — exactly like original (passive: true, no wheel interception)
    let lastWallY = window.scrollY;
    const handleScroll = () => {
      const dy = window.scrollY - lastWallY;
      lastWallY = window.scrollY;
      // Physics impulse when scrolling through wall — matches original script.js:1271-1280
      if (ready && vis && Math.abs(dy) > 1 && mode === 'walk') {
        const p = progress();
        if (p > 0.1 && p < 0.95) {
          const im = Math.max(-22, Math.min(22, dy)) * 0.0009;
          for (let i = 0; i < C.length; i++) {
            const c = C[i];
            c.vel += im * Math.sqrt(9.8 / Math.max(0.5, c.wl)) *
              (0.7 + ((i * 2654435761) >>> 29) / 8 * 0.6 / 4 + 0.15);
          }
        }
      }
      kick();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // IntersectionObserver — matches original script.js:1376-1379
    const visObserver = new IntersectionObserver((es) => {
      vis = es[0].isIntersecting;
      if (vis) { lastT = performance.now(); kick(); }
    }, { rootMargin: '150px' });
    if (sec) visObserver.observe(sec);

    const handleResize = () => {
      resize();
      kick();
    };
    window.addEventListener('resize', handleResize, { passive: true });
    // ResizeObserver for accurate resize — matches original script.js:1375
    let roT: ReturnType<typeof setTimeout> | number = 0;
    const resizeObserver = window.ResizeObserver
      ? new ResizeObserver(() => { clearTimeout(roT); roT = setTimeout(() => { resize(); kick(); }, 120); })
      : null;
    if (resizeObserver && sec) resizeObserver.observe(sec);

    function load() {
      // Charm wall is driven entirely by product images — no static atlas.
      build();
      for (let i = 0; i < C.length; i++) sharp(C[i]);
      ready = true;
      resize();
      lastT = performance.now();
      vis = true;
      kick();
    }

    load();

    return () => {
      cv.removeEventListener('pointermove', handlePointerMove);
      cv.removeEventListener('pointerleave', handlePointerLeave);
      cv.removeEventListener('pointerdown', handlePointerDown);
      cv.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      visObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [loaded, router]);

  return (
    <section id="wall" ref={sectionRef} aria-labelledby="wallHead">
      <div
        id="collections"
        className="anchor-target"
        style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', pointerEvents: 'none' }}
      ></div>
      <div className="wall-stage" ref={stageRef}>
        {/* 2D Canvas rendering 3D Pendulum Charms (count follows charm data) */}
        <canvas
          ref={canvasRef}
          id="wallCanvas"
          role="img"
          aria-label={`All ${count} LILLO charms, each hanging from its own cord.`}
        ></canvas>

        {/* Vignette Atmosphere Veil */}
        <div className="wall-veil"></div>

        {/* Initial Overlay (Corridor Walk Start) */}
        <div className="wall-copy wall-in" ref={copyInRef}>
          <p className="kicker">PAPAN CHARM LILLO</p>
          <h2 id="wallHead" className="w-big">
            <span className="w-word">JELAJAHI KOLEKSI CHARM</span>
          </h2>
          <p className="w-flat" id="wallFlatLine">
            Setiap charm memiliki ceritanya sendiri. Jelajahi koleksinya, temukan yang mewakili dirimu, dan bawa bersama harimu.
          </p>
        </div>

        {/* Ending Overlay (Wall Gathered) */}
        <div className="wall-copy wall-out" ref={copyOutRef} aria-hidden="true">
          <p className="kicker">PAPAN CHARM LILLO</p>
          <h2>
            SEMUANYA ADA DI SINI. <em id="wallTakeLine">TEMUKAN FAVORITMU SEKARANG.</em>
          </h2>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Kembali ke Atas ↑
          </button>
        </div>

        {/* Dynamic Museum Leader Line Tooltip */}
        <div className="wall-name" id="wallName" ref={nameRef} aria-hidden="true">
          <b></b>
          <span></span>
        </div>

        {/* Charms Passed Counter — Dynamic product count */}
        <div className="wall-count" id="wallCount" ref={countRef} aria-hidden="true">
          <b>0</b> / {count}
        </div>

        {/* Bottom Scroll Progress Rail */}
        <div className="wall-rail" aria-hidden="true">
          <i id="wallRail" ref={railRef}></i>
        </div>
      </div>
    </section>
  );
}
