export interface CraftsmanshipFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface HomepageContent {
  hero: {
    kicker: string;
    title: string;
    sub: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
    heroImage: string;
  };
  brandStatement: {
    pill: string;
    title: string;
    sub: string;
    specs: string[];
    buttonText: string;
    buttonLink: string;
    image: string;
    badge: string;
  };
  categorySection: {
    kicker: string;
    title: string;
    sub: string;
  };
  craftsmanship: {
    kicker: string;
    title: string;
    sub: string;
    image: string;
    imgBadge: string;
    features: CraftsmanshipFeature[];
  };
  journal: {
    kicker: string;
    title: string;
    sub: string;
  };
  cta: {
    badge: string;
    title: string;
    sub: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
    features: string[];
  };
  updatedAt?: string;
}

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  hero: {
    kicker: 'KOLEKSI YANG KAMU SUKAI',
    title: 'HAL KECIL. MAKNA BESAR.',
    sub: 'Gantungan kunci & charm penuh makna untuk menemani harimu dengan karakter dan keceriaan.',
    primaryBtnText: 'BELANJA KOLEKSI',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'JELAJAHI LILLO',
    secondaryBtnLink: '/about',
    heroImage: '',
  },
  brandStatement: {
    pill: '✨ RILIS EDISI TERBATAS',
    title: 'SENTUHAN MODERN UNTUK SETIAP MOMEN',
    sub: 'Temukan koleksi gantungan kunci & charm buatan tangan presisi tinggi yang dirancang untuk membawa cerita, gaya, dan karakter unik dalam setiap langkahmu.',
    specs: ['✦ Finis Dipoles Tangan', '✦ Resin Tahan Air', '✦ Tag Berantai Seri'],
    buttonText: 'JELAJAHI PRODUK TERBARU',
    buttonLink: '/collection',
    image: '',
    badge: 'KOLEKSI 2026',
  },
  categorySection: {
    kicker: 'KOLEKSI TERBARU LILLO',
    title: 'TEMUKAN FAVORIT DIRI.',
    sub: 'Aksesoris kecil berkualitas tinggi untuk melengkapi tas dan barang bawaan harianmu.',
  },
  craftsmanship: {
    kicker: 'KERAJINAN & DETAIL',
    title: 'DIBUAT DENGAN PRESISI TINGGI.',
    sub: 'Setiap charm LILLO dibuat melalui proses teliti yang memadukan kerajinan logam tradisional dan estetika modern.',
    image: '',
    imgBadge: 'EST. 2026 — BUATAN STUDIO LILLO',
    features: [
      {
        icon: '01',
        title: 'Kuningan Solid & Kilau Logam',
        desc: 'Dibuat dari paduan kuningan solid dengan lapisan perak dan emas yang tahan terhadap pemakaian harian.',
      },
      {
        icon: '02',
        title: 'Pigmen Warna Enamel Tangan',
        desc: 'Warna enamel dioleskan secara manual dan dilapisi resin bening anti-gores & tahan sinar UV.',
      },
      {
        icon: '03',
        title: 'Tali Lanyard Anyam Tahan Tarik',
        desc: 'Tali anyam bulat berkekuatan tinggi dengan cincin klem perak solid untuk keamanan ekstra.',
      },
    ],
  },
  journal: {
    kicker: 'CERITA & JURNAL',
    title: 'KISAH DI BALIK CHARM.',
    sub: 'Temukan cerita bagaimana aksesoris kecil LILLO menemani perjalanan harian para pemiliknya.',
  },
  cta: {
    badge: '✨ TINGKATKAN GAYA HARIANMU',
    title: 'SIAP MENEMUKAN CHARM IMPAPANMU?',
    sub: 'Bawa kenangan indah dan karakter unikmu ke mana saja. Miliki koleksi eksklusif LILLO yang dibuat dengan lapisan perak & enamel berkualitas tinggi.',
    primaryBtnText: 'BELANJA SEKARANG',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'LIHAT SEMUA CHARM',
    secondaryBtnLink: '/collection',
    features: [
      '🚚 Gratis Ongkir Min. 2 Pcs',
      '✨ Finis Resin Enamel & Platinum',
      '🎁 Kotak Hadiah & Kartu Garansi Original',
    ],
  },
  updatedAt: new Date().toISOString(),
};
