export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutTimelineItem {
  year: string;
  title: string;
  desc: string;
}

export interface AboutValueItem {
  icon: string;
  title: string;
  desc: string;
}

export interface AboutContent {
  hero: {
    kicker: string;
    title: string;
    sub: string;
  };
  manifesto: {
    text: string;
    highlightText: string;
    stats: AboutStat[];
  };
  imageBreak: {
    imageUrl: string;
    altText: string;
  };
  story: {
    kicker: string;
    title: string;
    sub: string;
    image: string;
    imgBadge: string;
    points: {
      title: string;
      desc: string;
    }[];
  };
  timeline: {
    kicker: string;
    title: string;
    items: AboutTimelineItem[];
  };
  values: {
    kicker: string;
    title: string;
    items: AboutValueItem[];
  };
  closing: {
    title: string;
    highlightText: string;
    primaryBtnText: string;
    primaryBtnLink: string;
    secondaryBtnText: string;
    secondaryBtnLink: string;
  };
  updatedAt?: string;
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  hero: {
    kicker: 'ABOUT US',
    title: 'SMALL THINGS, BIG MEANING.',
    sub: 'LILLO is an accessories studio designing unique keychains & charms — small symbols made to carry memories, character, and a little joy wherever you go.',
  },
  manifesto: {
    text: 'We believe the smallest objects often carry',
    highlightText: 'the biggest feelings',
    stats: [
      { value: 'EST. 2026', label: 'Independent studio, Jakarta' },
      { value: '25+', label: 'Unique charms & growing' },
      { value: '100%', label: 'Hand-finished detail' },
      { value: '03', label: 'Signature materials — brass, enamel, resin' },
    ],
  },
  imageBreak: {
    imageUrl: '',
    altText: 'LILLO studio stories',
  },
  story: {
    kicker: 'CRAFTSMANSHIP & PROCESS',
    title: 'MADE WITH HIGH PRECISION.',
    sub: 'Every LILLO charm is made through a meticulous process combining traditional metal craft techniques with modern aesthetics.',
    image: '',
    imgBadge: 'EST. 2026 — LILLO STUDIO MADE',
    points: [
      {
        title: 'Solid Brass & Metallic Luster',
        desc: 'Solid brass alloy with silver and gold plating that withstands daily wear.',
      },
      {
        title: 'Hand-Applied Enamel Color',
        desc: 'Enamel colors applied by hand and coated with scratch-resistant, UV-proof clear resin.',
      },
      {
        title: 'High-Strength Braided Lanyard Cord',
        desc: 'High-strength round braided cord with a solid silver clamp ring.',
      },
    ],
  },
  timeline: {
    kicker: 'OUR JOURNEY',
    title: 'From the workbench to your everyday steps.',
    items: [
      {
        year: '2026 — BEGINNING',
        title: 'A small studio with big meaning',
        desc: 'LILLO started at a workbench in Jakarta with a simple ambition: creating small objects that hold big stories.',
      },
      {
        year: 'DESIGN',
        title: 'Modern symbols of luck',
        desc: 'Every charm begins with a hand sketch — adapting symbols of luck from various cultures into modern accessories.',
      },
      {
        year: 'CRAFTSMANSHIP',
        title: 'Brass, enamel, resin',
        desc: 'Solid brass metal, hand-applied enamel colors, and scratch-resistant resin. Three materials, one standard: precision.',
      },
      {
        year: 'TODAY',
        title: 'Designed to be carried always',
        desc: 'From the charm wall to your keychain — LILLO is designed to accompany you wherever life takes you.',
      },
    ],
  },
  values: {
    kicker: 'VALUES WE HOLD',
    title: 'Our three core principles.',
    items: [
      {
        icon: '✦',
        title: 'Quality over quantity',
        desc: 'Limited production with quality control on every item. No product leaves without a hand inspection.',
      },
      {
        icon: '❤',
        title: 'Stories in miniature',
        desc: 'Every design carries meaning — protection, luck, or beautiful memories you want to keep close.',
      },
      {
        icon: '↻',
        title: 'Take it everywhere',
        desc: 'Lightweight, waterproof, and sturdy for daily use. Unique accessories made to be worn, not stored in a drawer.',
      },
    ],
  },
  closing: {
    title: 'Find the charm that represents',
    highlightText: 'you.',
    primaryBtnText: 'SHOP COLLECTION',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'CONTACT US',
    secondaryBtnLink: '/contact',
  },
  updatedAt: new Date().toISOString(),
};
