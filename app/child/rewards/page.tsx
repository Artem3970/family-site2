'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, AlertCircle } from 'lucide-react';

interface ChildReward {
  _id: string;
  title: string;
  description?: string;
  pointsCost: number;
  parent?: { name?: string; _id?: string } | string | null;
  imageUrl?: string;
}

export default function ChildRewardsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rewards, setRewards] = useState<ChildReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user?.role !== 'child') {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/users/me');
        let parentId: string | null = null;
        if (userRes.ok) {
          const data = await userRes.json();
          setUserPoints(data.user.points || 0);
          const parent = data.user.parent;
          if (parent) {
            parentId = parent._id || parent.id || parent;
          }
        }

        const rewardsUrl = parentId ? `/api/rewards?parentId=${parentId}` : '/api/rewards';
        const rewardsRes = await fetch(rewardsUrl);
        if (rewardsRes.ok) {
          const data = await rewardsRes.json();
          setRewards(data.rewards);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchData();
  }, [user]);

  const handleRedeemReward = async (rewardId: string, pointsCost: number) => {
    if (userPoints < pointsCost) {
      alert('Уміст очків недостатньо для викупу цього призу! 😢');
      return;
    }

    setRedeeming(rewardId);
    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      });

      if (res.ok) {
        setUserPoints(userPoints - pointsCost);
        alert('Приз викупле! Батько затвердить вскоре. ✅');
      } else {
        const error = await res.json();
        alert(error.error || 'Помилка при викупі призу');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Помилка при викупі призу');
    } finally {
      setRedeeming(null);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">🎁 Призи</h1>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Твої очки</p>
                <p className="text-4xl font-bold text-blue-600">{userPoints} 💰</p>
              </div>
              <Gift className="w-16 h-16 text-blue-300 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Батько ще не створив нема призів. 😢
              </p>
            </CardContent>
          </Card>
        ) : (
          rewards.map((reward) => {
            const canRedeem = userPoints >= reward.pointsCost;

            return (
              <Card
                key={reward._id}
                className={`hover:shadow-lg transition-shadow ${
                  !canRedeem ? 'opacity-60' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{reward.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {typeof reward.parent === 'string' ? reward.parent : reward.parent?.name}
                      </CardDescription>
                    </div>
                    <Badge className="bg-yellow-500 text-white whitespace-nowrap">
                      {reward.pointsCost} очків
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
{reward.imageUrl && (
                  <Image
                    src={reward.imageUrl}
                    alt={reward.title}
                    width={800}
                    height={320}
                    className="w-full h-40 object-cover rounded"
                  />
                  )}

                  {reward.description && (
                    <p className="text-sm">{reward.description}</p>
                  )}

                  {!canRedeem && (
                    <div className="flex gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Потрібно ще {reward.pointsCost - userPoints} очків</span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleRedeemReward(reward._id, reward.pointsCost)}
                    disabled={!canRedeem || redeeming === reward._id}
                  >
                    {redeeming === reward._id
                      ? 'Викупу...'
                      : canRedeem
                      ? 'Викупити приз'
                      : 'Недостатньо очків'}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
