export interface CharmMeta {
  id: string;
  slug?: string;
  name: string;
  cat: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bx: number;
  by: number;
  bw: number;
  bh: number;
  hx: number;
  image?: string;
}

/**
 * Charm Wall GEOMETRY TEMPLATE (non-product visual config).
 *
 * This file is NOT a product source. It only supplies the per-charm layout
 * geometry the Charm Wall animation needs (sprite source rects, aspect ratio,
 * hang point, category). Product images/icons come from the Product database
 * via `GET /api/products` → `frontend/lib/api.ts`. Each product is matched to
 * this template by id/slug so the animation keeps its original proportions;
 * unknown products fall back to `DEFAULT_CHARM_GEOMETRY`.
 *
 * No hard-coded product image paths remain here.
 */
export const charms: CharmMeta[] = [
  { id: "drishti", name: "Drishti Bomma", cat: "luck", x: 5, y: 18, w: 140, h: 159, bx: 4, by: 5, bw: 360, bh: 410, hx: 0.4996 },
  { id: "catbell", name: "Zhaocai Bell", cat: "luck", x: 197, y: 5, w: 56, h: 186, bx: 1, by: 0, bw: 125, bh: 417, hx: 0.4934 },
  { id: "ace", name: "Ace", cat: "animals", x: 326, y: 5, w: 97, h: 186, bx: 3, by: 3, bw: 215, bh: 414, hx: 0.445 },
  { id: "locket", name: "Your Photo Locket", cat: "luck", x: 467, y: 5, w: 116, h: 186, bx: 0, by: 0, bw: 300, bh: 479, hx: 0.4984 },
  { id: "nimbu", name: "Nimbu-Mirchi", cat: "luck", x: 609, y: 5, w: 132, h: 186, bx: 1, by: 0, bw: 295, bh: 416, hx: 0.4961 },
  { id: "hamsa", name: "Hamsa", cat: "luck", x: 772, y: 5, w: 105, h: 186, bx: 4, by: 2, bw: 234, bh: 416, hx: 0.512 },
  { id: "daruma", name: "Daruma", cat: "luck", x: 905, y: 17, w: 140, h: 161, bx: 4, by: 4, bw: 356, bh: 410, hx: 0.4975 },
  { id: "maneki", name: "Maneki-neko", cat: "luck", x: 1065, y: 5, w: 120, h: 186, bx: 6, by: 5, bw: 263, bh: 409, hx: 0.5482 },
  { id: "knot", name: "Chinese Knot", cat: "luck", x: 1239, y: 5, w: 71, h: 186, bx: 3, by: 0, bw: 160, bh: 417, hx: 0.495 },
  { id: "buddhaeyes", name: "Buddha Eyes", cat: "luck", x: 1383, y: 5, w: 84, h: 186, bx: 3, by: 2, bw: 188, bh: 414, hx: 0.4933 },
  { id: "dreamcatcher", name: "Dreamcatcher", cat: "luck", x: 1523, y: 5, w: 103, h: 186, bx: 4, by: 3, bw: 229, bh: 414, hx: 0.4955 },
  { id: "ojodedios", name: "Ojo de Dios", cat: "luck", x: 5, y: 208, w: 140, h: 172, bx: 2, by: 4, bw: 334, bh: 411, hx: 0.4983 },
  { id: "cornicello", name: "Cornicello", cat: "luck", x: 206, y: 201, w: 37, h: 186, bx: 4, by: 4, bw: 81, bh: 412, hx: 0.4922 },
  { id: "dalahorse", name: "Dala Horse", cat: "luck", x: 307, y: 201, w: 135, h: 186, bx: 5, by: 3, bw: 300, bh: 412, hx: 0.1995 },
  { id: "luckypig", name: "Lucky Pig", cat: "luck", x: 455, y: 201, w: 139, h: 186, bx: 4, by: 4, bw: 308, bh: 412, hx: 0.4932 },
  { id: "figa", name: "Figa", cat: "luck", x: 636, y: 201, w: 77, h: 186, bx: 3, by: 5, bw: 171, bh: 411, hx: 0.489 },
  { id: "cowrie", name: "Cowrie", cat: "luck", x: 806, y: 201, w: 37, h: 186, bx: 1, by: 0, bw: 83, bh: 417, hx: 0.4959 },
  { id: "clover", name: "Four-leaf Clover", cat: "luck", x: 912, y: 201, w: 125, h: 186, bx: 5, by: 4, bw: 276, bh: 412, hx: 0.4966 },
  { id: "ayyanar", name: "Ayyanar Horse", cat: "luck", x: 1071, y: 201, w: 107, h: 186, bx: 0, by: 0, bw: 242, bh: 420, hx: 0.4859 },
  { id: "kaalai", name: "Jallikattu Bull", cat: "animals", x: 1226, y: 201, w: 98, h: 186, bx: 0, by: 0, bw: 221, bh: 420, hx: 0.549 },
  { id: "vilakku", name: "Kuthu Vilakku", cat: "luck", x: 1395, y: 201, w: 59, h: 186, bx: 0, by: 0, bw: 134, bh: 420, hx: 0.4948 },
  { id: "bommai", name: "Nodding Doll", cat: "play", x: 1529, y: 201, w: 92, h: 186, bx: 0, by: 0, bw: 207, bh: 420, hx: 0.5054 },
  { id: "parai", name: "Parai Drum", cat: "studio", x: 36, y: 397, w: 77, h: 186, bx: 0, by: 0, bw: 174, bh: 420, hx: 0.4911 },
  { id: "patang", name: "Patang Kite", cat: "play", x: 173, y: 397, w: 103, h: 186, bx: 0, by: 0, bw: 232, bh: 420, hx: 0.4929 },
  { id: "kulhad", name: "Kulhad Chai", cat: "treats", x: 322, y: 397, w: 105, h: 186, bx: 0, by: 0, bw: 236, bh: 420, hx: 0.5021 },
];

/** Geometry used for any product that has no matching entry in the template. */
export const DEFAULT_CHARM_GEOMETRY: Omit<CharmMeta, 'id' | 'name' | 'cat'> = {
  x: 0,
  y: 0,
  w: 110,
  h: 110,
  bx: 0,
  by: 0,
  bw: 110,
  bh: 110,
  hx: 0.5,
};

/** Look up visual geometry for a product id/slug; falls back to defaults. */
export function getCharmGeometry(id: string): Omit<CharmMeta, 'id' | 'name' | 'cat'> {
  const found = charms.find((c) => c.id === id);
  if (!found) return { ...DEFAULT_CHARM_GEOMETRY };
  return {
    x: found.x,
    y: found.y,
    w: found.w,
    h: found.h,
    bx: found.bx,
    by: found.by,
    bw: found.bw,
    bh: found.bh,
    hx: found.hx,
  };
}