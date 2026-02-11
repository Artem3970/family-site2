import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Reward } from '@/models/Reward';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { z } from 'zod';

const updateRewardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  pointsCost: z.number().int().positive().optional(),
  image: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateRewardSchema.parse(body);

    await connectDB();

    const reward = await Reward.findById(id);

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || reward.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this reward' },
        { status: 403 }
      );
    }

    Object.assign(reward, validatedData);
    await reward.save();
    await reward.populate('parent', 'name');

    return NextResponse.json(
      { reward, message: 'Reward updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating reward:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authConfig);
    const sessionData = session as unknown as { user?: { id?: string; role?: string } } | null;

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const reward = await Reward.findById(id);

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    if (!sessionData?.user?.id || reward.parent.toString() !== sessionData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this reward' },
        { status: 403 }
      );
    }

    await Reward.deleteOne({ _id: id });

    return NextResponse.json(
      { message: 'Reward deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    );
  }
}
