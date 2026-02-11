'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTaskStore } from '@/lib/store';

interface Completion {
  _id: string;
  status: string;
  task: { title: string; points: number };
  child: { name: string };
  notes?: string;
  completedAt?: string;
  approvedAt?: string;
  createdAt?: string;
}

export default function CompletionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTasks } = useTaskStore();

  useEffect(() => {
    if (!isLoading && user?.role !== 'parent') {
      router.push('/child');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        const res = await fetch('/api/completions');
        if (res.ok) {
          const data = await res.json();
          setCompletions(data.completions);
        }
      } catch (error) {
        console.error('Error fetching completions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCompletions();
    }
  }, [user?.id]);

  const handleApprove = async (completionId: string) => {
    try {
      const res = await fetch(`/api/completions/${completionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletions(
          completions.map((c) => (c._id === completionId ? data.completion : c))
        );
        try {
          const tasksRes = await fetch('/api/tasks?role=parent');
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setTasks(tasksData.tasks);
          }
        } catch (e) {
          console.error('Failed to refresh tasks after approval', e);
        }
      }
    } catch (error) {
      console.error('Error approving completion:', error);
    }
  };

  const handleReject = async (completionId: string) => {
    try {
      const res = await fetch(`/api/completions/${completionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (res.ok) {
        setCompletions(completions.filter((c) => c._id !== completionId));
        try {
          const tasksRes = await fetch('/api/tasks?role=parent');
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            setTasks(tasksData.tasks);
          }
        } catch (e) {
          console.error('Failed to refresh tasks after rejection', e);
        }
      }
    } catch (error) {
      console.error('Error rejecting completion:', error);
    }
  };

  if (isLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen">Завантаження...</div>;
  }

  const pendingCompletions = completions.filter((c) => c.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Перевірка виконаних завдань</h1>
          <p className="text-muted-foreground">
            Затримуючих завдань: {pendingCompletions.length}
          </p>
        </div>

        {pendingCompletions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Немає затримуючих завдань на перевірку</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingCompletions.map((completion) => (
              <Card key={completion._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{completion.task.title}</h3>
                    <Badge variant="outline">На розгляді</Badge>
                  </div>
                  <CardDescription>Від дитини: {completion.child.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm font-semibold">Очків: {completion.task.points}</p>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(completion._id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Схвалити
                    </Button>
                    <Button
                      onClick={() => handleReject(completion._id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Відхилити
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
