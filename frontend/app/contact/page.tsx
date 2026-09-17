'use client';

import { useState } from 'react';
import Cursor from '@/components/Cursor';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

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
            <span className="collection-small-label">GET IN TOUCH</span>
            <h1 className="collection-main-heading">CONTACT US</h1>
            <p className="collection-sub-heading">
              Have a question about collections, orders, or collaboration? Send a message —
              the LILLO team will respond within 24 hours on business days.
            </p>
          </div>
        </section>

        {/* Contact grid */}
        <section className="contact-section">
          <div className="contact-container">
            {/* Info cards */}
            <div className="contact-info-col">
              <div className="contact-card">
                <div className="feature-icon">@</div>
                <div className="feature-text">
                  <h4>Email</h4>
                  <p>hello@lillo.id</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="feature-icon">◷</div>
                <div className="feature-text">
                  <h4>Operating Hours</h4>
                  <p>Monday – Saturday, 09.00 – 18.00 WIB</p>
                </div>
              </div>
              <div className="contact-card">
                <div className="feature-icon">✦</div>
                <div className="feature-text">
                  <h4>Studio</h4>
                  <p>Jakarta, Indonesia — shipping worldwide</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="contact-form-col">
              {sent ? (
                <div className="contact-success-box">
                  <div className="banner-tag-pill">✨ MESSAGE SENT</div>
                  <h3>Thank you, {name || 'LILLO friend'}!</h3>
                  <p>Your message has been received. Please check <b>{email}</b> for our reply.</p>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <label className="contact-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </label>
                  <label className="contact-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      required
                    />
                  </label>
                  <label className="contact-field">
                    <span>Message</span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write your message here…"
                      rows={5}
                      required
                    />
                  </label>
                  <button type="submit" className="btn btn-primary magnetic">
                    SEND MESSAGE
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
