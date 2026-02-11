'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/lib/store';

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(status === 'loading');

    if (session?.user) {
      const s = session as unknown as { user?: { id?: string; role?: string; name?: string; email?: string } };
      setUser({
        id: s.user?.id || '',
        name: s.user?.name || '',
        email: s.user?.email || '',
        role: (s.user?.role as 'parent' | 'child') || 'child',
      });
    } else {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    status,
  };
}
