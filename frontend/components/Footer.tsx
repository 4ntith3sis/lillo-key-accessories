'use client';

import Link from 'next/link';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Grid Row */}
        <div className="footer-main-grid">
          {/* Brand & Newsletter Column */}
          <div className="footer-brand-col">
            <Link className="footer-logo" href="/">
              LILLO<span className="dot">.</span>
            </Link>
            <p className="footer-tagline">
              Gantungan kunci & charm penuh makna untuk menemani harimu dengan karakter dan keceriaan.
            </p>
            <div className="newsletter-block">
              <p className="newsletter-label">BERGABUNGLAH DENGAN KAMI UNTUK RILIS EKSKLUSIF</p>
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Terima kasih telah berlangganan LILLO!');
                }}
              >
                <input
                  type="email"
                  placeholder="Masukkan email kamu"
                  required
                  aria-label="Masukkan email kamu untuk buletin"
                />
                <button type="submit" aria-label="Subscribe">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </form>
            </div>

            {/* Social Links Row */}
            <div className="footer-social-row">
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="social-icon" aria-label="TikTok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
              </a>
              <a href="#" className="social-icon" aria-label="Pinterest">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.14 2.53 7.69 6.09 9.17-.08-.78-.16-1.98.03-2.83.17-.76 1.13-4.8 1.13-4.8s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.37 0 .84-.53 2.09-.81 3.25-.23.97.49 1.76 1.45 1.76 1.74 0 3.08-1.83 3.08-4.48 0-2.34-1.68-3.98-4.09-3.98-2.79 0-4.43 2.09-4.43 4.25 0 .84.32 1.74.73 2.23.08.1.09.19.07.29-.07.31-.24 .98-.28 1.11-.05.21-.18.25-.41.15-1.53-.71-2.48-2.94-2.48-4.73 0-3.85 2.8-7.39 8.07-7.39 4.24 0 7.54 3.02 7.54 7.07 0 4.21-2.66 7.6-6.35 7.6-1.24 0-2.41-.65-2.81-1.41l-.76 2.91c-.28 1.07-1.03 2.41-1.54 3.23C9.69 21.84 10.82 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"></path></svg>
              </a>
              <a href="#" className="social-icon" aria-label="Twitter X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>

          {/* Navigation Links Grid */}
          <div className="footer-links-grid">
            <div className="footer-nav-col">
              <h4 className="footer-col-title">KOLEKSI</h4>
              <ul className="footer-nav-list">
                <li><Link href="/collection">Semua Gantungan Kunci</Link></li>
                <li><Link href="/collection">Token Keberuntungan</Link></li>
                <li><Link href="/collection">Charm Hewan</Link></li>
                <li><Link href="/collection">Seri Mitos</Link></li>
                <li><Link href="/collection">Edisi Studio</Link></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-col-title">JELAJAHI</h4>
              <ul className="footer-nav-list">
                <li><Link href="/">Beranda</Link></li>
                <li><Link href="/about">Cerita Kami</Link></li>
                <li><Link href="/collection">Koleksi Charm</Link></li>
                <li><Link href="/about">Kerajinan</Link></li>
              </ul>
            </div>

            <div className="footer-nav-col">
              <h4 className="footer-col-title">BANTUAN</h4>
              <ul className="footer-nav-list">
                <li><Link href="/contact">Hubungi Kami</Link></li>
                <li><Link href="/contact">Informasi Pengiriman</Link></li>
                <li><Link href="/contact">Panduan Perawatan</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copy">&copy; 2026 LILLO. Hak cipta dilindungi undang-undang. Dibuat dengan presisi tinggi untuk para kolektor.</p>
          <div className="footer-bottom-actions">
            <button type="button" className="back-to-top-btn" onClick={scrollToTop}>
              <span>KEMBALI KE ATAS</span>
              <span className="arrow">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
