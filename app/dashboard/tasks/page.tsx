'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Child {
  _id: string;
  name: string;
  email: string;
}

interface StoreTask {
  _id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  child: Child | string;
  dueDate?: string | Date;
}

export default function ParentTasksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { tasks, setTasks, deleteTask } = useTaskStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: '10',
    childId: '',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'parent') {
      router.push('/child');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tasksRes = await fetch('/api/tasks?role=parent');
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks);
        }

        const childrenRes = await fetch(`/api/users/children`);
        if (childrenRes.ok) {
          const data = await childrenRes.json();
          setChildren(data.children);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user, setTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/tasks/${editingId}` : '/api/tasks';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          points: parseInt(formData.points),
          childId: formData.childId,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          useTaskStore.getState().updateTask(editingId, data.task);
        } else {
          useTaskStore.getState().addTask(data.task);
        }

        setFormData({ title: '', description: '', points: '10', childId: '', dueDate: '' });
        setEditingId(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Ви впевнені?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        deleteTask(taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEdit = (task: StoreTask) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      points: task.points.toString(),
      childId: typeof task.child === 'string' ? task.child : (task.child?._id ?? ''),
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setEditingId(task._id);
    setShowForm(true);
  };

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
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">📋 Завдання</h1>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Нове завдання
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Редагувати завдання' : 'Створити нове завдання'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дитина</label>
                <select
                  value={formData.childId}
                  onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Виберіть дитину</option>
                  {children.map((child) => (
                    <option key={child._id} value={child._id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Назва завдання</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Напр. Прибрати кімнату"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Опис</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Опис завдання"
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Очки</label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дата закінчення (опційно)</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Збереження...' : 'Зберегти'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ title: '', description: '', points: '10', childId: '', dueDate: '' });
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Нема завдань. Створіть перше завдання для своєї дитини!</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task: StoreTask) => (
            <Card key={task._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {task.title}
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status === 'completed' ? '✅ Виконано' : '⏳ Активне'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Дитина: {typeof task.child === 'string' ? task.child : task.child?.name}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(task)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(task._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {task.description && <p className="text-sm">{task.description}</p>}
                <div className="flex gap-4 text-sm">
                  <span className="font-semibold">💰 {task.points} очків</span>
                  {task.dueDate && (
                    <span>📅 {new Date(task.dueDate).toLocaleDateString('uk-UA')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
