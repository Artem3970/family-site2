'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Nav() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const parentLinks = [
    { href: '/dashboard', label: 'Дашборд 📊' },
    { href: '/dashboard/tasks', label: 'Завдання 📋' },
    { href: '/dashboard/rewards', label: 'Призи 🎁' },
    { href: '/dashboard/completions', label: 'Заявки ✅' },
  ];

  const childLinks = [
    { href: '/child', label: 'Мої завдання 📋' },
    { href: '/child/history', label: 'Історія 📈' },
    { href: '/child/rewards', label: 'Призи 🎁' },
  ];

  const links = user.role === 'parent' ? parentLinks : childLinks;

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-4 text-sm font-medium border-b-2 border-transparent hover:border-blue-500 transition-colors'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
