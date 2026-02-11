'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (!isLoading && isAuthenticated && user?.role !== 'parent') {
      router.push('/child');
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Добро пожалувати, {user?.name}! 👋</h1>
        <p className="text-gray-600">Ви зареєстровані як батько. Керуйте завданнями та призами для своїх дітей.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📋 Завдання</CardTitle>
            <CardDescription>Створюйте та керуйте завданнями</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/tasks">
              <Button className="w-full">Перейти</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🎁 Призи</CardTitle>
            <CardDescription>Додавайте призи для дітей</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/rewards">
              <Button className="w-full">Перейти</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">✅ Заявки</CardTitle>
            <CardDescription>Переглядайте заявки на виконання</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/completions">
              <Button className="w-full">Перейти</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
