import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Reward } from '@/models/Reward';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const rewardSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  pointsCost: z.number().int().positive(),
  image: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user: { id: string; role: string } } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = _request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    const query: Record<string, string> = { status: 'active' };

    if (parentId) {
      query.parent = parentId;
    } else if (sessionData!.user.role === 'parent') {
      query.parent = sessionData!.user.id;
    }

    const rewards = await Reward.find(query)
      .populate('parent', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ rewards }, { status: 200 });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user: { id: string; role: string } } | null;

    if (!sessionData?.user || sessionData.user.role !== 'parent') {
      return NextResponse.json(
        { error: 'Only parents can create rewards' },
        { status: 403 }
      );
    }

    const body = await _request.json();
    const validatedData = rewardSchema.parse(body);

    await connectDB();

    const reward = new Reward({
      ...validatedData,
      parent: sessionData!.user.id,
    });

    await reward.save();
    await reward.populate('parent', 'name');

    return NextResponse.json(
      { reward, message: 'Reward created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reward:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}
