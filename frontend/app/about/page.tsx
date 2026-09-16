'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAboutContent } from '@/lib/api';
import { AboutContent, DEFAULT_ABOUT_CONTENT } from '@/types/about';

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);

  useEffect(() => {
    getAboutContent()
      .then((data) => {
        if (data) setContent(data);
      })
      .catch((err) => {
        console.warn('Failed to fetch dynamic about page content, using defaults:', err);
      });
  }, []);

  const hero = content.hero || DEFAULT_ABOUT_CONTENT.hero;
  const manifesto = content.manifesto || DEFAULT_ABOUT_CONTENT.manifesto;
  const imageBreak = content.imageBreak || DEFAULT_ABOUT_CONTENT.imageBreak;
  const story = content.story || DEFAULT_ABOUT_CONTENT.story;
  const timeline = content.timeline || DEFAULT_ABOUT_CONTENT.timeline;
  const values = content.values || DEFAULT_ABOUT_CONTENT.values;
  const closing = content.closing || DEFAULT_ABOUT_CONTENT.closing;

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      <div className="grain"></div>
      <Cursor />
      <Navbar />

      <main id="content" className="collection-page-main" tabIndex={-1}>
        {/* Hero */}
        <section className="collection-hero-banner">
          <div className="collection-banner-container">
            <span className="collection-small-label">{hero.kicker}</span>
            <h1 className="collection-main-heading">{hero.title}</h1>
            <p className="collection-sub-heading">{hero.sub}</p>
          </div>
        </section>

        {/* Manifesto + stats */}
        <section className="about-manifesto">
          <p className="about-manifesto-text">
            {manifesto.text} <em>{manifesto.highlightText}</em>
          </p>
          <div className="about-stats-row">
            {(manifesto.stats || []).map((st, idx) => (
              <div key={idx} className="about-stat">
                <span className="about-stat-value">{st.value}</span>
                <span className="about-stat-label">{st.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Wide image break */}
        {imageBreak.imageUrl ? (
          <section className="about-image-break">
            <img src={imageBreak.imageUrl} alt={imageBreak.altText || 'LILLO studio stories'} loading="lazy" />
          </section>
        ) : null}

        {/* Craft story */}
        <section className="about-story">
          <div className="about-story-image">
            {story.image ? (
              <img src={story.image} alt="LILLO Handcrafted Details" loading="lazy" />
            ) : null}
            <div className="howmade-badge">{story.imgBadge || 'EST. 2026 — LILLO STUDIO MADE'}</div>
          </div>
          <div className="about-story-copy">
            <p className="kicker">{story.kicker}</p>
            <h2>{story.title}</h2>
            <p>{story.sub}</p>
            <ul className="about-story-points">
              {(story.points || []).map((pt, idx) => (
                <li key={idx}>
                  <strong>{pt.title}</strong>
                  <span>{pt.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Timeline */}
        <section className="about-timeline-section">
          <div className="about-timeline-header">
            <span className="collection-small-label">{timeline.kicker}</span>
            <h2 className="collection-main-heading">{timeline.title}</h2>
          </div>
          <div className="about-timeline">
            {(timeline.items || []).map((t, idx) => (
              <div key={idx} className="about-timeline-item">
                <span className="about-timeline-year">{t.year}</span>
                <div className="about-timeline-body">
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="about-values-section">
          <div className="about-timeline-header">
            <span className="collection-small-label">{values.kicker}</span>
            <h2 className="collection-main-heading">{values.title}</h2>
          </div>
          <div className="about-values-grid">
            {(values.items || []).map((v, idx) => (
              <div key={idx} className="about-value-card">
                <span className="about-value-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Care Guide */}
        <section id="care-guide" className="about-values-section">
          <div className="about-timeline-header">
            <span className="collection-small-label">CARE GUIDE</span>
            <h2 className="collection-main-heading">Keep your charms looking new.</h2>
          </div>
          <div className="about-values-grid care-guide-grid">
            <div className="about-value-card">
              <span className="about-value-icon">✦</span>
              <h3>Wipe gently</h3>
              <p>Clean your charm with a soft dry cloth after use to remove dust, fingerprints, and moisture.</p>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">●</span>
              <h3>Keep it dry</h3>
              <p>Although the resin coating resists water, avoid soaking charms or wearing them while swimming.</p>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">◆</span>
              <h3>Store separately</h3>
              <p>Keep each charm in its own pouch or compartment so metal parts don&apos;t scratch each other.</p>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">♥</span>
              <h3>Avoid chemicals</h3>
              <p>Keep charms away from perfume, alcohol, and cleaning agents to protect the enamel and plating.</p>
            </div>
          </div>
        </section>

        {/* Closing */}
        <section className="about-closing">
          <h2>
            {closing.title} <em>{closing.highlightText}</em>
          </h2>
          <div className="about-closing-actions">
            <Link className="btn btn-primary magnetic" href={closing.primaryBtnLink || '/collection'}>
              {closing.primaryBtnText || 'SHOP COLLECTION'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <Link className="btn-link magnetic" href={closing.secondaryBtnLink || '/contact'}>
              {closing.secondaryBtnText || 'CONTACT US'}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
