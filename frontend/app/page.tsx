import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CharmWall from '@/components/CharmWall';
import ProductPreview from '@/components/ProductPreview';
import FeatureBanner from '@/components/FeatureBanner';
import Craftsmanship from '@/components/Craftsmanship';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import { getHomepageContent } from '@/lib/api';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/types/homepage';
import { ActiveProductProvider } from '@/context/ActiveProductContext';

export const revalidate = 0; // Dynamic data

export default async function Home() {
  let cmsContent = DEFAULT_HOMEPAGE_CONTENT;

  try {
    cmsContent = await getHomepageContent();
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
