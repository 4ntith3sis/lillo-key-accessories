import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CharmWall from '@/components/CharmWall';
import ProductPreview from '@/components/ProductPreview';
import FeatureBanner from '@/components/FeatureBanner';
import Craftsmanship from '@/components/Craftsmanship';
import Charm2 from '@/components/Charm2';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import { headers } from 'next/headers';
import { getHomepageContent } from '@/lib/api';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';
import { ActiveProductProvider } from '@/context/ActiveProductContext';

export const revalidate = 0; // Dynamic data

export default async function Home() {
  let cmsContent = DEFAULT_HOMEPAGE_CONTENT;

  try {
    // On Vercel the Express API is served on the SAME origin as the Next app
    // (vercel.json rewrites /api/* to the /api/index function). Resolve the
    // SSR API base from the incoming request's Host header instead of relying
    // on env vars (VERCEL_URL/FRONTEND_URL) that may be absent from the
    // serverless function's runtime env. Locally, the host is not
    // *.vercel.app, so the shared getApiBaseUrl() chain is used — which
    // defaults to the production Vercel API (no local backend required).
    const h = await headers();
    const host = h.get('host') ?? '';
    const ssrApiBase = host.endsWith('.vercel.app') ? `https://${host}` : undefined;
    cmsContent = await getHomepageContent(ssrApiBase);
  } catch (err) {
    console.warn('Could not load dynamic CMS content on server, using static default:', err);
  }

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>

      {/* Subtle Film Grain Overlay */}
      <div className="grain"></div>

      {/* Custom Ring Cursor */}
      <Cursor />

      {/* Top Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main id="content" tabIndex={-1}>
        <ActiveProductProvider>
          <Hero content={cmsContent.hero} />
          <CharmWall />
          <ProductPreview categoryHeader={cmsContent.categorySection} />
          {/* Charm 2: fixed overlay, hero-style second charm (no layout impact) */}
          <Charm2 heroImage={cmsContent.hero.heroImage} />
        </ActiveProductProvider>
        <FeatureBanner content={cmsContent.brandStatement} />
        <Craftsmanship content={cmsContent.craftsmanship} />
        <CTA content={cmsContent.cta} />
      </main>

      {/* Site Footer */}
      <Footer />
    </>
  );
}
