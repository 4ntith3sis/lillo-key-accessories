'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await login(email.trim(), password);
      setStatus('success');
      router.push('/admin');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err?.message || 'Invalid email or password.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F6F0',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(224, 106, 88, 0.09) 0%, transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-sans)',
      color: '#181818',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#FFFFFF',
        border: '1px solid rgba(24, 24, 24, 0.08)',
        borderRadius: '24px',
        padding: '40px 32px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontWeight: 800,
            fontSize: '1.9rem',
            letterSpacing: '-0.01em',
            color: '#181818',
            marginBottom: '8px',
          }}>
            LILLO<span style={{ color: '#E06A58' }}>.</span>{' '}
            <span style={{
              background: 'rgba(224, 106, 88, 0.1)',
              border: '1px solid rgba(224, 106, 88, 0.35)',
              color: '#E06A58',
              fontSize: '0.62rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '100px',
              verticalAlign: 'middle',
              letterSpacing: '0.12em',
            }}>ADMIN</span>
          </div>
          <p style={{ color: '#5C5C5C', fontSize: '0.88rem' }}>
            Log in to access the Admin Dashboard
          </p>
        </div>

        {status === 'error' && errorMessage && (
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            background: 'rgba(212, 61, 51, 0.08)',
            border: '1px solid rgba(212, 61, 51, 0.3)',
            color: '#d43d33',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '12px',
            padding: '10px 14px',
          }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <label className="contact-field">
            <span>Email Address *</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lillo.com"
              required
              disabled={status === 'loading'}
            />
          </label>

          <label className="contact-field">
            <span>Password *</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={status === 'loading'}
            />
          </label>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' ? 0.7 : 1,
              border: 'none',
              marginTop: '6px',
            }}
          >
            {status === 'loading' ? 'AUTHENTICATING...' : 'LOGIN ADMIN'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              color: '#5C5C5C',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(24,24,24,0.25)',
              paddingBottom: '2px',
            }}
          >
            ← Back to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
}
