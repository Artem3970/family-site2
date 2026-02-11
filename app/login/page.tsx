 'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Невірна електронна адреса або пароль');
      } else if (result?.ok) {
        const role = searchParams.get('role');
        if (role) {
          try {
            localStorage.setItem('viewMode', role);
          } catch {
          }
        }
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Виникла помилка при вході');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    const prefill = searchParams.get('email') || '';
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вхід в систему</CardTitle>
          <CardDescription>
            Введіть ваші облікові дані для входу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Завантаження...' : 'Увійти'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Немаєте облікового запису?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Зареєструватися
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
