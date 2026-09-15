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
    kicker: 'TENTANG KAMI',
    title: 'HAL KECIL, MAKNA BESAR.',
    sub: 'LILLO adalah studio aksesoris yang merancang gantungan kunci & charm unik — simbol kecil yang dibuat untuk membawa kenangan, karakter, dan sedikit keceriaan ke mana pun kamu pergi.',
  },
  manifesto: {
    text: 'Kami percaya objek terkecil sering kali menyimpan',
    highlightText: 'perasaan terbesar',
    stats: [
      { value: 'EST. 2026', label: 'Studio independen, Jakarta' },
      { value: '25+', label: 'Charm unik & terus bertambah' },
      { value: '100%', label: 'Detail sentuhan tangan' },
      { value: '03', label: 'Material unggulan — kuningan, enamel, resin' },
    ],
  },
  imageBreak: {
    imageUrl: '',
    altText: 'Cerita studio LILLO',
  },
  story: {
    kicker: 'KERAJINAN & PROSES',
    title: 'DIBUAT DENGAN PRESISI TINGGI.',
    sub: 'Setiap charm LILLO dibuat melalui proses teliti yang memadukan teknik kerajinan logam tradisional dengan estetika modern.',
    image: '',
    imgBadge: 'EST. 2026 — BUATAN STUDIO LILLO',
    points: [
      {
        title: 'Kuningan Solid & Kilau Logam',
        desc: 'Paduan kuningan solid dengan lapisan perak dan emas yang tahan terhadap pemakaian harian.',
      },
      {
        title: 'Pigmen Warna Enamel Tangan',
        desc: 'Warna enamel dioleskan secara manual dan dilapisi resin bening anti-gores & tahan sinar UV.',
      },
      {
        title: 'Tali Lanyard Anyam Tahan Tarik',
        desc: 'Tali anyam bulat berkekuatan tinggi dengan cincin klem perak solid.',
      },
    ],
  },
  timeline: {
    kicker: 'PERJALANAN KAMI',
    title: 'Dari meja kerja hingga menemani langkahmu.',
    items: [
      {
        year: '2026 — AWAL',
        title: 'Studio kecil dengan makna besar',
        desc: 'LILLO dimulai dari sebuah meja kerja di Jakarta dengan ambisi sederhana: menciptakan objek kecil yang menyimpan cerita besar.',
      },
      {
        year: 'DESAIN',
        title: 'Simbol keberuntungan modern',
        desc: 'Setiap charm diawali dengan sketsa tangan — mengadaptasi simbol keberuntungan dari berbagai budaya menjadi aksesoris modern.',
      },
      {
        year: 'KERAJINAN',
        title: 'Kuningan, enamel, resin',
        desc: 'Logam kuningan solid, warna enamel buatan tangan, dan resin anti-gores. Tiga material, satu standar: presisi.',
      },
      {
        year: 'HARI INI',
        title: 'Dirancang untuk selalu dibawa',
        desc: 'Dari papan charm hingga gantungan kuncimu — LILLO dirancang untuk selalu menemani ke mana pun perjalanan hidup membawamu.',
      },
    ],
  },
  values: {
    kicker: 'NILAI YANG KAMI PEGANG',
    title: 'Tiga prinsip utama kami.',
    items: [
      {
        icon: '✦',
        title: 'Kualitas di atas kuantitas',
        desc: 'Produksi terbatas dengan kontrol kualitas tiap item. Tidak ada produk yang keluar tanpa inspeksi tangan.',
      },
      {
        icon: '❤',
        title: 'Cerita dalam miniatur',
        desc: 'Setiap desain membawa makna — perlindungan, keberuntungan, atau kenangan indah yang ingin kamu simpan dekat.',
      },
      {
        icon: '↻',
        title: 'Bawa ke mana saja',
        desc: 'Ringan, tahan air, dan kokoh untuk pemakaian harian. Aksesoris unik yang dibuat untuk dipakai, bukan disimpan di laci.',
      },
    ],
  },
  closing: {
    title: 'Temukan charm yang mewakili',
    highlightText: 'dirimu.',
    primaryBtnText: 'BELANJA KOLEKSI',
    primaryBtnLink: '/collection',
    secondaryBtnText: 'HUBUNGI KAMI',
    secondaryBtnLink: '/contact',
  },
  updatedAt: new Date().toISOString(),
};
