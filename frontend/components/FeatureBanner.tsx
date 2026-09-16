import Link from 'next/link';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';

interface FeatureBannerProps {
  content?: HomepageContent['brandStatement'];
}

const getValidLink = (link?: string, fallback = '/collection') => {
  if (!link || link === '#shop' || link === '/shop' || link === '#wall' || link === '#') return fallback;
  return link;
};

export default function FeatureBanner({ content }: FeatureBannerProps) {
  const c = content || DEFAULT_HOMEPAGE_CONTENT.brandStatement;

  return (
    <section id="banner" className="why-section">
      <div className="why-panel">
        <span className="why-badge">{c.badge}</span>

        <div className="banner-tag-pill why-pill">{(c.pill || '').replace(/^[✨✦⭐⭑＊*\s]+/u, '')}</div>
        <h2 className="why-title">{c.title}</h2>
        <p className="why-sub">{c.sub}</p>

        <div className="why-specs">
          {(c.specs || []).map((spec, i) => (
            <div key={i} className="why-spec">
              <span className="why-num">0{i + 1}</span>
              <span className="why-spec-text">{spec}</span>
            </div>
          ))}
        </div>

        <div className="why-cta">
          <Link className="btn btn-primary magnetic" href={getValidLink(c.buttonLink, '/collection')}>
            {c.buttonText}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link className="btn-link magnetic" href="/collection">
            EXPLORE THE COLLECTION
          </Link>
        </div>
      </div>
    </section>
  );
}
