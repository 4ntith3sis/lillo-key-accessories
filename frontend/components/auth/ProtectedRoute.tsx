'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      const status = await getCurrentUser();
      if (!isMounted) return;

      if (!status.authenticated) {
        setAuthenticated(false);
        setLoading(false);
        router.push('/admin/login');
      } else {
        setAuthenticated(true);
        setLoading(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8F6F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5C5C5C',
        fontFamily: 'var(--font-sans)',
        fontSize: '0.9rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        Verifying Security Access...
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
