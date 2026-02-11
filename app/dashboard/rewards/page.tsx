'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRewardStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface RewardType {
  _id?: string;
  title: string;
  description: string;
  pointsCost: number;
  status: string;
  imageUrl?: string;
  image?: string;
  parent?: string;
}

export default function ParentRewardsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { rewards, setRewards, deleteReward } = useRewardStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: '50',
    image: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.role !== 'parent') {
      router.push('/child');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch('/api/rewards');
        if (res.ok) {
          const data = await res.json();
          setRewards(data.rewards);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      }
    };

    if (user?.id) {
      fetchRewards();
    }
  }, [user, setRewards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/rewards/${editingId}` : '/api/rewards';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          pointsCost: parseInt(formData.pointsCost),
          image: formData.image,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingId) {
          useRewardStore.getState().updateReward(editingId, data.reward);
        } else {
          useRewardStore.getState().addReward(data.reward);
        }

        setFormData({ title: '', description: '', pointsCost: '50', image: '' });
        setEditingId(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Ви впевнені?')) return;

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        deleteReward(rewardId);
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const handleEdit = (reward: RewardType) => {
    setFormData({
      title: reward.title,
      description: reward.description || '',
      pointsCost: reward.pointsCost.toString(),
      image: reward.image || '',
    });
    setEditingId(reward._id ? reward._id : null);
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
        <h1 className="text-3xl font-bold">🎁 Призи</h1>
        <Button onClick={() => setShowForm(!showForm)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Новий приз
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Редагувати приз' : 'Создати новий приз'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Назва призу</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Напр. Піца в піцерії"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Опис</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Опис призу"
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Вартість у очках</label>
                <Input
                  type="number"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Посилання на зображення (опційно)</label>
                <Input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
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
                    setFormData({ title: '', description: '', pointsCost: '50', image: '' });
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Нема призів. Создайте перший приз!</p>
            </CardContent>
          </Card>
        ) : (
          rewards.map((reward) => (
            <Card key={reward._id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <CardDescription className="text-sm mt-2">
                      💰 {reward.pointsCost} очків
                    </CardDescription>
                  </div>
                  <Badge variant={reward.status === 'active' ? 'default' : 'secondary'}>
                    {reward.status === 'active' ? 'Активний' : 'Неактивний'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {reward.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={reward.imageUrl}
                    alt={reward.title}
                    className="w-full h-40 object-cover rounded"
                  />
                )}
                {reward.description && <p className="text-sm">{reward.description}</p>}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(reward)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(reward._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
