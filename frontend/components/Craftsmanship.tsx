'use client';

import { HomepageContent, DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';

interface CraftsmanshipProps {
  content?: HomepageContent['craftsmanship'];
}

export default function Craftsmanship({ content }: CraftsmanshipProps) {
  const c = content || DEFAULT_HOMEPAGE_CONTENT.craftsmanship;

  if (!c.image) {
    console.warn('[CraftsmanshipSection] No image URL in CMS homepage content — check the API response or the CMS record.');
  }

  return (
    <section id="craftsmanship" className="howmade-section">
      <div id="about" className="anchor-target" style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', pointerEvents: 'none' }}></div>
      <div className="howmade-container">
        {/* Header */}
        <div className="howmade-head">
          <div className="howmade-head-copy">
            <p className="kicker">{c.kicker}</p>
            <h2 className="howmade-title">{c.title}</h2>
          </div>
          <p className="howmade-sub">{c.sub}</p>
        </div>

        {/* Photo left / steps right */}
        <div className="howmade-body">
          <div className="howmade-image">
            {c.image ? (
              <img
                src={c.image}
                alt="LILLO Handcrafted Metal Details"
                loading="lazy"
                onError={() => {
                  console.error('[CraftsmanshipSection] Image failed:', c.image);
                }}
              />
            ) : null}
            <div className="howmade-badge">{c.imgBadge || 'EST. 2026 — BUATAN STUDIO LILLO'}</div>
          </div>

          {/* Process steps */}
          <div className="howmade-steps">
            {(c.features || []).map((feat, idx) => (
              <div key={idx} className="howmade-step">
                <span className="howmade-num">{feat.icon || `0${idx + 1}`}</span>
                <h4>{feat.title}</h4>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
