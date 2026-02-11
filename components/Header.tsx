'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'parent' | 'child' | null>(null);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('viewMode') : null;
    if (saved === 'parent' || saved === 'child') {
      setViewMode(saved as 'parent' | 'child');
      return;
    }

    if (user?.role) {
      setViewMode(user.role);
    }
  }, [user]);

  const handleLogout = async () => {
    localStorage.removeItem('viewMode');
    await signOut({ redirect: false });
    router.push('/login');
  };

  const toggleViewMode = async () => {
    try {
      if (user?.role === 'parent') {
        const res = await fetch('/api/users/children');
        if (!res.ok) throw new Error('Не вдалося отримати дітей');
        const data = await res.json();
        const firstChild = data.children && data.children[0];
        if (!firstChild) {
          alert('У вас немає доданих дітей, щоб переключитись');
          return;
        }
        router.push(`/login?email=${encodeURIComponent(firstChild.email)}&role=child`);
        return;
      }

      if (user?.role === 'child') {
        const res = await fetch('/api/users/me');
        if (!res.ok) throw new Error('Не вдалося отримати інформацію про користувача');
        const data = await res.json();
        const parent = data.user?.parent;
        if (!parent) {
          alert('Не знайдено батька для цього облікового запису');
          return;
        }
        const parentEmail = parent.email || parent;
        router.push(`/login?email=${encodeURIComponent(parentEmail)}&role=parent`);
        return;
      }

      const newMode = viewMode === 'parent' ? 'child' : 'parent';
      localStorage.setItem('viewMode', newMode);
      setViewMode(newMode);
      router.refresh();
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Сталася помилка при переключенні ролі. Спробуйте пізніше.');
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          Сімейні Завдання
        </Link>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user.name} ({viewMode === 'parent' ? 'Батько' : 'Дитина'})
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleViewMode}
              title="Перемкнути роль"
            >
              🔄
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Вийти
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Вхід
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Реєстрація</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
