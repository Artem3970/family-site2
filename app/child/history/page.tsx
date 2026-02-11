'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HistoryCompletion {
  _id: string;
  status: string;
  task: { points: number; title: string };
  completedAt?: string;
  approvedAt?: string;
  updatedAt?: string;
}

export default function ChildHistoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [completions, setCompletions] = useState<HistoryCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPoints: 0, approvedTasks: 0 });

  useEffect(() => {
    if (!isLoading && user?.role !== 'child') {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/completions');
        if (res.ok) {
          const data = await res.json();
          // Keep only non-pending completions and ensure task is present
          const childCompletions = data.completions.filter(
            (c: HistoryCompletion) => c.status !== 'pending' && !!c.task
          );
          setCompletions(childCompletions);

          const approved = childCompletions.filter((c: HistoryCompletion) => c.status === 'approved');
          const totalPoints = approved.reduce(
            (sum: number, c: HistoryCompletion) => sum + (c.task?.points ?? 0),
            0
          );
          setStats({
            totalPoints,
            approvedTasks: approved.length,
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  const approvedCompletions = completions.filter((c) => c.status === 'approved');
  const rejectedCompletions = completions.filter((c) => c.status === 'rejected');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📈 Історія завдань</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Всього очків</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-600">{stats.totalPoints}</p>
            <p className="text-sm text-gray-500 mt-2">Заробленої очок</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Завершені завдання</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">{stats.approvedTasks}</p>
            <p className="text-sm text-gray-500 mt-2">Затверджено батьком</p>
          </CardContent>
        </Card>
      </div>

      {approvedCompletions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">✅ Затверджені завдання</h2>
          <div className="grid gap-4">
            {approvedCompletions.map((completion) => (
              <Card key={completion._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{completion.task?.title ?? '—'}</CardTitle>
                      <CardDescription>
                          Затверджено: {completion.approvedAt ? new Date(completion.approvedAt).toLocaleDateString('uk-UA') : ''}
                        </CardDescription>
                    </div>
                    <Badge className="bg-green-600">✅ +{completion.task?.points ?? 0} очків</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {rejectedCompletions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">❌ Відхилені завдання</h2>
          <div className="grid gap-4">
            {rejectedCompletions.map((completion) => (
              <Card key={completion._id} className="opacity-75 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{completion.task?.title ?? '—'}</CardTitle>
                      <CardDescription>
                        Відхилено: {completion.updatedAt ? new Date(completion.updatedAt).toLocaleDateString('uk-UA') : ''}
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">❌ Відхилено</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completions.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Немаєш ще жодного історичного запису. Почни виконувати завдання! 💪
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
