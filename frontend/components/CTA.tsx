'use client';

import Link from 'next/link';
import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';

interface CTAProps {
  content?: HomepageContent['cta'];
}

const getValidLink = (link?: string, fallback = '/collection') => {
  if (!link || link === '#shop' || link === '/shop' || link === '#wall' || link === '#') return fallback;
  return link;
};

export default function CTA({ content }: CTAProps) {
  const c = content || DEFAULT_HOMEPAGE_CONTENT.cta;

  return (
    <section
      id="cta"
      className="cta-section"
    >
      <div id="contact" className="anchor-target" style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', pointerEvents: 'none' }}></div>
      <div className="cta-ambient-glow"></div>
      <div className="cta-container">
        <div className="cta-card">
          <div className="cta-badge">{c.badge}</div>
          <h2 className="cta-title">{c.title}</h2>
          <p className="cta-sub">
            {c.sub}
          </p>
          <div className="cta-actions">
            <Link href={getValidLink(c.primaryBtnLink, '/collection')} className="btn btn-primary cta-btn">
              <span>{c.primaryBtnText}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link href={getValidLink(c.secondaryBtnLink, '/collection')} className="btn btn-secondary cta-btn-secondary">
              <span>{c.secondaryBtnText}</span>
            </Link>
          </div>

          {/* Value Proposition Badges */}
          <div className="cta-features">
            {(c.features || []).map((feat, idx) => (
              <div key={idx} className="cta-feature-item">
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
