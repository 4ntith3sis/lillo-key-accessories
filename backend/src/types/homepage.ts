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
    kicker: 'THE COLLECTION YOU LOVE',
    title: 'SMALL THINGS. BIG MEANING.',
    sub: 'Meaningful keychains & charms to accompany your days with character and joy.',
    primaryBtnText: 'SHOP COLLECTION',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'EXPLORE LILLO',
    secondaryBtnLink: '/about',
    heroImage: '',
  },
  brandStatement: {
    pill: 'LIMITED EDITION DROP',
    title: 'A MODERN TOUCH FOR EVERY MOMENT',
    sub: 'Discover high-precision handmade keychain & charm collections designed to carry stories, style, and unique character in every step you take.',
    specs: ['✦ Hand-Polished Finish', '✦ Waterproof Resin', '✦ Serial Chain Tag'],
    buttonText: 'EXPLORE NEW ARRIVALS',
    buttonLink: '/collection',
    image: '',
    badge: 'COLLECTION 2026',
  },
  categorySection: {
    kicker: "LILLO'S LATEST",
    title: 'FIND YOUR FAVORITE.',
    sub: 'High-quality small accessories to complete your bag and everyday carry.',
  },
  craftsmanship: {
    kicker: 'CRAFTSMANSHIP & DETAIL',
    title: 'MADE WITH HIGH PRECISION.',
    sub: 'Every LILLO charm is made through a meticulous process combining traditional metal craft and modern aesthetics.',
    image: '',
    imgBadge: 'EST. 2026 — LILLO STUDIO MADE',
    features: [
      {
        icon: '01',
        title: 'Solid Brass & Metallic Luster',
        desc: 'Made from solid brass alloy with silver and gold plating that withstands daily wear.',
      },
      {
        icon: '02',
        title: 'Hand-Applied Enamel Color',
        desc: 'Enamel colors applied by hand and coated with scratch-resistant, UV-proof clear resin.',
      },
      {
        icon: '03',
        title: 'High-Strength Braided Lanyard Cord',
        desc: 'High-strength round braided cord with a solid silver clamp ring for extra security.',
      },
    ],
  },
  journal: {
    kicker: 'STORIES & JOURNAL',
    title: 'STORIES BEHIND THE CHARMS.',
    sub: 'Discover how LILLO small accessories accompany their owners through daily journeys.',
  },
  cta: {
    badge: '✨ ELEVATE YOUR EVERYDAY STYLE',
    title: 'READY TO FIND YOUR DREAM CHARM?',
    sub: 'Carry beautiful memories and your unique character everywhere. Own the exclusive LILLO collection made with quality silver & enamel finishes.',
    primaryBtnText: 'SHOP NOW',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'VIEW ALL CHARMS',
    secondaryBtnLink: '/collection',
    features: [
      '🚚 Free Shipping Min. 2 Pcs',
      '✨ Enamel Resin & Platinum Finish',
      '🎁 Gift Box & Original Warranty Card',
    ],
  },
  updatedAt: new Date().toISOString(),
};
