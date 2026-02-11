'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  parent?: { _id: string; name: string };
  dueDate?: string | Date;
}

export default function ChildTasksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'child') {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks?role=child');
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks.filter((t: Task) => t.status === 'active'));
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchTasks();
    }
  }, [user]);

  const handleSubmitTask = async (taskId: string) => {
    setSubmitting(taskId);
    try {
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        alert('Завдання відправлено на затвердження батьку! ✅');
      } else {
        const error = await res.json();
        alert(error.error || 'Помилка при відправці завдання');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Помилка при відправці завдання');
    } finally {
      setSubmitting(null);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">📋 Мої завдання</h1>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Нема активних завдань. Відпочивай! 🎉
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {task.title}
                      <Badge variant="secondary">⏳ Активне</Badge>
                    </CardTitle>
                    <CardDescription>
                      Від батька: {task.parent?.name ?? 'Невідомо'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">{task.description}</p>
                  </div>
                )}

                <div className="flex gap-4 text-sm">
                  <span className="font-semibold">💰 {task.points} очків</span>
                  {task.dueDate && (
                    <span>📅 {new Date(task.dueDate).toLocaleDateString('uk-UA')}</span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleSubmitTask(task._id)}
                  disabled={submitting === task._id}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting === task._id ? 'Відправлення...' : 'Позначити як виконане'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
