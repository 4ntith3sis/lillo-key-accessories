/**
 * LILLO seed source data — SINGLE SOURCE OF TRUTH for seeding.
 */

export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface SeedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categorySlug: string;
  /** Local asset filenames under frontend/public/assets (uploaded to Storage). */
  imageFiles: string[];
}

export interface SeedInventory {
  productSlug: string;
  stock: number;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  { id: 'luck', name: 'LUCK', slug: 'luck', description: 'Lucky Charms & Traditional Symbols' },
  { id: 'animals', name: 'ANIMALS', slug: 'animals', description: 'Cute & Majestic Creature Charms' },
  { id: 'studio', name: 'STUDIO', slug: 'studio', description: 'Craftsmanship & Music Accessories' },
  { id: 'play', name: 'PLAY', slug: 'play', description: 'Toys & Gaming Accessories' },
  { id: 'treats', name: 'TREATS', slug: 'treats', description: 'Treats & Everyday Joys' },
];

const DUMMY_PRICE = 25000;

const CAT_LABEL: Record<string, string> = {
  luck: 'Luck',
  animals: 'Animals',
  studio: 'Studio',
  play: 'Play',
  treats: 'Treats',
};

function product(
  id: string,
  name: string,
  categorySlug: string,
  imageFiles: string[]
): SeedProduct {
  return {
    id,
    name,
    slug: id,
    description: `${name} — a ${CAT_LABEL[categorySlug] || categorySlug} charm from the LILLO collection.`,
    price: DUMMY_PRICE,
    categorySlug,
    imageFiles,
  };
}

export const SEED_PRODUCTS: SeedProduct[] = [
  product('drishti', 'Drishti Bomma', 'luck', []),
  product('catbell', 'Zhaocai Bell', 'luck', []),
  product('ace', 'Ace', 'animals', []),
  product('locket', 'Your Photo Locket', 'luck', []),
  product('nimbu', 'Nimbu-Mirchi', 'luck', []),
  product('hamsa', 'Hamsa', 'luck', []),
  product('daruma', 'Daruma', 'luck', []),
  product('maneki', 'Maneki-neko', 'luck', []),
  product('knot', 'Chinese Knot', 'luck', []),
  product('buddhaeyes', 'Buddha Eyes', 'luck', []),
  product('dreamcatcher', 'Dreamcatcher', 'luck', []),
  product('ojodedios', 'Ojo de Dios', 'luck', []),
  product('cornicello', 'Cornicello', 'luck', []),
  product('dalahorse', 'Dala Horse', 'luck', []),
  product('luckypig', 'Lucky Pig', 'luck', []),
  product('figa', 'Figa', 'luck', []),
  product('cowrie', 'Cowrie', 'luck', []),
  product('clover', 'Four-leaf Clover', 'luck', []),
  product('ayyanar', 'Ayyanar Horse', 'luck', []),
  product('kaalai', 'Jallikattu Bull', 'animals', []),
  product('vilakku', 'Kuthu Vilakku', 'luck', []),
  product('bommai', 'Nodding Doll', 'play', []),
  product('parai', 'Parai Drum', 'studio', []),
  product('patang', 'Patang Kite', 'play', []),
  product('kulhad', 'Kulhad Chai', 'treats', []),
];

export const SEED_INVENTORY: SeedInventory[] = SEED_PRODUCTS.map((p, idx) => ({
  productSlug: p.slug,
  stock: idx % 4 === 0 ? 0 : 15 - (idx % 5), // mix of in-stock (15, 14, etc) and out-of-stock (0)
}));
