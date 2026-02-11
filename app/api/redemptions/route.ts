import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Redemption } from '@/models/Redemption';
import { Reward } from '@/models/Reward';
import { User } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const redemptionSchema = z.object({
  rewardId: z.string(),
});

export async function GET() {
  try {
    const session = await getServerSession(authConfig) as unknown as { user?: { id?: string; role?: string } } | null;

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const query: Record<string, string> = {};
    const userId = session.user.id;

    if (session.user.role === 'parent') {
      if (userId) query.parent = userId;
    } else if (session.user.role === 'child') {
      if (userId) query.child = userId;
    }

    const redemptions = await Redemption.find(query)
      .populate('reward', 'title pointsCost')
      .populate('child', 'name')
      .populate('parent', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ redemptions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch redemptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as unknown as { user?: { id?: string; role?: string } } | null;

    if (!session?.user || session.user.role !== 'child') {
      return NextResponse.json(
        { error: 'Only children can redeem rewards' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = redemptionSchema.parse(body);

    await connectDB();

    const reward = await Reward.findById(validatedData.rewardId);

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    const child = await User.findById(session.user.id);

    const childPoints = (child?.points ?? 0);
    if (!child || childPoints < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Insufficient points to redeem this reward' },
        { status: 400 }
      );
    }

    const redemption = new Redemption({
      reward: validatedData.rewardId,
      child: session.user.id,
      parent: reward.parent,
      pointsSpent: reward.pointsCost,
    });

    await redemption.save();

    await User.findByIdAndUpdate(
      session.user.id,
      { $inc: { points: -reward.pointsCost } }
    );

    await redemption.populate('reward', 'title pointsCost');
    await redemption.populate('child', 'name');
    await redemption.populate('parent', 'name');

    return NextResponse.json(
      { redemption, message: 'Reward redeemed successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error redeeming reward:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}
