'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isBounce, setIsBounce] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const isHomePage = pathname === '/';
  const isCollectionPage = pathname === '/collection';
  const isCartPage = pathname === '/cart';
  const isAboutPage = pathname === '/about';
  const isContactPage = pathname === '/contact';

  // Trigger bounce animation whenever cart totalItems changes
  useEffect(() => {
    if (totalItems > 0) {
      setIsBounce(true);
      const timer = setTimeout(() => setIsBounce(false), 450);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  // Handle keydown for Escape key closing mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      if (isCollectionPage) setActiveSection('collections');
      else if (isCartPage) setActiveSection('cart');
      else if (isAboutPage) setActiveSection('about');
      else if (isContactPage) setActiveSection('contact');
      else setActiveSection('');
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const navHeight = 86;
      const scrollPos = window.scrollY + navHeight + 60;

      const sections = [
        { id: 'about', altId: 'craftsmanship' },
        { id: 'contact', altId: 'cta' },
      ];

      let current = 'home';
      for (const sec of sections) {
        const el = document.getElementById(sec.id) || document.getElementById(sec.altId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = sec.id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage, isCollectionPage, isCartPage, isAboutPage, isContactPage]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetRoute: string) => {
    setIsMobileMenuOpen(false);

    if (targetRoute === '/' || targetRoute === '#home' || targetRoute === '#') {
      if (!isHomePage) {
        // Not on homepage, navigate to homepage
        return; // Allow standard Link navigation to '/'
      } else {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setActiveSection('home');
        return;
      }
    }

    if (targetRoute.startsWith('/')) {
      return; // Standard Link navigation
    }

    if (targetRoute.startsWith('#')) {
      if (!isHomePage) {
        return; // Link href is set to `/${targetRoute}` so Next.js handles navigation
      }
      const targetEl = document.querySelector(targetRoute);
      if (targetEl) {
        e.preventDefault();
        const navHeight = 86;
        const targetOffset = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 24;
        window.scrollTo({ top: Math.max(0, targetOffset), behavior: 'smooth' });
        setActiveSection(targetRoute.replace('#', ''));
      }
    }
  };

  return (
    <>
      <nav className={isScrolled ? 'scrolled' : ''}>
        {/* Left: Logo */}
        <Link className="wordmark" href="/" onClick={(e) => handleNavClick(e, '/')}>
          LILLO<span className="dot">.</span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="nav-center">
          <Link
            className={`nav-link ${isHomePage && activeSection === 'home' ? 'active' : ''}`}
            href="/"
            onClick={(e) => handleNavClick(e, '/')}
          >
            Home
          </Link>
          <Link
            className={`nav-link ${isCollectionPage ? 'active' : ''}`}
            href="/collection"
            onClick={(e) => handleNavClick(e, '/collection')}
          >
            Collection
          </Link>
          <Link
            className={`nav-link ${isAboutPage || (isHomePage && activeSection === 'about') ? 'active' : ''}`}
            href="/about"
            onClick={(e) => handleNavClick(e, '/about')}
          >
            About
          </Link>
          <Link
            className={`nav-link ${isContactPage || (isHomePage && activeSection === 'contact') ? 'active' : ''}`}
            href="/contact"
            onClick={(e) => handleNavClick(e, '/contact')}
          >
            Contact
          </Link>
        </div>

        {/* Right: Actions (Cart & Mobile Hamburger Toggle) */}
        <div className="nav-right" id="navRight">
          <Link
            className={`nav-action cart-link ${isCartPage ? 'active' : ''}`}
            href="/cart"
            aria-label="Shopping Cart"
            onClick={(e) => handleNavClick(e, '/cart')}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="cart-icon"
              aria-hidden="true"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span>Cart</span>
            <span className={`cart-count ${isBounce ? 'badge-bounce' : ''}`}>({totalItems})</span>
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay open">
          <div className="mobile-menu-content">
            <Link
              className={`mobile-nav-link ${isHomePage && activeSection === 'home' ? 'active' : ''}`}
              href="/"
              onClick={(e) => handleNavClick(e, '/')}
            >
              Home
            </Link>
            <Link
              className={`mobile-nav-link ${isCollectionPage ? 'active' : ''}`}
              href="/collection"
              onClick={(e) => handleNavClick(e, '/collection')}
            >
              Collection
            </Link>
            <Link
              className={`mobile-nav-link ${isAboutPage || (isHomePage && activeSection === 'about') ? 'active' : ''}`}
              href="/about"
              onClick={(e) => handleNavClick(e, '/about')}
            >
              About
            </Link>
            <Link
              className={`mobile-nav-link ${isContactPage || (isHomePage && activeSection === 'contact') ? 'active' : ''}`}
              href="/contact"
              onClick={(e) => handleNavClick(e, '/contact')}
            >
              Contact
            </Link>
            <Link
              className={`mobile-nav-link ${isCartPage ? 'active' : ''}`}
              href="/cart"
              onClick={(e) => handleNavClick(e, '/cart')}
            >
              Cart ({totalItems})
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
