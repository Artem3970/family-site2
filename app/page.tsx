'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      const role = (session as unknown as { user?: { role?: string } }).user?.role;
      if (role === 'parent') {
        router.push('/dashboard');
      } else if (role === 'child') {
        router.push('/child');
      }
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Завантаження...</p>
      </div>
    </div>
  );
}
